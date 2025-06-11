import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-localisation',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  standalone: true,
  templateUrl: './localisation.component.html',
  styleUrl: './localisation.component.css'
})
export class LocalisationComponent {

  private fb = inject(FormBuilder);
  private firestore = inject(Firestore);
  title_window = '';

  searchForm: FormGroup;
  editForm: FormGroup;

  isSubmitting = false;
  submitSuccess = false;
  isSearching = false;
  submitError: string | null = null;
  searchResults: any[] = [];
  searchError: string | null = null;

  isEditing = false;
  isUpdating = false;
  updateSuccess = false;
  updateError: string | null = null;
  selectedLocalisationId: string | null = null;
  showForm = false;

  constructor() {
    // Formulaire de recherche pour les localisations
    this.searchForm = this.fb.group({
      searchTerm: ['', [Validators.required]],
      searchType: ['libelle_localisation', [Validators.required]] // Par défaut recherche par libellé
    });

    // Formulaire d'édition/ajout de localisation
    this.editForm = this.fb.group({
      libelle_localisation: ['', [Validators.required]]
    });
  }

  async searchLocalisation() {
    if (this.searchForm.valid) {
      this.isSearching = true;
      this.searchError = null;
      this.searchResults = [];

      try {
        const searchTerm = this.searchForm.value.searchTerm.trim();
        const searchType = this.searchForm.value.searchType;

        const LocalisationCollection = collection(this.firestore, 'localisation');
        let q;

        // Pour les recherches par libellé
        if (searchType === 'libelle_localisation') {
          q = query(LocalisationCollection, orderBy(searchType));
        } else {
          // Fallback : récupérer tout par défaut
          q = query(LocalisationCollection, orderBy('libelle_localisation'));
        }

        const querySnapshot = await getDocs(q);
        const tempResults: any[] = [];

        querySnapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          tempResults.push(data);
        });

        // Filtrage côté client (insensible à la casse)
        if (searchType === 'libelle_localisation') {
          this.searchResults = tempResults.filter((Localisation) =>
            Localisation[searchType] && Localisation[searchType].toLowerCase().includes(searchTerm.toLowerCase())
          );
        } else {
          this.searchResults = tempResults;
        }

        if (this.searchResults.length === 0) {
          this.searchError = 'Aucune localisation trouvée avec ces critères';
        }

      } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        this.searchError = 'Une erreur est survenue lors de la recherche: ' + (error as Error).message;
      } finally {
        this.isSearching = false;
      }
    }
  }

  async searchAllLocalisation() {
    this.isSearching = true;
    this.searchError = null;
    this.searchResults = [];

    try {
      const LocalisationCollection = collection(this.firestore, 'localisation');
      const q = query(LocalisationCollection, orderBy('libelle_localisation', 'asc'));

      const querySnapshot = await getDocs(q);
      this.searchResults = [];

      querySnapshot.forEach((doc) => {
        this.searchResults.push({
          id: doc.id,
          ...doc.data()
        });
      });
    } catch (error) {
      console.error('Erreur lors du chargement des localisations:', error);
      this.searchError = 'Une erreur est survenue lors du chargement des localisations';
    } finally {
      this.isSearching = false;
    }
  }

  clearSearch() {
    this.searchForm.reset({
      searchTerm: '',
      searchType: 'libelle_localisation'
    });
    this.searchResults = [];
    this.searchError = null;
  }

  getSearchPlaceholder(): string {
    const searchType = this.searchForm.get('searchType')?.value;
    switch (searchType) {
      case 'libelle_localisation': return 'Ex: Placard, Étagère, Sous-sol...';
      default: return 'Entrez votre recherche';
    }
  }

  showAddForm() {
    this.title_window = 'Ajouter une localisation';
    this.showForm = true;
    this.isEditing = false;
    this.selectedLocalisationId = null;
    this.submitSuccess = false;
    this.submitError = null;
    this.updateSuccess = false;
    this.updateError = null;
    
    this.editForm.reset({
      libelle_localisation: ''
    });

    setTimeout(() => {
      document.querySelector('.edit-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  async onAdd() {
    if (this.editForm.valid) {
      this.isSubmitting = true;
      this.submitSuccess = false;
      this.submitError = null;

      try {
        const formValue = this.editForm.value;

        const LocalisationData = {
          libelle_localisation: formValue.libelle_localisation.trim(),
        };

        const LocalisationCollection = collection(this.firestore, 'localisation');
        await addDoc(LocalisationCollection, LocalisationData);

        this.submitSuccess = true;
        this.editForm.reset({
          libelle_localisation: ''
        });

        if (this.searchResults.length > 0) {
          await this.searchAllLocalisation();
        }

      } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error);
        this.submitError = 'Une erreur est survenue lors de l\'enregistrement';
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  editLocalisation(Localisation: any) {
    this.title_window = 'Édition de la localisation';
    this.showForm = true;
    this.isEditing = true;
    this.selectedLocalisationId = Localisation.id;
    this.updateSuccess = false;
    this.updateError = null;

    this.editForm.patchValue({
      libelle_localisation: Localisation.libelle_localisation
    });

    setTimeout(() => {
      document.querySelector('.edit-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  async deleteLocalisation(LocalisationId: string) {
    if (confirm('Voulez-vous vraiment supprimer cette localisation ?')) {
      try {
        const docRef = doc(this.firestore, 'localisation', LocalisationId);
        await deleteDoc(docRef);

        if (this.searchResults.length > 0) {
          await this.searchAllLocalisation();
        }

        alert('Localisation supprimée avec succès.');

      } catch (error) {
        console.error('Erreur lors de la suppression :', error);
        alert('Une erreur est survenue lors de la suppression de la localisation.');
      }
    }
  }

  cancelEdit() {
    this.showForm = false;
    this.isEditing = false;
    this.selectedLocalisationId = null;
    this.editForm.reset();
    this.updateSuccess = false;
    this.updateError = null;
  }

  async onUpdateSubmit() {
    console.log('ID de la localisation sélectionnée :', this.selectedLocalisationId);
    if (this.selectedLocalisationId === '' || this.selectedLocalisationId === null) {
      this.onAdd();
    } else {
      this.onUpdate();
    }
  }

  async onUpdate() {
    if (this.editForm.valid && this.selectedLocalisationId) {
      this.isUpdating = true;
      this.updateSuccess = false;
      this.updateError = null;

      try {
        const formValue = this.editForm.value;

        const LocalisationData = {
          libelle_localisation: formValue.libelle_localisation.trim(),
        };

        const docRef = doc(this.firestore, 'localisation', this.selectedLocalisationId);
        await updateDoc(docRef, LocalisationData);

        this.updateSuccess = true;
        this.showForm = false;
        this.isEditing = false;
        this.editForm.reset();
        await this.searchAllLocalisation();

      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        this.updateError = 'Une erreur est survenue lors de la mise à jour';
      } finally {
        this.isUpdating = false;
      }
    }
  }

  // Méthode utilitaire pour récupérer toutes les localisations
  async getAllLocalisations(): Promise<any[]> {
    try {
      const LocalisationCollection = collection(this.firestore, 'localisation');
      const q = query(
        LocalisationCollection, 
        orderBy('libelle_localisation', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const localisations: any[] = [];

      querySnapshot.forEach((doc) => {
        localisations.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return localisations;
    } catch (error) {
      console.error('Erreur lors de la récupération des localisations:', error);
      return [];
    }
  }

  // Méthode pour récupérer une localisation par son ID
  async getLocalisationById(LocalisationId: string): Promise<any | null> {
    try {
      const LocalisationCollection = collection(this.firestore, 'localisation');
      const q = query(LocalisationCollection, where('__name__', '==', LocalisationId));
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de la localisation:', error);
      return null;
    }
  }

  // Méthode pour ajouter une localisation via alert (comme demandé)
  async addLocalisationViaPrompt(): Promise<string | null> {
    const newLocalisation = prompt('Entrez le nom de la nouvelle localisation :');
    if (newLocalisation && newLocalisation.trim() !== '') {
      try {
        const localisationId = await this.getOrCreateLocalisation(newLocalisation.trim());
        alert(`Localisation "${newLocalisation}" ajoutée avec succès.`);
        return localisationId;
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la localisation via alert :', error);
        alert('Erreur lors de l\'ajout de la localisation.');
        return null;
      }
    }
    return null;
  }

  // Méthode pour créer ou récupérer une localisation
  async getOrCreateLocalisation(libelle: string): Promise<string> {
    try {
      const localisationCollection = collection(this.firestore, 'localisation');
      const q = query(
        localisationCollection,
        where('libelle_localisation', '==', libelle)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const localisationDoc = querySnapshot.docs[0];
        const localisationId = localisationDoc.id;

        const localisationData = localisationDoc.data();
        if (!localisationData['id']) {
          await updateDoc(doc(this.firestore, 'localisation', localisationId), {
            id: localisationId
          });
        }

        return localisationId;
      } else {
        const nouvelleLocalisationData = {
          libelle_localisation: libelle,
        };

        const docRef = await addDoc(localisationCollection, nouvelleLocalisationData);

        await updateDoc(docRef, {
          id: docRef.id
        });

        return docRef.id;
      }
    } catch (error) {
      console.error('Erreur lors de la création/récupération de la localisation:', error);
      throw error;
    }
  }
}
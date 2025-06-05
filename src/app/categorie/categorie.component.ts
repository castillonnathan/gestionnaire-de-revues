import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-categorie',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  standalone: true,
  templateUrl: './categorie.component.html',
  styleUrl: './categorie.component.css'
})
export class CategorieComponent {

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
  selectedCategorieId: string | null = null;
  showForm = false;

  constructor() {
    // Formulaire de recherche pour les catégories
    this.searchForm = this.fb.group({
      searchTerm: ['', [Validators.required]],
      searchType: ['nom_categorie', [Validators.required]] // Par défaut recherche par nom
    });

    // Formulaire d'édition/ajout de catégorie
    this.editForm = this.fb.group({
      nom_categorie: ['', [Validators.required]],
      desc_categorie: [''],
      couleur_categorie: ['#000000'], // Couleur par défaut
      actif: [true] // Statut actif par défaut
    });
  }

  async searchCategorie() {
    if (this.searchForm.valid) {
      this.isSearching = true;
      this.searchError = null;
      this.searchResults = [];

      try {
        const searchTerm = this.searchForm.value.searchTerm.trim();
        const searchType = this.searchForm.value.searchType;

        const CategorieCollection = collection(this.firestore, 'categorie');
        let q;

        // Pour les recherches par nom ou description
        if (searchType === 'nom_categorie' || searchType === 'desc_categorie') {
          q = query(CategorieCollection, orderBy(searchType));
        } else {
          // Fallback : récupérer tout par défaut
          q = query(CategorieCollection, orderBy('nom_categorie'));
        }

        const querySnapshot = await getDocs(q);
        const tempResults: any[] = [];

        querySnapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          tempResults.push(data);
        });

        // Filtrage côté client (insensible à la casse)
        if (searchType === 'nom_categorie' || searchType === 'desc_categorie') {
          this.searchResults = tempResults.filter((Categorie) =>
            Categorie[searchType] && Categorie[searchType].toLowerCase().includes(searchTerm.toLowerCase())
          );
        } else {
          this.searchResults = tempResults;
        }

        if (this.searchResults.length === 0) {
          this.searchError = 'Aucune catégorie trouvée avec ces critères';
        }

      } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        this.searchError = 'Une erreur est survenue lors de la recherche: ' + (error as Error).message;
      } finally {
        this.isSearching = false;
      }
    }
  }

  async searchAllCategorie() {
    this.isSearching = true;
    this.searchError = null;
    this.searchResults = [];

    try {
      const CategorieCollection = collection(this.firestore, 'categorie');
      const q = query(CategorieCollection, orderBy('nom_categorie', 'asc'));

      const querySnapshot = await getDocs(q);
      this.searchResults = [];

      querySnapshot.forEach((doc) => {
        this.searchResults.push({
          id: doc.id,
          ...doc.data()
        });
      });
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      this.searchError = 'Une erreur est survenue lors du chargement des catégories';
    } finally {
      this.isSearching = false;
    }
  }

  clearSearch() {
    this.searchForm.reset({
      searchTerm: '',
      searchType: 'nom_categorie'
    });
    this.searchResults = [];
    this.searchError = null;
  }

  getSearchPlaceholder(): string {
    const searchType = this.searchForm.get('searchType')?.value;
    switch (searchType) {
      case 'nom_categorie': return 'Ex: Technologie, Sport, Culture...';
      case 'desc_categorie': return 'Ex: Articles sur les nouvelles technologies';
      default: return 'Entrez votre recherche';
    }
  }

  showAddForm() {
    this.title_window = 'Ajouter une catégorie';
    this.showForm = true;
    this.isEditing = false;
    this.selectedCategorieId = null;
    this.submitSuccess = false;
    this.submitError = null;
    this.updateSuccess = false;
    this.updateError = null;
    
    this.editForm.reset({
      nom_categorie: '',
      desc_categorie: '',
      couleur_categorie: '#000000',
      actif: true
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

        const CategorieData = {
          nom_categorie: formValue.nom_categorie.trim(),
          desc_categorie: formValue.desc_categorie ? formValue.desc_categorie.trim() : '',
          couleur_categorie: formValue.couleur_categorie || '#000000',
          actif: formValue.actif !== false, // Par défaut true
          date_creation: new Date(),
          date_modification: new Date()
        };

        const CategorieCollection = collection(this.firestore, 'categorie');
        await addDoc(CategorieCollection, CategorieData);

        this.submitSuccess = true;
        this.editForm.reset({
          nom_categorie: '',
          desc_categorie: '',
          couleur_categorie: '#000000',
          actif: true
        });

        if (this.searchResults.length > 0) {
          await this.searchAllCategorie();
        }

      } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error);
        this.submitError = 'Une erreur est survenue lors de l\'enregistrement';
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  editCategorie(Categorie: any) {
    this.title_window = 'Édition de la catégorie';
    this.showForm = true;
    this.isEditing = true;
    this.selectedCategorieId = Categorie.id;
    this.updateSuccess = false;
    this.updateError = null;

    this.editForm.patchValue({
      nom_categorie: Categorie.nom_categorie,
      desc_categorie: Categorie.desc_categorie || '',
      couleur_categorie: Categorie.couleur_categorie || '#000000',
      actif: Categorie.actif !== false
    });

    setTimeout(() => {
      document.querySelector('.edit-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  async deleteCategorie(CategorieId: string) {
    if (confirm('Voulez-vous vraiment supprimer cette catégorie ?')) {
      try {
        const docRef = doc(this.firestore, 'categorie', CategorieId);
        await deleteDoc(docRef);

        if (this.searchResults.length > 0) {
          await this.searchAllCategorie();
        }

        alert('Catégorie supprimée avec succès.');

      } catch (error) {
        console.error('Erreur lors de la suppression :', error);
        alert('Une erreur est survenue lors de la suppression de la catégorie.');
      }
    }
  }

  cancelEdit() {
    this.showForm = false;
    this.isEditing = false;
    this.selectedCategorieId = null;
    this.editForm.reset();
    this.updateSuccess = false;
    this.updateError = null;
  }

  async onUpdateSubmit() {
    console.log('ID de la catégorie sélectionnée :', this.selectedCategorieId);
    if (this.selectedCategorieId === '' || this.selectedCategorieId === null) {
      this.onAdd();
    } else {
      this.onUpdate();
    }
  }

  async onUpdate() {
    if (this.editForm.valid && this.selectedCategorieId) {
      this.isUpdating = true;
      this.updateSuccess = false;
      this.updateError = null;

      try {
        const formValue = this.editForm.value;

        const CategorieData = {
          nom_categorie: formValue.nom_categorie.trim(),
          desc_categorie: formValue.desc_categorie ? formValue.desc_categorie.trim() : '',
          couleur_categorie: formValue.couleur_categorie || '#000000',
          actif: formValue.actif !== false,
          date_modification: new Date()
        };

        const docRef = doc(this.firestore, 'categorie', this.selectedCategorieId);
        await updateDoc(docRef, CategorieData);

        this.updateSuccess = true;
        this.showForm = false;
        this.isEditing = false;
        this.editForm.reset();
        await this.searchAllCategorie();

      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        this.updateError = 'Une erreur est survenue lors de la mise à jour';
      } finally {
        this.isUpdating = false;
      }
    }
  }

  // Méthode utilitaire pour récupérer toutes les catégories actives
  async getActiveCategories(): Promise<any[]> {
    try {
      const CategorieCollection = collection(this.firestore, 'categorie');
      const q = query(
        CategorieCollection, 
        where('actif', '==', true),
        orderBy('nom_categorie', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const categories: any[] = [];

      querySnapshot.forEach((doc) => {
        categories.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return categories;
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories actives:', error);
      return [];
    }
  }

  // Méthode pour récupérer une catégorie par son ID
  async getCategorieById(CategorieId: string): Promise<any | null> {
    try {
      const CategorieCollection = collection(this.firestore, 'categorie');
      const q = query(CategorieCollection, where('__name__', '==', CategorieId));
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de la catégorie:', error);
      return null;
    }
  }
}
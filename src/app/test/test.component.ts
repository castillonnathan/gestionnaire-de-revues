import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-revue-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './test.component.html',
  styleUrl: './test.component.css'
})

export class RevueFormComponent {
  private fb = inject(FormBuilder);
  private firestore = inject(Firestore);

  revueForm: FormGroup;
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
  selectedRevueId: string | null = null;

  constructor() {
    this.revueForm = this.fb.group({
      numRevue: ['', [Validators.required, Validators.min(1)]],
      titre: ['', [Validators.required, Validators.minLength(1)]],
      dateSortie: ['', Validators.required]
    });

    this.searchForm = this.fb.group({
      searchTerm: ['', [Validators.required]],
      searchType: ['titre', [Validators.required]]
    });

    this.editForm = this.fb.group({
      numRevue: ['', [Validators.required, Validators.min(1)]],
      titre: ['', [Validators.required, Validators.minLength(1)]],
      dateSortie: ['', Validators.required]
    });
  }

  async searchRevue() {
    if (this.searchForm.valid) {
      this.isSearching = true;
      this.searchError = null;
      this.searchResults = [];

      try {
        const searchTerm = this.searchForm.value.searchTerm.trim();
        const searchType = this.searchForm.value.searchType;

        const revuesCollection = collection(this.firestore, 'revue');
        let q;

        switch (searchType) {
          case 'titre':
            q = query(
              revuesCollection,
              where('titre_revue', '>=', searchTerm),
              where('titre_revue', '<=', searchTerm + '\uf8ff'),
              orderBy('titre_revue')
            );
            break;

          case 'id':
            const numRevue = Number(searchTerm);
            if (isNaN(numRevue)) {
              throw new Error('Le numéro de revue doit être un nombre');
            }
            q = query(
              revuesCollection,
              where('num_revue', '==', numRevue)
            );
            break;

          case 'date':
            q = query(
              revuesCollection,
              where('date_sortie', '==', searchTerm),
              orderBy('date_sortie')
            );
            break;

          default:
            throw new Error('Type de recherche non valide');
        }

        const querySnapshot = await getDocs(q);
        this.searchResults = [];

        querySnapshot.forEach((doc) => {
          this.searchResults.push({
            id: doc.id,
            ...doc.data()
          });
        });

        if (this.searchResults.length === 0) {
          this.searchError = 'Aucun résultat trouvé avec ces critères';
        }

      } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        this.searchError = 'Une erreur est survenue lors de la recherche: ' + (error as Error).message;
      } finally {
        this.isSearching = false;
      }
    }
  }

  async searchAllRevues() {
    this.isSearching = true;
    this.searchError = null;
    this.searchResults = [];

    try {
      const revuesCollection = collection(this.firestore, 'revue');
      const q = query(revuesCollection, orderBy('date_sortie', 'desc'));

      const querySnapshot = await getDocs(q);
      this.searchResults = [];

      querySnapshot.forEach((doc) => {
        this.searchResults.push({
          id: doc.id,
          ...doc.data()
        });
      });
    } catch (error) {
      console.error('Erreur lors du chargement des revues:', error);
      this.searchError = 'Une erreur est survenue lors du chargement des revues';
    } finally {
      this.isSearching = false;
    }
  }

  clearSearch() {
    this.searchForm.reset({
      searchTerm: '',
      searchType: 'titre'
    });
    this.searchResults = [];
    this.searchError = null;
  }

  getSearchPlaceholder(): string {
    const searchType = this.searchForm.get('searchType')?.value;
    switch (searchType) {
      case 'titre': return 'Ex: Science et Vie';
      case 'id': return 'Ex: 123';
      case 'date': return 'Ex: 2024-03-15';
      default: return 'Entrez votre recherche';
    }
  }

  async onSubmit() {
    if (this.revueForm.valid) {
      this.isSubmitting = true;
      this.submitSuccess = false;
      this.submitError = null;

      try {
        const formValue = this.revueForm.value;

        const revueData = {
          num_revue: Number(formValue.numRevue),
          titre_revue: formValue.titre.trim(),
          date_sortie: formValue.dateSortie
        };

        const revuesCollection = collection(this.firestore, 'revue');
        await addDoc(revuesCollection, revueData);

        this.submitSuccess = true;
        this.revueForm.reset();

        if (this.searchResults.length > 0) {
          await this.searchAllRevues();
        }

      } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error);
        this.submitError = 'Une erreur est survenue lors de l\'enregistrement';
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  // Méthodes d'édition et mise à jour des revues

  editRevue(revue: any) {
    this.isEditing = true;
    this.selectedRevueId = revue.id;
    this.updateSuccess = false;
    this.updateError = null;

    this.editForm.patchValue({
      numRevue: revue.num_revue,
      titre: revue.titre_revue,
      dateSortie: revue.date_sortie
    });

    setTimeout(() => {
      document.querySelector('.edit-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  cancelEdit() {
    this.isEditing = false;
    this.selectedRevueId = null;
    this.editForm.reset();
    this.updateSuccess = false;
    this.updateError = null;
  }

  async onUpdateSubmit() {
    if (this.editForm.valid && this.selectedRevueId) {
      this.isUpdating = true;
      this.updateSuccess = false;
      this.updateError = null;

      try {
        const formValue = this.editForm.value;

        const updatedData = {
          num_revue: Number(formValue.numRevue),
          titre_revue: formValue.titre.trim(),
          date_sortie: formValue.dateSortie
        };

        const docRef = doc(this.firestore, 'revue', this.selectedRevueId);
        await updateDoc(docRef, updatedData);

        this.updateSuccess = true;

        if (this.searchResults.length > 0) {
          await this.searchAllRevues();
        }

        setTimeout(() => {
          this.cancelEdit();
        }, 2000);

      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        this.updateError = 'Une erreur est survenue lors de la mise à jour';
      } finally {
        this.isUpdating = false;
      }
    }
  }

}

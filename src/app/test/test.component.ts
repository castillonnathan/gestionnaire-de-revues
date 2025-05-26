import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-revue-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './test.component.html',
  styleUrl: './test.component.css'
})

export class RevueFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private firestore = inject(Firestore);

  revueForm: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  submitError: string | null = null;

  constructor() {
    this.revueForm = this.fb.group({
      numRevue: ['', [Validators.required, Validators.min(1)]],
      titre: ['', [Validators.required, Validators.minLength(1)]],
      dateSortie: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Initialisation du formulaire avec des valeurs par défaut
    this.revueForm.patchValue({
      numRevue: 12,
      titre: 'ça m\'intéresse',
      dateSortie: '2024-03-15'
    });
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
          titre_revue: formValue.titre.trim(), //.trim permet de supprimer les espaces qui ne servent à rien
          date_sortie: formValue.dateSortie // Date en YYYY/MM/DD
        };

        const revuesCollection = collection(this.firestore, 'revue');
        await addDoc(revuesCollection, revueData);

        this.submitSuccess = true;
        this.revueForm.reset(); // Réinitialiser le formulaire

      } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error);
        this.submitError = 'Une erreur est survenue lors de l\'enregistrement';
      } finally {
        this.isSubmitting = false;
      }
    }
  }
}
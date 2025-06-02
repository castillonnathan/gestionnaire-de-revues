import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';

/*interface revue {
  num_revue: number;
  date_sortie: Date;
  titre_revue: string;
}*/

@Component({
  selector: 'app-revue',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './revue.component.html',
  styleUrls: ['./revue.component.css']
})
export class RevueComponent {
private fb = inject(FormBuilder); // Injection du FormBuilder pour créer des formulaires réactifs
  private firestore = inject(Firestore); // Injection de Firestore pour interagir avec la base de données Firestore
  title_window = ''; // Titre de la fenêtre, utilisé pour afficher le titre de la page ou de la section

  searchForm: FormGroup; // Formulaire pour rechercher des revues
  editForm: FormGroup; // Formulaire pour éditer une revue existante

  isSubmitting = false; // Indicateur pour savoir si le formulaire de revue est en cours de soumission
  submitSuccess = false; // Indicateur pour savoir si la soumission du formulaire de revue a réussi
  isSearching = false; // Indicateur pour savoir si une recherche est en cours
  submitError: string | null = null; // Message d'erreur à afficher en cas de problème lors de la soumission du formulaire de revue
  searchResults: any[] = []; // Tableau pour stocker les résultats de recherche de revues
  searchError: string | null = null; // Message d'erreur à afficher en cas de problème lors de la recherche de revues

  isEditing = false; // Indicateur pour savoir si l'on est en mode édition d'une revue
  isUpdating = false; // Indicateur pour savoir si la mise à jour d'une revue est en cours
  updateSuccess = false; // Indicateur pour savoir si la mise à jour d'une revue a réussi
  updateError: string | null = null; // Message d'erreur à afficher en cas de problème lors de la mise à jour d'une revue
  selectedRevueId: string | null = null; // ID de la revue sélectionnée pour l'édition ou la mise à jour

  constructor() { // Constructeur pour initialiser les formulaires
    this.searchForm = this.fb.group({ // Initialisation du formulaire de recherche de revues
      searchTerm: ['', [Validators.required]], // Champ pour le terme de recherche
      searchType: ['titre', [Validators.required]] // Champ pour le type de recherche, avec une valeur par défaut 'titre' et requis
    });

    this.editForm = this.fb.group({ // Initialisation du formulaire pour éditer une revue existante
      numRevue: ['', [Validators.required, Validators.min(1)]], // Champ pour le numéro de revue, requis et doit être un nombre supérieur à 0
      titre: ['', [Validators.required, Validators.minLength(1)]], // Champ pour le titre de la revue, requis et doit avoir au moins 1 caractère
      dateSortie: ['', Validators.required] // Champ pour la date de sortie de la revue, requis
    });
  }

  async searchRevue() { // Méthode pour rechercher des revues en fonction des critères spécifiés dans le formulaire de recherche
    if (this.searchForm.valid) { // Vérifiez que le formulaire de recherche est valide avant de procéder à la recherche
      this.isSearching = true; // Indiquer que la recherche est en cours
      this.searchError = null; // Réinitialiser l'erreur de recherche
      this.searchResults = []; // Réinitialiser les résultats de recherche

      try {
        const searchTerm = this.searchForm.value.searchTerm.trim(); //  Récupération du terme de recherche et suppression des espaces superflus
        const searchType = this.searchForm.value.searchType; // Récupération du type de recherche sélectionné (titre, id, date)

        const revuesCollection = collection(this.firestore, 'revue'); // Référence à la collection 'revue' dans Firestore
        let q; // Déclaration de la variable de requête

        switch (searchType) { // Détermination de la requête en fonction du type de recherche sélectionné
          case 'titre': // Recherche par titre de revue 
            q = query( // Référence à la collection 'revue' dans Firestore
              revuesCollection, // Création de la requête pour rechercher les revues par titre
              where('titre_revue', '>=', searchTerm), // Condition pour rechercher les revues dont le titre commence par le terme de recherche
              where('titre_revue', '<=', searchTerm + '\uf8ff'), // Condition pour rechercher les revues dont le titre se termine par le terme de recherche
              orderBy('titre_revue') // Tri des résultats par titre de revue
            );
            break; // Recherche par ID de revue

          case 'id': // Recherche par ID de revue
            const numRevue = Number(searchTerm); // Conversion du terme de recherche en nombre
            if (isNaN(numRevue)) { // Vérification si le terme de recherche est un nombre valide
              throw new Error('Le numéro de revue doit être un nombre'); // Si ce n'est pas un nombre valide, lancer une erreur
            }
            q = query( // Création de la requête pour rechercher les revues par ID
              revuesCollection, // Référence à la collection 'revue' dans Firestore
              where('num_revue', '==', numRevue) // Condition pour rechercher les revues dont le numéro correspond au terme de recherche
            );
            break; // Recherche par date de sortie

          case 'date': // Recherche par date de sortie de revue
            q = query( // Création de la requête pour rechercher les revues par date de sortie
              revuesCollection, // Référence à la collection 'revue' dans Firestore
              where('date_sortie', '==', searchTerm), // Condition pour rechercher les revues dont la date de sortie correspond au terme de recherche
              orderBy('date_sortie') // Tri des résultats par date de sortie
            );
            break; // Recherche par date de sortie

          default: // Gestion des types de recherche non valides
            throw new Error('Type de recherche non valide'); // Gestion des types de recherche non valides
        }

        const querySnapshot = await getDocs(q); // Exécution de la requête pour obtenir les documents
        this.searchResults = []; // Réinitialisation du tableau de résultats de recherche

        querySnapshot.forEach((doc) => { // Parcours de chaque document trouvé dans la collection
          this.searchResults.push({ // Ajout des données du document dans le tableau de résultats
            id: doc.id, // ID du document
            ...doc.data() // Données du document
          });
        });

        if (this.searchResults.length === 0) { // Si aucun résultat n'est trouvé, afficher un message d'erreur
          this.searchError = 'Aucun résultat trouvé avec ces critères'; // Message d'erreur à afficher à l'utilisateur
        }

      } catch (error) { // Gestion des erreurs lors de la recherche
        console.error('Erreur lors de la recherche:', error); // Affichage de l'erreur dans la console
        this.searchError = 'Une erreur est survenue lors de la recherche: ' + (error as Error).message; // Message d'erreur à afficher à l'utilisateur
      } finally { // Bloc finally pour s'assurer que l'état de recherche est réinitialisé
        this.isSearching = false; // Réinitialisation de l'état de recherche
      }
    }
  }

  async searchAllRevues() { // Méthode pour rechercher toutes les revues, triées par date de sortie décroissante
    this.isSearching = true; // Indiquer que la recherche est en cours
    this.searchError = null; // Réinitialiser l'erreur de recherche
    this.searchResults = []; // Réinitialiser les résultats de recherche

    try {
      const revuesCollection = collection(this.firestore, 'revue'); // Référence à la collection 'revue'
      const q = query(revuesCollection, orderBy('date_sortie', 'desc')); // Requête pour récupérer toutes les revues, triées par date de sortie décroissante

      const querySnapshot = await getDocs(q); // Exécution de la requête pour obtenir les documents
      this.searchResults = []; // Réinitialisation du tableau de résultats de recherche

      querySnapshot.forEach((doc) => { // Parcours de chaque document trouvé dans la collection
        this.searchResults.push({ // Ajout des données du document dans le tableau de résultats
          id: doc.id, // ID du document
          ...doc.data() // Données du document
        });
      });
    } catch (error) { // Gestion des erreurs lors du chargement des revues
      console.error('Erreur lors du chargement des revues:', error); // Affichage de l'erreur dans la console
      this.searchError = 'Une erreur est survenue lors du chargement des revues'; // Message d'erreur à afficher à l'utilisateur
    } finally { // Bloc finally pour s'assurer que l'état de recherche est réinitialisé
      this.isSearching = false; // Réinitialisation de l'état de recherche
    }
  }

  clearSearch() { // Méthode pour réinitialiser le formulaire de recherche et les résultats
    this.searchForm.reset({ // Réinitialisation du formulaire de recherche
      searchTerm: '', // Réinitialisation du terme de recherche
      searchType: 'titre' // Réinitialisation du type de recherche à 'titre'
    });
    this.searchResults = []; // Réinitialisation des résultats de recherche
    this.searchError = null; // Réinitialisation de l'erreur de recherche
  }

  getSearchPlaceholder(): string { // Méthode pour obtenir le placeholder dynamique en fonction du type de recherche sélectionné
    const searchType = this.searchForm.get('searchType')?.value; // Récupération du type de recherche sélectionné
    switch (searchType) { // Mettre les données en dut dans la barre de recherche comme exemple
      case 'titre': return 'Ex: Science et Vie';
      case 'id': return 'Ex: 123';
      case 'date': return 'Ex: 2024-03-15';
      default: return 'Entrez votre recherche';
    }
  }

  async onAdd() { // Méthode pour soumettre le formulaire de revue
    if (this.editForm.valid) { // Vérifiez que le formulaire est valide avant de soumettre
      this.isSubmitting = true; // Indiquer que la soumission est en cours
      this.submitSuccess = false; // Réinitialiser le succès de la soumission
      this.submitError = null; // Réinitialiser les messages de succès et d'erreur

      try {
        const formValue = this.editForm.value; // Récupération des valeurs du formulaire de revue

        const revueData = { // Préparation des données de la revue à soumettre
          num_revue: Number(formValue.numRevue), // Assurez-vous que le numéro de revue est un nombre
          titre_revue: formValue.titre.trim(), // le trim() est utilisé pour enlever les espaces superflus
          date_sortie: formValue.dateSortie // Assurez-vous que la date est au format correct
        };

        const revuesCollection = collection(this.firestore, 'revue'); // Référence à la collection 'revue'
        await addDoc(revuesCollection, revueData); // Ajout de la revue à Firestore

        this.submitSuccess = true; // Indiquer que la soumission a réussi
        this.editForm.reset(); // Réinitialiser le formulaire après soumission réussie

        if (this.searchResults.length > 0) { // Si des résultats de recherche sont affichés, les mettre à jour
          await this.searchAllRevues(); // Recharger les revues
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

  editRevue(revue: any) { // Méthode pour initier l'édition d'une revue
    this.title_window = 'Édition de la revue'; // Mettre à jour le titre de la fenêtre pour l'édition
    this.isEditing = true; // Indiquer que l'on est en mode édition
    this.selectedRevueId = revue.id; // Stocker l'ID de la revue sélectionnée
    this.updateSuccess = false; // Réinitialiser le succès de la mise à jour
    this.updateError = null; // Réinitialiser les messages de succès et d'erreur

    this.editForm.patchValue({ // Pré-remplissage du formulaire d'édition avec les données de la revue sélectionnée
      numRevue: revue.num_revue,
      titre: revue.titre_revue,
      dateSortie: revue.date_sortie
    });

    setTimeout(() => { // Temporisation pour laisser le temps à l'utilisateur de voir la section d'édition
      document.querySelector('.edit-section')?.scrollIntoView({ behavior: 'smooth' }); // Faire défiler vers la section d'édition
    }, 100); // 100 millisecondes
  }

  addRevue(revue: any) { // Méthode pour initier l'édition d'une revue
    this.title_window = 'Ajout d\'une revue'; // Mettre à jour le titre de la fenêtre pour l'ajout
    this.isEditing = true; // Indiquer que l'on est en mode édition
    this.selectedRevueId = ''; // Stocker l'ID de la revue sélectionnée
    this.updateSuccess = false; // Réinitialiser le succès de la mise à jour
    this.updateError = null; // Réinitialiser les messages de succès et d'erreur

    this.editForm.patchValue({ // Pré-remplissage du formulaire d'édition avec les données de la revue sélectionnée
      numRevue: '',
      titre: '',
      dateSortie: ''
    });

    setTimeout(() => { // Temporisation pour laisser le temps à l'utilisateur de voir la section d'édition
      document.querySelector('.edit-section')?.scrollIntoView({ behavior: 'smooth' }); // Faire défiler vers la section d'édition
    }, 100); // 100 millisecondes
  }


  async deleteRevue(revueId: string) {
  if (confirm('Voulez-vous vraiment supprimer cette revue ?')) {
    try {
      const docRef = doc(this.firestore, 'revue', revueId); // Référence au document à supprimer
      await deleteDoc(docRef); // Suppression du document

      // Mettre à jour la liste après suppression
      if (this.searchResults.length > 0) {
        await this.searchAllRevues();
      }

      alert('Revue supprimée avec succès.');

    } catch (error) {
      console.error('Erreur lors de la suppression :', error);
      alert('Une erreur est survenue lors de la suppression de la revue.');
    }
  }
}


  cancelEdit() {
    this.isEditing = false; // Réinitialiser l'état d'édition
    this.selectedRevueId = null; // Réinitialiser l'ID de la revue sélectionnée
    this.editForm.reset(); // Réinitialiser le formulaire d'édition
    this.updateSuccess = false; // Réinitialiser le succès de la mise à jour
    this.updateError = null; // Réinitialiser l'erreur de mise à jour
  }

  async onUpdateSubmit() {
    console.log('ID de la revue sélectionnée :', this.selectedRevueId); // Affichage de l'ID de la revue sélectionnée dans la console
    if (this.selectedRevueId === '') {
      this.onAdd(); // Appel de la méthode pour ajouter une nouvelle revue si aucun ID n'est sélectionné
    } else {
       this.onUpdate(); // Appel de la méthode pour mettre à jour la revue
    }
  }

    async onUpdate() {
  if (this.editForm.valid && this.selectedRevueId) {
    this.isUpdating = true;
    this.updateSuccess = false;
    this.updateError = null;

    try {
      const formValue = this.editForm.value;

      const revueData = {
        num_revue: Number(formValue.numRevue),
        titre_revue: formValue.titre.trim(),
        date_sortie: formValue.dateSortie
      };

      const docRef = doc(this.firestore, 'revue', this.selectedRevueId);
      await updateDoc(docRef, revueData);

      this.updateSuccess = true;
      this.isEditing = false;
      this.editForm.reset();
      await this.searchAllRevues();

    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      this.updateError = 'Une erreur est survenue lors de la mise à jour';
    } finally {
      this.isUpdating = false;
    }
  }
}

}
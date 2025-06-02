import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-article',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  standalone: true,
  templateUrl: './article.component.html',
  styleUrl: './article.component.css'
})
export class ArticleComponent {

  private fb = inject(FormBuilder); // Injection du FormBuilder pour créer des formulaires réactifs
  private firestore = inject(Firestore); // Injection de Firestore pour interagir avec la base de données Firestore
  title_window = ''; // Titre de la fenêtre, utilisé pour afficher le titre de l'article

  searchForm: FormGroup; // Formulaire de recherche pour filtrer les articles
  articleForm: FormGroup; // Formulaire pour créer ou mettre à jour un article
  editForm: FormGroup; // Formulaire pour éditer un article existant

  isSubmitting = false; // Indicateur pour savoir si le formulaire d'article est en cours de soumission
  submitSuccess = false; // Indicateur pour savoir si la soumission du formulaire d'article a réussi
  isSearching = false; // Indicateur pour savoir si une recherche est en cours
  submitError: string | null = null; // Message d'erreur à afficher en cas de problème lors de la soumission du formulaire d'article
  searchResults: any[] = []; // Tableau pour stocker les résultats de recherche d'articles
  searchError: string | null = null; // Message d'erreur à afficher en cas de problème lors de la recherche d'articles

  isEditing = false; // Indicateur pour savoir si l'on est en mode édition d'un article
  isUpdating = false; // Indicateur pour savoir si la mise à jour d'un article est en cours
  updateSuccess = false; // Indicateur pour savoir si la mise à jour d'un article a réussi
  updateError: string | null = null; // Message d'erreur à afficher en cas de problème lors de la mise à jour d'un article
  selectedArticleId: string | null = null; // ID de l'article sélectionné pour l'édition ou la mise à jour

  constructor() { // Constructeur pour initialiser les formulaires
    this.searchForm = this.fb.group({ // Initialisation du formulaire de recherche d'articles
      searchTerm: ['', [Validators.required]], // Champ pour le terme de recherche
      searchType: ['titre', [Validators.required]] // Champ pour le type de recherche, avec une valeur par défaut 'titre' et requis
    });

    this.editForm = this.fb.group({ // Initialisation du formulaire d'édition d'article
      num_article: ['', [Validators.required]], // Champ pour le numéro de l'article, requis
      titre_article: ['', [Validators.required]], // Champ pour le titre de l'article, requis
      num_page: ['', [Validators.required]], // Champ pour le numéro de la page, requis
      desc_article: ['', [Validators.required]], // Champ pour le contenu de l'article, requis
    });

    this.articleForm = this.fb.group({ // Initialisation du formulaire de création ou de mise à jour d'article
      titre_article: ['', [Validators.required]], // Champ pour le titre de l'article, requis
      num_article: ['', [Validators.required]], // Champ pour le numéro de l'article, requis
      num_page: ['', [Validators.required]], // Champ pour le numéro de la page, requis
      desc_article: ['', [Validators.required]], // Champ pour le contenu de l'article, requis
    });

  }
  
  async searchArticle() { // Méthode pour rechercher des articles en fonction des critères spécifiés dans le formulaire de recherche
    if (this.searchForm.valid) { // Vérifiez que le formulaire de recherche est valide avant de procéder à la recherche
      this.isSearching = true; // Indiquer que la recherche est en cours
      this.searchError = null; // Réinitialiser l'erreur de recherche
      this.searchResults = []; // Réinitialiser les résultats de recherche

      try {
        const searchTerm = this.searchForm.value.searchTerm.trim(); //  Récupération du terme de recherche et suppression des espaces superflus
        const searchType = this.searchForm.value.searchType; // Récupération du type de recherche sélectionné (titre, numéro, page)

        const articleCollection = collection(this.firestore, 'article'); // Référence à la collection 'articles' dans Firestore
        let q; // Déclaration de la variable de requête

        switch (searchType) { // Déterminer le type de recherche et construire la requête en conséquence
          case 'titre': // Recherche par titre
            q = query( // articlesCollection, where('titre_article', '==', searchTerm)); // Requête pour trouver les articles avec le titre correspondant
              articleCollection, // Création de la requête pour rechercher par titre
              where('titre_article', '>=', searchTerm),
              where('titre_article', '<=', searchTerm + '\uf8ff'), // Utilisation de '\uf8ff' pour inclure tous les titres qui commencent par le terme de recherche
              orderBy('titre_article') // Tri des résultats par titre
            );
            break; // Recherche par numéro d'article

          case 'num_article':
            q = query( // articlesCollection, where('num_article', '==', searchTerm)); // Requête pour trouver les articles avec le numéro correspondant
              articleCollection, // Création de la requête pour rechercher par numéro d'article
              where('num_article', '>=', searchTerm),
              where('num_article', '<=', searchTerm + '\uf8ff'), // Utilisation de '\uf8ff' pour inclure tous les numéros qui commencent par le terme de recherche
              orderBy('num_article') // Tri des résultats par numéro d'article
            );
            break; // Recherche par numéro de page

          case 'num_page':
            q = query( // articlesCollection, where('num_page', '==', searchTerm)); // Requête pour trouver les articles avec le numéro de page correspondant
              articleCollection, // Création de la requête pour rechercher par numéro de page
              where('num_page', '>=', searchTerm),
              where('num_page', '<=', searchTerm + '\uf8ff'), // Utilisation de '\uf8ff' pour inclure tous les numéros de page qui commencent par le terme de recherche
              orderBy('num_page') // Tri des résultats par numéro de page
            );
            break;

          case 'desc_article':
            q = query( // articlesCollection, where('desc_article', '==', searchTerm)); // Requête pour trouver les articles avec la description correspondante
              articleCollection,
              where('desc_article', '>=', searchTerm),
              where('desc_article', '<=', searchTerm + '\uf8ff'), // Utilisation de '\uf8ff' pour inclure toutes les descriptions qui commencent par le terme de recherche
              orderBy('desc_article') // Tri des résultats par description
            );
            break;

          default:
            q = query(articleCollection, orderBy('titre_article'));
            break;
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

  async searchAllArticles() { // Méthode pour rechercher tous les articles, triés par titre croissant
    this.isSearching = true; // Indiquer que la recherche est en cours
    this.searchError = null; // Réinitialiser l'erreur de recherche
    this.searchResults = []; // Réinitialiser les résultats de recherche

    try {
      const articlesCollection = collection(this.firestore, 'article'); // Référence à la collection 'article'
      const q = query(articlesCollection, orderBy('titre_article', 'asc')); // Requête pour récupérer tous les articles, triés par titre croissant

      const querySnapshot = await getDocs(q); // Exécution de la requête pour obtenir les documents
      this.searchResults = []; // Réinitialisation du tableau de résultats de recherche

      querySnapshot.forEach((doc) => { // Parcours de chaque document trouvé dans la collection
        this.searchResults.push({ // Ajout des données du document dans le tableau de résultats
          id: doc.id, // ID du document
          ...doc.data() // Données du document
        });
      });
    } catch (error) { // Gestion des erreurs lors du chargement des articles
      console.error('Erreur lors du chargement des articles:', error); // Affichage de l'erreur dans la console
      this.searchError = 'Une erreur est survenue lors du chargement des articles'; // Message d'erreur à afficher à l'utilisateur
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
      case 'titre': return 'Ex: Introduction aux technologies web';
      case 'num_article': return 'Ex: ART001';
      case 'num_page': return 'Ex: 42';
      case 'desc_article': return 'Ex: Description de l\'article';
      default: return 'Entrez votre recherche';
    }
  }

  async onAdd() { // Méthode pour soumettre le formulaire d'article
    if (this.editForm.valid) { // Vérifiez que le formulaire est valide avant de soumettre
      this.isSubmitting = true; // Indiquer que la soumission est en cours
      this.submitSuccess = false; // Réinitialiser le succès de la soumission
      this.submitError = null; // Réinitialiser les messages de succès et d'erreur

      try {
        const formValue = this.editForm.value; // Récupération des valeurs du formulaire d'article

        const articleData = { // Préparation des données de l'article à soumettre
          num_article: formValue.num_article.trim(), // le trim() est utilisé pour enlever les espaces superflus
          titre_article: formValue.titre_article.trim(), // le trim() est utilisé pour enlever les espaces superflus
          num_page: formValue.num_page ? Number(formValue.num_page) : null, // Assurez-vous que le numéro de page est un nombre ou null
          desc_article: formValue.desc_article ? formValue.desc_article.trim() : '' // le trim() est utilisé pour enlever les espaces superflus
        };

        const articlesCollection = collection(this.firestore, 'article'); // Référence à la collection 'article'
        await addDoc(articlesCollection, articleData); // Ajout de l'article à Firestore

        this.submitSuccess = true; // Indiquer que la soumission a réussi
        this.editForm.reset(); // Réinitialiser le formulaire après soumission réussie

        if (this.searchResults.length > 0) { // Si des résultats de recherche sont affichés, les mettre à jour
          await this.searchAllArticles(); // Recharger les articles
        }

      } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error);
        this.submitError = 'Une erreur est survenue lors de l\'enregistrement';
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  // Méthodes d'édition et mise à jour des articles

  editArticle(article: any) { // Méthode pour initier l'édition d'un article
    this.title_window = 'Édition de l\'article'; // Mettre à jour le titre de la fenêtre pour l'édition
    this.isEditing = true; // Indiquer que l'on est en mode édition
    this.selectedArticleId = article.id; // Stocker l'ID de l'article sélectionné
    this.updateSuccess = false; // Réinitialiser le succès de la mise à jour
    this.updateError = null; // Réinitialiser les messages de succès et d'erreur

    this.editForm.patchValue({ // Pré-remplissage du formulaire d'édition avec les données de l'article sélectionné
      num_article: article.num_article,
      titre_article: article.titre_article,
      num_page: article.num_page,
      desc_article: article.desc_article
    });

    setTimeout(() => { // Temporisation pour laisser le temps à l'utilisateur de voir la section d'édition
      document.querySelector('.edit-section')?.scrollIntoView({ behavior: 'smooth' }); // Faire défiler vers la section d'édition
    }, 100); // 100 millisecondes
  }

  addArticle() { // Méthode pour initier l'ajout d'un article
    this.title_window = 'Ajout d\'un article'; // Mettre à jour le titre de la fenêtre pour l'ajout
    this.isEditing = true; // Indiquer que l'on est en mode édition
    this.selectedArticleId = ''; // Stocker l'ID de l'article sélectionné
    this.updateSuccess = false; // Réinitialiser le succès de la mise à jour
    this.updateError = null; // Réinitialiser les messages de succès et d'erreur

    this.editForm.patchValue({ // Pré-remplissage du formulaire d'édition avec les données de l'article sélectionné
      num_article: '',
      titre_article: '',
      num_page: '',
      desc_article: ''
    });

    setTimeout(() => { // Temporisation pour laisser le temps à l'utilisateur de voir la section d'édition
      document.querySelector('.edit-section')?.scrollIntoView({ behavior: 'smooth' }); // Faire défiler vers la section d'édition
    }, 100); // 100 millisecondes
  }

  async deleteArticle(articleId: string) {
    if (confirm('Voulez-vous vraiment supprimer cet article ?')) {
      try {
        const docRef = doc(this.firestore, 'article', articleId); // Référence au document à supprimer
        await deleteDoc(docRef); // Suppression du document

        // Mettre à jour la liste après suppression
        if (this.searchResults.length > 0) {
          await this.searchAllArticles();
        }

        alert('Article supprimé avec succès.');

      } catch (error) {
        console.error('Erreur lors de la suppression :', error);
        alert('Une erreur est survenue lors de la suppression de l\'article.');
      }
    }
  }

  cancelEdit() {
    this.isEditing = false; // Réinitialiser l'état d'édition
    this.selectedArticleId = null; // Réinitialiser l'ID de l'article sélectionné
    this.editForm.reset(); // Réinitialiser le formulaire d'édition
    this.updateSuccess = false; // Réinitialiser le succès de la mise à jour
    this.updateError = null; // Réinitialiser l'erreur de mise à jour
  }

  async onUpdateSubmit() {
    console.log('ID de l\'article sélectionné :', this.selectedArticleId); // Affichage de l'ID de l'article sélectionné dans la console
    if (this.selectedArticleId === '') {
      this.onAdd(); // Appel de la méthode pour ajouter un nouvel article si aucun ID n'est sélectionné
    } else {
      this.onUpdate(); // Appel de la méthode pour mettre à jour l'article
    }
  }

  async onUpdate() {
    if (this.editForm.valid && this.selectedArticleId) { // Vérifiez que le formulaire d'édition est valide et qu'un article est sélectionné
      this.isUpdating = true; // Indiquer que la mise à jour est en cours
      this.updateSuccess = false; // Réinitialiser le succès de la mise à jour
      this.updateError = null; // Réinitialiser les messages de succès et d'erreur

      try {
        const formValue = this.editForm.value; // Récupération des valeurs du formulaire d'édition

        const articleData = { // Préparation des données de l'article à mettre à jour
          num_article: formValue.num_article.trim(), // le trim() est utilisé pour enlever les espaces superflus
          titre_article: formValue.titre_article.trim(),
          num_page: formValue.num_page ? Number(formValue.num_page) : null, // Assurez-vous que le numéro de page est un nombre ou null
          desc_article: formValue.desc_article ? formValue.desc_article.trim() : ''
        };

        const docRef = doc(this.firestore, 'article', this.selectedArticleId); // Référence au document de l'article à mettre à jour
        await updateDoc(docRef, articleData); // Mise à jour du document dans Firestore

        this.updateSuccess = true; // Indiquer que la mise à jour a réussi
        this.isEditing = false; // Réinitialiser l'état d'édition
        this.editForm.reset(); // Réinitialiser le formulaire d'édition
        await this.searchAllArticles(); // Recharger les articles après la mise à jour réussie

      } catch (error) { // Gestion des erreurs lors de la mise à jour
        console.error('Erreur lors de la mise à jour:', error); // Affichage de l'erreur dans la console
        this.updateError = 'Une erreur est survenue lors de la mise à jour'; // Message d'erreur à afficher à l'utilisateur
      } finally { // Bloc finally pour s'assurer que l'état de mise à jour est réinitialisé
        this.isUpdating = false; // Réinitialisation de l'état de mise à jour
      }
    }
  }
}
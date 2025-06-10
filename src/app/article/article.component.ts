import { Component, inject, OnInit } from '@angular/core';
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
export class ArticleComponent implements OnInit {

  // Injection des dépendances nécessaires
  private fb = inject(FormBuilder);
  private firestore = inject(Firestore);
  title_window = '';

  // Formulaires pour la recherche et l'édition
  searchForm: FormGroup;
  editForm: FormGroup;

  // États pour la gestion des opérations
  isSubmitting = false;
  submitSuccess = false;
  isSearching = false;
  submitError: string | null = null;
  searchResults: any[] = [];
  searchError: string | null = null;

  // États pour l'édition et la mise à jour
  isEditing = false;
  isUpdating = false;
  updateSuccess = false;
  updateError: string | null = null;
  selectedArticleId: string | null = null;
  showForm = false;

  // Tables pour les données de référence
  table_categorie: any[] = [];
  table_localisation: any[] = [];

  constructor() {
    this.searchForm = this.fb.group({
      searchTerm: ['', [Validators.required]],
      searchType: ['titre_article', [Validators.required]]
    });

    // Initialisation du formulaire d'édition
    this.editForm = this.fb.group({
      num_article: ['', [Validators.required]],
      titre_article: ['', [Validators.required]],
      num_page: [''],
      desc_article: [''],
      libelle_categorie: ['', [Validators.required]],
      libelle_localisation: [''],
      article_revue: ['']
    });
  }

  // Méthode d'initialisation du composant
  async ngOnInit() {
    await this.loadCategories();
    await this.loadLocalisations();
  }

  // Méthode pour charger les catégories
  async loadCategories() {
    try {
      const categorieCollection = collection(this.firestore, 'categorie');
      const q = query(categorieCollection, orderBy('libelle_categorie', 'asc'));
      const querySnapshot = await getDocs(q);
      this.table_categorie = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      this.table_categorie = [];
    }
  }

  // Méthode pour charger les localisations
  async loadLocalisations() {
    try {
      const localisationCollection = collection(this.firestore, 'localisation');
      const q = query(localisationCollection, orderBy('libelle_localisation', 'asc'));
      const querySnapshot = await getDocs(q);
      this.table_localisation = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des localisations:', error);
      this.table_localisation = [];
    }
  }

  // Méthode pour récupérer ou créer une catégorie
  async getOrCreateCategorie(libelle: string): Promise<string> {
    try {
      const categorieCollection = collection(this.firestore, 'categorie');
      const q = query(
        categorieCollection,
        where('libelle_categorie', '==', libelle)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const categorieDoc = querySnapshot.docs[0];
        const categorieId = categorieDoc.id;

        const categorieData = categorieDoc.data();
        if (!categorieData['id']) {
          await updateDoc(doc(this.firestore, 'categorie', categorieId), {
            id: categorieId
          });
        }

        return categorieId;
      } else {
        const nouvelleCategorieData = {
          libelle_categorie: libelle,
          date_creation: new Date(),
          date_modification: new Date()
        };

        const docRef = await addDoc(categorieCollection, nouvelleCategorieData);

        await updateDoc(docRef, {
          id: docRef.id
        });

        return docRef.id;
      }
    } catch (error) {
      console.error('Erreur lors de la création/récupération de la catégorie:', error);
      throw error;
    }
  }

  // Méthode pour récupérer ou créer une localisation
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
          date_creation: new Date(),
          date_modification: new Date()
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

  // Méthode pour rechercher des articles en fonction des critères
  async searchArticle() {
    if (this.searchForm.valid) {
      this.isSearching = true;
      this.searchError = null;
      this.searchResults = [];

      try {
        const searchTerm = this.searchForm.value.searchTerm.trim();
        const searchType = this.searchForm.value.searchType;

        const articleCollection = collection(this.firestore, 'article');
        let q;

        // Cas recherche par numéro ou page
        if (searchType === 'num_article' || searchType === 'num_page') {
          q = query(
            articleCollection,
            where(searchType, '==', searchType === 'num_page' ? Number(searchTerm) : searchTerm)
          );
        } else {
          // Sinon, on charge tout et on filtre côté client
          q = query(articleCollection, orderBy('titre_article'));
        }

        const querySnapshot = await getDocs(q);
        const tempResults: any[] = [];

        querySnapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          tempResults.push(data);
        });

        // On filtre en local
        if (searchType === 'titre_article' || searchType === 'desc_article' || searchType === 'categorie' || searchType === 'localisation_article' || searchType === 'article_revue') {
          this.searchResults = tempResults.filter((article) => {
            let fieldToSearch = '';
            switch (searchType) {
              case 'categorie':
                fieldToSearch = article['libelle_categories'] || '';
                break;
              case 'localisation_article':
                fieldToSearch = article['libelle_localisation'] || '';
                break;
              default:
                fieldToSearch = article[searchType] || '';
                break;
            }
            return fieldToSearch.toLowerCase().includes(searchTerm.toLowerCase());
          });
        } else {
          // Numéro article / page → pas de filtrage car déjà géré dans la requête
          this.searchResults = tempResults;
        }

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

  // Méthode pour rechercher tous les articles
  async searchAllArticle() {
    this.isSearching = true;
    this.searchError = null;
    this.searchResults = [];

    try {
      const articleCollection = collection(this.firestore, 'article');
      const q = query(articleCollection, orderBy('titre_article', 'asc'));

      const querySnapshot = await getDocs(q);
      this.searchResults = [];

      querySnapshot.forEach((doc) => {
        this.searchResults.push({
          id: doc.id,
          ...doc.data()
        });
      });
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error);
      this.searchError = 'Une erreur est survenue lors du chargement des articles';
    } finally {
      this.isSearching = false;
    }
  }

  // Méthode pour réinitialiser le formulaire de recherche et les résultats
  clearSearch() {
    this.searchForm.reset({
      searchTerm: '',
      searchType: 'titre_article'
    });
    this.searchResults = [];
    this.searchError = null;
  }

  // Méthode pour obtenir le placeholder du champ de recherche en fonction du type de recherche sélectionné
  getSearchPlaceholder(): string {
    const searchType = this.searchForm.get('searchType')?.value;
    switch (searchType) {
      case 'titre_article': return 'Ex: Introduction aux technologies web';
      case 'num_article': return 'Ex: ART001';
      case 'num_page': return 'Ex: 42';
      case 'desc_article': return 'Ex: Description de l\'article';
      case 'categorie': return 'Ex: Technologie, Sport, Culture...';
      case 'localisation_article': return 'Ex: placard, etagere, sous-sol...';
      case 'article_revue': return 'Ex: science-vie, figaro, monde...';
      default: return 'Entrez votre recherche';
    }
  }

  // Méthode pour afficher le formulaire d'ajout d'article
  showAddForm() {
    this.title_window = 'Ajouter un article';
    this.showForm = true;
    this.isEditing = false;
    this.selectedArticleId = null;
    this.submitSuccess = false;
    this.submitError = null;
    this.updateSuccess = false;
    this.updateError = null;

    this.editForm.reset();

    setTimeout(() => {
      document.querySelector('.edit-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  // Méthode pour ajouter un nouvel article
  async onAdd() {   
    if (this.editForm.valid) {
      this.isSubmitting = true;
      this.submitSuccess = false;
      this.submitError = null;

      try {
        const formValue = this.editForm.value;
        const categorieId = await this.getOrCreateCategorie(formValue.libelle_categorie);
        
        let localisationId = null;
        if (formValue.libelle_localisation && formValue.libelle_localisation.trim()) {
          localisationId = await this.getOrCreateLocalisation(formValue.libelle_localisation.trim());
        }

        const articleData = {
          num_article: formValue.num_article.trim(),
          titre_article: formValue.titre_article.trim(),
          num_page: formValue.num_page ? Number(formValue.num_page) : null,
          desc_article: formValue.desc_article ? formValue.desc_article.trim() : '',
          categorie_id: categorieId,
          libelle_categories: formValue.libelle_categorie.trim(),
          localisation_id: localisationId,
          libelle_localisation: formValue.libelle_localisation ? formValue.libelle_localisation.trim() : '',
          article_revue: formValue.article_revue ? formValue.article_revue.trim() : '',
          date_creation: new Date(),
          date_modification: new Date()
        };

        const articleCollection = collection(this.firestore, 'article');
        await addDoc(articleCollection, articleData);

        this.submitSuccess = true;
        this.editForm.reset();

        if (this.searchResults.length > 0) {
          await this.searchAllArticle();
        }

      } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error);
        this.submitError = 'Une erreur est survenue lors de l\'enregistrement';
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  // Méthode pour éditer un article existant
  async editArticle(article: any) {
    this.title_window = 'Édition de l\'article';
    this.showForm = true;
    this.isEditing = true;
    this.selectedArticleId = article.id;
    this.updateSuccess = false;
    this.updateError = null;

    let libelleCategorie = article.libelle_categories || '';
    if (!libelleCategorie && article.categorie_id) {
      libelleCategorie = await this.getCategorieById(article.categorie_id);
    }

    let libelleLocalisation = article.libelle_localisation || '';
    if (!libelleLocalisation && article.localisation_id) {
      libelleLocalisation = await this.getLocalisationById(article.localisation_id);
    }

    this.editForm.patchValue({
      num_article: article.num_article,
      titre_article: article.titre_article,
      num_page: article.num_page,
      desc_article: article.desc_article,
      libelle_categorie: libelleCategorie,
      libelle_localisation: libelleLocalisation,
      article_revue: article.article_revue || ''
    });

    setTimeout(() => {
      document.querySelector('.edit-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  // Méthode pour supprimer un article
  async deleteArticle(articleId: string) {
    if (confirm('Voulez-vous vraiment supprimer cet article ?')) {
      try {
        const docRef = doc(this.firestore, 'article', articleId);
        await deleteDoc(docRef);

        if (this.searchResults.length > 0) {
          await this.searchAllArticle();
        }

        alert('Article supprimé avec succès.');

      } catch (error) {
        console.error('Erreur lors de la suppression :', error);
        alert('Une erreur est survenue lors de la suppression de l\'article.');
      }
    }
  }

  // Méthode pour ajouter une nouvelle catégorie via un prompt
  async showAddCategoriePrompt() {
    const newCategorie = prompt('Entrez le nom de la nouvelle catégorie :');
    if (newCategorie && newCategorie.trim() !== '') {
      try {
        await this.loadCategories();
        this.editForm.get('libelle_categorie')?.setValue(newCategorie.trim());
        alert(`Catégorie "${newCategorie}" ajoutée avec succès.`);
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la catégorie via le bouton + :', error);
        alert('Erreur lors de l\'ajout de la catégorie.');
      }
    }
  }

  // Méthode pour ajouter une nouvelle localisation via un prompt
  async showAddLocalisationPrompt() {
    const newLocalisation = prompt('Entrez le nom de la nouvelle localisation :');
    if (newLocalisation && newLocalisation.trim() !== '') {
      try {
        await this.loadLocalisations();
        this.editForm.get('libelle_localisation')?.setValue(newLocalisation.trim());
        alert(`Localisation "${newLocalisation}" ajoutée avec succès.`);
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la localisation via le bouton + :', error);
        alert('Erreur lors de l\'ajout de la localisation.');
      }
    }
  }

  // Méthode pour annuler l'édition ou l'ajout d'un article
  cancelEdit() {
    this.showForm = false;
    this.isEditing = false;
    this.selectedArticleId = null;
    this.editForm.reset();
    this.updateSuccess = false;
    this.updateError = null;
  }

  // Méthode pour soumettre le formulaire d'édition ou d'ajout
  async onUpdateSubmit() {
    if (this.selectedArticleId === '') {
      this.onAdd();
    } else {
      this.onUpdate();
    }
  }

  // Méthode pour mettre à jour un article
  async onUpdate() {
    if (this.editForm.valid && this.selectedArticleId) {
      this.isUpdating = true;
      this.updateSuccess = false;
      this.updateError = null;

      try {
        const formValue = this.editForm.value;
        // Récupère ou crée la catégorie et obtient son ID
        const categorieId = await this.getOrCreateCategorie(formValue.libelle_categorie);
        
        let localisationId = null;
        if (formValue.libelle_localisation && formValue.libelle_localisation.trim()) {
          localisationId = await this.getOrCreateLocalisation(formValue.libelle_localisation.trim());
        }

        // Prépare les données de l'article à mettre à jour
        const articleData = {
          num_article: formValue.num_article.trim(),
          titre_article: formValue.titre_article.trim(),
          num_page: formValue.num_page ? Number(formValue.num_page) : null,
          desc_article: formValue.desc_article ? formValue.desc_article.trim() : '',
          categorie_id: categorieId,
          libelle_categories: formValue.libelle_categorie.trim(),
          localisation_id: localisationId,
          libelle_localisation: formValue.libelle_localisation ? formValue.libelle_localisation.trim() : '',
          article_revue: formValue.article_revue ? formValue.article_revue.trim() : '',
          date_modification: new Date()
        };

        // Met à jour l'article dans Firestore
        const docRef = doc(this.firestore, 'article', this.selectedArticleId);
        await updateDoc(docRef, articleData);

        // Réinitialise le formulaire et les états
        this.updateSuccess = true;
        this.showForm = false;
        this.isEditing = false;
        this.editForm.reset();
        await this.searchAllArticle();

      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        this.updateError = 'Une erreur est survenue lors de la mise à jour';
      } finally {
        this.isUpdating = false;
      }
    }
  }

  // Méthodes utilitaires pour récupérer les catégories et localisations par ID
  async getCategorieById(categorieId: string): Promise<string> {
    try {
      const categorieDoc = await getDocs(
        query(collection(this.firestore, 'categorie'), where('__name__', '==', categorieId))
      );
      if (!categorieDoc.empty) {
        return categorieDoc.docs[0].data()['libelle_categorie'] || '';
      }
      return '';
    } catch (error) {
      console.error('Erreur récupération catégorie :', error);
      return '';
    }
  }

  // Méthodes utilitaires pour récupérer les localisations par ID
  async getLocalisationById(localisationId: string): Promise<string> {
    try {
      const localisationDoc = await getDocs(
        query(collection(this.firestore, 'localisation'), where('__name__', '==', localisationId))
      );
      if (!localisationDoc.empty) {
        return localisationDoc.docs[0].data()['libelle_localisation'] || '';
      }
      return '';
    } catch (error) {
      console.error('Erreur récupération localisation :', error);
      return '';
    }
  }

  // Méthodes utilitaires pour récupérer toutes les localisations
  async getAllLocalisations(): Promise<any[]> {
    try {
      const localisationCollection = collection(this.firestore, 'localisation');
      const q = query(
        localisationCollection, 
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
}
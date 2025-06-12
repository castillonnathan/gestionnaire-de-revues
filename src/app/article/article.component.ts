import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { identifierName } from '@angular/compiler';

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

  // Variables pour la pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  paginatedResults: any[] = [];

  // Tables pour les données de référence
  table_categorie: any[] = [];
  table_localisation: any[] = [];
  table_revue: any[] = [];

  constructor() {
    this.searchForm = this.fb.group({
      searchTerm: ['', [Validators.required]],
      searchType: ['titre_article', [Validators.required]]
    });

    // Initialisation du formulaire d'édition
    this.editForm = this.fb.group({
      titre_article: ['', [Validators.required]],
      num_page: [''],
      desc_article: [''],
      categorie_id: ['', [Validators.required]],
      localisation_id: [''],
      revue_id: ['']
    });
  }

  // Méthode d'initialisation du composant
  async ngOnInit() {
    await this.loadCategories();
    await this.loadLocalisations();
    await this.loadRevues();
  }

  // Méthode pour calculer la pagination
  updatePagination() {
    this.totalItems = this.searchResults.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    // S'assurer que la page courante est valide
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    // Calculer les résultats pour la page courante
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedResults = this.searchResults.slice(startIndex, endIndex);
  }

  // Méthodes de navigation pour la pagination
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  // Afficher la page d'avant
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  // Afficher la prochaine page
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  // Méthode pour obtenir les numéros de pages à afficher
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      // Si moins de 5 pages, afficher toutes
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, this.currentPage - 2);
      let end = Math.min(this.totalPages, start + maxVisiblePages - 1);
      
      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
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

  // Méthode pour charger les revues
  async loadRevues() {
  try {
    const revueCollection = collection(this.firestore, 'revue');
    // Pas de orderBy au cas où le champ titre_revue n'existerait pas sur tous les documents
    const querySnapshot = await getDocs(revueCollection);
    
    this.table_revue = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Données revue récupérées:', { id: doc.id, ...data }); // Debug
      
      this.table_revue.push({
        id: doc.id,
        ...data
      });
    });
    
    // Trier après récupération pour éviter les erreurs Firestore
    this.table_revue.sort((a, b) => {
      const titleA = a.titre_revue || '';
      const titleB = b.titre_revue || '';
      return titleA.localeCompare(titleB);
    });
    
    console.log('Table revues chargée:', this.table_revue); // Debug
    
  } catch (error) {
    console.error('Erreur lors du chargement des revues:', error);
    this.table_revue = [];
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
        };

        const docRef = await addDoc(categorieCollection, nouvelleCategorieData);

        await updateDoc(docRef, {
          id: docRef.id
        });

        // Recharger les catégories pour mettre à jour la liste
        await this.loadCategories();

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
        };

        const docRef = await addDoc(localisationCollection, nouvelleLocalisationData);

        await updateDoc(docRef, {
          id: docRef.id
        });

        // Recharger les localisations pour mettre à jour la liste
        await this.loadLocalisations();

        return docRef.id;
      }
    } catch (error) {
      console.error('Erreur lors de la création/récupération de la localisation:', error);
      throw error;
    }
  }

  // Méthode pour récupérer ou créer une revue
  async getOrCreateRevue(libelle: string): Promise<string> {
  try {
    const revueCollection = collection(this.firestore, 'revue');
    const q = query(
      revueCollection,
      where('titre_revue', '==', libelle)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const revueDoc = querySnapshot.docs[0];
      const revueId = revueDoc.id;

      const revueData = revueDoc.data();
      if (!revueData['id']) {
        await updateDoc(doc(this.firestore, 'revue', revueId), {
          id: revueId
        });
      }

      return revueId;
    } else {
      const nouvelleRevueData = {
        titre_revue: libelle,
      };

      const docRef = await addDoc(revueCollection, nouvelleRevueData);

      await updateDoc(docRef, {
        id: docRef.id
      });

      // Recharger les revues pour mettre à jour la liste
      await this.loadRevues();

      return docRef.id;
    }
  } catch (error) {
    console.error('Erreur lors de la création/récupération de la revue:', error);
    throw error;
  }
}

  // Méthode pour obtenir le libellé d'une catégorie par son ID
  getCategorieLibelle(categorieId: string): string {
    const categorie = this.table_categorie.find(c => c.id === categorieId);
    return categorie ? categorie.libelle_categorie : '';
  }

  // Méthode pour obtenir le libellé d'une localisation par son ID
  getLocalisationLibelle(localisationId: string): string {
    const localisation = this.table_localisation.find(l => l.id === localisationId);
    return localisation ? localisation.libelle_localisation : '';
  }

  // Méthode pour obtenir le libellé d'une revue par son ID
  getRevueTitre(revueId: string): string {
  if (!revueId) return '';
  
  const revue = this.table_revue.find(r => r.id === revueId);
  const libelle = revue ? (revue.titre_revue || '') : '';
  
  console.log(`Recherche revue ID: ${revueId}, trouvé:`, revue, `libellé: ${libelle}`); // Debug
  
  return libelle;
}

  // Méthode pour rechercher des articles en fonction des critères
  async searchArticle() {
    if (this.searchForm.valid) {
      this.isSearching = true;
      this.searchError = null;
      this.searchResults = [];
      this.currentPage = 1; // Reset à la première page

      try {
        const searchTerm = this.searchForm.value.searchTerm.trim();
        const searchType = this.searchForm.value.searchType;

        const articleCollection = collection(this.firestore, 'article');
        let q;

        // Cas recherche par numéro ou page
        if (searchType === 'num_page') {
          q = query(
            articleCollection,
            where(searchType, '==', Number(searchTerm))
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

        // On filtre en local pour les autres types de recherche
        if (searchType === 'titre_article' || searchType === 'desc_article') {
          this.searchResults = tempResults.filter((article) => {
            const fieldToSearch = article[searchType] || '';
            return fieldToSearch.toLowerCase().includes(searchTerm.toLowerCase());
          });
        } else if (searchType === 'categorie') {
          this.searchResults = tempResults.filter((article) => {
            const categorieLibelle = this.getCategorieLibelle(article.categorie_id);
            return categorieLibelle.toLowerCase().includes(searchTerm.toLowerCase());
          });
        } else if (searchType === 'localisation_article') {
          this.searchResults = tempResults.filter((article) => {
            const localisationLibelle = this.getLocalisationLibelle(article.localisation_id);
            return localisationLibelle.toLowerCase().includes(searchTerm.toLowerCase());
          });
        } else if (searchType === 'article_revue') {
          this.searchResults = tempResults.filter((article) => {
            const revueLibelle = this.getRevueTitre(article.revue_id);
            return revueLibelle.toLowerCase().includes(searchTerm.toLowerCase());
          });
        } else {
          // Numéro page → pas de filtrage car déjà géré dans la requête
          this.searchResults = tempResults;
        }

        if (this.searchResults.length === 0) {
          this.searchError = 'Aucun résultat trouvé avec ces critères';
        }

        // Mettre à jour la pagination après la recherche
        this.updatePagination();

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
    this.currentPage = 1; // Reset à la première page

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

      // Mettre à jour la pagination après le chargement
      this.updatePagination();

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
    this.paginatedResults = [];
    this.searchError = null;
    this.currentPage = 1;
    this.totalItems = 0;
    this.totalPages = 0;
  }

  // Méthode pour obtenir le placeholder du champ de recherche en fonction du type de recherche sélectionné
  getSearchPlaceholder(): string {
    const searchType = this.searchForm.get('searchType')?.value;
    switch (searchType) {
      case 'titre_article': return 'Ex: Introduction aux technologies web';
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
        
        const articleData = {
          titre_article: formValue.titre_article.trim(),
          num_page: formValue.num_page ? Number(formValue.num_page) : null,
          desc_article: formValue.desc_article ? formValue.desc_article.trim() : '',
          categorie_id: formValue.categorie_id,
          localisation_id: formValue.localisation_id || null,
          revue_id: formValue.revue_id || null,
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

    this.editForm.patchValue({
      titre_article: article.titre_article,
      num_page: article.num_page,
      desc_article: article.desc_article,
      categorie_id: article.categorie_id,
      localisation_id: article.localisation_id || '',
      revue_id: article.revue_id || ''
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
        const categorieId = await this.getOrCreateCategorie(newCategorie.trim());
        this.editForm.get('categorie_id')?.setValue(categorieId);
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
        const localisationId = await this.getOrCreateLocalisation(newLocalisation.trim());
        this.editForm.get('localisation_id')?.setValue(localisationId);
        alert(`Localisation "${newLocalisation}" ajoutée avec succès.`);
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la localisation via le bouton + :', error);
        alert('Erreur lors de l\'ajout de la localisation.');
      }
    }
  }

  // Méthode pour ajouter une nouvelle revue via un prompt
  async showAddRevuePrompt() {
    const newRevue = prompt('Entrez le nom de la nouvelle revue :');
    if (newRevue && newRevue.trim() !== '') {
      try {
        const revueId = await this.getOrCreateRevue(newRevue.trim());
        this.editForm.get('revue_id')?.setValue(revueId);
        alert(`Revue "${newRevue}" ajoutée avec succès.`);
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la revue via le bouton + :', error);
        alert('Erreur lors de l\'ajout de la revue.');
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

        // Prépare les données de l'article à mettre à jour
        const articleData = {
          titre_article: formValue.titre_article.trim(),
          num_page: formValue.num_page ? Number(formValue.num_page) : null,
          desc_article: formValue.desc_article ? formValue.desc_article.trim() : '',
          categorie_id: formValue.categorie_id,
          localisation_id: formValue.localisation_id || null,
          revue_id: formValue.revue_id || null,
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
}
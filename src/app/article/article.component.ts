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
  selectedArticleId: string | null = null;
  showForm = false;

  readonly CATEGORIES_PREDEFINES = [
    { libelle: 'Technologie'},
    { libelle: 'Sport'},
    { libelle: 'Culture'},
    { libelle: 'Santé'},
    { libelle: 'Économie'},
    { libelle: 'Politique'},
    { libelle: 'Sciences'},
    { libelle: 'Éducation'},
    { libelle: 'Environnement'},
    { libelle: 'Arts'},
    { libelle: 'Automobile'},
    { libelle: 'Immobilier'},
    { libelle: 'Voyage'},
    { libelle: 'Cuisine'},
    { libelle: 'Mode'}
  ];

  constructor() {
    this.searchForm = this.fb.group({
      searchTerm: ['', [Validators.required]],
      searchType: ['titre_article', [Validators.required]]
    });

    this.editForm = this.fb.group({
      num_article: ['', [Validators.required]],
      titre_article: ['', [Validators.required]],
      num_page: [''],
      desc_article: [''],
      libelle_categorie: ['', [Validators.required]]
    });
  }

  async ngOnInit() {}

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
          libelle_categorie: libelle
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

        if (searchType === 'num_article' || searchType === 'num_page') {
          q = query(
            articleCollection,
            where(searchType, '==', searchType === 'num_page' ? Number(searchTerm) : searchTerm)
          );
        } else if (searchType === 'categorie') {
          q = query(
            articleCollection,
            where('libelle_categories', '>=', searchTerm.toLowerCase()),
            where('libelle_categories', '<=', searchTerm.toLowerCase() + '\uf8ff')
          );
        } else if (searchType === 'titre_article' || searchType === 'desc_article') {
          q = query(articleCollection, orderBy(searchType));
        } else {
          q = query(articleCollection, orderBy('titre_article'));
        }

        const querySnapshot = await getDocs(q);
        const tempResults: any[] = [];

        querySnapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          tempResults.push(data);
        });

        if (searchType === 'titre_article' || searchType === 'desc_article') {
          this.searchResults = tempResults.filter((article) =>
            article[searchType] && article[searchType].toLowerCase().includes(searchTerm.toLowerCase())
          );
        } else if (searchType === 'categorie') {
          this.searchResults = tempResults.filter((article) =>
            article.libelle_categories && article.libelle_categories.toLowerCase().includes(searchTerm.toLowerCase())
          );
        } else {
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

  clearSearch() {
    this.searchForm.reset({
      searchTerm: '',
      searchType: 'titre_article'
    });
    this.searchResults = [];
    this.searchError = null;
  }

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

  async onAdd() {
    if (this.editForm.valid) {
      this.isSubmitting = true;
      this.submitSuccess = false;
      this.submitError = null;

      try {
        const formValue = this.editForm.value;
        const categorieId = await this.getOrCreateCategorie(formValue.libelle_categorie);

        const articleData = {
          num_article: formValue.num_article.trim(),
          titre_article: formValue.titre_article.trim(),
          num_page: formValue.num_page ? Number(formValue.num_page) : null,
          desc_article: formValue.desc_article ? formValue.desc_article.trim() : '',
          categorie_id: categorieId,
          libelle_categories: formValue.libelle_categorie
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

  editArticle(article: any) {
    this.title_window = 'Édition de l\'article';
    this.showForm = true;
    this.isEditing = true;
    this.selectedArticleId = article.id;
    this.updateSuccess = false;
    this.updateError = null;

    this.editForm.patchValue({
      num_article: article.num_article,
      titre_article: article.titre_article,
      num_page: article.num_page,
      desc_article: article.desc_article,
      libelle_categorie: article.libelle_categories || ''
    });

    setTimeout(() => {
      document.querySelector('.edit-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

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

  cancelEdit() {
    this.showForm = false;
    this.isEditing = false;
    this.selectedArticleId = null;
    this.editForm.reset();
    this.updateSuccess = false;
    this.updateError = null;
  }

  async onUpdateSubmit() {
    if (this.selectedArticleId === '') {
      this.onAdd();
    } else {
      this.onUpdate();
    }
  }

  async onUpdate() {
    if (this.editForm.valid && this.selectedArticleId) {
      this.isUpdating = true;
      this.updateSuccess = false;
      this.updateError = null;

      try {
        const formValue = this.editForm.value;
        const categorieId = await this.getOrCreateCategorie(formValue.libelle_categorie);

        const articleData = {
          num_article: formValue.num_article.trim(),
          titre_article: formValue.titre_article.trim(),
          num_page: formValue.num_page ? Number(formValue.num_page) : null,
          desc_article: formValue.desc_article ? formValue.desc_article.trim() : '',
          categorie_id: categorieId,
          libelle_categories: formValue.libelle_categorie
        };

        const docRef = doc(this.firestore, 'article', this.selectedArticleId);
        await updateDoc(docRef, articleData);

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

  async getArticlesByCategorie(categorieId: string): Promise<any[]> {
    try {
      const articleCollection = collection(this.firestore, 'article');
      const q = query(
        articleCollection,
        where('categorie_id', '==', categorieId),
        orderBy('titre_article', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const articles: any[] = [];

      querySnapshot.forEach((doc) => {
        articles.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return articles;
    } catch (error) {
      console.error('Erreur lors de la récupération des articles par catégorie:', error);
      return [];
    }
  }
}

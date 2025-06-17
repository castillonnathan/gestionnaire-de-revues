import { Component,} from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, getAuth } from '@angular/fire/auth';
import { initializeApp } from 'firebase/app';
import { CommonModule } from '@angular/common';

const firebaseConfig = {
apiKey: "AIzaSyC0RLGHflpYe_tqmTC3gO4sv-YAiMfDZh0",
  authDomain: "gestionnaire-de-revue.firebaseapp.com",
  projectId: "gestionnaire-de-revue",
  storageBucket: "gestionnaire-de-revue.firebasestorage.app",
  messagingSenderId: "646427250946",
  appId: "1:646427250946:web:2507cef4edaf530140721b",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

@Component({
  selector: 'app-authentification',
  standalone: true, 
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './authentification.component.html',
  styleUrl: './authentification.component.css'
})
export class AuthentificationComponent {
  authForm: FormGroup;
  isLoginMode = true;
  isLoading = false;
  showPassword = false;
  successMessage = '';
  errorMessage = '';

  constructor(private fb: FormBuilder) {
    this.authForm = this.createForm();
  }

  createForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['']
    });
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.clearMessages();
    this.authForm.reset();
    
    if (!this.isLoginMode) {
      this.authForm.get('confirmPassword')?.setValidators([
        Validators.required,
        this.passwordMatchValidator.bind(this)
      ]);
    } else {
      this.authForm.get('confirmPassword')?.clearValidators();
    }
    this.authForm.get('confirmPassword')?.updateValueAndValidity();
  }

  passwordMatchValidator(control: any) {
    const password = this.authForm?.get('password')?.value;
    return control.value === password ? null : { mismatch: true };
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.authForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  async onSubmit() {
    if (this.authForm.invalid) return;

    this.isLoading = true;
    this.clearMessages();

    const { email, password } = this.authForm.value;

    try {
      if (this.isLoginMode) {
        // Connexion avec Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        this.successMessage = 'Connexion réussie !';
        console.log('Utilisateur connecté:', userCredential.user);
      } else {
        // Inscription avec Firebase
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        this.successMessage = 'Compte créé avec succès !';
        console.log('Utilisateur créé:', userCredential.user);
      }
    } catch (error: any) {
      console.error('Erreur Firebase:', error);
      this.errorMessage = this.getErrorMessage(error.code);
    } finally {
      this.isLoading = false;
    }
  }

  async socialLogin(provider: string) {
    this.isLoading = true;
    this.clearMessages();

    try {
      let authProvider;
      if (provider === 'google') {
        authProvider = new GoogleAuthProvider();
      } else if (provider === 'facebook') {
        authProvider = new FacebookAuthProvider();
      }

      if (authProvider) {
        const result = await signInWithPopup(auth, authProvider);
        this.successMessage = `Connexion ${provider} réussie !`;
        console.log('Utilisateur connecté via', provider, ':', result.user);
      }
    } catch (error: any) {
      console.error(`Erreur connexion ${provider}:`, error);
      this.errorMessage = `Erreur de connexion ${provider}`;
    } finally {
      this.isLoading = false;
    }
  }

  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Aucun utilisateur trouvé avec cette adresse email';
      case 'auth/wrong-password':
        return 'Mot de passe incorrect';
      case 'auth/email-already-in-use':
        return 'Cette adresse email est déjà utilisée';
      case 'auth/weak-password':
        return 'Le mot de passe est trop faible';
      case 'auth/invalid-email':
        return 'Adresse email invalide';
      case 'auth/too-many-requests':
        return 'Trop de tentatives. Veuillez réessayer plus tard';
      default:
        return 'Une erreur est survenue. Veuillez réessayer';
    }
  }

  clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
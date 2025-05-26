import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormControl } from '@angular/forms';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <label>
        Email:
        <input type="email" [formControl]="emailControl">
      </label>
      <br>
      <label>
        Mot de passe:
        <input type="password" [formControl]="passwordControl">
      </label>
      <br>
      <button type="submit">Se connecter</button>
    </form>
  `
})
export class LoginFormComponent {
  private formBuilder = inject(FormBuilder)
  emailControl = new FormControl('');
  passwordControl = new FormControl('');
  form = this.formBuilder.group({
      email: this.emailControl,
      password: this.passwordControl
  });

  onSubmit() {
    // La soumission du formulaire est gérée ici
  }
}
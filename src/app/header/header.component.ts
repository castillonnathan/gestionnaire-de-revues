import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  title: string = 'Gestion des Documents';
  subtitle: string = 'Système de gestion documentaire';
  
  private routerSubscription: Subscription = new Subscription();

  constructor(private router: Router) {}

  ngOnInit() {
    // Mise à jour initiale
    this.updateHeaderFromRoute(this.router.url);
    
    // Permet de savoir quand effectuer les changements de route
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateHeaderFromRoute(event.url);
      });
  }

  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
  }

  private updateHeaderFromRoute(url: string) {
    // Enlève tout ce qui contient ? et #
    const cleanUrl = url.split('?')[0].split('#')[0];
    
    // Conditions pour les paramètres
    if (cleanUrl.includes('/revue')) {
      this.title = 'Gestion des Revues';
      this.subtitle = 'Gérez vos revues comme un pro';
    } else if (cleanUrl.includes('/article')) {
      this.title = 'Gestion des Articles';
      this.subtitle = 'Gérez vos articles tel un prodige';
    } else if (cleanUrl.includes('/a-propos')) {
      this.title = 'À Propos';
      this.subtitle = 'Informations sur l\'application';
    } else if (cleanUrl.includes('/authentification')) {
      this.title = 'Connexion';
      this.subtitle = 'Connectez vous';
    } else {
      // Valeurs par défaut pour toutes les autres pages
      this.title = 'Bienvenue';
      this.subtitle = 'Sur le gestionnaire de revue';
      }
    }
  }

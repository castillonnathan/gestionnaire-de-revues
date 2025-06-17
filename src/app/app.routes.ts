import { AuthentificationComponent } from './authentification/authentification.component';
import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { RevueComponent } from './revue/revue.component';
import { ArticleComponent } from './article/article.component';
import { AProposComponent } from './a-propos/a-propos.component';

export const routes: 
    Routes = [{
    path: '',
    component: HomeComponent,
    pathMatch: 'full'
}, {
    path: 'home',
    component: HomeComponent
}, {
    path: 'revue',
    component: RevueComponent
}, {
    path: 'authentification',
    component: AuthentificationComponent
}, {
    path:'article',
    component: ArticleComponent
}, {
    path: 'a-propos',
    component: AProposComponent
}];

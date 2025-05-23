import { Routes } from '@angular/router';
import { RecherchesComponent } from './recherches/recherches.component';
import { HomeComponent } from './home/home.component';
import { RevueComponent } from './revue/revue.component';
import { ArticleComponent } from './article/article.component';
import { AProposComponent } from './a-propos/a-propos.component';

export const routes: Routes = [{
    path: 'recherches',
    component: RecherchesComponent
}, {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
}, {
    path: 'home',
    component: RevueComponent
}, {
    path: 'revue',
    component: HomeComponent
}, {
    path:'article',
    component: ArticleComponent
}, {
    path: 'a-propos',
    component: AProposComponent
}];

import { Routes } from '@angular/router';
import { RecherchesComponent } from './recherches/recherches.component';
import { HomeComponent } from './home/home.component';
import { RevueComponent } from './revue/revue.component';
import { ArticleComponent } from './article/article.component';
import { AProposComponent } from './a-propos/a-propos.component';
import { RevueFormComponent } from './test/test.component';

export const routes: Routes = [{
    path: 'recherches',
    component: RecherchesComponent
}, {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
}, {
    path: 'home',
    component: HomeComponent
}, {
    path: 'revue',
    component: RevueComponent
}, {
    path:'article',
    component: ArticleComponent
}, {
    path: 'a-propos',
    component: AProposComponent
}, {
    path: 'test',
    component: RevueFormComponent
}];

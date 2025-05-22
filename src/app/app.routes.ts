import { Routes } from '@angular/router';
import { RecherchesComponent } from './recherches/recherches.component';
import { HomeComponent } from './home/home.component';

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
}];

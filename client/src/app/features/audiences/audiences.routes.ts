import { Routes } from '@angular/router';

export const AUDIENCES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./audience-list.component').then(m => m.AudienceListComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('./audience-form.component').then(m => m.AudienceFormComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./audience-form.component').then(m => m.AudienceFormComponent),
  },
];
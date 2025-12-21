import { Routes } from '@angular/router';

export const CAMPAIGNS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./campaign-list.component').then(m => m.CampaignListComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('./campaign-wizard.component').then(m => m.CampaignWizardComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./campaign-detail.component').then(m => m.CampaignDetailComponent),
  },
];
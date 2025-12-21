import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'brand',
    loadComponent: () => import('./features/brand/brand-guide.component').then(m => m.BrandGuideComponent),
    canActivate: [authGuard],
  },
  {
    path: 'audiences',
    loadChildren: () => import('./features/audiences/audiences.routes').then(m => m.AUDIENCES_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'campaigns',
    loadChildren: () => import('./features/campaigns/campaigns.routes').then(m => m.CAMPAIGNS_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
import { Routes } from '@angular/router';
import { noAuthGuard } from '../../core/guards/auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login.component').then(m => m.LoginComponent),
    canActivate: [noAuthGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./register.component').then(m => m.RegisterComponent),
    canActivate: [noAuthGuard],
  },
];
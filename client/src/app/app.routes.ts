import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CampaignWizardComponent } from './features/campaigns/campaign-wizard.component';
import { CampaignDetailComponent } from './features/campaigns/campaign-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'campaigns/new', component: CampaignWizardComponent },
  { path: 'campaigns/:id', component: CampaignDetailComponent },
  { path: '**', redirectTo: '/login' }
];

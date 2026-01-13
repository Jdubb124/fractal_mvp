import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CampaignWizardComponent } from './features/campaigns/campaign-wizard.component';
import { CampaignDetailComponent } from './features/campaigns/campaign-detail.component';
import { CampaignsListComponent } from './features/campaigns/campaigns-list.component';
import { AudiencesListComponent } from './features/audiences/audiences-list.component';
import { DashboardComponent as BrandGuideComponent } from './features/brand-guide/brand-guide.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'campaigns', component: CampaignsListComponent },
  { path: 'campaigns/new', component: CampaignWizardComponent },
  { path: 'campaigns/:id', component: CampaignDetailComponent },
  { path: 'audiences', component: AudiencesListComponent },
  { path: 'brand', component: BrandGuideComponent },
  { path: '**', redirectTo: '/login' }
];

import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CampaignWizardComponent } from './features/campaigns/campaign-wizard.component';
import { CampaignDetailComponent } from './features/campaigns/campaign-detail.component';
import { CampaignsListComponent } from './features/campaigns/campaigns-list.component';
import { AudiencesListComponent } from './features/audiences/audiences-list.component';
import { BrandGuideComponent } from './features/brand-guide/brand-guide.component';
import { EmailBuilderComponent } from './features/email-builder';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'campaigns', component: CampaignsListComponent, canActivate: [authGuard] },
  { path: 'campaigns/new', component: CampaignWizardComponent, canActivate: [authGuard] },
  { path: 'campaigns/build/email', component: EmailBuilderComponent, canActivate: [authGuard] },
  { path: 'campaigns/:id', component: CampaignDetailComponent, canActivate: [authGuard] },
  { path: 'audiences', component: AudiencesListComponent, canActivate: [authGuard] },
  { path: 'brand', component: BrandGuideComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/dashboard' }
];

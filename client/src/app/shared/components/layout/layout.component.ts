import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-bg-primary">
      <!-- Header -->
      <header class="bg-bg-card border-b border-border-color">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center gap-8">
              <a routerLink="/dashboard" class="text-xl font-bold text-accent-primary">
                Fractal
              </a>
              <nav class="hidden md:flex items-center gap-6">
                <a routerLink="/dashboard" routerLinkActive="text-accent-primary" class="text-sm text-text-secondary hover:text-accent-primary transition-colors">
                  Dashboard
                </a>
                <a routerLink="/campaigns" routerLinkActive="text-accent-primary" class="text-sm text-text-secondary hover:text-accent-primary transition-colors">
                  Campaigns
                </a>
                <a routerLink="/audiences" routerLinkActive="text-accent-primary" class="text-sm text-text-secondary hover:text-accent-primary transition-colors">
                  Audiences
                </a>
                <a routerLink="/brand" routerLinkActive="text-accent-primary" class="text-sm text-text-secondary hover:text-accent-primary transition-colors">
                  Brand Guide
                </a>
              </nav>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-sm text-text-secondary">
                {{ authService.currentUser()?.name || 'User' }}
              </span>
              <button 
                (click)="authService.logout()" 
                class="text-sm text-text-secondary hover:text-accent-primary transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main>
        <ng-content></ng-content>
      </main>
    </div>
  `,
})
export class LayoutComponent {
  authService = inject(AuthService);
}


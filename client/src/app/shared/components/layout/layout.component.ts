import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-bg-dark">
      <!-- Header -->
      <header class="h-16 bg-bg-panel border-b border-border-color fixed top-0 left-0 right-0 z-50">
        <div class="h-full px-6 flex items-center justify-between">
          <!-- Logo -->
          <a routerLink="/dashboard" class="flex items-center gap-3">
            <div class="w-9 h-9 bg-gradient-to-br from-accent-primary via-accent-secondary to-channel rounded-md flex items-center justify-center">
              <span class="text-white font-mono font-bold text-lg">F</span>
            </div>
            <span class="text-xl font-bold text-gradient">Fractal</span>
          </a>

          <!-- Navigation -->
          <nav class="hidden md:flex items-center gap-1">
            <a
              routerLink="/dashboard"
              routerLinkActive="bg-bg-hover text-text-primary"
              class="px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              Dashboard
            </a>
            <a
              routerLink="/campaigns"
              routerLinkActive="bg-bg-hover text-text-primary"
              class="px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              Campaigns
            </a>
            <a
              routerLink="/audiences"
              routerLinkActive="bg-bg-hover text-text-primary"
              class="px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              Audiences
            </a>
            <a
              routerLink="/brand"
              routerLinkActive="bg-bg-hover text-text-primary"
              class="px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              Brand Guide
            </a>
          </nav>

          <!-- User Menu -->
          <div class="flex items-center gap-4">
            <div class="text-sm text-text-secondary">
              {{ authService.currentUser()?.name }}
            </div>
            <button
              (click)="authService.logout()"
              class="px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="pt-16">
        <ng-content></ng-content>
      </main>
    </div>
  `,
})
export class LayoutComponent {
  authService = inject(AuthService);
}
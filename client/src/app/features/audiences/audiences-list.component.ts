import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { AudienceService } from '../../core/services/audience.service';

@Component({
  selector: 'app-audiences-list',
  standalone: true,
  imports: [CommonModule, RouterModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="p-8 max-w-7xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold text-text-primary mb-2">Audiences</h1>
            <p class="text-text-secondary">
              Define and manage your target audience segments.
            </p>
          </div>
          <a routerLink="/campaigns/new" class="btn btn-primary">
            + New Audience
          </a>
        </div>

        <!-- Audiences List -->
        <div class="card">
          @if (audienceService.audiences().length === 0) {
            <div class="text-center py-12">
              <div class="w-16 h-16 bg-bg-card rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-2xl">👥</span>
              </div>
              <h3 class="text-lg font-medium text-text-primary mb-2">No audiences yet</h3>
              <p class="text-text-secondary text-sm mb-4">
                Create audience segments to target your campaigns effectively.
              </p>
              <a routerLink="/campaigns/new" class="btn btn-primary">
                Create Audience
              </a>
            </div>
          } @else {
            <div class="space-y-3">
              @for (audience of audienceService.audiences(); track audience._id) {
                <div class="flex items-center justify-between p-4 bg-bg-card rounded-lg hover:bg-bg-hover transition-colors">
                  <div class="flex items-center gap-4">
                    <div class="level-badge level-segment">
                      ◇ Audience
                    </div>
                    <div>
                      <h3 class="font-medium text-text-primary">{{ audience.name }}</h3>
                      <p class="text-sm text-text-muted">
                        {{ audience.demographics?.ageRange || 'All ages' }} ·
                        {{ audience.demographics?.location || 'All locations' }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-text-muted text-sm">
                      {{ audience.painPoints?.length || 0 }} pain points
                    </span>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </app-layout>
  `,
})
export class AudiencesListComponent implements OnInit {
  audienceService = inject(AudienceService);

  ngOnInit(): void {
    this.audienceService.getAudiences().subscribe();
  }
}

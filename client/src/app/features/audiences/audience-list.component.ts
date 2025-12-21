import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { AudienceService, Audience } from '../../core/services/audience.service';

@Component({
  selector: 'app-audience-list',
  standalone: true,
  imports: [CommonModule, RouterModule, LayoutComponent, LoadingComponent],
  template: `
    <app-layout>
      <div class="p-8 max-w-7xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold text-text-primary mb-2">Audiences</h1>
            <p class="text-text-secondary">
              Define and manage your target audience segments for personalized campaigns.
            </p>
          </div>
          <a routerLink="/audiences/new" class="btn btn-primary">
            + New Audience
          </a>
        </div>

        <!-- Audience Grid -->
        @if (audienceService.isLoading()) {
          <app-loading text="Loading audiences..."></app-loading>
        } @else if (audienceService.audiences().length === 0) {
          <div class="card text-center py-16">
            <div class="w-20 h-20 bg-bg-card rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-3xl">👥</span>
            </div>
            <h3 class="text-xl font-medium text-text-primary mb-2">No audiences yet</h3>
            <p class="text-text-secondary mb-6 max-w-md mx-auto">
              Create audience segments to personalize your campaign messaging for different customer groups.
            </p>
            <a routerLink="/audiences/new" class="btn btn-primary">
              Create Your First Audience
            </a>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (audience of audienceService.audiences(); track audience._id) {
              <div class="card card-hover">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-segment/15 flex items-center justify-center">
                      <span class="text-segment">◎</span>
                    </div>
                    <div>
                      <h3 class="font-semibold text-text-primary">{{ audience.name }}</h3>
                      <span 
                        class="text-xs px-2 py-0.5 rounded"
                        [class]="getPropensityClass(audience.propensityLevel)"
                      >
                        {{ audience.propensityLevel }} Propensity
                      </span>
                    </div>
                  </div>
                  <button 
                    (click)="toggleStatus(audience)"
                    class="text-xs px-2 py-1 rounded"
                    [class]="audience.isActive ? 'bg-success/20 text-success' : 'bg-text-muted/20 text-text-muted'"
                  >
                    {{ audience.isActive ? 'Active' : 'Inactive' }}
                  </button>
                </div>

                @if (audience.description) {
                  <p class="text-sm text-text-secondary mb-4 line-clamp-2">
                    {{ audience.description }}
                  </p>
                }

                <!-- Quick Info -->
                <div class="space-y-2 mb-4">
                  @if (audience.demographics?.income || audience.demographics?.location?.length) {
                    <div class="flex items-center gap-2 text-sm text-text-muted">
                      <span>📍</span>
                      <span>{{ getDemographicSummary(audience) }}</span>
                    </div>
                  }
                  @if (audience.painPoints?.length) {
                    <div class="flex items-center gap-2 text-sm text-text-muted">
                      <span>🎯</span>
                      <span>{{ audience.painPoints.length }} pain points defined</span>
                    </div>
                  }
                  @if (audience.keyMotivators?.length) {
                    <div class="flex items-center gap-2 text-sm text-text-muted">
                      <span>💡</span>
                      <span>{{ audience.keyMotivators.length }} motivators</span>
                    </div>
                  }
                </div>

                <!-- Actions -->
                <div class="flex gap-2 pt-4 border-t border-border-color">
                  <a 
                    [routerLink]="['/audiences', audience._id]"
                    class="btn btn-secondary flex-1 text-center text-sm"
                  >
                    Edit
                  </a>
                  <button 
                    (click)="deleteAudience(audience)"
                    class="btn btn-secondary text-error text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </app-layout>
  `,
})
export class AudienceListComponent implements OnInit {
  audienceService = inject(AudienceService);

  ngOnInit(): void {
    this.audienceService.getAudiences().subscribe();
  }

  getPropensityClass(level: string): string {
    const classes: Record<string, string> = {
      High: 'bg-success/20 text-success',
      Medium: 'bg-warning/20 text-warning',
      Low: 'bg-text-muted/20 text-text-muted',
    };
    return classes[level] || 'bg-bg-card text-text-secondary';
  }

  getDemographicSummary(audience: Audience): string {
    const parts: string[] = [];
    if (audience.demographics?.income) {
      parts.push(audience.demographics.income);
    }
    if (audience.demographics?.location?.length) {
      parts.push(audience.demographics.location.slice(0, 2).join(', '));
    }
    return parts.join(' · ') || 'No demographics set';
  }

  toggleStatus(audience: Audience): void {
    this.audienceService.toggleAudienceStatus(audience._id).subscribe();
  }

  deleteAudience(audience: Audience): void {
    if (confirm(`Are you sure you want to delete "${audience.name}"?`)) {
      this.audienceService.deleteAudience(audience._id).subscribe();
    }
  }
}
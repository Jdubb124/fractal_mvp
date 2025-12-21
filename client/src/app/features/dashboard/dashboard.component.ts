import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { AuthService } from '../../core/services/auth.service';
import { BrandService } from '../../core/services/brand.service';
import { AudienceService } from '../../core/services/audience.service';
import { CampaignService } from '../../core/services/campaign.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LayoutComponent, LoadingComponent],
  template: `
    <app-layout>
      <div class="p-8 max-w-7xl mx-auto">
        <!-- Welcome Section -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-text-primary mb-2">
            Welcome back, {{ authService.currentUser()?.name?.split(' ')[0] || 'there' }}!
          </h1>
          <p class="text-text-secondary">
            Here's an overview of your campaign orchestration workspace.
          </p>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div class="stat-card card-hover cursor-pointer" routerLink="/campaigns">
            <div class="stat-value text-campaign">{{ campaignService.campaignCount() }}</div>
            <div class="stat-label">Campaigns</div>
          </div>
          <div class="stat-card card-hover cursor-pointer" routerLink="/audiences">
            <div class="stat-value text-segment">{{ audienceService.audienceCount() }}</div>
            <div class="stat-label">Audiences</div>
          </div>
          <div class="stat-card">
            <div class="stat-value text-channel">2</div>
            <div class="stat-label">Channels Available</div>
          </div>
          <div class="stat-card card-hover cursor-pointer" routerLink="/brand">
            <div class="stat-value" [class]="brandService.hasBrandGuide() ? 'text-success' : 'text-warning'">
              {{ brandService.hasBrandGuide() ? '✓' : '!' }}
            </div>
            <div class="stat-label">Brand Guide</div>
          </div>
        </div>

        <!-- Setup Checklist -->
        @if (!brandService.hasBrandGuide() || audienceService.audienceCount() === 0) {
          <div class="card mb-8">
            <h2 class="text-lg font-semibold mb-4">🚀 Get Started</h2>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <div 
                  class="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  [class]="brandService.hasBrandGuide() ? 'bg-success/20 text-success' : 'bg-bg-card text-text-muted'"
                >
                  {{ brandService.hasBrandGuide() ? '✓' : '1' }}
                </div>
                <a 
                  routerLink="/brand" 
                  class="text-sm hover:text-accent-primary transition-colors"
                  [class]="brandService.hasBrandGuide() ? 'text-text-secondary line-through' : 'text-text-primary'"
                >
                  Set up your brand guide
                </a>
              </div>
              <div class="flex items-center gap-3">
                <div 
                  class="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  [class]="audienceService.audienceCount() > 0 ? 'bg-success/20 text-success' : 'bg-bg-card text-text-muted'"
                >
                  {{ audienceService.audienceCount() > 0 ? '✓' : '2' }}
                </div>
                <a 
                  routerLink="/audiences" 
                  class="text-sm hover:text-accent-primary transition-colors"
                  [class]="audienceService.audienceCount() > 0 ? 'text-text-secondary line-through' : 'text-text-primary'"
                >
                  Create your first audience segment
                </a>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded-full bg-bg-card flex items-center justify-center text-xs text-text-muted">
                  3
                </div>
                <a routerLink="/campaigns/new" class="text-sm text-text-primary hover:text-accent-primary transition-colors">
                  Launch your first campaign
                </a>
              </div>
            </div>
          </div>
        }

        <!-- Recent Campaigns -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Recent Campaigns</h2>
            <a routerLink="/campaigns/new" class="btn btn-primary text-sm">
              + New Campaign
            </a>
          </div>

          @if (campaignService.isLoading()) {
            <app-loading size="sm" text="Loading campaigns..."></app-loading>
          } @else if (campaignService.campaigns().length === 0) {
            <div class="text-center py-12">
              <div class="w-16 h-16 bg-bg-card rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-2xl">📢</span>
              </div>
              <h3 class="text-lg font-medium text-text-primary mb-2">No campaigns yet</h3>
              <p class="text-text-secondary text-sm mb-4">
                Create your first campaign to start generating AI-powered marketing content.
              </p>
              <a routerLink="/campaigns/new" class="btn btn-primary">
                Create Campaign
              </a>
            </div>
          } @else {
            <div class="space-y-3">
              @for (campaign of campaignService.campaigns().slice(0, 5); track campaign._id) {
                <a 
                  [routerLink]="['/campaigns', campaign._id]"
                  class="flex items-center justify-between p-4 bg-bg-card rounded-lg hover:bg-bg-hover transition-colors"
                >
                  <div class="flex items-center gap-4">
                    <div class="level-badge level-campaign">
                      ◈ Campaign
                    </div>
                    <div>
                      <h3 class="font-medium text-text-primary">{{ campaign.name }}</h3>
                      <p class="text-sm text-text-muted">
                        {{ campaign.segments.length }} segments · 
                        {{ getEnabledChannelCount(campaign) }} channels
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span 
                      class="px-2 py-1 rounded text-xs font-medium"
                      [class]="getStatusClass(campaign.status)"
                    >
                      {{ campaign.status }}
                    </span>
                    <span class="text-text-muted">→</span>
                  </div>
                </a>
              }
            </div>
            @if (campaignService.campaigns().length > 5) {
              <div class="mt-4 text-center">
                <a routerLink="/campaigns" class="text-sm text-accent-primary hover:underline">
                  View all campaigns →
                </a>
              </div>
            }
          }
        </div>
      </div>
    </app-layout>
  `,
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  brandService = inject(BrandService);
  audienceService = inject(AudienceService);
  campaignService = inject(CampaignService);

  ngOnInit(): void {
    if (!this.brandService.isLoaded()) {
      this.brandService.getBrandGuide().subscribe();
    }
    this.audienceService.getAudiences().subscribe();
    this.campaignService.getCampaigns({ limit: 5 }).subscribe();
  }

  getEnabledChannelCount(campaign: any): number {
    return campaign.channels?.filter((c: any) => c.enabled).length || 0;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      draft: 'bg-warning/20 text-warning',
      generated: 'bg-accent-primary/20 text-accent-primary',
      approved: 'bg-success/20 text-success',
      archived: 'bg-text-muted/20 text-text-muted',
    };
    return classes[status] || 'bg-bg-hover text-text-secondary';
  }
}
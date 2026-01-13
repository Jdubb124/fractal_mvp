import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { CampaignService } from '../../core/services/campaign.service';

@Component({
  selector: 'app-campaigns-list',
  standalone: true,
  imports: [CommonModule, RouterModule, LayoutComponent, LoadingComponent],
  template: `
    <app-layout>
      <div class="p-8 max-w-7xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold text-text-primary mb-2">Campaigns</h1>
            <p class="text-text-secondary">
              Manage and track all your marketing campaigns.
            </p>
          </div>
          <a routerLink="/campaigns/new" class="btn btn-primary">
            + New Campaign
          </a>
        </div>

        <!-- Campaigns List -->
        <div class="card">
          @if (campaignService.isLoading()) {
            <app-loading size="md" text="Loading campaigns..."></app-loading>
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
              @for (campaign of campaignService.campaigns(); track campaign._id) {
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
          }
        </div>
      </div>
    </app-layout>
  `,
})
export class CampaignsListComponent implements OnInit {
  campaignService = inject(CampaignService);

  ngOnInit(): void {
    this.campaignService.getCampaigns({}).subscribe();
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

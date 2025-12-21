import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { CampaignService, Campaign } from '../../core/services/campaign.service';

@Component({
  selector: 'app-campaign-list',
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
              Create and manage AI-powered marketing campaigns across channels.
            </p>
          </div>
          <a routerLink="/campaigns/new" class="btn btn-primary">
            + New Campaign
          </a>
        </div>

        <!-- Campaign List -->
        @if (campaignService.isLoading()) {
          <app-loading text="Loading campaigns..."></app-loading>
        } @else if (campaignService.campaigns().length === 0) {
          <div class="card text-center py-16">
            <div class="w-20 h-20 bg-bg-card rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-3xl">📢</span>
            </div>
            <h3 class="text-xl font-medium text-text-primary mb-2">No campaigns yet</h3>
            <p class="text-text-secondary mb-6 max-w-md mx-auto">
              Create your first campaign to start generating AI-powered content for email and Meta ads.
            </p>
            <a routerLink="/campaigns/new" class="btn btn-primary">
              Create Your First Campaign
            </a>
          </div>
        } @else {
          <div class="space-y-4">
            @for (campaign of campaignService.campaigns(); track campaign._id) {
              <a 
                [routerLink]="['/campaigns', campaign._id]"
                class="card card-hover block"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-lg bg-campaign/15 flex items-center justify-center">
                      <span class="text-campaign text-xl">◈</span>
                    </div>
                    <div>
                      <h3 class="font-semibold text-text-primary text-lg">{{ campaign.name }}</h3>
                      <p class="text-sm text-text-muted">
                        {{ campaign.segments.length }} segments · 
                        {{ getEnabledChannelCount(campaign) }} channels ·
                        Created {{ formatDate(campaign.createdAt) }}
                      </p>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-4">
                    <!-- Stats -->
                    <div class="hidden md:flex items-center gap-6 text-sm">
                      <div class="text-center">
                        <div class="font-mono font-bold text-segment">{{ campaign.segments.length }}</div>
                        <div class="text-text-muted text-xs">Segments</div>
                      </div>
                      <div class="text-center">
                        <div class="font-mono font-bold text-channel">{{ getEnabledChannelCount(campaign) }}</div>
                        <div class="text-text-muted text-xs">Channels</div>
                      </div>
                    </div>

                    <!-- Status -->
                    <span 
                      class="px-3 py-1 rounded-full text-xs font-medium"
                      [class]="getStatusClass(campaign.status)"
                    >
                      {{ campaign.status }}
                    </span>

                    <span class="text-text-muted">→</span>
                  </div>
                </div>

                @if (campaign.objective) {
                  <p class="text-text-secondary text-sm mt-3 line-clamp-1">
                    {{ campaign.objective }}
                  </p>
                }

                <!-- Channel Badges -->
                <div class="flex items-center gap-2 mt-3">
                  @for (channel of campaign.channels; track channel.type) {
                    @if (channel.enabled) {
                      <span class="px-2 py-1 bg-bg-card rounded text-xs text-text-secondary">
                        {{ channel.type === 'email' ? '📧 Email' : '📱 Meta Ads' }}
                      </span>
                    }
                  }
                </div>
              </a>
            }
          </div>
        }
      </div>
    </app-layout>
  `,
})
export class CampaignListComponent implements OnInit {
  campaignService = inject(CampaignService);

  ngOnInit(): void {
    this.campaignService.getCampaigns().subscribe();
  }

  getEnabledChannelCount(campaign: Campaign): number {
    return campaign.channels?.filter(c => c.enabled).length || 0;
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

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
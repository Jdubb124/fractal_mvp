import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { CampaignService, Campaign, Asset } from '../../core/services/campaign.service';

@Component({
  selector: 'app-campaign-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, LayoutComponent, LoadingComponent],
  template: `
    <app-layout>
      <div class="p-8 max-w-7xl mx-auto">
        @if (campaignService.isLoading()) {
          <app-loading text="Loading campaign..."></app-loading>
        } @else if (campaign()) {
          <!-- Header -->
          <div class="mb-8">
            <a routerLink="/campaigns" class="text-sm text-text-muted hover:text-accent-primary mb-4 inline-block">
              ← Back to Campaigns
            </a>
            <div class="flex items-start justify-between">
              <div>
                <div class="flex items-center gap-3 mb-2">
                  <h1 class="text-2xl font-bold text-text-primary">{{ campaign()?.name }}</h1>
                  <span class="px-3 py-1 rounded-full text-xs font-medium" [class]="getStatusClass(campaign()?.status || '')">
                    {{ campaign()?.status }}
                  </span>
                </div>
                @if (campaign()?.objective) {
                  <p class="text-text-secondary">{{ campaign()?.objective }}</p>
                }
              </div>
              <div class="flex gap-3">
                @if (campaign()?.status === 'draft') {
                  <button (click)="generateAssets()" [disabled]="campaignService.isGenerating()" class="btn btn-primary">
                    @if (campaignService.isGenerating()) {
                      <span class="flex items-center gap-2">
                        <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Generating...
                      </span>
                    } @else {
                      🤖 Generate Content
                    }
                  </button>
                }
                <button (click)="exportCampaign()" class="btn btn-secondary">📥 Export</button>
              </div>
            </div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-4 gap-4 mb-8">
            <div class="stat-card">
              <div class="stat-value text-segment">{{ campaign()?.segments?.length || 0 }}</div>
              <div class="stat-label">Segments</div>
            </div>
            <div class="stat-card">
              <div class="stat-value text-channel">{{ getEnabledChannelCount() }}</div>
              <div class="stat-label">Channels</div>
            </div>
            <div class="stat-card">
              <div class="stat-value text-asset">{{ assets().length }}</div>
              <div class="stat-label">Assets Generated</div>
            </div>
            <div class="stat-card">
              <div class="stat-value text-version">{{ getTotalVersions() }}</div>
              <div class="stat-label">Content Versions</div>
            </div>
          </div>

          <!-- Assets Grid -->
          <div class="card">
            <h2 class="text-lg font-semibold mb-4">Generated Assets</h2>

            @if (assets().length === 0) {
              <div class="text-center py-12">
                <div class="w-16 h-16 bg-bg-card rounded-full flex items-center justify-center mx-auto mb-4">
                  <span class="text-2xl">🤖</span>
                </div>
                <h3 class="text-lg font-medium text-text-primary mb-2">No assets generated yet</h3>
                <p class="text-text-secondary text-sm mb-4">
                  Click "Generate Content" to create AI-powered content for all your segments and channels.
                </p>
              </div>
            } @else {
              <div class="space-y-6">
                @for (asset of assets(); track asset._id) {
                  <div class="bg-bg-card rounded-lg p-6">
                    <!-- Asset Header -->
                    <div class="flex items-center justify-between mb-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                             [class]="asset.channelType === 'email' ? 'bg-channel/15' : 'bg-asset/15'">
                          <span>{{ asset.channelType === 'email' ? '📧' : '📱' }}</span>
                        </div>
                        <div>
                          <h3 class="font-medium text-text-primary">{{ asset.name }}</h3>
                          <div class="text-sm text-text-muted">
                            {{ asset.channelType === 'email' ? 'Email' : 'Meta Ad' }} · {{ asset.versions.length }} versions
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Versions -->
                    <div class="space-y-4">
                      @for (version of asset.versions; track version._id) {
                        <div class="bg-bg-panel rounded-lg p-4 border border-border-color">
                          <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-2">
                              <span class="level-badge level-version">{{ version.versionName }}</span>
                              <span class="px-2 py-0.5 rounded text-xs" [class]="getVersionStatusClass(version.status)">
                                {{ version.status }}
                              </span>
                            </div>
                            <button (click)="approveVersion(asset, version)"
                                    [disabled]="version.status === 'approved'"
                                    class="text-xs text-accent-primary hover:underline disabled:opacity-50">
                              {{ version.status === 'approved' ? '✓ Approved' : 'Approve' }}
                            </button>
                          </div>

                          <!-- Email Content -->
                          @if (asset.channelType === 'email') {
                            <div class="space-y-3 text-sm">
                              <div>
                                <span class="text-text-muted">Subject: </span>
                                <span class="text-text-primary">{{ version.content.subjectLine }}</span>
                              </div>
                              <div>
                                <span class="text-text-muted">Preheader: </span>
                                <span class="text-text-secondary">{{ version.content.preheader }}</span>
                              </div>
                              <div>
                                <span class="text-text-muted">Headline: </span>
                                <span class="text-text-primary font-medium">{{ version.content.headline }}</span>
                              </div>
                              <div>
                                <span class="text-text-muted">Body: </span>
                                <p class="text-text-secondary mt-1">{{ version.content.bodyCopy }}</p>
                              </div>
                              <div>
                                <span class="text-text-muted">CTA: </span>
                                <span class="px-3 py-1 bg-accent-primary/20 text-accent-primary rounded text-xs">
                                  {{ version.content.ctaText }}
                                </span>
                              </div>
                            </div>
                          }

                          <!-- Meta Ad Content -->
                          @if (asset.channelType === 'meta_ads') {
                            <div class="space-y-3 text-sm">
                              <div>
                                <span class="text-text-muted">Primary Text: </span>
                                <p class="text-text-primary">{{ version.content.primaryText }}</p>
                              </div>
                              <div>
                                <span class="text-text-muted">Headline: </span>
                                <span class="text-text-primary font-medium">{{ version.content.headline }}</span>
                              </div>
                              <div>
                                <span class="text-text-muted">Description: </span>
                                <span class="text-text-secondary">{{ version.content.description }}</span>
                              </div>
                              <div>
                                <span class="text-text-muted">CTA Button: </span>
                                <span class="px-3 py-1 bg-accent-primary text-white rounded text-xs">
                                  {{ version.content.ctaButton }}
                                </span>
                              </div>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </app-layout>
  `,
})
export class CampaignDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  campaignService = inject(CampaignService);

  campaign = signal<Campaign | null>(null);
  assets = signal<Asset[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCampaign(id);
    }
  }

  loadCampaign(id: string): void {
    this.campaignService.getCampaign(id).subscribe({
      next: (response) => {
        this.campaign.set(response.data.campaign);
        this.assets.set(response.data.assets || []);
      },
    });
  }

  getEnabledChannelCount(): number {
    return this.campaign()?.channels?.filter(c => c.enabled).length || 0;
  }

  getTotalVersions(): number {
    return this.assets().reduce((sum, asset) => sum + asset.versions.length, 0);
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

  getVersionStatusClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'bg-text-muted/20 text-text-muted',
      generated: 'bg-accent-primary/20 text-accent-primary',
      edited: 'bg-warning/20 text-warning',
      approved: 'bg-success/20 text-success',
    };
    return classes[status] || 'bg-bg-card text-text-secondary';
  }

  generateAssets(): void {
    const id = this.campaign()?._id;
    if (!id) return;

    this.campaignService.generateAssets(id).subscribe({
      next: (response) => {
        this.campaign.set(response.data.campaign);
        this.assets.set(response.data.assets);
      },
    });
  }

  approveVersion(asset: Asset, version: any): void {
    console.log('Approve version:', asset._id, version._id);
    // TODO: Call asset service to approve
  }

  exportCampaign(): void {
    const id = this.campaign()?._id;
    if (!id) return;

    this.campaignService.getCampaign(id).subscribe({
      next: (response) => {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.campaign()?.name || 'campaign'}-export.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }
}
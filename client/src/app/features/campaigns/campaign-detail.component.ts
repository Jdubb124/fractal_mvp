import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { CampaignService, Campaign, Asset, CampaignDetailResponse } from '../../core/services/campaign.service';
import { EmailViewerComponent } from '../email-exporter/components/email-viewer.component';
import { EmailExporterService } from '../email-exporter/services/email.service';
import { EmailAsset, EmailTemplate, ExportFormat, TEMPLATE_LABELS } from '../email-exporter/models/email.types';
import { AssetGalleryComponent } from './components/asset-gallery';
import { AudienceService } from '../../core/services/audience.service';
import { RegenerateVersionEvent, ApproveVersionEvent } from './models/asset-gallery.types';

@Component({
  selector: 'app-campaign-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LayoutComponent, LoadingComponent, EmailViewerComponent, AssetGalleryComponent],
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

          <!-- Tabs -->
          <div class="flex gap-1 mb-6 border-b border-border-color">
            <button
              (click)="activeTab.set('assets')"
              class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
              [class.border-accent-primary]="activeTab() === 'assets'"
              [class.text-accent-primary]="activeTab() === 'assets'"
              [class.border-transparent]="activeTab() !== 'assets'"
              [class.text-text-secondary]="activeTab() !== 'assets'"
              [class.hover:text-text-primary]="activeTab() !== 'assets'"
            >
              📝 Content Assets
            </button>
            <button
              (click)="activeTab.set('emails')"
              class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
              [class.border-accent-primary]="activeTab() === 'emails'"
              [class.text-accent-primary]="activeTab() === 'emails'"
              [class.border-transparent]="activeTab() !== 'emails'"
              [class.text-text-secondary]="activeTab() !== 'emails'"
              [class.hover:text-text-primary]="activeTab() !== 'emails'"
            >
              ✉️ Email HTML ({{ emailAssets().length }})
            </button>
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

          <!-- Content Assets Tab -->
          @if (activeTab() === 'assets') {
            @if (assets().length === 0) {
              <div class="card">
                <div class="text-center py-12">
                  <div class="w-16 h-16 bg-bg-card rounded-full flex items-center justify-center mx-auto mb-4">
                    <span class="text-2xl">🤖</span>
                  </div>
                  <h3 class="text-lg font-medium text-text-primary mb-2">No assets generated yet</h3>
                  <p class="text-text-secondary text-sm mb-4">
                    Click "Generate Content" to create AI-powered content for all your segments and channels.
                  </p>
                </div>
              </div>
            } @else {
              <app-asset-gallery
                [assets]="assets()"
                [audienceMap]="audienceMap()"
                [brandName]="brandName()"
                [primaryColor]="primaryColor()"
                (regenerateVersion)="handleRegenerate($event)"
                (approveVersion)="handleApprove($event)"
              ></app-asset-gallery>
            }
          }

          <!-- Email HTML Tab -->
          @if (activeTab() === 'emails') {
            <div class="card">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h2 class="text-lg font-semibold">Email HTML Templates</h2>
                  <p class="text-sm text-text-secondary mt-1">
                    Generate production-ready HTML emails from your content
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <!-- Template selector -->
                  <select
                    [(ngModel)]="selectedTemplate"
                    class="px-3 py-2 rounded bg-bg-input text-text-primary text-sm border border-border-color"
                  >
                    @for (template of templateOptions; track template.value) {
                      <option [value]="template.value">{{ template.label }}</option>
                    }
                  </select>
                  <button
                    (click)="generateEmailAssets()"
                    [disabled]="emailService.isGenerating() || assets().length === 0"
                    class="btn btn-primary"
                  >
                    @if (emailService.isGenerating()) {
                      <span class="flex items-center gap-2">
                        <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Generating...
                      </span>
                    } @else {
                      ✨ Generate HTML Emails
                    }
                  </button>
                  @if (emailAssets().length > 0) {
                    <button
                      (click)="bulkExportEmails()"
                      class="btn btn-secondary"
                    >
                      📦 Export All
                    </button>
                  }
                </div>
              </div>

              @if (emailAssets().length === 0) {
                <div class="text-center py-12">
                  <div class="w-16 h-16 bg-bg-card rounded-full flex items-center justify-center mx-auto mb-4">
                    <span class="text-2xl">✉️</span>
                  </div>
                  <h3 class="text-lg font-medium text-text-primary mb-2">No HTML emails generated yet</h3>
                  <p class="text-text-secondary text-sm mb-4">
                    @if (assets().length === 0) {
                      First generate content assets, then come back here to create HTML email templates.
                    } @else {
                      Click "Generate HTML Emails" to create production-ready email templates from your content.
                    }
                  </p>
                </div>
              } @else {
                <div class="flex gap-6">
                  <!-- Email Asset List -->
                  <div class="w-80 flex-shrink-0 border-r border-border-color pr-6">
                    <h3 class="text-sm font-medium text-text-primary mb-3">All Email Assets</h3>
                    <div class="space-y-2 max-h-[600px] overflow-y-auto">
                      @for (email of emailAssets(); track email._id) {
                        <button
                          (click)="selectEmailAsset(email)"
                          class="w-full p-3 rounded-lg border transition-all text-left"
                          [class.border-accent-primary]="selectedEmailAsset()?._id === email._id"
                          [class.bg-accent-primary/10]="selectedEmailAsset()?._id === email._id"
                          [class.border-border-color]="selectedEmailAsset()?._id !== email._id"
                          [class.hover:border-accent-primary/50]="selectedEmailAsset()?._id !== email._id"
                        >
                          <div class="flex items-start gap-2">
                            <span class="text-lg flex-shrink-0">📧</span>
                            <div class="flex-1 min-w-0">
                              <p class="text-sm font-medium text-text-primary truncate">
                                {{ email.audienceSnapshot.name }}
                              </p>
                              <p class="text-xs text-text-muted">
                                {{ email.versionStrategy | titlecase }} · v{{ email.versionNumber }}
                              </p>
                              <div class="flex items-center gap-1 mt-1">
                                <span
                                  class="px-1.5 py-0.5 rounded text-xs"
                                  [class.bg-success/20]="email.status === 'approved'"
                                  [class.text-success]="email.status === 'approved'"
                                  [class.bg-accent-primary/20]="email.status === 'generated'"
                                  [class.text-accent-primary]="email.status === 'generated'"
                                  [class.bg-purple-500/20]="email.status === 'edited'"
                                  [class.text-purple-400]="email.status === 'edited'"
                                >
                                  {{ email.status }}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      }
                    </div>
                  </div>

                  <!-- Email Viewer -->
                  <div class="flex-1 min-h-[700px]">
                    @if (selectedEmailAsset()) {
                      <app-email-viewer
                        [emailAsset]="selectedEmailAsset()"
                        (assetUpdated)="onEmailAssetUpdated($event)"
                        (exportRequested)="onExportRequested($event)"
                      ></app-email-viewer>
                    } @else {
                      <div class="flex items-center justify-center h-full text-text-muted">
                        Select an email from the list to preview and edit
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        }
      </div>
    </app-layout>
  `,
})
export class CampaignDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private audienceService = inject(AudienceService);
  campaignService = inject(CampaignService);
  emailService = inject(EmailExporterService);

  campaign = signal<Campaign | null>(null);
  assets = signal<Asset[]>([]);
  emailAssets = signal<EmailAsset[]>([]);
  selectedEmailAsset = signal<EmailAsset | null>(null);
  activeTab = signal<'assets' | 'emails'>('assets');
  audienceMap = signal<Map<string, string>>(new Map());
  brandName = signal<string>('Your Brand');
  primaryColor = signal<string>('#8b5cf6');

  // Email generation options
  selectedTemplate: EmailTemplate = 'minimal';
  templateOptions = Object.entries(TEMPLATE_LABELS).map(([value, label]) => ({
    value: value as EmailTemplate,
    label,
  }));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCampaign(id);
      this.loadEmailAssets(id);
      this.loadAudiences();
    }
  }

  loadCampaign(id: string): void {
    this.campaignService.getCampaign(id).subscribe({
      next: (response: CampaignDetailResponse) => {
        this.campaign.set(response.data.campaign);
        this.assets.set(response.data.assets || []);
      },
    });
  }

  loadEmailAssets(campaignId: string): void {
    this.emailService.getEmailsByCampaign(campaignId).subscribe({
      next: (assets) => {
        this.emailAssets.set(assets);
        // Auto-select first asset if available
        if (assets.length > 0 && !this.selectedEmailAsset()) {
          this.selectedEmailAsset.set(assets[0]);
        }
      },
    });
  }

  loadAudiences(): void {
    this.audienceService.getAudiences().subscribe({
      next: (response: any) => {
        const audiences = response.data?.audiences || response.audiences || response;
        const map = new Map<string, string>();
        if (Array.isArray(audiences)) {
          audiences.forEach((a: any) => map.set(a._id, a.name));
        }
        this.audienceMap.set(map);
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
      next: (response: CampaignDetailResponse) => {
        this.campaign.set(response.data.campaign);
        this.assets.set(response.data.assets || []);
      },
    });
  }

  generateEmailAssets(): void {
    const id = this.campaign()?._id;
    if (!id) return;

    const hasExisting = this.emailAssets().length > 0;

    this.emailService.generateEmails(id, this.selectedTemplate, hasExisting).subscribe({
      next: (result) => {
        this.emailAssets.set(result.emailAssets);
        if (result.emailAssets.length > 0) {
          this.selectedEmailAsset.set(result.emailAssets[0]);
        }
      },
      error: (err) => {
        console.error('Failed to generate email assets:', err);
      },
    });
  }

  selectEmailAsset(asset: EmailAsset): void {
    this.selectedEmailAsset.set(asset);
  }

  onEmailAssetUpdated(asset: EmailAsset): void {
    // Update in the list
    this.emailAssets.update((assets) =>
      assets.map((a) => (a._id === asset._id ? asset : a))
    );
    this.selectedEmailAsset.set(asset);
  }

  onExportRequested(event: { asset: EmailAsset; format: ExportFormat }): void {
    this.emailService.downloadEmail(event.asset._id, event.format);
  }

  bulkExportEmails(): void {
    const assetIds = this.emailAssets().map((a) => a._id);
    this.emailService.bulkExportEmails(assetIds, 'html', 'by_audience');
  }

  handleRegenerate(event: RegenerateVersionEvent): void {
    // Regeneration is handled inside AssetGalleryComponent
    // This handler is for any additional parent-level logic
    console.log('Regenerate requested:', event);
  }

  handleApprove(event: ApproveVersionEvent): void {
    // Approval is handled inside AssetGalleryComponent
    // This handler is for any additional parent-level logic
    console.log('Approve requested:', event);
  }

  exportCampaign(): void {
    const id = this.campaign()?._id;
    if (!id) return;

    this.campaignService.getCampaign(id).subscribe({
      next: (response: CampaignDetailResponse) => {
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

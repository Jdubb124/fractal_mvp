import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetListItemComponent } from './asset-list-item.component';
import { EmailPreviewComponent } from './email-preview.component';
import { MetaAdPreviewComponent } from './meta-ad-preview.component';
import {
  AssetGroup,
  ChannelFilter,
  RegenerateVersionEvent,
  ApproveVersionEvent,
} from '../../models/asset-gallery.types';
import { CampaignService, Asset } from '../../../../core/services/campaign.service';

@Component({
  selector: 'app-asset-gallery',
  standalone: true,
  imports: [
    CommonModule,
    AssetListItemComponent,
    EmailPreviewComponent,
    MetaAdPreviewComponent,
  ],
  template: `
    <div class="flex flex-col h-full min-h-[700px] bg-bg-primary rounded-xl border border-border-color overflow-hidden">
      <!-- Header Bar -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-border-color bg-bg-card">
        <!-- Channel Filters -->
        <div class="flex items-center gap-1 bg-bg-input rounded-lg p-1">
          <button
            (click)="channelFilter.set('all')"
            class="px-3 py-1.5 rounded text-sm font-medium transition-colors"
            [class.bg-accent-primary]="channelFilter() === 'all'"
            [class.text-white]="channelFilter() === 'all'"
            [class.text-text-secondary]="channelFilter() !== 'all'"
          >
            All
          </button>
          <button
            (click)="channelFilter.set('email')"
            class="px-3 py-1.5 rounded text-sm font-medium transition-colors"
            [class.bg-accent-primary]="channelFilter() === 'email'"
            [class.text-white]="channelFilter() === 'email'"
            [class.text-text-secondary]="channelFilter() !== 'email'"
          >
            📧 Email
          </button>
          <button
            (click)="channelFilter.set('meta_ads')"
            class="px-3 py-1.5 rounded text-sm font-medium transition-colors"
            [class.bg-accent-primary]="channelFilter() === 'meta_ads'"
            [class.text-white]="channelFilter() === 'meta_ads'"
            [class.text-text-secondary]="channelFilter() !== 'meta_ads'"
          >
            📱 Meta Ads
          </button>
        </div>

        <!-- Stats -->
        <div class="flex items-center gap-4 text-sm text-text-secondary">
          <span>
            <strong class="text-text-primary">{{ filteredAssets().length }}</strong> assets
          </span>
          <span>
            <strong class="text-text-primary">{{ totalVersions() }}</strong> versions
          </span>
          <span>
            <strong class="text-success">{{ approvedCount() }}</strong> approved
          </span>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Sidebar - Asset List -->
        <div class="w-80 flex-shrink-0 border-r border-border-color overflow-y-auto bg-bg-secondary">
          @if (assetGroups().length === 0) {
            <div class="p-6 text-center">
              <div class="w-12 h-12 bg-bg-card rounded-full flex items-center justify-center mx-auto mb-3">
                <span class="text-2xl">📭</span>
              </div>
              <p class="text-text-secondary text-sm">No assets match your filter</p>
            </div>
          } @else {
            <div class="p-3 space-y-4">
              @for (group of assetGroups(); track group.audienceId) {
                <div>
                  <!-- Segment Header -->
                  <div class="flex items-center gap-2 px-2 py-1.5 mb-2">
                    <div class="w-6 h-6 rounded bg-segment/15 flex items-center justify-center">
                      <span class="text-xs">👥</span>
                    </div>
                    <span class="text-sm font-medium text-text-primary">{{ group.audienceName }}</span>
                    <span class="text-xs text-text-muted">({{ group.assets.length }})</span>
                  </div>

                  <!-- Assets in Group -->
                  <div class="space-y-2">
                    @for (asset of group.assets; track asset._id) {
                      <app-asset-list-item
                        [asset]="asset"
                        [selected]="selectedAsset()?._id === asset._id"
                        (onSelect)="selectAsset($event)"
                      ></app-asset-list-item>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Right Panel - Preview -->
        <div class="flex-1 flex flex-col overflow-hidden">
          @if (selectedAsset(); as asset) {
            @if (asset.channelType === 'email') {
              <app-email-preview
                [asset]="asset"
                [primaryColor]="primaryColor"
                [isRegenerating]="isRegenerating"
                (regenerateVersion)="handleRegenerate($event)"
                (approveVersion)="handleApprove($event)"
              ></app-email-preview>
            } @else {
              <app-meta-ad-preview
                [asset]="asset"
                [brandName]="brandName"
                [primaryColor]="primaryColor"
                [isRegenerating]="isRegenerating"
                (regenerateVersion)="handleRegenerate($event)"
                (approveVersion)="handleApprove($event)"
              ></app-meta-ad-preview>
            }
          } @else {
            <div class="flex-1 flex items-center justify-center bg-bg-secondary">
              <div class="text-center">
                <div class="w-16 h-16 bg-bg-card rounded-full flex items-center justify-center mx-auto mb-4">
                  <span class="text-3xl">👈</span>
                </div>
                <h3 class="text-lg font-medium text-text-primary mb-2">Select an Asset</h3>
                <p class="text-text-secondary text-sm">
                  Choose an asset from the sidebar to preview its content
                </p>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class AssetGalleryComponent {
  @Input({ required: true }) assets: Asset[] = [];
  @Input() audienceMap: Map<string, string> = new Map();
  @Input() brandName = 'Your Brand';
  @Input() primaryColor = '#8b5cf6';

  @Output() regenerateVersion = new EventEmitter<RegenerateVersionEvent>();
  @Output() approveVersion = new EventEmitter<ApproveVersionEvent>();

  private campaignService = inject(CampaignService);

  channelFilter = signal<ChannelFilter>('all');
  selectedAsset = signal<Asset | null>(null);
  isRegenerating = signal(false);

  // Filtered assets based on channel filter
  filteredAssets = computed(() => {
    const filter = this.channelFilter();
    if (filter === 'all') {
      return this.assets;
    }
    return this.assets.filter(a => a.channelType === filter);
  });

  // Group assets by audience
  assetGroups = computed((): AssetGroup<Asset>[] => {
    const groups = new Map<string, AssetGroup<Asset>>();

    for (const asset of this.filteredAssets()) {
      const audienceId = asset.audienceId;
      const audienceName = this.audienceMap.get(audienceId) || 'Unknown Segment';

      if (!groups.has(audienceId)) {
        groups.set(audienceId, {
          audienceId,
          audienceName,
          assets: [],
        });
      }
      groups.get(audienceId)!.assets.push(asset);
    }

    return Array.from(groups.values());
  });

  // Stats
  totalVersions = computed(() => {
    return this.filteredAssets().reduce((sum, asset) => sum + asset.versions.length, 0);
  });

  approvedCount = computed(() => {
    return this.filteredAssets().reduce((sum, asset) => {
      return sum + asset.versions.filter(v => v.status === 'approved').length;
    }, 0);
  });

  selectAsset(asset: Asset): void {
    this.selectedAsset.set(asset);
  }

  handleRegenerate(event: RegenerateVersionEvent): void {
    this.isRegenerating.set(true);

    this.campaignService.regenerateVersion(event.assetId, event.versionId, event.customInstructions)
      .subscribe({
        next: (response) => {
          // Update the asset in the list
          const updatedAsset = response.data.asset;
          this.updateAssetInList(updatedAsset);
          this.selectedAsset.set(updatedAsset);
          this.isRegenerating.set(false);
        },
        error: (err) => {
          console.error('Regeneration failed:', err);
          this.isRegenerating.set(false);
        },
      });

    // Also emit for parent to handle if needed
    this.regenerateVersion.emit(event);
  }

  handleApprove(event: ApproveVersionEvent): void {
    this.campaignService.approveVersion(event.assetId, event.versionId)
      .subscribe({
        next: (response) => {
          // Update the asset in the list
          const updatedAsset = response.data.asset;
          this.updateAssetInList(updatedAsset);
          this.selectedAsset.set(updatedAsset);
        },
        error: (err) => {
          console.error('Approval failed:', err);
        },
      });

    // Also emit for parent to handle if needed
    this.approveVersion.emit(event);
  }

  private updateAssetInList(updatedAsset: Asset): void {
    // Find and update the asset in the input array
    const index = this.assets.findIndex(a => a._id === updatedAsset._id);
    if (index !== -1) {
      this.assets[index] = updatedAsset;
    }
  }
}

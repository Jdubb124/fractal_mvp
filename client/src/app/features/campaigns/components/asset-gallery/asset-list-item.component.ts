import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Asset } from '../../../../core/services/campaign.service';
import { STATUS_COLORS } from '../../models/asset-gallery.types';

@Component({
  selector: 'app-asset-list-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      (click)="onSelect.emit(asset)"
      class="w-full p-3 rounded-lg border transition-all text-left group"
      [class.border-accent-primary]="selected"
      [class.bg-accent-primary/10]="selected"
      [class.border-border-color]="!selected"
      [class.hover:border-accent-primary/50]="!selected"
    >
      <div class="flex items-start gap-3">
        <!-- Channel Icon -->
        <div
          class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          [class.bg-channel/15]="asset.channelType === 'email'"
          [class.bg-asset/15]="asset.channelType === 'meta_ads'"
        >
          <span class="text-lg">{{ asset.channelType === 'email' ? '📧' : '📱' }}</span>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-text-primary truncate">
            {{ asset.name }}
          </p>
          <p class="text-xs text-text-muted mt-0.5">
            {{ asset.channelType === 'email' ? 'Email' : 'Meta Ad' }} · {{ asset.versions.length }} version{{ asset.versions.length !== 1 ? 's' : '' }}
          </p>

          <!-- Version Status Dots -->
          <div class="flex items-center gap-1.5 mt-2">
            @for (version of asset.versions; track version._id) {
              <div
                class="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs"
                [ngClass]="getStatusClasses(version.status)"
                [title]="version.versionName + ' - ' + version.status"
              >
                <span class="w-1.5 h-1.5 rounded-full" [class]="getStatusDotClass(version.status)"></span>
                <span class="hidden sm:inline">{{ getStrategyAbbr(version.strategy) }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Selection Indicator -->
        @if (selected) {
          <div class="w-2 h-2 rounded-full bg-accent-primary flex-shrink-0 mt-1"></div>
        }
      </div>
    </button>
  `,
})
export class AssetListItemComponent {
  @Input({ required: true }) asset!: Asset;
  @Input() selected = false;
  @Output() onSelect = new EventEmitter<Asset>();

  getStatusClasses(status: string): string {
    const colors = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.pending;
    return `${colors.bg} ${colors.text}`;
  }

  getStatusDotClass(status: string): string {
    const dotColors: Record<string, string> = {
      pending: 'bg-gray-400',
      generated: 'bg-accent-primary',
      edited: 'bg-warning',
      approved: 'bg-success',
    };
    return dotColors[status] || 'bg-gray-400';
  }

  getStrategyAbbr(strategy?: string): string {
    const abbrs: Record<string, string> = {
      conversion: 'Conv',
      awareness: 'Aware',
      urgency: 'Urg',
      emotional: 'Emo',
    };
    return abbrs[strategy || ''] || strategy || '';
  }
}

import { Component, Input, Output, EventEmitter, signal, computed, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Asset, AssetVersion } from '../../../../core/services/campaign.service';
import {
  MetaAdContent,
  STRATEGY_LABELS,
  STATUS_COLORS,
  RegenerateVersionEvent,
  ApproveVersionEvent,
  isMetaAdContent,
} from '../../models/asset-gallery.types';

@Component({
  selector: 'app-meta-ad-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col h-full">
      <!-- Header with Version Tabs -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-border-color bg-bg-card">
        <!-- Version Tabs -->
        <div class="flex gap-1">
          @for (version of asset.versions; track version._id; let i = $index) {
            <button
              (click)="selectVersion(i)"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              [class.bg-accent-primary]="selectedVersionIndex() === i"
              [class.text-white]="selectedVersionIndex() === i"
              [class.bg-bg-input]="selectedVersionIndex() !== i"
              [class.text-text-secondary]="selectedVersionIndex() !== i"
              [class.hover:bg-bg-hover]="selectedVersionIndex() !== i"
            >
              {{ getStrategyLabel(version.strategy) }}
              @if (version.status === 'approved') {
                <span class="ml-1">✓</span>
              }
            </button>
          }
        </div>

        <!-- Platform Toggle -->
        <div class="flex items-center gap-1 bg-bg-input rounded-lg p-1">
          <button
            (click)="platform.set('facebook')"
            class="px-3 py-1 rounded text-sm transition-colors"
            [class.bg-accent-primary/20]="platform() === 'facebook'"
            [class.text-accent-primary]="platform() === 'facebook'"
          >
            Facebook
          </button>
          <button
            (click)="platform.set('instagram')"
            class="px-3 py-1 rounded text-sm transition-colors"
            [class.bg-accent-primary/20]="platform() === 'instagram'"
            [class.text-accent-primary]="platform() === 'instagram'"
          >
            Instagram
          </button>
        </div>
      </div>

      <!-- Preview Area -->
      <div class="flex-1 overflow-auto p-6 bg-bg-secondary">
        <div class="mx-auto max-w-lg">
          @if (currentContent(); as content) {
            <!-- Facebook Style Ad Card -->
            @if (platform() === 'facebook') {
              <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                <!-- Page Header -->
                <div class="flex items-center gap-3 p-3 border-b border-gray-100">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    [style.background-color]="primaryColor"
                  >
                    {{ brandInitial }}
                  </div>
                  <div class="flex-1">
                    <p class="font-semibold text-gray-900 text-sm">{{ brandName }}</p>
                    <p class="text-xs text-gray-500">Sponsored · 🌐</p>
                  </div>
                  <button class="text-gray-400 hover:text-gray-600">•••</button>
                </div>

                <!-- Primary Text -->
                <div class="px-3 py-2">
                  <p class="text-gray-900 text-sm leading-relaxed">{{ content.primaryText }}</p>
                </div>

                <!-- Image Placeholder -->
                <div
                  class="relative aspect-[1200/628] bg-gradient-to-br flex items-center justify-center"
                  [style.background]="'linear-gradient(135deg, ' + primaryColor + ' 0%, ' + adjustColor(primaryColor, -30) + ' 100%)'"
                >
                  <div class="text-center text-white/80">
                    <div class="text-4xl mb-2">🖼️</div>
                    <p class="text-sm">1200 × 628 px</p>
                    <p class="text-xs mt-1">Ad Creative</p>
                  </div>
                </div>

                <!-- Link Preview -->
                <div class="bg-gray-50 p-3 border-t border-gray-100">
                  <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0 pr-3">
                      <p class="text-xs text-gray-500 uppercase tracking-wide">yourwebsite.com</p>
                      <p class="font-semibold text-gray-900 text-sm truncate">{{ content.headline }}</p>
                      <p class="text-xs text-gray-500 truncate">{{ content.description }}</p>
                    </div>
                    <button
                      class="px-4 py-2 text-sm font-semibold rounded whitespace-nowrap"
                      [style.background-color]="'#1877f2'"
                      [style.color]="'white'"
                    >
                      {{ content.ctaButton }}
                    </button>
                  </div>
                </div>

                <!-- Engagement Bar -->
                <div class="flex items-center justify-between px-3 py-2 border-t border-gray-100 text-gray-500 text-sm">
                  <div class="flex items-center gap-4">
                    <button class="flex items-center gap-1 hover:text-blue-600">
                      👍 <span>Like</span>
                    </button>
                    <button class="flex items-center gap-1 hover:text-blue-600">
                      💬 <span>Comment</span>
                    </button>
                    <button class="flex items-center gap-1 hover:text-blue-600">
                      ↗️ <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>
            }

            <!-- Instagram Style Ad Card -->
            @if (platform() === 'instagram') {
              <div class="bg-white rounded-lg shadow-lg overflow-hidden max-w-md mx-auto">
                <!-- Header -->
                <div class="flex items-center justify-between p-3">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                      [style.background-color]="primaryColor"
                    >
                      {{ brandInitial }}
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900 text-sm">{{ brandName.toLowerCase().replace(' ', '_') }}</p>
                      <p class="text-xs text-gray-500">Sponsored</p>
                    </div>
                  </div>
                  <button class="text-gray-600">•••</button>
                </div>

                <!-- Image -->
                <div
                  class="relative aspect-square bg-gradient-to-br flex items-center justify-center"
                  [style.background]="'linear-gradient(135deg, ' + primaryColor + ' 0%, ' + adjustColor(primaryColor, -30) + ' 100%)'"
                >
                  <div class="text-center text-white/80">
                    <div class="text-5xl mb-2">🖼️</div>
                    <p class="text-sm">1080 × 1080 px</p>
                    <p class="text-xs mt-1">Square Format</p>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center justify-between p-3">
                  <div class="flex items-center gap-4">
                    <button class="text-2xl hover:opacity-70">🤍</button>
                    <button class="text-2xl hover:opacity-70">💬</button>
                    <button class="text-2xl hover:opacity-70">📤</button>
                  </div>
                  <button class="text-2xl hover:opacity-70">🔖</button>
                </div>

                <!-- Caption -->
                <div class="px-3 pb-3">
                  <p class="text-sm">
                    <span class="font-semibold">{{ brandName.toLowerCase().replace(' ', '_') }}</span>
                    {{ ' ' + content.primaryText }}
                  </p>
                </div>

                <!-- CTA Button -->
                <div class="px-3 pb-3">
                  <button
                    class="w-full py-2 text-sm font-semibold rounded-lg"
                    [style.background-color]="primaryColor"
                    [style.color]="'white'"
                  >
                    {{ content.ctaButton }}
                  </button>
                </div>
              </div>
            }
          }
        </div>
      </div>

      <!-- Content Details -->
      <div class="border-t border-border-color bg-bg-card">
        <div class="p-4 space-y-3">
          @if (currentContent(); as content) {
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-text-muted">Headline: </span>
                <span class="text-text-primary font-medium">{{ content.headline }}</span>
              </div>
              <div>
                <span class="text-text-muted">CTA: </span>
                <span class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                  {{ content.ctaButton }}
                </span>
              </div>
            </div>
            <div class="text-sm">
              <span class="text-text-muted">Description: </span>
              <span class="text-text-secondary">{{ content.description }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Action Bar -->
      <div class="flex items-center justify-between px-4 py-3 border-t border-border-color bg-bg-card">
        <div class="flex items-center gap-2">
          <span
            class="px-2 py-1 rounded text-xs font-medium"
            [ngClass]="getStatusClasses(currentVersion()?.status)"
          >
            {{ currentVersion()?.status }}
          </span>
          @if (currentVersion()?.generatedAt) {
            <span class="text-xs text-text-muted">
              Generated {{ formatDate(currentVersion()?.generatedAt) }}
            </span>
          }
        </div>

        <div class="flex items-center gap-2">
          <button
            (click)="onRegenerate()"
            [disabled]="isRegenerating()"
            class="px-3 py-1.5 rounded bg-bg-input text-text-secondary text-sm hover:bg-bg-hover transition-colors disabled:opacity-50"
          >
            @if (isRegenerating()) {
              <span class="flex items-center gap-1">
                <span class="w-3 h-3 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin"></span>
                Regenerating...
              </span>
            } @else {
              🔄 Regenerate
            }
          </button>
          <button
            (click)="onApprove()"
            [disabled]="currentVersion()?.status === 'approved'"
            class="px-3 py-1.5 rounded bg-success text-white text-sm font-medium hover:bg-success/90 transition-colors disabled:opacity-50"
          >
            {{ currentVersion()?.status === 'approved' ? '✓ Approved' : '✅ Approve' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class MetaAdPreviewComponent implements OnChanges {
  @Input({ required: true }) asset!: Asset;
  @Input() brandName = 'Your Brand';
  @Input() primaryColor = '#8b5cf6';
  @Input() isRegenerating = signal(false);

  @Output() regenerateVersion = new EventEmitter<RegenerateVersionEvent>();
  @Output() approveVersion = new EventEmitter<ApproveVersionEvent>();

  selectedVersionIndex = signal(0);
  platform = signal<'facebook' | 'instagram'>('facebook');

  get brandInitial(): string {
    return this.brandName.charAt(0).toUpperCase();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['asset']) {
      this.selectedVersionIndex.set(0);
    }
  }

  currentVersion = computed(() => {
    return this.asset?.versions[this.selectedVersionIndex()];
  });

  currentContent = computed(() => {
    const version = this.currentVersion();
    if (version && isMetaAdContent(version.content)) {
      return version.content;
    }
    return null;
  });

  selectVersion(index: number): void {
    this.selectedVersionIndex.set(index);
  }

  getStrategyLabel(strategy?: string): string {
    return STRATEGY_LABELS[strategy as keyof typeof STRATEGY_LABELS] || strategy || 'Version';
  }

  getStatusClasses(status?: string): string {
    const colors = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.pending;
    return `${colors.bg} ${colors.text}`;
  }

  formatDate(date?: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  adjustColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  }

  onRegenerate(): void {
    const version = this.currentVersion();
    if (this.asset._id && version?._id) {
      this.regenerateVersion.emit({
        assetId: this.asset._id,
        versionId: version._id,
      });
    }
  }

  onApprove(): void {
    const version = this.currentVersion();
    if (this.asset._id && version?._id) {
      this.approveVersion.emit({
        assetId: this.asset._id,
        versionId: version._id,
      });
    }
  }
}

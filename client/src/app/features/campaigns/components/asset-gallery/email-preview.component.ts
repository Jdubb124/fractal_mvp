import { Component, Input, Output, EventEmitter, signal, computed, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Asset, AssetVersion } from '../../../../core/services/campaign.service';
import {
  EmailContent,
  PreviewWidth,
  PREVIEW_WIDTHS,
  STRATEGY_LABELS,
  STATUS_COLORS,
  RegenerateVersionEvent,
  ApproveVersionEvent,
  isEmailContent,
} from '../../models/asset-gallery.types';
import { ContentToHtmlService } from '../../services/content-to-html.service';

@Component({
  selector: 'app-email-preview',
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

        <!-- Preview Width Toggle -->
        <div class="flex items-center gap-1 bg-bg-input rounded-lg p-1">
          <button
            (click)="previewWidth.set('mobile')"
            class="p-1.5 rounded transition-colors"
            [class.bg-accent-primary/20]="previewWidth() === 'mobile'"
            [class.text-accent-primary]="previewWidth() === 'mobile'"
            title="Mobile (375px)"
          >
            📱
          </button>
          <button
            (click)="previewWidth.set('tablet')"
            class="p-1.5 rounded transition-colors"
            [class.bg-accent-primary/20]="previewWidth() === 'tablet'"
            [class.text-accent-primary]="previewWidth() === 'tablet'"
            title="Tablet (600px)"
          >
            📟
          </button>
          <button
            (click)="previewWidth.set('desktop')"
            class="p-1.5 rounded transition-colors"
            [class.bg-accent-primary/20]="previewWidth() === 'desktop'"
            [class.text-accent-primary]="previewWidth() === 'desktop'"
            title="Desktop (800px)"
          >
            🖥️
          </button>
        </div>
      </div>

      <!-- Preview Area -->
      <div class="flex-1 overflow-auto p-6 bg-bg-secondary">
        <div
          class="mx-auto transition-all duration-300 bg-white rounded-lg shadow-lg overflow-hidden"
          [style.max-width.px]="previewWidthPx()"
        >
          <iframe
            [srcdoc]="sanitizedHtml()"
            sandbox="allow-same-origin"
            class="w-full border-0"
            style="min-height: 500px;"
          ></iframe>
        </div>
      </div>

      <!-- Content Details -->
      <div class="border-t border-border-color bg-bg-card">
        <div class="p-4 space-y-3">
          @if (currentContent(); as content) {
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-text-muted">Subject: </span>
                <span class="text-text-primary font-medium">{{ content.subjectLine }}</span>
              </div>
              <div>
                <span class="text-text-muted">Preheader: </span>
                <span class="text-text-secondary">{{ content.preheader }}</span>
              </div>
            </div>
            <div class="text-sm">
              <span class="text-text-muted">CTA: </span>
              <span class="px-2 py-1 bg-accent-primary/20 text-accent-primary rounded text-xs font-medium">
                {{ content.ctaText }}
              </span>
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
export class EmailPreviewComponent implements OnChanges {
  @Input({ required: true }) asset!: Asset;
  @Input() primaryColor = '#8b5cf6';
  @Input() isRegenerating = signal(false);

  @Output() regenerateVersion = new EventEmitter<RegenerateVersionEvent>();
  @Output() approveVersion = new EventEmitter<ApproveVersionEvent>();

  private sanitizer = inject(DomSanitizer);
  private contentToHtml = inject(ContentToHtmlService);

  selectedVersionIndex = signal(0);
  previewWidth = signal<PreviewWidth>('desktop');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['asset']) {
      // Reset to first version when asset changes
      this.selectedVersionIndex.set(0);
    }
  }

  currentVersion = computed(() => {
    return this.asset?.versions[this.selectedVersionIndex()];
  });

  currentContent = computed(() => {
    const version = this.currentVersion();
    if (version && isEmailContent(version.content)) {
      return version.content;
    }
    return null;
  });

  previewWidthPx = computed(() => {
    return PREVIEW_WIDTHS[this.previewWidth()];
  });

  sanitizedHtml = computed(() => {
    const content = this.currentContent();
    if (!content) return '';

    const html = this.contentToHtml.generateEmailHtml(content, { primary: this.primaryColor });
    return this.sanitizer.bypassSecurityTrustHtml(html);
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

// Path: client/src/app/features/email-builder/components/preview-panel.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmailBuilderService } from '../services/email-builder.service';
import { EMAIL_TYPES, VERSION_STRATEGIES } from '../models/email-builder.types';

@Component({
  selector: 'app-preview-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-bg-dark/95 backdrop-blur-sm z-50 flex flex-col">
      <!-- Header -->
      <div class="bg-bg-card border-b border-border-color px-6 py-4">
        <div class="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h2 class="text-xl font-bold text-text-primary">Generated Emails</h2>
            <p class="text-sm text-text-secondary">{{ generatedAssets().length }} emails created successfully</p>
          </div>
          <div class="flex items-center gap-3">
            <button (click)="downloadJSON()" class="btn-secondary flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Export JSON
            </button>
            <button (click)="close()" class="btn-secondary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Sidebar - Asset List -->
        <div class="w-80 bg-bg-card border-r border-border-color overflow-y-auto">
          <div class="p-4">
            <h3 class="text-sm font-medium text-text-primary mb-3">All Emails</h3>
            <div class="space-y-2">
              @for (asset of generatedAssets(); track asset.id; let idx = $index) {
                <button
                  (click)="selectAsset(idx)"
                  class="w-full p-3 rounded-lg border transition-all text-left"
                  [class.border-accent-primary]="selectedAssetIndex() === idx"
                  [class.bg-accent-primary/10]="selectedAssetIndex() === idx"
                  [class.border-border-color]="selectedAssetIndex() !== idx"
                  [class.hover:border-accent-primary/50]="selectedAssetIndex() !== idx"
                >
                  <div class="flex items-start gap-2">
                    <span class="text-lg flex-shrink-0">{{ getEmailTypeIcon(asset.emailType) }}</span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-text-primary truncate">{{ asset.audienceName }}</p>
                      <p class="text-xs text-text-muted">{{ getEmailTypeName(asset.emailType) }}</p>
                      <div class="flex items-center gap-1 mt-1">
                        <span class="px-1.5 py-0.5 rounded text-xs" [class]="getStrategyBgClass(asset.strategy)">
                          {{ getStrategyName(asset.strategy) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Preview Area -->
        <div class="flex-1 overflow-y-auto bg-bg-secondary p-8">
          @if (selectedAsset()) {
            <div class="max-w-2xl mx-auto">
              <!-- Email Preview Card -->
              <div class="bg-white rounded-xl shadow-2xl overflow-hidden">
                <!-- Browser Chrome -->
                <div class="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b">
                  <div class="flex gap-1.5">
                    <div class="w-3 h-3 rounded-full bg-red-400"></div>
                    <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div class="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div class="flex-1 ml-4">
                    <div class="bg-white rounded px-3 py-1 text-sm text-gray-500 text-center">
                      Email Preview
                    </div>
                  </div>
                </div>

                <!-- Email Header -->
                <div class="bg-gray-50 px-6 py-4 border-b">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-medium text-gray-500 w-16">Subject:</span>
                      <span class="text-sm text-gray-900 font-medium">{{ selectedAsset()!.content.subjectLine }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-medium text-gray-500 w-16">Preview:</span>
                      <span class="text-sm text-gray-600">{{ selectedAsset()!.content.preheader }}</span>
                    </div>
                  </div>
                </div>

                <!-- Email Body -->
                <div class="p-8 bg-white">
                  <h1 class="text-2xl font-bold text-gray-900 mb-6">{{ selectedAsset()!.content.headline }}</h1>
                  <div class="prose prose-gray max-w-none">
                    @for (paragraph of getBodyParagraphs(selectedAsset()!.content.bodyCopy); track $index) {
                      <p class="text-gray-700 mb-4 leading-relaxed">{{ paragraph }}</p>
                    }
                  </div>
                  <div class="mt-8">
                    <button class="px-6 py-3 bg-accent-primary text-white font-medium rounded-lg hover:bg-accent-secondary transition-colors">
                      {{ selectedAsset()!.content.ctaText }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Asset Metadata -->
              <div class="mt-6 card p-4">
                <h4 class="text-sm font-medium text-text-primary mb-3">Asset Details</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-text-muted">Audience:</span>
                    <span class="text-text-primary ml-2">{{ selectedAsset()!.audienceName }}</span>
                  </div>
                  <div>
                    <span class="text-text-muted">Email Type:</span>
                    <span class="text-text-primary ml-2">{{ getEmailTypeName(selectedAsset()!.emailType) }}</span>
                  </div>
                  <div>
                    <span class="text-text-muted">Strategy:</span>
                    <span class="text-text-primary ml-2">{{ getStrategyName(selectedAsset()!.strategy) }}</span>
                  </div>
                  <div>
                    <span class="text-text-muted">Status:</span>
                    <span class="text-success ml-2">{{ selectedAsset()!.status | titlecase }}</span>
                  </div>
                </div>
              </div>

              <!-- Character Counts -->
              <div class="mt-4 card p-4">
                <h4 class="text-sm font-medium text-text-primary mb-3">Content Metrics</h4>
                <div class="grid grid-cols-4 gap-3">
                  <div class="p-2 bg-bg-hover rounded text-center">
                    <div class="text-lg font-bold text-text-primary">{{ selectedAsset()!.content.subjectLine.length }}</div>
                    <div class="text-xs text-text-muted">Subject chars</div>
                  </div>
                  <div class="p-2 bg-bg-hover rounded text-center">
                    <div class="text-lg font-bold text-text-primary">{{ selectedAsset()!.content.preheader.length }}</div>
                    <div class="text-xs text-text-muted">Preheader chars</div>
                  </div>
                  <div class="p-2 bg-bg-hover rounded text-center">
                    <div class="text-lg font-bold text-text-primary">{{ selectedAsset()!.content.headline.length }}</div>
                    <div class="text-xs text-text-muted">Headline chars</div>
                  </div>
                  <div class="p-2 bg-bg-hover rounded text-center">
                    <div class="text-lg font-bold text-text-primary">{{ getWordCount(selectedAsset()!.content.bodyCopy) }}</div>
                    <div class="text-xs text-text-muted">Body words</div>
                  </div>
                </div>
              </div>
            </div>
          } @else {
            <div class="flex items-center justify-center h-full">
              <p class="text-text-muted">Select an email from the sidebar to preview</p>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class PreviewPanelComponent {
  private readonly builderService = inject(EmailBuilderService);

  get generatedAssets() { return this.builderService.generatedAssets; }
  get selectedAssetIndex() { return this.builderService.selectedAssetIndex; }
  get selectedAsset() { return this.builderService.selectedAsset; }

  selectAsset(index: number): void {
    this.builderService.selectAsset(index);
  }

  close(): void {
    this.builderService.closePreview();
  }

  downloadJSON(): void {
    this.builderService.downloadJSON();
  }

  getEmailTypeIcon(type: string): string {
    return EMAIL_TYPES[type as keyof typeof EMAIL_TYPES]?.icon || '📧';
  }

  getEmailTypeName(type: string): string {
    return EMAIL_TYPES[type as keyof typeof EMAIL_TYPES]?.name || type;
  }

  getStrategyName(strategy: string): string {
    return VERSION_STRATEGIES[strategy as keyof typeof VERSION_STRATEGIES]?.name || strategy;
  }

  getStrategyBgClass(strategy: string): string {
    const config = VERSION_STRATEGIES[strategy as keyof typeof VERSION_STRATEGIES];
    return config ? `${config.bgClass} ${config.borderClass} border` : 'bg-bg-hover';
  }

  getBodyParagraphs(body: string): string[] {
    return body.split('\n\n').filter(p => p.trim());
  }

  getWordCount(text: string): number {
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }
}

import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  EmailAsset,
  EmailViewMode,
  ExportFormat,
  EMAIL_TYPE_LABELS,
  STRATEGY_LABELS,
} from '../models/email.types';
import { EmailExporterService } from '../services/email.service';

@Component({
  selector: 'app-email-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="email-viewer-container flex flex-col h-full bg-bg-primary rounded-lg overflow-hidden border border-border-color">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-border-color bg-bg-card">
        <div class="flex gap-2">
          <span class="px-2 py-1 rounded-full text-xs font-medium bg-segment/20 text-segment">
            {{ asset()?.audienceSnapshot?.name }}
          </span>
          <span class="px-2 py-1 rounded-full text-xs font-medium bg-channel/20 text-channel">
            {{ formatEmailType(asset()?.emailType) }}
          </span>
          <span class="px-2 py-1 rounded-full text-xs font-medium bg-version/20 text-version">
            {{ formatStrategy(asset()?.versionStrategy) }}
          </span>
        </div>

        <div class="flex gap-1">
          <button
            [class.bg-accent-primary/20]="viewMode() === 'preview'"
            [class.text-accent-primary]="viewMode() === 'preview'"
            (click)="setViewMode('preview')"
            class="px-3 py-1.5 rounded text-sm text-text-secondary hover:bg-bg-input transition-colors"
          >
            Preview
          </button>
          <button
            [class.bg-accent-primary/20]="viewMode() === 'code'"
            [class.text-accent-primary]="viewMode() === 'code'"
            (click)="setViewMode('code')"
            class="px-3 py-1.5 rounded text-sm text-text-secondary hover:bg-bg-input transition-colors"
          >
            Code
          </button>
          <button
            [class.bg-accent-primary/20]="viewMode() === 'split'"
            [class.text-accent-primary]="viewMode() === 'split'"
            (click)="setViewMode('split')"
            class="px-3 py-1.5 rounded text-sm text-text-secondary hover:bg-bg-input transition-colors"
          >
            Split
          </button>
        </div>

        <div class="flex gap-2">
          <select
            [(ngModel)]="selectedExportFormat"
            class="px-3 py-1.5 rounded bg-bg-input text-text-primary text-sm border border-border-color focus:outline-none focus:ring-1 focus:ring-accent-primary"
          >
            <option value="html">HTML</option>
            <option value="liquid">Liquid</option>
            <option value="plain_text">Plain Text</option>
            <option value="json">JSON</option>
          </select>
          <button
            (click)="exportAsset()"
            class="px-4 py-1.5 rounded bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 transition-colors"
          >
            Export
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden" [ngClass]="'mode-' + viewMode()">
        <!-- Preview Pane -->
        @if (viewMode() === 'preview' || viewMode() === 'split') {
          <div class="flex flex-col bg-bg-secondary" [class.w-full]="viewMode() === 'preview'" [class.w-1/2]="viewMode() === 'split'" [class.border-r]="viewMode() === 'split'" [class.border-border-color]="viewMode() === 'split'">
            <div class="flex justify-center gap-2 py-2 border-b border-border-color bg-bg-card">
              <button
                [class.bg-accent-primary/20]="previewWidth() === 'mobile'"
                (click)="setPreviewWidth('mobile')"
                class="p-2 rounded hover:bg-bg-input transition-colors"
                title="Mobile (375px)"
              >
                📱
              </button>
              <button
                [class.bg-accent-primary/20]="previewWidth() === 'tablet'"
                (click)="setPreviewWidth('tablet')"
                class="p-2 rounded hover:bg-bg-input transition-colors"
                title="Tablet (600px)"
              >
                📟
              </button>
              <button
                [class.bg-accent-primary/20]="previewWidth() === 'desktop'"
                (click)="setPreviewWidth('desktop')"
                class="p-2 rounded hover:bg-bg-input transition-colors"
                title="Desktop (800px)"
              >
                🖥️
              </button>
            </div>
            <div class="flex-1 overflow-auto p-4">
              <div
                class="mx-auto transition-all duration-300"
                [style.max-width.px]="previewWidthPx()"
              >
                <iframe
                  [srcdoc]="sanitizedHtml()"
                  sandbox="allow-same-origin"
                  class="w-full border-0 bg-white rounded shadow-lg"
                  style="min-height: 600px;"
                ></iframe>
              </div>
            </div>
          </div>
        }

        <!-- Code Editor Pane -->
        @if (viewMode() === 'code' || viewMode() === 'split') {
          <div class="flex flex-col" [class.w-full]="viewMode() === 'code'" [class.w-1/2]="viewMode() === 'split'">
            <div class="flex items-center gap-3 px-4 py-2 border-b border-border-color bg-bg-card">
              <span class="text-sm text-text-secondary font-medium">HTML Source</span>
              <button
                (click)="formatCode()"
                class="px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-input rounded transition-colors"
              >
                Format
              </button>
              <button
                (click)="copyCode()"
                class="px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-input rounded transition-colors"
              >
                Copy
              </button>
            </div>
            <textarea
              [(ngModel)]="editableHtml"
              (ngModelChange)="onCodeChange($event)"
              class="flex-1 p-4 bg-bg-primary text-text-primary font-mono text-sm resize-none focus:outline-none"
              style="line-height: 1.5;"
              spellcheck="false"
            ></textarea>
          </div>
        }
      </div>

      <!-- AI Edit Panel -->
      <div class="border-t border-border-color bg-bg-card">
        <div class="flex items-center gap-2 px-4 py-2 border-b border-border-color">
          <span class="text-lg">🤖</span>
          <span class="text-sm font-medium text-text-primary">AI Editor</span>
        </div>
        <div class="p-4">
          <textarea
            [(ngModel)]="aiPrompt"
            placeholder="Describe the changes you want, e.g., 'Make the headline more urgent' or 'Change the button color to blue'"
            class="w-full px-3 py-2 rounded bg-bg-input text-text-primary text-sm border border-border-color resize-none focus:outline-none focus:ring-1 focus:ring-accent-primary"
            rows="2"
          ></textarea>
          <div class="flex items-center gap-4 mt-2">
            <label class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                [(ngModel)]="preserveStructure"
                class="rounded border-border-color text-accent-primary focus:ring-accent-primary"
              />
              Preserve layout structure
            </label>
          </div>
          <button
            (click)="applyAIEdit()"
            [disabled]="isAIEditing() || !aiPrompt.trim()"
            class="mt-3 w-full px-4 py-2 rounded bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            @if (isAIEditing()) {
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Applying...
            } @else {
              Apply AI Edit
            }
          </button>
        </div>
      </div>

      <!-- Status Bar -->
      <div class="flex items-center gap-4 px-4 py-2 border-t border-border-color bg-bg-card text-xs text-text-muted">
        <span>
          Status:
          <strong
            [class.text-yellow-400]="asset()?.status === 'pending'"
            [class.text-blue-400]="asset()?.status === 'generated'"
            [class.text-purple-400]="asset()?.status === 'edited'"
            [class.text-green-400]="asset()?.status === 'approved'"
          >
            {{ asset()?.status }}
          </strong>
        </span>
        <span>Last edited: {{ formatDate(asset()?.meta?.lastEditedAt) }}</span>
        <span>Exports: {{ asset()?.meta?.exportCount || 0 }}</span>
        @if (hasUnsavedChanges()) {
          <span class="text-yellow-400">● Unsaved changes</span>
        }
      </div>

      <!-- Action Bar -->
      <div class="flex items-center gap-2 px-4 py-3 border-t border-border-color bg-bg-card">
        <button
          (click)="undoLastEdit()"
          [disabled]="!canUndo()"
          class="px-4 py-2 rounded bg-bg-input text-text-secondary text-sm hover:bg-border-color disabled:opacity-50 transition-colors"
        >
          ↩️ Undo
        </button>
        <button
          (click)="resetToOriginal()"
          class="px-4 py-2 rounded bg-bg-input text-text-secondary text-sm hover:bg-border-color transition-colors"
        >
          🔄 Reset
        </button>
        <div class="flex-1"></div>
        <button
          (click)="saveChanges()"
          [disabled]="!hasUnsavedChanges()"
          class="px-4 py-2 rounded bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 disabled:opacity-50 transition-colors"
        >
          💾 Save Changes
        </button>
        <button
          (click)="approveAsset()"
          [disabled]="asset()?.status === 'approved'"
          class="px-4 py-2 rounded bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          ✅ Approve
        </button>
      </div>
    </div>
  `,
})
export class EmailViewerComponent implements OnChanges {
  @Input() emailAsset: EmailAsset | null = null;
  @Output() assetUpdated = new EventEmitter<EmailAsset>();
  @Output() exportRequested = new EventEmitter<{
    asset: EmailAsset;
    format: ExportFormat;
  }>();

  private sanitizer = inject(DomSanitizer);
  private emailService = inject(EmailExporterService);

  private _asset = signal<EmailAsset | null>(null);
  asset = this._asset.asReadonly();

  // View state
  viewMode = signal<EmailViewMode>('preview');
  previewWidth = signal<'mobile' | 'tablet' | 'desktop'>('desktop');

  // Edit state
  editableHtml = '';
  originalHtml = '';
  aiPrompt = '';
  preserveStructure = true;
  isAIEditing = signal(false);

  // Export
  selectedExportFormat: ExportFormat = 'html';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['emailAsset'] && this.emailAsset) {
      this._asset.set(this.emailAsset);
      this.editableHtml = this.emailAsset.html.fullHtml;
      this.originalHtml = this.emailAsset.html.fullHtml;
    }
  }

  // Computed values
  sanitizedHtml = computed(() => {
    return this.sanitizer.bypassSecurityTrustHtml(this.editableHtml);
  });

  previewWidthPx = computed(() => {
    const widths = { mobile: 375, tablet: 600, desktop: 800 };
    return widths[this.previewWidth()];
  });

  hasUnsavedChanges = computed(() => {
    return this.editableHtml !== this.originalHtml;
  });

  canUndo = computed(() => {
    const history = this._asset()?.meta?.editHistory;
    return history && history.length > 0;
  });

  // Methods
  setViewMode(mode: EmailViewMode) {
    this.viewMode.set(mode);
  }

  setPreviewWidth(width: 'mobile' | 'tablet' | 'desktop') {
    this.previewWidth.set(width);
  }

  onCodeChange(html: string) {
    this.editableHtml = html;
  }

  formatCode() {
    this.editableHtml = this.formatHtml(this.editableHtml);
  }

  copyCode() {
    navigator.clipboard.writeText(this.editableHtml);
  }

  async applyAIEdit() {
    if (!this._asset() || !this.aiPrompt.trim()) return;

    this.isAIEditing.set(true);
    try {
      const result = await this.emailService
        .aiEditEmail(this._asset()!._id, this.aiPrompt, this.preserveStructure)
        .toPromise();

      if (result?.modifiedHtml) {
        this.editableHtml = result.modifiedHtml;
        this.aiPrompt = '';
      }
    } catch (error) {
      console.error('AI edit failed:', error);
    } finally {
      this.isAIEditing.set(false);
    }
  }

  async saveChanges() {
    if (!this._asset()) return;

    try {
      const updated = await this.emailService
        .updateEmail(this._asset()!._id, this.editableHtml, 'manual')
        .toPromise();

      if (updated) {
        this._asset.set(updated);
        this.originalHtml = updated.html.fullHtml;
        this.assetUpdated.emit(updated);
      }
    } catch (error) {
      console.error('Save failed:', error);
    }
  }

  undoLastEdit() {
    const asset = this._asset();
    if (!asset || !asset.meta.editHistory.length) return;

    const lastEdit = asset.meta.editHistory[asset.meta.editHistory.length - 1];
    this.editableHtml = lastEdit.previousHtml;
  }

  resetToOriginal() {
    this.editableHtml = this.originalHtml;
  }

  async approveAsset() {
    if (!this._asset()) return;

    try {
      const updated = await this.emailService
        .approveEmail(this._asset()!._id)
        .toPromise();

      if (updated) {
        this._asset.set(updated);
        this.assetUpdated.emit(updated);
      }
    } catch (error) {
      console.error('Approval failed:', error);
    }
  }

  exportAsset() {
    if (!this._asset()) return;
    this.exportRequested.emit({
      asset: this._asset()!,
      format: this.selectedExportFormat,
    });
  }

  // Utilities
  formatEmailType(type: string | undefined): string {
    return EMAIL_TYPE_LABELS[type as keyof typeof EMAIL_TYPE_LABELS] || type || '';
  }

  formatStrategy(strategy: string | undefined): string {
    return STRATEGY_LABELS[strategy as keyof typeof STRATEGY_LABELS] || strategy || '';
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatHtml(html: string): string {
    let formatted = html;
    let indent = 0;
    const tab = '  ';

    formatted = formatted.replace(/>\s*</g, '>\n<');

    const lines = formatted.split('\n');
    const result: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('</')) indent--;
      result.push(tab.repeat(Math.max(0, indent)) + trimmed);
      if (
        trimmed.startsWith('<') &&
        !trimmed.startsWith('</') &&
        !trimmed.endsWith('/>') &&
        !trimmed.includes('</')
      ) {
        indent++;
      }
    }

    return result.join('\n');
  }
}

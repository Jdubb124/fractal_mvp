import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { BrandService, BrandGuide } from '../../core/services/brand.service';
import { DEFAULT_COLORS, CHAR_LIMITS } from './models/brand-guide.types';

@Component({
  selector: 'app-brand-guide',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent, LoadingComponent],
  template: `
    <app-layout>
      <div class="p-8 max-w-6xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold text-text-primary">Brand Guides</h1>
            <p class="text-text-secondary mt-1">
              Create and manage your brand identities
            </p>
          </div>
          <button
            (click)="startCreating()"
            class="btn btn-primary"
            [disabled]="isCreating()"
          >
            + New Guide
          </button>
        </div>

        <!-- Loading State -->
        @if (brandService.isLoading()) {
          <app-loading text="Loading brand guides..."></app-loading>
        } @else {
          <!-- Brand Guide Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            @for (guide of brandService.brandGuides(); track guide._id) {
              <div
                class="card cursor-pointer transition-all"
                [class.ring-2]="editingGuide()?._id === guide._id"
                [class.ring-accent-primary]="editingGuide()?._id === guide._id"
                (click)="selectGuide(guide)"
              >
                <div class="flex items-start justify-between mb-3">
                  <h3 class="font-semibold text-text-primary truncate flex-1">
                    {{ guide.name }}
                  </h3>
                  @if (brandService.selectedBrandGuide()._id === guide._id) {
                    <span class="text-xs bg-success/20 text-success px-2 py-0.5 rounded ml-2">
                      Active
                    </span>
                  }
                </div>

                <!-- Color Swatches -->
                <div class="flex gap-1.5 mb-3">
                  @for (color of guide.colors.slice(0, 6); track $index) {
                    <div
                      class="w-6 h-6 rounded-md border border-gray-300"
                      [style.backgroundColor]="color"
                    ></div>
                  }
                </div>

                <!-- Tone Preview -->
                @if (guide.tone) {
                  <p class="text-sm text-text-muted line-clamp-2">
                    {{ guide.tone }}
                  </p>
                }
              </div>
            }

            <!-- Empty State / Create Card -->
            @if (brandService.brandGuides().length === 0 && !isCreating()) {
              <div
                class="card border-2 border-dashed border-bg-hover cursor-pointer hover:border-accent-primary/50 transition-colors"
                (click)="startCreating()"
              >
                <div class="flex flex-col items-center justify-center py-8 text-center">
                  <div class="w-12 h-12 bg-bg-card rounded-full flex items-center justify-center mb-3">
                    <span class="text-2xl">+</span>
                  </div>
                  <h3 class="font-medium text-text-primary mb-1">Create Your First Brand Guide</h3>
                  <p class="text-sm text-text-muted">
                    Define your brand colors, tone, and messaging
                  </p>
                </div>
              </div>
            }
          </div>

          <!-- Edit/Create Form -->
          @if (editingGuide() || isCreating()) {
            <div class="card">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-semibold text-text-primary">
                  {{ isCreating() ? 'Create New Brand Guide' : 'Edit Brand Guide' }}
                </h2>
                <button
                  (click)="cancelEdit()"
                  class="text-text-muted hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
              </div>

              <!-- Error Message -->
              @if (errorMessage()) {
                <div class="bg-error/10 border border-error/50 rounded-lg p-4 mb-4">
                  <p class="text-error text-sm">{{ errorMessage() }}</p>
                </div>
              }

              <!-- Form -->
              <div class="space-y-6">
                <!-- Name -->
                <div>
                  <label class="form-label">
                    Name <span class="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="formName"
                    class="form-input w-full"
                    placeholder="e.g., Marketing Brand, Product Launch"
                    [maxlength]="CHAR_LIMITS.name"
                  />
                  <div class="flex justify-between mt-1">
                    <span class="text-xs text-text-muted">Give your brand guide a memorable name</span>
                    <span class="text-xs text-text-muted">{{ formName.length }}/{{ CHAR_LIMITS.name }}</span>
                  </div>
                </div>

                <!-- Colors -->
                <div>
                  <label class="form-label">Brand Colors</label>
                  <div class="grid grid-cols-3 md:grid-cols-6 gap-3">
                    @for (color of formColors; track $index; let i = $index) {
                      <div class="relative">
                        <input
                          type="color"
                          [value]="color"
                          (input)="updateColor(i, $event)"
                          class="sr-only"
                          [id]="'color-' + i"
                        />
                        <label
                          [for]="'color-' + i"
                          class="block w-full aspect-square rounded-lg cursor-pointer border-2 border-transparent hover:border-accent-primary/50 transition-colors"
                          [style.backgroundColor]="color"
                        ></label>
                        <input
                          type="text"
                          [value]="color"
                          (blur)="updateColorFromText(i, $event)"
                          class="mt-1.5 w-full text-xs text-center bg-bg-card border border-bg-hover rounded px-1 py-0.5 text-text-secondary font-mono"
                          placeholder="#000000"
                        />
                      </div>
                    }
                  </div>
                  <p class="text-xs text-text-muted mt-2">
                    Click on a color to change it, or enter a hex code directly
                  </p>
                </div>

                <!-- Tone -->
                <div>
                  <label class="form-label">Brand Tone</label>
                  <textarea
                    [(ngModel)]="formTone"
                    class="form-input w-full h-24 resize-none"
                    placeholder="e.g., Professional yet approachable, confident but not arrogant, innovative and forward-thinking..."
                    [maxlength]="CHAR_LIMITS.tone"
                  ></textarea>
                  <div class="flex justify-between mt-1">
                    <span class="text-xs text-text-muted">Describe the voice and personality of your brand</span>
                    <span class="text-xs text-text-muted">{{ formTone.length }}/{{ CHAR_LIMITS.tone }}</span>
                  </div>
                </div>

                <!-- Core Message -->
                <div>
                  <label class="form-label">Core Message</label>
                  <textarea
                    [(ngModel)]="formCoreMessage"
                    class="form-input w-full h-32 resize-none"
                    placeholder="e.g., We empower businesses to achieve their full potential through innovative technology solutions that simplify complexity and drive growth..."
                    [maxlength]="CHAR_LIMITS.coreMessage"
                  ></textarea>
                  <div class="flex justify-between mt-1">
                    <span class="text-xs text-text-muted">Your brand's primary value proposition and message</span>
                    <span class="text-xs text-text-muted">{{ formCoreMessage.length }}/{{ CHAR_LIMITS.coreMessage }}</span>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center justify-between pt-4 border-t border-bg-hover">
                  @if (!isCreating() && editingGuide()) {
                    <button
                      (click)="deleteGuide()"
                      class="btn btn-secondary text-error hover:bg-error/10"
                      [disabled]="isSaving()"
                    >
                      Delete Guide
                    </button>
                  } @else {
                    <div></div>
                  }

                  <div class="flex gap-3">
                    <button
                      (click)="cancelEdit()"
                      class="btn btn-secondary"
                      [disabled]="isSaving()"
                    >
                      Cancel
                    </button>
                    <button
                      (click)="saveGuide()"
                      class="btn btn-primary"
                      [disabled]="!canSave() || isSaving()"
                    >
                      {{ isSaving() ? 'Saving...' : (isCreating() ? 'Create Guide' : 'Save Changes') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        }
      </div>
    </app-layout>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class BrandGuideComponent implements OnInit {
  readonly brandService = inject(BrandService);
  readonly CHAR_LIMITS = CHAR_LIMITS;

  // Form state
  formName = '';
  formColors: string[] = [...DEFAULT_COLORS];
  formTone = '';
  formCoreMessage = '';

  // UI state
  private readonly _editingGuide = signal<BrandGuide | null>(null);
  private readonly _isCreating = signal(false);
  private readonly _isSaving = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly editingGuide = this._editingGuide.asReadonly();
  readonly isCreating = this._isCreating.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  canSave(): boolean {
    return this.formName.trim().length >= 1;
  }

  ngOnInit(): void {
    if (!this.brandService.isLoaded()) {
      this.brandService.getBrandGuides().subscribe();
    }
  }

  startCreating(): void {
    this._isCreating.set(true);
    this._editingGuide.set(null);
    this.resetForm();
  }

  selectGuide(guide: BrandGuide): void {
    this._isCreating.set(false);
    this._editingGuide.set(guide);
    this.loadGuideToForm(guide);
    this.brandService.selectBrandGuide(guide._id || null);
  }

  cancelEdit(): void {
    this._isCreating.set(false);
    this._editingGuide.set(null);
    this.resetForm();
  }

  updateColor(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.formColors[index] = input.value;
  }

  updateColorFromText(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
      this.formColors[index] = value;
    } else {
      // Reset to current value if invalid
      input.value = this.formColors[index];
    }
  }

  saveGuide(): void {
    console.log('saveGuide called', { canSave: this.canSave(), formName: this.formName });
    if (!this.canSave()) return;

    this._isSaving.set(true);

    const guideData = {
      name: this.formName.trim(),
      colors: [...this.formColors],
      tone: this.formTone.trim(),
      coreMessage: this.formCoreMessage.trim(),
    };

    console.log('Saving guide data:', guideData);
    this._errorMessage.set(null);

    if (this.isCreating()) {
      this.brandService.createBrandGuide(guideData).subscribe({
        next: (guide) => {
          this._isSaving.set(false);
          this._isCreating.set(false);
          this._editingGuide.set(guide);
        },
        error: (err) => {
          this._isSaving.set(false);
          const message = err.error?.message || err.error?.error || 'Failed to create brand guide';
          this._errorMessage.set(message);
          console.error('Failed to create brand guide:', err);
        }
      });
    } else if (this.editingGuide()?._id) {
      this.brandService.updateBrandGuide(this.editingGuide()!._id!, guideData).subscribe({
        next: (guide) => {
          this._isSaving.set(false);
          this._editingGuide.set(guide);
        },
        error: (err) => {
          this._isSaving.set(false);
          const message = err.error?.message || err.error?.error || 'Failed to update brand guide';
          this._errorMessage.set(message);
          console.error('Failed to update brand guide:', err);
        }
      });
    }
  }

  deleteGuide(): void {
    const guide = this.editingGuide();
    if (!guide?._id) return;

    if (confirm(`Are you sure you want to delete "${guide.name}"?`)) {
      this._isSaving.set(true);
      this.brandService.deleteBrandGuide(guide._id).subscribe({
        next: () => {
          this._isSaving.set(false);
          this._editingGuide.set(null);
          this.resetForm();
        },
        error: (err) => {
          this._isSaving.set(false);
          console.error('Failed to delete brand guide:', err);
        }
      });
    }
  }

  private resetForm(): void {
    this.formName = '';
    this.formColors = [...DEFAULT_COLORS];
    this.formTone = '';
    this.formCoreMessage = '';
  }

  private loadGuideToForm(guide: BrandGuide): void {
    this.formName = guide.name;
    this.formColors = guide.colors.length > 0
      ? [...guide.colors, ...DEFAULT_COLORS].slice(0, 6)
      : [...DEFAULT_COLORS];
    this.formTone = guide.tone || '';
    this.formCoreMessage = guide.coreMessage || '';
  }
}

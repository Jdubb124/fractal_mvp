import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { AudienceService, Audience } from '../../core/services/audience.service';

const CHAR_LIMITS = {
  name: 100,
  description: 300,
  preferredTone: 300,
  income: 100,
  other: 200,
} as const;

@Component({
  selector: 'app-audiences-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="p-8 max-w-6xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold text-text-primary">Audience Segments</h1>
            <p class="text-text-secondary mt-1">
              Define and manage your target audience segments
            </p>
          </div>
          <button
            (click)="startCreating()"
            class="btn btn-primary"
            [disabled]="isCreating()"
          >
            + New Segment
          </button>
        </div>

        <!-- Audience Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          @for (audience of audienceService.audiences(); track audience._id) {
            <div
              class="card cursor-pointer transition-all"
              [class.ring-2]="editingAudience()?._id === audience._id"
              [class.ring-segment]="editingAudience()?._id === audience._id"
              (click)="selectAudience(audience)"
            >
              <div class="flex items-start justify-between mb-3">
                <h3 class="font-semibold text-text-primary truncate flex-1">
                  {{ audience.name }}
                </h3>
                <span
                  class="text-xs px-2 py-0.5 rounded ml-2"
                  [class.bg-success/20]="audience.isActive"
                  [class.text-success]="audience.isActive"
                  [class.bg-text-muted/20]="!audience.isActive"
                  [class.text-text-muted]="!audience.isActive"
                >
                  {{ audience.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>

              <!-- Propensity Badge -->
              <div class="flex items-center gap-2 mb-3">
                <span
                  class="text-xs font-medium px-2 py-0.5 rounded"
                  [class.bg-success/20]="audience.propensityLevel === 'High'"
                  [class.text-success]="audience.propensityLevel === 'High'"
                  [class.bg-warning/20]="audience.propensityLevel === 'Medium'"
                  [class.text-warning]="audience.propensityLevel === 'Medium'"
                  [class.bg-error/20]="audience.propensityLevel === 'Low'"
                  [class.text-error]="audience.propensityLevel === 'Low'"
                >
                  {{ audience.propensityLevel }} Propensity
                </span>
              </div>

              <!-- Demographics Preview -->
              @if (audience.demographics) {
                <p class="text-sm text-text-muted line-clamp-1 mb-2">
                  @if (audience.demographics.ageRange) {
                    {{ audience.demographics.ageRange.min }}-{{ audience.demographics.ageRange.max }} yrs
                  }
                  @if (audience.demographics.location?.length) {
                    · {{ audience.demographics.location.slice(0, 2).join(', ') }}
                  }
                </p>
              }

              <!-- Pain Points Preview -->
              @if (audience.painPoints?.length) {
                <div class="flex flex-wrap gap-1">
                  @for (point of audience.painPoints.slice(0, 2); track $index) {
                    <span class="text-xs bg-segment/10 text-segment px-2 py-0.5 rounded">
                      {{ point }}
                    </span>
                  }
                  @if (audience.painPoints.length > 2) {
                    <span class="text-xs text-text-muted">
                      +{{ audience.painPoints.length - 2 }} more
                    </span>
                  }
                </div>
              }
            </div>
          }

          <!-- Empty State -->
          @if (audienceService.audiences().length === 0 && !isCreating()) {
            <div
              class="card border-2 border-dashed border-bg-hover cursor-pointer hover:border-segment/50 transition-colors"
              (click)="startCreating()"
            >
              <div class="flex flex-col items-center justify-center py-8 text-center">
                <div class="w-12 h-12 bg-bg-card rounded-full flex items-center justify-center mb-3">
                  <span class="text-2xl">+</span>
                </div>
                <h3 class="font-medium text-text-primary mb-1">Create Your First Segment</h3>
                <p class="text-sm text-text-muted">
                  Define audience demographics, behaviors, and messaging preferences
                </p>
              </div>
            </div>
          }
        </div>

        <!-- Create/Edit Form -->
        @if (editingAudience() || isCreating()) {
          <div class="card">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-semibold text-text-primary">
                {{ isCreating() ? 'Create New Segment' : 'Edit Segment' }}
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
                  Segment Name <span class="text-error">*</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="formName"
                  class="form-input w-full"
                  placeholder="e.g., High-Value Repeat Buyers, Cart Abandoners"
                  [maxlength]="CHAR_LIMITS.name"
                />
                <div class="flex justify-between mt-1">
                  <span class="text-xs text-text-muted">A clear name for this audience segment</span>
                  <span class="text-xs text-text-muted">{{ formName.length }}/{{ CHAR_LIMITS.name }}</span>
                </div>
              </div>

              <!-- Description -->
              <div>
                <label class="form-label">Description</label>
                <textarea
                  [(ngModel)]="formDescription"
                  class="form-input w-full h-20 resize-none"
                  placeholder="e.g., Customers who have purchased 3+ times in the last 6 months with AOV over $75..."
                  [maxlength]="CHAR_LIMITS.description"
                ></textarea>
                <div class="flex justify-between mt-1">
                  <span class="text-xs text-text-muted">Brief description of who this segment represents</span>
                  <span class="text-xs text-text-muted">{{ formDescription.length }}/{{ CHAR_LIMITS.description }}</span>
                </div>
              </div>

              <!-- Demographics Section -->
              <div class="border-t border-bg-hover pt-6">
                <h3 class="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Demographics</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Age Range -->
                  <div>
                    <label class="form-label">Age Range</label>
                    <div class="flex items-center gap-2">
                      <input
                        type="number"
                        [(ngModel)]="formAgeMin"
                        class="form-input w-full"
                        placeholder="18"
                        min="13"
                        max="99"
                      />
                      <span class="text-text-muted">to</span>
                      <input
                        type="number"
                        [(ngModel)]="formAgeMax"
                        class="form-input w-full"
                        placeholder="65"
                        min="13"
                        max="99"
                      />
                    </div>
                  </div>

                  <!-- Income -->
                  <div>
                    <label class="form-label">Income Level</label>
                    <input
                      type="text"
                      [(ngModel)]="formIncome"
                      class="form-input w-full"
                      placeholder="e.g., $50K-$100K"
                      [maxlength]="CHAR_LIMITS.income"
                    />
                  </div>

                  <!-- Location -->
                  <div class="md:col-span-2">
                    <label class="form-label">Locations</label>
                    <input
                      type="text"
                      [(ngModel)]="formLocationInput"
                      class="form-input w-full"
                      placeholder="Type a location and press Enter"
                      (keydown.enter)="addLocation($event)"
                    />
                    @if (formLocations.length) {
                      <div class="flex flex-wrap gap-2 mt-2">
                        @for (loc of formLocations; track $index) {
                          <span class="inline-flex items-center gap-1 text-xs bg-segment/10 text-segment px-2 py-1 rounded">
                            {{ loc }}
                            <button (click)="removeLocation($index)" class="hover:text-error transition-colors">&times;</button>
                          </span>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- Behavioral Section -->
              <div class="border-t border-bg-hover pt-6">
                <h3 class="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Behavioral</h3>

                <!-- Propensity Level -->
                <div class="mb-4">
                  <label class="form-label">Propensity Level <span class="text-error">*</span></label>
                  <div class="flex gap-3">
                    @for (level of propensityLevels; track level) {
                      <button
                        type="button"
                        (click)="formPropensity = level"
                        class="flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all"
                        [class.border-success]="formPropensity === level && level === 'High'"
                        [class.bg-success/10]="formPropensity === level && level === 'High'"
                        [class.text-success]="formPropensity === level && level === 'High'"
                        [class.border-warning]="formPropensity === level && level === 'Medium'"
                        [class.bg-warning/10]="formPropensity === level && level === 'Medium'"
                        [class.text-warning]="formPropensity === level && level === 'Medium'"
                        [class.border-error]="formPropensity === level && level === 'Low'"
                        [class.bg-error/10]="formPropensity === level && level === 'Low'"
                        [class.text-error]="formPropensity === level && level === 'Low'"
                        [class.border-bg-hover]="formPropensity !== level"
                        [class.text-text-muted]="formPropensity !== level"
                      >
                        {{ level }}
                      </button>
                    }
                  </div>
                  <p class="text-xs text-text-muted mt-1">How likely this segment is to convert</p>
                </div>

                <!-- Interests -->
                <div class="mb-4">
                  <label class="form-label">Interests</label>
                  <input
                    type="text"
                    [(ngModel)]="formInterestInput"
                    class="form-input w-full"
                    placeholder="Type an interest and press Enter"
                    (keydown.enter)="addInterest($event)"
                  />
                  @if (formInterests.length) {
                    <div class="flex flex-wrap gap-2 mt-2">
                      @for (interest of formInterests; track $index) {
                        <span class="inline-flex items-center gap-1 text-xs bg-segment/10 text-segment px-2 py-1 rounded">
                          {{ interest }}
                          <button (click)="removeInterest($index)" class="hover:text-error transition-colors">&times;</button>
                        </span>
                      }
                    </div>
                  }
                </div>

                <!-- Pain Points -->
                <div>
                  <label class="form-label">Pain Points</label>
                  <input
                    type="text"
                    [(ngModel)]="formPainPointInput"
                    class="form-input w-full"
                    placeholder="Type a pain point and press Enter"
                    (keydown.enter)="addPainPoint($event)"
                  />
                  @if (formPainPoints.length) {
                    <div class="flex flex-wrap gap-2 mt-2">
                      @for (point of formPainPoints; track $index) {
                        <span class="inline-flex items-center gap-1 text-xs bg-segment/10 text-segment px-2 py-1 rounded">
                          {{ point }}
                          <button (click)="removePainPoint($index)" class="hover:text-error transition-colors">&times;</button>
                        </span>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Messaging Preferences Section -->
              <div class="border-t border-bg-hover pt-6">
                <h3 class="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Messaging Preferences</h3>

                <!-- Preferred Tone -->
                <div class="mb-4">
                  <label class="form-label">Preferred Tone</label>
                  <textarea
                    [(ngModel)]="formPreferredTone"
                    class="form-input w-full h-20 resize-none"
                    placeholder="e.g., Friendly and conversational, with urgency-driven CTAs. Avoid corporate jargon..."
                    [maxlength]="CHAR_LIMITS.preferredTone"
                  ></textarea>
                  <div class="flex justify-between mt-1">
                    <span class="text-xs text-text-muted">How should messaging sound for this audience?</span>
                    <span class="text-xs text-text-muted">{{ formPreferredTone.length }}/{{ CHAR_LIMITS.preferredTone }}</span>
                  </div>
                </div>

                <!-- Key Motivators -->
                <div>
                  <label class="form-label">Key Motivators</label>
                  <input
                    type="text"
                    [(ngModel)]="formMotivatorInput"
                    class="form-input w-full"
                    placeholder="Type a motivator and press Enter"
                    (keydown.enter)="addMotivator($event)"
                  />
                  @if (formMotivators.length) {
                    <div class="flex flex-wrap gap-2 mt-2">
                      @for (motivator of formMotivators; track $index) {
                        <span class="inline-flex items-center gap-1 text-xs bg-segment/10 text-segment px-2 py-1 rounded">
                          {{ motivator }}
                          <button (click)="removeMotivator($index)" class="hover:text-error transition-colors">&times;</button>
                        </span>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Meta Section -->
              <div class="border-t border-bg-hover pt-6">
                <h3 class="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Meta</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Estimated Size -->
                  <div>
                    <label class="form-label">Estimated Segment Size</label>
                    <input
                      type="number"
                      [(ngModel)]="formEstimatedSize"
                      class="form-input w-full"
                      placeholder="e.g., 5000"
                      min="0"
                    />
                    <span class="text-xs text-text-muted mt-1">Approximate number of people in this segment</span>
                  </div>

                  <!-- Active Status -->
                  <div>
                    <label class="form-label">Status</label>
                    <button
                      type="button"
                      (click)="formIsActive = !formIsActive"
                      class="flex items-center gap-2 py-2 px-3 rounded-lg border transition-all"
                      [class.border-success]="formIsActive"
                      [class.bg-success/10]="formIsActive"
                      [class.border-bg-hover]="!formIsActive"
                    >
                      <span
                        class="w-3 h-3 rounded-full"
                        [class.bg-success]="formIsActive"
                        [class.bg-text-muted]="!formIsActive"
                      ></span>
                      <span class="text-sm" [class.text-success]="formIsActive" [class.text-text-muted]="!formIsActive">
                        {{ formIsActive ? 'Active' : 'Inactive' }}
                      </span>
                    </button>
                    <span class="text-xs text-text-muted mt-1 block">Only active segments can be used in campaigns</span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center justify-between pt-4 border-t border-bg-hover">
                @if (!isCreating() && editingAudience()) {
                  <button
                    (click)="deleteAudience()"
                    class="btn btn-secondary text-error hover:bg-error/10"
                    [disabled]="isSaving()"
                  >
                    Delete Segment
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
                    (click)="saveAudience()"
                    class="btn btn-primary"
                    [disabled]="!canSave() || isSaving()"
                  >
                    {{ isSaving() ? 'Saving...' : (isCreating() ? 'Create Segment' : 'Save Changes') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </app-layout>
  `,
  styles: [`
    .line-clamp-1 {
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class AudiencesListComponent implements OnInit {
  readonly audienceService = inject(AudienceService);
  readonly CHAR_LIMITS = CHAR_LIMITS;
  readonly propensityLevels: ('High' | 'Medium' | 'Low')[] = ['High', 'Medium', 'Low'];

  // Form state
  formName = '';
  formDescription = '';
  formAgeMin: number | null = null;
  formAgeMax: number | null = null;
  formIncome = '';
  formLocations: string[] = [];
  formLocationInput = '';
  formPropensity: 'High' | 'Medium' | 'Low' = 'Medium';
  formInterests: string[] = [];
  formInterestInput = '';
  formPainPoints: string[] = [];
  formPainPointInput = '';
  formPreferredTone = '';
  formMotivators: string[] = [];
  formMotivatorInput = '';
  formEstimatedSize: number | null = null;
  formIsActive = true;

  // UI state
  private readonly _editingAudience = signal<Audience | null>(null);
  private readonly _isCreating = signal(false);
  private readonly _isSaving = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly editingAudience = this._editingAudience.asReadonly();
  readonly isCreating = this._isCreating.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  canSave(): boolean {
    return this.formName.trim().length >= 1;
  }

  ngOnInit(): void {
    this.audienceService.getAudiences().subscribe();
  }

  startCreating(): void {
    this._isCreating.set(true);
    this._editingAudience.set(null);
    this.resetForm();
  }

  selectAudience(audience: Audience): void {
    this._isCreating.set(false);
    this._editingAudience.set(audience);
    this.loadAudienceToForm(audience);
  }

  cancelEdit(): void {
    this._isCreating.set(false);
    this._editingAudience.set(null);
    this.resetForm();
  }

  // Tag input helpers
  addLocation(event: Event): void {
    event.preventDefault();
    const value = this.formLocationInput.trim();
    if (value && !this.formLocations.includes(value)) {
      this.formLocations = [...this.formLocations, value];
    }
    this.formLocationInput = '';
  }

  removeLocation(index: number): void {
    this.formLocations = this.formLocations.filter((_, i) => i !== index);
  }

  addInterest(event: Event): void {
    event.preventDefault();
    const value = this.formInterestInput.trim();
    if (value && !this.formInterests.includes(value)) {
      this.formInterests = [...this.formInterests, value];
    }
    this.formInterestInput = '';
  }

  removeInterest(index: number): void {
    this.formInterests = this.formInterests.filter((_, i) => i !== index);
  }

  addPainPoint(event: Event): void {
    event.preventDefault();
    const value = this.formPainPointInput.trim();
    if (value && !this.formPainPoints.includes(value)) {
      this.formPainPoints = [...this.formPainPoints, value];
    }
    this.formPainPointInput = '';
  }

  removePainPoint(index: number): void {
    this.formPainPoints = this.formPainPoints.filter((_, i) => i !== index);
  }

  addMotivator(event: Event): void {
    event.preventDefault();
    const value = this.formMotivatorInput.trim();
    if (value && !this.formMotivators.includes(value)) {
      this.formMotivators = [...this.formMotivators, value];
    }
    this.formMotivatorInput = '';
  }

  removeMotivator(index: number): void {
    this.formMotivators = this.formMotivators.filter((_, i) => i !== index);
  }

  saveAudience(): void {
    if (!this.canSave()) return;

    this._isSaving.set(true);
    this._errorMessage.set(null);

    const audienceData: Partial<Audience> = {
      name: this.formName.trim(),
      description: this.formDescription.trim() || undefined,
      demographics: {
        ageRange: (this.formAgeMin && this.formAgeMax)
          ? { min: this.formAgeMin, max: this.formAgeMax }
          : undefined,
        income: this.formIncome.trim() || undefined,
        location: this.formLocations,
      },
      propensityLevel: this.formPropensity,
      interests: this.formInterests,
      painPoints: this.formPainPoints,
      preferredTone: this.formPreferredTone.trim() || undefined,
      keyMotivators: this.formMotivators,
      estimatedSize: this.formEstimatedSize || undefined,
      isActive: this.formIsActive,
    };

    if (this.isCreating()) {
      this.audienceService.createAudience(audienceData).subscribe({
        next: (audience) => {
          this._isSaving.set(false);
          this._isCreating.set(false);
          this._editingAudience.set(audience);
        },
        error: (err) => {
          this._isSaving.set(false);
          const message = err.error?.message || err.error?.error || 'Failed to create audience segment';
          this._errorMessage.set(message);
        }
      });
    } else if (this.editingAudience()?._id) {
      this.audienceService.updateAudience(this.editingAudience()!._id, audienceData).subscribe({
        next: (audience) => {
          this._isSaving.set(false);
          this._editingAudience.set(audience);
        },
        error: (err) => {
          this._isSaving.set(false);
          const message = err.error?.message || err.error?.error || 'Failed to update audience segment';
          this._errorMessage.set(message);
        }
      });
    }
  }

  deleteAudience(): void {
    const audience = this.editingAudience();
    if (!audience?._id) return;

    if (confirm(`Are you sure you want to delete "${audience.name}"?`)) {
      this._isSaving.set(true);
      this.audienceService.deleteAudience(audience._id).subscribe({
        next: () => {
          this._isSaving.set(false);
          this._editingAudience.set(null);
          this.resetForm();
        },
        error: (err) => {
          this._isSaving.set(false);
          const message = err.error?.message || err.error?.error || 'Failed to delete audience segment';
          this._errorMessage.set(message);
        }
      });
    }
  }

  private resetForm(): void {
    this.formName = '';
    this.formDescription = '';
    this.formAgeMin = null;
    this.formAgeMax = null;
    this.formIncome = '';
    this.formLocations = [];
    this.formLocationInput = '';
    this.formPropensity = 'Medium';
    this.formInterests = [];
    this.formInterestInput = '';
    this.formPainPoints = [];
    this.formPainPointInput = '';
    this.formPreferredTone = '';
    this.formMotivators = [];
    this.formMotivatorInput = '';
    this.formEstimatedSize = null;
    this.formIsActive = true;
  }

  private loadAudienceToForm(audience: Audience): void {
    this.formName = audience.name;
    this.formDescription = audience.description || '';
    this.formAgeMin = audience.demographics?.ageRange?.min || null;
    this.formAgeMax = audience.demographics?.ageRange?.max || null;
    this.formIncome = audience.demographics?.income || '';
    this.formLocations = audience.demographics?.location ? [...audience.demographics.location] : [];
    this.formLocationInput = '';
    this.formPropensity = audience.propensityLevel || 'Medium';
    this.formInterests = audience.interests ? [...audience.interests] : [];
    this.formInterestInput = '';
    this.formPainPoints = audience.painPoints ? [...audience.painPoints] : [];
    this.formPainPointInput = '';
    this.formPreferredTone = audience.preferredTone || '';
    this.formMotivators = audience.keyMotivators ? [...audience.keyMotivators] : [];
    this.formMotivatorInput = '';
    this.formEstimatedSize = audience.estimatedSize || null;
    this.formIsActive = audience.isActive;
  }
}

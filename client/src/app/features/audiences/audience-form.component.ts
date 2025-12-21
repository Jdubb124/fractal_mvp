import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { AudienceService } from '../../core/services/audience.service';

@Component({
  selector: 'app-audience-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, LayoutComponent, LoadingComponent],
  template: `
    <app-layout>
      <div class="p-8 max-w-3xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <a routerLink="/audiences" class="text-sm text-text-muted hover:text-accent-primary mb-4 inline-block">
            ← Back to Audiences
          </a>
          <h1 class="text-2xl font-bold text-text-primary">
            {{ isEditMode() ? 'Edit Audience' : 'Create Audience' }}
          </h1>
        </div>

        @if (loading()) {
          <app-loading text="Loading..."></app-loading>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <!-- Basic Info -->
            <div class="card mb-6">
              <h2 class="text-lg font-semibold mb-4">Basic Information</h2>
              
              <div class="mb-4">
                <label class="form-label">Audience Name *</label>
                <input
                  type="text"
                  formControlName="name"
                  class="form-input"
                  placeholder="e.g., High-Value Customers, College Students"
                />
              </div>

              <div class="mb-4">
                <label class="form-label">Description</label>
                <textarea
                  formControlName="description"
                  class="form-input"
                  rows="3"
                  placeholder="Describe this audience segment..."
                ></textarea>
              </div>

              <div>
                <label class="form-label">Propensity Level</label>
                <select formControlName="propensityLevel" class="form-input">
                  <option value="High">High - Likely to convert</option>
                  <option value="Medium">Medium - May need nurturing</option>
                  <option value="Low">Low - Awareness focused</option>
                </select>
              </div>
            </div>

            <!-- Demographics -->
            <div class="card mb-6" formGroupName="demographics">
              <h2 class="text-lg font-semibold mb-4">Demographics</h2>
              
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div formGroupName="ageRange">
                  <label class="form-label">Age Range</label>
                  <div class="flex items-center gap-2">
                    <input
                      type="number"
                      formControlName="min"
                      class="form-input"
                      placeholder="Min"
                      min="0"
                      max="120"
                    />
                    <span class="text-text-muted">to</span>
                    <input
                      type="number"
                      formControlName="max"
                      class="form-input"
                      placeholder="Max"
                      min="0"
                      max="120"
                    />
                  </div>
                </div>
                <div>
                  <label class="form-label">Income Level</label>
                  <input
                    type="text"
                    formControlName="income"
                    class="form-input"
                    placeholder="e.g., $75k-$150k"
                  />
                </div>
              </div>

              <div>
                <label class="form-label">Location (comma separated)</label>
                <input
                  type="text"
                  [value]="getLocationString()"
                  (input)="updateLocations($event)"
                  class="form-input"
                  placeholder="e.g., New York, California, Texas"
                />
              </div>
            </div>

            <!-- Behavioral -->
            <div class="card mb-6">
              <h2 class="text-lg font-semibold mb-4">Behavioral Insights</h2>
              
              <div class="mb-4">
                <label class="form-label">Interests (comma separated)</label>
                <input
                  type="text"
                  [value]="getArrayString('interests')"
                  (input)="updateArray('interests', $event)"
                  class="form-input"
                  placeholder="e.g., Technology, Health, Travel"
                />
              </div>

              <div class="mb-4">
                <label class="form-label">Pain Points (comma separated)</label>
                <input
                  type="text"
                  [value]="getArrayString('painPoints')"
                  (input)="updateArray('painPoints', $event)"
                  class="form-input"
                  placeholder="e.g., Limited time, Budget constraints"
                />
              </div>

              <div class="mb-4">
                <label class="form-label">Key Motivators (comma separated)</label>
                <input
                  type="text"
                  [value]="getArrayString('keyMotivators')"
                  (input)="updateArray('keyMotivators', $event)"
                  class="form-input"
                  placeholder="e.g., Save money, Convenience, Quality"
                />
              </div>

              <div>
                <label class="form-label">Preferred Tone</label>
                <input
                  type="text"
                  formControlName="preferredTone"
                  class="form-input"
                  placeholder="e.g., Casual and friendly, Professional"
                />
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-4">
              <button
                type="submit"
                [disabled]="form.invalid || saving()"
                class="btn btn-primary flex-1"
              >
                @if (saving()) {
                  Saving...
                } @else {
                  {{ isEditMode() ? 'Update Audience' : 'Create Audience' }}
                }
              </button>
              <a routerLink="/audiences" class="btn btn-secondary">
                Cancel
              </a>
            </div>
          </form>
        }
      </div>
    </app-layout>
  `,
})
export class AudienceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private audienceService = inject(AudienceService);

  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  audienceId = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    propensityLevel: ['Medium'],
    demographics: this.fb.group({
      ageRange: this.fb.group({
        min: [null],
        max: [null],
      }),
      income: [''],
      location: [[]],
    }),
    interests: [[]],
    painPoints: [[]],
    keyMotivators: [[]],
    preferredTone: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.audienceId.set(id);
      this.loadAudience(id);
    }
  }

  loadAudience(id: string): void {
    this.loading.set(true);
    this.audienceService.getAudience(id).subscribe({
      next: (response) => {
        const audience = response.data.audience;
        this.form.patchValue({
          name: audience.name,
          description: audience.description,
          propensityLevel: audience.propensityLevel,
          demographics: {
            ageRange: audience.demographics?.ageRange || {},
            income: audience.demographics?.income || '',
            location: audience.demographics?.location || [],
          },
          interests: audience.interests || [],
          painPoints: audience.painPoints || [],
          keyMotivators: audience.keyMotivators || [],
          preferredTone: audience.preferredTone || '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/audiences']);
      },
    });
  }

  getLocationString(): string {
    const locations = this.form.get('demographics.location')?.value || [];
    return locations.join(', ');
  }

  updateLocations(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const locations = value.split(',').map(s => s.trim()).filter(Boolean);
    this.form.get('demographics.location')?.setValue(locations);
  }

  getArrayString(field: string): string {
    const arr = this.form.get(field)?.value || [];
    return arr.join(', ');
  }

  updateArray(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const arr = value.split(',').map(s => s.trim()).filter(Boolean);
    this.form.get(field)?.setValue(arr);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const data = this.form.value;

    const request = this.isEditMode()
      ? this.audienceService.updateAudience(this.audienceId()!, data)
      : this.audienceService.createAudience(data);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/audiences']);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }
}
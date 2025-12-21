import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { BrandService, BrandGuide } from '../../core/services/brand.service';

@Component({
  selector: 'app-brand-guide',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, LayoutComponent, LoadingComponent],
  template: `
    <app-layout>
      <div class="p-8 max-w-3xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-text-primary mb-2">Brand Guide</h1>
          <p class="text-text-secondary">
            Define your brand voice and messaging guidelines for AI-generated content.
          </p>
        </div>

        @if (brandService.isLoading() && !brandService.isLoaded()) {
          <app-loading text="Loading brand guide..."></app-loading>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <!-- Company Info -->
            <div class="card mb-6">
              <h2 class="text-lg font-semibold mb-4">Company Information</h2>
              
              <div class="mb-4">
                <label class="form-label">Company Name *</label>
                <input
                  type="text"
                  formControlName="companyName"
                  class="form-input"
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label class="form-label">Industry</label>
                <input
                  type="text"
                  formControlName="industry"
                  class="form-input"
                  placeholder="e.g., Healthcare, E-commerce, SaaS"
                />
              </div>
            </div>

            <!-- Voice & Tone -->
            <div class="card mb-6">
              <h2 class="text-lg font-semibold mb-4">Voice & Tone</h2>
              
              <div class="mb-4">
                <label class="form-label">Voice Attributes (comma separated)</label>
                <input
                  type="text"
                  [value]="getArrayString('voiceAttributes')"
                  (input)="updateArray('voiceAttributes', $event)"
                  class="form-input"
                  placeholder="e.g., Professional, Friendly, Expert, Approachable"
                />
                <p class="text-xs text-text-muted mt-1">
                  These words describe how your brand should sound in all communications.
                </p>
              </div>

              <div>
                <label class="form-label">Tone Guidelines</label>
                <textarea
                  formControlName="toneGuidelines"
                  class="form-input"
                  rows="4"
                  placeholder="Describe the overall tone your brand should maintain..."
                ></textarea>
              </div>
            </div>

            <!-- Messaging -->
            <div class="card mb-6">
              <h2 class="text-lg font-semibold mb-4">Messaging</h2>
              
              <div class="mb-4">
                <label class="form-label">Value Proposition</label>
                <textarea
                  formControlName="valueProposition"
                  class="form-input"
                  rows="3"
                  placeholder="What unique value does your company provide?"
                ></textarea>
              </div>

              <div class="mb-4">
                <label class="form-label">Key Messages (comma separated)</label>
                <input
                  type="text"
                  [value]="getArrayString('keyMessages')"
                  (input)="updateArray('keyMessages', $event)"
                  class="form-input"
                  placeholder="e.g., Save time, Increase revenue, Simplify workflow"
                />
              </div>

              <div>
                <label class="form-label">Phrases to Avoid (comma separated)</label>
                <input
                  type="text"
                  [value]="getArrayString('avoidPhrases')"
                  (input)="updateArray('avoidPhrases', $event)"
                  class="form-input"
                  placeholder="e.g., Cheap, Discount, Limited time only"
                />
                <p class="text-xs text-text-muted mt-1">
                  Words or phrases that don't align with your brand.
                </p>
              </div>
            </div>

            <!-- Audience Context -->
            <div class="card mb-6">
              <h2 class="text-lg font-semibold mb-4">Audience Context</h2>
              
              <div class="mb-4">
                <label class="form-label">Target Audience Description</label>
                <textarea
                  formControlName="targetAudience"
                  class="form-input"
                  rows="3"
                  placeholder="Describe your ideal customer..."
                ></textarea>
              </div>

              <div>
                <label class="form-label">Competitor Context</label>
                <textarea
                  formControlName="competitorContext"
                  class="form-input"
                  rows="3"
                  placeholder="How do you differentiate from competitors?"
                ></textarea>
              </div>
            </div>

            <!-- Visual (Optional) -->
            <div class="card mb-6">
              <h2 class="text-lg font-semibold mb-4">Visual Identity (Optional)</h2>
              
              <div>
                <label class="form-label">Primary Brand Colors (comma separated hex codes)</label>
                <input
                  type="text"
                  [value]="getArrayString('primaryColors')"
                  (input)="updateArray('primaryColors', $event)"
                  class="form-input"
                  placeholder="e.g., #6366f1, #8b5cf6, #10b981"
                />
                @if (form.get('primaryColors')?.value?.length > 0) {
                  <div class="flex gap-2 mt-2">
                    @for (color of form.get('primaryColors')?.value; track color) {
                      <div 
                        class="w-8 h-8 rounded border border-border-color"
                        [style.background-color]="color"
                      ></div>
                    }
                  </div>
                }
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
                  {{ brandService.hasBrandGuide() ? 'Update Brand Guide' : 'Create Brand Guide' }}
                }
              </button>
              @if (brandService.hasBrandGuide()) {
                <button
                  type="button"
                  (click)="deleteBrandGuide()"
                  class="btn btn-secondary text-error"
                >
                  Delete
                </button>
              }
            </div>
          </form>
        }
      </div>
    </app-layout>
  `,
})
export class BrandGuideComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  brandService = inject(BrandService);

  saving = signal(false);

  form: FormGroup = this.fb.group({
    companyName: ['', [Validators.required]],
    industry: [''],
    voiceAttributes: [[]],
    toneGuidelines: [''],
    valueProposition: [''],
    keyMessages: [[]],
    avoidPhrases: [[]],
    targetAudience: [''],
    competitorContext: [''],
    primaryColors: [[]],
  });

  ngOnInit(): void {
    this.brandService.getBrandGuide().subscribe({
      next: (response) => {
        if (response.data.brandGuide) {
          this.populateForm(response.data.brandGuide);
        }
      },
    });
  }

  populateForm(brandGuide: BrandGuide): void {
    this.form.patchValue({
      companyName: brandGuide.companyName,
      industry: brandGuide.industry || '',
      voiceAttributes: brandGuide.voiceAttributes || [],
      toneGuidelines: brandGuide.toneGuidelines || '',
      valueProposition: brandGuide.valueProposition || '',
      keyMessages: brandGuide.keyMessages || [],
      avoidPhrases: brandGuide.avoidPhrases || [],
      targetAudience: brandGuide.targetAudience || '',
      competitorContext: brandGuide.competitorContext || '',
      primaryColors: brandGuide.primaryColors || [],
    });
  }

  getArrayString(field: string): string {
    return (this.form.get(field)?.value || []).join(', ');
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

    const request = this.brandService.hasBrandGuide()
      ? this.brandService.updateBrandGuide(this.brandService.brandGuide()!._id, data)
      : this.brandService.createBrandGuide(data);

    request.subscribe({
      next: () => {
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  deleteBrandGuide(): void {
    if (!this.brandService.brandGuide()) return;

    if (confirm('Are you sure you want to delete your brand guide? This cannot be undone.')) {
      this.brandService.deleteBrandGuide(this.brandService.brandGuide()!._id).subscribe({
        next: () => {
          this.form.reset();
        },
      });
    }
  }
}
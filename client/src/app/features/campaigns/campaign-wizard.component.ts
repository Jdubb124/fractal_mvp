import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { CampaignService } from '../../core/services/campaign.service';
import { AudienceService } from '../../core/services/audience.service';
import { BrandService } from '../../core/services/brand.service';

@Component({
  selector: 'app-campaign-wizard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="p-8 max-w-3xl mx-auto">
        <div class="mb-8">
          <a routerLink="/campaigns" class="text-sm text-text-muted hover:text-accent-primary mb-4 inline-block">← Back to Campaigns</a>
          <h1 class="text-2xl font-bold text-text-primary">Create Campaign</h1>
          <p class="text-text-secondary mt-2">Set up your campaign in a few simple steps.</p>
        </div>

        @if (!brandService.hasBrandGuide()) {
          <div class="card text-center py-12">
            <div class="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl">⚠️</span>
            </div>
            <h3 class="text-lg font-medium text-text-primary mb-2">Brand Guide Required</h3>
            <p class="text-text-secondary mb-4">Please create your brand guide before creating campaigns.</p>
            <a routerLink="/brand" class="btn btn-primary">Create Brand Guide</a>
          </div>
        } @else if (audienceService.audiences().length === 0) {
          <div class="card text-center py-12">
            <div class="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl">⚠️</span>
            </div>
            <h3 class="text-lg font-medium text-text-primary mb-2">Audiences Required</h3>
            <p class="text-text-secondary mb-4">Please create at least one audience segment before creating campaigns.</p>
            <a routerLink="/audiences/new" class="btn btn-primary">Create Audience</a>
          </div>
        } @else {
          <!-- Step Indicator -->
          <div class="flex items-center justify-between mb-8">
            @for (step of steps; track step.id; let i = $index) {
              <div class="flex items-center gap-2 cursor-pointer" (click)="goToStep(i)" [class.opacity-50]="i > currentStep()">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                     [class]="i <= currentStep() ? 'bg-accent-primary text-white' : 'bg-bg-card text-text-muted'">
                  {{ i + 1 }}
                </div>
                <span class="hidden md:inline text-sm" [class]="i <= currentStep() ? 'text-text-primary' : 'text-text-muted'">
                  {{ step.name }}
                </span>
              </div>
              @if (i < steps.length - 1) {
                <div class="flex-1 h-px bg-border-color mx-2"></div>
              }
            }
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <!-- Step 1: Basics -->
            @if (currentStep() === 0) {
              <div class="card animate-fade-in">
                <h2 class="text-lg font-semibold mb-6">Campaign Basics</h2>
                
                <div class="mb-4">
                  <label class="form-label">Campaign Name *</label>
                  <input type="text" formControlName="name" class="form-input" placeholder="e.g., Summer Sale 2024, Year-End Promotion" />
                </div>

                <div class="mb-4">
                  <label class="form-label">Campaign Objective</label>
                  <textarea formControlName="objective" class="form-input" rows="3" placeholder="What do you want to achieve with this campaign?"></textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="form-label">Start Date</label>
                    <input type="date" formControlName="startDate" class="form-input" />
                  </div>
                  <div>
                    <label class="form-label">End Date</label>
                    <input type="date" formControlName="endDate" class="form-input" />
                  </div>
                </div>
              </div>
            }

            <!-- Step 2: Audiences -->
            @if (currentStep() === 1) {
              <div class="card animate-fade-in">
                <h2 class="text-lg font-semibold mb-2">Select Audiences</h2>
                <p class="text-sm text-text-secondary mb-6">Choose which audience segments to target with this campaign.</p>

                <div class="space-y-3">
                  @for (audience of audienceService.audiences(); track audience._id) {
                    <label class="flex items-center gap-4 p-4 bg-bg-card rounded-lg cursor-pointer hover:bg-bg-hover transition-colors"
                           [class.ring-2]="isAudienceSelected(audience._id)"
                           [class.ring-accent-primary]="isAudienceSelected(audience._id)">
                      <input type="checkbox" [checked]="isAudienceSelected(audience._id)" (change)="toggleAudience(audience._id)" class="sr-only" />
                      <div class="w-5 h-5 rounded border-2 flex items-center justify-center"
                           [class]="isAudienceSelected(audience._id) ? 'border-accent-primary bg-accent-primary' : 'border-border-color'">
                        @if (isAudienceSelected(audience._id)) {
                          <span class="text-white text-xs">✓</span>
                        }
                      </div>
                      <div class="flex-1">
                        <div class="font-medium text-text-primary">{{ audience.name }}</div>
                        <div class="text-sm text-text-muted">{{ audience.propensityLevel }} propensity</div>
                      </div>
                    </label>
                  }
                </div>

                @if (form.get('segments')?.value.length === 0) {
                  <p class="text-warning text-sm mt-4">Please select at least one audience.</p>
                }
              </div>
            }

            <!-- Step 3: Channels -->
            @if (currentStep() === 2) {
              <div class="card animate-fade-in">
                <h2 class="text-lg font-semibold mb-2">Select Channels</h2>
                <p class="text-sm text-text-secondary mb-6">Choose which channels to generate content for.</p>

                <div class="space-y-4" formArrayName="channels">
                  @for (channel of channelOptions; track channel.type; let i = $index) {
                    <div [formGroupName]="i">
                      <label class="flex items-center gap-4 p-4 bg-bg-card rounded-lg cursor-pointer hover:bg-bg-hover transition-colors"
                             [class.ring-2]="form.get('channels')?.value[i]?.enabled"
                             [class.ring-accent-primary]="form.get('channels')?.value[i]?.enabled">
                        <input type="checkbox" formControlName="enabled" class="sr-only" />
                        <div class="w-5 h-5 rounded border-2 flex items-center justify-center"
                             [class]="form.get('channels')?.value[i]?.enabled ? 'border-accent-primary bg-accent-primary' : 'border-border-color'">
                          @if (form.get('channels')?.value[i]?.enabled) {
                            <span class="text-white text-xs">✓</span>
                          }
                        </div>
                        <div class="text-2xl">{{ channel.icon }}</div>
                        <div class="flex-1">
                          <div class="font-medium text-text-primary">{{ channel.name }}</div>
                          <div class="text-sm text-text-muted">{{ channel.description }}</div>
                        </div>
                      </label>
                    </div>
                  }
                </div>

                @if (!hasEnabledChannel()) {
                  <p class="text-warning text-sm mt-4">Please select at least one channel.</p>
                }
              </div>
            }

            <!-- Step 4: Messages -->
            @if (currentStep() === 3) {
              <div class="card animate-fade-in">
                <h2 class="text-lg font-semibold mb-2">Campaign Messages</h2>
                <p class="text-sm text-text-secondary mb-6">Define the key messages and call-to-action for this campaign.</p>

                <div class="mb-4">
                  <label class="form-label">Key Messages (comma separated)</label>
                  <input type="text" [value]="getKeyMessagesString()" (input)="updateKeyMessages($event)" class="form-input"
                         placeholder="e.g., Save 25% this month, Limited time offer" />
                </div>

                <div class="mb-4">
                  <label class="form-label">Call to Action</label>
                  <input type="text" formControlName="callToAction" class="form-input" placeholder="e.g., Shop Now, Learn More, Book Today" />
                </div>

                <div>
                  <label class="form-label">Urgency Level</label>
                  <select formControlName="urgencyLevel" class="form-input">
                    <option value="low">Low - No time pressure</option>
                    <option value="medium">Medium - Gentle urgency</option>
                    <option value="high">High - Strong urgency</option>
                  </select>
                </div>
              </div>
            }

            <!-- Step 5: Review -->
            @if (currentStep() === 4) {
              <div class="card animate-fade-in">
                <h2 class="text-lg font-semibold mb-6">Review Campaign</h2>

                <div class="space-y-4">
                  <div class="p-4 bg-bg-card rounded-lg">
                    <div class="text-sm text-text-muted mb-1">Campaign Name</div>
                    <div class="font-medium">{{ form.get('name')?.value }}</div>
                  </div>

                  <div class="p-4 bg-bg-card rounded-lg">
                    <div class="text-sm text-text-muted mb-1">Objective</div>
                    <div>{{ form.get('objective')?.value || 'Not specified' }}</div>
                  </div>

                  <div class="p-4 bg-bg-card rounded-lg">
                    <div class="text-sm text-text-muted mb-1">Audiences ({{ form.get('segments')?.value.length }})</div>
                    <div class="flex flex-wrap gap-2 mt-2">
                      @for (seg of form.get('segments')?.value; track seg.audienceId) {
                        <span class="tag">{{ getAudienceName(seg.audienceId) }}</span>
                      }
                    </div>
                  </div>

                  <div class="p-4 bg-bg-card rounded-lg">
                    <div class="text-sm text-text-muted mb-1">Channels</div>
                    <div class="flex gap-2 mt-2">
                      @for (ch of getEnabledChannels(); track ch.type) {
                        <span class="tag">{{ ch.type === 'email' ? '📧 Email' : '📱 Meta Ads' }}</span>
                      }
                    </div>
                  </div>

                  <div class="p-4 bg-accent-primary/10 border border-accent-primary/20 rounded-md flex items-center gap-3">
                    <span class="text-accent-primary">ℹ️</span>
                    <div class="text-sm">
                      This campaign will generate <strong>{{ getAssetCount() }} assets</strong> 
                      ({{ form.get('segments')?.value.length }} audiences × {{ getEnabledChannels().length }} channels).
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- Navigation -->
            <div class="flex justify-between mt-6">
              <button type="button" (click)="prevStep()" class="btn btn-secondary" [class.invisible]="currentStep() === 0">
                ← Previous
              </button>

              @if (currentStep() < steps.length - 1) {
                <button type="button" (click)="nextStep()" class="btn btn-primary" [disabled]="!canProceed()">
                  Next →
                </button>
              } @else {
                <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
                  @if (saving()) {
                    Creating...
                  } @else {
                    Create Campaign
                  }
                </button>
              }
            </div>
          </form>
        }
      </div>
    </app-layout>
  `,
})
export class CampaignWizardComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  campaignService = inject(CampaignService);
  audienceService = inject(AudienceService);
  brandService = inject(BrandService);

  currentStep = signal(0);
  saving = signal(false);

  steps = [
    { id: 'basics', name: 'Basics' },
    { id: 'audiences', name: 'Audiences' },
    { id: 'channels', name: 'Channels' },
    { id: 'messages', name: 'Messages' },
    { id: 'review', name: 'Review' },
  ];

  channelOptions = [
    { type: 'email', name: 'Email', icon: '📧', description: 'Newsletters, promotional emails, drip campaigns' },
    { type: 'meta_ads', name: 'Meta Ads', icon: '📱', description: 'Facebook & Instagram advertising' },
  ];

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    objective: [''],
    description: [''],
    startDate: [''],
    endDate: [''],
    segments: [[]],
    channels: this.fb.array([
      this.fb.group({ type: ['email'], enabled: [true], purpose: [''] }),
      this.fb.group({ type: ['meta_ads'], enabled: [true], purpose: [''] }),
    ]),
    keyMessages: [[]],
    callToAction: [''],
    urgencyLevel: ['medium'],
  });

  ngOnInit(): void {
    if (!this.brandService.isLoaded()) {
      this.brandService.getBrandGuide().subscribe();
    }
    this.audienceService.getAudiences().subscribe();
  }

  goToStep(step: number): void {
    if (step <= this.currentStep()) {
      this.currentStep.set(step);
    }
  }

  nextStep(): void {
    if (this.canProceed() && this.currentStep() < this.steps.length - 1) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update(s => s - 1);
    }
  }

  canProceed(): boolean {
    switch (this.currentStep()) {
      case 0: return !!this.form.get('name')?.value;
      case 1: return this.form.get('segments')?.value.length > 0;
      case 2: return this.hasEnabledChannel();
      default: return true;
    }
  }

  isAudienceSelected(audienceId: string): boolean {
    return this.form.get('segments')?.value.some((s: any) => s.audienceId === audienceId);
  }

  toggleAudience(audienceId: string): void {
    const segments = [...this.form.get('segments')?.value];
    const index = segments.findIndex((s: any) => s.audienceId === audienceId);
    
    if (index >= 0) {
      segments.splice(index, 1);
    } else {
      segments.push({ audienceId, customInstructions: '' });
    }
    
    this.form.get('segments')?.setValue(segments);
  }

  hasEnabledChannel(): boolean {
    return this.form.get('channels')?.value.some((c: any) => c.enabled);
  }

  getEnabledChannels(): any[] {
    return this.form.get('channels')?.value.filter((c: any) => c.enabled) || [];
  }

  getKeyMessagesString(): string {
    return (this.form.get('keyMessages')?.value || []).join(', ');
  }

  updateKeyMessages(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const messages = value.split(',').map(s => s.trim()).filter(Boolean);
    this.form.get('keyMessages')?.setValue(messages);
  }

  getAudienceName(audienceId: string): string {
    return this.audienceService.audiences().find(a => a._id === audienceId)?.name || 'Unknown';
  }

  getAssetCount(): number {
    return this.form.get('segments')?.value.length * this.getEnabledChannels().length;
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    this.campaignService.createCampaign(this.form.value).subscribe({
      next: (campaign) => {
        this.saving.set(false);
        this.router.navigate(['/campaigns', campaign._id]);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }
}
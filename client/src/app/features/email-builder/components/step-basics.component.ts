// Path: client/src/app/features/email-builder/components/step-basics.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmailBuilderService } from '../services/email-builder.service';
import { OBJECTIVES, CHAR_LIMITS, UrgencyLevel } from '../models/email-builder.types';

@Component({
  selector: 'app-step-basics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-text-primary mb-2">Campaign Basics</h2>
        <p class="text-text-secondary">Define the foundation of your email campaign</p>
      </div>

      <div class="card p-6 space-y-6">
        <!-- Campaign Name -->
        <div>
          <label class="form-label">Campaign Name <span class="text-error">*</span></label>
          <input
            type="text"
            [ngModel]="campaign().name"
            (ngModelChange)="updateField('name', $event)"
            placeholder="e.g., Summer Sale 2024"
            class="form-input"
            [maxlength]="charLimits.campaignName"
          />
          <div class="flex justify-between mt-1">
            <span class="text-xs text-text-muted">Minimum 3 characters</span>
            <span class="text-xs text-text-muted">{{ campaign().name.length }}/{{ charLimits.campaignName }}</span>
          </div>
        </div>

        <!-- Objective -->
        <div>
          <label class="form-label">Campaign Objective <span class="text-error">*</span></label>
          <select
            [ngModel]="campaign().objective"
            (ngModelChange)="updateField('objective', $event)"
            class="form-input"
          >
            <option value="">Select an objective...</option>
            @for (obj of objectives; track obj.value) {
              <option [value]="obj.value">{{ obj.label }}</option>
            }
          </select>
        </div>

        <!-- Description -->
        <div>
          <label class="form-label">Description</label>
          <textarea
            [ngModel]="campaign().description"
            (ngModelChange)="updateField('description', $event)"
            placeholder="Brief description of this campaign's goals and context..."
            class="form-input min-h-[100px] resize-none"
            [maxlength]="charLimits.description"
          ></textarea>
          <div class="flex justify-end mt-1">
            <span class="text-xs text-text-muted">{{ campaign().description.length }}/{{ charLimits.description }}</span>
          </div>
        </div>

        <!-- Urgency Level -->
        <div>
          <label class="form-label">Campaign Urgency</label>
          <p class="text-xs text-text-muted mb-3">This affects the tone and messaging style</p>
          <div class="grid grid-cols-3 gap-3">
            @for (level of urgencyLevels; track level.value) {
              <button
                type="button"
                (click)="updateField('urgencyLevel', level.value)"
                class="p-4 rounded-lg border-2 transition-all text-center"
                [class.border-accent-primary]="campaign().urgencyLevel === level.value"
                [class.bg-accent-primary/10]="campaign().urgencyLevel === level.value"
                [class.border-border-color]="campaign().urgencyLevel !== level.value"
                [class.hover:border-accent-primary/50]="campaign().urgencyLevel !== level.value"
              >
                <div class="text-2xl mb-1">{{ level.icon }}</div>
                <div class="font-medium text-text-primary text-sm">{{ level.label }}</div>
                <div class="text-xs text-text-muted mt-1">{{ level.description }}</div>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Validation Hints -->
      <div class="mt-6 p-4 bg-bg-card rounded-lg border border-border-color">
        <h4 class="text-sm font-medium text-text-primary mb-2">To continue, you need:</h4>
        <ul class="space-y-1">
          <li class="flex items-center gap-2 text-sm">
            @if (campaign().name.trim().length >= 3) {
              <span class="text-success">✓</span>
            } @else {
              <span class="text-text-muted">○</span>
            }
            <span [class.text-text-primary]="campaign().name.trim().length >= 3" [class.text-text-muted]="campaign().name.trim().length < 3">Campaign name (at least 3 characters)</span>
          </li>
          <li class="flex items-center gap-2 text-sm">
            @if (campaign().objective) {
              <span class="text-success">✓</span>
            } @else {
              <span class="text-text-muted">○</span>
            }
            <span [class.text-text-primary]="campaign().objective" [class.text-text-muted]="!campaign().objective">Campaign objective selected</span>
          </li>
        </ul>
      </div>
    </div>
  `
})
export class StepBasicsComponent {
  private readonly builderService = inject(EmailBuilderService);

  readonly objectives = OBJECTIVES;
  readonly charLimits = CHAR_LIMITS;

  readonly urgencyLevels: { value: UrgencyLevel; label: string; icon: string; description: string }[] = [
    { value: 'low', label: 'Low', icon: '🌿', description: 'Relaxed, evergreen' },
    { value: 'medium', label: 'Medium', icon: '⚡', description: 'Standard campaign' },
    { value: 'high', label: 'High', icon: '🔥', description: 'Time-sensitive' }
  ];

  get campaign() { return this.builderService.campaign; }

  updateField(field: string, value: any): void {
    this.builderService.updateCampaign({ [field]: value });
  }
}

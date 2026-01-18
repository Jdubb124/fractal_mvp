// Path: client/src/app/features/email-builder/components/step-email-type.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmailBuilderService } from '../services/email-builder.service';
import { EMAIL_TYPES, EmailType, CHAR_LIMITS } from '../models/email-builder.types';

@Component({
  selector: 'app-step-email-type',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-text-primary mb-2">Email Types</h2>
        <p class="text-text-secondary">Select the types of emails to generate for this campaign</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (type of emailTypes; track type.key) {
          <button
            (click)="toggleEmailType(type.key)"
            class="p-5 rounded-lg border-2 transition-all text-left"
            [class.border-channel]="isSelected(type.key)"
            [class.bg-channel/10]="isSelected(type.key)"
            [class.border-border-color]="!isSelected(type.key)"
            [class.hover:border-channel/50]="!isSelected(type.key)"
          >
            <div class="flex items-start gap-3">
              <div class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl"
                [class.bg-channel/20]="isSelected(type.key)"
                [class.bg-bg-hover]="!isSelected(type.key)">
                {{ type.config.icon }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-text-primary">{{ type.config.name }}</h3>
                  @if (isSelected(type.key)) {
                    <span class="text-channel text-sm">✓</span>
                  }
                </div>
                <p class="text-sm text-text-secondary mt-1">{{ type.config.description }}</p>
                <p class="text-xs text-text-muted mt-2">Best for: {{ type.config.bestFor }}</p>
              </div>
            </div>
          </button>
        }
      </div>

      <!-- Email Specifications -->
      <div class="mt-8 card p-6">
        <h3 class="text-lg font-semibold text-text-primary mb-4">Email Specifications</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="p-3 bg-bg-hover rounded-lg">
            <div class="text-xs text-text-muted mb-1">Subject Line</div>
            <div class="text-sm font-medium text-text-primary">{{ charLimits.subjectLine }} chars max</div>
          </div>
          <div class="p-3 bg-bg-hover rounded-lg">
            <div class="text-xs text-text-muted mb-1">Preheader</div>
            <div class="text-sm font-medium text-text-primary">{{ charLimits.preheader }} chars max</div>
          </div>
          <div class="p-3 bg-bg-hover rounded-lg">
            <div class="text-xs text-text-muted mb-1">Headline</div>
            <div class="text-sm font-medium text-text-primary">{{ charLimits.headline }} chars max</div>
          </div>
          <div class="p-3 bg-bg-hover rounded-lg">
            <div class="text-xs text-text-muted mb-1">Body Copy</div>
            <div class="text-sm font-medium text-text-primary">{{ charLimits.bodyCopyWords.min }}-{{ charLimits.bodyCopyWords.max }} words</div>
          </div>
        </div>
      </div>

      <!-- Selection Summary -->
      <div class="mt-6 p-4 bg-bg-card rounded-lg border border-border-color">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-sm font-medium text-text-primary">Selected Email Types</h4>
            <p class="text-xs text-text-muted mt-1">Each type will be generated for every audience segment</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-2xl font-bold text-channel">{{ campaign().emailTypes.length }}</span>
            <span class="text-text-muted">selected</span>
          </div>
        </div>
        @if (campaign().emailTypes.length > 0) {
          <div class="flex flex-wrap gap-2 mt-3">
            @for (type of campaign().emailTypes; track type) {
              <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-channel/20 text-channel text-sm">
                {{ getEmailTypeConfig(type).icon }} {{ getEmailTypeConfig(type).name }}
              </span>
            }
          </div>
        }
      </div>

      <!-- Validation Hint -->
      @if (campaign().emailTypes.length === 0) {
        <div class="mt-4 p-3 bg-warning/5 border border-warning/30 rounded-lg">
          <p class="text-sm text-warning flex items-center gap-2">
            <span>!</span>
            Select at least one email type to continue
          </p>
        </div>
      }
    </div>
  `
})
export class StepEmailTypeComponent {
  private readonly builderService = inject(EmailBuilderService);

  readonly charLimits = CHAR_LIMITS;

  readonly emailTypes = Object.entries(EMAIL_TYPES).map(([key, config]) => ({
    key: key as EmailType,
    config
  }));

  get campaign() { return this.builderService.campaign; }

  isSelected(type: EmailType): boolean {
    return this.campaign().emailTypes.includes(type);
  }

  toggleEmailType(type: EmailType): void {
    this.builderService.toggleEmailType(type);
  }

  getEmailTypeConfig(type: EmailType) {
    return EMAIL_TYPES[type];
  }
}

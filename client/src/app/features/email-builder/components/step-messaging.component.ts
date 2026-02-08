// Path: client/src/app/features/email-builder/components/step-messaging.component.ts

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmailBuilderService } from '../services/email-builder.service';
import { TONE_OPTIONS, CHAR_LIMITS } from '../models/email-builder.types';

@Component({
  selector: 'app-step-messaging',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-text-primary mb-2">Messaging & Content</h2>
        <p class="text-text-secondary">Define the key messages and calls-to-action for your campaign</p>
      </div>

      <div class="card p-6 space-y-6">
        <!-- Key Messages -->
        <div>
          <label class="form-label">Key Messages <span class="text-error">*</span></label>
          <p class="text-xs text-text-muted mb-3">Add up to 5 key messages that should be conveyed in the emails</p>

          <!-- Message Input -->
          <div class="flex gap-2 mb-3">
            <input
              type="text"
              [(ngModel)]="newMessage"
              (keydown.enter)="addMessage()"
              placeholder="Type a key message and press Enter..."
              class="form-input flex-1"
              [maxlength]="charLimits.keyMessage"
              [disabled]="campaign().keyMessages.length >= 5"
            />
            <button
              (click)="addMessage()"
              class="btn-secondary px-4"
              [disabled]="!newMessage().trim() || campaign().keyMessages.length >= 5"
            >
              Add
            </button>
          </div>

          <!-- Message Tags -->
          @if (campaign().keyMessages.length > 0) {
            <div class="flex flex-wrap gap-2">
              @for (message of campaign().keyMessages; track $index) {
                <div class="inline-flex items-center gap-2 px-3 py-2 bg-bg-hover rounded-lg border border-border-color">
                  <span class="text-sm text-text-primary">{{ message }}</span>
                  <button
                    (click)="removeMessage($index)"
                    class="text-text-muted hover:text-error transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              }
            </div>
          } @else {
            <div class="p-4 bg-bg-hover rounded-lg text-center">
              <p class="text-sm text-text-muted">No key messages added yet</p>
            </div>
          }

          <div class="flex justify-between mt-2">
            <span class="text-xs text-text-muted">{{ campaign().keyMessages.length }}/5 messages</span>
          </div>
        </div>

        <!-- Call to Action -->
        <div>
          <label class="form-label">Primary Call-to-Action <span class="text-error">*</span></label>
          <p class="text-xs text-text-muted mb-2">The main action you want recipients to take</p>
          <input
            type="text"
            [ngModel]="campaign().callToAction"
            (ngModelChange)="updateField('callToAction', $event)"
            placeholder="e.g., Shop Now, Learn More, Get Started"
            class="form-input"
            [maxlength]="charLimits.callToAction"
          />
          <div class="flex justify-end mt-1">
            <span class="text-xs text-text-muted">{{ campaign().callToAction.length }}/{{ charLimits.callToAction }}</span>
          </div>
        </div>

        <!-- Offer -->
        <div>
          <label class="form-label">Offer or Promotion</label>
          <p class="text-xs text-text-muted mb-2">Special offer to highlight (optional)</p>
          <input
            type="text"
            [ngModel]="campaign().offer"
            (ngModelChange)="updateField('offer', $event)"
            placeholder="e.g., 20% Off, Free Shipping, Buy One Get One"
            class="form-input"
            [maxlength]="charLimits.offer"
          />
          <div class="flex justify-end mt-1">
            <span class="text-xs text-text-muted">{{ campaign().offer.length }}/{{ charLimits.offer }}</span>
          </div>
        </div>

        <!-- Tone Override -->
        <div>
          <label class="form-label">Tone Adjustment</label>
          <p class="text-xs text-text-muted mb-2">Modify the tone from your brand default</p>
          <select
            [ngModel]="campaign().toneOverride"
            (ngModelChange)="updateField('toneOverride', $event)"
            class="form-input"
          >
            @for (tone of toneOptions; track tone.value) {
              <option [value]="tone.value">{{ tone.label }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Brand Guide Context -->
      @if (brandGuide()) {
        <div class="mt-6 card p-4 border-accent-primary/30 bg-accent-primary/5">
          <h4 class="text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
            <span class="text-accent-primary">✦</span>
            Brand Guide Context
          </h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-text-muted">Tone:</span>
              <span class="text-text-secondary ml-2">{{ getTonePreview() }}</span>
            </div>
            <div>
              <span class="text-text-muted">Brand:</span>
              <span class="text-text-secondary ml-2">{{ brandGuide().name || 'Not set' }}</span>
            </div>
          </div>
        </div>
      }

      <!-- Validation Hints -->
      <div class="mt-6 p-4 bg-bg-card rounded-lg border border-border-color">
        <h4 class="text-sm font-medium text-text-primary mb-2">To continue, you need:</h4>
        <ul class="space-y-1">
          <li class="flex items-center gap-2 text-sm">
            @if (campaign().keyMessages.length > 0) {
              <span class="text-success">✓</span>
            } @else {
              <span class="text-text-muted">○</span>
            }
            <span [class.text-text-primary]="campaign().keyMessages.length > 0" [class.text-text-muted]="campaign().keyMessages.length === 0">At least one key message</span>
          </li>
          <li class="flex items-center gap-2 text-sm">
            @if (campaign().callToAction.trim()) {
              <span class="text-success">✓</span>
            } @else {
              <span class="text-text-muted">○</span>
            }
            <span [class.text-text-primary]="campaign().callToAction.trim()" [class.text-text-muted]="!campaign().callToAction.trim()">Primary call-to-action</span>
          </li>
        </ul>
      </div>
    </div>
  `
})
export class StepMessagingComponent {
  private readonly builderService = inject(EmailBuilderService);

  readonly toneOptions = TONE_OPTIONS;
  readonly charLimits = CHAR_LIMITS;

  readonly newMessage = signal('');

  get campaign() { return this.builderService.campaign; }
  get brandGuide() { return this.builderService.brandGuide; }

  updateField(field: string, value: any): void {
    this.builderService.updateCampaign({ [field]: value });
  }

  addMessage(): void {
    const message = this.newMessage().trim();
    if (message) {
      this.builderService.addKeyMessage(message);
      this.newMessage.set('');
    }
  }

  removeMessage(index: number): void {
    this.builderService.removeKeyMessage(index);
  }

  getTonePreview(): string {
    const guide = this.brandGuide();
    if (guide?.tone) {
      return guide.tone.length > 50 ? guide.tone.slice(0, 50) + '...' : guide.tone;
    }
    return 'Not set';
  }
}

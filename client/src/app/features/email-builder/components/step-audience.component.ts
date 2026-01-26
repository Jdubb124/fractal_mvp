// Path: client/src/app/features/email-builder/components/step-audience.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmailBuilderService } from '../services/email-builder.service';

@Component({
  selector: 'app-step-audience',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-3xl mx-auto">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-text-primary mb-2">Select Audiences</h2>
        <p class="text-text-secondary">Choose which audience segments will receive this campaign</p>
      </div>

      @if (audiences().length === 0) {
        <div class="card p-8 text-center">
          <div class="w-16 h-16 bg-bg-card rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-3xl">👥</span>
          </div>
          <h3 class="text-lg font-medium text-text-primary mb-2">No Audiences Yet</h3>
          <p class="text-text-secondary text-sm mb-4">Create audience segments to target with your campaigns</p>
          <a routerLink="/audiences" class="btn-primary inline-flex items-center gap-2">
            Create Audience
          </a>
        </div>
      } @else {
        <div class="space-y-3">
          @for (audience of audiences(); track audience._id) {
            <button
              (click)="toggleSegment(audience._id)"
              class="w-full p-4 rounded-lg border-2 transition-all text-left"
              [class.border-segment]="isSelected(audience._id)"
              [class.bg-segment/10]="isSelected(audience._id)"
              [class.border-border-color]="!isSelected(audience._id)"
              [class.hover:border-segment/50]="!isSelected(audience._id)"
            >
              <div class="flex items-start justify-between">
                <div class="flex items-start gap-4">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    [class.bg-segment/20]="isSelected(audience._id)"
                    [class.bg-bg-hover]="!isSelected(audience._id)">
                    @if (isSelected(audience._id)) {
                      <span class="text-segment text-lg">✓</span>
                    } @else {
                      <span class="text-text-muted text-lg">👤</span>
                    }
                  </div>
                  <div>
                    <h3 class="font-medium text-text-primary">{{ audience.name }}</h3>
                    @if (audience.description) {
                      <p class="text-sm text-text-secondary mt-1">{{ audience.description }}</p>
                    }
                    <div class="flex flex-wrap gap-2 mt-2">
                      <!-- Propensity Badge -->
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        [class.bg-success/20]="audience.propensityLevel === 'High'"
                        [class.text-success]="audience.propensityLevel === 'High'"
                        [class.bg-warning/20]="audience.propensityLevel === 'Medium'"
                        [class.text-warning]="audience.propensityLevel === 'Medium'"
                        [class.bg-error/20]="audience.propensityLevel === 'Low'"
                        [class.text-error]="audience.propensityLevel === 'Low'">
                        {{ audience.propensityLevel }} Propensity
                      </span>
                      @if (audience.estimatedSize) {
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-bg-hover text-text-secondary">
                          ~{{ audience.estimatedSize | number }} contacts
                        </span>
                      }
                    </div>
                    @if (audience.keyMotivators && audience.keyMotivators.length > 0) {
                      <div class="mt-2">
                        <span class="text-xs text-text-muted">Key motivators: </span>
                        <span class="text-xs text-text-secondary">{{ audience.keyMotivators.slice(0, 3).join(', ') }}</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </button>
          }
        </div>

        <!-- Selection Summary -->
        <div class="mt-6 p-4 bg-bg-card rounded-lg border border-border-color">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-medium text-text-primary">Selected Audiences</h4>
              <p class="text-xs text-text-muted mt-1">Each audience will receive personalized email versions</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-2xl font-bold text-segment">{{ campaign().segments.length }}</span>
              <span class="text-text-muted">of {{ audiences().length }}</span>
            </div>
          </div>
        </div>

        <!-- Validation Hint -->
        @if (campaign().segments.length === 0) {
          <div class="mt-4 p-3 bg-warning/5 border border-warning/30 rounded-lg">
            <p class="text-sm text-warning flex items-center gap-2">
              <span>!</span>
              Select at least one audience to continue
            </p>
          </div>
        }
      }
    </div>
  `
})
export class StepAudienceComponent {
  private readonly builderService = inject(EmailBuilderService);

  get audiences() { return this.builderService.audiences; }
  get campaign() { return this.builderService.campaign; }

  isSelected(audienceId: string): boolean {
    return this.campaign().segments.includes(audienceId);
  }

  toggleSegment(audienceId: string): void {
    this.builderService.toggleSegment(audienceId);
  }
}

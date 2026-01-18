// Path: client/src/app/features/email-builder/components/step-generate.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmailBuilderService } from '../services/email-builder.service';
import { VERSION_STRATEGIES, VersionStrategy, EMAIL_TYPES, OBJECTIVES } from '../models/email-builder.types';

@Component({
  selector: 'app-step-generate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-text-primary mb-2">Generate Emails</h2>
        <p class="text-text-secondary">Select version strategies and review before generating</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Version Strategies -->
        <div class="lg:col-span-2">
          <div class="card p-6">
            <h3 class="text-lg font-semibold text-text-primary mb-4">Version Strategies</h3>
            <p class="text-sm text-text-muted mb-4">Select the messaging approaches to generate for each email</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              @for (strategy of versionStrategies; track strategy.key) {
                <button
                  (click)="toggleStrategy(strategy.key)"
                  class="p-4 rounded-lg border-2 transition-all text-left"
                  [class]="isSelected(strategy.key) ? strategy.config.bgClass + ' ' + strategy.config.borderClass : 'border-border-color hover:border-version/50'"
                >
                  <div class="flex items-start justify-between mb-2">
                    <h4 class="font-medium text-text-primary">{{ strategy.config.name }}</h4>
                    @if (isSelected(strategy.key)) {
                      <span class="text-version">✓</span>
                    }
                  </div>
                  <p class="text-sm text-text-secondary mb-3">{{ strategy.config.description }}</p>
                  <div class="flex flex-wrap gap-1">
                    @for (char of strategy.config.characteristics; track char) {
                      <span class="px-2 py-0.5 rounded text-xs bg-bg-hover text-text-muted">{{ char }}</span>
                    }
                  </div>
                </button>
              }
            </div>

            <!-- Versions Per Asset Slider -->
            <div class="mt-6 pt-6 border-t border-border-color">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-text-primary">Versions per Asset</label>
                <span class="text-lg font-bold text-version">{{ campaign().versionsPerAsset }}</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                [ngModel]="campaign().versionsPerAsset"
                (ngModelChange)="updateVersionsPerAsset($event)"
                class="w-full h-2 bg-bg-hover rounded-lg appearance-none cursor-pointer accent-version"
              />
              <div class="flex justify-between text-xs text-text-muted mt-1">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Campaign Summary -->
        <div class="lg:col-span-1">
          <div class="card p-6 sticky top-6">
            <h3 class="text-lg font-semibold text-text-primary mb-4">Campaign Summary</h3>

            <div class="space-y-4">
              <div>
                <span class="text-xs text-text-muted">Campaign Name</span>
                <p class="text-sm font-medium text-text-primary truncate">{{ campaign().name }}</p>
              </div>

              <div>
                <span class="text-xs text-text-muted">Objective</span>
                <p class="text-sm font-medium text-text-primary">{{ getObjectiveLabel(campaign().objective) }}</p>
              </div>

              <div>
                <span class="text-xs text-text-muted">Audiences</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  @for (segmentId of campaign().segments; track segmentId) {
                    <span class="px-2 py-0.5 rounded-full text-xs bg-segment/20 text-segment">
                      {{ getAudienceName(segmentId) }}
                    </span>
                  }
                </div>
              </div>

              <div>
                <span class="text-xs text-text-muted">Email Types</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  @for (type of campaign().emailTypes; track type) {
                    <span class="px-2 py-0.5 rounded-full text-xs bg-channel/20 text-channel">
                      {{ getEmailTypeName(type) }}
                    </span>
                  }
                </div>
              </div>

              <div>
                <span class="text-xs text-text-muted">Version Strategies</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  @for (strategy of campaign().versionStrategies; track strategy) {
                    <span class="px-2 py-0.5 rounded-full text-xs bg-version/20 text-version">
                      {{ getStrategyName(strategy) }}
                    </span>
                  }
                </div>
              </div>
            </div>

            <!-- Multiplication Effect -->
            <div class="mt-6 pt-4 border-t border-border-color">
              <h4 class="text-sm font-medium text-text-primary mb-3">The Multiplication Effect</h4>
              <div class="flex items-center justify-center gap-2 text-sm mb-3">
                <span class="px-3 py-1 rounded bg-segment/20 text-segment font-medium">{{ campaign().segments.length }} Audiences</span>
                <span class="text-text-muted">x</span>
                <span class="px-3 py-1 rounded bg-channel/20 text-channel font-medium">{{ campaign().emailTypes.length }} Types</span>
                <span class="text-text-muted">x</span>
                <span class="px-3 py-1 rounded bg-version/20 text-version font-medium">{{ campaign().versionStrategies.length }} Strategies</span>
              </div>
              <div class="text-center">
                <span class="text-text-muted">=</span>
                <span class="text-3xl font-bold text-accent-primary ml-2">{{ builderService.totalAssets() }}</span>
                <span class="text-text-secondary ml-1">unique emails</span>
              </div>
            </div>

            <!-- Generate Button -->
            <button
              (click)="generate()"
              class="w-full btn-primary mt-6 py-3 text-lg flex items-center justify-center gap-2"
              [disabled]="!builderService.isReadyToGenerate()"
            >
              <span class="text-xl">✨</span>
              Generate {{ builderService.totalAssets() }} Emails
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StepGenerateComponent {
  protected readonly builderService = inject(EmailBuilderService);

  readonly versionStrategies = Object.entries(VERSION_STRATEGIES).map(([key, config]) => ({
    key: key as VersionStrategy,
    config
  }));

  get campaign() { return this.builderService.campaign; }
  get audiences() { return this.builderService.audiences; }

  isSelected(strategy: VersionStrategy): boolean {
    return this.campaign().versionStrategies.includes(strategy);
  }

  toggleStrategy(strategy: VersionStrategy): void {
    this.builderService.toggleVersionStrategy(strategy);
  }

  updateVersionsPerAsset(value: number): void {
    this.builderService.updateCampaign({ versionsPerAsset: value });
  }

  getObjectiveLabel(value: string): string {
    const obj = OBJECTIVES.find(o => o.value === value);
    return obj?.label || value;
  }

  getAudienceName(id: string): string {
    const audience = this.audiences().find(a => a._id === id);
    return audience?.name || 'Unknown';
  }

  getEmailTypeName(type: string): string {
    return EMAIL_TYPES[type as keyof typeof EMAIL_TYPES]?.name || type;
  }

  getStrategyName(strategy: VersionStrategy): string {
    return VERSION_STRATEGIES[strategy]?.name || strategy;
  }

  generate(): void {
    this.builderService.generateCampaign();
  }
}

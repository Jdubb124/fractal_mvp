// Path: client/src/app/features/email-builder/email-builder.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { EmailBuilderService } from './services/email-builder.service';
import { AudienceService } from '../../core/services/audience.service';
import { BrandService } from '../../core/services/brand.service';
import { StepBasicsComponent } from './components/step-basics.component';
import { StepAudienceComponent } from './components/step-audience.component';
import { StepEmailTypeComponent } from './components/step-email-type.component';
import { StepMessagingComponent } from './components/step-messaging.component';
import { StepGenerateComponent } from './components/step-generate.component';
import { GeneratingOverlayComponent } from './components/generating-overlay.component';
import { PreviewPanelComponent } from './components/preview-panel.component';
import { WIZARD_STEPS } from './models/email-builder.types';

@Component({
  selector: 'app-email-builder',
  standalone: true,
  imports: [
    CommonModule, RouterModule, LayoutComponent,
    StepBasicsComponent, StepAudienceComponent, StepEmailTypeComponent,
    StepMessagingComponent, StepGenerateComponent, GeneratingOverlayComponent, PreviewPanelComponent
  ],
  template: `
    <app-layout>
      <div class="relative min-h-[calc(100vh-64px)]">
        <!-- Header -->
        <div class="bg-bg-card border-b border-border-color">
          <div class="max-w-7xl mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <button (click)="goBack()" class="p-2 hover:bg-bg-hover rounded-lg transition-colors">
                  <svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <div>
                  <h1 class="text-xl font-bold text-text-primary">Email Campaign Builder</h1>
                  <p class="text-sm text-text-secondary">Create personalized email campaigns for your audiences</p>
                </div>
              </div>
              @if (builderService.totalAssets() > 0) {
                <div class="flex items-center gap-3 px-4 py-2 rounded-lg bg-accent-primary/10 border border-accent-primary/30">
                  <span class="text-xs text-text-secondary">Assets:</span>
                  <div class="flex items-center gap-1 text-sm">
                    <span class="text-segment font-medium">{{ campaign().segments.length }}</span>
                    <span class="text-text-muted">x</span>
                    <span class="text-channel font-medium">{{ campaign().emailTypes.length }}</span>
                    <span class="text-text-muted">x</span>
                    <span class="text-version font-medium">{{ campaign().versionStrategies.length }}</span>
                    <span class="text-text-muted">=</span>
                    <span class="text-text-primary font-bold text-lg">{{ builderService.totalAssets() }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Progress Steps -->
        <div class="bg-bg-secondary border-b border-border-color">
          <div class="max-w-4xl mx-auto px-6 py-6">
            <div class="flex justify-center">
              <div class="flex items-center gap-2">
                @for (step of wizardSteps; track step.num; let idx = $index) {
                  <div class="flex items-center">
                    <button (click)="builderService.goToStep(step.num)"
                      class="w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all"
                      [class.bg-accent-primary]="currentStep() === step.num"
                      [class.shadow-lg]="currentStep() === step.num"
                      [class.bg-success]="currentStep() > step.num"
                      [class.bg-bg-card]="currentStep() < step.num"
                      [class.opacity-50]="currentStep() < step.num"
                      [disabled]="currentStep() < step.num">
                      <span class="text-lg">{{ currentStep() > step.num ? '✓' : step.icon }}</span>
                    </button>
                    @if (idx < wizardSteps.length - 1) {
                      <div class="w-12 h-0.5 mx-1" [class.bg-success]="currentStep() > step.num" [class.bg-border-color]="currentStep() <= step.num"></div>
                    }
                  </div>
                }
              </div>
            </div>
            <div class="flex justify-center mt-2">
              <div class="flex items-center gap-2">
                @for (step of wizardSteps; track step.num; let idx = $index) {
                  <div class="flex items-center">
                    <span class="w-12 text-center text-xs" [class.text-accent-primary]="currentStep() === step.num" [class.text-text-muted]="currentStep() !== step.num">{{ step.label }}</span>
                    @if (idx < wizardSteps.length - 1) { <div class="w-12 mx-1"></div> }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-6 py-8">
          @if (!hasBrandGuide || audienceCount === 0) {
            <div class="card p-6 mb-6 border-warning/30 bg-warning/5">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                  <span class="text-warning">!</span>
                </div>
                <div>
                  <h3 class="font-semibold text-text-primary mb-2">Setup Required</h3>
                  <p class="text-text-secondary text-sm mb-4">Before building email campaigns, you need to complete your setup:</p>
                  <div class="space-y-2">
                    @if (!hasBrandGuide) { <div class="flex items-center gap-2"><span class="text-warning">○</span><a routerLink="/brand" class="text-accent-primary hover:underline text-sm">Set up your Brand Guide</a></div> }
                    @if (audienceCount === 0) { <div class="flex items-center gap-2"><span class="text-warning">○</span><a routerLink="/audiences" class="text-accent-primary hover:underline text-sm">Create at least one audience segment</a></div> }
                  </div>
                </div>
              </div>
            </div>
          } @else {
            <div class="animate-fade-in">
              @switch (currentStep()) {
                @case (1) { <app-step-basics /> }
                @case (2) { <app-step-audience /> }
                @case (3) { <app-step-email-type /> }
                @case (4) { <app-step-messaging /> }
                @case (5) { <app-step-generate /> }
              }
            </div>
            <div class="max-w-3xl mx-auto mt-8 flex items-center justify-between">
              <button (click)="builderService.previousStep()" class="btn-secondary flex items-center gap-2" [class.invisible]="currentStep() === 1">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg> Back
              </button>
              @if (currentStep() < 5) {
                <button (click)="builderService.nextStep()" class="btn-primary flex items-center gap-2" [disabled]="!builderService.canProceed()">
                  Continue <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </button>
              }
            </div>
          }
        </div>

        @if (builderService.isGenerating()) { <app-generating-overlay [progress]="builderService.generationProgress()" /> }
        @if (builderService.showPreview()) { <app-preview-panel /> }
      </div>
    </app-layout>
  `,
  styles: [`
    .animate-fade-in { animation: fadeInUp 0.4s ease forwards; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class EmailBuilderComponent implements OnInit {
  protected readonly builderService = inject(EmailBuilderService);
  private readonly audienceService = inject(AudienceService);
  private readonly brandService = inject(BrandService);
  private readonly router = inject(Router);
  protected readonly wizardSteps = WIZARD_STEPS;

  get currentStep() { return this.builderService.currentStep; }
  get campaign() { return this.builderService.campaign; }
  get hasBrandGuide() { return this.brandService.hasBrandGuide(); }
  get audienceCount() { return this.audienceService.audienceCount(); }

  ngOnInit(): void {
    this.builderService.resetCampaign();
    this.audienceService.getAudiences().subscribe();
    this.brandService.getBrandGuides().subscribe();
  }

  goBack(): void { this.router.navigate(['/campaigns']); }
}

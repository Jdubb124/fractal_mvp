// Path: client/src/app/features/email-builder/services/email-builder.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AudienceService } from '../../../core/services/audience.service';
import { BrandService } from '../../../core/services/brand.service';
import {
  EmailCampaignConfig,
  GeneratedEmailAsset,
  EmailType,
  VersionStrategy,
  EmailContent,
  EMAIL_TYPES,
  VERSION_STRATEGIES,
  createDefaultEmailCampaign,
  calculateTotalAssets
} from '../models/email-builder.types';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmailBuilderService {
  private readonly http = inject(HttpClient);
  private readonly audienceService = inject(AudienceService);
  private readonly brandService = inject(BrandService);

  private readonly apiUrl = `${environment.apiUrl}/campaigns`;

  // State Signals
  private readonly _currentStep = signal(1);
  private readonly _campaign = signal<EmailCampaignConfig>(createDefaultEmailCampaign());
  private readonly _isGenerating = signal(false);
  private readonly _generationProgress = signal(0);
  private readonly _generatedAssets = signal<GeneratedEmailAsset[]>([]);
  private readonly _selectedAssetIndex = signal<number | null>(null);
  private readonly _showPreview = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public read-only signals
  readonly currentStep = this._currentStep.asReadonly();
  readonly campaign = this._campaign.asReadonly();
  readonly isGenerating = this._isGenerating.asReadonly();
  readonly generationProgress = this._generationProgress.asReadonly();
  readonly generatedAssets = this._generatedAssets.asReadonly();
  readonly selectedAssetIndex = this._selectedAssetIndex.asReadonly();
  readonly showPreview = this._showPreview.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed values
  readonly totalAssets = computed(() => calculateTotalAssets(this._campaign()));

  readonly selectedAsset = computed(() => {
    const index = this._selectedAssetIndex();
    const assets = this._generatedAssets();
    return index !== null && assets[index] ? assets[index] : null;
  });

  readonly canProceed = computed(() => {
    const step = this._currentStep();
    const campaign = this._campaign();

    switch (step) {
      case 1: return campaign.name.trim().length >= 3 && campaign.objective !== '';
      case 2: return campaign.segments.length > 0;
      case 3: return campaign.emailTypes.length > 0;
      case 4: return campaign.keyMessages.length > 0 && campaign.callToAction.trim() !== '';
      case 5: return this.isReadyToGenerate();
      default: return false;
    }
  });

  // Get audiences from existing AudienceService
  get audiences() { return this.audienceService.audiences; }

  // Get brand guide from existing BrandService
  get brandGuide() { return this.brandService.selectedBrandGuide; }

  // Load data methods
  loadAudiences(): void {
    this.audienceService.getAudiences().subscribe();
  }

  loadBrandGuide(): void {
    this.brandService.getBrandGuides().subscribe();
  }

  // Navigation Methods
  goToStep(step: number): void {
    if (step <= this._currentStep() && step >= 1 && step <= 5) {
      this._currentStep.set(step);
    }
  }

  nextStep(): void {
    if (this.canProceed() && this._currentStep() < 5) {
      this._currentStep.update(s => s + 1);
    }
  }

  previousStep(): void {
    if (this._currentStep() > 1) {
      this._currentStep.update(s => s - 1);
    }
  }

  // Campaign Update Methods
  updateCampaign(updates: Partial<EmailCampaignConfig>): void {
    this._campaign.update(current => ({ ...current, ...updates }));
  }

  toggleSegment(segmentId: string): void {
    this._campaign.update(current => {
      const segments = [...current.segments];
      const index = segments.indexOf(segmentId);
      if (index === -1) segments.push(segmentId);
      else segments.splice(index, 1);
      return { ...current, segments };
    });
  }

  toggleEmailType(type: EmailType): void {
    this._campaign.update(current => {
      const emailTypes = [...current.emailTypes];
      const index = emailTypes.indexOf(type);
      if (index === -1) emailTypes.push(type);
      else if (emailTypes.length > 1) emailTypes.splice(index, 1);
      return { ...current, emailTypes };
    });
  }

  toggleVersionStrategy(strategy: VersionStrategy): void {
    this._campaign.update(current => {
      const versionStrategies = [...current.versionStrategies];
      const index = versionStrategies.indexOf(strategy);
      if (index === -1) versionStrategies.push(strategy);
      else if (versionStrategies.length > 1) versionStrategies.splice(index, 1);
      return { ...current, versionStrategies };
    });
  }

  addKeyMessage(message: string): void {
    if (message.trim() && this._campaign().keyMessages.length < 5) {
      this._campaign.update(current => ({
        ...current,
        keyMessages: [...current.keyMessages, message.trim()]
      }));
    }
  }

  removeKeyMessage(index: number): void {
    this._campaign.update(current => ({
      ...current,
      keyMessages: current.keyMessages.filter((_, i) => i !== index)
    }));
  }

  // Preview Management
  selectAsset(index: number): void { this._selectedAssetIndex.set(index); }
  closePreview(): void { this._showPreview.set(false); this._selectedAssetIndex.set(null); }
  openPreview(): void { this._showPreview.set(true); if (this._generatedAssets().length > 0) this._selectedAssetIndex.set(0); }

  // Validation
  isReadyToGenerate(): boolean {
    const c = this._campaign();
    return c.name.trim().length >= 3 && c.objective !== '' && c.segments.length > 0 &&
           c.emailTypes.length > 0 && c.keyMessages.length > 0 &&
           c.callToAction.trim() !== '' && c.versionStrategies.length > 0;
  }

  // Generation
  async generateCampaign(): Promise<void> {
    if (!this.isReadyToGenerate()) return;

    this._isGenerating.set(true);
    this._generationProgress.set(0);
    this._generatedAssets.set([]);
    this._error.set(null);

    const campaign = this._campaign();
    const audiences = this.audiences();
    const totalAssets = this.totalAssets();
    let generated = 0;

    try {
      for (const segmentId of campaign.segments) {
        const audience = audiences.find(a => a._id === segmentId);
        if (!audience) continue;

        for (const emailType of campaign.emailTypes) {
          for (const strategy of campaign.versionStrategies) {
            try {
              await this.delay(300 + Math.random() * 200);
              const content = this.generateLocalContent(audience, emailType, strategy, campaign);

              const asset: GeneratedEmailAsset = {
                id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                audienceId: segmentId,
                audienceName: audience.name,
                emailType,
                strategy,
                content,
                status: 'generated',
                generatedAt: new Date()
              };

              this._generatedAssets.update(assets => [...assets, asset]);
              generated++;
              this._generationProgress.set(Math.round((generated / totalAssets) * 100));
            } catch (err) {
              console.error(`Failed to generate ${emailType} for ${audience.name}:`, err);
            }
          }
        }
      }

      await this.delay(300);
      this._showPreview.set(true);
      this._selectedAssetIndex.set(0);
    } catch (err: any) {
      this._error.set(err.message || 'Generation failed');
    } finally {
      this._isGenerating.set(false);
    }
  }

  private generateLocalContent(audience: any, emailType: EmailType, strategy: VersionStrategy, campaign: EmailCampaignConfig): EmailContent {
    const templates: Record<VersionStrategy, Record<EmailType, string[]>> = {
      conversion: {
        promotional: [`${campaign.offer || 'Special Offer'} - Just for You`, `Your Exclusive Deal Awaits`],
        welcome: [`Welcome! Here's Your First ${campaign.offer || 'Gift'}`, `You're In! Let's Get Started`],
        abandoned_cart: [`Your Cart is Waiting`, `Forgot Something? We Saved It`],
        newsletter: [`This Week's Must-Reads`, `Your Weekly Roundup is Here`],
        announcement: [`Big News: ${campaign.keyMessages[0]?.slice(0, 30) || 'Something Exciting'}`, `Introducing Something Special`]
      },
      awareness: {
        promotional: [`Discover What Makes Us Different`, `The Story Behind Our Best Sellers`],
        welcome: [`Let Us Show You Around`, `Your Journey Starts Here`],
        abandoned_cart: [`Still Exploring? We're Here to Help`, `Take Your Time - Quality Awaits`],
        newsletter: [`Stories Worth Your Time`, `This Month in Review`],
        announcement: [`The Vision Behind Our Latest`, `A Letter From Our Team`]
      },
      urgency: {
        promotional: [`${campaign.offer || 'Sale'} Ends Tonight!`, `FINAL HOURS: Don't Miss This`],
        welcome: [`Your Welcome Gift Expires Soon!`, `Claim Before It's Gone`],
        abandoned_cart: [`Your Items Are Almost Gone!`, `Low Stock Alert`],
        newsletter: [`Time-Sensitive: This Week Only`, `Limited Availability Inside`],
        announcement: [`Breaking: Important Update`, `Urgent - Read Now`]
      },
      emotional: {
        promotional: [`Made for Moments Like Yours`, `Because You Deserve This`],
        welcome: [`You Belong Here`, `Welcome to Something Special`],
        abandoned_cart: [`We Miss You Already`, `Your Perfect Match is Waiting`],
        newsletter: [`Stories That Inspire`, `From Our Heart to Yours`],
        announcement: [`Something Beautiful is Coming`, `A New Chapter Begins`]
      }
    };

    const subjects = templates[strategy][emailType] || ['Check This Out'];
    const subjectLine = subjects[Math.floor(Math.random() * subjects.length)].slice(0, 60);

    const preheaderTemplates: Record<VersionStrategy, string> = {
      conversion: `${campaign.offer || 'Exclusive access'} for valued customers. ${campaign.callToAction} ->`,
      awareness: `Discover the quality and care that goes into everything we do.`,
      urgency: `Time is running out! ${campaign.offer || 'This offer'} won't last long.`,
      emotional: `Because you deserve something that feels just right.`
    };

    const headlineTemplates: Record<VersionStrategy, string[]> = {
      conversion: [`Get ${campaign.offer || 'Your Exclusive Offer'} Today`, `Unlock Your Special Deal`],
      awareness: [`Discover What Sets Us Apart`, `The Quality You've Been Looking For`],
      urgency: [`Don't Wait - ${campaign.offer || 'Limited Time'}`, `Hurry - Offer Ends Soon`],
      emotional: [`Made With You in Mind`, `Because You Matter`]
    };

    const motivator = audience.keyMotivators?.[0] || 'quality';
    const painPoint = audience.painPoints?.[0] || 'finding the right fit';

    const bodyTemplates: Record<VersionStrategy, string> = {
      conversion: `We know ${motivator.toLowerCase()} matters to you. That's why we've prepared something special${campaign.offer ? `: ${campaign.offer}` : ''}.\n\n${campaign.keyMessages[0] || 'Experience the difference'} with products designed for customers like you.\n\nReady to ${campaign.callToAction.toLowerCase()}? Your exclusive access is waiting.`,
      awareness: `At our core, we believe in ${motivator.toLowerCase()}. Every product we create is built with you in mind.\n\n${campaign.keyMessages[0] || 'We understand what you need'}.\n\nDiscover why thousands of customers trust us.`,
      urgency: `This is your moment! ${campaign.offer ? `${campaign.offer} is` : 'This opportunity is'} available for a limited time only.\n\n${campaign.keyMessages[0] || 'Don\'t let this pass you by'}.\n\nAct now before it expires!`,
      emotional: `We see you. We understand ${painPoint.toLowerCase()}. And we're here to make your journey easier.\n\n${campaign.keyMessages[0] || 'You deserve something that truly fits'}.\n\nBecause ${motivator.toLowerCase()} isn't just what we offer—it's who we are.`
    };

    return {
      subjectLine,
      preheader: preheaderTemplates[strategy].slice(0, 90),
      headline: headlineTemplates[strategy][Math.floor(Math.random() * headlineTemplates[strategy].length)].slice(0, 80),
      bodyCopy: bodyTemplates[strategy],
      ctaText: campaign.callToAction.slice(0, 25) || 'Shop Now'
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  exportAsJSON(): string {
    return JSON.stringify({
      campaign: { name: this._campaign().name, objective: this._campaign().objective, generatedAt: new Date().toISOString() },
      assets: this._generatedAssets().map(a => ({
        audience: a.audienceName,
        emailType: EMAIL_TYPES[a.emailType].name,
        strategy: VERSION_STRATEGIES[a.strategy].name,
        content: a.content
      }))
    }, null, 2);
  }

  downloadJSON(): void {
    const json = this.exportAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this._campaign().name.replace(/\s+/g, '-').toLowerCase()}-emails.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  resetCampaign(): void {
    this._campaign.set(createDefaultEmailCampaign());
    this._currentStep.set(1);
    this._generatedAssets.set([]);
    this._selectedAssetIndex.set(null);
    this._showPreview.set(false);
    this._generationProgress.set(0);
    this._error.set(null);
  }
}

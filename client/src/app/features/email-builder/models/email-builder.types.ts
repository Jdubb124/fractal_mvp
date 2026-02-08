// Path: client/src/app/features/email-builder/models/email-builder.types.ts

// Email Types for MVP
export type EmailType = 'promotional' | 'welcome' | 'abandoned_cart' | 'newsletter' | 'announcement';

export interface EmailTypeConfig {
  name: string;
  description: string;
  icon: string;
  bestFor: string;
}

export const EMAIL_TYPES: Record<EmailType, EmailTypeConfig> = {
  promotional: {
    name: 'Promotional',
    description: 'Drive immediate sales with offers and discounts',
    icon: '🏷️',
    bestFor: 'Flash sales, seasonal offers, product launches'
  },
  welcome: {
    name: 'Welcome',
    description: 'Onboard new subscribers and build relationship',
    icon: '👋',
    bestFor: 'Post-signup sequences, first impressions'
  },
  abandoned_cart: {
    name: 'Abandoned Cart',
    description: 'Recover potential lost sales',
    icon: '🛒',
    bestFor: 'Cart recovery, browse abandonment'
  },
  newsletter: {
    name: 'Newsletter',
    description: 'Regular engagement with valuable content',
    icon: '📰',
    bestFor: 'Weekly/monthly updates, content digests'
  },
  announcement: {
    name: 'Announcement',
    description: 'Share important news and updates',
    icon: '📢',
    bestFor: 'Product launches, company news, features'
  }
};

// Version Strategies
export type VersionStrategy = 'conversion' | 'awareness' | 'urgency' | 'emotional';

export interface VersionStrategyConfig {
  name: string;
  description: string;
  color: string;
  bgClass: string;
  borderClass: string;
  characteristics: string[];
}

export const VERSION_STRATEGIES: Record<VersionStrategy, VersionStrategyConfig> = {
  conversion: {
    name: 'Conversion Focus',
    description: 'Direct response with clear benefits and strong CTA',
    color: 'green',
    bgClass: 'bg-success/20',
    borderClass: 'border-success/40',
    characteristics: ['Action words', 'Urgency', 'Specific offers', 'Clear benefits']
  },
  awareness: {
    name: 'Awareness Focus',
    description: 'Brand storytelling and education',
    color: 'blue',
    bgClass: 'bg-channel/20',
    borderClass: 'border-channel/40',
    characteristics: ['Narrative flow', 'Value explanation', 'Softer CTA', 'Brand story']
  },
  urgency: {
    name: 'Urgency Focus',
    description: 'Limited time, scarcity messaging',
    color: 'amber',
    bgClass: 'bg-warning/20',
    borderClass: 'border-warning/40',
    characteristics: ['Time pressure', 'FOMO', 'Countdown language', 'Scarcity']
  },
  emotional: {
    name: 'Emotional Focus',
    description: 'Values, lifestyle, emotional resonance',
    color: 'pink',
    bgClass: 'bg-version/20',
    borderClass: 'border-version/40',
    characteristics: ['Aspirational', 'Identity-focused', 'Feelings', 'Connection']
  }
};

// Urgency Levels
export type UrgencyLevel = 'low' | 'medium' | 'high';

// Campaign Objectives
export interface CampaignObjective {
  value: string;
  label: string;
}

export const OBJECTIVES: CampaignObjective[] = [
  { value: 'sales', label: 'Drive Sales/Conversions' },
  { value: 'awareness', label: 'Build Brand Awareness' },
  { value: 'engagement', label: 'Increase Engagement' },
  { value: 'launch', label: 'Announce Product/Launch' },
  { value: 'reengage', label: 'Re-engage Lapsed Customers' },
  { value: 'nurture', label: 'Nurture Leads' }
];

// Tone Options
export interface ToneOption {
  value: string;
  label: string;
}

export const TONE_OPTIONS: ToneOption[] = [
  { value: 'default', label: 'Use Brand Default' },
  { value: 'formal', label: 'More Formal' },
  { value: 'casual', label: 'More Casual' },
  { value: 'urgent', label: 'More Urgent' },
  { value: 'playful', label: 'More Playful' }
];

// Email Campaign Configuration
export interface EmailCampaignConfig {
  name: string;
  objective: string;
  description: string;
  urgencyLevel: UrgencyLevel;
  segments: string[];
  emailTypes: EmailType[];
  keyMessages: string[];
  callToAction: string;
  offer: string;
  toneOverride: string;
  versionStrategies: VersionStrategy[];
  versionsPerAsset: number;
}

// Email Content Structure
export interface EmailContent {
  subjectLine: string;
  preheader: string;
  headline: string;
  bodyCopy: string;
  ctaText: string;
}

// Generated Email Asset
export type AssetStatus = 'pending' | 'generated' | 'edited' | 'approved' | 'exported';

export interface GeneratedEmailAsset {
  id: string;
  audienceId: string;
  audienceName: string;
  emailType: EmailType;
  strategy: VersionStrategy;
  content: EmailContent;
  status: AssetStatus;
  generatedAt?: Date;
  editedAt?: Date;
}

// Wizard Step Definition
export interface WizardStep {
  num: number;
  label: string;
  icon: string;
}

export const WIZARD_STEPS: WizardStep[] = [
  { num: 1, label: 'Basics', icon: '📋' },
  { num: 2, label: 'Audience', icon: '👥' },
  { num: 3, label: 'Email Type', icon: '✉️' },
  { num: 4, label: 'Messaging', icon: '💬' },
  { num: 5, label: 'Generate', icon: '✨' }
];

// Character Limits (per spec)
export const CHAR_LIMITS = {
  subjectLine: 60,
  preheader: 90,
  headline: 80,
  bodyCopyWords: { min: 150, max: 200 },
  ctaText: 25,
  campaignName: 100,
  description: 500,
  keyMessage: 100,
  callToAction: 50,
  offer: 100
};

// Helper function to create default campaign config
export function createDefaultEmailCampaign(): EmailCampaignConfig {
  return {
    name: '',
    objective: '',
    description: '',
    urgencyLevel: 'medium',
    segments: [],
    emailTypes: ['promotional'],
    keyMessages: [],
    callToAction: '',
    offer: '',
    toneOverride: 'default',
    versionStrategies: ['conversion'],
    versionsPerAsset: 2
  };
}

// Calculate total assets (The Multiplication Effect)
export function calculateTotalAssets(config: EmailCampaignConfig): number {
  return config.segments.length * config.emailTypes.length * config.versionStrategies.length;
}

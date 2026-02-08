// Asset Gallery Type Definitions

export type ChannelType = 'email' | 'meta_ads';
export type VersionStrategy = 'conversion' | 'awareness' | 'urgency' | 'emotional';
export type AssetStatus = 'pending' | 'generated' | 'edited' | 'approved';
export type ChannelFilter = 'all' | 'email' | 'meta_ads';
export type PreviewWidth = 'mobile' | 'tablet' | 'desktop';

export interface EmailContent {
  subjectLine: string;
  preheader: string;
  headline: string;
  bodyCopy: string;
  ctaText: string;
}

export interface MetaAdContent {
  primaryText: string;
  headline: string;
  description: string;
  ctaButton: string;
}

export interface AssetVersion {
  _id?: string;
  versionName: string;
  strategy?: string;
  content: any; // Flexible to match campaign.service.ts
  status: string;
  generatedAt?: Date;
  editedAt?: Date;
}

export interface Asset {
  _id?: string;
  campaignId: string;
  audienceId: string;
  channelType: string; // Flexible to match campaign.service.ts
  assetType: string;
  name: string;
  versions: AssetVersion[];
  generationPrompt?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// AssetGroup uses the Asset type from campaign.service.ts
// Importing it here would create a circular dependency, so we use a generic type
export interface AssetGroup<T = any> {
  audienceId: string;
  audienceName: string;
  assets: T[];
}

// Event types for component communication
export interface RegenerateVersionEvent {
  assetId: string;
  versionId: string;
  customInstructions?: string;
}

export interface ApproveVersionEvent {
  assetId: string;
  versionId: string;
}

export interface SelectAssetEvent {
  asset: Asset;
  version?: AssetVersion;
}

// Preview width mappings
export const PREVIEW_WIDTHS: Record<PreviewWidth, number> = {
  mobile: 375,
  tablet: 600,
  desktop: 800,
};

// Display labels
export const STRATEGY_LABELS: Record<VersionStrategy, string> = {
  conversion: 'Conversion',
  awareness: 'Awareness',
  urgency: 'Urgency',
  emotional: 'Emotional',
};

export const STATUS_COLORS: Record<AssetStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
  generated: { bg: 'bg-accent-primary/20', text: 'text-accent-primary' },
  edited: { bg: 'bg-warning/20', text: 'text-warning' },
  approved: { bg: 'bg-success/20', text: 'text-success' },
};

// Type guards
export function isEmailContent(content: EmailContent | MetaAdContent): content is EmailContent {
  return 'subjectLine' in content;
}

export function isMetaAdContent(content: EmailContent | MetaAdContent): content is MetaAdContent {
  return 'primaryText' in content;
}

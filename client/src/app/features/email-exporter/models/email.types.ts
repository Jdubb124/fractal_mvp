// Email Asset Types for Email Exporter/Viewer

export type EmailType = 'promotional' | 'welcome' | 'abandoned_cart' | 'newsletter' | 'announcement';
export type VersionStrategy = 'conversion' | 'awareness' | 'urgency' | 'emotional';
export type AssetStatus = 'pending' | 'generated' | 'edited' | 'approved';
export type ExportFormat = 'html' | 'liquid' | 'plain_text' | 'json';
export type EmailTemplate = 'minimal' | 'hero_image' | 'product_grid' | 'newsletter';
export type EmailViewMode = 'preview' | 'code' | 'split';

// Email content structure
export interface EmailContent {
  subjectLine: string;
  preheader: string;
  headline: string;
  bodyCopy: string;
  ctaText: string;
}

// Generated HTML structure
export interface EmailHtml {
  fullHtml: string;
  inlinedHtml: string;
  liquidHtml?: string;
  plainText: string;
}

// Edit history record
export interface EditRecord {
  timestamp: Date;
  editType: 'manual' | 'ai_assisted';
  prompt?: string;
  previousHtml: string;
}

// Email asset metadata
export interface EmailAssetMeta {
  templateId: string;
  generatedAt: Date;
  lastEditedAt?: Date;
  editHistory: EditRecord[];
  exportCount: number;
}

// Brand snapshot
export interface BrandSnapshot {
  companyName: string;
  primaryColor: string;
  voiceAttributes: string[];
}

// Audience snapshot
export interface AudienceSnapshot {
  name: string;
  propensityLevel: string;
}

// Main EmailAsset interface
export interface EmailAsset {
  _id: string;
  campaignId: string;
  userId: string;
  audienceId: string;

  // Classification
  emailType: EmailType;
  versionStrategy: VersionStrategy;
  versionNumber: number;

  // Content
  content: EmailContent;
  html: EmailHtml;

  // Snapshots
  brandSnapshot: BrandSnapshot;
  audienceSnapshot: AudienceSnapshot;

  // Status
  status: AssetStatus;
  meta: EmailAssetMeta;

  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface GenerateEmailsResponse {
  emailAssets: EmailAsset[];
  totalGenerated: number;
  generationTime: number;
}

export interface AIEditResponse {
  modifiedHtml: string;
  changes: string[];
  tokensUsed: number;
}

export interface ExportEmailResponse {
  content: string;
  filename: string;
  mimeType: string;
}

// Display helpers
export const EMAIL_TYPE_LABELS: Record<EmailType, string> = {
  promotional: 'Promotional',
  welcome: 'Welcome',
  abandoned_cart: 'Abandoned Cart',
  newsletter: 'Newsletter',
  announcement: 'Announcement',
};

export const STRATEGY_LABELS: Record<VersionStrategy, string> = {
  conversion: 'Conversion',
  awareness: 'Awareness',
  urgency: 'Urgency',
  emotional: 'Emotional',
};

export const STATUS_LABELS: Record<AssetStatus, string> = {
  pending: 'Pending',
  generated: 'Generated',
  edited: 'Edited',
  approved: 'Approved',
};

export const TEMPLATE_LABELS: Record<EmailTemplate, string> = {
  minimal: 'Minimal',
  hero_image: 'Hero Image',
  product_grid: 'Product Grid',
  newsletter: 'Newsletter',
};

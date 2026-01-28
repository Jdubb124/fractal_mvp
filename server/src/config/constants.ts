// Application constants

export const AUTH = {
    SALT_ROUNDS: 12,
    JWT_EXPIRES_IN: '7d',
    PASSWORD_MIN_LENGTH: 8,
  };
  
  export const LIMITS = {
    MAX_AUDIENCES_PER_USER: 5,
    MAX_CAMPAIGNS_PER_USER: 10,
    MAX_SEGMENTS_PER_CAMPAIGN: 5,
    MAX_CHANNELS_PER_CAMPAIGN: 2,
    MAX_VERSIONS_PER_ASSET: 3,
    MAX_BRAND_GUIDES_PER_USER: 10,
    MAX_COLORS_PER_BRAND_GUIDE: 6,
  };
  
  export const CAMPAIGN_STATUS = {
    DRAFT: 'draft',
    GENERATED: 'generated',
    APPROVED: 'approved',
    ARCHIVED: 'archived',
  } as const;
  
  export const ASSET_STATUS = {
    PENDING: 'pending',
    GENERATED: 'generated',
    EDITED: 'edited',
    APPROVED: 'approved',
  } as const;
  
  export const CHANNEL_TYPES = {
    EMAIL: 'email',
    META_ADS: 'meta_ads',
  } as const;
  
  export const PROPENSITY_LEVELS = {
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
  } as const;
  
  export const URGENCY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  } as const;
  
  export const ASSET_TYPES = {
    // Email types
    HERO_EMAIL: 'hero_email',
    FOLLOW_UP_EMAIL: 'follow_up_email',
    PROMOTIONAL_EMAIL: 'promotional_email',
    // Meta Ad types
    SINGLE_IMAGE_AD: 'single_image_ad',
    CAROUSEL_AD: 'carousel_ad',
    VIDEO_AD: 'video_ad',
  } as const;
  
  export const VERSION_STRATEGIES = {
    CONVERSION: 'conversion',
    AWARENESS: 'awareness',
    URGENCY: 'urgency',
    EMOTIONAL: 'emotional',
  } as const;

  // Email Types (for email-specific generation)
  export const EMAIL_TYPES = {
    PROMOTIONAL: 'promotional',
    WELCOME: 'welcome',
    ABANDONED_CART: 'abandoned_cart',
    NEWSLETTER: 'newsletter',
    ANNOUNCEMENT: 'announcement',
  } as const;

  // Email Template IDs
  export const EMAIL_TEMPLATES = {
    MINIMAL: 'minimal',
    HERO_IMAGE: 'hero_image',
    PRODUCT_GRID: 'product_grid',
    NEWSLETTER: 'newsletter',
  } as const;

  // Export Formats
  export const EXPORT_FORMATS = {
    HTML: 'html',
    LIQUID: 'liquid',
    PLAIN_TEXT: 'plain_text',
    JSON: 'json',
  } as const;

  // Character Limits (for email)
  export const EMAIL_CHAR_LIMITS = {
    SUBJECT_LINE: 60,
    PREHEADER: 90,
    HEADLINE: 80,
    BODY_COPY_MIN_WORDS: 150,
    BODY_COPY_MAX_WORDS: 200,
    CTA_TEXT: 25,
  } as const;

  // Email Generation Modes
  export const EMAIL_GENERATION_MODES = {
    AI_DESIGNED: 'ai-designed',
    TEMPLATE_BASED: 'template-based',
  } as const;

  // Type exports
  export type CampaignStatus = typeof CAMPAIGN_STATUS[keyof typeof CAMPAIGN_STATUS];
  export type AssetStatus = typeof ASSET_STATUS[keyof typeof ASSET_STATUS];
  export type ChannelType = typeof CHANNEL_TYPES[keyof typeof CHANNEL_TYPES];
  export type PropensityLevel = typeof PROPENSITY_LEVELS[keyof typeof PROPENSITY_LEVELS];
  export type UrgencyLevel = typeof URGENCY_LEVELS[keyof typeof URGENCY_LEVELS];
  export type AssetType = typeof ASSET_TYPES[keyof typeof ASSET_TYPES];
  export type VersionStrategy = typeof VERSION_STRATEGIES[keyof typeof VERSION_STRATEGIES];
  export type EmailType = typeof EMAIL_TYPES[keyof typeof EMAIL_TYPES];
  export type EmailTemplate = typeof EMAIL_TEMPLATES[keyof typeof EMAIL_TEMPLATES];
  export type ExportFormat = typeof EXPORT_FORMATS[keyof typeof EXPORT_FORMATS];
  export type EmailGenerationMode = typeof EMAIL_GENERATION_MODES[keyof typeof EMAIL_GENERATION_MODES];
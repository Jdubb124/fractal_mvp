export declare const AUTH: {
    SALT_ROUNDS: number;
    JWT_EXPIRES_IN: string;
    PASSWORD_MIN_LENGTH: number;
};
export declare const LIMITS: {
    MAX_AUDIENCES_PER_USER: number;
    MAX_CAMPAIGNS_PER_USER: number;
    MAX_SEGMENTS_PER_CAMPAIGN: number;
    MAX_CHANNELS_PER_CAMPAIGN: number;
    MAX_VERSIONS_PER_ASSET: number;
};
export declare const CAMPAIGN_STATUS: {
    readonly DRAFT: "draft";
    readonly GENERATED: "generated";
    readonly APPROVED: "approved";
    readonly ARCHIVED: "archived";
};
export declare const ASSET_STATUS: {
    readonly PENDING: "pending";
    readonly GENERATED: "generated";
    readonly EDITED: "edited";
    readonly APPROVED: "approved";
};
export declare const CHANNEL_TYPES: {
    readonly EMAIL: "email";
    readonly META_ADS: "meta_ads";
};
export declare const PROPENSITY_LEVELS: {
    readonly HIGH: "High";
    readonly MEDIUM: "Medium";
    readonly LOW: "Low";
};
export declare const URGENCY_LEVELS: {
    readonly LOW: "low";
    readonly MEDIUM: "medium";
    readonly HIGH: "high";
};
export declare const ASSET_TYPES: {
    readonly HERO_EMAIL: "hero_email";
    readonly FOLLOW_UP_EMAIL: "follow_up_email";
    readonly PROMOTIONAL_EMAIL: "promotional_email";
    readonly SINGLE_IMAGE_AD: "single_image_ad";
    readonly CAROUSEL_AD: "carousel_ad";
    readonly VIDEO_AD: "video_ad";
};
export declare const VERSION_STRATEGIES: {
    readonly CONVERSION: "conversion";
    readonly AWARENESS: "awareness";
    readonly URGENCY: "urgency";
    readonly EMOTIONAL: "emotional";
};
export type CampaignStatus = typeof CAMPAIGN_STATUS[keyof typeof CAMPAIGN_STATUS];
export type AssetStatus = typeof ASSET_STATUS[keyof typeof ASSET_STATUS];
export type ChannelType = typeof CHANNEL_TYPES[keyof typeof CHANNEL_TYPES];
export type PropensityLevel = typeof PROPENSITY_LEVELS[keyof typeof PROPENSITY_LEVELS];
export type UrgencyLevel = typeof URGENCY_LEVELS[keyof typeof URGENCY_LEVELS];
export type AssetType = typeof ASSET_TYPES[keyof typeof ASSET_TYPES];
export type VersionStrategy = typeof VERSION_STRATEGIES[keyof typeof VERSION_STRATEGIES];
//# sourceMappingURL=constants.d.ts.map
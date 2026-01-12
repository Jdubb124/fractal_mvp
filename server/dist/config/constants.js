"use strict";
// Application constants
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION_STRATEGIES = exports.ASSET_TYPES = exports.URGENCY_LEVELS = exports.PROPENSITY_LEVELS = exports.CHANNEL_TYPES = exports.ASSET_STATUS = exports.CAMPAIGN_STATUS = exports.LIMITS = exports.AUTH = void 0;
exports.AUTH = {
    SALT_ROUNDS: 12,
    JWT_EXPIRES_IN: '7d',
    PASSWORD_MIN_LENGTH: 8,
};
exports.LIMITS = {
    MAX_AUDIENCES_PER_USER: 5,
    MAX_CAMPAIGNS_PER_USER: 10,
    MAX_SEGMENTS_PER_CAMPAIGN: 5,
    MAX_CHANNELS_PER_CAMPAIGN: 2,
    MAX_VERSIONS_PER_ASSET: 3,
};
exports.CAMPAIGN_STATUS = {
    DRAFT: 'draft',
    GENERATED: 'generated',
    APPROVED: 'approved',
    ARCHIVED: 'archived',
};
exports.ASSET_STATUS = {
    PENDING: 'pending',
    GENERATED: 'generated',
    EDITED: 'edited',
    APPROVED: 'approved',
};
exports.CHANNEL_TYPES = {
    EMAIL: 'email',
    META_ADS: 'meta_ads',
};
exports.PROPENSITY_LEVELS = {
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
};
exports.URGENCY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
};
exports.ASSET_TYPES = {
    // Email types
    HERO_EMAIL: 'hero_email',
    FOLLOW_UP_EMAIL: 'follow_up_email',
    PROMOTIONAL_EMAIL: 'promotional_email',
    // Meta Ad types
    SINGLE_IMAGE_AD: 'single_image_ad',
    CAROUSEL_AD: 'carousel_ad',
    VIDEO_AD: 'video_ad',
};
exports.VERSION_STRATEGIES = {
    CONVERSION: 'conversion',
    AWARENESS: 'awareness',
    URGENCY: 'urgency',
    EMOTIONAL: 'emotional',
};
//# sourceMappingURL=constants.js.map
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const constants_1 = require("../config/constants");
const emailContentSchema = new mongoose_1.Schema({
    subjectLine: {
        type: String,
        maxlength: [100, 'Subject line cannot exceed 100 characters'],
    },
    preheader: {
        type: String,
        maxlength: [150, 'Preheader cannot exceed 150 characters'],
    },
    headline: {
        type: String,
        maxlength: [150, 'Headline cannot exceed 150 characters'],
    },
    bodyCopy: {
        type: String,
        maxlength: [5000, 'Body copy cannot exceed 5000 characters'],
    },
    ctaText: {
        type: String,
        maxlength: [50, 'CTA text cannot exceed 50 characters'],
    },
}, { _id: false });
const metaAdContentSchema = new mongoose_1.Schema({
    primaryText: {
        type: String,
        maxlength: [500, 'Primary text cannot exceed 500 characters'],
    },
    headline: {
        type: String,
        maxlength: [40, 'Headline cannot exceed 40 characters'],
    },
    description: {
        type: String,
        maxlength: [125, 'Description cannot exceed 125 characters'],
    },
    ctaButton: {
        type: String,
        maxlength: [30, 'CTA button cannot exceed 30 characters'],
    },
}, { _id: false });
const assetVersionSchema = new mongoose_1.Schema({
    versionName: {
        type: String,
        required: true,
        maxlength: [100, 'Version name cannot exceed 100 characters'],
    },
    strategy: {
        type: String,
        maxlength: [100, 'Strategy cannot exceed 100 characters'],
    },
    content: {
        type: mongoose_1.Schema.Types.Mixed, // Will be either email or meta ad content
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(constants_1.ASSET_STATUS),
        default: constants_1.ASSET_STATUS.PENDING,
    },
    generatedAt: Date,
    editedAt: Date,
}, { _id: true } // Keep _id for versions to reference them individually
);
const assetSchema = new mongoose_1.Schema({
    campaignId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Campaign',
        required: true,
    },
    audienceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Audience',
        required: true,
    },
    // Asset Info
    channelType: {
        type: String,
        enum: Object.values(constants_1.CHANNEL_TYPES),
        required: true,
    },
    assetType: {
        type: String,
        enum: Object.values(constants_1.ASSET_TYPES),
        required: true,
    },
    name: {
        type: String,
        required: true,
        maxlength: [200, 'Asset name cannot exceed 200 characters'],
    },
    // Generated Content
    versions: {
        type: [assetVersionSchema],
        validate: {
            validator: function (v) {
                return v.length <= 3; // Max 3 versions per asset
            },
            message: 'Cannot have more than 3 versions per asset',
        },
    },
    // Generation Context
    generationPrompt: {
        type: String,
        maxlength: [10000, 'Generation prompt cannot exceed 10000 characters'],
    },
}, {
    timestamps: true,
});
// Indexes
assetSchema.index({ campaignId: 1, audienceId: 1 });
assetSchema.index({ campaignId: 1, channelType: 1 });
// Virtual to check if all versions are approved
assetSchema.virtual('isFullyApproved').get(function () {
    return this.versions.length > 0 &&
        this.versions.every(v => v.status === constants_1.ASSET_STATUS.APPROVED);
});
// Virtual to get latest version
assetSchema.virtual('latestVersion').get(function () {
    if (this.versions.length === 0)
        return null;
    return this.versions[this.versions.length - 1];
});
// Helper method to add a new version
assetSchema.methods.addVersion = function (versionName, content, strategy) {
    if (this.versions.length >= 3) {
        throw new Error('Maximum 3 versions per asset');
    }
    this.versions.push({
        versionName,
        strategy,
        content,
        status: constants_1.ASSET_STATUS.GENERATED,
        generatedAt: new Date(),
    });
    return this.versions[this.versions.length - 1];
};
// Enable virtuals
assetSchema.set('toJSON', { virtuals: true });
assetSchema.set('toObject', { virtuals: true });
const Asset = mongoose_1.default.model('Asset', assetSchema);
exports.default = Asset;
//# sourceMappingURL=Asset.js.map
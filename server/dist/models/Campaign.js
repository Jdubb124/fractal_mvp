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
const campaignSegmentSchema = new mongoose_1.Schema({
    audienceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Audience',
        required: true,
    },
    customInstructions: {
        type: String,
        maxlength: [1000, 'Custom instructions cannot exceed 1000 characters'],
    },
}, { _id: false });
const campaignChannelSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: Object.values(constants_1.CHANNEL_TYPES),
        required: true,
    },
    enabled: {
        type: Boolean,
        default: true,
    },
    purpose: {
        type: String,
        maxlength: [500, 'Channel purpose cannot exceed 500 characters'],
    },
}, { _id: false });
const campaignSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    brandGuideId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'BrandGuide',
        required: true,
    },
    // Campaign Info
    name: {
        type: String,
        required: [true, 'Campaign name is required'],
        trim: true,
        maxlength: [200, 'Campaign name cannot exceed 200 characters'],
    },
    objective: {
        type: String,
        maxlength: [1000, 'Objective cannot exceed 1000 characters'],
    },
    description: {
        type: String,
        maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    status: {
        type: String,
        enum: Object.values(constants_1.CAMPAIGN_STATUS),
        default: constants_1.CAMPAIGN_STATUS.DRAFT,
    },
    // Targeting
    segments: {
        type: [campaignSegmentSchema],
        validate: {
            validator: function (v) {
                return v.length <= 5; // Max 5 segments per campaign
            },
            message: 'Cannot have more than 5 segments per campaign',
        },
    },
    // Channels
    channels: {
        type: [campaignChannelSchema],
        validate: {
            validator: function (v) {
                return v.length <= 2; // Max 2 channels for MVP
            },
            message: 'Cannot have more than 2 channels per campaign',
        },
    },
    // Campaign Parameters
    keyMessages: [{
            type: String,
            trim: true,
            maxlength: [500, 'Key message cannot exceed 500 characters'],
        }],
    callToAction: {
        type: String,
        maxlength: [100, 'Call to action cannot exceed 100 characters'],
    },
    urgencyLevel: {
        type: String,
        enum: Object.values(constants_1.URGENCY_LEVELS),
        default: constants_1.URGENCY_LEVELS.MEDIUM,
    },
    // Dates
    startDate: Date,
    endDate: Date,
}, {
    timestamps: true,
});
// Indexes
campaignSchema.index({ userId: 1, status: 1 });
campaignSchema.index({ userId: 1, createdAt: -1 });
// Virtual for asset count calculation
campaignSchema.virtual('expectedAssetCount').get(function () {
    const enabledChannels = this.channels.filter(c => c.enabled).length;
    return this.segments.length * enabledChannels;
});
// Virtual for campaign summary (used in AI prompts)
campaignSchema.virtual('contextSummary').get(function () {
    return {
        name: this.name,
        objective: this.objective,
        keyMessages: this.keyMessages,
        cta: this.callToAction,
        urgency: this.urgencyLevel,
        segmentCount: this.segments.length,
        channels: this.channels.filter(c => c.enabled).map(c => c.type),
    };
});
// Pre-save validation: ensure start date is before end date
campaignSchema.pre('save', function (next) {
    if (this.startDate && this.endDate && this.startDate > this.endDate) {
        next(new Error('Start date must be before end date'));
    }
    next();
});
// Enable virtuals
campaignSchema.set('toJSON', { virtuals: true });
campaignSchema.set('toObject', { virtuals: true });
const Campaign = mongoose_1.default.model('Campaign', campaignSchema);
exports.default = Campaign;
//# sourceMappingURL=Campaign.js.map
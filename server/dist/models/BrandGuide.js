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
const brandGuideSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // One brand guide per user
    },
    companyName: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
        maxlength: [200, 'Company name cannot exceed 200 characters'],
    },
    industry: {
        type: String,
        trim: true,
        maxlength: [100, 'Industry cannot exceed 100 characters'],
    },
    // Voice & Tone
    voiceAttributes: [{
            type: String,
            trim: true,
            maxlength: [50, 'Voice attribute cannot exceed 50 characters'],
        }],
    toneGuidelines: {
        type: String,
        maxlength: [2000, 'Tone guidelines cannot exceed 2000 characters'],
    },
    // Messaging
    valueProposition: {
        type: String,
        maxlength: [1000, 'Value proposition cannot exceed 1000 characters'],
    },
    keyMessages: [{
            type: String,
            trim: true,
            maxlength: [500, 'Key message cannot exceed 500 characters'],
        }],
    avoidPhrases: [{
            type: String,
            trim: true,
            maxlength: [200, 'Avoid phrase cannot exceed 200 characters'],
        }],
    // Visual
    primaryColors: [{
            type: String,
            trim: true,
            match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color'],
        }],
    logoUrl: {
        type: String,
        trim: true,
    },
    // Audience Context
    targetAudience: {
        type: String,
        maxlength: [1000, 'Target audience description cannot exceed 1000 characters'],
    },
    competitorContext: {
        type: String,
        maxlength: [1000, 'Competitor context cannot exceed 1000 characters'],
    },
}, {
    timestamps: true,
});
// Index for user lookup
brandGuideSchema.index({ userId: 1 });
// Virtual for full context (used in AI prompts)
brandGuideSchema.virtual('fullContext').get(function () {
    return {
        company: this.companyName,
        industry: this.industry,
        voice: this.voiceAttributes.join(', '),
        tone: this.toneGuidelines,
        valueProposition: this.valueProposition,
        keyMessages: this.keyMessages,
        avoid: this.avoidPhrases,
        audience: this.targetAudience,
        competitors: this.competitorContext,
    };
});
// Enable virtuals in JSON
brandGuideSchema.set('toJSON', { virtuals: true });
brandGuideSchema.set('toObject', { virtuals: true });
const BrandGuide = mongoose_1.default.model('BrandGuide', brandGuideSchema);
exports.default = BrandGuide;
//# sourceMappingURL=BrandGuide.js.map
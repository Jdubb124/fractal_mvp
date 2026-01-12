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
const demographicsSchema = new mongoose_1.Schema({
    ageRange: {
        min: { type: Number, min: 0, max: 120 },
        max: { type: Number, min: 0, max: 120 },
    },
    income: {
        type: String,
        trim: true,
        maxlength: [100, 'Income description cannot exceed 100 characters'],
    },
    location: [{
            type: String,
            trim: true,
            maxlength: [100, 'Location cannot exceed 100 characters'],
        }],
    other: {
        type: String,
        maxlength: [500, 'Other demographics cannot exceed 500 characters'],
    },
}, { _id: false });
const audienceSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Audience name is required'],
        trim: true,
        maxlength: [100, 'Audience name cannot exceed 100 characters'],
    },
    description: {
        type: String,
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    // Demographics
    demographics: {
        type: demographicsSchema,
        default: () => ({ location: [] }),
    },
    // Behavioral
    propensityLevel: {
        type: String,
        enum: Object.values(constants_1.PROPENSITY_LEVELS),
        default: constants_1.PROPENSITY_LEVELS.MEDIUM,
    },
    interests: [{
            type: String,
            trim: true,
            maxlength: [100, 'Interest cannot exceed 100 characters'],
        }],
    painPoints: [{
            type: String,
            trim: true,
            maxlength: [200, 'Pain point cannot exceed 200 characters'],
        }],
    // Messaging Preferences
    preferredTone: {
        type: String,
        maxlength: [200, 'Preferred tone cannot exceed 200 characters'],
    },
    keyMotivators: [{
            type: String,
            trim: true,
            maxlength: [200, 'Key motivator cannot exceed 200 characters'],
        }],
    // Meta
    estimatedSize: {
        type: Number,
        min: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
// Compound index for user's audiences
audienceSchema.index({ userId: 1, name: 1 });
audienceSchema.index({ userId: 1, isActive: 1 });
// Virtual for audience summary (used in AI prompts)
audienceSchema.virtual('summary').get(function () {
    const demo = this.demographics;
    let ageStr = '';
    if (demo.ageRange?.min || demo.ageRange?.max) {
        ageStr = `Ages ${demo.ageRange.min || '?'}-${demo.ageRange.max || '?'}`;
    }
    return {
        name: this.name,
        description: this.description,
        demographics: [ageStr, demo.income, demo.location.join(', ')].filter(Boolean).join(', '),
        propensity: this.propensityLevel,
        interests: this.interests.join(', '),
        painPoints: this.painPoints.join(', '),
        motivators: this.keyMotivators.join(', '),
        tone: this.preferredTone,
    };
});
// Enable virtuals
audienceSchema.set('toJSON', { virtuals: true });
audienceSchema.set('toObject', { virtuals: true });
const Audience = mongoose_1.default.model('Audience', audienceSchema);
exports.default = Audience;
//# sourceMappingURL=Audience.js.map
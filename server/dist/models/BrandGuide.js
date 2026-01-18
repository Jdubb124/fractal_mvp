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
        // No unique constraint - users can have multiple brand guides
    },
    name: {
        type: String,
        required: [true, 'Brand guide name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    colors: [{
            type: String,
            trim: true,
            match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color'],
        }],
    tone: {
        type: String,
        trim: true,
        maxlength: [500, 'Tone cannot exceed 500 characters'],
    },
    coreMessage: {
        type: String,
        trim: true,
        maxlength: [1000, 'Core message cannot exceed 1000 characters'],
    },
}, {
    timestamps: true,
});
// Compound index for user lookup and unique name per user
brandGuideSchema.index({ userId: 1 });
brandGuideSchema.index({ userId: 1, name: 1 }, { unique: true });
// Virtual for full context (used in AI prompts)
brandGuideSchema.virtual('fullContext').get(function () {
    return {
        name: this.name,
        colors: this.colors,
        tone: this.tone,
        coreMessage: this.coreMessage,
    };
});
// Enable virtuals in JSON
brandGuideSchema.set('toJSON', { virtuals: true });
brandGuideSchema.set('toObject', { virtuals: true });
const BrandGuide = mongoose_1.default.model('BrandGuide', brandGuideSchema);
exports.default = BrandGuide;
//# sourceMappingURL=BrandGuide.js.map
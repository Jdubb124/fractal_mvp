import mongoose, { Document, Schema } from 'mongoose';
import { AssetStatus, EmailType, VersionStrategy, EmailTemplate, EmailGenerationMode } from '../config/constants';

// Email content structure (matches existing Asset email content)
export interface IEmailContent {
  subjectLine: string;
  preheader: string;
  headline: string;
  bodyCopy: string;
  ctaText: string;
}

// Generated HTML structure
export interface IEmailHtml {
  fullHtml: string;
  inlinedHtml: string;
  liquidHtml?: string;
  plainText: string;
}

// Email asset metadata
export interface IEmailAssetMeta {
  templateId: string;
  generationMode: EmailGenerationMode;
  generatedAt: Date;
  lastEditedAt?: Date;
  editHistory: IEditRecord[];
  exportCount: number;
  tokensUsed?: number;
}

// Edit history record
export interface IEditRecord {
  timestamp: Date;
  editType: 'manual' | 'ai_assisted';
  prompt?: string;
  previousHtml: string;
}

// Main EmailAsset interface
export interface IEmailAsset extends Document {
  _id: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  audienceId: mongoose.Types.ObjectId;

  // Classification
  emailType: EmailType;
  versionStrategy: VersionStrategy;
  versionNumber: number;

  // Content
  content: IEmailContent;
  html: IEmailHtml;

  // Brand context snapshot
  brandSnapshot: {
    companyName: string;
    primaryColor: string;
    voiceAttributes: string[];
  };

  // Audience context snapshot
  audienceSnapshot: {
    name: string;
    propensityLevel: string;
  };

  // Metadata
  status: AssetStatus;
  meta: IEmailAssetMeta;

  createdAt: Date;
  updatedAt: Date;
}

// Schema implementation
const editRecordSchema = new Schema<IEditRecord>(
  {
    timestamp: { type: Date, default: Date.now },
    editType: { type: String, enum: ['manual', 'ai_assisted'], required: true },
    prompt: { type: String, maxlength: 1000 },
    previousHtml: { type: String, required: true },
  },
  { _id: false }
);

const emailContentSchema = new Schema<IEmailContent>(
  {
    subjectLine: { type: String, required: true, maxlength: 100 },
    preheader: { type: String, required: true, maxlength: 150 },
    headline: { type: String, required: true, maxlength: 120 },
    bodyCopy: { type: String, required: true, maxlength: 5000 },
    ctaText: { type: String, required: true, maxlength: 50 },
  },
  { _id: false }
);

const emailHtmlSchema = new Schema<IEmailHtml>(
  {
    fullHtml: { type: String, required: true },
    inlinedHtml: { type: String, required: true },
    liquidHtml: { type: String },
    plainText: { type: String, required: true },
  },
  { _id: false }
);

const emailAssetSchema = new Schema<IEmailAsset>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    audienceId: {
      type: Schema.Types.ObjectId,
      ref: 'Audience',
      required: true,
    },

    // Classification
    emailType: {
      type: String,
      enum: ['promotional', 'welcome', 'abandoned_cart', 'newsletter', 'announcement'],
      required: true,
    },
    versionStrategy: {
      type: String,
      enum: ['conversion', 'awareness', 'urgency', 'emotional'],
      required: true,
    },
    versionNumber: {
      type: Number,
      default: 1,
      min: 1,
      max: 4,
    },

    // Content
    content: {
      type: emailContentSchema,
      required: true,
    },
    html: {
      type: emailHtmlSchema,
      required: true,
    },

    // Brand snapshot
    brandSnapshot: {
      companyName: { type: String, required: true },
      primaryColor: { type: String, default: '#6366f1' },
      voiceAttributes: [{ type: String }],
    },

    // Audience snapshot
    audienceSnapshot: {
      name: { type: String, required: true },
      propensityLevel: { type: String, default: 'Medium' },
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'generated', 'edited', 'approved'],
      default: 'generated',
    },

    // Metadata
    meta: {
      templateId: { type: String, default: 'ai-generated' },
      generationMode: {
        type: String,
        enum: ['ai-designed', 'template-based'],
        default: 'ai-designed'
      },
      generatedAt: { type: Date, default: Date.now },
      lastEditedAt: { type: Date },
      editHistory: [editRecordSchema],
      exportCount: { type: Number, default: 0 },
      tokensUsed: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
emailAssetSchema.index({ campaignId: 1, audienceId: 1 });
emailAssetSchema.index({ userId: 1, status: 1 });
emailAssetSchema.index({ campaignId: 1, emailType: 1, versionStrategy: 1 });

const EmailAsset = mongoose.model<IEmailAsset>('EmailAsset', emailAssetSchema);
export default EmailAsset;

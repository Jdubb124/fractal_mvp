import mongoose, { Document, Schema } from 'mongoose';
import { 
  ASSET_STATUS, 
  CHANNEL_TYPES, 
  ASSET_TYPES,
  AssetStatus,
  ChannelType,
  AssetType 
} from '../config/constants';

// Email content interface
interface IEmailContent {
  subjectLine?: string;
  preheader?: string;
  headline?: string;
  bodyCopy?: string;
  ctaText?: string;
}

// Meta Ad content interface
interface IMetaAdContent {
  primaryText?: string;
  headline?: string;
  description?: string;
  ctaButton?: string;
}

// Version subdocument interface
export interface IAssetVersion {
  _id?: mongoose.Types.ObjectId;
  versionName: string;
  strategy?: string;
  content: IEmailContent | IMetaAdContent;
  status: AssetStatus;
  generatedAt?: Date;
  editedAt?: Date;
}

export interface IAsset extends Document {
  _id: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  audienceId: mongoose.Types.ObjectId;
  
  // Asset Info
  channelType: ChannelType;
  assetType: AssetType;
  name: string;
  
  // Generated Content
  versions: IAssetVersion[];
  
  // Generation Context
  generationPrompt?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const emailContentSchema = new Schema<IEmailContent>(
  {
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
  },
  { _id: false }
);

const metaAdContentSchema = new Schema<IMetaAdContent>(
  {
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
  },
  { _id: false }
);

const assetVersionSchema = new Schema<IAssetVersion>(
  {
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
      type: Schema.Types.Mixed, // Will be either email or meta ad content
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ASSET_STATUS),
      default: ASSET_STATUS.PENDING,
    },
    generatedAt: Date,
    editedAt: Date,
  },
  { _id: true } // Keep _id for versions to reference them individually
);

const assetSchema = new Schema<IAsset>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    audienceId: {
      type: Schema.Types.ObjectId,
      ref: 'Audience',
      required: true,
    },
    
    // Asset Info
    channelType: {
      type: String,
      enum: Object.values(CHANNEL_TYPES),
      required: true,
    },
    assetType: {
      type: String,
      enum: Object.values(ASSET_TYPES),
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
        validator: function(v: IAssetVersion[]) {
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
  },
  {
    timestamps: true,
  }
);

// Indexes
assetSchema.index({ campaignId: 1, audienceId: 1 });
assetSchema.index({ campaignId: 1, channelType: 1 });

// Virtual to check if all versions are approved
assetSchema.virtual('isFullyApproved').get(function () {
  return this.versions.length > 0 && 
         this.versions.every(v => v.status === ASSET_STATUS.APPROVED);
});

// Virtual to get latest version
assetSchema.virtual('latestVersion').get(function () {
  if (this.versions.length === 0) return null;
  return this.versions[this.versions.length - 1];
});

// Helper method to add a new version
assetSchema.methods.addVersion = function(
  versionName: string, 
  content: IEmailContent | IMetaAdContent,
  strategy?: string
) {
  if (this.versions.length >= 3) {
    throw new Error('Maximum 3 versions per asset');
  }
  
  this.versions.push({
    versionName,
    strategy,
    content,
    status: ASSET_STATUS.GENERATED,
    generatedAt: new Date(),
  });
  
  return this.versions[this.versions.length - 1];
};

// Enable virtuals
assetSchema.set('toJSON', { virtuals: true });
assetSchema.set('toObject', { virtuals: true });

const Asset = mongoose.model<IAsset>('Asset', assetSchema);

export default Asset;
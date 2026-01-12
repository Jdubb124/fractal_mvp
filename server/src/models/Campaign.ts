import mongoose, { Document, Schema } from 'mongoose';
import { 
  CAMPAIGN_STATUS, 
  CHANNEL_TYPES, 
  URGENCY_LEVELS,
  CampaignStatus,
  ChannelType,
  UrgencyLevel 
} from '../config/constants';

// Segment subdocument interface
interface ICampaignSegment {
  audienceId: mongoose.Types.ObjectId;
  customInstructions?: string;
}

// Channel subdocument interface
interface ICampaignChannel {
  type: ChannelType;
  enabled: boolean;
  purpose?: string;
}

// Virtual property interface
interface ICampaignContextSummary {
  name: string;
  objective?: string;
  keyMessages: string[];
  cta?: string;
  urgency: UrgencyLevel;
  segmentCount: number;
  channels: ChannelType[];
}

export interface ICampaign extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  brandGuideId: mongoose.Types.ObjectId;

  // Campaign Info
  name: string;
  objective?: string;
  description?: string;
  status: CampaignStatus;

  // Targeting
  segments: ICampaignSegment[];

  // Channels
  channels: ICampaignChannel[];

  // Campaign Parameters
  keyMessages: string[];
  callToAction?: string;
  urgencyLevel: UrgencyLevel;

  // Dates
  startDate?: Date;
  endDate?: Date;

  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  expectedAssetCount: number;
  contextSummary: ICampaignContextSummary;
}

const campaignSegmentSchema = new Schema<ICampaignSegment>(
  {
    audienceId: {
      type: Schema.Types.ObjectId,
      ref: 'Audience',
      required: true,
    },
    customInstructions: {
      type: String,
      maxlength: [1000, 'Custom instructions cannot exceed 1000 characters'],
    },
  },
  { _id: false }
);

const campaignChannelSchema = new Schema<ICampaignChannel>(
  {
    type: {
      type: String,
      enum: Object.values(CHANNEL_TYPES),
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
  },
  { _id: false }
);

const campaignSchema = new Schema<ICampaign>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    brandGuideId: {
      type: Schema.Types.ObjectId,
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
      enum: Object.values(CAMPAIGN_STATUS),
      default: CAMPAIGN_STATUS.DRAFT,
    },
    
    // Targeting
    segments: {
      type: [campaignSegmentSchema],
      validate: {
        validator: function(v: ICampaignSegment[]) {
          return v.length <= 5; // Max 5 segments per campaign
        },
        message: 'Cannot have more than 5 segments per campaign',
      },
    },
    
    // Channels
    channels: {
      type: [campaignChannelSchema],
      validate: {
        validator: function(v: ICampaignChannel[]) {
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
      enum: Object.values(URGENCY_LEVELS),
      default: URGENCY_LEVELS.MEDIUM,
    },
    
    // Dates
    startDate: Date,
    endDate: Date,
  },
  {
    timestamps: true,
  }
);

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
campaignSchema.pre('save', function(next) {
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    next(new Error('Start date must be before end date'));
  }
  next();
});

// Enable virtuals
campaignSchema.set('toJSON', { virtuals: true });
campaignSchema.set('toObject', { virtuals: true });

const Campaign = mongoose.model<ICampaign>('Campaign', campaignSchema);

export default Campaign;
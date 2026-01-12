import mongoose, { Document, Schema } from 'mongoose';
import { PROPENSITY_LEVELS, PropensityLevel } from '../config/constants';

// Demographics subdocument interface
interface IDemographics {
  ageRange?: {
    min?: number;
    max?: number;
  };
  income?: string;
  location: string[];
  other?: string;
}

// Virtual property interface
export interface IAudienceSummary {
  name: string;
  description?: string;
  demographics: string;
  propensity: PropensityLevel;
  interests: string;
  painPoints: string;
  motivators: string;
  tone?: string;
}

export interface IAudience extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;

  // Demographics
  demographics: IDemographics;

  // Behavioral
  propensityLevel: PropensityLevel;
  interests: string[];
  painPoints: string[];

  // Messaging Preferences
  preferredTone?: string;
  keyMotivators: string[];

  // Meta
  estimatedSize?: number;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  summary: IAudienceSummary;
}

const demographicsSchema = new Schema<IDemographics>(
  {
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
  },
  { _id: false }
);

const audienceSchema = new Schema<IAudience>(
  {
    userId: {
      type: Schema.Types.ObjectId,
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
      enum: Object.values(PROPENSITY_LEVELS),
      default: PROPENSITY_LEVELS.MEDIUM,
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
  },
  {
    timestamps: true,
  }
);

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

const Audience = mongoose.model<IAudience>('Audience', audienceSchema);

export default Audience;
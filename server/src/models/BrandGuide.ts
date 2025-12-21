import mongoose, { Document, Schema } from 'mongoose';

export interface IBrandGuide extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  companyName: string;
  industry?: string;
  
  // Voice & Tone
  voiceAttributes: string[];
  toneGuidelines?: string;
  
  // Messaging
  valueProposition?: string;
  keyMessages: string[];
  avoidPhrases: string[];
  
  // Visual (for reference)
  primaryColors: string[];
  logoUrl?: string;
  
  // Audience Context
  targetAudience?: string;
  competitorContext?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const brandGuideSchema = new Schema<IBrandGuide>(
  {
    userId: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

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

const BrandGuide = mongoose.model<IBrandGuide>('BrandGuide', brandGuideSchema);

export default BrandGuide;
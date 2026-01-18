import mongoose, { Document, Schema } from 'mongoose';

// Virtual property interface for AI prompts
export interface IBrandGuideContext {
  name: string;
  colors: string[];
  tone?: string;
  coreMessage?: string;
}

export interface IBrandGuide extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  // Core brand guide fields
  name: string;
  colors: string[];
  tone?: string;
  coreMessage?: string;

  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  fullContext: IBrandGuideContext;
}

const brandGuideSchema = new Schema<IBrandGuide>(
  {
    userId: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

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

const BrandGuide = mongoose.model<IBrandGuide>('BrandGuide', brandGuideSchema);

export default BrandGuide;

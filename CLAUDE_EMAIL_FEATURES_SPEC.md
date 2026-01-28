# Fractal Email Features Specification
## Email Exporter & Email Asset Viewer/Designer

**Version:** 1.0
**Target:** Claude Code Implementation
**Last Updated:** January 2025

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Feature Overview](#feature-overview)
3. [System Architecture](#system-architecture)
4. [Data Models](#data-models)
5. [API Specifications](#api-specifications)
6. [Email HTML Generation Engine](#email-html-generation-engine)
7. [Frontend Components](#frontend-components)
8. [Development Guide](#development-guide)
9. [Testing Requirements](#testing-requirements)
10. [Appendix: Email Best Practices](#appendix-email-best-practices)

---

## 1. Executive Summary

### Purpose
This document specifies two interconnected features for the Fractal platform:

1. **Email Exporter** - Generates production-ready HTML email templates from campaign context, audience segmentation, and brand guidelines
2. **Email Asset Viewer/Designer** - Provides an interactive interface for viewing, editing, and refining exported HTML emails

### Business Context
Fractal's core value proposition is the "Multiplication Effect": Segments × Channels × Versions = Total Personalized Assets. These features represent the final output stage of the Build module, transforming AI-generated content into deployable email assets.

### Target Users
SMB e-commerce businesses ($5-50M revenue) who need:
- Rapid email creation without design expertise
- Brand-consistent outputs across campaigns
- Exportable HTML compatible with ESPs (Klaviyo, Mailchimp, etc.)

---

## 2. Feature Overview

### 2.1 Email Exporter

**Brief:** The final output of the campaign creation workflow. Generates complete, responsive HTML email templates based on:
- Campaign context (objective, key messages, CTA, urgency)
- Audience segmentation (demographics, pain points, motivators)
- Brand guidance (voice, tone, colors, avoid phrases)
- Email type (promotional, welcome, abandoned cart, newsletter, announcement)
- Version strategy (conversion, awareness, urgency, emotional)

**Key Constraints:**
- ❌ No AI-generated images - uses placeholder blocks for user-provided images
- ✅ Outputs modifiable HTML code
- ✅ Follows email best practices for client compatibility
- ✅ Responsive design (320-800px width range)

### 2.2 Email Asset Viewer/Designer

**Brief:** Campaign view UI component enabling users to:
- Preview rendered HTML emails in a sandboxed web view
- Edit HTML source code directly
- Use AI prompts to request specific modifications
- Compare versions side-by-side
- Export individual assets or bulk export

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       CAMPAIGN VIEW UI                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Email Asset Viewer/Designer                  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │ Preview Pane│  │ Code Editor │  │ AI Edit Panel   │   │  │
│  │  │ (Sandboxed) │  │ (Monaco)    │  │ (Prompt Input)  │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Email Exporter API    │
                    │  /api/emails/generate   │
                    │  /api/emails/export     │
                    │  /api/emails/edit       │
                    └────────────┬────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
    ┌─────▼─────┐         ┌──────▼──────┐       ┌──────▼──────┐
    │  Email    │         │   Context   │       │   Claude    │
    │  Template │         │  Assembler  │       │     API     │
    │  Engine   │         │  Service    │       │  (Edits)    │
    └───────────┘         └─────────────┘       └─────────────┘
```

### 3.2 Data Flow

```
Campaign Creation Wizard
         │
         ▼
    [Step 5: Generate]
         │
         ├──► Context Assembly
         │    • Brand Guide
         │    • Audience Segment
         │    • Campaign Config
         │    • Version Strategy
         │
         ▼
    Email Content Generation (existing)
         │
         ├──► Subject Line
         ├──► Preheader
         ├──► Headline
         ├──► Body Copy
         └──► CTA Text
         │
         ▼
    Email HTML Exporter (NEW)
         │
         ├──► Template Selection
         ├──► Brand Styling Injection
         ├──► Content Population
         └──► Responsive Wrapper
         │
         ▼
    Generated Email Asset
         │
         ├──► Store in DB (EmailAsset)
         └──► Return to UI
         │
         ▼
    Email Asset Viewer/Designer (NEW)
         │
         ├──► Live Preview
         ├──► Code Editing
         ├──► AI-Assisted Edits
         └──► Export Options
```

### 3.3 Tech Stack Alignment

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Angular 17+ | Standalone components, signals |
| State | Angular Signals | Reactive state management |
| Code Editor | Monaco Editor | VS Code-based editor |
| Preview | iframe sandbox | Secure HTML rendering |
| Backend | Express + TypeScript | RESTful API |
| AI | Claude API | Content generation & editing |
| Database | MongoDB | EmailAsset collection |
| Export | Node.js | HTML/Liquid file generation |

---

## 4. Data Models

### 4.1 EmailAsset Model (New)

**File:** `server/src/models/EmailAsset.ts`

```typescript
import mongoose, { Document, Schema } from 'mongoose';
import { AssetStatus, EmailType, VersionStrategy } from '../config/constants';

// Email content structure (matches existing)
export interface IEmailContent {
  subjectLine: string;
  preheader: string;
  headline: string;
  bodyCopy: string;
  ctaText: string;
}

// Generated HTML structure
export interface IEmailHtml {
  fullHtml: string;           // Complete HTML document
  inlinedHtml: string;        // CSS inlined for email clients
  liquidHtml?: string;        // Liquid template version
  plainText: string;          // Plain text fallback
}

// Email asset metadata
export interface IEmailAssetMeta {
  templateId: string;         // Template used for generation
  generatedAt: Date;
  lastEditedAt?: Date;
  editHistory: IEditRecord[];
  exportCount: number;
}

// Edit history record
export interface IEditRecord {
  timestamp: Date;
  editType: 'manual' | 'ai_assisted';
  prompt?: string;            // AI prompt if applicable
  previousHtml: string;       // For undo functionality
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
    bodyCopy: { type: String, required: true, maxlength: 2000 },
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
      templateId: { type: String, required: true },
      generatedAt: { type: Date, default: Date.now },
      lastEditedAt: { type: Date },
      editHistory: [editRecordSchema],
      exportCount: { type: Number, default: 0 },
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
```

### 4.2 Updated Constants

**Add to:** `server/src/config/constants.ts`

```typescript
// Email Types (for email-specific generation)
export const EMAIL_TYPES = {
  PROMOTIONAL: 'promotional',
  WELCOME: 'welcome',
  ABANDONED_CART: 'abandoned_cart',
  NEWSLETTER: 'newsletter',
  ANNOUNCEMENT: 'announcement',
} as const;

export type EmailType = typeof EMAIL_TYPES[keyof typeof EMAIL_TYPES];

// Email Template IDs
export const EMAIL_TEMPLATES = {
  MINIMAL: 'minimal',           // Clean, text-focused
  HERO_IMAGE: 'hero_image',     // Large hero image placeholder
  PRODUCT_GRID: 'product_grid', // Product showcase grid
  NEWSLETTER: 'newsletter',     // Multi-section newsletter
} as const;

export type EmailTemplate = typeof EMAIL_TEMPLATES[keyof typeof EMAIL_TEMPLATES];

// Export Formats
export const EXPORT_FORMATS = {
  HTML: 'html',
  LIQUID: 'liquid',
  PLAIN_TEXT: 'plain_text',
  JSON: 'json',
} as const;

export type ExportFormat = typeof EXPORT_FORMATS[keyof typeof EXPORT_FORMATS];

// Character Limits (for email)
export const EMAIL_CHAR_LIMITS = {
  SUBJECT_LINE: 60,
  PREHEADER: 90,
  HEADLINE: 80,
  BODY_COPY_MIN_WORDS: 150,
  BODY_COPY_MAX_WORDS: 200,
  CTA_TEXT: 25,
} as const;
```

---

## 5. API Specifications

### 5.1 Email Generation Endpoint

**POST** `/api/emails/generate`

Generates HTML emails for a campaign's generated content.

```typescript
// Request
interface GenerateEmailsRequest {
  campaignId: string;
  templateId?: EmailTemplate;  // defaults to 'minimal'
  regenerate?: boolean;        // force regeneration
}

// Response
interface GenerateEmailsResponse {
  success: boolean;
  message: string;
  data: {
    emailAssets: IEmailAsset[];
    totalGenerated: number;
    generationTime: number;    // milliseconds
  };
}
```

**Controller Implementation:**

```typescript
// server/src/controllers/email.controller.ts
import { Request, Response, NextFunction } from 'express';
import { emailService } from '../services/email.service';
import { catchAsync } from '../utils/catchAsync';

export const generateEmails = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { campaignId, templateId = 'minimal', regenerate = false } = req.body;
    const userId = req.user._id;

    const result = await emailService.generateEmailAssets({
      campaignId,
      userId,
      templateId,
      regenerate,
    });

    res.status(201).json({
      success: true,
      message: `Generated ${result.totalGenerated} email assets`,
      data: result,
    });
  }
);
```

### 5.2 Email Export Endpoint

**GET** `/api/emails/:assetId/export`

Exports a single email asset in the specified format.

```typescript
// Query Parameters
interface ExportQueryParams {
  format: ExportFormat;        // 'html' | 'liquid' | 'plain_text' | 'json'
  download?: boolean;          // trigger file download
}

// Response (if download=false)
interface ExportEmailResponse {
  success: boolean;
  data: {
    content: string;
    filename: string;
    mimeType: string;
  };
}
```

### 5.3 Bulk Export Endpoint

**POST** `/api/emails/export/bulk`

Exports multiple email assets as a ZIP archive.

```typescript
// Request
interface BulkExportRequest {
  assetIds: string[];
  format: ExportFormat;
  organizationStrategy: 'flat' | 'by_audience' | 'by_type';
}

// Response
// Returns ZIP file as binary stream
```

### 5.4 Email Edit Endpoint

**PUT** `/api/emails/:assetId`

Updates an email asset's HTML content.

```typescript
// Request
interface UpdateEmailRequest {
  html: string;                // Updated full HTML
  editType: 'manual' | 'ai_assisted';
  prompt?: string;             // If AI-assisted
}

// Response
interface UpdateEmailResponse {
  success: boolean;
  data: {
    emailAsset: IEmailAsset;
    inlinedHtml: string;       // Re-processed with CSS inlined
    plainText: string;         // Regenerated plain text
  };
}
```

### 5.5 AI Edit Endpoint

**POST** `/api/emails/:assetId/ai-edit`

Uses Claude to modify email HTML based on a prompt.

```typescript
// Request
interface AIEditRequest {
  prompt: string;              // User's edit instruction
  preserveStructure?: boolean; // Keep layout, change content only
}

// Response
interface AIEditResponse {
  success: boolean;
  data: {
    modifiedHtml: string;
    changes: string[];         // Description of changes made
    tokensUsed: number;
  };
}
```

### 5.6 Routes Configuration

**File:** `server/src/routes/email.routes.ts`

```typescript
import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  generateEmails,
  exportEmail,
  bulkExportEmails,
  updateEmail,
  aiEditEmail,
  getEmailAsset,
  getEmailAssetsByCampaign,
} from '../controllers/email.controller';
import {
  validateGenerateEmails,
  validateExport,
  validateUpdateEmail,
  validateAIEdit,
} from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(protect);

// Generation
router.post('/generate', validateGenerateEmails, generateEmails);

// Retrieval
router.get('/campaign/:campaignId', getEmailAssetsByCampaign);
router.get('/:assetId', getEmailAsset);

// Export
router.get('/:assetId/export', validateExport, exportEmail);
router.post('/export/bulk', validateExport, bulkExportEmails);

// Editing
router.put('/:assetId', validateUpdateEmail, updateEmail);
router.post('/:assetId/ai-edit', validateAIEdit, aiEditEmail);

export default router;
```

---

## 6. Email HTML Generation Engine

### 6.1 Email Service

**File:** `server/src/services/email.service.ts`

```typescript
import EmailAsset, { IEmailAsset, IEmailContent } from '../models/EmailAsset';
import Campaign from '../models/Campaign';
import BrandGuide from '../models/BrandGuide';
import Audience from '../models/Audience';
import { emailTemplateEngine } from './email-template.engine';
import { cssInliner } from '../utils/css-inliner';
import { htmlToPlainText } from '../utils/html-to-text';
import { claudeService } from './claude.service';

interface GenerateEmailAssetsParams {
  campaignId: string;
  userId: string;
  templateId: string;
  regenerate: boolean;
}

interface GenerateEmailAssetsResult {
  emailAssets: IEmailAsset[];
  totalGenerated: number;
  generationTime: number;
}

class EmailService {
  /**
   * Generate HTML email assets for all generated content in a campaign
   */
  async generateEmailAssets(
    params: GenerateEmailAssetsParams
  ): Promise<GenerateEmailAssetsResult> {
    const startTime = Date.now();
    const { campaignId, userId, templateId, regenerate } = params;

    // Fetch campaign with populated data
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.userId.toString() !== userId) {
      throw new Error('Campaign not found or unauthorized');
    }

    // Fetch brand guide
    const brandGuide = await BrandGuide.findById(campaign.brandGuideId);
    if (!brandGuide) {
      throw new Error('Brand guide not found');
    }

    // If regenerating, delete existing assets
    if (regenerate) {
      await EmailAsset.deleteMany({ campaignId, userId });
    }

    // Get generated content from the campaign (from email-builder service)
    // This assumes content has already been generated via the wizard
    const generatedContent = await this.getGeneratedContent(campaignId);

    const emailAssets: IEmailAsset[] = [];

    for (const contentItem of generatedContent) {
      // Fetch audience for this segment
      const audience = await Audience.findById(contentItem.audienceId);
      if (!audience) continue;

      // Generate HTML using template engine
      const htmlOutput = await emailTemplateEngine.generate({
        templateId,
        content: contentItem.content,
        brandGuide: {
          companyName: brandGuide.companyName,
          primaryColor: brandGuide.primaryColors?.[0] || '#6366f1',
          voiceAttributes: brandGuide.voiceAttributes,
          logoUrl: brandGuide.logoUrl,
        },
        audience: {
          name: audience.name,
          propensityLevel: audience.propensityLevel,
        },
        campaign: {
          name: campaign.name,
          objective: campaign.objective,
          callToAction: campaign.callToAction,
        },
      });

      // Inline CSS for email client compatibility
      const inlinedHtml = await cssInliner.inline(htmlOutput.fullHtml);

      // Generate plain text version
      const plainText = htmlToPlainText(htmlOutput.fullHtml);

      // Create email asset
      const emailAsset = await EmailAsset.create({
        campaignId,
        userId,
        audienceId: contentItem.audienceId,
        emailType: contentItem.emailType,
        versionStrategy: contentItem.strategy,
        versionNumber: contentItem.versionNumber || 1,
        content: contentItem.content,
        html: {
          fullHtml: htmlOutput.fullHtml,
          inlinedHtml,
          liquidHtml: this.generateLiquidTemplate(htmlOutput.fullHtml),
          plainText,
        },
        brandSnapshot: {
          companyName: brandGuide.companyName,
          primaryColor: brandGuide.primaryColors?.[0] || '#6366f1',
          voiceAttributes: brandGuide.voiceAttributes,
        },
        audienceSnapshot: {
          name: audience.name,
          propensityLevel: audience.propensityLevel,
        },
        status: 'generated',
        meta: {
          templateId,
          generatedAt: new Date(),
          editHistory: [],
          exportCount: 0,
        },
      });

      emailAssets.push(emailAsset);
    }

    return {
      emailAssets,
      totalGenerated: emailAssets.length,
      generationTime: Date.now() - startTime,
    };
  }

  /**
   * Get generated content from campaign (placeholder - integrate with existing service)
   */
  private async getGeneratedContent(campaignId: string): Promise<any[]> {
    // This should integrate with your existing email-builder service
    // that generates content via Claude API
    // For now, returning empty array - implement integration
    return [];
  }

  /**
   * Convert HTML to Liquid template format
   */
  private generateLiquidTemplate(html: string): string {
    // Replace content placeholders with Liquid variables
    let liquid = html;
    
    // Subject line (typically handled separately in ESPs)
    // Preheader
    liquid = liquid.replace(
      /<!--\s*preheader\s*-->(.*?)<!--\s*\/preheader\s*-->/gs,
      '{{ email.preheader }}'
    );
    
    // Headline
    liquid = liquid.replace(
      /<h1[^>]*>(.*?)<\/h1>/gi,
      '<h1>{{ email.headline }}</h1>'
    );
    
    // Body copy - more complex, preserve structure
    // CTA
    liquid = liquid.replace(
      /<a([^>]*class="[^"]*cta[^"]*"[^>]*)>(.*?)<\/a>/gi,
      '<a$1>{{ email.cta_text }}</a>'
    );
    
    // Add conditional blocks for personalization
    liquid = `{% comment %}Generated by Fractal{% endcomment %}\n${liquid}`;
    
    return liquid;
  }

  /**
   * AI-assisted email editing
   */
  async aiEditEmail(
    assetId: string,
    userId: string,
    prompt: string,
    preserveStructure: boolean
  ): Promise<{ modifiedHtml: string; changes: string[]; tokensUsed: number }> {
    const asset = await EmailAsset.findById(assetId);
    if (!asset || asset.userId.toString() !== userId) {
      throw new Error('Email asset not found or unauthorized');
    }

    const systemPrompt = `You are an expert email HTML editor. You will receive an HTML email template and a modification request.

Your task:
1. Analyze the current HTML structure
2. Apply the requested changes
3. ${preserveStructure ? 'IMPORTANT: Preserve the exact HTML structure and layout. Only modify text content, colors, or styles as requested.' : 'You may modify the structure if needed to fulfill the request.'}
4. Ensure the output remains valid, email-client-compatible HTML
5. Keep all CSS inline or in <style> tags within <head>

Return ONLY the modified HTML, no explanations.`;

    const userPrompt = `Current HTML:
\`\`\`html
${asset.html.fullHtml}
\`\`\`

Modification request: ${prompt}

Return the complete modified HTML:`;

    const response = await claudeService.complete({
      systemPrompt,
      userPrompt,
      maxTokens: 8000,
    });

    // Extract HTML from response
    const modifiedHtml = this.extractHtmlFromResponse(response.content);
    
    // Determine changes made (simplified)
    const changes = [
      `Applied modification: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`,
    ];

    return {
      modifiedHtml,
      changes,
      tokensUsed: response.usage?.total_tokens || 0,
    };
  }

  private extractHtmlFromResponse(response: string): string {
    // Try to extract HTML from code blocks
    const htmlMatch = response.match(/```html?\s*([\s\S]*?)\s*```/);
    if (htmlMatch) {
      return htmlMatch[1].trim();
    }
    
    // If no code block, assume entire response is HTML
    return response.trim();
  }

  /**
   * Update email asset with new HTML
   */
  async updateEmail(
    assetId: string,
    userId: string,
    html: string,
    editType: 'manual' | 'ai_assisted',
    prompt?: string
  ): Promise<IEmailAsset> {
    const asset = await EmailAsset.findById(assetId);
    if (!asset || asset.userId.toString() !== userId) {
      throw new Error('Email asset not found or unauthorized');
    }

    // Save current state to history
    asset.meta.editHistory.push({
      timestamp: new Date(),
      editType,
      prompt,
      previousHtml: asset.html.fullHtml,
    });

    // Limit history to last 10 edits
    if (asset.meta.editHistory.length > 10) {
      asset.meta.editHistory = asset.meta.editHistory.slice(-10);
    }

    // Update HTML
    asset.html.fullHtml = html;
    asset.html.inlinedHtml = await cssInliner.inline(html);
    asset.html.plainText = htmlToPlainText(html);
    asset.html.liquidHtml = this.generateLiquidTemplate(html);
    
    // Update metadata
    asset.meta.lastEditedAt = new Date();
    asset.status = 'edited';

    await asset.save();
    return asset;
  }
}

export const emailService = new EmailService();
```

### 6.2 Email Template Engine

**File:** `server/src/services/email-template.engine.ts`

```typescript
import { IEmailContent } from '../models/EmailAsset';

interface TemplateContext {
  templateId: string;
  content: IEmailContent;
  brandGuide: {
    companyName: string;
    primaryColor: string;
    voiceAttributes: string[];
    logoUrl?: string;
  };
  audience: {
    name: string;
    propensityLevel: string;
  };
  campaign: {
    name: string;
    objective?: string;
    callToAction?: string;
  };
}

interface TemplateOutput {
  fullHtml: string;
}

class EmailTemplateEngine {
  /**
   * Generate HTML email from template and context
   */
  async generate(context: TemplateContext): Promise<TemplateOutput> {
    const template = this.getTemplate(context.templateId);
    const html = this.populate(template, context);
    
    return { fullHtml: html };
  }

  /**
   * Get base template by ID
   */
  private getTemplate(templateId: string): string {
    const templates: Record<string, string> = {
      minimal: this.minimalTemplate(),
      hero_image: this.heroImageTemplate(),
      product_grid: this.productGridTemplate(),
      newsletter: this.newsletterTemplate(),
    };

    return templates[templateId] || templates.minimal;
  }

  /**
   * Populate template with content
   */
  private populate(template: string, context: TemplateContext): string {
    const { content, brandGuide, audience, campaign } = context;
    
    // Calculate button text color based on background
    const buttonTextColor = this.getContrastColor(brandGuide.primaryColor);
    
    let html = template
      // Content
      .replace(/\{\{SUBJECT_LINE\}\}/g, this.escapeHtml(content.subjectLine))
      .replace(/\{\{PREHEADER\}\}/g, this.escapeHtml(content.preheader))
      .replace(/\{\{HEADLINE\}\}/g, this.escapeHtml(content.headline))
      .replace(/\{\{BODY_COPY\}\}/g, this.formatBodyCopy(content.bodyCopy))
      .replace(/\{\{CTA_TEXT\}\}/g, this.escapeHtml(content.ctaText))
      
      // Brand
      .replace(/\{\{COMPANY_NAME\}\}/g, this.escapeHtml(brandGuide.companyName))
      .replace(/\{\{PRIMARY_COLOR\}\}/g, brandGuide.primaryColor)
      .replace(/\{\{BUTTON_TEXT_COLOR\}\}/g, buttonTextColor)
      .replace(/\{\{LOGO_URL\}\}/g, brandGuide.logoUrl || '')
      
      // Campaign
      .replace(/\{\{CAMPAIGN_NAME\}\}/g, this.escapeHtml(campaign.name))
      
      // Audience
      .replace(/\{\{AUDIENCE_NAME\}\}/g, this.escapeHtml(audience.name))
      
      // Year for footer
      .replace(/\{\{CURRENT_YEAR\}\}/g, new Date().getFullYear().toString());

    // Handle conditional logo
    if (!brandGuide.logoUrl) {
      html = html.replace(/<!--LOGO_START-->[\s\S]*?<!--LOGO_END-->/g, '');
    }

    return html;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, (char) => escapeMap[char]);
  }

  /**
   * Format body copy with paragraph tags
   */
  private formatBodyCopy(text: string): string {
    return text
      .split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p style="margin: 0 0 16px 0; line-height: 1.6;">${this.escapeHtml(p.trim())}</p>`)
      .join('\n');
  }

  /**
   * Get contrasting color (black or white) for readability
   */
  private getContrastColor(hexColor: string): string {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  /**
   * Minimal Template - Clean, text-focused design
   */
  private minimalTemplate(): string {
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>{{SUBJECT_LINE}}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f4f4f7; }
    
    /* iOS blue links */
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    
    /* Gmail blue links */
    u + #body a { color: inherit; text-decoration: none; font-size: inherit; font-family: inherit; font-weight: inherit; line-height: inherit; }
    
    /* Samsung blue links */
    #MessageViewBody a { color: inherit; text-decoration: none; font-size: inherit; font-family: inherit; font-weight: inherit; line-height: inherit; }
    
    /* Responsive */
    @media screen and (max-width: 600px) {
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-full-width { width: 100% !important; }
    }
  </style>
</head>
<body id="body" style="margin: 0; padding: 0; background-color: #f4f4f7;">
  <!-- Preheader (hidden) -->
  <div style="display: none; max-height: 0px; overflow: hidden;">
    {{PREHEADER}}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <!-- Email Container -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f7;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        
        <!-- Content Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" class="mobile-full-width" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;" class="mobile-padding">
              <!--LOGO_START-->
              <img src="{{LOGO_URL}}" alt="{{COMPANY_NAME}}" width="150" style="display: block; margin-bottom: 20px;">
              <!--LOGO_END-->
              <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a2e; line-height: 1.3;">
                {{HEADLINE}}
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 20px 40px 30px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #4a4a68;" class="mobile-padding">
              {{BODY_COPY}}
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 10px 40px 40px 40px;" class="mobile-padding">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color: {{PRIMARY_COLOR}}; border-radius: 6px;">
                    <a href="#" target="_blank" class="cta" style="display: inline-block; padding: 16px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: {{BUTTON_TEXT_COLOR}}; text-decoration: none;">
                      {{CTA_TEXT}}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;" class="mobile-padding">
              <hr style="border: none; border-top: 1px solid #e8e8ed; margin: 0;">
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 30px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #9898a8;" class="mobile-padding">
              <p style="margin: 0 0 10px 0;">
                &copy; {{CURRENT_YEAR}} {{COMPANY_NAME}}. All rights reserved.
              </p>
              <p style="margin: 0;">
                <a href="#" style="color: #9898a8; text-decoration: underline;">Unsubscribe</a>
                &nbsp;|&nbsp;
                <a href="#" style="color: #9898a8; text-decoration: underline;">View in browser</a>
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Hero Image Template - Large hero image placeholder
   */
  private heroImageTemplate(): string {
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>{{SUBJECT_LINE}}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f4f4f7; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    u + #body a { color: inherit; text-decoration: none; }
    #MessageViewBody a { color: inherit; text-decoration: none; }
    @media screen and (max-width: 600px) {
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-full-width { width: 100% !important; }
    }
  </style>
</head>
<body id="body" style="margin: 0; padding: 0; background-color: #f4f4f7;">
  <!-- Preheader -->
  <div style="display: none; max-height: 0px; overflow: hidden;">{{PREHEADER}}</div>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f7;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" class="mobile-full-width" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          
          <!-- Hero Image Placeholder -->
          <tr>
            <td align="center" style="background-color: #e8e8ed; height: 300px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" height="300">
                <tr>
                  <td align="center" valign="middle" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #9898a8;">
                    <!-- IMAGE PLACEHOLDER: 600x300px -->
                    <p style="margin: 0;">Hero Image (600×300)</p>
                    <p style="margin: 5px 0 0 0; font-size: 12px;">Replace with your image</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 30px 40px 20px 40px;" class="mobile-padding">
              <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a2e; line-height: 1.3;">
                {{HEADLINE}}
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 10px 40px 30px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #4a4a68;" class="mobile-padding">
              {{BODY_COPY}}
            </td>
          </tr>
          
          <!-- CTA -->
          <tr>
            <td align="center" style="padding: 10px 40px 40px 40px;" class="mobile-padding">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color: {{PRIMARY_COLOR}}; border-radius: 6px;">
                    <a href="#" target="_blank" class="cta" style="display: inline-block; padding: 16px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: {{BUTTON_TEXT_COLOR}}; text-decoration: none;">
                      {{CTA_TEXT}}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 0 40px;" class="mobile-padding">
              <hr style="border: none; border-top: 1px solid #e8e8ed; margin: 0;">
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 30px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #9898a8;" class="mobile-padding">
              <p style="margin: 0 0 10px 0;">&copy; {{CURRENT_YEAR}} {{COMPANY_NAME}}. All rights reserved.</p>
              <p style="margin: 0;">
                <a href="#" style="color: #9898a8; text-decoration: underline;">Unsubscribe</a> | 
                <a href="#" style="color: #9898a8; text-decoration: underline;">View in browser</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Product Grid Template - 2-column product showcase
   */
  private productGridTemplate(): string {
    // Similar structure with product placeholder blocks
    return this.minimalTemplate(); // Placeholder - implement full version
  }

  /**
   * Newsletter Template - Multi-section layout
   */
  private newsletterTemplate(): string {
    // More complex multi-section layout
    return this.minimalTemplate(); // Placeholder - implement full version
  }
}

export const emailTemplateEngine = new EmailTemplateEngine();
```

### 6.3 CSS Inliner Utility

**File:** `server/src/utils/css-inliner.ts`

```typescript
import juice from 'juice';

class CSSInliner {
  /**
   * Inline CSS styles for email client compatibility
   */
  async inline(html: string): Promise<string> {
    const options = {
      applyStyleTags: true,
      removeStyleTags: false, // Keep for clients that support it
      preserveMediaQueries: true,
      preserveFontFaces: true,
      preserveKeyFrames: true,
      preservePseudos: true,
      insertPreservedExtraCss: true,
      extraCss: '',
      webResources: {
        images: false,
      },
    };

    try {
      return juice(html, options);
    } catch (error) {
      console.error('CSS inlining error:', error);
      return html; // Return original on error
    }
  }
}

export const cssInliner = new CSSInliner();
```

### 6.4 HTML to Plain Text Utility

**File:** `server/src/utils/html-to-text.ts`

```typescript
import { convert } from 'html-to-text';

/**
 * Convert HTML email to plain text version
 */
export function htmlToPlainText(html: string): string {
  const options = {
    wordwrap: 80,
    selectors: [
      { selector: 'a', options: { linkBrackets: ['[', ']'] } },
      { selector: 'img', format: 'skip' },
      { selector: 'table.footer', format: 'skip' },
    ],
    preserveNewlines: false,
    formatters: {
      // Custom formatter for CTA buttons
      ctaButton: function (elem: any, walk: any, builder: any) {
        const text = builder.options.linkBrackets[0] + elem.children.map((c: any) => c.data || '').join('') + builder.options.linkBrackets[1];
        builder.addInline(text);
      },
    },
  };

  try {
    let text = convert(html, options);
    
    // Clean up excessive whitespace
    text = text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    return text;
  } catch (error) {
    console.error('HTML to text conversion error:', error);
    return '';
  }
}
```

---

## 7. Frontend Components

### 7.1 Email Asset Viewer/Designer Component

**File:** `client/src/app/features/campaigns/components/email-viewer/email-viewer.component.ts`

```typescript
import { Component, Input, Output, EventEmitter, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EmailAsset, EmailViewMode, ExportFormat } from '../../models/email.types';
import { EmailService } from '../../services/email.service';

@Component({
  selector: 'app-email-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="email-viewer-container">
      <!-- Header -->
      <div class="viewer-header">
        <div class="asset-info">
          <span class="badge badge-segment">{{ asset()?.audienceSnapshot?.name }}</span>
          <span class="badge badge-type">{{ formatEmailType(asset()?.emailType) }}</span>
          <span class="badge badge-strategy">{{ formatStrategy(asset()?.versionStrategy) }}</span>
        </div>
        
        <div class="view-controls">
          <button 
            [class.active]="viewMode() === 'preview'"
            (click)="setViewMode('preview')"
            class="view-btn">
            <span class="icon">👁️</span> Preview
          </button>
          <button 
            [class.active]="viewMode() === 'code'"
            (click)="setViewMode('code')"
            class="view-btn">
            <span class="icon">💻</span> Code
          </button>
          <button 
            [class.active]="viewMode() === 'split'"
            (click)="setViewMode('split')"
            class="view-btn">
            <span class="icon">⚡</span> Split
          </button>
        </div>

        <div class="export-controls">
          <select [(ngModel)]="selectedExportFormat" class="export-select">
            <option value="html">HTML</option>
            <option value="liquid">Liquid</option>
            <option value="plain_text">Plain Text</option>
            <option value="json">JSON</option>
          </select>
          <button (click)="exportAsset()" class="btn-export">
            Export
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="viewer-content" [class]="'mode-' + viewMode()">
        
        <!-- Preview Pane -->
        @if (viewMode() === 'preview' || viewMode() === 'split') {
          <div class="preview-pane">
            <div class="preview-toolbar">
              <button 
                [class.active]="previewWidth() === 'mobile'"
                (click)="setPreviewWidth('mobile')"
                class="width-btn" title="Mobile (375px)">
                📱
              </button>
              <button 
                [class.active]="previewWidth() === 'tablet'"
                (click)="setPreviewWidth('tablet')"
                class="width-btn" title="Tablet (600px)">
                📟
              </button>
              <button 
                [class.active]="previewWidth() === 'desktop'"
                (click)="setPreviewWidth('desktop')"
                class="width-btn" title="Desktop (800px)">
                🖥️
              </button>
            </div>
            <div class="preview-frame-container" [style.max-width.px]="previewWidthPx()">
              <iframe 
                #previewFrame
                [srcdoc]="sanitizedHtml()"
                sandbox="allow-same-origin"
                class="preview-frame">
              </iframe>
            </div>
          </div>
        }

        <!-- Code Editor Pane -->
        @if (viewMode() === 'code' || viewMode() === 'split') {
          <div class="code-pane">
            <div class="code-toolbar">
              <span class="code-label">HTML Source</span>
              <button (click)="formatCode()" class="toolbar-btn" title="Format Code">
                ✨ Format
              </button>
              <button (click)="copyCode()" class="toolbar-btn" title="Copy to Clipboard">
                📋 Copy
              </button>
            </div>
            <textarea 
              #codeEditor
              [(ngModel)]="editableHtml"
              (ngModelChange)="onCodeChange($event)"
              class="code-editor"
              spellcheck="false">
            </textarea>
          </div>
        }
      </div>

      <!-- AI Edit Panel -->
      <div class="ai-edit-panel">
        <div class="ai-edit-header">
          <span class="ai-icon">🤖</span>
          <span>AI Editor</span>
        </div>
        <div class="ai-edit-content">
          <textarea 
            [(ngModel)]="aiPrompt"
            placeholder="Describe the changes you want, e.g., 'Make the headline more urgent' or 'Change the button color to blue'"
            class="ai-prompt-input"
            rows="2">
          </textarea>
          <div class="ai-edit-options">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="preserveStructure">
              Preserve layout structure
            </label>
          </div>
          <button 
            (click)="applyAIEdit()"
            [disabled]="isAIEditing() || !aiPrompt.trim()"
            class="btn-ai-edit">
            @if (isAIEditing()) {
              <span class="spinner"></span> Applying...
            } @else {
              Apply AI Edit
            }
          </button>
        </div>
      </div>

      <!-- Status Bar -->
      <div class="status-bar">
        <span class="status-item">
          Status: <strong [class]="'status-' + asset()?.status">{{ asset()?.status }}</strong>
        </span>
        <span class="status-item">
          Last edited: {{ formatDate(asset()?.meta?.lastEditedAt) }}
        </span>
        <span class="status-item">
          Exports: {{ asset()?.meta?.exportCount || 0 }}
        </span>
        @if (hasUnsavedChanges()) {
          <span class="status-item status-unsaved">● Unsaved changes</span>
        }
      </div>

      <!-- Action Bar -->
      <div class="action-bar">
        <button (click)="undoLastEdit()" [disabled]="!canUndo()" class="btn-secondary">
          ↩️ Undo
        </button>
        <button (click)="resetToOriginal()" class="btn-secondary">
          🔄 Reset
        </button>
        <div class="spacer"></div>
        <button (click)="saveChanges()" [disabled]="!hasUnsavedChanges()" class="btn-primary">
          💾 Save Changes
        </button>
        <button (click)="approveAsset()" [disabled]="asset()?.status === 'approved'" class="btn-success">
          ✅ Approve
        </button>
      </div>
    </div>
  `,
  styleUrl: './email-viewer.component.scss'
})
export class EmailViewerComponent {
  @Input() set emailAsset(value: EmailAsset | null) {
    this._asset.set(value);
    if (value) {
      this.editableHtml = value.html.fullHtml;
      this.originalHtml = value.html.fullHtml;
    }
  }
  @Output() assetUpdated = new EventEmitter<EmailAsset>();
  @Output() exportRequested = new EventEmitter<{ asset: EmailAsset; format: ExportFormat }>();

  private _asset = signal<EmailAsset | null>(null);
  asset = this._asset.asReadonly();

  // View state
  viewMode = signal<EmailViewMode>('preview');
  previewWidth = signal<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  // Edit state
  editableHtml = '';
  originalHtml = '';
  aiPrompt = '';
  preserveStructure = true;
  isAIEditing = signal(false);

  // Export
  selectedExportFormat: ExportFormat = 'html';

  constructor(
    private sanitizer: DomSanitizer,
    private emailService: EmailService
  ) {}

  // Computed values
  sanitizedHtml = computed(() => {
    return this.sanitizer.bypassSecurityTrustHtml(this.editableHtml);
  });

  previewWidthPx = computed(() => {
    const widths = { mobile: 375, tablet: 600, desktop: 800 };
    return widths[this.previewWidth()];
  });

  hasUnsavedChanges = computed(() => {
    return this.editableHtml !== this.originalHtml;
  });

  canUndo = computed(() => {
    const history = this._asset()?.meta?.editHistory;
    return history && history.length > 0;
  });

  // Methods
  setViewMode(mode: EmailViewMode) {
    this.viewMode.set(mode);
  }

  setPreviewWidth(width: 'mobile' | 'tablet' | 'desktop') {
    this.previewWidth.set(width);
  }

  onCodeChange(html: string) {
    this.editableHtml = html;
  }

  formatCode() {
    // Simple HTML formatting
    this.editableHtml = this.formatHtml(this.editableHtml);
  }

  copyCode() {
    navigator.clipboard.writeText(this.editableHtml);
  }

  async applyAIEdit() {
    if (!this._asset() || !this.aiPrompt.trim()) return;

    this.isAIEditing.set(true);
    try {
      const result = await this.emailService.aiEditEmail(
        this._asset()!._id,
        this.aiPrompt,
        this.preserveStructure
      ).toPromise();

      if (result?.modifiedHtml) {
        this.editableHtml = result.modifiedHtml;
        this.aiPrompt = '';
      }
    } catch (error) {
      console.error('AI edit failed:', error);
    } finally {
      this.isAIEditing.set(false);
    }
  }

  async saveChanges() {
    if (!this._asset()) return;

    try {
      const updated = await this.emailService.updateEmail(
        this._asset()!._id,
        this.editableHtml,
        'manual'
      ).toPromise();

      if (updated) {
        this._asset.set(updated);
        this.originalHtml = updated.html.fullHtml;
        this.assetUpdated.emit(updated);
      }
    } catch (error) {
      console.error('Save failed:', error);
    }
  }

  async undoLastEdit() {
    const asset = this._asset();
    if (!asset || !asset.meta.editHistory.length) return;

    const lastEdit = asset.meta.editHistory[asset.meta.editHistory.length - 1];
    this.editableHtml = lastEdit.previousHtml;
  }

  resetToOriginal() {
    this.editableHtml = this.originalHtml;
  }

  async approveAsset() {
    if (!this._asset()) return;

    try {
      const updated = await this.emailService.approveEmail(
        this._asset()!._id
      ).toPromise();

      if (updated) {
        this._asset.set(updated);
        this.assetUpdated.emit(updated);
      }
    } catch (error) {
      console.error('Approval failed:', error);
    }
  }

  exportAsset() {
    if (!this._asset()) return;
    this.exportRequested.emit({
      asset: this._asset()!,
      format: this.selectedExportFormat
    });
  }

  // Utilities
  formatEmailType(type: string | undefined): string {
    const labels: Record<string, string> = {
      promotional: 'Promotional',
      welcome: 'Welcome',
      abandoned_cart: 'Abandoned Cart',
      newsletter: 'Newsletter',
      announcement: 'Announcement'
    };
    return labels[type || ''] || type || '';
  }

  formatStrategy(strategy: string | undefined): string {
    const labels: Record<string, string> = {
      conversion: 'Conversion',
      awareness: 'Awareness',
      urgency: 'Urgency',
      emotional: 'Emotional'
    };
    return labels[strategy || ''] || strategy || '';
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatHtml(html: string): string {
    // Basic HTML formatting - in production, use a proper library
    let formatted = html;
    let indent = 0;
    const tab = '  ';
    
    formatted = formatted.replace(/>\s*</g, '>\n<');
    
    const lines = formatted.split('\n');
    const result: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      if (trimmed.startsWith('</')) indent--;
      result.push(tab.repeat(Math.max(0, indent)) + trimmed);
      if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>') && !trimmed.includes('</')) {
        indent++;
      }
    }
    
    return result.join('\n');
  }
}
```

### 7.2 Component Styles

**File:** `client/src/app/features/campaigns/components/email-viewer/email-viewer.component.scss`

```scss
.email-viewer-container {
  @apply flex flex-col h-full bg-bg-primary rounded-lg overflow-hidden;
}

// Header
.viewer-header {
  @apply flex items-center justify-between px-4 py-3 border-b border-border-color bg-bg-card;
}

.asset-info {
  @apply flex gap-2;
}

.badge {
  @apply px-2 py-1 rounded-full text-xs font-medium;
  
  &-segment { @apply bg-segment/20 text-segment; }
  &-type { @apply bg-channel/20 text-channel; }
  &-strategy { @apply bg-version/20 text-version; }
}

.view-controls {
  @apply flex gap-1;
}

.view-btn {
  @apply px-3 py-1.5 rounded text-sm text-text-secondary bg-transparent 
         hover:bg-bg-input transition-colors;
  
  &.active {
    @apply bg-accent-primary/20 text-accent-primary;
  }
  
  .icon { @apply mr-1; }
}

.export-controls {
  @apply flex gap-2;
}

.export-select {
  @apply px-3 py-1.5 rounded bg-bg-input text-text-primary text-sm 
         border border-border-color focus:outline-none focus:ring-1 focus:ring-accent-primary;
}

.btn-export {
  @apply px-4 py-1.5 rounded bg-accent-primary text-white text-sm font-medium
         hover:bg-accent-primary/90 transition-colors;
}

// Content Area
.viewer-content {
  @apply flex-1 flex overflow-hidden;
  
  &.mode-preview .preview-pane { @apply w-full; }
  &.mode-code .code-pane { @apply w-full; }
  &.mode-split {
    .preview-pane, .code-pane { @apply w-1/2; }
    .preview-pane { @apply border-r border-border-color; }
  }
}

// Preview Pane
.preview-pane {
  @apply flex flex-col bg-bg-secondary;
}

.preview-toolbar {
  @apply flex justify-center gap-2 py-2 border-b border-border-color bg-bg-card;
}

.width-btn {
  @apply p-2 rounded hover:bg-bg-input transition-colors;
  
  &.active {
    @apply bg-accent-primary/20;
  }
}

.preview-frame-container {
  @apply flex-1 mx-auto p-4 transition-all duration-300;
}

.preview-frame {
  @apply w-full h-full border-0 bg-white rounded shadow-lg;
  min-height: 500px;
}

// Code Pane
.code-pane {
  @apply flex flex-col;
}

.code-toolbar {
  @apply flex items-center gap-3 px-4 py-2 border-b border-border-color bg-bg-card;
}

.code-label {
  @apply text-sm text-text-secondary font-medium;
}

.toolbar-btn {
  @apply px-2 py-1 text-xs text-text-secondary hover:text-text-primary
         hover:bg-bg-input rounded transition-colors;
}

.code-editor {
  @apply flex-1 p-4 bg-bg-primary text-text-primary font-mono text-sm
         resize-none focus:outline-none;
  line-height: 1.5;
}

// AI Edit Panel
.ai-edit-panel {
  @apply border-t border-border-color bg-bg-card;
}

.ai-edit-header {
  @apply flex items-center gap-2 px-4 py-2 border-b border-border-color;
  
  .ai-icon { @apply text-lg; }
  span { @apply text-sm font-medium text-text-primary; }
}

.ai-edit-content {
  @apply p-4;
}

.ai-prompt-input {
  @apply w-full px-3 py-2 rounded bg-bg-input text-text-primary text-sm
         border border-border-color resize-none
         focus:outline-none focus:ring-1 focus:ring-accent-primary;
}

.ai-edit-options {
  @apply flex items-center gap-4 mt-2;
}

.checkbox-label {
  @apply flex items-center gap-2 text-sm text-text-secondary cursor-pointer;
  
  input {
    @apply rounded border-border-color text-accent-primary focus:ring-accent-primary;
  }
}

.btn-ai-edit {
  @apply mt-3 w-full px-4 py-2 rounded bg-purple-600 text-white text-sm font-medium
         hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
         transition-colors flex items-center justify-center gap-2;
}

.spinner {
  @apply w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin;
}

// Status Bar
.status-bar {
  @apply flex items-center gap-4 px-4 py-2 border-t border-border-color 
         bg-bg-card text-xs text-text-muted;
}

.status-item {
  strong {
    &.status-pending { @apply text-yellow-400; }
    &.status-generated { @apply text-blue-400; }
    &.status-edited { @apply text-purple-400; }
    &.status-approved { @apply text-green-400; }
  }
}

.status-unsaved {
  @apply text-yellow-400;
}

// Action Bar
.action-bar {
  @apply flex items-center gap-2 px-4 py-3 border-t border-border-color bg-bg-card;
}

.spacer { @apply flex-1; }

.btn-secondary {
  @apply px-4 py-2 rounded bg-bg-input text-text-secondary text-sm
         hover:bg-border-color disabled:opacity-50 transition-colors;
}

.btn-primary {
  @apply px-4 py-2 rounded bg-accent-primary text-white text-sm font-medium
         hover:bg-accent-primary/90 disabled:opacity-50 transition-colors;
}

.btn-success {
  @apply px-4 py-2 rounded bg-green-600 text-white text-sm font-medium
         hover:bg-green-700 disabled:opacity-50 transition-colors;
}
```

### 7.3 Email Service (Frontend)

**File:** `client/src/app/features/campaigns/services/email.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { EmailAsset, ExportFormat, GenerateEmailsResponse, AIEditResponse } from '../models/email.types';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/emails`;

  /**
   * Generate HTML email assets for a campaign
   */
  generateEmails(campaignId: string, templateId = 'minimal', regenerate = false): Observable<GenerateEmailsResponse> {
    return this.http.post<{ success: boolean; data: GenerateEmailsResponse }>(
      `${this.baseUrl}/generate`,
      { campaignId, templateId, regenerate }
    ).pipe(map(res => res.data));
  }

  /**
   * Get all email assets for a campaign
   */
  getEmailsByCampaign(campaignId: string): Observable<EmailAsset[]> {
    return this.http.get<{ success: boolean; data: EmailAsset[] }>(
      `${this.baseUrl}/campaign/${campaignId}`
    ).pipe(map(res => res.data));
  }

  /**
   * Get single email asset
   */
  getEmail(assetId: string): Observable<EmailAsset> {
    return this.http.get<{ success: boolean; data: EmailAsset }>(
      `${this.baseUrl}/${assetId}`
    ).pipe(map(res => res.data));
  }

  /**
   * Update email HTML
   */
  updateEmail(assetId: string, html: string, editType: 'manual' | 'ai_assisted', prompt?: string): Observable<EmailAsset> {
    return this.http.put<{ success: boolean; data: { emailAsset: EmailAsset } }>(
      `${this.baseUrl}/${assetId}`,
      { html, editType, prompt }
    ).pipe(map(res => res.data.emailAsset));
  }

  /**
   * AI-assisted email editing
   */
  aiEditEmail(assetId: string, prompt: string, preserveStructure = true): Observable<AIEditResponse> {
    return this.http.post<{ success: boolean; data: AIEditResponse }>(
      `${this.baseUrl}/${assetId}/ai-edit`,
      { prompt, preserveStructure }
    ).pipe(map(res => res.data));
  }

  /**
   * Approve email asset
   */
  approveEmail(assetId: string): Observable<EmailAsset> {
    return this.http.patch<{ success: boolean; data: EmailAsset }>(
      `${this.baseUrl}/${assetId}/approve`,
      {}
    ).pipe(map(res => res.data));
  }

  /**
   * Export single email
   */
  exportEmail(assetId: string, format: ExportFormat): Observable<{ content: string; filename: string; mimeType: string }> {
    return this.http.get<{ success: boolean; data: any }>(
      `${this.baseUrl}/${assetId}/export`,
      { params: { format, download: 'false' } }
    ).pipe(map(res => res.data));
  }

  /**
   * Download single email as file
   */
  downloadEmail(assetId: string, format: ExportFormat): void {
    window.open(`${this.baseUrl}/${assetId}/export?format=${format}&download=true`, '_blank');
  }

  /**
   * Bulk export emails as ZIP
   */
  bulkExportEmails(assetIds: string[], format: ExportFormat, organizationStrategy = 'by_audience'): void {
    // POST to bulk export endpoint and handle file download
    this.http.post(
      `${this.baseUrl}/export/bulk`,
      { assetIds, format, organizationStrategy },
      { responseType: 'blob' }
    ).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fractal-emails-export.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
```

---

## 8. Development Guide

### 8.1 Implementation Order

Follow this sequence for Claude Code implementation:

```
Phase 1: Backend Foundation
├── 1.1 Update constants.ts with new types
├── 1.2 Create EmailAsset model
├── 1.3 Create email.routes.ts
└── 1.4 Create basic email.controller.ts

Phase 2: Email Generation Engine
├── 2.1 Create email-template.engine.ts
├── 2.2 Implement template HTML (minimal first)
├── 2.3 Create css-inliner.ts utility
├── 2.4 Create html-to-text.ts utility
└── 2.5 Create email.service.ts

Phase 3: API Endpoints
├── 3.1 Implement generateEmails endpoint
├── 3.2 Implement getEmailAssets endpoints
├── 3.3 Implement exportEmail endpoint
├── 3.4 Implement updateEmail endpoint
└── 3.5 Implement aiEditEmail endpoint

Phase 4: Frontend Components
├── 4.1 Create email.types.ts models
├── 4.2 Create email.service.ts (Angular)
├── 4.3 Create email-viewer.component.ts
├── 4.4 Create email-viewer.component.scss
└── 4.5 Integrate into campaign detail view

Phase 5: Integration & Polish
├── 5.1 Connect to existing email-builder workflow
├── 5.2 Add bulk export functionality
├── 5.3 Implement undo/reset features
└── 5.4 Add loading states and error handling
```

### 8.2 Dependencies to Install

**Backend:**
```bash
cd server
npm install juice html-to-text archiver
npm install -D @types/archiver
```

**Frontend:**
```bash
cd client
# No additional dependencies required - using Angular built-ins
```

### 8.3 Integration Points

1. **Email Builder Service** - Connect `emailService.generateEmailAssets()` to existing generated content
2. **Campaign Detail View** - Add email viewer tab/section
3. **Export Flow** - Wire up download triggers
4. **Navigation** - Add routes if creating dedicated email view pages

### 8.4 Environment Variables

No new environment variables required. Uses existing:
- `ANTHROPIC_API_KEY` - For AI editing
- `CLAUDE_MODEL` - Model selection

---

## 9. Testing Requirements

### 9.1 Unit Tests

```typescript
// server/src/services/__tests__/email.service.test.ts
describe('EmailService', () => {
  describe('generateEmailAssets', () => {
    it('should generate HTML for all campaign segments');
    it('should apply brand colors correctly');
    it('should inline CSS for email compatibility');
    it('should generate plain text version');
    it('should create Liquid template version');
  });

  describe('aiEditEmail', () => {
    it('should preserve structure when flag is true');
    it('should apply text changes correctly');
    it('should handle malformed responses gracefully');
  });
});

// server/src/services/__tests__/email-template.engine.test.ts
describe('EmailTemplateEngine', () => {
  it('should escape HTML in content');
  it('should calculate correct button text color');
  it('should handle missing logo gracefully');
  it('should format body copy with paragraphs');
});
```

### 9.2 Integration Tests

```typescript
// server/src/__tests__/email.api.test.ts
describe('Email API', () => {
  describe('POST /api/emails/generate', () => {
    it('should require authentication');
    it('should return 404 for invalid campaign');
    it('should generate correct number of assets');
  });

  describe('GET /api/emails/:id/export', () => {
    it('should return HTML format');
    it('should return Liquid format');
    it('should trigger file download when requested');
  });
});
```

### 9.3 E2E Tests

- Complete flow: Campaign creation → Generate → View → Edit → Export
- AI editing workflow
- Bulk export functionality

---

## 10. Appendix: Email Best Practices

### 10.1 Client Compatibility

The generated HTML follows these practices for maximum email client support:

| Practice | Reason |
|----------|--------|
| Table-based layout | Outlook and older clients don't support CSS grid/flexbox |
| Inline CSS | Many clients strip `<style>` tags |
| MSO conditionals | Microsoft Office/Outlook specific fixes |
| System font stack | Consistent rendering without web fonts |
| Max width 600px | Mobile-first, fits most email clients |

### 10.2 Character Limits (Email Specs)

| Element | Limit | Reason |
|---------|-------|--------|
| Subject Line | 60 chars | Mobile truncation |
| Preheader | 90 chars | Preview text limit |
| Headline | 80 chars | Above-fold visibility |
| CTA Text | 25 chars | Button sizing |
| Body Copy | 150-200 words | Engagement sweet spot |

### 10.3 Image Placeholders

Since Fractal MVP doesn't generate images, templates use clearly marked placeholder blocks:

```html
<!-- IMAGE PLACEHOLDER: 600x300px -->
<td style="background-color: #e8e8ed; height: 300px;">
  <p>Hero Image (600×300)</p>
  <p>Replace with your image</p>
</td>
```

Users can:
1. Replace placeholder HTML with actual `<img>` tags
2. Upload images to their ESP and update src URLs
3. Remove placeholder blocks if not needed

### 10.4 Liquid Template Variables

Exported Liquid templates use these standard variables:

```liquid
{{ email.subject_line }}
{{ email.preheader }}
{{ email.headline }}
{{ email.body_copy }}
{{ email.cta_text }}
{{ email.cta_url }}

{{ brand.company_name }}
{{ brand.logo_url }}

{{ recipient.first_name }}
{{ recipient.email }}
```

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2025 | Initial specification |

---

*This document is designed to be used as a context file for Claude Code implementation. Copy the entire document to your project and reference it during development.*

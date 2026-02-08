# Claude Code Implementation Prompt: Campaign Asset Generation & Storage

## Overview

Implement a complete end-to-end flow for generating AI marketing content via Claude API and storing it in MongoDB. This includes backend services, API endpoints, and frontend components that display generated assets organized hierarchically under each campaign.

**Key Principle:** Every API call to Claude must result in a properly stored MongoDB document that the frontend can retrieve and display.

---

## Part 1: Backend Implementation

### 1.1 Update Constants

**File:** `server/src/config/constants.ts`

Add these new constants to support generation tracking:

```typescript
// Add to existing constants.ts

export const GENERATION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type GenerationStatus = typeof GENERATION_STATUS[keyof typeof GENERATION_STATUS];

// API Call tracking for debugging
export const API_CALL_TYPES = {
  EMAIL_GENERATION: 'email_generation',
  META_AD_GENERATION: 'meta_ad_generation',
  REGENERATION: 'regeneration',
} as const;
```

---

### 1.2 Generation Service

**File:** `server/src/services/generation.service.ts`

This is the core orchestration service. Each function is documented with its purpose.

```typescript
import Anthropic from '@anthropic-ai/sdk';
import mongoose from 'mongoose';
import Asset from '../models/Asset';
import Audience from '../models/Audience';
import Campaign from '../models/Campaign';
import BrandGuide from '../models/BrandGuide';
import { 
  ASSET_STATUS, 
  CHANNEL_TYPES, 
  ASSET_TYPES, 
  VERSION_STRATEGIES 
} from '../config/constants';

// ============================================
// INITIALIZE CLAUDE API CLIENT
// ============================================
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface EmailContent {
  subjectLine: string;
  preheader: string;
  headline: string;
  bodyCopy: string;
  ctaText: string;
}

interface MetaAdContent {
  primaryText: string;
  headline: string;
  description: string;
  ctaButton: string;
}

interface GenerationResult {
  success: boolean;
  assets: any[];
  totalGenerated: number;
  totalFailed: number;
  errors: string[];
  generationTime: number;
}

interface ApiCallLog {
  segment: string;
  channel: string;
  strategy: string;
  status: 'success' | 'failed';
  duration: number;
  error?: string;
}

// ============================================
// PROMPT BUILDERS
// ============================================

/**
 * Builds a prompt for email content generation
 * Embeds all campaign context directly into the prompt
 */
function buildEmailPrompt(
  brandGuide: any,
  campaign: any,
  audience: any,
  strategy: string
): string {
  return `You are an expert marketing copywriter creating email content.

BRAND CONTEXT:
- Brand Name: ${brandGuide.name}
- Brand Colors: ${brandGuide.colors?.join(', ') || 'Not specified'}
- Brand Tone: ${brandGuide.tone || 'Professional, friendly'}
- Core Message: ${brandGuide.coreMessage || 'Not specified'}

CAMPAIGN DETAILS:
- Campaign Name: ${campaign.name}
- Objective: ${campaign.objective || 'Drive engagement'}
- Key Messages: ${campaign.keyMessages?.join(', ') || 'Not specified'}
- Call to Action: ${campaign.callToAction || 'Learn More'}
- Urgency Level: ${campaign.urgencyLevel || 'medium'}

TARGET AUDIENCE:
- Segment: ${audience.name}
- Description: ${audience.description || 'Not specified'}
- Demographics: ${audience.demographics?.income || ''} ${audience.demographics?.location?.join(', ') || ''}
- Propensity Level: ${audience.propensityLevel || 'Medium'}
- Pain Points: ${audience.painPoints?.join(', ') || 'Not specified'}
- Key Motivators: ${audience.keyMotivators?.join(', ') || 'Not specified'}
- Preferred Tone: ${audience.preferredTone || 'Match brand voice'}

VERSION STRATEGY: ${strategy.toUpperCase()}
${strategy === 'conversion' ? '- Focus on driving immediate action with clear benefits and strong CTA' : ''}
${strategy === 'awareness' ? '- Focus on brand storytelling and education' : ''}
${strategy === 'urgency' ? '- Emphasize limited time, scarcity, or deadlines' : ''}
${strategy === 'emotional' ? '- Connect through values, lifestyle, and emotional resonance' : ''}

Generate email content with the following constraints:
1. Subject Line: Max 60 characters, optimize for open rates
2. Preheader: Max 90 characters, complement the subject line
3. Headline: Max 80 characters, capture attention
4. Body Copy: 150-200 words, compelling and on-brand
5. CTA Button Text: Max 25 characters

Respond ONLY with a valid JSON object in this exact format:
{
  "subjectLine": "Your subject line here",
  "preheader": "Your preheader text here",
  "headline": "Your headline here",
  "bodyCopy": "Your body copy here",
  "ctaText": "Your CTA text here"
}`;
}

/**
 * Builds a prompt for Meta ad content generation
 */
function buildMetaAdPrompt(
  brandGuide: any,
  campaign: any,
  audience: any,
  strategy: string
): string {
  return `You are an expert digital marketer creating Meta (Facebook/Instagram) ad content.

BRAND CONTEXT:
- Brand Name: ${brandGuide.name}
- Brand Colors: ${brandGuide.colors?.join(', ') || 'Not specified'}
- Brand Tone: ${brandGuide.tone || 'Professional, friendly'}
- Core Message: ${brandGuide.coreMessage || 'Not specified'}

CAMPAIGN DETAILS:
- Campaign Name: ${campaign.name}
- Objective: ${campaign.objective || 'Drive engagement'}
- Key Messages: ${campaign.keyMessages?.join(', ') || 'Not specified'}
- Call to Action: ${campaign.callToAction || 'Learn More'}

TARGET AUDIENCE:
- Segment: ${audience.name}
- Description: ${audience.description || 'Not specified'}
- Propensity Level: ${audience.propensityLevel || 'Medium'}
- Pain Points: ${audience.painPoints?.join(', ') || 'Not specified'}
- Key Motivators: ${audience.keyMotivators?.join(', ') || 'Not specified'}

VERSION STRATEGY: ${strategy.toUpperCase()}
${strategy === 'conversion' ? '- Focus on driving immediate action with clear benefits' : ''}
${strategy === 'awareness' ? '- Focus on brand storytelling and stopping the scroll' : ''}
${strategy === 'urgency' ? '- Emphasize limited time offers or scarcity' : ''}
${strategy === 'emotional' ? '- Connect through values and emotional resonance' : ''}

Generate Meta ad content with the following constraints (per Meta's ad specs):
1. Primary Text: Max 125 characters for optimal display (can be up to 500)
2. Headline: Max 40 characters
3. Description: Max 125 characters
4. CTA Button: Choose from: Shop Now, Learn More, Sign Up, Book Now, Contact Us, Get Offer, Get Quote, Subscribe, Apply Now, Download

Respond ONLY with a valid JSON object in this exact format:
{
  "primaryText": "Your primary text here",
  "headline": "Your headline here",
  "description": "Your description here",
  "ctaButton": "Learn More"
}`;
}

// ============================================
// CLAUDE API CALLER
// ============================================

/**
 * Makes a single call to Claude API and parses the JSON response
 * Includes error handling and response validation
 */
async function callClaudeAPI(prompt: string): Promise<any> {
  const startTime = Date.now();
  
  try {
    // Make the API call
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text from response
    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Claude response');
    }

    const content = JSON.parse(jsonMatch[0]);
    
    console.log(`[Claude API] Success - ${Date.now() - startTime}ms`);
    return content;

  } catch (error: any) {
    console.error(`[Claude API] Error - ${Date.now() - startTime}ms:`, error.message);
    throw new Error(`Claude API call failed: ${error.message}`);
  }
}

// ============================================
// MAIN GENERATION ORCHESTRATOR
// ============================================

/**
 * MAIN FUNCTION: Generates all assets for a campaign
 * 
 * Flow:
 * 1. Load brand guide and validate campaign
 * 2. For each segment × channel × strategy combination:
 *    a. Build context-aware prompt
 *    b. Call Claude API
 *    c. Parse response
 *    d. Create and save Asset document to MongoDB
 * 3. Return all generated assets
 */
export async function generateCampaignAssets(
  campaignId: string,
  userId: string
): Promise<GenerationResult> {
  const startTime = Date.now();
  const assets: any[] = [];
  const errors: string[] = [];
  const apiCallLogs: ApiCallLog[] = [];

  try {
    // ========== STEP 1: LOAD REQUIRED DATA ==========
    
    // Load campaign with validation
    const campaign = await Campaign.findOne({ 
      _id: campaignId, 
      userId: new mongoose.Types.ObjectId(userId) 
    });
    
    if (!campaign) {
      throw new Error('Campaign not found or access denied');
    }

    // Load brand guide
    const brandGuide = await BrandGuide.findOne({ 
      userId: new mongoose.Types.ObjectId(userId) 
    });
    
    if (!brandGuide) {
      throw new Error('Brand guide not found. Please create a brand guide first.');
    }

    // Get enabled channels
    const enabledChannels = campaign.channels.filter((c: any) => c.enabled);
    if (enabledChannels.length === 0) {
      throw new Error('No channels enabled for this campaign');
    }

    // Define version strategies to generate
    const strategies = [VERSION_STRATEGIES.CONVERSION, VERSION_STRATEGIES.AWARENESS];

    // ========== STEP 2: DELETE EXISTING ASSETS (for regeneration) ==========
    await Asset.deleteMany({ campaignId: campaign._id });

    // ========== STEP 3: GENERATE FOR EACH COMBINATION ==========
    
    for (const segment of campaign.segments) {
      // Load full audience data
      const audience = await Audience.findById(segment.audienceId);
      if (!audience) {
        errors.push(`Audience not found: ${segment.audienceId}`);
        continue;
      }

      for (const channel of enabledChannels) {
        // Determine asset type based on channel
        const assetType = channel.type === CHANNEL_TYPES.EMAIL 
          ? ASSET_TYPES.HERO_EMAIL 
          : ASSET_TYPES.SINGLE_IMAGE_AD;

        // Create asset document (will hold multiple versions)
        const asset = new Asset({
          campaignId: campaign._id,
          audienceId: audience._id,
          channelType: channel.type,
          assetType: assetType,
          name: `${audience.name} - ${channel.type === CHANNEL_TYPES.EMAIL ? 'Email' : 'Meta Ad'}`,
          versions: [],
          generationPrompt: '', // Will store the last prompt used
        });

        // Generate each version strategy
        for (const strategy of strategies) {
          const callStartTime = Date.now();
          
          try {
            // Build the appropriate prompt
            const prompt = channel.type === CHANNEL_TYPES.EMAIL
              ? buildEmailPrompt(brandGuide, campaign, audience, strategy)
              : buildMetaAdPrompt(brandGuide, campaign, audience, strategy);

            // Call Claude API
            const content = await callClaudeAPI(prompt);

            // Add version to asset
            asset.versions.push({
              versionName: `${strategy.charAt(0).toUpperCase() + strategy.slice(1)} Focus`,
              strategy: strategy,
              content: content,
              status: ASSET_STATUS.GENERATED,
              generatedAt: new Date(),
            });

            // Store prompt for debugging/regeneration
            asset.generationPrompt = prompt;

            // Log successful call
            apiCallLogs.push({
              segment: audience.name,
              channel: channel.type,
              strategy: strategy,
              status: 'success',
              duration: Date.now() - callStartTime,
            });

          } catch (error: any) {
            // Log failed call but continue with other versions
            errors.push(`Failed: ${audience.name} / ${channel.type} / ${strategy}: ${error.message}`);
            apiCallLogs.push({
              segment: audience.name,
              channel: channel.type,
              strategy: strategy,
              status: 'failed',
              duration: Date.now() - callStartTime,
              error: error.message,
            });
          }
        }

        // ========== STEP 4: SAVE TO MONGODB ==========
        // Only save if at least one version was generated successfully
        if (asset.versions.length > 0) {
          await asset.save();
          assets.push(asset);
          console.log(`[MongoDB] Saved asset: ${asset.name} with ${asset.versions.length} versions`);
        }
      }
    }

    // ========== STEP 5: UPDATE CAMPAIGN STATUS ==========
    if (assets.length > 0) {
      campaign.status = 'generated';
      await campaign.save();
    }

    // ========== STEP 6: RETURN RESULTS ==========
    const totalCalls = apiCallLogs.length;
    const successfulCalls = apiCallLogs.filter(l => l.status === 'success').length;

    console.log(`[Generation Complete] ${successfulCalls}/${totalCalls} API calls successful`);
    console.log(`[Generation Complete] ${assets.length} assets saved to MongoDB`);

    return {
      success: true,
      assets: assets,
      totalGenerated: successfulCalls,
      totalFailed: totalCalls - successfulCalls,
      errors: errors,
      generationTime: Date.now() - startTime,
    };

  } catch (error: any) {
    console.error('[Generation Failed]', error.message);
    return {
      success: false,
      assets: [],
      totalGenerated: 0,
      totalFailed: 0,
      errors: [error.message],
      generationTime: Date.now() - startTime,
    };
  }
}

// ============================================
// SINGLE ASSET REGENERATION
// ============================================

/**
 * Regenerate a single asset version with optional custom instructions
 */
export async function regenerateAssetVersion(
  assetId: string,
  versionId: string,
  userId: string,
  customInstructions?: string
): Promise<any> {
  // Load asset and verify ownership through campaign
  const asset = await Asset.findById(assetId);
  if (!asset) {
    throw new Error('Asset not found');
  }

  const campaign = await Campaign.findOne({ 
    _id: asset.campaignId, 
    userId: new mongoose.Types.ObjectId(userId) 
  });
  
  if (!campaign) {
    throw new Error('Access denied');
  }

  // Find the version to regenerate
  const versionIndex = asset.versions.findIndex(
    (v: any) => v._id.toString() === versionId
  );
  
  if (versionIndex === -1) {
    throw new Error('Version not found');
  }

  const version = asset.versions[versionIndex];
  
  // Load brand guide and audience
  const brandGuide = await BrandGuide.findOne({ userId: new mongoose.Types.ObjectId(userId) });
  const audience = await Audience.findById(asset.audienceId);

  if (!brandGuide || !audience) {
    throw new Error('Required data not found');
  }

  // Build prompt (optionally with custom instructions)
  let prompt = asset.channelType === CHANNEL_TYPES.EMAIL
    ? buildEmailPrompt(brandGuide, campaign, audience, version.strategy || 'conversion')
    : buildMetaAdPrompt(brandGuide, campaign, audience, version.strategy || 'conversion');

  if (customInstructions) {
    prompt += `\n\nADDITIONAL INSTRUCTIONS:\n${customInstructions}`;
  }

  // Call Claude API
  const content = await callClaudeAPI(prompt);

  // Update the version
  asset.versions[versionIndex] = {
    ...asset.versions[versionIndex],
    content: content,
    status: ASSET_STATUS.GENERATED,
    generatedAt: new Date(),
  };

  asset.generationPrompt = prompt;
  await asset.save();

  return asset;
}

export default {
  generateCampaignAssets,
  regenerateAssetVersion,
};
```

---

### 1.3 Generation Controller

**File:** `server/src/controllers/generation.controller.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { generateCampaignAssets, regenerateAssetVersion } from '../services/generation.service';

/**
 * POST /api/campaigns/:id/generate
 * Triggers AI content generation for a campaign
 */
export const generateCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const campaignId = req.params.id;
    const userId = req.user._id; // From auth middleware

    console.log(`[Generate] Starting generation for campaign: ${campaignId}`);

    const result = await generateCampaignAssets(campaignId, userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Generation failed',
        errors: result.errors,
      });
    }

    res.status(201).json({
      success: true,
      message: `Generated ${result.totalGenerated} content versions`,
      data: {
        assets: result.assets,
        stats: {
          totalGenerated: result.totalGenerated,
          totalFailed: result.totalFailed,
          generationTime: result.generationTime,
        },
        errors: result.errors,
      },
    });

  } catch (error: any) {
    console.error('[Generate Controller Error]', error);
    next(error);
  }
};

/**
 * POST /api/assets/:assetId/versions/:versionId/regenerate
 * Regenerates a single version with optional custom instructions
 */
export const regenerateVersion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { assetId, versionId } = req.params;
    const { customInstructions } = req.body;
    const userId = req.user._id;

    const asset = await regenerateAssetVersion(
      assetId,
      versionId,
      userId,
      customInstructions
    );

    res.json({
      success: true,
      message: 'Version regenerated successfully',
      data: { asset },
    });

  } catch (error: any) {
    next(error);
  }
};
```

---

### 1.4 Update Routes

**File:** `server/src/routes/campaign.routes.ts`

Add the generation endpoint:

```typescript
import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { generateCampaign } from '../controllers/generation.controller';
// ... other imports

const router = Router();

// ... existing routes

// Generation endpoint
router.post('/:id/generate', protect, generateCampaign);

export default router;
```

**File:** `server/src/routes/asset.routes.ts`

Add the regeneration endpoint:

```typescript
import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { regenerateVersion } from '../controllers/generation.controller';

const router = Router();

// Regenerate a specific version
router.post('/:assetId/versions/:versionId/regenerate', protect, regenerateVersion);

export default router;
```

---

## Part 2: Frontend Implementation

### 2.1 Update Campaign Service

**File:** `client/src/app/core/services/campaign.service.ts`

Add generation methods to the existing service:

```typescript
// Add these methods to the existing CampaignService class

/**
 * Trigger AI content generation for a campaign
 */
generateCampaignAssets(campaignId: string): Observable<GenerationResponse> {
  this.generatingSignal.set(true);
  
  return this.http.post<GenerationResponse>(
    `${environment.apiUrl}/campaigns/${campaignId}/generate`,
    {}
  ).pipe(
    tap(response => {
      this.generatingSignal.set(false);
      console.log('[Generation Complete]', response);
    }),
    catchError(error => {
      this.generatingSignal.set(false);
      throw error;
    })
  );
}

/**
 * Regenerate a single asset version
 */
regenerateVersion(
  assetId: string, 
  versionId: string, 
  customInstructions?: string
): Observable<any> {
  return this.http.post(
    `${environment.apiUrl}/assets/${assetId}/versions/${versionId}/regenerate`,
    { customInstructions }
  );
}

// Add this interface at the top of the file
export interface GenerationResponse {
  success: boolean;
  message: string;
  data: {
    assets: Asset[];
    stats: {
      totalGenerated: number;
      totalFailed: number;
      generationTime: number;
    };
    errors: string[];
  };
}
```

---

### 2.2 Asset Card Component

**File:** `client/src/app/features/campaigns/components/asset-card.component.ts`

A reusable component to display each generated asset with its versions:

```typescript
import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface AssetVersion {
  _id: string;
  versionName: string;
  strategy: string;
  status: string;
  generatedAt: Date;
  content: {
    // Email fields
    subjectLine?: string;
    preheader?: string;
    headline?: string;
    bodyCopy?: string;
    ctaText?: string;
    // Meta Ad fields
    primaryText?: string;
    description?: string;
    ctaButton?: string;
  };
}

interface Asset {
  _id: string;
  name: string;
  channelType: 'email' | 'meta_ads';
  assetType: string;
  versions: AssetVersion[];
  audienceId: string;
  createdAt: Date;
}

@Component({
  selector: 'app-asset-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-bg-card rounded-xl border border-gray-800 overflow-hidden">
      
      <!-- Asset Header -->
      <div class="p-4 border-b border-gray-800">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <!-- Channel Icon -->
            <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                 [class]="asset.channelType === 'email' 
                   ? 'bg-blue-500/15 text-blue-400' 
                   : 'bg-purple-500/15 text-purple-400'">
              <span class="text-xl">{{ asset.channelType === 'email' ? '📧' : '📱' }}</span>
            </div>
            
            <!-- Asset Info -->
            <div>
              <h3 class="font-semibold text-text-primary">{{ asset.name }}</h3>
              <div class="flex items-center gap-2 text-xs text-text-muted">
                <span class="px-2 py-0.5 rounded-full"
                      [class]="asset.channelType === 'email' 
                        ? 'bg-blue-500/10 text-blue-400' 
                        : 'bg-purple-500/10 text-purple-400'">
                  {{ asset.channelType === 'email' ? 'Email' : 'Meta Ad' }}
                </span>
                <span>•</span>
                <span>{{ asset.versions.length }} versions</span>
              </div>
            </div>
          </div>
          
          <!-- Expand/Collapse Toggle -->
          <button 
            (click)="expanded.set(!expanded())"
            class="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <span class="text-text-muted">{{ expanded() ? '▼' : '▶' }}</span>
          </button>
        </div>
      </div>

      <!-- Versions (Collapsible) -->
      @if (expanded()) {
        <div class="divide-y divide-gray-800">
          @for (version of asset.versions; track version._id) {
            <div class="p-4 hover:bg-gray-800/50 transition-colors">
              
              <!-- Version Header -->
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-1 text-xs font-medium rounded"
                        [class]="getStrategyClass(version.strategy)">
                    {{ version.versionName }}
                  </span>
                  <span class="px-2 py-0.5 text-xs rounded-full"
                        [class]="getStatusClass(version.status)">
                    {{ version.status }}
                  </span>
                </div>
                
                <!-- Version Actions -->
                <div class="flex items-center gap-2">
                  <button 
                    (click)="onRegenerate.emit({ assetId: asset._id, versionId: version._id })"
                    class="text-xs text-text-muted hover:text-accent-primary transition-colors">
                    🔄 Regenerate
                  </button>
                  <button 
                    (click)="onEdit.emit({ assetId: asset._id, versionId: version._id })"
                    class="text-xs text-text-muted hover:text-accent-primary transition-colors">
                    ✏️ Edit
                  </button>
                </div>
              </div>

              <!-- Content Display -->
              @if (asset.channelType === 'email') {
                <!-- Email Content -->
                <div class="space-y-3 text-sm">
                  <div class="bg-gray-900/50 rounded-lg p-3">
                    <div class="text-xs text-text-muted mb-1">Subject Line</div>
                    <div class="text-text-primary font-medium">{{ version.content.subjectLine }}</div>
                  </div>
                  
                  <div class="bg-gray-900/50 rounded-lg p-3">
                    <div class="text-xs text-text-muted mb-1">Preheader</div>
                    <div class="text-text-secondary">{{ version.content.preheader }}</div>
                  </div>
                  
                  <div class="bg-gray-900/50 rounded-lg p-3">
                    <div class="text-xs text-text-muted mb-1">Headline</div>
                    <div class="text-text-primary text-lg font-semibold">{{ version.content.headline }}</div>
                  </div>
                  
                  <div class="bg-gray-900/50 rounded-lg p-3">
                    <div class="text-xs text-text-muted mb-1">Body Copy</div>
                    <div class="text-text-secondary whitespace-pre-wrap">{{ version.content.bodyCopy }}</div>
                  </div>
                  
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-text-muted">CTA:</span>
                    <span class="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium">
                      {{ version.content.ctaText }}
                    </span>
                  </div>
                </div>
              } @else {
                <!-- Meta Ad Content -->
                <div class="space-y-3 text-sm">
                  <div class="bg-gray-900/50 rounded-lg p-3">
                    <div class="text-xs text-text-muted mb-1">Primary Text</div>
                    <div class="text-text-primary">{{ version.content.primaryText }}</div>
                  </div>
                  
                  <div class="bg-gray-900/50 rounded-lg p-3">
                    <div class="text-xs text-text-muted mb-1">Headline</div>
                    <div class="text-text-primary font-semibold">{{ version.content.headline }}</div>
                  </div>
                  
                  <div class="bg-gray-900/50 rounded-lg p-3">
                    <div class="text-xs text-text-muted mb-1">Description</div>
                    <div class="text-text-secondary">{{ version.content.description }}</div>
                  </div>
                  
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-text-muted">CTA Button:</span>
                    <span class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                      {{ version.content.ctaButton }}
                    </span>
                  </div>
                </div>
              }
              
              <!-- Timestamp -->
              <div class="mt-3 text-xs text-text-muted">
                Generated {{ version.generatedAt | date:'medium' }}
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AssetCardComponent {
  @Input({ required: true }) asset!: Asset;
  @Output() onRegenerate = new EventEmitter<{ assetId: string; versionId: string }>();
  @Output() onEdit = new EventEmitter<{ assetId: string; versionId: string }>();

  expanded = signal(true); // Start expanded to show content

  getStrategyClass(strategy: string): string {
    const classes: Record<string, string> = {
      conversion: 'bg-green-500/15 text-green-400',
      awareness: 'bg-blue-500/15 text-blue-400',
      urgency: 'bg-orange-500/15 text-orange-400',
      emotional: 'bg-pink-500/15 text-pink-400',
    };
    return classes[strategy] || 'bg-gray-500/15 text-gray-400';
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      generated: 'bg-emerald-500/15 text-emerald-400',
      edited: 'bg-amber-500/15 text-amber-400',
      approved: 'bg-blue-500/15 text-blue-400',
      pending: 'bg-gray-500/15 text-gray-400',
    };
    return classes[status] || 'bg-gray-500/15 text-gray-400';
  }
}
```

---

### 2.3 Assets Grid Component

**File:** `client/src/app/features/campaigns/components/assets-grid.component.ts`

Organizes assets by audience segment for clear hierarchy:

```typescript
import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetCardComponent } from './asset-card.component';

@Component({
  selector: 'app-assets-grid',
  standalone: true,
  imports: [CommonModule, AssetCardComponent],
  template: `
    <div class="space-y-8">
      
      <!-- Generation Stats Banner -->
      @if (showStats()) {
        <div class="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-xl p-4 border border-purple-500/30">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-6">
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-400">{{ assets.length }}</div>
                <div class="text-xs text-text-muted">Assets</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-400">{{ totalVersions() }}</div>
                <div class="text-xs text-text-muted">Versions</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-400">{{ uniqueSegments().length }}</div>
                <div class="text-xs text-text-muted">Segments</div>
              </div>
            </div>
            
            <!-- Filter Buttons -->
            <div class="flex gap-2">
              <button 
                (click)="filterChannel.set('all')"
                [class]="filterChannel() === 'all' ? 'btn-filter-active' : 'btn-filter'"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all">
                All
              </button>
              <button 
                (click)="filterChannel.set('email')"
                [class]="filterChannel() === 'email' ? 'btn-filter-active' : 'btn-filter'"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all">
                📧 Email
              </button>
              <button 
                (click)="filterChannel.set('meta_ads')"
                [class]="filterChannel() === 'meta_ads' ? 'btn-filter-active' : 'btn-filter'"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all">
                📱 Meta Ads
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Empty State -->
      @if (filteredAssets().length === 0) {
        <div class="text-center py-16">
          <div class="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-4xl">🤖</span>
          </div>
          <h3 class="text-xl font-semibold text-text-primary mb-2">No assets generated yet</h3>
          <p class="text-text-secondary mb-6">
            Click "Generate Content" to create AI-powered marketing assets for all your segments and channels.
          </p>
        </div>
      } @else {
        
        <!-- Assets Grouped by Segment -->
        @for (segmentGroup of groupedBySegment(); track segmentGroup.segmentName) {
          <div class="space-y-4">
            
            <!-- Segment Header -->
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-segment/15 flex items-center justify-center">
                <span class="text-segment text-sm">👥</span>
              </div>
              <div>
                <h3 class="font-semibold text-text-primary">{{ segmentGroup.segmentName }}</h3>
                <p class="text-xs text-text-muted">
                  {{ segmentGroup.assets.length }} assets • {{ getVersionCount(segmentGroup.assets) }} versions
                </p>
              </div>
            </div>

            <!-- Assets for this Segment -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-11">
              @for (asset of segmentGroup.assets; track asset._id) {
                <app-asset-card 
                  [asset]="asset"
                  (onRegenerate)="handleRegenerate($event)"
                  (onEdit)="handleEdit($event)">
                </app-asset-card>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .btn-filter {
      @apply bg-gray-800 text-text-muted hover:bg-gray-700;
    }
    .btn-filter-active {
      @apply bg-accent-primary text-white;
    }
  `]
})
export class AssetsGridComponent {
  @Input({ required: true }) assets: any[] = [];
  @Input() audienceMap: Map<string, string> = new Map(); // audienceId -> audienceName
  @Input() showStats = signal(true);
  
  @Output() onRegenerate = new EventEmitter<{ assetId: string; versionId: string }>();
  @Output() onEdit = new EventEmitter<{ assetId: string; versionId: string }>();

  filterChannel = signal<'all' | 'email' | 'meta_ads'>('all');

  // Computed: filter assets by channel
  filteredAssets = computed(() => {
    if (this.filterChannel() === 'all') {
      return this.assets;
    }
    return this.assets.filter(a => a.channelType === this.filterChannel());
  });

  // Computed: group assets by segment
  groupedBySegment = computed(() => {
    const groups: { segmentName: string; assets: any[] }[] = [];
    const segmentMap = new Map<string, any[]>();

    for (const asset of this.filteredAssets()) {
      const segmentName = this.audienceMap.get(asset.audienceId) || 'Unknown Segment';
      
      if (!segmentMap.has(segmentName)) {
        segmentMap.set(segmentName, []);
      }
      segmentMap.get(segmentName)!.push(asset);
    }

    segmentMap.forEach((assets, segmentName) => {
      groups.push({ segmentName, assets });
    });

    return groups;
  });

  // Computed: total versions across all assets
  totalVersions = computed(() => {
    return this.assets.reduce((sum, asset) => sum + asset.versions.length, 0);
  });

  // Computed: unique segments
  uniqueSegments = computed(() => {
    return [...new Set(this.assets.map(a => a.audienceId))];
  });

  getVersionCount(assets: any[]): number {
    return assets.reduce((sum, asset) => sum + asset.versions.length, 0);
  }

  handleRegenerate(event: { assetId: string; versionId: string }) {
    this.onRegenerate.emit(event);
  }

  handleEdit(event: { assetId: string; versionId: string }) {
    this.onEdit.emit(event);
  }
}
```

---

### 2.4 Update Campaign Detail Component

**File:** `client/src/app/features/campaigns/campaign-detail.component.ts`

Update the existing component to use the new assets grid:

```typescript
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { AssetsGridComponent } from './components/assets-grid.component';
import { CampaignService, Campaign, Asset, CampaignDetailResponse } from '../../core/services/campaign.service';
import { AudienceService } from '../../core/services/audience.service';

@Component({
  selector: 'app-campaign-detail',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    LayoutComponent, 
    LoadingComponent,
    AssetsGridComponent
  ],
  template: `
    <app-layout>
      <div class="p-8 max-w-7xl mx-auto">
        @if (campaignService.isLoading()) {
          <app-loading text="Loading campaign..."></app-loading>
        } @else if (campaign()) {
          
          <!-- Header -->
          <div class="mb-8">
            <a routerLink="/campaigns" class="text-sm text-text-muted hover:text-accent-primary mb-4 inline-block">
              ← Back to Campaigns
            </a>
            <div class="flex items-start justify-between">
              <div>
                <div class="flex items-center gap-3 mb-2">
                  <h1 class="text-2xl font-bold text-text-primary">{{ campaign()?.name }}</h1>
                  <span class="px-3 py-1 rounded-full text-xs font-medium" [class]="getStatusClass(campaign()?.status || '')">
                    {{ campaign()?.status }}
                  </span>
                </div>
                @if (campaign()?.objective) {
                  <p class="text-text-secondary">{{ campaign()?.objective }}</p>
                }
              </div>
              
              <!-- Action Buttons -->
              <div class="flex gap-3">
                <button 
                  (click)="generateAssets()" 
                  [disabled]="campaignService.isGenerating()" 
                  class="btn btn-primary">
                  @if (campaignService.isGenerating()) {
                    <span class="flex items-center gap-2">
                      <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Generating...
                    </span>
                  } @else {
                    🤖 {{ assets().length > 0 ? 'Regenerate' : 'Generate Content' }}
                  }
                </button>
                <button (click)="exportCampaign()" class="btn btn-secondary">📥 Export</button>
              </div>
            </div>
          </div>

          <!-- Generation Progress -->
          @if (campaignService.isGenerating()) {
            <div class="mb-8 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-xl p-6 border border-purple-500/30">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <div class="w-6 h-6 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
                </div>
                <div>
                  <h3 class="font-semibold text-text-primary">Generating AI Content...</h3>
                  <p class="text-sm text-text-secondary">
                    Creating personalized content for {{ campaign()?.segments?.length || 0 }} segments × 
                    {{ getEnabledChannelCount() }} channels
                  </p>
                </div>
              </div>
            </div>
          }

          <!-- Stats Cards -->
          <div class="grid grid-cols-4 gap-4 mb-8">
            <div class="stat-card">
              <div class="stat-value text-segment">{{ campaign()?.segments?.length || 0 }}</div>
              <div class="stat-label">Segments</div>
            </div>
            <div class="stat-card">
              <div class="stat-value text-channel">{{ getEnabledChannelCount() }}</div>
              <div class="stat-label">Channels</div>
            </div>
            <div class="stat-card">
              <div class="stat-value text-asset">{{ assets().length }}</div>
              <div class="stat-label">Assets</div>
            </div>
            <div class="stat-card">
              <div class="stat-value text-version">{{ getTotalVersions() }}</div>
              <div class="stat-label">Versions</div>
            </div>
          </div>

          <!-- Assets Grid -->
          <div class="card">
            <h2 class="text-lg font-semibold mb-6">Generated Assets</h2>
            <app-assets-grid
              [assets]="assets()"
              [audienceMap]="audienceMap()"
              (onRegenerate)="handleRegenerate($event)"
              (onEdit)="handleEdit($event)">
            </app-assets-grid>
          </div>
        }
      </div>
    </app-layout>
  `,
})
export class CampaignDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  campaignService = inject(CampaignService);
  private audienceService = inject(AudienceService);

  campaign = signal<Campaign | null>(null);
  assets = signal<Asset[]>([]);
  audienceMap = signal<Map<string, string>>(new Map());

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCampaign(id);
      this.loadAudiences();
    }
  }

  loadCampaign(id: string): void {
    this.campaignService.getCampaign(id).subscribe({
      next: (response: CampaignDetailResponse) => {
        this.campaign.set(response.data.campaign);
        this.assets.set(response.data.assets || []);
      },
    });
  }

  loadAudiences(): void {
    this.audienceService.getAudiences().subscribe({
      next: (audiences) => {
        const map = new Map<string, string>();
        audiences.forEach((a: any) => map.set(a._id, a.name));
        this.audienceMap.set(map);
      },
    });
  }

  generateAssets(): void {
    const id = this.campaign()?._id;
    if (!id) return;

    this.campaignService.generateCampaignAssets(id).subscribe({
      next: (response) => {
        // Reload campaign to get fresh assets
        this.loadCampaign(id);
      },
      error: (err) => {
        console.error('Generation failed:', err);
        // Show error toast/notification
      },
    });
  }

  handleRegenerate(event: { assetId: string; versionId: string }): void {
    this.campaignService.regenerateVersion(event.assetId, event.versionId).subscribe({
      next: () => {
        // Reload to show updated content
        const id = this.campaign()?._id;
        if (id) this.loadCampaign(id);
      },
    });
  }

  handleEdit(event: { assetId: string; versionId: string }): void {
    // TODO: Open edit modal
    console.log('Edit:', event);
  }

  getEnabledChannelCount(): number {
    return this.campaign()?.channels?.filter((c: any) => c.enabled).length || 0;
  }

  getTotalVersions(): number {
    return this.assets().reduce((sum, asset) => sum + asset.versions.length, 0);
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      draft: 'bg-gray-500/15 text-gray-400',
      generated: 'bg-emerald-500/15 text-emerald-400',
      approved: 'bg-blue-500/15 text-blue-400',
      archived: 'bg-amber-500/15 text-amber-400',
    };
    return classes[status] || classes.draft;
  }

  exportCampaign(): void {
    // TODO: Implement export
    console.log('Export campaign');
  }
}
```

---

## Part 3: Testing the Implementation

### 3.1 Test Generation Flow

1. Create a brand guide (if not exists)
2. Create at least one audience segment
3. Create a campaign with:
   - At least 1 segment selected
   - At least 1 channel enabled (email or meta_ads)
4. Click "Generate Content"
5. Verify:
   - Loading state appears
   - Assets are created in MongoDB
   - UI displays all generated content
   - Each asset has 2 versions (conversion + awareness)

### 3.2 Expected Database Structure

After generation, verify in MongoDB:

```javascript
// assets collection
{
  "_id": ObjectId("..."),
  "campaignId": ObjectId("..."),
  "audienceId": ObjectId("..."),
  "channelType": "email",
  "assetType": "hero_email",
  "name": "Loyal VIPs - Email",
  "versions": [
    {
      "_id": ObjectId("..."),
      "versionName": "Conversion Focus",
      "strategy": "conversion",
      "content": {
        "subjectLine": "Summer glow awaits ✨",
        "preheader": "VIP early access to our summer collection",
        "headline": "Your Exclusive Summer Preview",
        "bodyCopy": "As one of our most valued customers...",
        "ctaText": "Shop VIP Access"
      },
      "status": "generated",
      "generatedAt": ISODate("...")
    },
    {
      "_id": ObjectId("..."),
      "versionName": "Awareness Focus",
      "strategy": "awareness",
      "content": {
        "subjectLine": "The science behind summer skincare",
        "preheader": "Discover why dermatologists recommend...",
        "headline": "Summer Skin, Simplified",
        "bodyCopy": "We've spent 5 years perfecting...",
        "ctaText": "Learn More"
      },
      "status": "generated",
      "generatedAt": ISODate("...")
    }
  ],
  "generationPrompt": "You are an expert marketing copywriter...",
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

---

## Summary Checklist

### Backend
- [ ] Update `constants.ts` with new types
- [ ] Implement `generation.service.ts` with full orchestration
- [ ] Create `generation.controller.ts` endpoints
- [ ] Add routes to `campaign.routes.ts` and `asset.routes.ts`
- [ ] Test API endpoints with Postman/curl

### Frontend
- [ ] Update `campaign.service.ts` with generation methods
- [ ] Create `asset-card.component.ts` for individual assets
- [ ] Create `assets-grid.component.ts` for organized display
- [ ] Update `campaign-detail.component.ts` to use new components
- [ ] Test full UI flow

### Integration
- [ ] Verify MongoDB documents are created correctly
- [ ] Verify UI displays all versions with correct content
- [ ] Test regeneration of individual versions
- [ ] Test error handling (API failures, validation errors)

---

## Key Implementation Notes

1. **Always save to MongoDB after each API call** - Never lose generated content
2. **Store the prompt used** - Essential for debugging and regeneration
3. **Group by audience segment in UI** - Maintains the hierarchy mental model
4. **Show all version strategies** - User needs to compare conversion vs awareness
5. **Enable per-version regeneration** - Don't force regenerating everything
6. **Use Angular signals** - Reactive state management per your existing patterns
7. **Follow dark theme styling** - Consistent with existing UI
import Anthropic from '@anthropic-ai/sdk';
import { ICampaign, IBrandGuide, Asset, Audience } from '../models';
import { CHANNEL_TYPES, ASSET_TYPES, ASSET_STATUS, VERSION_STRATEGIES } from '../config/constants';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

// Interface for generated content
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

// Build email generation prompt
function buildEmailPrompt(
  brandGuide: IBrandGuide,
  campaign: ICampaign,
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
- Urgency Level: ${campaign.urgencyLevel}

TARGET AUDIENCE:
- Segment: ${audience.name}
- Description: ${audience.description || 'Not specified'}
- Demographics: ${audience.demographics?.income || ''} ${audience.demographics?.location?.join(', ') || ''}
- Propensity Level: ${audience.propensityLevel}
- Pain Points: ${audience.painPoints?.join(', ') || 'Not specified'}
- Key Motivators: ${audience.keyMotivators?.join(', ') || 'Not specified'}
- Preferred Tone: ${audience.preferredTone || 'Match brand voice'}

VERSION STRATEGY: ${strategy}
${strategy === 'conversion' ? '- Focus on driving immediate action with clear benefits and strong CTA' : ''}
${strategy === 'awareness' ? '- Focus on brand storytelling and education' : ''}
${strategy === 'urgency' ? '- Emphasize limited time, scarcity, or deadlines' : ''}
${strategy === 'emotional' ? '- Connect through values, lifestyle, and emotional resonance' : ''}

Generate email content with the following constraints:
1. Subject Line: Max 60 characters, optimize for open rates
2. Preheader: Max 90 characters, complement the subject line
3. Headline: Max 80 characters, capture attention
4. Body Copy: 150-200 words, compelling and on-brand
5. CTA Text: Max 25 characters, action-oriented

Respond ONLY with a valid JSON object in this exact format:
{
  "subjectLine": "Your subject line here",
  "preheader": "Your preheader text here",
  "headline": "Your headline here",
  "bodyCopy": "Your body copy here...",
  "ctaText": "Your CTA here"
}`;
}

// Build Meta Ad generation prompt
function buildMetaAdPrompt(
  brandGuide: IBrandGuide,
  campaign: ICampaign,
  audience: any,
  strategy: string
): string {
  return `You are an expert social media advertising copywriter creating Meta (Facebook/Instagram) ad content.

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
- Urgency Level: ${campaign.urgencyLevel}

TARGET AUDIENCE:
- Segment: ${audience.name}
- Description: ${audience.description || 'Not specified'}
- Propensity Level: ${audience.propensityLevel}
- Pain Points: ${audience.painPoints?.join(', ') || 'Not specified'}
- Key Motivators: ${audience.keyMotivators?.join(', ') || 'Not specified'}

VERSION STRATEGY: ${strategy}
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

// Generate content using Claude API
async function generateContent(prompt: string): Promise<any> {
  try {
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
      throw new Error('No valid JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error('Claude API error:', error);
    throw new Error(`Content generation failed: ${error.message}`);
  }
}

// Generate all assets for a campaign
export async function generateCampaignAssets(
  campaign: ICampaign,
  brandGuide: IBrandGuide
): Promise<any[]> {
  const assets: any[] = [];
  const enabledChannels = campaign.channels.filter(c => c.enabled);

  // Default strategies to generate
  const strategies = [VERSION_STRATEGIES.CONVERSION, VERSION_STRATEGIES.AWARENESS];

  for (const segment of campaign.segments) {
    // Get full audience data
    const audience = await Audience.findById(segment.audienceId);
    if (!audience) continue;

    for (const channel of enabledChannels) {
      // Determine asset type based on channel
      const assetType = channel.type === CHANNEL_TYPES.EMAIL 
        ? ASSET_TYPES.HERO_EMAIL 
        : ASSET_TYPES.SINGLE_IMAGE_AD;

      // Create asset document
      const asset = new Asset({
        campaignId: campaign._id,
        audienceId: audience._id,
        channelType: channel.type,
        assetType: assetType,
        name: `${audience.name} - ${channel.type === CHANNEL_TYPES.EMAIL ? 'Email' : 'Meta Ad'}`,
        versions: [],
      });

      // Generate versions for each strategy
      for (const strategy of strategies) {
        try {
          let content: EmailContent | MetaAdContent;
          let prompt: string;

          if (channel.type === CHANNEL_TYPES.EMAIL) {
            prompt = buildEmailPrompt(brandGuide, campaign, audience, strategy);
            content = await generateContent(prompt) as EmailContent;
          } else {
            prompt = buildMetaAdPrompt(brandGuide, campaign, audience, strategy);
            content = await generateContent(prompt) as MetaAdContent;
          }

          // Add version to asset
          asset.versions.push({
            versionName: `${strategy.charAt(0).toUpperCase() + strategy.slice(1)} Focus`,
            strategy: strategy,
            content: content,
            status: ASSET_STATUS.GENERATED,
            generatedAt: new Date(),
          });

          // Store the prompt for potential regeneration
          asset.generationPrompt = prompt;

        } catch (error: any) {
          console.error(`Failed to generate ${strategy} version for ${audience.name}:`, error);
          // Continue with other versions even if one fails
        }
      }

      // Save asset if it has at least one version
      if (asset.versions.length > 0) {
        await asset.save();
        assets.push(asset);
      }
    }
  }

  return assets;
}

// Regenerate a single asset
export async function regenerateAsset(
  asset: any,
  instructions?: string,
  strategy?: string
): Promise<any> {
  const campaign = asset.campaignId;
  const audience = asset.audienceId;

  // Get brand guide
  const BrandGuide = require('../models/BrandGuide').default;
  const brandGuide = await BrandGuide.findById(campaign.brandGuideId);

  if (!brandGuide) {
    throw new Error('Brand guide not found');
  }

  const targetStrategy = strategy || VERSION_STRATEGIES.CONVERSION;

  let prompt: string;
  if (asset.channelType === CHANNEL_TYPES.EMAIL) {
    prompt = buildEmailPrompt(brandGuide, campaign, audience, targetStrategy);
  } else {
    prompt = buildMetaAdPrompt(brandGuide, campaign, audience, targetStrategy);
  }

  // Add custom instructions if provided
  if (instructions) {
    prompt += `\n\nADDITIONAL INSTRUCTIONS:\n${instructions}`;
  }

  const content = await generateContent(prompt);

  // Add new version
  asset.versions.push({
    versionName: `${targetStrategy.charAt(0).toUpperCase() + targetStrategy.slice(1)} Focus (Regenerated)`,
    strategy: targetStrategy,
    content: content,
    status: ASSET_STATUS.GENERATED,
    generatedAt: new Date(),
  });

  // Keep only last 3 versions
  if (asset.versions.length > 3) {
    asset.versions = asset.versions.slice(-3);
  }

  asset.generationPrompt = prompt;
  await asset.save();

  return asset;
}

// Regenerate a specific version in-place
export async function regenerateAssetVersion(
  assetId: string,
  versionId: string,
  userId: string,
  customInstructions?: string
): Promise<any> {
  const mongoose = require('mongoose');
  const Campaign = require('../models/Campaign').default;

  // Load asset with populated references
  const asset = await Asset.findById(assetId)
    .populate('campaignId')
    .populate('audienceId');

  if (!asset) {
    throw new Error('Asset not found');
  }

  // Verify ownership through campaign
  const campaign = asset.campaignId as any;
  if (campaign.userId.toString() !== userId) {
    throw new Error('Access denied');
  }

  // Find the version to regenerate
  const versionIndex = asset.versions.findIndex(
    (v: any) => v._id?.toString() === versionId
  );

  if (versionIndex === -1) {
    throw new Error('Version not found');
  }

  const version = asset.versions[versionIndex];
  const audience = asset.audienceId as any;

  // Get brand guide
  const BrandGuide = require('../models/BrandGuide').default;
  const brandGuide = await BrandGuide.findById(campaign.brandGuideId);

  if (!brandGuide) {
    throw new Error('Brand guide not found');
  }

  // Build the appropriate prompt
  const strategy = version.strategy || 'conversion';
  let prompt: string;

  if (asset.channelType === CHANNEL_TYPES.EMAIL) {
    prompt = buildEmailPrompt(brandGuide, campaign, audience, strategy);
  } else {
    prompt = buildMetaAdPrompt(brandGuide, campaign, audience, strategy);
  }

  // Add custom instructions if provided
  if (customInstructions) {
    prompt += `\n\nADDITIONAL INSTRUCTIONS:\n${customInstructions}`;
  }

  // Call Claude API
  const content = await generateContent(prompt);

  // Update the version in-place
  const existingVersion = asset.versions[versionIndex] as any;
  asset.versions[versionIndex] = {
    _id: existingVersion._id,
    versionName: existingVersion.versionName,
    strategy: existingVersion.strategy,
    content: content,
    status: ASSET_STATUS.GENERATED,
    generatedAt: new Date(),
  };

  asset.generationPrompt = prompt;
  await asset.save();

  return asset;
}

// Generate single content piece (utility function)
export async function generateSingleContent(
  brandGuide: IBrandGuide,
  campaign: ICampaign,
  audience: any,
  channelType: string,
  strategy: string
): Promise<EmailContent | MetaAdContent> {
  let prompt: string;

  if (channelType === CHANNEL_TYPES.EMAIL) {
    prompt = buildEmailPrompt(brandGuide, campaign, audience, strategy);
  } else {
    prompt = buildMetaAdPrompt(brandGuide, campaign, audience, strategy);
  }

  return await generateContent(prompt);
}
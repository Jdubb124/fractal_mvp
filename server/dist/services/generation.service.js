"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSingleContent = exports.regenerateAsset = exports.generateCampaignAssets = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const models_1 = require("../models");
const constants_1 = require("../config/constants");
// Initialize Anthropic client
const anthropic = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY,
});
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
// Build email generation prompt
function buildEmailPrompt(brandGuide, campaign, audience, strategy) {
    return `You are an expert marketing copywriter creating email content.

BRAND CONTEXT:
- Company: ${brandGuide.companyName}
- Industry: ${brandGuide.industry || 'Not specified'}
- Voice Attributes: ${brandGuide.voiceAttributes?.join(', ') || 'Professional, friendly'}
- Tone Guidelines: ${brandGuide.toneGuidelines || 'Maintain a professional yet approachable tone'}
- Value Proposition: ${brandGuide.valueProposition || 'Not specified'}

PHRASES TO AVOID:
${brandGuide.avoidPhrases?.map(p => `- ${p}`).join('\n') || '- None specified'}

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
function buildMetaAdPrompt(brandGuide, campaign, audience, strategy) {
    return `You are an expert social media advertising copywriter creating Meta (Facebook/Instagram) ad content.

BRAND CONTEXT:
- Company: ${brandGuide.companyName}
- Industry: ${brandGuide.industry || 'Not specified'}
- Voice Attributes: ${brandGuide.voiceAttributes?.join(', ') || 'Professional, friendly'}
- Tone Guidelines: ${brandGuide.toneGuidelines || 'Maintain a professional yet approachable tone'}

PHRASES TO AVOID:
${brandGuide.avoidPhrases?.map(p => `- ${p}`).join('\n') || '- None specified'}

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
async function generateContent(prompt) {
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
    }
    catch (error) {
        console.error('Claude API error:', error);
        throw new Error(`Content generation failed: ${error.message}`);
    }
}
// Generate all assets for a campaign
async function generateCampaignAssets(campaign, brandGuide) {
    const assets = [];
    const enabledChannels = campaign.channels.filter(c => c.enabled);
    // Default strategies to generate
    const strategies = [constants_1.VERSION_STRATEGIES.CONVERSION, constants_1.VERSION_STRATEGIES.AWARENESS];
    for (const segment of campaign.segments) {
        // Get full audience data
        const audience = await models_1.Audience.findById(segment.audienceId);
        if (!audience)
            continue;
        for (const channel of enabledChannels) {
            // Determine asset type based on channel
            const assetType = channel.type === constants_1.CHANNEL_TYPES.EMAIL
                ? constants_1.ASSET_TYPES.HERO_EMAIL
                : constants_1.ASSET_TYPES.SINGLE_IMAGE_AD;
            // Create asset document
            const asset = new models_1.Asset({
                campaignId: campaign._id,
                audienceId: audience._id,
                channelType: channel.type,
                assetType: assetType,
                name: `${audience.name} - ${channel.type === constants_1.CHANNEL_TYPES.EMAIL ? 'Email' : 'Meta Ad'}`,
                versions: [],
            });
            // Generate versions for each strategy
            for (const strategy of strategies) {
                try {
                    let content;
                    let prompt;
                    if (channel.type === constants_1.CHANNEL_TYPES.EMAIL) {
                        prompt = buildEmailPrompt(brandGuide, campaign, audience, strategy);
                        content = await generateContent(prompt);
                    }
                    else {
                        prompt = buildMetaAdPrompt(brandGuide, campaign, audience, strategy);
                        content = await generateContent(prompt);
                    }
                    // Add version to asset
                    asset.versions.push({
                        versionName: `${strategy.charAt(0).toUpperCase() + strategy.slice(1)} Focus`,
                        strategy: strategy,
                        content: content,
                        status: constants_1.ASSET_STATUS.GENERATED,
                        generatedAt: new Date(),
                    });
                    // Store the prompt for potential regeneration
                    asset.generationPrompt = prompt;
                }
                catch (error) {
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
exports.generateCampaignAssets = generateCampaignAssets;
// Regenerate a single asset
async function regenerateAsset(asset, instructions, strategy) {
    const campaign = asset.campaignId;
    const audience = asset.audienceId;
    // Get brand guide
    const BrandGuide = require('../models/BrandGuide').default;
    const brandGuide = await BrandGuide.findById(campaign.brandGuideId);
    if (!brandGuide) {
        throw new Error('Brand guide not found');
    }
    const targetStrategy = strategy || constants_1.VERSION_STRATEGIES.CONVERSION;
    let prompt;
    if (asset.channelType === constants_1.CHANNEL_TYPES.EMAIL) {
        prompt = buildEmailPrompt(brandGuide, campaign, audience, targetStrategy);
    }
    else {
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
        status: constants_1.ASSET_STATUS.GENERATED,
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
exports.regenerateAsset = regenerateAsset;
// Generate single content piece (utility function)
async function generateSingleContent(brandGuide, campaign, audience, channelType, strategy) {
    let prompt;
    if (channelType === constants_1.CHANNEL_TYPES.EMAIL) {
        prompt = buildEmailPrompt(brandGuide, campaign, audience, strategy);
    }
    else {
        prompt = buildMetaAdPrompt(brandGuide, campaign, audience, strategy);
    }
    return await generateContent(prompt);
}
exports.generateSingleContent = generateSingleContent;
//# sourceMappingURL=generation.service.js.map
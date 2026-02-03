import Anthropic from '@anthropic-ai/sdk';
import EmailAsset, { IEmailAsset, IEmailContent } from '../models/EmailAsset';
import { Campaign, BrandGuide, Audience, Asset } from '../models';
import { emailTemplateEngine } from './email-template.engine';
import { emailHtmlGenerator, EmailHtmlGenerationContext } from './email-html-generator.service';
import { emailHtmlValidator } from '../utils/email-html-validator';
import { cssInliner } from '../utils/css-inliner';
import { htmlToPlainText } from '../utils/html-to-text';
import {
  CHANNEL_TYPES,
  EMAIL_TYPES,
  EMAIL_GENERATION_MODES,
  EmailType,
  VersionStrategy,
  EmailGenerationMode,
} from '../config/constants';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

interface GenerateEmailAssetsParams {
  campaignId: string;
  userId: string;
  templateId: string;
  regenerate: boolean;
  generationMode?: EmailGenerationMode;
}

interface GenerateEmailAssetsResult {
  emailAssets: IEmailAsset[];
  totalGenerated: number;
  generationTime: number;
}

interface GeneratedContentItem {
  audienceId: string;
  emailType: EmailType;
  strategy: VersionStrategy;
  versionNumber: number;
  content: IEmailContent;
}

class EmailService {
  /**
   * Generate HTML email assets for a campaign
   * Supports two modes: 'ai-designed' (Claude generates full HTML) and 'template-based' (static templates)
   */
  async generateEmailAssets(params: GenerateEmailAssetsParams): Promise<GenerateEmailAssetsResult> {
    const startTime = Date.now();
    const { campaignId, userId, templateId, regenerate, generationMode = EMAIL_GENERATION_MODES.AI_DESIGNED } = params;

    console.log('[EMAIL-DEBUG] Service: generateEmailAssets called', { campaignId, userId, templateId, regenerate, generationMode });

    // Fetch campaign with populated data
    const campaign = await Campaign.findById(campaignId).populate('segments.audienceId');
    if (!campaign || campaign.userId.toString() !== userId) {
      console.error('[EMAIL-DEBUG] Service: campaign not found or unauthorized', { campaignId, userId, campaignExists: !!campaign });
      throw new Error('Campaign not found or unauthorized');
    }
    console.log('[EMAIL-DEBUG] Service: campaign loaded', { name: campaign.name, segments: campaign.segments?.length, channels: campaign.channels?.length, brandGuideId: campaign.brandGuideId });

    // Fetch brand guide
    const brandGuide = await BrandGuide.findById(campaign.brandGuideId);
    if (!brandGuide) {
      console.error('[EMAIL-DEBUG] Service: brand guide not found', { brandGuideId: campaign.brandGuideId });
      throw new Error('Brand guide not found');
    }
    console.log('[EMAIL-DEBUG] Service: brand guide loaded', { name: brandGuide.name, colors: brandGuide.colors, tone: brandGuide.tone });

    // If regenerating, delete existing email assets
    if (regenerate) {
      const deleted = await EmailAsset.deleteMany({ campaignId, userId });
      console.log('[EMAIL-DEBUG] Service: regenerate - deleted existing assets', { deletedCount: deleted.deletedCount });
    }

    // Branch based on generation mode
    if (generationMode === EMAIL_GENERATION_MODES.AI_DESIGNED) {
      console.log('[EMAIL-DEBUG] Service: using AI_DESIGNED mode');
      try {
        return await this.generateWithAI(campaignId, userId, campaign, brandGuide, startTime);
      } catch (error: any) {
        console.error('[EMAIL-DEBUG] Service: AI generation failed, falling back to template-based:', error.message, error.stack);
        // Fallback to template-based generation
        return await this.generateWithTemplate(campaignId, userId, templateId, campaign, brandGuide, startTime);
      }
    } else {
      console.log('[EMAIL-DEBUG] Service: using TEMPLATE_BASED mode');
      return await this.generateWithTemplate(campaignId, userId, templateId, campaign, brandGuide, startTime);
    }
  }

  /**
   * Generate emails using AI (Claude generates complete HTML)
   */
  private async generateWithAI(
    campaignId: string,
    userId: string,
    campaign: any,
    brandGuide: any,
    startTime: number
  ): Promise<GenerateEmailAssetsResult> {
    const emailAssets: IEmailAsset[] = [];
    const segments = campaign.segments || [];
    const enabledChannels = (campaign.channels || []).filter((c: any) => c.enabled && c.type === 'email');

    console.log('[EMAIL-DEBUG] generateWithAI: starting', { segmentCount: segments.length, enabledChannels: enabledChannels.length, allChannels: (campaign.channels || []).map((c: any) => ({ type: c.type, enabled: c.enabled })) });

    if (enabledChannels.length === 0) {
      console.error('[EMAIL-DEBUG] generateWithAI: no email channel enabled', { channels: campaign.channels });
      throw new Error('No email channel enabled for this campaign');
    }

    // Default strategies to generate
    const strategies: VersionStrategy[] = ['conversion', 'awareness'];

    for (const segment of segments) {
      // Get audience data (may be populated or need fetching)
      const audience = segment.audienceId?._id
        ? segment.audienceId
        : await Audience.findById(segment.audienceId);

      if (!audience) {
        console.warn('[EMAIL-DEBUG] generateWithAI: audience not found for segment', { segmentAudienceId: segment.audienceId });
        continue;
      }
      console.log('[EMAIL-DEBUG] generateWithAI: processing audience', { name: audience.name, id: audience._id, propensityLevel: audience.propensityLevel });

      let versionNumber = 1;
      for (const strategy of strategies) {
        // Build context for AI generation
        const context: EmailHtmlGenerationContext = {
          campaign: {
            name: campaign.name,
            objective: campaign.objective,
            description: campaign.description,
            keyMessages: campaign.keyMessages || [],
            callToAction: campaign.callToAction,
            urgencyLevel: campaign.urgencyLevel || 'medium',
            startDate: campaign.startDate,
            endDate: campaign.endDate,
          },
          audience: {
            name: audience.name,
            description: audience.description,
            demographics: {
              ageRange: audience.demographics?.ageRange,
              income: audience.demographics?.income,
              location: audience.demographics?.location || [],
            },
            propensityLevel: audience.propensityLevel || 'Medium',
            interests: audience.interests || [],
            painPoints: audience.painPoints || [],
            keyMotivators: audience.keyMotivators || [],
            preferredTone: audience.preferredTone,
          },
          brandGuide: {
            name: brandGuide.name,
            colors: brandGuide.colors || ['#6366f1'],
            tone: brandGuide.tone,
            coreMessage: brandGuide.coreMessage,
          },
          emailType: 'promotional', // Default to promotional
          versionStrategy: strategy,
          segment: {
            customInstructions: segment.customInstructions,
          },
        };

        console.log('[EMAIL-DEBUG] generateWithAI: built context for Claude call', { audience: audience.name, strategy, emailType: 'promotional', campaignObjective: campaign.objective });

        try {
          // Generate HTML using Claude
          console.log('[EMAIL-DEBUG] generateWithAI: calling emailHtmlGenerator.generateEmailHtml...');
          const result = await emailHtmlGenerator.generateEmailHtml(context);
          console.log('[EMAIL-DEBUG] generateWithAI: Claude returned', { tokensUsed: result.tokensUsed, htmlLength: result.fullHtml?.length, extractedContent: { subjectLine: result.extractedContent?.subjectLine, headline: result.extractedContent?.headline, ctaText: result.extractedContent?.ctaText } });

          // Validate generated HTML
          const validation = emailHtmlValidator.validateEmailHtml(result.fullHtml);
          if (!validation.valid) {
            console.warn('[EMAIL-DEBUG] generateWithAI: HTML validation issues', validation.errors);
            // Attempt to sanitize
            result.fullHtml = emailHtmlValidator.sanitizeEmailHtml(result.fullHtml);
            console.log('[EMAIL-DEBUG] generateWithAI: HTML sanitized, new length', result.fullHtml.length);
          } else {
            console.log('[EMAIL-DEBUG] generateWithAI: HTML validation passed');
          }

          // Inline CSS for email client compatibility
          const inlinedHtml = await cssInliner.inline(result.fullHtml);
          console.log('[EMAIL-DEBUG] generateWithAI: CSS inlined', { inlinedHtmlLength: inlinedHtml.length });

          // Generate plain text version
          const plainText = htmlToPlainText(result.fullHtml);

          // Create email asset
          const emailAsset = await EmailAsset.create({
            campaignId,
            userId,
            audienceId: audience._id,
            emailType: 'promotional',
            versionStrategy: strategy,
            versionNumber: versionNumber++,
            content: result.extractedContent,
            html: {
              fullHtml: result.fullHtml,
              inlinedHtml,
              liquidHtml: this.generateLiquidTemplate(result.fullHtml),
              plainText,
            },
            brandSnapshot: {
              companyName: brandGuide.name,
              primaryColor: brandGuide.colors?.[0] || '#6366f1',
              voiceAttributes: brandGuide.tone ? [brandGuide.tone] : [],
            },
            audienceSnapshot: {
              name: audience.name,
              propensityLevel: audience.propensityLevel,
            },
            status: 'generated',
            meta: {
              templateId: 'ai-generated',
              generationMode: EMAIL_GENERATION_MODES.AI_DESIGNED,
              generatedAt: new Date(),
              editHistory: [],
              exportCount: 0,
              tokensUsed: result.tokensUsed,
            },
          });

          console.log('[EMAIL-DEBUG] generateWithAI: asset saved to DB', { assetId: emailAsset._id, audience: audience.name, strategy });
          emailAssets.push(emailAsset);
        } catch (error: any) {
          console.error(`[EMAIL-DEBUG] generateWithAI: FAILED for ${audience.name} - ${strategy}:`, error.message, error.stack);
          // Continue with other generations
        }
      }
    }

    if (emailAssets.length === 0) {
      console.error('[EMAIL-DEBUG] generateWithAI: all generations failed, 0 assets produced');
      throw new Error('AI generation failed for all segments. Try template-based generation.');
    }

    console.log('[EMAIL-DEBUG] generateWithAI: complete', { totalGenerated: emailAssets.length, generationTime: Date.now() - startTime });
    return {
      emailAssets,
      totalGenerated: emailAssets.length,
      generationTime: Date.now() - startTime,
    };
  }

  /**
   * Generate emails using static templates (fallback/legacy mode)
   */
  private async generateWithTemplate(
    campaignId: string,
    userId: string,
    templateId: string,
    campaign: any,
    brandGuide: any,
    startTime: number
  ): Promise<GenerateEmailAssetsResult> {
    // Get generated content from the campaign's existing assets
    const generatedContent = await this.getGeneratedContent(campaignId);

    if (generatedContent.length === 0) {
      throw new Error('No generated content found. Please generate campaign assets first.');
    }

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
          companyName: brandGuide.name,
          primaryColor: brandGuide.colors?.[0] || '#6366f1',
          voiceAttributes: brandGuide.tone ? [brandGuide.tone] : [],
          logoUrl: undefined,
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
          companyName: brandGuide.name,
          primaryColor: brandGuide.colors?.[0] || '#6366f1',
          voiceAttributes: brandGuide.tone ? [brandGuide.tone] : [],
        },
        audienceSnapshot: {
          name: audience.name,
          propensityLevel: audience.propensityLevel,
        },
        status: 'generated',
        meta: {
          templateId,
          generationMode: EMAIL_GENERATION_MODES.TEMPLATE_BASED,
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
   * Get generated content from campaign's existing assets
   */
  private async getGeneratedContent(campaignId: string): Promise<GeneratedContentItem[]> {
    // Get all email-type assets for this campaign
    const assets = await Asset.find({
      campaignId,
      channelType: CHANNEL_TYPES.EMAIL,
    });

    const contentItems: GeneratedContentItem[] = [];

    for (const asset of assets) {
      for (let i = 0; i < asset.versions.length; i++) {
        const version = asset.versions[i];
        const content = version.content as IEmailContent;

        // Validate that content has required email fields
        if (!content.subjectLine || !content.headline || !content.bodyCopy || !content.ctaText) {
          continue;
        }

        contentItems.push({
          audienceId: asset.audienceId.toString(),
          emailType: this.mapAssetTypeToEmailType(asset.assetType),
          strategy: (version.strategy as VersionStrategy) || 'conversion',
          versionNumber: i + 1,
          content: {
            subjectLine: content.subjectLine || '',
            preheader: content.preheader || '',
            headline: content.headline || '',
            bodyCopy: content.bodyCopy || '',
            ctaText: content.ctaText || '',
          },
        });
      }
    }

    return contentItems;
  }

  /**
   * Map asset type to email type
   */
  private mapAssetTypeToEmailType(assetType: string): EmailType {
    const mapping: Record<string, EmailType> = {
      hero_email: EMAIL_TYPES.PROMOTIONAL,
      follow_up_email: EMAIL_TYPES.PROMOTIONAL,
      promotional_email: EMAIL_TYPES.PROMOTIONAL,
    };
    return mapping[assetType] || EMAIL_TYPES.PROMOTIONAL;
  }

  /**
   * Convert HTML to Liquid template format
   */
  private generateLiquidTemplate(html: string): string {
    let liquid = html;

    // Replace content placeholders with Liquid variables
    // Preheader
    liquid = liquid.replace(
      /<!--\s*preheader\s*-->(.*?)<!--\s*\/preheader\s*-->/gs,
      '{{ email.preheader }}'
    );

    // Headline - preserve the h1 tags but replace content
    liquid = liquid.replace(
      /(<h1[^>]*>)(.*?)(<\/h1>)/gi,
      '$1{{ email.headline }}$3'
    );

    // CTA - preserve the link structure but replace text
    liquid = liquid.replace(
      /(<a[^>]*class="[^"]*cta[^"]*"[^>]*>)(.*?)(<\/a>)/gi,
      '$1{{ email.cta_text }}$3'
    );

    // Add conditional blocks for personalization
    liquid = `{% comment %}Generated by Fractal{% endcomment %}\n${liquid}`;

    return liquid;
  }

  /**
   * Get email assets by campaign
   */
  async getEmailAssetsByCampaign(campaignId: string, userId: string): Promise<IEmailAsset[]> {
    return EmailAsset.find({ campaignId, userId }).sort({ createdAt: -1 });
  }

  /**
   * Get single email asset
   */
  async getEmailAsset(assetId: string, userId: string): Promise<IEmailAsset | null> {
    return EmailAsset.findOne({ _id: assetId, userId });
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

    try {
      const message = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 8000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      // Extract HTML from response
      const modifiedHtml = this.extractHtmlFromResponse(responseText);

      // Determine changes made
      const changes = [
        `Applied modification: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`,
      ];

      return {
        modifiedHtml,
        changes,
        tokensUsed: message.usage?.input_tokens + message.usage?.output_tokens || 0,
      };
    } catch (error: any) {
      console.error('AI edit error:', error);
      throw new Error(`AI edit failed: ${error.message}`);
    }
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

  /**
   * Approve email asset
   */
  async approveEmail(assetId: string, userId: string): Promise<IEmailAsset> {
    const asset = await EmailAsset.findById(assetId);
    if (!asset || asset.userId.toString() !== userId) {
      throw new Error('Email asset not found or unauthorized');
    }

    asset.status = 'approved';
    await asset.save();
    return asset;
  }

  /**
   * Increment export count
   */
  async incrementExportCount(assetId: string): Promise<void> {
    await EmailAsset.findByIdAndUpdate(assetId, {
      $inc: { 'meta.exportCount': 1 },
    });
  }

  /**
   * Export email in specified format
   */
  async exportEmail(
    assetId: string,
    userId: string,
    format: string
  ): Promise<{ content: string; filename: string; mimeType: string }> {
    const asset = await EmailAsset.findById(assetId);
    if (!asset || asset.userId.toString() !== userId) {
      throw new Error('Email asset not found or unauthorized');
    }

    // Increment export count
    await this.incrementExportCount(assetId);

    const baseName = `${asset.audienceSnapshot.name}-${asset.versionStrategy}-${asset.versionNumber}`.replace(
      /[^a-zA-Z0-9-]/g,
      '_'
    );

    switch (format) {
      case 'html':
        return {
          content: asset.html.inlinedHtml,
          filename: `${baseName}.html`,
          mimeType: 'text/html',
        };
      case 'liquid':
        return {
          content: asset.html.liquidHtml || asset.html.fullHtml,
          filename: `${baseName}.liquid`,
          mimeType: 'text/plain',
        };
      case 'plain_text':
        return {
          content: asset.html.plainText,
          filename: `${baseName}.txt`,
          mimeType: 'text/plain',
        };
      case 'json':
        return {
          content: JSON.stringify(
            {
              content: asset.content,
              html: asset.html,
              metadata: {
                emailType: asset.emailType,
                versionStrategy: asset.versionStrategy,
                audience: asset.audienceSnapshot,
                brand: asset.brandSnapshot,
              },
            },
            null,
            2
          ),
          filename: `${baseName}.json`,
          mimeType: 'application/json',
        };
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Delete email assets by campaign
   */
  async deleteEmailAssetsByCampaign(campaignId: string, userId: string): Promise<number> {
    const result = await EmailAsset.deleteMany({ campaignId, userId });
    return result.deletedCount || 0;
  }
}

export const emailService = new EmailService();

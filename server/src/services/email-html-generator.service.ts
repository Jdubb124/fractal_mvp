import Anthropic from '@anthropic-ai/sdk';
import { IEmailContent } from '../models/EmailAsset';
import { EmailType, VersionStrategy, UrgencyLevel } from '../config/constants';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

// Context interfaces for email generation
export interface EmailHtmlGenerationContext {
  campaign: {
    name: string;
    objective?: string;
    description?: string;
    keyMessages: string[];
    callToAction?: string;
    urgencyLevel: UrgencyLevel;
    startDate?: Date;
    endDate?: Date;
  };
  audience: {
    name: string;
    description?: string;
    demographics: {
      ageRange?: { min?: number; max?: number };
      income?: string;
      location: string[];
    };
    propensityLevel: string;
    interests: string[];
    painPoints: string[];
    keyMotivators: string[];
    preferredTone?: string;
  };
  brandGuide: {
    name: string;
    colors: string[];
    tone?: string;
    coreMessage?: string;
  };
  emailType: EmailType;
  versionStrategy: VersionStrategy;
  segment?: {
    customInstructions?: string;
  };
}

export interface EmailHtmlGenerationResult {
  fullHtml: string;
  extractedContent: IEmailContent;
  tokensUsed: number;
}

// System prompt for email generation
const SYSTEM_PROMPT = `You are an expert email HTML developer and marketing copywriter. You create production-ready HTML emails that render perfectly across all email clients including Outlook, Gmail, Apple Mail, Yahoo Mail, and mobile devices.

Your emails are:
- Visually compelling and on-brand
- Optimized for conversions based on the target audience
- Technically flawless with email-client compatibility
- Mobile-responsive with elegant fallbacks`;

// Build the brand context section
function buildBrandContext(brandGuide: EmailHtmlGenerationContext['brandGuide']): string {
  const primaryColor = brandGuide.colors[0] || '#6366f1';
  const secondaryColor = brandGuide.colors[1] || '#4f46e5';

  return `## BRAND IDENTITY
- Company Name: ${brandGuide.name}
- Primary Color: ${primaryColor}
- Secondary Color: ${secondaryColor}
- Additional Colors: ${brandGuide.colors.slice(2).join(', ') || 'None'}
- Brand Voice: ${brandGuide.tone || 'Professional and approachable'}
- Core Message: ${brandGuide.coreMessage || 'Not specified'}`;
}

// Build the campaign context section
function buildCampaignContext(campaign: EmailHtmlGenerationContext['campaign']): string {
  let dateContext = '';
  if (campaign.startDate || campaign.endDate) {
    const start = campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'Not set';
    const end = campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Not set';
    dateContext = `\n- Campaign Period: ${start} to ${end}`;
  }

  return `## CAMPAIGN CONTEXT
- Campaign Name: ${campaign.name}
- Objective: ${campaign.objective || 'Drive engagement and conversions'}
- Description: ${campaign.description || 'Not specified'}
- Key Messages: ${campaign.keyMessages.length > 0 ? '\n  - ' + campaign.keyMessages.join('\n  - ') : 'Not specified'}
- Primary CTA: ${campaign.callToAction || 'Learn More'}
- Urgency Level: ${campaign.urgencyLevel.toUpperCase()}${dateContext}`;
}

// Build the audience context section
function buildAudienceContext(audience: EmailHtmlGenerationContext['audience']): string {
  const demographics = [];
  if (audience.demographics.ageRange?.min || audience.demographics.ageRange?.max) {
    demographics.push(`Age: ${audience.demographics.ageRange.min || '18'}-${audience.demographics.ageRange.max || '65+'}`);
  }
  if (audience.demographics.income) {
    demographics.push(`Income: ${audience.demographics.income}`);
  }
  if (audience.demographics.location.length > 0) {
    demographics.push(`Location: ${audience.demographics.location.join(', ')}`);
  }

  return `## TARGET AUDIENCE
- Segment Name: ${audience.name}
- Description: ${audience.description || 'Not specified'}
- Demographics: ${demographics.length > 0 ? demographics.join(' | ') : 'General audience'}
- Purchase Propensity: ${audience.propensityLevel}
- Interests: ${audience.interests.length > 0 ? audience.interests.join(', ') : 'Not specified'}
- Pain Points: ${audience.painPoints.length > 0 ? '\n  - ' + audience.painPoints.join('\n  - ') : 'Not specified'}
- Key Motivators: ${audience.keyMotivators.length > 0 ? '\n  - ' + audience.keyMotivators.join('\n  - ') : 'Not specified'}
- Preferred Tone: ${audience.preferredTone || 'Match brand voice'}`;
}

// Build strategy-specific instructions
function buildStrategyInstructions(strategy: VersionStrategy, urgencyLevel: UrgencyLevel): string {
  const strategies: Record<VersionStrategy, string> = {
    conversion: `## STRATEGY: CONVERSION FOCUS
- Lead with the strongest benefit immediately
- Use action-oriented language throughout
- Create a clear, compelling value proposition
- Include social proof or credibility indicators if appropriate
- Make the CTA button prominent and repeat it if the email is long
- Use power words: "Get", "Start", "Unlock", "Discover", "Save"`,

    awareness: `## STRATEGY: AWARENESS FOCUS
- Tell a compelling brand story
- Educate about the problem and solution
- Build emotional connection before asking for action
- Use softer CTA language: "Learn More", "Explore", "See How"
- Focus on value and benefits over urgency
- Include brand differentiators naturally`,

    urgency: `## STRATEGY: URGENCY FOCUS
- Create immediate FOMO (fear of missing out)
- Use time-sensitive language: "Today Only", "Ends Soon", "Limited Time"
- Include countdown or deadline references
- Emphasize scarcity: "Only X left", "While supplies last"
- Make consequences of inaction clear
- Use exclamation points sparingly but effectively`,

    emotional: `## STRATEGY: EMOTIONAL CONNECTION
- Lead with aspirational messaging
- Paint a picture of the transformed life/outcome
- Use "you" language extensively
- Connect to identity: "For people who...", "If you've ever felt..."
- Use sensory and emotional words
- Build trust through authenticity and relatability`
  };

  let instructions = strategies[strategy] || strategies.conversion;

  // Add urgency modifiers based on campaign urgency level
  if (urgencyLevel === 'high' && strategy !== 'urgency') {
    instructions += `\n\nNote: This campaign has HIGH urgency - incorporate time-sensitive elements appropriately.`;
  }

  return instructions;
}

// Build the HTML requirements section
function buildHtmlRequirements(brandGuide: EmailHtmlGenerationContext['brandGuide']): string {
  const primaryColor = brandGuide.colors[0] || '#6366f1';

  return `## HTML TECHNICAL REQUIREMENTS (MUST FOLLOW EXACTLY)

### Document Structure
- Start with: <!DOCTYPE html>
- Include XHTML namespaces: xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"
- Add Outlook conditional: <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->

### Layout Rules
- Use TABLE-based layout ONLY (no CSS grid, no flexbox)
- Maximum content width: 600px
- Use role="presentation" on all layout tables
- Use cellpadding="0" cellspacing="0" border="0" on all tables
- Center the email with align="center" on wrapper table

### Styling Rules
- ALL styles MUST be inline (style="...") on every element
- Also include a <style> block in <head> for clients that support it
- Use system font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif
- Primary brand color for buttons/accents: ${primaryColor}
- Background color for email body: #f4f4f7
- Content background: #ffffff
- Text color: #1a1a2e for headings, #4a4a68 for body

### Email Client Fixes (Include All)
- iOS blue link fix: a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
- Gmail blue link fix: u + #body a { color: inherit; text-decoration: none; }
- Samsung blue link fix: #MessageViewBody a { color: inherit; text-decoration: none; }
- Add <meta name="x-apple-disable-message-reformatting">

### Mobile Responsiveness
- Include @media screen and (max-width: 600px) styles
- Use class="mobile-full-width" for 100% width on mobile
- Use class="mobile-padding" for adjusted padding

### Required Elements
1. Hidden preheader div as FIRST element in body with &zwnj; spacers
2. Single H1 for main headline
3. Clear CTA button with adequate padding (16px 32px minimum)
4. Footer with unsubscribe link and company info
5. Current year in copyright: ${new Date().getFullYear()}`;
}

// Build content requirements
function buildContentRequirements(emailType: EmailType): string {
  const typeGuidance: Record<EmailType, string> = {
    promotional: 'Focus on the offer/deal. Lead with value proposition. Create urgency if appropriate.',
    welcome: 'Warm, friendly tone. Set expectations. Guide next steps. Make them feel valued.',
    abandoned_cart: 'Remind without being pushy. Address potential objections. Offer help.',
    newsletter: 'Curated, valuable content. Easy to scan. Multiple entry points.',
    announcement: 'Clear, newsworthy headline. Key details upfront. Excitement without hype.'
  };

  return `## CONTENT REQUIREMENTS

### Email Type: ${emailType.toUpperCase()}
${typeGuidance[emailType] || typeGuidance.promotional}

### Copy Guidelines
1. Subject Line: Maximum 60 characters. Optimize for open rates. Be specific and intriguing.
2. Preheader: Maximum 90 characters. Complement (don't repeat) the subject line.
3. Headline (H1): Maximum 80 characters. Immediate impact. Clear benefit or hook.
4. Body Copy: 150-200 words. Scannable paragraphs. Benefit-focused.
5. CTA Button Text: Maximum 25 characters. Action-oriented verb. Clear outcome.

### Formatting
- Short paragraphs (2-3 sentences max)
- Use bullet points for lists of benefits/features
- One primary CTA (can repeat at bottom for longer emails)
- White space is your friend`;
}

// Build the complete prompt
export function buildEmailHtmlPrompt(context: EmailHtmlGenerationContext): string {
  const sections = [
    '# EMAIL GENERATION REQUEST\n\nGenerate a complete, production-ready HTML email based on the following context.\n',
    buildBrandContext(context.brandGuide),
    buildCampaignContext(context.campaign),
    buildAudienceContext(context.audience),
    buildStrategyInstructions(context.versionStrategy, context.campaign.urgencyLevel),
    buildContentRequirements(context.emailType),
    buildHtmlRequirements(context.brandGuide),
  ];

  // Add custom segment instructions if provided
  if (context.segment?.customInstructions) {
    sections.push(`## CUSTOM INSTRUCTIONS FOR THIS SEGMENT\n${context.segment.customInstructions}`);
  }

  // Add output format instructions
  sections.push(`## OUTPUT FORMAT

Return ONLY the complete HTML document. No explanations, no markdown code blocks, just the raw HTML starting with <!DOCTYPE html>.

Include these special comments for content extraction:
- Subject line: <!--SUBJECT: Your subject line here -->
- Preheader: In the hidden preheader div

The HTML must be complete and ready to send - no placeholders, no TODOs, no "[Insert X here]" text.`);

  return sections.join('\n\n');
}

// Extract content fields from generated HTML
export function extractContentFromHtml(html: string): IEmailContent {
  // Extract subject from comment or title
  const subjectMatch = html.match(/<!--SUBJECT:\s*(.+?)\s*-->/i) ||
                       html.match(/<title>([^<]+)<\/title>/i);
  const subjectLine = subjectMatch ? subjectMatch[1].trim() : 'Your Email Subject';

  // Extract preheader from hidden div
  const preheaderMatch = html.match(/<div[^>]*style="[^"]*display:\s*none[^"]*"[^>]*>([^<]+)/i);
  const preheader = preheaderMatch ? preheaderMatch[1].replace(/&[a-z]+;/gi, '').trim() : '';

  // Extract headline from h1
  const headlineMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const headline = headlineMatch ? headlineMatch[1].trim() : '';

  // Extract CTA text from button/link with cta class or common CTA patterns
  const ctaMatch = html.match(/<a[^>]*class="[^"]*cta[^"]*"[^>]*>([^<]+)<\/a>/i) ||
                   html.match(/<a[^>]*>([^<]{1,30})<\/a>\s*<\/td>\s*<\/tr>\s*<\/table>\s*<\/td>\s*<\/tr>/i) ||
                   html.match(/<td[^>]*background-color[^>]*>\s*<a[^>]*>([^<]+)<\/a>/i);
  const ctaText = ctaMatch ? ctaMatch[1].trim() : 'Learn More';

  // Extract body copy - get text from main content area
  // This is a simplified extraction - gets paragraphs from the body
  const bodyMatches = html.match(/<p[^>]*style="[^"]*margin[^"]*"[^>]*>([^<]+(?:<[^p][^>]*>[^<]*<\/[^p][^>]*>)*[^<]*)<\/p>/gi) || [];
  const bodyCopy = bodyMatches
    .map(p => p.replace(/<[^>]+>/g, '').trim())
    .filter(text => text.length > 20 && !text.includes('©') && !text.includes('Unsubscribe'))
    .slice(0, 5)
    .join('\n\n');

  return {
    subjectLine: subjectLine.substring(0, 100),
    preheader: preheader.substring(0, 150),
    headline: headline.substring(0, 120),
    bodyCopy: bodyCopy.substring(0, 5000) || 'Email body content',
    ctaText: ctaText.substring(0, 50),
  };
}

// Main generation function
export async function generateEmailHtml(
  context: EmailHtmlGenerationContext
): Promise<EmailHtmlGenerationResult> {
  const prompt = buildEmailHtmlPrompt(context);

  console.log('[EMAIL-DEBUG] generateEmailHtml: building prompt', { promptLength: prompt.length, model: CLAUDE_MODEL, audience: context.audience.name, strategy: context.versionStrategy });
  console.log('[EMAIL-DEBUG] generateEmailHtml: prompt preview (first 500 chars)', prompt.substring(0, 500));

  try {
    console.log('[EMAIL-DEBUG] generateEmailHtml: calling anthropic.messages.create...', { model: CLAUDE_MODEL, max_tokens: 8000 });
    const apiCallStart = Date.now();
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });
    const apiCallDuration = Date.now() - apiCallStart;

    console.log('[EMAIL-DEBUG] generateEmailHtml: Anthropic API responded', {
      apiCallDuration: `${apiCallDuration}ms`,
      stopReason: message.stop_reason,
      inputTokens: message.usage?.input_tokens,
      outputTokens: message.usage?.output_tokens,
      contentBlocks: message.content.length,
      contentType: message.content[0]?.type,
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    console.log('[EMAIL-DEBUG] generateEmailHtml: raw response length', { length: responseText.length, startsWithDoctype: responseText.trim().toLowerCase().startsWith('<!doctype'), first100: responseText.substring(0, 100) });

    // Extract HTML from response (handle potential markdown code blocks)
    let fullHtml = responseText.trim();

    // If wrapped in code blocks, extract
    const codeBlockMatch = fullHtml.match(/```html?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      console.log('[EMAIL-DEBUG] generateEmailHtml: extracted HTML from code block');
      fullHtml = codeBlockMatch[1].trim();
    }

    // Ensure it starts with DOCTYPE
    if (!fullHtml.toLowerCase().startsWith('<!doctype')) {
      const doctypeIndex = fullHtml.toLowerCase().indexOf('<!doctype');
      if (doctypeIndex > -1) {
        console.log('[EMAIL-DEBUG] generateEmailHtml: trimmed content before DOCTYPE at index', doctypeIndex);
        fullHtml = fullHtml.substring(doctypeIndex);
      } else {
        console.warn('[EMAIL-DEBUG] generateEmailHtml: WARNING - no DOCTYPE found in response!', { first200: fullHtml.substring(0, 200) });
      }
    }

    const extractedContent = extractContentFromHtml(fullHtml);
    console.log('[EMAIL-DEBUG] generateEmailHtml: extracted content', { subjectLine: extractedContent.subjectLine, headline: extractedContent.headline, ctaText: extractedContent.ctaText, bodyCopyLength: extractedContent.bodyCopy?.length });

    const tokensUsed = (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0);

    return {
      fullHtml,
      extractedContent,
      tokensUsed,
    };
  } catch (error: any) {
    console.error('[EMAIL-DEBUG] generateEmailHtml: ANTHROPIC API ERROR', { message: error.message, status: error.status, type: error.type, stack: error.stack });
    throw new Error(`Email HTML generation failed: ${error.message}`);
  }
}

// Export service object for consistency with other services
export const emailHtmlGenerator = {
  generateEmailHtml,
  buildEmailHtmlPrompt,
  extractContentFromHtml,
};

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
      .filter((p) => p.trim())
      .map((p) => `<p style="margin: 0 0 16px 0; line-height: 1.6;">${this.escapeHtml(p.trim())}</p>`)
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
                    <p style="margin: 0;">Hero Image (600x300)</p>
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
      .mobile-stack { display: block !important; width: 100% !important; }
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
            <td style="padding: 10px 40px 20px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #4a4a68;" class="mobile-padding">
              {{BODY_COPY}}
            </td>
          </tr>

          <!-- Product Grid -->
          <tr>
            <td style="padding: 20px 40px;" class="mobile-padding">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <!-- Product 1 -->
                  <td width="48%" class="mobile-stack" style="vertical-align: top;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="background-color: #e8e8ed; height: 180px; text-align: center; border-radius: 8px;">
                          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #9898a8;">Product Image 1</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                          <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600; color: #1a1a2e;">Product Name</p>
                          <p style="margin: 0; font-size: 14px; color: {{PRIMARY_COLOR}}; font-weight: 600;">$XX.XX</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Spacer -->
                  <td width="4%">&nbsp;</td>
                  <!-- Product 2 -->
                  <td width="48%" class="mobile-stack" style="vertical-align: top;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="background-color: #e8e8ed; height: 180px; text-align: center; border-radius: 8px;">
                          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #9898a8;">Product Image 2</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                          <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600; color: #1a1a2e;">Product Name</p>
                          <p style="margin: 0; font-size: 14px; color: {{PRIMARY_COLOR}}; font-weight: 600;">$XX.XX</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding: 20px 40px 40px 40px;" class="mobile-padding">
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
   * Newsletter Template - Multi-section layout
   */
  private newsletterTemplate(): string {
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

          <!-- Header with Brand Color Bar -->
          <tr>
            <td style="background-color: {{PRIMARY_COLOR}}; height: 8px;"></td>
          </tr>
          <tr>
            <td align="center" style="padding: 30px 40px 20px 40px;" class="mobile-padding">
              <!--LOGO_START-->
              <img src="{{LOGO_URL}}" alt="{{COMPANY_NAME}}" width="150" style="display: block; margin-bottom: 15px;">
              <!--LOGO_END-->
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #9898a8; text-transform: uppercase; letter-spacing: 1px;">Newsletter</p>
            </td>
          </tr>

          <!-- Main Headline -->
          <tr>
            <td align="center" style="padding: 10px 40px 20px 40px;" class="mobile-padding">
              <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a2e; line-height: 1.3;">
                {{HEADLINE}}
              </h1>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 10px 40px 30px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #4a4a68;" class="mobile-padding">
              {{BODY_COPY}}
            </td>
          </tr>

          <!-- Section Divider -->
          <tr>
            <td style="padding: 0 40px;" class="mobile-padding">
              <hr style="border: none; border-top: 1px solid #e8e8ed; margin: 0;">
            </td>
          </tr>

          <!-- Featured Section -->
          <tr>
            <td style="padding: 30px 40px;" class="mobile-padding">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="background-color: #f8f8fb; padding: 25px; border-radius: 8px;">
                    <p style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: {{PRIMARY_COLOR}}; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Featured</p>
                    <p style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 600; color: #1a1a2e;">Featured Section Title</p>
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #4a4a68; line-height: 1.5;">Add your featured content here. This section highlights important news, products, or announcements.</p>
                  </td>
                </tr>
              </table>
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
            <td style="background-color: #f8f8fb; padding: 30px 40px;" class="mobile-padding">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #9898a8;">
                    <p style="margin: 0 0 10px 0;">&copy; {{CURRENT_YEAR}} {{COMPANY_NAME}}. All rights reserved.</p>
                    <p style="margin: 0 0 15px 0;">
                      <a href="#" style="color: #9898a8; text-decoration: underline;">Unsubscribe</a> |
                      <a href="#" style="color: #9898a8; text-decoration: underline;">View in browser</a> |
                      <a href="#" style="color: #9898a8; text-decoration: underline;">Preferences</a>
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #b8b8c8;">
                      You're receiving this because you subscribed to our newsletter.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}

export const emailTemplateEngine = new EmailTemplateEngine();

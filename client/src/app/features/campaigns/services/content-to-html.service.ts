import { Injectable } from '@angular/core';

export interface EmailContent {
  subjectLine: string;
  preheader: string;
  headline: string;
  bodyCopy: string;
  ctaText: string;
}

export interface BrandColors {
  primary: string;
  secondary?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContentToHtmlService {

  /**
   * Converts email content JSON to a styled HTML string for preview
   */
  generateEmailHtml(
    content: EmailContent,
    brandColors: BrandColors = { primary: '#8b5cf6' }
  ): string {
    const primaryColor = brandColors.primary || '#8b5cf6';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(content.subjectLine)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f3f4f6;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .email-header {
      background: linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -20)} 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .email-header h1 {
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      line-height: 1.3;
    }
    .email-body {
      padding: 40px 30px;
    }
    .email-body p {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 20px;
      line-height: 1.7;
    }
    .cta-container {
      text-align: center;
      padding: 20px 0 30px;
    }
    .cta-button {
      display: inline-block;
      background-color: ${primaryColor};
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
      transition: background-color 0.2s;
    }
    .cta-button:hover {
      background-color: ${this.adjustColor(primaryColor, -15)};
    }
    .email-footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .email-footer p {
      font-size: 13px;
      color: #9ca3af;
      margin: 0;
    }
    .preheader {
      display: none !important;
      visibility: hidden;
      mso-hide: all;
      font-size: 1px;
      line-height: 1px;
      max-height: 0;
      max-width: 0;
      opacity: 0;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div class="preheader">${this.escapeHtml(content.preheader)}</div>
  <div class="email-container">
    <div class="email-header">
      <h1>${this.escapeHtml(content.headline)}</h1>
    </div>
    <div class="email-body">
      ${this.formatBodyCopy(content.bodyCopy)}
    </div>
    <div class="cta-container">
      <a href="#" class="cta-button">${this.escapeHtml(content.ctaText)}</a>
    </div>
    <div class="email-footer">
      <p>You received this email because you subscribed to our mailing list.</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generates a minimal preview HTML for quick rendering
   */
  generateMinimalPreview(content: EmailContent, primaryColor: string = '#8b5cf6'): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #fff; }
    .headline { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 16px; }
    .body { font-size: 14px; color: #4b5563; line-height: 1.6; margin-bottom: 20px; }
    .cta { display: inline-block; background: ${primaryColor}; color: #fff; padding: 10px 20px;
           border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div class="headline">${this.escapeHtml(content.headline)}</div>
  <div class="body">${this.formatBodyCopy(content.bodyCopy)}</div>
  <a href="#" class="cta">${this.escapeHtml(content.ctaText)}</a>
</body>
</html>`;
  }

  private escapeHtml(text: string): string {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private formatBodyCopy(text: string): string {
    if (!text) return '';
    // Split by double newlines for paragraphs, escape HTML
    return text
      .split(/\n\n+/)
      .map(para => `<p>${this.escapeHtml(para.trim())}</p>`)
      .join('');
  }

  private adjustColor(hex: string, percent: number): string {
    // Darken or lighten a hex color
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  }
}

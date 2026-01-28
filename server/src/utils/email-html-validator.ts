/**
 * Email HTML Validator
 * Validates AI-generated HTML for email client compatibility
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate email HTML for client compatibility
 */
export function validateEmailHtml(html: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for DOCTYPE
  if (!html.toLowerCase().includes('<!doctype html')) {
    errors.push('Missing DOCTYPE declaration');
  }

  // Check for required meta tags
  if (!html.includes('charset')) {
    errors.push('Missing charset meta tag');
  }
  if (!html.includes('viewport')) {
    warnings.push('Missing viewport meta tag (recommended for mobile)');
  }
  if (!html.includes('x-apple-disable-message-reformatting')) {
    warnings.push('Missing Apple message reformatting prevention meta tag');
  }

  // Check for XHTML namespaces (Outlook compatibility)
  if (!html.includes('xmlns=')) {
    warnings.push('Missing XHTML namespace (recommended for Outlook)');
  }

  // Check for MSO conditionals (Outlook)
  if (!html.includes('<!--[if mso]>')) {
    warnings.push('Missing MSO conditional comments (recommended for Outlook)');
  }

  // Check for table-based layout
  if (!html.includes('<table')) {
    errors.push('No table elements found - email should use table-based layout');
  }

  // Check for forbidden layout methods
  if (html.includes('display: flex') || html.includes('display:flex')) {
    errors.push('Flexbox detected - not supported in most email clients');
  }
  if (html.includes('display: grid') || html.includes('display:grid')) {
    errors.push('CSS Grid detected - not supported in most email clients');
  }

  // Check for inline styles on key elements
  const hasInlineStyles = html.includes('style="');
  if (!hasInlineStyles) {
    errors.push('No inline styles detected - email clients require inline CSS');
  }

  // Check for preheader
  const hasPreheader = html.includes('display: none') || html.includes('display:none');
  if (!hasPreheader) {
    warnings.push('No hidden preheader detected');
  }

  // Check for unsubscribe link
  if (!html.toLowerCase().includes('unsubscribe')) {
    warnings.push('No unsubscribe link detected (required for CAN-SPAM compliance)');
  }

  // Check for heading structure
  const h1Count = (html.match(/<h1/gi) || []).length;
  if (h1Count === 0) {
    warnings.push('No H1 heading found');
  } else if (h1Count > 1) {
    warnings.push('Multiple H1 headings found - consider using only one');
  }

  // Check for alt text on images
  const imgTags = html.match(/<img[^>]*>/gi) || [];
  const imagesWithoutAlt = imgTags.filter(img => !img.includes('alt='));
  if (imagesWithoutAlt.length > 0) {
    warnings.push(`${imagesWithoutAlt.length} image(s) missing alt text`);
  }

  // Check max width constraint
  if (!html.includes('600') && !html.includes('580') && !html.includes('560')) {
    warnings.push('Email width may exceed recommended 600px maximum');
  }

  // Check for role="presentation" on tables
  const tables = html.match(/<table[^>]*>/gi) || [];
  const tablesWithoutRole = tables.filter(t => !t.includes('role='));
  if (tablesWithoutRole.length > 0) {
    warnings.push(`${tablesWithoutRole.length} table(s) missing role="presentation" (accessibility)`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Quick check if HTML is minimally valid for email
 */
export function isValidEmailHtml(html: string): boolean {
  // Minimal requirements
  return (
    html.toLowerCase().includes('<!doctype') &&
    html.includes('<table') &&
    html.includes('style="') &&
    html.includes('</html>')
  );
}

/**
 * Attempt to fix common HTML issues
 */
export function sanitizeEmailHtml(html: string): string {
  let sanitized = html;

  // Ensure DOCTYPE exists
  if (!sanitized.toLowerCase().startsWith('<!doctype')) {
    sanitized = '<!DOCTYPE html>\n' + sanitized;
  }

  // Add role="presentation" to tables that don't have it
  sanitized = sanitized.replace(
    /<table(?![^>]*role=)/gi,
    '<table role="presentation"'
  );

  // Ensure cellpadding and cellspacing on tables
  sanitized = sanitized.replace(
    /<table([^>]*)>/gi,
    (match, attrs) => {
      let newAttrs = attrs;
      if (!attrs.includes('cellpadding')) {
        newAttrs += ' cellpadding="0"';
      }
      if (!attrs.includes('cellspacing')) {
        newAttrs += ' cellspacing="0"';
      }
      if (!attrs.includes('border')) {
        newAttrs += ' border="0"';
      }
      return `<table${newAttrs}>`;
    }
  );

  return sanitized;
}

export const emailHtmlValidator = {
  validateEmailHtml,
  isValidEmailHtml,
  sanitizeEmailHtml,
};

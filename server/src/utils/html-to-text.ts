import { convert, HtmlToTextOptions } from 'html-to-text';

/**
 * Convert HTML email to plain text version
 */
export function htmlToPlainText(html: string): string {
  const options: HtmlToTextOptions = {
    wordwrap: 80,
    selectors: [
      { selector: 'a', options: { linkBrackets: ['[', ']'] as [string, string] } },
      { selector: 'img', format: 'skip' },
      { selector: 'table.footer', format: 'skip' },
    ],
    preserveNewlines: false,
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

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

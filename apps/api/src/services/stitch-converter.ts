/**
 * Stitch-to-Blocks Converter
 *
 * Takes Stitch HTML output and converts it to Sigil content blocks.
 * Maps common patterns to native block types; falls back to a `custom`
 * block for complex layouts that don't map cleanly.
 */

import { BLOCK_TYPE } from '@netrun-cms/core';

export interface SigilBlock {
  blockType: string;
  content: Record<string, unknown>;
  settings?: Record<string, unknown>;
  sortOrder: number;
}

// ---------------------------------------------------------------------------
// Lightweight HTML helpers (no external parser dependency)
// ---------------------------------------------------------------------------

/** Extract the outer‐tag name from a snippet like `<section ...>` */
function tagName(html: string): string {
  const m = html.match(/^<(\w+)/);
  return m ? m[1].toLowerCase() : '';
}

/** Extract inner content between the first opening and last closing tag. */
function innerContent(html: string): string {
  const open = html.indexOf('>');
  const close = html.lastIndexOf('</');
  if (open === -1 || close === -1 || close <= open) return '';
  return html.slice(open + 1, close).trim();
}

/** Pull inline style value for a given CSS property. */
function styleValue(html: string, prop: string): string | undefined {
  const re = new RegExp(`${prop}\\s*:\\s*([^;"]+)`, 'i');
  const m = html.match(re);
  return m ? m[1].trim() : undefined;
}

/** Check if the html contains a gradient or large-font hero pattern. */
function looksLikeHero(html: string): boolean {
  const hasGradient = /background\s*:.*gradient/i.test(html) || /background-image\s*:.*gradient/i.test(html);
  const hasBigText = /font-size\s*:\s*(2|3|4|5)\d*(\.\d+)?\s*rem/i.test(html);
  const hasH1 = /<h1[\s>]/i.test(html);
  return (hasGradient || hasBigText) && hasH1;
}

/** Check if the html looks like a grid (features, cards). */
function looksLikeGrid(html: string): boolean {
  return /grid-template-columns/i.test(html) || /display\s*:\s*grid/i.test(html);
}

/** Check if the html looks like a CTA. */
function looksLikeCta(html: string): boolean {
  const hasButton = /<a[\s][^>]*style[^>]*padding[^>]*>/i.test(html) || /<button/i.test(html);
  const shortContent = innerContent(html).length < 500;
  return hasButton && shortContent;
}

/** Check if the html contains only an image or figure. */
function looksLikeImage(html: string): boolean {
  const inner = innerContent(html).trim();
  return /^<img\s/i.test(inner) || /^<figure[\s>]/i.test(inner);
}

/** Extract text from simple HTML (strip tags). */
function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

/** Extract href from the first anchor or button link. */
function extractLink(html: string): string {
  const m = html.match(/href=["']([^"']+)["']/i);
  return m ? m[1] : '#';
}

/** Extract src from the first image. */
function extractImgSrc(html: string): string {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : '';
}

/** Extract alt text from the first image. */
function extractImgAlt(html: string): string {
  const m = html.match(/<img[^>]+alt=["']([^"']*?)["']/i);
  return m ? m[1] : '';
}

// ---------------------------------------------------------------------------
// Top-level section splitter
// ---------------------------------------------------------------------------

/**
 * Split Stitch HTML output into top-level sections. Stitch typically
 * produces `<section>` or `<div>` wrappers at the top level.
 */
function splitSections(html: string): string[] {
  // Match top-level block elements (section, div, header, footer, main, nav, article)
  const blockRe = /<(section|div|header|footer|main|nav|article)[\s>]/gi;
  const sections: string[] = [];
  let match: RegExpExecArray | null;
  const starts: number[] = [];

  while ((match = blockRe.exec(html)) !== null) {
    // Only track starts of top-level elements (rough heuristic: look backwards
    // for previous close tag or start of string)
    starts.push(match.index);
  }

  if (starts.length === 0) {
    // No recognizable top-level elements — treat the whole thing as one block
    return [html.trim()];
  }

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const end = i + 1 < starts.length ? starts[i + 1] : html.length;
    const chunk = html.slice(start, end).trim();
    if (chunk) sections.push(chunk);
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Convert a single HTML section to a SigilBlock
// ---------------------------------------------------------------------------

function sectionToBlock(html: string, sortOrder: number): SigilBlock {
  // Hero detection
  if (looksLikeHero(html)) {
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
    const pMatch = html.match(/<p[^>]*>(.*?)<\/p>/is);
    const linkMatch = html.match(/<a[^>]*>(.*?)<\/a>/is);

    return {
      blockType: BLOCK_TYPE.HERO,
      content: {
        headline: h1Match ? stripTags(h1Match[1]) : 'Hero Headline',
        subheadline: pMatch ? stripTags(pMatch[1]) : '',
        ctaText: linkMatch ? stripTags(linkMatch[1]) : '',
        ctaLink: extractLink(html),
        alignment: 'center',
      },
      sortOrder,
    };
  }

  // Feature grid detection
  if (looksLikeGrid(html)) {
    // Try to extract child cards
    const cardMatches = [...html.matchAll(/<div[^>]*style[^>]*padding[^>]*>([\s\S]*?)<\/div>/gi)];
    const features = cardMatches.map((m) => {
      const cardHtml = m[1];
      const titleMatch = cardHtml.match(/<h[2-4][^>]*>(.*?)<\/h[2-4]>/is);
      const descMatch = cardHtml.match(/<p[^>]*>(.*?)<\/p>/is);
      return {
        title: titleMatch ? stripTags(titleMatch[1]) : '',
        description: descMatch ? stripTags(descMatch[1]) : '',
        icon: '',
      };
    });

    if (features.length > 0) {
      const headlineMatch = html.match(/<h[1-2][^>]*>(.*?)<\/h[1-2]>/is);
      return {
        blockType: BLOCK_TYPE.FEATURE_GRID,
        content: {
          headline: headlineMatch ? stripTags(headlineMatch[1]) : '',
          features,
          columns: Math.min(features.length, 4),
        },
        sortOrder,
      };
    }
  }

  // Image detection
  if (looksLikeImage(html)) {
    return {
      blockType: BLOCK_TYPE.IMAGE,
      content: {
        src: extractImgSrc(html),
        alt: extractImgAlt(html),
        caption: '',
      },
      sortOrder,
    };
  }

  // CTA detection
  if (looksLikeCta(html)) {
    const headlineMatch = html.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/is);
    const linkMatch = html.match(/<a[^>]*>(.*?)<\/a>/is);
    const descMatch = html.match(/<p[^>]*>(.*?)<\/p>/is);

    return {
      blockType: BLOCK_TYPE.CTA,
      content: {
        headline: headlineMatch ? stripTags(headlineMatch[1]) : '',
        description: descMatch ? stripTags(descMatch[1]) : '',
        buttonText: linkMatch ? stripTags(linkMatch[1]) : 'Learn More',
        buttonLink: extractLink(html),
        buttonVariant: 'primary',
        backgroundStyle: 'solid',
      },
      sortOrder,
    };
  }

  // Paragraph / text content
  const tag = tagName(html);
  if (tag === 'p' || (/<p[\s>]/i.test(html) && !/<(section|div)/i.test(innerContent(html)))) {
    return {
      blockType: BLOCK_TYPE.TEXT,
      content: {
        body: stripTags(innerContent(html) || html),
        format: 'markdown',
      },
      sortOrder,
    };
  }

  // Gallery detection (multiple images)
  const imgCount = (html.match(/<img[\s]/gi) || []).length;
  if (imgCount >= 3) {
    const images = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*?)["'])?[^>]*>/gi)].map(
      (m) => ({ src: m[1], alt: m[2] || '' })
    );
    return {
      blockType: BLOCK_TYPE.GALLERY,
      content: {
        images,
        layout: 'grid',
        columns: 3,
      },
      sortOrder,
    };
  }

  // Fallback: custom HTML block
  return {
    blockType: BLOCK_TYPE.CUSTOM,
    content: {
      html,
      css: '',
      js: '',
      data: {},
    },
    sortOrder,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert Stitch HTML output into an array of Sigil content blocks.
 *
 * @param html  Raw HTML string from Stitch `fetch_screen_code`
 * @returns     Array of blocks ready to be inserted via the Blocks API
 */
export function convertStitchToBlocks(html: string): SigilBlock[] {
  if (!html || !html.trim()) return [];

  const sections = splitSections(html.trim());
  return sections.map((section, i) => sectionToBlock(section, i));
}

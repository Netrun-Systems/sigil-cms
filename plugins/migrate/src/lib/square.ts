/**
 * Square Online ingestion engine
 *
 * Extracts products via the Square Catalog API and content via web scraping.
 * Products require a Square access token; site content is scraped from the
 * public-facing Square Online site.
 */

import type { MappedBlock } from './wordpress.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SquareProduct {
  id: string;
  name: string;
  description: string;
  categoryName?: string;
  imageUrls: string[];
  variations: SquareVariation[];
  modifiers: string[];
  visibility: string;
}

export interface SquareVariation {
  id: string;
  name: string;
  priceMoney: { amount: number; currency: string } | null;
  sku: string;
}

export interface SquareSiteData {
  url: string;
  title: string;
  description: string;
  pages: SquareScrapedPage[];
  navigation: SquareNavItem[];
  seo: {
    title?: string;
    description?: string;
    ogImage?: string;
    canonicalUrl?: string;
  };
}

export interface SquareScrapedPage {
  url: string;
  title: string;
  blocks: MappedBlock[];
  seo: {
    title?: string;
    description?: string;
    ogImage?: string;
  };
}

export interface SquareNavItem {
  title: string;
  url: string;
  children: SquareNavItem[];
}

// ---------------------------------------------------------------------------
// Square Catalog API — Product fetching
// ---------------------------------------------------------------------------

const SQUARE_API_BASE = 'https://connect.squareup.com/v2';

/**
 * Fetch products from Square Catalog API.
 * Uses the list-catalog endpoint with pagination via cursor.
 */
export async function fetchSquareProducts(accessToken: string): Promise<SquareProduct[]> {
  const products: SquareProduct[] = [];
  let cursor: string | undefined;

  // First, fetch all catalog items
  const items: any[] = [];
  do {
    const url = new URL(`${SQUARE_API_BASE}/catalog/list`);
    url.searchParams.set('types', 'ITEM');
    if (cursor) url.searchParams.set('cursor', cursor);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Square-Version': '2024-01-18',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Square Catalog API error ${response.status}: ${body}`);
    }

    const data = await response.json() as any;
    if (data.objects) items.push(...data.objects);
    cursor = data.cursor;
  } while (cursor);

  // Collect all image IDs we need to resolve
  const imageIds = new Set<string>();
  for (const item of items) {
    const imageIdsForItem = item.item_data?.image_ids || [];
    for (const imgId of imageIdsForItem) {
      imageIds.add(imgId);
    }
  }

  // Batch-fetch image URLs
  const imageUrlMap = new Map<string, string>();
  if (imageIds.size > 0) {
    const imageIdArray = Array.from(imageIds);
    // Square allows batch retrieval of up to 1000 objects
    for (let i = 0; i < imageIdArray.length; i += 1000) {
      const batch = imageIdArray.slice(i, i + 1000);
      try {
        const response = await fetch(`${SQUARE_API_BASE}/catalog/batch-retrieve`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Square-Version': '2024-01-18',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ object_ids: batch }),
        });

        if (response.ok) {
          const data = await response.json() as any;
          for (const obj of data.objects || []) {
            if (obj.type === 'IMAGE' && obj.image_data?.url) {
              imageUrlMap.set(obj.id, obj.image_data.url);
            }
          }
        }
      } catch {
        // Image resolution is best-effort
      }
    }
  }

  // Fetch categories for name mapping
  const categoryMap = new Map<string, string>();
  let catCursor: string | undefined;
  do {
    const url = new URL(`${SQUARE_API_BASE}/catalog/list`);
    url.searchParams.set('types', 'CATEGORY');
    if (catCursor) url.searchParams.set('cursor', catCursor);

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Square-Version': '2024-01-18',
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json() as any;
        for (const cat of data.objects || []) {
          categoryMap.set(cat.id, cat.category_data?.name || '');
        }
        catCursor = data.cursor;
      } else {
        catCursor = undefined;
      }
    } catch {
      catCursor = undefined;
    }
  } while (catCursor);

  // Map items to our product format
  for (const item of items) {
    const itemData = item.item_data;
    if (!itemData) continue;

    const categoryId = itemData.category_id;
    const imageUrls = (itemData.image_ids || [])
      .map((id: string) => imageUrlMap.get(id))
      .filter(Boolean) as string[];

    const variations = (itemData.variations || []).map((v: any) => ({
      id: v.id,
      name: v.item_variation_data?.name || '',
      priceMoney: v.item_variation_data?.price_money
        ? {
          amount: v.item_variation_data.price_money.amount,
          currency: v.item_variation_data.price_money.currency,
        }
        : null,
      sku: v.item_variation_data?.sku || '',
    }));

    const modifiers = (itemData.modifier_list_info || [])
      .map((m: any) => m.modifier_list_id)
      .filter(Boolean);

    products.push({
      id: item.id,
      name: itemData.name || '',
      description: itemData.description || '',
      categoryName: categoryId ? categoryMap.get(categoryId) : undefined,
      imageUrls,
      variations,
      modifiers,
      visibility: itemData.visibility || 'PRIVATE',
    });
  }

  return products;
}

// ---------------------------------------------------------------------------
// Square Online site scraping
// ---------------------------------------------------------------------------

/**
 * Scrape a Square Online site for content.
 * Fetches the homepage and discovers linked internal pages.
 * Extracts page titles, text, images, navigation, and SEO metadata.
 */
export async function scrapeSquareSite(siteUrl: string): Promise<SquareSiteData> {
  // Normalize URL
  const baseUrl = siteUrl.replace(/\/+$/, '');

  // Fetch homepage
  const homepageHtml = await fetchPage(baseUrl);
  if (!homepageHtml) {
    throw new Error(`Failed to fetch site: ${baseUrl}`);
  }

  // Extract site-level SEO from homepage
  const seo = extractSeoMeta(homepageHtml);
  const siteTitle = extractTag(homepageHtml, 'title') || seo.title || '';

  // Extract navigation
  const navigation = extractNavigation(homepageHtml, baseUrl);

  // Parse homepage into blocks
  const homepageBlocks = parseHtmlToBlocks(homepageHtml, baseUrl);

  const pages: SquareScrapedPage[] = [{
    url: baseUrl,
    title: siteTitle,
    blocks: homepageBlocks,
    seo,
  }];

  // Discover and fetch internal pages from navigation
  const visitedUrls = new Set<string>([baseUrl, baseUrl + '/']);
  const pageUrls = extractInternalLinks(navigation, baseUrl);

  for (const pageUrl of pageUrls) {
    if (visitedUrls.has(pageUrl)) continue;
    visitedUrls.add(pageUrl);

    try {
      const html = await fetchPage(pageUrl);
      if (!html) continue;

      const pageSeo = extractSeoMeta(html);
      const pageTitle = extractTag(html, 'title') || pageSeo.title || pageUrl;
      const pageBlocks = parseHtmlToBlocks(html, baseUrl);

      pages.push({
        url: pageUrl,
        title: pageTitle,
        blocks: pageBlocks,
        seo: pageSeo,
      });
    } catch {
      // Skip pages that fail to load
    }
  }

  return {
    url: baseUrl,
    title: siteTitle,
    description: seo.description || '',
    pages,
    navigation,
    seo,
  };
}

// ---------------------------------------------------------------------------
// HTML → CMS blocks parser
// ---------------------------------------------------------------------------

/**
 * Parse an HTML page body into CMS content blocks.
 * Detects common structural patterns: hero areas, text sections,
 * image galleries, contact forms, map embeds.
 */
export function parseHtmlToBlocks(html: string, baseUrl: string): MappedBlock[] {
  const blocks: MappedBlock[] = [];

  // Extract the main content area (try <main>, then <body>, then whole doc)
  let bodyContent = extractContentArea(html);

  // Remove script and style tags
  bodyContent = bodyContent
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '');

  // Split into sections by common container elements
  // Square Online typically uses <section>, <div class="...section...">,
  // or semantic elements
  const sectionRegex = /<(?:section|article|div)\b[^>]*class="[^"]*(?:section|block|row|container|hero|banner|feature|content-area)[^"]*"[^>]*>([\s\S]*?)<\/(?:section|article|div)>/gi;
  const sections: string[] = [];
  let sectionMatch;
  let lastEnd = 0;

  while ((sectionMatch = sectionRegex.exec(bodyContent)) !== null) {
    // Capture any content before this section
    const before = bodyContent.slice(lastEnd, sectionMatch.index).trim();
    if (before && stripHtml(before).length > 20) {
      sections.push(before);
    }
    sections.push(sectionMatch[0]);
    lastEnd = sectionMatch.index + sectionMatch[0].length;
  }

  // If no sections matched, try splitting on <section> or major headings
  if (sections.length === 0) {
    const rawSections = bodyContent.split(/<\/?section[^>]*>/gi).filter((s) => s.trim());
    if (rawSections.length > 1) {
      sections.push(...rawSections);
    } else {
      // Fall back to splitting on headings
      const headingSections = bodyContent.split(/(?=<h[1-3][\s>])/gi).filter((s) => s.trim());
      if (headingSections.length > 0) {
        sections.push(...headingSections);
      } else {
        sections.push(bodyContent);
      }
    }
  }

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed || stripHtml(trimmed).length < 5) continue;

    const block = classifySection(trimmed, baseUrl);
    if (block) blocks.push(block);
  }

  return blocks.length > 0
    ? blocks
    : [{ type: 'text', content: { body: stripHtml(bodyContent) }, settings: {} }];
}

// ---------------------------------------------------------------------------
// Section classification
// ---------------------------------------------------------------------------

/**
 * Classify an HTML section into a CMS block type based on content analysis.
 */
function classifySection(html: string, baseUrl: string): MappedBlock | null {
  const text = stripHtml(html);
  if (!text || text.length < 3) return null;

  // Detect hero: has h1 + (background image OR large image + short text)
  const hasH1 = /<h1[\s>]/i.test(html);
  const hasBgImage = /(?:background-image|background:\s*url)/i.test(html);
  const hasLargeImage = /<img[^>]+(?:hero|banner|full-width|cover)/i.test(html);

  if (hasH1 && (hasBgImage || hasLargeImage)) {
    const heading = extractFirstHeading(html);
    const bgUrl = extractBackgroundImage(html) || extractFirstImageSrc(html, baseUrl);
    const subtext = text.replace(heading, '').trim().slice(0, 200);
    return {
      type: 'hero',
      content: {
        heading,
        subheading: subtext,
        backgroundImage: bgUrl || '',
      },
      settings: {},
    };
  }

  // Detect image gallery: multiple images with minimal text
  const images = extractAllImages(html, baseUrl);
  if (images.length >= 3 && text.length < images.length * 50) {
    return {
      type: 'gallery',
      content: { images, columns: Math.min(images.length, 4) },
      settings: {},
    };
  }

  // Detect contact form
  if (/<form[\s>]/i.test(html) && /(?:email|name|message|phone|subject)/i.test(html)) {
    return {
      type: 'custom',
      content: {
        widgetType: 'contact_form',
        body: text.slice(0, 500),
      },
      settings: {},
    };
  }

  // Detect map embed
  if (/(?:google\.com\/maps|maps\.googleapis|iframe.*map)/i.test(html)) {
    const iframeSrc = html.match(/src="([^"]*(?:maps|map)[^"]*)"/i);
    return {
      type: 'custom',
      content: {
        widgetType: 'map',
        embedUrl: iframeSrc ? iframeSrc[1] : '',
      },
      settings: {},
    };
  }

  // Detect video embed
  if (/(?:youtube\.com|vimeo\.com|youtu\.be|wistia)/i.test(html)) {
    const iframeSrc = html.match(/src="([^"]*(?:youtube|vimeo|wistia)[^"]*)"/i);
    return {
      type: 'custom',
      content: {
        widgetType: 'embed',
        url: iframeSrc ? iframeSrc[1] : '',
      },
      settings: {},
    };
  }

  // Detect CTA: button/link with short text
  const hasButton = /<(?:a|button)[^>]*class="[^"]*(?:btn|button|cta)[^"]*"/i.test(html);
  if (hasButton && text.length < 200) {
    const heading = extractFirstHeading(html) || '';
    const btnMatch = html.match(/<(?:a|button)[^>]*(?:href="([^"]*)")?[^>]*>([\s\S]*?)<\/(?:a|button)>/i);
    return {
      type: 'cta',
      content: {
        heading,
        buttonText: btnMatch ? stripHtml(btnMatch[2]) : 'Learn More',
        buttonUrl: btnMatch?.[1] || '#',
        body: text.replace(heading, '').trim(),
      },
      settings: {},
    };
  }

  // Detect feature grid: multiple similar sub-sections (cards, columns)
  const cards = html.match(/<(?:div|li|article)[^>]*class="[^"]*(?:card|col|feature|item|grid-item)[^"]*"[^>]*>[\s\S]*?<\/(?:div|li|article)>/gi);
  if (cards && cards.length >= 2) {
    const features = cards.slice(0, 12).map((card) => {
      const cardHeading = extractFirstHeading(card) || '';
      const cardText = stripHtml(card).replace(cardHeading, '').trim();
      const cardImage = extractFirstImageSrc(card, baseUrl);
      return {
        title: cardHeading,
        description: cardText.slice(0, 300),
        image: cardImage || undefined,
      };
    });
    return {
      type: 'feature_grid',
      content: { features, columns: Math.min(features.length, 4) },
      settings: {},
    };
  }

  // Detect single image with text → feature_grid or text+image
  if (images.length === 1 && text.length > 50) {
    const heading = extractFirstHeading(html);
    return {
      type: 'feature_grid',
      content: {
        features: [{
          title: heading || '',
          description: text.replace(heading || '', '').trim().slice(0, 500),
          image: images[0].url,
        }],
      },
      settings: {},
    };
  }

  // Default: text block
  const heading = extractFirstHeading(html);
  return {
    type: 'text',
    content: {
      heading: heading || undefined,
      body: html,
    },
    settings: {},
  };
}

// ---------------------------------------------------------------------------
// HTML extraction helpers
// ---------------------------------------------------------------------------

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NetrunCMS-Migrator/1.0 (+https://netrun.net)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function extractContentArea(html: string): string {
  // Try <main>
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) return mainMatch[1];

  // Try <body>
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) return bodyMatch[1];

  return html;
}

function extractSeoMeta(html: string): {
  title?: string;
  description?: string;
  ogImage?: string;
  canonicalUrl?: string;
} {
  return {
    title: extractMetaContent(html, 'og:title') || extractTag(html, 'title') || undefined,
    description: extractMetaContent(html, 'description')
      || extractMetaContent(html, 'og:description') || undefined,
    ogImage: extractMetaContent(html, 'og:image') || undefined,
    canonicalUrl: extractLinkHref(html, 'canonical') || undefined,
  };
}

function extractMetaContent(html: string, nameOrProperty: string): string | null {
  // Try property=""
  const propMatch = html.match(
    new RegExp(`<meta[^>]+(?:property|name)=["']${escapeRegex(nameOrProperty)}["'][^>]+content=["']([^"']*)["']`, 'i'),
  );
  if (propMatch) return propMatch[1];

  // Try content="" before name=""
  const reverseMatch = html.match(
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escapeRegex(nameOrProperty)}["']`, 'i'),
  );
  return reverseMatch ? reverseMatch[1] : null;
}

function extractLinkHref(html: string, rel: string): string | null {
  const match = html.match(new RegExp(`<link[^>]+rel=["']${rel}["'][^>]+href=["']([^"']*)["']`, 'i'));
  return match ? match[1] : null;
}

function extractTag(html: string, tag: string): string | null {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? stripHtml(match[1]).trim() : null;
}

function extractNavigation(html: string, baseUrl: string): SquareNavItem[] {
  // Find <nav> elements
  const navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/gi);
  if (!navMatch) return [];

  // Use the first nav (usually main navigation)
  const navHtml = navMatch[0];
  const items: SquareNavItem[] = [];

  // Extract top-level links
  const linkRegex = /<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let linkMatch;

  while ((linkMatch = linkRegex.exec(navHtml)) !== null) {
    const href = linkMatch[1];
    const title = stripHtml(linkMatch[2]).trim();
    if (!title) continue;

    // Resolve relative URLs
    const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;

    items.push({
      title,
      url: fullUrl,
      children: [],
    });
  }

  return items;
}

function extractInternalLinks(navigation: SquareNavItem[], baseUrl: string): string[] {
  const urls: string[] = [];
  const baseHost = new URL(baseUrl).hostname;

  function collect(items: SquareNavItem[]) {
    for (const item of items) {
      try {
        const itemUrl = new URL(item.url);
        if (itemUrl.hostname === baseHost && !urls.includes(item.url)) {
          urls.push(item.url);
        }
      } catch {
        // Skip invalid URLs
      }
      collect(item.children);
    }
  }

  collect(navigation);
  return urls;
}

function extractFirstHeading(html: string): string {
  const match = html.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
  return match ? stripHtml(match[1]).trim() : '';
}

function extractBackgroundImage(html: string): string | null {
  const match = html.match(/url\(['"]?([^'")\s]+)['"]?\)/i);
  return match ? match[1] : null;
}

function extractFirstImageSrc(html: string, baseUrl: string): string | null {
  const match = html.match(/<img[^>]+src="([^"]+)"/i);
  if (!match) return null;
  const src = match[1];
  if (src.startsWith('http') || src.startsWith('//')) return src;
  return `${baseUrl}${src.startsWith('/') ? '' : '/'}${src}`;
}

function extractAllImages(html: string, baseUrl: string): Array<{ url: string; alt: string }> {
  const images: Array<{ url: string; alt: string }> = [];
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    let src = match[1];
    // Skip tiny images (tracking pixels, icons)
    if (/1x1|spacer|pixel|blank\.gif/i.test(src)) continue;

    if (!src.startsWith('http') && !src.startsWith('//')) {
      src = `${baseUrl}${src.startsWith('/') ? '' : '/'}${src}`;
    }

    const altMatch = match[0].match(/alt="([^"]*)"/i);
    images.push({ url: src, alt: altMatch ? altMatch[1] : '' });
  }

  return images;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

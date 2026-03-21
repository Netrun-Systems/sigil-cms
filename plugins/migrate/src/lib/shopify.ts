/**
 * Shopify ingestion engine
 *
 * Extracts content from a Shopify store via the Admin REST API and
 * Storefront API. Handles pages, products, blog posts, menus, redirects,
 * and theme data.
 */

import type { MappedBlock } from './wordpress.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShopifyImportResult {
  pages: ShopifyPage[];
  products: ShopifyProduct[];
  blogPosts: ShopifyArticle[];
  menus: MenuItem[];
  collections: ShopifyCollection[];
  redirects: ShopifyRedirect[];
  theme: ShopifyThemeData;
}

export interface ShopifyPage {
  id: number;
  title: string;
  handle: string;
  bodyHtml: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  templateSuffix: string | null;
  metafields: ShopifyMetafield[];
  blocks: MappedBlock[];
}

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  bodyHtml: string;
  vendor: string;
  productType: string;
  status: string;
  tags: string[];
  images: ShopifyImage[];
  variants: ShopifyVariant[];
  metafields: ShopifyMetafield[];
}

export interface ShopifyArticle {
  id: number;
  title: string;
  handle: string;
  bodyHtml: string;
  author: string;
  tags: string[];
  summaryHtml: string;
  blogId: number;
  blogHandle: string;
  createdAt: string;
  publishedAt: string | null;
  imageUrl: string | null;
  metafields: ShopifyMetafield[];
  blocks: MappedBlock[];
}

export interface ShopifyCollection {
  id: number;
  title: string;
  handle: string;
  bodyHtml: string;
  imageUrl: string | null;
  sortOrder: string;
  productsCount: number;
}

export interface ShopifyRedirect {
  id: number;
  path: string;
  target: string;
}

export interface ShopifyThemeData {
  name: string;
  role: string;
  sections: ShopifySection[];
  tokens: Partial<ThemeTokens>;
}

export interface ShopifySection {
  id: string;
  type: string;
  settings: Record<string, unknown>;
  blocks: Record<string, { type: string; settings: Record<string, unknown> }>;
  blockOrder: string[];
}

export interface ThemeTokens {
  colorPrimary: string;
  colorSecondary: string;
  colorBackground: string;
  colorText: string;
  colorAccent: string;
  fontHeading: string;
  fontBody: string;
  borderRadius: string;
  buttonStyle: string;
}

export interface MenuItem {
  id: string;
  title: string;
  url: string;
  type: string;
  children: MenuItem[];
}

interface ShopifyImage {
  id: number;
  src: string;
  alt: string | null;
  width: number;
  height: number;
}

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  sku: string;
  inventoryQuantity: number;
  weight: number;
  weightUnit: string;
}

interface ShopifyMetafield {
  namespace: string;
  key: string;
  value: string;
  type: string;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

const API_VERSION = '2024-01';

async function shopifyAdminFetch<T>(
  domain: string,
  token: string,
  path: string,
): Promise<T> {
  const url = `https://${domain}/admin/api/${API_VERSION}/${path}`;
  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Shopify API error ${response.status}: ${path} — ${body}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Paginate through a Shopify REST API endpoint.
 * Shopify uses the Link header for cursor-based pagination.
 */
async function shopifyPaginateAll<T>(
  domain: string,
  token: string,
  path: string,
  resourceKey: string,
  limit = 250,
): Promise<T[]> {
  const all: T[] = [];
  let url: string | null = `https://${domain}/admin/api/${API_VERSION}/${path}?limit=${limit}`;

  while (url) {
    const response: Response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Shopify API error ${response.status}: ${url} — ${body}`);
    }

    const data = await response.json() as Record<string, any>;
    const items = data[resourceKey] as T[];
    if (items) all.push(...items);

    // Parse Link header for next page
    url = null;
    const linkHeader: string | null = response.headers.get('link');
    if (linkHeader) {
      const nextMatch: RegExpMatchArray | null = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      if (nextMatch) {
        url = nextMatch[1];
      }
    }
  }

  return all;
}

// ---------------------------------------------------------------------------
// Data fetchers
// ---------------------------------------------------------------------------

/**
 * Fetch all pages from Shopify Admin API.
 */
export async function fetchShopifyPages(
  domain: string,
  token: string,
): Promise<ShopifyPage[]> {
  const rawPages = await shopifyPaginateAll<any>(domain, token, 'pages.json', 'pages');

  const pages: ShopifyPage[] = [];
  for (const page of rawPages) {
    // Fetch metafields for SEO data
    let metafields: ShopifyMetafield[] = [];
    try {
      const metaResp = await shopifyAdminFetch<{ metafields: any[] }>(
        domain, token, `pages/${page.id}/metafields.json`,
      );
      metafields = (metaResp.metafields || []).map(mapMetafield);
    } catch {
      // Metafields are optional
    }

    pages.push({
      id: page.id,
      title: page.title,
      handle: page.handle,
      bodyHtml: page.body_html || '',
      author: page.author || '',
      createdAt: page.created_at,
      updatedAt: page.updated_at,
      publishedAt: page.published_at,
      templateSuffix: page.template_suffix,
      metafields,
      blocks: parseShopifyHtmlToBlocks(page.body_html || ''),
    });
  }

  return pages;
}

/**
 * Fetch all products from Shopify Admin API.
 */
export async function fetchShopifyProducts(
  domain: string,
  token: string,
): Promise<ShopifyProduct[]> {
  const rawProducts = await shopifyPaginateAll<any>(domain, token, 'products.json', 'products');

  return rawProducts.map((p) => ({
    id: p.id,
    title: p.title,
    handle: p.handle,
    bodyHtml: p.body_html || '',
    vendor: p.vendor || '',
    productType: p.product_type || '',
    status: p.status,
    tags: typeof p.tags === 'string' ? p.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    images: (p.images || []).map((img: any) => ({
      id: img.id,
      src: img.src,
      alt: img.alt,
      width: img.width,
      height: img.height,
    })),
    variants: (p.variants || []).map((v: any) => ({
      id: v.id,
      title: v.title,
      price: v.price,
      sku: v.sku || '',
      inventoryQuantity: v.inventory_quantity || 0,
      weight: v.weight || 0,
      weightUnit: v.weight_unit || 'kg',
    })),
    metafields: [],
  }));
}

/**
 * Fetch blog posts (articles) from Shopify Admin API.
 */
export async function fetchShopifyArticles(
  domain: string,
  token: string,
): Promise<ShopifyArticle[]> {
  // First, get all blogs
  const blogsResp = await shopifyAdminFetch<{ blogs: any[] }>(domain, token, 'blogs.json');
  const blogs = blogsResp.blogs || [];

  const articles: ShopifyArticle[] = [];

  for (const blog of blogs) {
    const rawArticles = await shopifyPaginateAll<any>(
      domain, token, `blogs/${blog.id}/articles.json`, 'articles',
    );

    for (const article of rawArticles) {
      let metafields: ShopifyMetafield[] = [];
      try {
        const metaResp = await shopifyAdminFetch<{ metafields: any[] }>(
          domain, token, `articles/${article.id}/metafields.json`,
        );
        metafields = (metaResp.metafields || []).map(mapMetafield);
      } catch {
        // Optional
      }

      articles.push({
        id: article.id,
        title: article.title,
        handle: article.handle,
        bodyHtml: article.body_html || '',
        author: article.author || '',
        tags: typeof article.tags === 'string'
          ? article.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
          : [],
        summaryHtml: article.summary_html || '',
        blogId: blog.id,
        blogHandle: blog.handle,
        createdAt: article.created_at,
        publishedAt: article.published_at,
        imageUrl: article.image?.src || null,
        metafields,
        blocks: parseShopifyHtmlToBlocks(article.body_html || ''),
      });
    }
  }

  return articles;
}

/**
 * Fetch the active theme and extract section data and design tokens.
 */
export async function fetchShopifyTheme(
  domain: string,
  token: string,
): Promise<ShopifyThemeData> {
  // Get the main/active theme
  const themesResp = await shopifyAdminFetch<{ themes: any[] }>(domain, token, 'themes.json');
  const mainTheme = (themesResp.themes || []).find((t: any) => t.role === 'main');

  if (!mainTheme) {
    return { name: 'unknown', role: 'main', sections: [], tokens: {} };
  }

  // Fetch settings_data.json from the theme asset
  let settingsData: Record<string, any> = {};
  try {
    const assetResp = await shopifyAdminFetch<{ asset: { value: string } }>(
      domain, token,
      `themes/${mainTheme.id}/assets.json?asset[key]=config/settings_data.json`,
    );
    settingsData = JSON.parse(assetResp.asset.value);
  } catch {
    // Theme settings might not be accessible
  }

  // Extract sections from the current preset
  const sections: ShopifySection[] = [];
  const currentPreset = settingsData.current || {};
  const sectionsData = currentPreset.sections || {};

  for (const [sectionId, sectionConfig] of Object.entries(sectionsData) as [string, any][]) {
    sections.push({
      id: sectionId,
      type: sectionConfig.type || sectionId,
      settings: sectionConfig.settings || {},
      blocks: sectionConfig.blocks || {},
      blockOrder: sectionConfig.block_order || Object.keys(sectionConfig.blocks || {}),
    });
  }

  // Extract theme tokens from settings
  const tokens = extractShopifyThemeTokens(currentPreset);

  return {
    name: mainTheme.name,
    role: mainTheme.role,
    sections,
    tokens,
  };
}

/**
 * Fetch navigation menus via Shopify Storefront API (GraphQL).
 */
export async function fetchShopifyMenus(
  domain: string,
  storefrontToken: string,
): Promise<MenuItem[]> {
  const query = `
    {
      menu(handle: "main-menu") {
        items {
          id
          title
          url
          type
          items {
            id
            title
            url
            type
            items {
              id
              title
              url
              type
            }
          }
        }
      }
    }
  `;

  const response = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Storefront-Access-Token': storefrontToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json() as any;
  const menuItems = data?.data?.menu?.items || [];

  function mapMenuItem(item: any): MenuItem {
    return {
      id: item.id,
      title: item.title,
      url: item.url || '',
      type: item.type || 'HTTP',
      children: (item.items || []).map(mapMenuItem),
    };
  }

  // Also try footer menu
  const footerQuery = `
    {
      menu(handle: "footer") {
        items {
          id
          title
          url
          type
          items {
            id
            title
            url
            type
          }
        }
      }
    }
  `;

  let footerItems: MenuItem[] = [];
  try {
    const footerResp = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Storefront-Access-Token': storefrontToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: footerQuery }),
    });
    if (footerResp.ok) {
      const footerData = await footerResp.json() as any;
      footerItems = (footerData?.data?.menu?.items || []).map(mapMenuItem);
    }
  } catch {
    // Footer menu is optional
  }

  return [...menuItems.map(mapMenuItem), ...footerItems];
}

/**
 * Fetch URL redirects from Shopify Admin API.
 */
export async function fetchShopifyRedirects(
  domain: string,
  token: string,
): Promise<ShopifyRedirect[]> {
  const rawRedirects = await shopifyPaginateAll<any>(
    domain, token, 'redirects.json', 'redirects',
  );

  return rawRedirects.map((r) => ({
    id: r.id,
    path: r.path,
    target: r.target,
  }));
}

// ---------------------------------------------------------------------------
// Section / block mapping
// ---------------------------------------------------------------------------

/**
 * Map Shopify Online Store 2.0 section types to CMS block types.
 */
export function mapShopifySection(sectionType: string): string {
  const mapping: Record<string, string> = {
    // Common Dawn / theme sections
    'hero-banner': 'hero',
    'image-banner': 'hero',
    'slideshow': 'gallery',
    'rich-text': 'text',
    'image-with-text': 'feature_grid',
    'featured-collection': 'product_grid',
    'collection-list': 'product_grid',
    'featured-product': 'product_grid',
    'multicolumn': 'feature_grid',
    'multi-column': 'feature_grid',
    'collapsible-content': 'custom',
    'collapsible_content': 'custom',
    'newsletter': 'cta',
    'email-signup-banner': 'cta',
    'video': 'custom',
    'video-hero': 'hero',
    'contact-form': 'custom',
    'custom-liquid': 'custom',
    'blog-posts': 'text',
    'featured-blog': 'text',
    'logo-list': 'gallery',
    'testimonials': 'testimonial',
    'announcement-bar': 'custom',
    'header': 'custom',
    'footer': 'custom',
    'image-gallery': 'gallery',
    'before-after-image': 'gallery',
    'countdown': 'custom',
    'map': 'custom',
  };

  // Normalize: lowercase and replace underscores with hyphens
  const normalized = sectionType.toLowerCase().replace(/_/g, '-');
  return mapping[normalized] || 'custom';
}

/**
 * Extract theme design tokens from Shopify settings_data.json.
 */
export function extractShopifyThemeTokens(
  settingsData: Record<string, unknown>,
): Partial<ThemeTokens> {
  // Theme settings can be in settingsData directly or under a "current" key
  const settings = (settingsData as any)?.settings || settingsData;

  const tokens: Partial<ThemeTokens> = {};

  // Color mappings (Dawn theme / common patterns)
  if (settings.colors_solid_button_labels) tokens.colorPrimary = settings.colors_solid_button_labels;
  if (settings.colors_accent_1) tokens.colorAccent = settings.colors_accent_1;
  if (settings.color_schemes) {
    // OS 2.0 color scheme format
    const schemes = settings.color_schemes;
    const defaultScheme = schemes?.['scheme-1']?.settings || schemes?.['scheme_1']?.settings;
    if (defaultScheme) {
      if (defaultScheme.background) tokens.colorBackground = defaultScheme.background;
      if (defaultScheme.text) tokens.colorText = defaultScheme.text;
      if (defaultScheme.button) tokens.colorPrimary = defaultScheme.button;
      if (defaultScheme.accent) tokens.colorAccent = defaultScheme.accent;
      if (defaultScheme.secondary_button) tokens.colorSecondary = defaultScheme.secondary_button;
    }
  }

  // Legacy color settings
  if (settings.color_primary) tokens.colorPrimary = settings.color_primary;
  if (settings.color_secondary) tokens.colorSecondary = settings.color_secondary;
  if (settings.color_body_bg) tokens.colorBackground = settings.color_body_bg;
  if (settings.color_body_text) tokens.colorText = settings.color_body_text;
  if (settings.color_accent) tokens.colorAccent = settings.color_accent;

  // Font mappings
  if (settings.type_header_font) {
    const headerFont = parseShopifyFont(settings.type_header_font);
    if (headerFont) tokens.fontHeading = headerFont;
  }
  if (settings.type_body_font) {
    const bodyFont = parseShopifyFont(settings.type_body_font);
    if (bodyFont) tokens.fontBody = bodyFont;
  }

  // Button style
  if (settings.buttons_radius) {
    const radius = parseInt(String(settings.buttons_radius), 10);
    tokens.borderRadius = `${radius}px`;
  }
  if (settings.buttons_border_width != null) {
    tokens.buttonStyle = parseInt(String(settings.buttons_border_width), 10) > 0
      ? 'outlined' : 'filled';
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapMetafield(mf: any): ShopifyMetafield {
  return {
    namespace: mf.namespace,
    key: mf.key,
    value: typeof mf.value === 'string' ? mf.value : JSON.stringify(mf.value),
    type: mf.type || mf.value_type || 'string',
  };
}

/**
 * Parse Shopify font picker value (e.g., "assistant_n4" → "Assistant")
 */
function parseShopifyFont(fontValue: string): string | null {
  if (!fontValue || typeof fontValue !== 'string') return null;
  // Format is "family_name_nWeight" e.g., "assistant_n4", "montserrat_n7"
  const parts = fontValue.split('_n');
  if (parts.length >= 1) {
    return parts[0]
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  return fontValue;
}

/**
 * Parse Shopify page/article body HTML into CMS blocks.
 * Shopify content is usually simpler HTML without a block system.
 */
function parseShopifyHtmlToBlocks(html: string): MappedBlock[] {
  if (!html || !html.trim()) return [];

  const blocks: MappedBlock[] = [];
  // Split on major structural elements
  const sections = html.split(/(?=<h[1-6][\s>])/gi);

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    // Check if section starts with a heading
    const headingMatch = trimmed.match(/^<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/i);
    if (headingMatch) {
      const level = parseInt(headingMatch[1], 10);
      const headingText = headingMatch[2].replace(/<[^>]+>/g, '').trim();
      const restContent = trimmed.slice(headingMatch[0].length).trim();

      blocks.push({
        type: 'text',
        content: {
          heading: headingText,
          headingLevel: level,
          body: restContent || headingText,
        },
        settings: {},
      });
    } else {
      // Check for images
      const imgMatch = trimmed.match(/<img[^>]+src="([^"]+)"[^>]*>/i);
      if (imgMatch && trimmed.replace(/<img[^>]+>/gi, '').replace(/<[^>]+>/g, '').trim().length < 20) {
        // Mostly an image
        const altMatch = trimmed.match(/alt="([^"]*)"/i);
        blocks.push({
          type: 'gallery',
          content: {
            images: [{ url: imgMatch[1], alt: altMatch ? altMatch[1] : '' }],
          },
          settings: {},
        });
      } else {
        blocks.push({
          type: 'text',
          content: { body: trimmed },
          settings: {},
        });
      }
    }
  }

  return blocks.length > 0 ? blocks : [{ type: 'text', content: { body: html }, settings: {} }];
}

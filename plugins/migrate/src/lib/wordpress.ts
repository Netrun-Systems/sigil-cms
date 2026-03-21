/**
 * WordPress ingestion engine
 *
 * Parses WordPress WXR (XML) export files and extracts pages, posts, media,
 * categories, tags, and navigation menus. Supports Gutenberg block markup
 * and Elementor JSON data.
 */

import { XMLParser } from 'fast-xml-parser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WPImportResult {
  pages: WPPage[];
  posts: WPPost[];
  media: WPMedia[];
  categories: WPCategory[];
  tags: WPTag[];
  menus: WPMenuItem[];
}

export interface WPPage {
  title: string;
  slug: string;
  content: string;
  status: string;
  template: string;
  parentId?: string;
  featuredImage?: string;
  seo: { title?: string; description?: string; ogImage?: string };
  customFields: Record<string, string>;
  blocks: MappedBlock[];
}

export interface WPPost extends WPPage {
  categories: string[];
  tags: string[];
  date: string;
  author: string;
}

export interface WPMedia {
  id: string;
  title: string;
  url: string;
  mimeType: string;
  altText?: string;
  caption?: string;
  description?: string;
}

export interface WPCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  description?: string;
}

export interface WPTag {
  id: string;
  name: string;
  slug: string;
}

export interface WPMenuItem {
  id: string;
  title: string;
  url: string;
  parentId?: string;
  order: number;
  menuName: string;
  objectType: string;
}

export interface MappedBlock {
  type: string;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// WXR XML parsing
// ---------------------------------------------------------------------------

/**
 * Parse a WordPress WXR (XML) export file and extract structured data.
 *
 * WXR uses these XML namespaces:
 *   wp:      — WordPress-specific elements (post_type, postmeta, etc.)
 *   content: — Post content (encoded CDATA)
 *   dc:      — Dublin Core (creator/author)
 *   excerpt: — Post excerpt
 */
export function parseWXR(xmlContent: string): WPImportResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    // WXR uses colons in tag names for namespaces
    // fast-xml-parser handles them as-is when we don't strip prefixes
    isArray: (name) => {
      // These elements can appear multiple times
      return [
        'item', 'wp:category', 'wp:tag', 'wp:term',
        'wp:postmeta', 'wp:comment', 'category',
      ].includes(name);
    },
    processEntities: true,
    htmlEntities: true,
    trimValues: true,
  });

  const parsed = parser.parse(xmlContent);
  const channel = parsed?.rss?.channel;
  if (!channel) {
    throw new Error('Invalid WXR file: missing rss/channel element');
  }

  const items: any[] = ensureArray(channel.item);
  const wpCategories: any[] = ensureArray(channel['wp:category']);
  const wpTags: any[] = ensureArray(channel['wp:tag']);
  const wpTerms: any[] = ensureArray(channel['wp:term']);

  // Extract categories
  const categories: WPCategory[] = wpCategories.map((cat) => ({
    id: String(cat['wp:term_id'] ?? ''),
    name: String(cat['wp:cat_name'] ?? ''),
    slug: String(cat['wp:category_nicename'] ?? ''),
    parentId: cat['wp:category_parent'] ? String(cat['wp:category_parent']) : undefined,
    description: cat['wp:category_description'] ? String(cat['wp:category_description']) : undefined,
  }));

  // Extract tags
  const tags: WPTag[] = wpTags.map((tag) => ({
    id: String(tag['wp:term_id'] ?? ''),
    name: String(tag['wp:tag_name'] ?? ''),
    slug: String(tag['wp:tag_slug'] ?? ''),
  }));

  // Also check wp:term elements for additional categories/tags
  for (const term of wpTerms) {
    const taxonomy = term['wp:term_taxonomy'];
    if (taxonomy === 'category' && !categories.find(c => c.slug === String(term['wp:term_slug']))) {
      categories.push({
        id: String(term['wp:term_id'] ?? ''),
        name: String(term['wp:term_name'] ?? ''),
        slug: String(term['wp:term_slug'] ?? ''),
        description: term['wp:term_description'] ? String(term['wp:term_description']) : undefined,
      });
    } else if (taxonomy === 'tag' && !tags.find(t => t.slug === String(term['wp:term_slug']))) {
      tags.push({
        id: String(term['wp:term_id'] ?? ''),
        name: String(term['wp:term_name'] ?? ''),
        slug: String(term['wp:term_slug'] ?? ''),
      });
    }
  }

  const pages: WPPage[] = [];
  const posts: WPPost[] = [];
  const mediaItems: WPMedia[] = [];
  const menus: WPMenuItem[] = [];

  // Build a map of post IDs → attachment URLs for featured images
  const attachmentUrlMap = new Map<string, string>();

  // First pass: collect attachments and nav_menu_items
  for (const item of items) {
    const postType = String(item['wp:post_type'] ?? 'post');
    const postId = String(item['wp:post_id'] ?? '');

    if (postType === 'attachment') {
      const url = String(item['wp:attachment_url'] ?? item.guid ?? '');
      attachmentUrlMap.set(postId, url);

      mediaItems.push({
        id: postId,
        title: String(item.title ?? ''),
        url,
        mimeType: String(item['wp:post_mime_type'] ?? 'application/octet-stream'),
        altText: getPostMeta(item, '_wp_attachment_image_alt'),
        caption: item['excerpt:encoded'] ? String(item['excerpt:encoded']) : undefined,
        description: item['content:encoded'] ? String(item['content:encoded']) : undefined,
      });
    }

    if (postType === 'nav_menu_item') {
      const menuTerms = ensureArray(item.category);
      const menuName = menuTerms.find((c: any) =>
        c['@_domain'] === 'nav_menu'
      );

      menus.push({
        id: postId,
        title: String(item.title ?? ''),
        url: getPostMeta(item, '_menu_item_url') || String(item.link ?? ''),
        parentId: getPostMeta(item, '_menu_item_menu_item_parent') || undefined,
        order: parseInt(String(item['wp:menu_order'] ?? '0'), 10),
        menuName: menuName ? String(menuName['#text'] ?? menuName) : 'main',
        objectType: getPostMeta(item, '_menu_item_object') || 'custom',
      });
    }
  }

  // Second pass: process pages and posts
  for (const item of items) {
    const postType = String(item['wp:post_type'] ?? 'post');
    if (postType === 'attachment' || postType === 'nav_menu_item' || postType === 'revision') {
      continue;
    }

    const rawContent = String(item['content:encoded'] ?? '');
    const postMeta = extractAllPostMeta(item);
    const thumbnailId = postMeta['_thumbnail_id'];
    const featuredImage = thumbnailId ? attachmentUrlMap.get(thumbnailId) : undefined;

    // Extract SEO metadata (Yoast SEO or RankMath)
    const seo = {
      title: postMeta['_yoast_wpseo_title'] || postMeta['rank_math_title'] || undefined,
      description: postMeta['_yoast_wpseo_metadesc'] || postMeta['rank_math_description'] || undefined,
      ogImage: postMeta['_yoast_wpseo_opengraph-image'] || postMeta['rank_math_facebook_image'] || undefined,
    };

    // Parse content into CMS blocks
    let blocks: MappedBlock[];

    // Check for Elementor data
    const elementorData = postMeta['_elementor_data'];
    if (elementorData) {
      blocks = parseElementorData(elementorData);
    } else {
      blocks = parseGutenbergBlocks(rawContent);
    }

    // Remove internal WP meta keys from custom fields
    const customFields: Record<string, string> = {};
    for (const [key, value] of Object.entries(postMeta)) {
      if (!key.startsWith('_') && !key.startsWith('rank_math')) {
        customFields[key] = value;
      }
    }

    const wpStatus = String(item['wp:status'] ?? 'draft');
    const cmsStatus = wpStatus === 'publish' ? 'published' : 'draft';

    const pageData: WPPage = {
      title: String(item.title ?? ''),
      slug: String(item['wp:post_name'] ?? ''),
      content: rawContent,
      status: cmsStatus,
      template: postMeta['_wp_page_template'] || 'default',
      parentId: item['wp:post_parent'] && String(item['wp:post_parent']) !== '0'
        ? String(item['wp:post_parent'])
        : undefined,
      featuredImage,
      seo,
      customFields,
      blocks,
    };

    if (postType === 'page') {
      pages.push(pageData);
    } else {
      // Posts (including custom post types)
      const itemCategories = ensureArray(item.category)
        .filter((c: any) => c['@_domain'] === 'category')
        .map((c: any) => String(c['#text'] ?? c));

      const itemTags = ensureArray(item.category)
        .filter((c: any) => c['@_domain'] === 'post_tag')
        .map((c: any) => String(c['#text'] ?? c));

      posts.push({
        ...pageData,
        categories: itemCategories,
        tags: itemTags,
        date: String(item['wp:post_date'] ?? item.pubDate ?? ''),
        author: String(item['dc:creator'] ?? ''),
      });
    }
  }

  return { pages, posts, media: mediaItems, categories, tags, menus };
}

// ---------------------------------------------------------------------------
// Gutenberg block parsing
// ---------------------------------------------------------------------------

/**
 * Parse Gutenberg block markup (<!-- wp:blockname {attrs} --> ... <!-- /wp:blockname -->)
 * into CMS blocks. Also handles classic editor content (plain HTML without block markers).
 */
export function parseGutenbergBlocks(content: string): MappedBlock[] {
  if (!content || !content.trim()) return [];

  const blocks: MappedBlock[] = [];

  // Check if content uses Gutenberg blocks
  const hasBlocks = content.includes('<!-- wp:');

  if (!hasBlocks) {
    // Classic editor content — treat as a single rich-text block
    const trimmed = content.trim();
    if (trimmed) {
      blocks.push({
        type: 'text',
        content: { body: trimmed },
        settings: {},
      });
    }
    return blocks;
  }

  // Match top-level Gutenberg blocks (including self-closing ones)
  // Self-closing: <!-- wp:spacer {"height":"40px"} /-->
  // Container: <!-- wp:heading {"level":2} --><h2>...</h2><!-- /wp:heading -->
  const blockRegex = /<!-- wp:(\S+)\s*(\{[^}]*\})?\s*\/?-->([\s\S]*?)(?:<!-- \/wp:\1 -->)?/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = blockRegex.exec(content)) !== null) {
    // Capture any text between blocks as plain text
    const textBefore = content.slice(lastIndex, match.index).trim();
    if (textBefore) {
      blocks.push({
        type: 'text',
        content: { body: textBefore },
        settings: {},
      });
    }

    const wpBlockName = match[1];
    const attrsJson = match[2] || '{}';
    const innerContent = (match[3] || '').trim();

    let attrs: Record<string, unknown> = {};
    try {
      attrs = JSON.parse(attrsJson);
    } catch {
      // Malformed JSON in block attributes — ignore
    }

    const cmsBlockType = mapBlockType(wpBlockName);
    const mapped = mapBlockContent(wpBlockName, cmsBlockType, attrs, innerContent);
    blocks.push(mapped);

    lastIndex = match.index + match[0].length;
  }

  // Capture trailing text
  const trailing = content.slice(lastIndex).trim();
  if (trailing && !trailing.startsWith('<!--')) {
    blocks.push({
      type: 'text',
      content: { body: trailing },
      settings: {},
    });
  }

  return blocks;
}

/**
 * Map a WordPress Gutenberg block type name to a CMS block type.
 */
export function mapBlockType(wpBlockName: string): string {
  // Strip namespace if present (e.g., "core/heading" → "heading")
  const name = wpBlockName.includes('/') ? wpBlockName.split('/').pop()! : wpBlockName;

  const mapping: Record<string, string> = {
    // Text blocks
    'heading': 'text',
    'paragraph': 'text',
    'list': 'text',
    'quote': 'testimonial',
    'preformatted': 'text',
    'verse': 'text',
    'pullquote': 'testimonial',

    // Media blocks
    'image': 'gallery',
    'gallery': 'gallery',
    'cover': 'hero',
    'video': 'custom',
    'audio': 'custom',
    'file': 'custom',
    'media-text': 'feature_grid',

    // Layout blocks
    'columns': 'feature_grid',
    'column': 'text',
    'group': 'text',
    'separator': 'custom',
    'spacer': 'custom',

    // Interactive blocks
    'buttons': 'cta',
    'button': 'cta',
    'table': 'text',
    'code': 'custom',
    'html': 'custom',

    // Embeds
    'embed': 'custom',
    'youtube': 'custom',
    'vimeo': 'custom',
    'twitter': 'custom',
    'instagram': 'custom',
    'soundcloud': 'custom',
    'spotify': 'custom',

    // WooCommerce blocks
    'woocommerce/featured-product': 'product_grid',
    'woocommerce/product-grid': 'product_grid',
    'woocommerce/all-products': 'product_grid',

    // Common third-party
    'contact-form-7': 'custom',
    'wpforms': 'custom',
    'gravityforms': 'custom',
  };

  return mapping[name] || mapping[wpBlockName] || 'custom';
}

/**
 * Map WordPress block content and attributes to CMS block content structure.
 */
function mapBlockContent(
  wpBlockName: string,
  cmsType: string,
  attrs: Record<string, unknown>,
  innerContent: string,
): MappedBlock {
  const name = wpBlockName.includes('/') ? wpBlockName.split('/').pop()! : wpBlockName;

  switch (name) {
    case 'heading': {
      const level = (attrs.level as number) || 2;
      // Strip HTML tags to get plain heading text
      const text = stripHtml(innerContent);
      return {
        type: 'text',
        content: { body: innerContent || text, heading: text, headingLevel: level },
        settings: { textAlign: attrs.textAlign as string },
      };
    }

    case 'paragraph': {
      return {
        type: 'text',
        content: { body: innerContent },
        settings: {
          textAlign: attrs.textAlign as string,
          fontSize: attrs.fontSize as string,
        },
      };
    }

    case 'image': {
      return {
        type: 'gallery',
        content: {
          images: [{
            url: (attrs.url as string) || extractImageUrl(innerContent),
            alt: (attrs.alt as string) || extractImageAlt(innerContent),
            caption: attrs.caption as string,
          }],
        },
        settings: {
          width: attrs.width as string,
          alignment: attrs.align as string,
        },
      };
    }

    case 'gallery': {
      const images = ((attrs.images as any[]) || []).map((img) => ({
        url: img.url || img.fullUrl,
        alt: img.alt || '',
        caption: img.caption || '',
      }));
      // If no images in attrs, try to parse from inner HTML
      if (images.length === 0) {
        const imgRegex = /<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/g;
        let imgMatch;
        while ((imgMatch = imgRegex.exec(innerContent)) !== null) {
          images.push({ url: imgMatch[1], alt: imgMatch[2], caption: '' });
        }
      }
      return {
        type: 'gallery',
        content: { images, columns: (attrs.columns as number) || 3 },
        settings: {},
      };
    }

    case 'cover': {
      return {
        type: 'hero',
        content: {
          heading: stripHtml(innerContent),
          backgroundImage: attrs.url as string,
          overlayColor: attrs.overlayColor as string,
          overlayOpacity: attrs.dimRatio != null ? (attrs.dimRatio as number) / 100 : 0.5,
          body: innerContent,
        },
        settings: {
          minHeight: attrs.minHeight as string,
          alignment: attrs.contentPosition as string,
        },
      };
    }

    case 'buttons':
    case 'button': {
      const buttonText = stripHtml(innerContent);
      const linkMatch = innerContent.match(/href="([^"]+)"/);
      return {
        type: 'cta',
        content: {
          buttonText: buttonText || 'Click Here',
          buttonUrl: linkMatch ? linkMatch[1] : '#',
          body: '',
        },
        settings: {
          alignment: attrs.align as string,
        },
      };
    }

    case 'columns': {
      // Parse inner columns — each column becomes a feature item
      const columnBlocks = parseGutenbergBlocks(innerContent);
      return {
        type: 'feature_grid',
        content: {
          features: columnBlocks.map((block, idx) => ({
            title: `Column ${idx + 1}`,
            description: typeof block.content.body === 'string' ? stripHtml(block.content.body) : '',
            rawContent: block.content,
          })),
          columns: (attrs.columns as number) || columnBlocks.length || 2,
        },
        settings: {},
      };
    }

    case 'quote':
    case 'pullquote': {
      const citation = attrs.citation as string || '';
      return {
        type: 'testimonial',
        content: {
          quote: stripHtml(innerContent.replace(/<cite>.*<\/cite>/gi, '')),
          author: stripHtml(citation) || extractCitation(innerContent),
        },
        settings: {},
      };
    }

    case 'list': {
      return {
        type: 'text',
        content: {
          body: innerContent,
          listType: attrs.ordered ? 'ol' : 'ul',
        },
        settings: {},
      };
    }

    case 'code': {
      return {
        type: 'custom',
        content: {
          widgetType: 'code_block',
          code: stripHtml(innerContent),
          language: attrs.language as string,
        },
        settings: {},
      };
    }

    case 'embed': {
      return {
        type: 'custom',
        content: {
          widgetType: 'embed',
          url: attrs.url as string,
          providerName: attrs.providerNameSlug as string,
          embedType: attrs.type as string,
        },
        settings: {},
      };
    }

    case 'media-text': {
      return {
        type: 'feature_grid',
        content: {
          features: [{
            title: '',
            description: stripHtml(innerContent),
            image: attrs.mediaUrl as string,
          }],
          mediaPosition: attrs.mediaPosition as string || 'left',
        },
        settings: {},
      };
    }

    case 'table': {
      return {
        type: 'text',
        content: { body: innerContent, isTable: true },
        settings: {},
      };
    }

    default: {
      return {
        type: cmsType,
        content: {
          widgetType: wpBlockName,
          body: innerContent,
          attrs,
        },
        settings: {},
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Elementor parsing
// ---------------------------------------------------------------------------

/**
 * Parse Elementor JSON data (from _elementor_data postmeta) into CMS blocks.
 *
 * Elementor stores pages as a nested tree:
 *   sections → columns → widgets
 *
 * Each widget has an elType, widgetType, and settings object.
 */
export function parseElementorData(jsonString: string): MappedBlock[] {
  let data: any[];
  try {
    data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
  } catch {
    return [{ type: 'text', content: { body: jsonString }, settings: {} }];
  }

  if (!Array.isArray(data)) return [];

  const blocks: MappedBlock[] = [];

  function walkElements(elements: any[]) {
    for (const el of elements) {
      if (el.elType === 'widget') {
        const mapped = mapElementorWidget(el.widgetType, el.settings || {});
        if (mapped) blocks.push(mapped);
      }

      // Recurse into sections and columns
      if (el.elements && Array.isArray(el.elements)) {
        walkElements(el.elements);
      }
    }
  }

  walkElements(data);
  return blocks;
}

/**
 * Map an Elementor widget to a CMS block.
 */
function mapElementorWidget(widgetType: string, settings: Record<string, any>): MappedBlock | null {
  switch (widgetType) {
    case 'heading':
      return {
        type: 'text',
        content: {
          heading: settings.title || '',
          headingLevel: parseInt(settings.header_size?.replace('h', '') || '2', 10),
          body: settings.title || '',
        },
        settings: { textAlign: settings.align },
      };

    case 'text-editor':
    case 'text':
      return {
        type: 'text',
        content: { body: settings.editor || '' },
        settings: { textAlign: settings.align },
      };

    case 'image':
      return {
        type: 'gallery',
        content: {
          images: [{
            url: settings.image?.url || '',
            alt: settings.image?.alt || settings.caption || '',
          }],
        },
        settings: { width: settings.image_size },
      };

    case 'image-gallery':
    case 'image-carousel':
      return {
        type: 'gallery',
        content: {
          images: (settings.gallery || []).map((img: any) => ({
            url: img.url || '',
            alt: img.alt || '',
          })),
          columns: settings.gallery_columns || 3,
        },
        settings: {},
      };

    case 'video':
      return {
        type: 'custom',
        content: {
          widgetType: 'embed',
          url: settings.youtube_url || settings.vimeo_url || settings.hosted_url?.url || '',
        },
        settings: {},
      };

    case 'button':
    case 'cta':
      return {
        type: 'cta',
        content: {
          buttonText: settings.text || settings.button_text || 'Click Here',
          buttonUrl: settings.link?.url || settings.button_link?.url || '#',
          body: settings.description || '',
        },
        settings: { alignment: settings.align },
      };

    case 'icon-list':
    case 'icon-box':
      return {
        type: 'feature_grid',
        content: {
          features: [{
            title: settings.title_text || '',
            description: settings.description_text || '',
            icon: settings.selected_icon?.value || '',
          }],
        },
        settings: {},
      };

    case 'testimonial':
    case 'testimonial-carousel':
      return {
        type: 'testimonial',
        content: {
          quote: settings.testimonial_content || '',
          author: settings.testimonial_name || '',
          role: settings.testimonial_job || '',
        },
        settings: {},
      };

    case 'accordion':
    case 'toggle':
      return {
        type: 'custom',
        content: {
          widgetType: 'faq',
          items: (settings.tabs || []).map((tab: any) => ({
            question: tab.tab_title || '',
            answer: tab.tab_content || '',
          })),
        },
        settings: {},
      };

    case 'counter':
    case 'progress':
      return {
        type: 'custom',
        content: {
          widgetType: widgetType,
          title: settings.title || '',
          value: settings.ending_number || settings.percent?.size || 0,
          suffix: settings.suffix || '',
        },
        settings: {},
      };

    case 'form':
      return {
        type: 'custom',
        content: {
          widgetType: 'form',
          formName: settings.form_name || 'Contact Form',
          fields: (settings.form_fields || []).map((f: any) => ({
            label: f.field_label,
            type: f.field_type,
            required: f.required === 'true',
          })),
        },
        settings: {},
      };

    case 'google-maps':
    case 'map':
      return {
        type: 'custom',
        content: {
          widgetType: 'map',
          address: settings.address || '',
          zoom: settings.zoom?.size || 14,
        },
        settings: {},
      };

    case 'spacer':
    case 'divider':
      return {
        type: 'custom',
        content: { widgetType: widgetType },
        settings: { height: settings.space?.size ? `${settings.space.size}px` : undefined },
      };

    case 'social-icons':
      return {
        type: 'custom',
        content: {
          widgetType: 'social_links',
          links: (settings.social_icon_list || []).map((item: any) => ({
            platform: item.social_icon?.value || '',
            url: item.link?.url || '',
          })),
        },
        settings: {},
      };

    default:
      return {
        type: 'custom',
        content: {
          widgetType,
          body: settings.editor || settings.html || settings.title || '',
          attrs: settings,
        },
        settings: {},
      };
  }
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function ensureArray<T>(val: T | T[] | undefined | null): T[] {
  if (val == null) return [];
  return Array.isArray(val) ? val : [val];
}

/**
 * Extract a single postmeta value from a WXR item node.
 */
function getPostMeta(item: any, key: string): string | undefined {
  const metas = ensureArray(item['wp:postmeta']);
  const found = metas.find((m: any) => String(m['wp:meta_key']) === key);
  return found ? String(found['wp:meta_value'] ?? '') : undefined;
}

/**
 * Extract all postmeta key-value pairs from a WXR item node.
 */
function extractAllPostMeta(item: any): Record<string, string> {
  const metas = ensureArray(item['wp:postmeta']);
  const result: Record<string, string> = {};
  for (const meta of metas) {
    const key = String(meta['wp:meta_key'] ?? '');
    const value = String(meta['wp:meta_value'] ?? '');
    if (key) result[key] = value;
  }
  return result;
}

/**
 * Strip HTML tags from a string.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

/**
 * Extract image URL from an <img> tag in HTML.
 */
function extractImageUrl(html: string): string {
  const match = html.match(/src="([^"]+)"/);
  return match ? match[1] : '';
}

/**
 * Extract alt text from an <img> tag in HTML.
 */
function extractImageAlt(html: string): string {
  const match = html.match(/alt="([^"]+)"/);
  return match ? match[1] : '';
}

/**
 * Extract citation text from a <cite> tag.
 */
function extractCitation(html: string): string {
  const match = html.match(/<cite>(.*?)<\/cite>/i);
  return match ? stripHtml(match[1]) : '';
}

/**
 * @sigil-cms/client
 *
 * TypeScript SDK for Sigil CMS. Zero runtime dependencies.
 * Works in Node.js, browsers, and edge runtimes (Cloudflare Workers, Vercel Edge).
 *
 * @example
 * ```ts
 * import { createClient } from '@sigil-cms/client';
 *
 * const client = createClient({
 *   baseUrl: 'https://cms.example.com',
 *   siteSlug: 'my-site',
 * });
 *
 * const page = await client.pages.getBySlug('about');
 * ```
 *
 * @packageDocumentation
 */

// Main client
export { SigilClient, createClient } from './client.js';

// Error types
export { SigilError, SigilNetworkError, SigilTimeoutError } from './errors.js';

// Resource classes (for advanced typing)
export { PagesResource } from './resources/pages.js';
export { MediaResource } from './resources/media.js';
export { SitesResource } from './resources/sites.js';
export { BlocksResource } from './resources/blocks.js';
export { ThemesResource } from './resources/themes.js';

// All types
export type {
  // Config
  SigilConfig,

  // Pagination
  PaginationParams,
  PaginatedResponse,

  // API envelope
  ApiResponse,
  ApiListResponse,
  ApiErrorResponse,

  // Site
  Site,
  SiteStatus,
  SiteSettings,
  PublicSiteInfo,

  // Page
  Page,
  PageWithBlocks,
  PageStatus,
  PageTemplate,
  PublicPageInfo,
  PageTreeNode,
  PageListParams,

  // Content Block
  ContentBlock,
  BlockType,
  BlockSettings,
  BlockTypeDescriptor,
  BlockListParams,
  BlockTypeListParams,

  // Media
  MediaItem,
  MediaMetadata,
  MediaFolder,
  MediaListParams,

  // Theme
  Theme,
  ThemeTokens,
  ThemeListParams,

  // Revision
  PageRevision,

  // Navigation
  NavigationItem,
  LanguagesResponse,
} from './types.js';

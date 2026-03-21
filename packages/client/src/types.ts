/**
 * @sigil-cms/client — Type definitions
 *
 * These types mirror the Sigil CMS API responses. They are intentionally
 * self-contained (no dependency on @netrun-cms/core) so the client SDK
 * has zero workspace dependencies and works standalone in any project.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface SigilConfig {
  /** Base URL of the Sigil CMS instance (e.g. "https://cms.example.com") */
  baseUrl: string;
  /** Site ID (UUID) for authenticated API requests */
  siteId?: string;
  /** Site slug for public API requests */
  siteSlug?: string;
  /** API key or JWT for authenticated requests */
  apiKey?: string;
  /** Default request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Custom fetch implementation (for testing or polyfills) */
  fetch?: typeof globalThis.fetch;
  /** Default headers to include in every request */
  headers?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ---------------------------------------------------------------------------
// API Response Envelope
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    [key: string]: unknown;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ---------------------------------------------------------------------------
// Site
// ---------------------------------------------------------------------------

export type SiteStatus = 'draft' | 'published' | 'archived';

export interface SiteSettings {
  favicon?: string;
  logo?: string;
  logoDark?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
    youtube?: string;
  };
  analytics?: {
    googleAnalyticsId?: string;
    clarityId?: string;
    hotjarId?: string;
  };
  seo?: {
    titleTemplate?: string;
    defaultDescription?: string;
    defaultImage?: string;
  };
}

export interface Site {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  domain?: string;
  defaultLanguage: string;
  status: SiteStatus;
  settings: SiteSettings;
  createdAt: string;
  updatedAt: string;
}

/** Lightweight site info returned by public /sites/by-domain endpoint */
export interface PublicSiteInfo {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  defaultLanguage: string;
  status: SiteStatus;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export type PageStatus = 'draft' | 'published' | 'scheduled' | 'archived';
export type PageTemplate = 'default' | 'landing' | 'blog' | 'product' | 'contact' | 'artist';

export interface Page {
  id: string;
  siteId: string;
  parentId?: string | null;
  title: string;
  slug: string;
  fullPath?: string;
  status: PageStatus;
  publishedAt?: string | null;
  language: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
  template: PageTemplate;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PageWithBlocks extends Page {
  blocks: ContentBlock[];
}

/** Lightweight page info returned by public navigation endpoint */
export interface PublicPageInfo {
  id: string;
  title: string;
  slug: string;
  fullPath?: string;
  status: PageStatus;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
  template: PageTemplate;
  sortOrder: number;
}

/** Hierarchical page node for tree views */
export interface PageTreeNode extends PublicPageInfo {
  children: PageTreeNode[];
}

// ---------------------------------------------------------------------------
// Content Block
// ---------------------------------------------------------------------------

export type BlockType =
  | 'hero' | 'text' | 'rich_text' | 'image' | 'gallery' | 'video'
  | 'cta' | 'feature_grid' | 'pricing_table' | 'testimonial' | 'faq'
  | 'contact_form' | 'code_block' | 'bento_grid' | 'stats_bar'
  | 'timeline' | 'newsletter' | 'custom'
  | 'embed_player' | 'release_list' | 'event_list'
  | 'social_links' | 'link_tree' | 'artist_bio';

export interface ContentBlock {
  id: string;
  pageId: string;
  blockType: BlockType;
  content: Record<string, unknown>;
  settings: BlockSettings;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlockSettings {
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'transparent' | 'primary' | 'secondary' | 'surface' | 'gradient';
  width?: 'full' | 'container' | 'narrow';
  animation?: 'none' | 'fade' | 'slide' | 'scale';
  customClass?: string;
}

export interface BlockTypeDescriptor {
  type: string;
  label: string;
  description: string;
  category: 'layout' | 'content' | 'media' | 'interactive' | 'artist';
  icon: string;
  defaultContent: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export interface MediaItem {
  id: string;
  siteId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string | null;
  altText?: string | null;
  caption?: string | null;
  folder: string;
  metadata: MediaMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
}

export interface MediaFolder {
  folder: string;
  count: number;
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export interface Theme {
  id: string;
  siteId: string;
  name: string;
  isActive: boolean;
  baseTheme: string;
  tokens: ThemeTokens;
  customCss?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeTokens {
  colors: Record<string, string>;
  typography: Record<string, string | number>;
  spacing?: Record<string, string>;
  effects?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Revision
// ---------------------------------------------------------------------------

export interface PageRevision {
  id: string;
  pageId: string;
  revisionNumber: number;
  title: string;
  slug: string;
  status: PageStatus;
  contentSnapshot?: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
}

// ---------------------------------------------------------------------------
// Languages
// ---------------------------------------------------------------------------

export interface LanguagesResponse {
  defaultLanguage: string;
  languages: string[];
}

// ---------------------------------------------------------------------------
// Navigation (convenience)
// ---------------------------------------------------------------------------

export interface NavigationItem {
  id: string;
  title: string;
  slug: string;
  fullPath?: string;
  sortOrder: number;
  children: NavigationItem[];
}

// ---------------------------------------------------------------------------
// List Filter Params
// ---------------------------------------------------------------------------

export interface PageListParams extends PaginationParams {
  status?: PageStatus;
  language?: string;
  parentId?: string;
}

export interface MediaListParams extends PaginationParams {
  folder?: string;
  mimeType?: string;
  search?: string;
}

export interface ThemeListParams extends PaginationParams {
  baseTheme?: string;
  isActive?: boolean;
}

export interface BlockListParams extends PaginationParams {
  blockType?: BlockType;
  isVisible?: boolean;
}

export interface BlockTypeListParams {
  category?: 'layout' | 'content' | 'media' | 'interactive' | 'artist';
}

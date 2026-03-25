/**
 * @netrun-cms/core - Core types and utilities for NetrunCMS
 *
 * This package provides shared types, enums, and utilities used across
 * all NetrunCMS packages and applications.
 */

import { z } from 'zod';

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export const SITE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export const PAGE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  SCHEDULED: 'scheduled',
  ARCHIVED: 'archived',
} as const;

export const PAGE_TEMPLATE = {
  DEFAULT: 'default',
  LANDING: 'landing',
  BLOG: 'blog',
  PRODUCT: 'product',
  CONTACT: 'contact',
  ARTIST: 'artist',
  SMALL_BUSINESS: 'small_business',
  ECOMMERCE: 'ecommerce',
  RESTAURANT: 'restaurant',
  AGENCY: 'agency',
  SAAS: 'saas',
  CONSULTANT: 'consultant',
  COMMUNITY: 'community',
  PUBLISHER: 'publisher',
  COOPERATIVE: 'cooperative',
} as const;

export const BLOCK_TYPE = {
  HERO: 'hero',
  TEXT: 'text',
  RICH_TEXT: 'rich_text',
  IMAGE: 'image',
  GALLERY: 'gallery',
  VIDEO: 'video',
  CTA: 'cta',
  FEATURE_GRID: 'feature_grid',
  PRICING_TABLE: 'pricing_table',
  TESTIMONIAL: 'testimonial',
  FAQ: 'faq',
  CONTACT_FORM: 'contact_form',
  CODE_BLOCK: 'code_block',
  BENTO_GRID: 'bento_grid',
  STATS_BAR: 'stats_bar',
  TIMELINE: 'timeline',
  NEWSLETTER: 'newsletter',
  CUSTOM: 'custom',
  // Artist/band template block types
  EMBED_PLAYER: 'embed_player',
  RELEASE_LIST: 'release_list',
  EVENT_LIST: 'event_list',
  SOCIAL_LINKS: 'social_links',
  LINK_TREE: 'link_tree',
  ARTIST_BIO: 'artist_bio',
} as const;

export const EMBED_PLATFORM = {
  SPOTIFY: 'spotify',
  YOUTUBE: 'youtube',
  APPLE_MUSIC: 'apple_music',
  SOUNDCLOUD: 'soundcloud',
  BANDCAMP: 'bandcamp',
  TWITCH: 'twitch',
  TIKTOK: 'tiktok',
  INSTAGRAM: 'instagram',
  TWITTER: 'twitter',
} as const;

export const RELEASE_TYPE = {
  SINGLE: 'single',
  ALBUM: 'album',
  EP: 'ep',
  MIXTAPE: 'mixtape',
} as const;

export const EVENT_TYPE = {
  SHOW: 'show',
  FESTIVAL: 'festival',
  LIVESTREAM: 'livestream',
} as const;

export const MEDIA_TYPE = {
  IMAGE: 'image',
  VIDEO: 'video',
  DOCUMENT: 'document',
  AUDIO: 'audio',
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type SiteStatus = typeof SITE_STATUS[keyof typeof SITE_STATUS];
export type PageStatus = typeof PAGE_STATUS[keyof typeof PAGE_STATUS];
export type PageTemplate = typeof PAGE_TEMPLATE[keyof typeof PAGE_TEMPLATE];
export type BlockType = typeof BLOCK_TYPE[keyof typeof BLOCK_TYPE];
export type MediaType = typeof MEDIA_TYPE[keyof typeof MEDIA_TYPE];
export type EmbedPlatform = typeof EMBED_PLATFORM[keyof typeof EMBED_PLATFORM];
export type ReleaseType = typeof RELEASE_TYPE[keyof typeof RELEASE_TYPE];
export type EventType = typeof EVENT_TYPE[keyof typeof EVENT_TYPE];

// ============================================================================
// BASE INTERFACES
// ============================================================================

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant extends BaseEntity {
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'pro' | 'business' | 'enterprise';
  settings: Record<string, unknown>;
  isActive: boolean;
}

export interface Site extends BaseEntity {
  tenantId: string;
  name: string;
  slug: string;
  domain?: string;
  defaultLanguage: string;
  status: SiteStatus;
  settings: SiteSettings;
}

export interface SiteSettings {
  favicon?: string;
  logo?: string;
  logoDark?: string;
  socialLinks?: SocialLinks;
  analytics?: AnalyticsConfig;
  seo?: SEODefaults;
}

export interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  github?: string;
  instagram?: string;
  youtube?: string;
}

export interface AnalyticsConfig {
  googleAnalyticsId?: string;
  clarityId?: string;
  hotjarId?: string;
}

export interface SEODefaults {
  titleTemplate?: string;
  defaultDescription?: string;
  defaultImage?: string;
}

// ============================================================================
// THEME TYPES
// ============================================================================

export interface Theme extends BaseEntity {
  siteId: string;
  name: string;
  isActive: boolean;
  baseTheme: 'netrun-dark' | 'netrun-light' | 'custom';
  tokens: ThemeTokens;
  customCss?: string;
}

export interface ThemeTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  effects: EffectTokens;
}

export interface ColorTokens {
  primary: string;
  primaryDark?: string;
  primaryLight?: string;
  secondary?: string;
  accent?: string;
  background: string;
  backgroundSecondary?: string;
  surface?: string;
  surfaceHover?: string;
  border?: string;
  text: string;
  textSecondary?: string;
  textMuted?: string;
  link?: string;
  linkHover?: string;
  success?: string;
  warning?: string;
  error?: string;
  info?: string;
}

export interface TypographyTokens {
  fontFamily: string;
  fontFamilyHeading?: string;
  fontFamilyMono?: string;
  fontSizeBase?: string;
  fontSizeLg?: string;
  fontSizeSm?: string;
  fontSizeXs?: string;
  fontSizeH1?: string;
  fontSizeH2?: string;
  fontSizeH3?: string;
  lineHeightBase?: number;
  lineHeightHeading?: number;
  fontWeightNormal?: number;
  fontWeightMedium?: number;
  fontWeightBold?: number;
  letterSpacing?: string;
  letterSpacingHeading?: string;
  textTransformHeading?: string;
}

export interface SpacingTokens {
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
  '3xl'?: string;
  sectionPadding?: string;
  containerMaxWidth?: string;
}

export interface EffectTokens {
  borderRadius?: string;
  borderRadiusSm?: string;
  borderRadiusLg?: string;
  borderRadiusFull?: string;
  buttonRadius?: string;
  inputRadius?: string;
  cardRadius?: string;
  shadowSm?: string;
  shadowMd?: string;
  shadowLg?: string;
  shadowColor?: string;
  glassBlur?: string;
  glassBg?: string;
  transitionSpeed?: string;
  hoverScale?: string;
}

// ============================================================================
// PAGE TYPES
// ============================================================================

export interface Page extends BaseEntity {
  siteId: string;
  parentId?: string;
  title: string;
  slug: string;
  fullPath?: string;
  status: PageStatus;
  publishedAt?: Date;
  language: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  template: PageTemplate;
  sortOrder: number;
}

export interface PageWithBlocks extends Page {
  blocks: ContentBlock[];
}

// ============================================================================
// CONTENT BLOCK TYPES
// ============================================================================

export interface ContentBlock extends BaseEntity {
  pageId: string;
  blockType: BlockType;
  content: BlockContent;
  settings: BlockSettings;
  sortOrder: number;
  isVisible: boolean;
}

export type BlockContent =
  | HeroBlockContent
  | TextBlockContent
  | ImageBlockContent
  | GalleryBlockContent
  | CTABlockContent
  | FeatureGridBlockContent
  | PricingBlockContent
  | TestimonialBlockContent
  | FAQBlockContent
  | ContactFormBlockContent
  | StatsBarBlockContent
  | TimelineBlockContent
  | CustomBlockContent
  | EmbedPlayerBlockContent
  | ReleaseListBlockContent
  | EventListBlockContent
  | SocialLinksBlockContent
  | LinkTreeBlockContent
  | ArtistBioBlockContent;

export interface HeroBlockContent {
  headline: string;
  subheadline?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  ctaText?: string;
  ctaLink?: string;
  ctaSecondaryText?: string;
  ctaSecondaryLink?: string;
  alignment?: 'left' | 'center' | 'right';
}

export interface TextBlockContent {
  body: string;
  format?: 'plain' | 'markdown' | 'html';
}

export interface ImageBlockContent {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface GalleryBlockContent {
  images: ImageBlockContent[];
  layout?: 'grid' | 'masonry' | 'carousel';
  columns?: number;
}

export interface CTABlockContent {
  headline: string;
  description?: string;
  buttonText: string;
  buttonLink: string;
  buttonVariant?: 'primary' | 'secondary' | 'outline';
  backgroundStyle?: 'solid' | 'gradient' | 'image';
}

export interface FeatureGridBlockContent {
  headline?: string;
  features: FeatureItem[];
  columns?: 2 | 3 | 4;
}

export interface FeatureItem {
  icon?: string;
  title: string;
  description: string;
  link?: string;
}

export interface PricingBlockContent {
  headline?: string;
  description?: string;
  tiers: PricingTier[];
}

export interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
  isPopular?: boolean;
}

export interface TestimonialBlockContent {
  testimonials: Testimonial[];
  layout?: 'grid' | 'carousel';
}

export interface Testimonial {
  quote: string;
  author: string;
  role?: string;
  company?: string;
  avatar?: string;
}

export interface FAQBlockContent {
  headline?: string;
  items: FAQItem[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ContactFormBlockContent {
  headline?: string;
  description?: string;
  fields: FormField[];
  submitText?: string;
  successMessage?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export interface StatsBarBlockContent {
  stats: StatItem[];
  layout?: 'horizontal' | 'grid';
}

export interface StatItem {
  value: string;
  label: string;
  icon?: string;
}

export interface TimelineBlockContent {
  headline?: string;
  items: TimelineItem[];
}

export interface TimelineItem {
  date: string;
  title: string;
  description: string;
  icon?: string;
}

export interface CustomBlockContent {
  html?: string;
  css?: string;
  js?: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// ARTIST/BAND BLOCK CONTENT TYPES
// ============================================================================

export interface EmbedPlayerBlockContent {
  platform: EmbedPlatform;
  url: string;
  compact?: boolean;
  title?: string;
}

export interface ReleaseListBlockContent {
  maxItems?: number;
  layout?: 'grid' | 'list';
  showStreamLinks?: boolean;
}

export interface EventListBlockContent {
  maxItems?: number;
  showPastEvents?: boolean;
  layout?: 'list' | 'calendar';
}

export interface SocialLinksBlockContent {
  links: SocialLinkItem[];
  layout?: 'row' | 'grid';
  showLabels?: boolean;
}

export interface SocialLinkItem {
  platform: string;
  url: string;
  label?: string;
  icon?: string;
}

export interface LinkTreeBlockContent {
  links: LinkTreeItem[];
  showAvatar?: boolean;
  avatarUrl?: string;
  heading?: string;
  subheading?: string;
}

export interface LinkTreeItem {
  title: string;
  url: string;
  icon?: string;
  featured?: boolean;
}

export interface ArtistBioBlockContent {
  showPhoto?: boolean;
  showGenres?: boolean;
  showSocialLinks?: boolean;
  photoPosition?: 'left' | 'right' | 'top';
}

// ============================================================================
// ARTIST DATA TYPES (for structured tables)
// ============================================================================

export interface StreamLinks {
  spotify?: string;
  appleMusic?: string;
  youtube?: string;
  soundcloud?: string;
  bandcamp?: string;
  tidal?: string;
  amazonMusic?: string;
  deezer?: string;
  [key: string]: string | undefined;
}

export interface Release {
  id: string;
  siteId: string;
  title: string;
  type: ReleaseType;
  releaseDate: string;
  coverUrl?: string;
  streamLinks: StreamLinks;
  embedUrl?: string;
  embedPlatform?: EmbedPlatform;
  description?: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArtistEvent {
  id: string;
  siteId: string;
  title: string;
  venue: string;
  city: string;
  eventDate: string;
  eventType: EventType;
  ticketUrl?: string;
  description?: string;
  imageUrl?: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArtistProfile {
  id: string;
  siteId: string;
  artistName: string;
  bio: string;
  photoUrl?: string;
  genres: string[];
  socialLinks: Record<string, string>;
  bookingEmail?: string;
  managementEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlockSettings {
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'transparent' | 'primary' | 'secondary' | 'surface' | 'gradient';
  width?: 'full' | 'container' | 'narrow';
  animation?: 'none' | 'fade' | 'slide' | 'scale';
  customClass?: string;
}

// ============================================================================
// THEME LOCK TYPES
// ============================================================================

export interface ThemeLockState {
  colors: boolean;
  typography: boolean;
  spacing: boolean;
  effects: boolean;
  blockDefaults: boolean;
}

export const DEFAULT_THEME_LOCKS: ThemeLockState = {
  colors: false,
  typography: false,
  spacing: false,
  effects: false,
  blockDefaults: false,
};

// ============================================================================
// MEDIA TYPES
// ============================================================================

export interface Media extends BaseEntity {
  siteId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  caption?: string;
  folder: string;
  metadata: MediaMetadata;
}

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const siteSettingsSchema = z.object({
  favicon: z.string().optional(),
  logo: z.string().optional(),
  logoDark: z.string().optional(),
  socialLinks: z.object({
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    github: z.string().url().optional(),
    instagram: z.string().url().optional(),
    youtube: z.string().url().optional(),
  }).optional(),
  analytics: z.object({
    googleAnalyticsId: z.string().optional(),
    clarityId: z.string().optional(),
    hotjarId: z.string().optional(),
  }).optional(),
  seo: z.object({
    titleTemplate: z.string().optional(),
    defaultDescription: z.string().optional(),
    defaultImage: z.string().optional(),
  }).optional(),
});

export const createSiteSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  domain: z.string().optional(),
  defaultLanguage: z.string().default('en'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  settings: siteSettingsSchema.optional(),
});

export const createPageSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  parentId: z.string().uuid().optional(),
  status: z.enum(['draft', 'published', 'scheduled', 'archived']).default('draft'),
  publishedAt: z.date().optional(),
  language: z.string().default('en'),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  ogImageUrl: z.string().url().optional(),
  template: z.enum(['default', 'landing', 'blog', 'product', 'contact', 'artist', 'small_business', 'ecommerce', 'restaurant', 'agency', 'saas', 'consultant', 'community', 'publisher', 'cooperative']).default('default'),
  sortOrder: z.number().int().default(0),
});

export const schedulePageSchema = z.object({
  publishAt: z.string().datetime().optional().nullable(),
  unpublishAt: z.string().datetime().optional().nullable(),
}).refine(
  (data) => {
    if (data.publishAt && data.unpublishAt) {
      return new Date(data.unpublishAt) > new Date(data.publishAt);
    }
    return true;
  },
  { message: 'unpublishAt must be after publishAt', path: ['unpublishAt'] }
);

export const blockSettingsSchema = z.object({
  padding: z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional(),
  margin: z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional(),
  background: z.enum(['transparent', 'primary', 'secondary', 'surface', 'gradient']).optional(),
  width: z.enum(['full', 'container', 'narrow']).optional(),
  animation: z.enum(['none', 'fade', 'slide', 'scale']).optional(),
  customClass: z.string().optional(),
});

export const createBlockSchema = z.object({
  pageId: z.string().uuid(),
  blockType: z.enum([
    'hero', 'text', 'rich_text', 'image', 'gallery', 'video', 'cta',
    'feature_grid', 'pricing_table', 'testimonial', 'faq', 'contact_form',
    'code_block', 'bento_grid', 'stats_bar', 'timeline', 'newsletter', 'custom',
    'embed_player', 'release_list', 'event_list', 'social_links', 'link_tree', 'artist_bio'
  ]),
  content: z.record(z.unknown()),
  settings: blockSettingsSchema.optional(),
  sortOrder: z.number().int().default(0),
  isVisible: z.boolean().default(true),
});

export const themeTokensSchema = z.object({
  colors: z.object({
    primary: z.string(),
    primaryDark: z.string().optional(),
    primaryLight: z.string().optional(),
    secondary: z.string().optional(),
    background: z.string(),
    backgroundSecondary: z.string().optional(),
    surface: z.string().optional(),
    text: z.string(),
    textSecondary: z.string().optional(),
    success: z.string().optional(),
    warning: z.string().optional(),
    error: z.string().optional(),
    info: z.string().optional(),
  }),
  typography: z.object({
    fontFamily: z.string(),
    fontFamilyHeading: z.string().optional(),
    fontSizeBase: z.string().optional(),
    fontSizeLg: z.string().optional(),
    fontSizeSm: z.string().optional(),
    lineHeightBase: z.number().optional(),
    fontWeightNormal: z.number().optional(),
    fontWeightBold: z.number().optional(),
  }),
  spacing: z.object({
    xs: z.string().optional(),
    sm: z.string().optional(),
    md: z.string().optional(),
    lg: z.string().optional(),
    xl: z.string().optional(),
    '2xl': z.string().optional(),
  }).optional(),
  effects: z.object({
    borderRadius: z.string().optional(),
    borderRadiusLg: z.string().optional(),
    shadowSm: z.string().optional(),
    shadowMd: z.string().optional(),
    shadowLg: z.string().optional(),
    glassBlur: z.string().optional(),
    glassBg: z.string().optional(),
  }).optional(),
});

export const createThemeSchema = z.object({
  name: z.string().min(1).max(100),
  isActive: z.boolean().default(false),
  baseTheme: z.enum(['netrun-dark', 'netrun-light', 'custom']).default('netrun-dark'),
  tokens: themeTokensSchema,
  customCss: z.string().optional(),
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a URL-safe slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a full page path from parent hierarchy
 */
export function generatePagePath(slug: string, parentPath?: string): string {
  if (parentPath) {
    return `${parentPath}/${slug}`;
  }
  return `/${slug}`;
}

/**
 * Convert theme tokens to CSS variables
 */
export function tokensToCssVariables(tokens: ThemeTokens, prefix = 'netrun'): string {
  const lines: string[] = [];

  // Colors
  for (const [key, value] of Object.entries(tokens.colors)) {
    if (value) {
      lines.push(`--${prefix}-${kebabCase(key)}: ${value};`);
    }
  }

  // Typography
  for (const [key, value] of Object.entries(tokens.typography)) {
    if (value !== undefined) {
      const cssValue = typeof value === 'number' ? value.toString() : value;
      lines.push(`--${prefix}-${kebabCase(key)}: ${cssValue};`);
    }
  }

  // Spacing
  if (tokens.spacing) {
    for (const [key, value] of Object.entries(tokens.spacing)) {
      if (value) {
        lines.push(`--${prefix}-space-${key}: ${value};`);
      }
    }
  }

  // Effects
  if (tokens.effects) {
    for (const [key, value] of Object.entries(tokens.effects)) {
      if (value) {
        lines.push(`--${prefix}-${kebabCase(key)}: ${value};`);
      }
    }
  }

  return lines.join('\n');
}

function kebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// ============================================================================
// PLAN DEFINITIONS & ENFORCEMENT
// ============================================================================

export {
  PLANS,
  PLAN_NAMES,
  getPlanLimits,
  getPlanDefinition,
  isPluginAllowed,
  isWithinLimit,
  formatPrice,
  getStripePriceEnvKey,
} from './plans.js';

export type {
  PlanLimits,
  PlanDefinition,
  PlanName,
} from './plans.js';

// ============================================================================
// VERTICAL TEMPLATE REGISTRY
// ============================================================================

export {
  verticalTemplates,
  getTemplateById,
  getTemplatesByCategory,
} from './templates.js';

export type {
  VerticalTemplate,
} from './templates.js';

// ============================================================================
// DEFAULT THEME TOKENS
// ============================================================================

export const defaultDarkThemeTokens: ThemeTokens = {
  colors: {
    primary: '#90b9ab',
    primaryDark: '#739d8e',
    primaryLight: '#a8cfbd',
    secondary: '#000000',
    background: '#0A0A0A',
    backgroundSecondary: '#141414',
    surface: '#1a1a1a',
    text: '#FFFFFF',
    textSecondary: '#B8B8B8',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#90b9ab',
  },
  typography: {
    fontFamily: "'Futura Medium', 'Futura', system-ui, sans-serif",
    fontFamilyHeading: "'Futura Bold', 'Futura', system-ui, sans-serif",
    fontSizeBase: '1rem',
    fontSizeLg: '1.125rem',
    fontSizeSm: '0.875rem',
    lineHeightBase: 1.5,
    fontWeightNormal: 500,
    fontWeightBold: 700,
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  effects: {
    borderRadius: '8px',
    borderRadiusLg: '12px',
    shadowSm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    shadowMd: '0 4px 6px rgba(0, 0, 0, 0.4)',
    shadowLg: '0 10px 15px rgba(0, 0, 0, 0.5)',
    glassBlur: '12px',
    glassBg: 'rgba(0, 0, 0, 0.4)',
  },
};

export const defaultLightThemeTokens: ThemeTokens = {
  colors: {
    primary: '#90b9ab',
    primaryDark: '#739d8e',
    primaryLight: '#a8cfbd',
    secondary: '#000000',
    background: '#f4f4f4',
    backgroundSecondary: '#ffffff',
    surface: '#ffffff',
    text: '#0A0A0A',
    textSecondary: '#4A4A4A',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#90b9ab',
  },
  typography: {
    fontFamily: "'Futura Medium', 'Futura', system-ui, sans-serif",
    fontFamilyHeading: "'Futura Bold', 'Futura', system-ui, sans-serif",
    fontSizeBase: '1rem',
    fontSizeLg: '1.125rem',
    fontSizeSm: '0.875rem',
    lineHeightBase: 1.5,
    fontWeightNormal: 500,
    fontWeightBold: 700,
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  effects: {
    borderRadius: '8px',
    borderRadiusLg: '12px',
    shadowSm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    shadowMd: '0 4px 6px rgba(0, 0, 0, 0.1)',
    shadowLg: '0 10px 15px rgba(0, 0, 0, 0.15)',
    glassBlur: '12px',
    glassBg: 'rgba(255, 255, 255, 0.6)',
  },
};

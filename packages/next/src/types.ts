/**
 * @sigil-cms/next — Type definitions for Next.js integration
 */

import type { ContentBlock, BlockType, MediaItem } from '@sigil-cms/client';
import type { ComponentType, ReactNode } from 'react';

/**
 * Props for a block component renderer.
 * Each block type receives its content (Record<string, unknown>) and settings.
 */
export interface BlockComponentProps {
  /** The full content block object from the API */
  block: ContentBlock;
  /** Resolved content for convenience (same as block.content) */
  content: Record<string, unknown>;
}

/**
 * A map of block type names to React components that render them.
 */
export type BlockComponentMap = Partial<Record<BlockType | string, ComponentType<BlockComponentProps>>>;

/**
 * Props for the SigilPage component.
 */
export interface SigilPageProps {
  /** The page slug to fetch and render */
  slug: string;
  /** Optional language override */
  lang?: string;
  /** Custom block component overrides */
  components?: BlockComponentMap;
  /** Optional className for the page wrapper */
  className?: string;
  /** Fallback content while the page is not found (rendered in place of the page) */
  notFound?: ReactNode;
}

/**
 * Props for the SigilBlock component.
 */
export interface SigilBlockProps {
  /** The content block to render */
  block: ContentBlock;
  /** Custom block component overrides (merged with defaults) */
  components?: BlockComponentMap;
}

/**
 * Props for the SigilImage component.
 */
export interface SigilImageProps {
  /** The media item from the Sigil API */
  media: MediaItem;
  /** Desired display width */
  width?: number;
  /** Desired display height */
  height?: number;
  /** Alt text override (defaults to media.altText) */
  alt?: string;
  /** Additional CSS class */
  className?: string;
  /** Image priority (Next.js Image prop) */
  priority?: boolean;
  /** Image sizes attribute for responsive images */
  sizes?: string;
}

/**
 * Options for generateSigilMetadata.
 */
export interface SigilMetadataOptions {
  /** Override the base URL for OG images (default: SIGIL_URL) */
  baseUrl?: string;
  /** Title template (e.g. "%s | My Site") — %s is replaced with the page title */
  titleTemplate?: string;
  /** Fallback title when page has no metaTitle */
  defaultTitle?: string;
  /** Fallback description when page has no metaDescription */
  defaultDescription?: string;
}

/**
 * Options for generateSigilStaticParams.
 */
export interface SigilStaticParamsOptions {
  /** Only generate params for pages matching these templates */
  templates?: string[];
  /** Custom client instance (default: auto-configured from env) */
  client?: ReturnType<typeof import('./client.js').createSigilClient>;
}

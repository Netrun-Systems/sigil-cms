/**
 * @netrun-cms/blocks - Content block components for NetrunCMS
 *
 * This package provides composable content blocks adapted from
 * NetrunnewSite landing components. Each block supports both
 * view and edit modes with full TypeScript support.
 *
 * @module @netrun-cms/blocks
 * @author Netrun Systems
 * @version 2.0.0
 */

// ============================================================================
// BLOCK COMPONENTS (core)
// ============================================================================

export { HeroBlock } from './blocks/HeroBlock';
export type { HeroBlockProps } from './blocks/HeroBlock';

export { TextBlock } from './blocks/TextBlock';
export type { TextBlockProps } from './blocks/TextBlock';

export { FeatureGridBlock } from './blocks/FeatureGridBlock';
export type { FeatureGridBlockProps } from './blocks/FeatureGridBlock';

export { GalleryBlock } from './blocks/GalleryBlock';
export type { GalleryBlockProps } from './blocks/GalleryBlock';

export { CTABlock } from './blocks/CTABlock';
export type { CTABlockProps } from './blocks/CTABlock';

export { PricingBlock } from './blocks/PricingBlock';
export type { PricingBlockProps } from './blocks/PricingBlock';

export { ContactFormBlock } from './blocks/ContactFormBlock';
export type { ContactFormBlockProps } from './blocks/ContactFormBlock';

export { TestimonialsBlock } from './blocks/TestimonialsBlock';
export type { TestimonialsBlockProps } from './blocks/TestimonialsBlock';

// ============================================================================
// BLOCK COMPONENTS (artist — available for plugin-artist to re-register)
// ============================================================================

export { EmbedPlayerBlock } from './blocks/EmbedPlayerBlock';
export type { EmbedPlayerBlockProps } from './blocks/EmbedPlayerBlock';

export { ReleaseListBlock } from './blocks/ReleaseListBlock';
export type { ReleaseListBlockProps } from './blocks/ReleaseListBlock';

export { EventListBlock } from './blocks/EventListBlock';
export type { EventListBlockProps } from './blocks/EventListBlock';

export { SocialLinksBlock } from './blocks/SocialLinksBlock';
export type { SocialLinksBlockProps } from './blocks/SocialLinksBlock';

export { LinkTreeBlock } from './blocks/LinkTreeBlock';
export type { LinkTreeBlockProps } from './blocks/LinkTreeBlock';

export { ArtistBioBlock } from './blocks/ArtistBioBlock';
export type { ArtistBioBlockProps } from './blocks/ArtistBioBlock';

// ============================================================================
// RENDERER, EDITOR, AND REGISTRY
// ============================================================================

export {
  BlockRenderer,
  BlockListRenderer,
  registerBlockComponent,
  getRegisteredBlockTypes,
} from './BlockRenderer';
export type {
  BlockRendererProps,
  BlockListRendererProps,
  BlockComponentProps,
} from './BlockRenderer';

export { BlockEditor } from './BlockEditor';
export type { BlockEditorProps } from './BlockEditor';

// ============================================================================
// UTILITIES
// ============================================================================

export {
  cn,
  getPaddingClass,
  getMarginClass,
  getBackgroundClass,
  getWidthClass,
  getBlockSettingsClasses,
} from './utils';

export type {
  BlockMode,
  BaseBlockProps,
  BlockSettingsProps,
} from './utils';

// ============================================================================
// RE-EXPORTS FROM @netrun-cms/core
// ============================================================================

// Re-export core types that block consumers commonly need
export type {
  ContentBlock,
  BlockType,
  BlockContent,
  BlockSettings,
  HeroBlockContent,
  TextBlockContent,
  ImageBlockContent,
  GalleryBlockContent,
  CTABlockContent,
  FeatureGridBlockContent,
  FeatureItem,
  PricingBlockContent,
  PricingTier,
  TestimonialBlockContent,
  Testimonial,
  ContactFormBlockContent,
  FormField,
  EmbedPlayerBlockContent,
  ReleaseListBlockContent,
  EventListBlockContent,
  SocialLinksBlockContent,
  SocialLinkItem,
  LinkTreeBlockContent,
  LinkTreeItem,
  ArtistBioBlockContent,
  Release,
  ArtistEvent,
  ArtistProfile,
  EmbedPlatform,
} from '@netrun-cms/core';

export { BLOCK_TYPE, EMBED_PLATFORM } from '@netrun-cms/core';

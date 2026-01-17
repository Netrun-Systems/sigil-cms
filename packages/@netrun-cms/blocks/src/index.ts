/**
 * @netrun-cms/blocks - Content block components for NetrunCMS
 *
 * This package provides composable content blocks adapted from
 * NetrunnewSite landing components. Each block supports both
 * view and edit modes with full TypeScript support.
 *
 * @module @netrun-cms/blocks
 * @author Netrun Systems
 * @version 1.0.0
 */

// ============================================================================
// BLOCK COMPONENTS
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
// RENDERER AND EDITOR
// ============================================================================

export { BlockRenderer, BlockListRenderer } from './BlockRenderer';
export type { BlockRendererProps, BlockListRendererProps } from './BlockRenderer';

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
} from '@netrun-cms/core';

export { BLOCK_TYPE } from '@netrun-cms/core';

/**
 * @sigil-cms/next/blocks
 *
 * Default block component registry. Import individual blocks to override
 * specific types while keeping the rest of the defaults.
 */

export { HeroBlock } from './hero-block.js';
export { TextBlock } from './text-block.js';
export { ImageBlock } from './image-block.js';
export { GalleryBlock } from './gallery-block.js';
export { CTABlock } from './cta-block.js';
export { VideoBlock } from './video-block.js';
export { CodeBlock } from './code-block.js';
export { FeatureGridBlock } from './feature-grid-block.js';
export { FallbackBlock } from './fallback-block.js';

import type { BlockComponentMap } from '../types.js';
import { HeroBlock } from './hero-block.js';
import { TextBlock } from './text-block.js';
import { ImageBlock } from './image-block.js';
import { GalleryBlock } from './gallery-block.js';
import { CTABlock } from './cta-block.js';
import { VideoBlock } from './video-block.js';
import { CodeBlock } from './code-block.js';
import { FeatureGridBlock } from './feature-grid-block.js';

/**
 * Default block component map.
 * Maps Sigil block types to their default React renderers.
 * Override individual block types by spreading this and replacing keys.
 */
export const defaultBlockComponents: BlockComponentMap = {
  hero: HeroBlock,
  text: TextBlock,
  rich_text: TextBlock,
  image: ImageBlock,
  gallery: GalleryBlock,
  cta: CTABlock,
  video: VideoBlock,
  code_block: CodeBlock,
  feature_grid: FeatureGridBlock,
};

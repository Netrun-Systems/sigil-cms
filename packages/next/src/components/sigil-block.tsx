import type { ContentBlock } from '@sigil-cms/client';
import { defaultBlockComponents } from '../blocks/index.js';
import { FallbackBlock } from '../blocks/fallback-block.js';
import type { BlockComponentMap, SigilBlockProps } from '../types.js';

/**
 * Render a single Sigil content block.
 *
 * Automatically selects the correct block component based on blockType.
 * Custom components can be passed via the `components` prop to override defaults.
 *
 * @example
 * ```tsx
 * import { SigilBlock } from '@sigil-cms/next';
 * import { MyCustomHero } from './my-hero';
 *
 * <SigilBlock
 *   block={block}
 *   components={{ hero: MyCustomHero }}
 * />
 * ```
 */
export function SigilBlock({ block, components }: SigilBlockProps) {
  if (!block.isVisible) {
    return null;
  }

  const merged: BlockComponentMap = {
    ...defaultBlockComponents,
    ...components,
  };

  const Component = merged[block.blockType] ?? FallbackBlock;

  return (
    <Component
      block={block}
      content={block.content}
    />
  );
}

/**
 * Render a list of blocks with the given component map.
 * Convenience wrapper used internally by SigilPage.
 */
export function SigilBlockList({
  blocks,
  components,
}: {
  blocks: ContentBlock[];
  components?: BlockComponentMap;
}) {
  return (
    <>
      {blocks.map((block) => (
        <SigilBlock key={block.id} block={block} components={components} />
      ))}
    </>
  );
}

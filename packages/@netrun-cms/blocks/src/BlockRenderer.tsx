/**
 * BlockRenderer - Component that renders any block by type
 *
 * Dynamically renders the appropriate block component based on
 * the block type. Supports both view and edit modes.
 *
 * @module @netrun-cms/blocks
 * @author Netrun Systems
 */

import React from 'react';
import type {
  ContentBlock,
  BlockType,
  BlockContent,
  BlockSettings,
  BLOCK_TYPE,
  HeroBlockContent,
  TextBlockContent,
  FeatureGridBlockContent,
  GalleryBlockContent,
  CTABlockContent,
  PricingBlockContent,
  ContactFormBlockContent,
  TestimonialBlockContent,
} from '@netrun-cms/core';
import { cn, type BlockMode } from './utils';

// Import block components
import { HeroBlock } from './blocks/HeroBlock';
import { TextBlock } from './blocks/TextBlock';
import { FeatureGridBlock } from './blocks/FeatureGridBlock';
import { GalleryBlock } from './blocks/GalleryBlock';
import { CTABlock } from './blocks/CTABlock';
import { PricingBlock } from './blocks/PricingBlock';
import { ContactFormBlock } from './blocks/ContactFormBlock';
import { TestimonialsBlock } from './blocks/TestimonialsBlock';
import { EmbedPlayerBlock } from './blocks/EmbedPlayerBlock';
import { ReleaseListBlock } from './blocks/ReleaseListBlock';
import { EventListBlock } from './blocks/EventListBlock';
import { SocialLinksBlock } from './blocks/SocialLinksBlock';
import { LinkTreeBlock } from './blocks/LinkTreeBlock';
import { ArtistBioBlock } from './blocks/ArtistBioBlock';

export interface BlockRendererProps {
  /** The content block to render */
  block: ContentBlock;
  /** Display mode */
  mode?: BlockMode;
  /** Callback when block content changes (edit mode) */
  onContentChange?: (blockId: string, content: BlockContent) => void;
  /** Callback when block settings change (edit mode) */
  onSettingsChange?: (blockId: string, settings: BlockSettings) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Map of block types to their respective components
 */
const blockComponents: Record<string, React.ComponentType<{
  content: BlockContent;
  settings?: BlockSettings;
  mode?: BlockMode;
  className?: string;
  onContentChange?: (content: BlockContent) => void;
}>> = {
  hero: HeroBlock as React.ComponentType<{
    content: BlockContent;
    settings?: BlockSettings;
    mode?: BlockMode;
    className?: string;
    onContentChange?: (content: BlockContent) => void;
  }>,
  text: TextBlock as React.ComponentType<{
    content: BlockContent;
    settings?: BlockSettings;
    mode?: BlockMode;
    className?: string;
    onContentChange?: (content: BlockContent) => void;
  }>,
  rich_text: TextBlock as React.ComponentType<{
    content: BlockContent;
    settings?: BlockSettings;
    mode?: BlockMode;
    className?: string;
    onContentChange?: (content: BlockContent) => void;
  }>,
  feature_grid: FeatureGridBlock as React.ComponentType<{
    content: BlockContent;
    settings?: BlockSettings;
    mode?: BlockMode;
    className?: string;
    onContentChange?: (content: BlockContent) => void;
  }>,
  gallery: GalleryBlock as React.ComponentType<{
    content: BlockContent;
    settings?: BlockSettings;
    mode?: BlockMode;
    className?: string;
    onContentChange?: (content: BlockContent) => void;
  }>,
  cta: CTABlock as React.ComponentType<{
    content: BlockContent;
    settings?: BlockSettings;
    mode?: BlockMode;
    className?: string;
    onContentChange?: (content: BlockContent) => void;
  }>,
  pricing_table: PricingBlock as React.ComponentType<{
    content: BlockContent;
    settings?: BlockSettings;
    mode?: BlockMode;
    className?: string;
    onContentChange?: (content: BlockContent) => void;
  }>,
  testimonial: TestimonialsBlock as React.ComponentType<{
    content: BlockContent;
    settings?: BlockSettings;
    mode?: BlockMode;
    className?: string;
    onContentChange?: (content: BlockContent) => void;
  }>,
  contact_form: ContactFormBlock as React.ComponentType<{
    content: BlockContent;
    settings?: BlockSettings;
    mode?: BlockMode;
    className?: string;
    onContentChange?: (content: BlockContent) => void;
  }>,
  embed_player: EmbedPlayerBlock as React.ComponentType<{
    content: BlockContent;
    settings?: BlockSettings;
    mode?: BlockMode;
    className?: string;
    onContentChange?: (content: BlockContent) => void;
  }>,
  release_list: ReleaseListBlock as React.ComponentType<{
    content: BlockContent;
    settings?: BlockSettings;
    mode?: BlockMode;
    className?: string;
    onContentChange?: (content: BlockContent) => void;
  }>,
  event_list: EventListBlock as React.ComponentType<{
    content: BlockContent;
    settings?: BlockSettings;
    mode?: BlockMode;
    className?: string;
    onContentChange?: (content: BlockContent) => void;
  }>,
  social_links: SocialLinksBlock as React.ComponentType<{
    content: BlockContent;
    settings?: BlockSettings;
    mode?: BlockMode;
    className?: string;
    onContentChange?: (content: BlockContent) => void;
  }>,
  link_tree: LinkTreeBlock as React.ComponentType<{
    content: BlockContent;
    settings?: BlockSettings;
    mode?: BlockMode;
    className?: string;
    onContentChange?: (content: BlockContent) => void;
  }>,
  artist_bio: ArtistBioBlock as React.ComponentType<{
    content: BlockContent;
    settings?: BlockSettings;
    mode?: BlockMode;
    className?: string;
    onContentChange?: (content: BlockContent) => void;
  }>,
};

/**
 * Fallback component for unsupported block types
 */
const UnsupportedBlock: React.FC<{
  blockType: string;
  mode?: BlockMode;
}> = ({ blockType, mode }) => (
  <div
    className={cn(
      'py-8 px-4 text-center rounded-lg',
      mode === 'edit'
        ? 'bg-yellow-500/10 border-2 border-dashed border-yellow-500/30'
        : 'bg-[var(--netrun-surface)]'
    )}
  >
    <p className="text-[var(--netrun-text-secondary)]">
      {mode === 'edit' ? (
        <>
          Block type <code className="px-2 py-1 rounded bg-[var(--netrun-background)] text-[var(--netrun-primary)]">{blockType}</code> is not yet implemented.
        </>
      ) : (
        'Content not available.'
      )}
    </p>
  </div>
);

/**
 * BlockRenderer component - renders any block by its type
 */
export const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  mode = 'view',
  onContentChange,
  onSettingsChange,
  className,
}) => {
  const { id, blockType, content, settings, isVisible } = block;

  // Don't render invisible blocks in view mode
  if (!isVisible && mode === 'view') {
    return null;
  }

  // Get the component for this block type
  const BlockComponent = blockComponents[blockType];

  // Handle content changes
  const handleContentChange = (newContent: BlockContent) => {
    onContentChange?.(id, newContent);
  };

  // Wrap in visibility indicator for edit mode
  const wrapperClass = cn(
    className,
    mode === 'edit' && !isVisible && 'opacity-50'
  );

  if (!BlockComponent) {
    return (
      <div className={wrapperClass}>
        <UnsupportedBlock blockType={blockType} mode={mode} />
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <BlockComponent
        content={content}
        settings={settings}
        mode={mode}
        onContentChange={handleContentChange}
      />
    </div>
  );
};

/**
 * Render a list of blocks
 */
export interface BlockListRendererProps {
  /** Array of blocks to render */
  blocks: ContentBlock[];
  /** Display mode */
  mode?: BlockMode;
  /** Callback when block content changes */
  onContentChange?: (blockId: string, content: BlockContent) => void;
  /** Callback when block settings change */
  onSettingsChange?: (blockId: string, settings: BlockSettings) => void;
  /** Gap between blocks */
  gap?: 'none' | 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

const gapClasses: Record<string, string> = {
  none: 'gap-0',
  sm: 'gap-4',
  md: 'gap-8',
  lg: 'gap-12',
};

/**
 * BlockListRenderer - renders multiple blocks in sequence
 */
export const BlockListRenderer: React.FC<BlockListRendererProps> = ({
  blocks,
  mode = 'view',
  onContentChange,
  onSettingsChange,
  gap = 'none',
  className,
}) => {
  // Sort blocks by sortOrder
  const sortedBlocks = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className={cn('flex flex-col', gapClasses[gap], className)}>
      {sortedBlocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          mode={mode}
          onContentChange={onContentChange}
          onSettingsChange={onSettingsChange}
        />
      ))}
    </div>
  );
};

export default BlockRenderer;

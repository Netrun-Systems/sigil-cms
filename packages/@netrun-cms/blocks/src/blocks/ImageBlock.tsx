/**
 * ImageBlock - Single image with alt text, caption, and optional link
 *
 * Displays a responsive image with optional caption and click-through link.
 * Supports both view and edit modes.
 *
 * @module @netrun-cms/blocks
 * @author Netrun Systems
 */

import React from 'react';
import type { ImageBlockContent } from '@netrun-cms/core';
import { cn, getBlockSettingsClasses, type BaseBlockProps } from '../utils';

export interface ImageBlockProps extends BaseBlockProps<ImageBlockContent> {
  /** Whether to render the image inside an anchor tag when a link is provided */
  linkUrl?: string;
  /** Image loading strategy */
  loading?: 'lazy' | 'eager';
}

/**
 * ImageBlock component - displays a single image with optional caption
 */
export const ImageBlock: React.FC<ImageBlockProps> = ({
  content,
  settings,
  mode = 'view',
  className,
  onContentChange,
  linkUrl,
  loading = 'lazy',
}) => {
  const { src, alt, caption, width, height } = content;

  const imageElement = (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      className="w-full h-auto rounded-lg object-cover"
    />
  );

  if (mode === 'edit') {
    return (
      <section
        className={cn(
          getBlockSettingsClasses(settings),
          className
        )}
      >
        <div className="container mx-auto max-w-4xl space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--netrun-text-secondary)]">
              Image URL
            </label>
            <input
              type="url"
              value={src}
              onChange={(e) => onContentChange?.({ ...content, src: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--netrun-surface)] border border-[var(--netrun-border)] text-[var(--netrun-text)] focus:outline-none focus:border-[var(--netrun-primary)]"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--netrun-text-secondary)]">
              Alt Text <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={alt}
              onChange={(e) => onContentChange?.({ ...content, alt: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--netrun-surface)] border border-[var(--netrun-border)] text-[var(--netrun-text)] focus:outline-none focus:border-[var(--netrun-primary)]"
              placeholder="Describe the image for accessibility"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--netrun-text-secondary)]">
              Caption (optional)
            </label>
            <input
              type="text"
              value={caption || ''}
              onChange={(e) => onContentChange?.({ ...content, caption: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--netrun-surface)] border border-[var(--netrun-border)] text-[var(--netrun-text)] focus:outline-none focus:border-[var(--netrun-primary)]"
              placeholder="Optional image caption"
            />
          </div>

          {src && (
            <div className="mt-4">
              <p className="text-sm text-[var(--netrun-text-secondary)] mb-2">Preview:</p>
              <img
                src={src}
                alt={alt || 'Preview'}
                className="max-h-64 rounded-lg object-contain bg-[var(--netrun-surface)] w-full"
              />
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        getBlockSettingsClasses(settings),
        className
      )}
    >
      <figure className="container mx-auto max-w-4xl">
        {linkUrl ? (
          <a href={linkUrl} target="_blank" rel="noopener noreferrer">
            {imageElement}
          </a>
        ) : (
          imageElement
        )}
        {caption && (
          <figcaption className="mt-3 text-center text-sm text-[var(--netrun-text-secondary)]">
            {caption}
          </figcaption>
        )}
      </figure>
    </section>
  );
};

export default ImageBlock;

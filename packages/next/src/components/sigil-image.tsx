import Image from 'next/image';
import type { SigilImageProps } from '../types.js';

/**
 * Optimized image component for Sigil media items.
 * Wraps next/image with sensible defaults from the Sigil MediaItem.
 *
 * @example
 * ```tsx
 * import { SigilImage } from '@sigil-cms/next';
 *
 * <SigilImage
 *   media={mediaItem}
 *   width={800}
 *   height={600}
 *   priority
 * />
 * ```
 */
export function SigilImage({
  media,
  width,
  height,
  alt,
  className,
  priority,
  sizes,
}: SigilImageProps) {
  const resolvedAlt = alt ?? media.altText ?? media.originalFilename ?? '';
  const resolvedWidth = width ?? media.metadata?.width;
  const resolvedHeight = height ?? media.metadata?.height;

  // If we have known dimensions, use width/height mode.
  // Otherwise, use fill mode so Next.js can handle layout.
  if (resolvedWidth && resolvedHeight) {
    return (
      <Image
        src={media.url}
        alt={resolvedAlt}
        width={resolvedWidth}
        height={resolvedHeight}
        className={`sigil-image ${className ?? ''}`}
        priority={priority}
        sizes={sizes}
        data-media-id={media.id}
      />
    );
  }

  // Fill mode — requires a positioned parent container
  return (
    <Image
      src={media.url}
      alt={resolvedAlt}
      fill
      className={`sigil-image ${className ?? ''}`}
      priority={priority}
      sizes={sizes ?? '100vw'}
      data-media-id={media.id}
    />
  );
}

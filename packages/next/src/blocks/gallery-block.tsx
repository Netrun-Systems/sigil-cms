'use client';

import type { BlockComponentProps } from '../types.js';

interface GalleryImage {
  src?: string;
  url?: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

/**
 * Default gallery block renderer.
 * Renders a grid of images. Marked as 'use client' so consumers
 * can add interactivity (lightbox, etc.) by overriding this component.
 */
export function GalleryBlock({ block, content }: BlockComponentProps) {
  const images = (content.images as GalleryImage[]) ?? [];
  const columns = (content.columns as number) ?? 3;

  if (images.length === 0) return null;

  return (
    <div
      className={`sigil-block sigil-block--gallery ${block.settings.customClass ?? ''}`}
      data-block-id={block.id}
      data-block-type="gallery"
      data-columns={columns}
    >
      <div className="sigil-gallery__grid">
        {images.map((image, index) => {
          const src = image.src ?? image.url;
          if (!src) return null;
          return (
            <figure key={index} className="sigil-gallery__item">
              <img
                src={src}
                alt={image.alt ?? ''}
                width={image.width}
                height={image.height}
                className="sigil-gallery__img"
                loading="lazy"
              />
              {image.caption && (
                <figcaption className="sigil-gallery__caption">{image.caption}</figcaption>
              )}
            </figure>
          );
        })}
      </div>
    </div>
  );
}

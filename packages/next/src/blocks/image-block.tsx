import type { BlockComponentProps } from '../types.js';

/**
 * Default image block renderer.
 * Renders an img tag with alt text and optional caption.
 * Does NOT use next/image — that is what SigilImage is for.
 * This keeps the default block renderers dependency-free.
 */
export function ImageBlock({ block, content }: BlockComponentProps) {
  const src = (content.src as string | undefined) ?? (content.url as string | undefined);
  const alt = (content.alt as string) ?? (content.altText as string) ?? '';
  const caption = content.caption as string | undefined;
  const width = content.width as number | undefined;
  const height = content.height as number | undefined;

  if (!src) return null;

  return (
    <figure
      className={`sigil-block sigil-block--image ${block.settings.customClass ?? ''}`}
      data-block-id={block.id}
      data-block-type="image"
    >
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="sigil-image__img"
        loading="lazy"
      />
      {caption && <figcaption className="sigil-image__caption">{caption}</figcaption>}
    </figure>
  );
}

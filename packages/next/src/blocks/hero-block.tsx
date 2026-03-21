import type { BlockComponentProps } from '../types.js';

/**
 * Default hero block renderer.
 * Renders a heading, subheading, optional CTA button, and optional background image.
 */
export function HeroBlock({ block, content }: BlockComponentProps) {
  const heading = content.heading as string | undefined;
  const subheading = content.subheading as string | undefined;
  const ctaText = content.ctaText as string | undefined;
  const ctaUrl = content.ctaUrl as string | undefined;
  const backgroundImage = content.backgroundImage as string | undefined;
  const alignment = (content.alignment as string) ?? 'center';

  return (
    <section
      className={`sigil-block sigil-block--hero ${block.settings.customClass ?? ''}`}
      data-block-id={block.id}
      data-block-type="hero"
      data-alignment={alignment}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
    >
      <div className="sigil-hero__content">
        {heading && <h1 className="sigil-hero__heading">{heading}</h1>}
        {subheading && <p className="sigil-hero__subheading">{subheading}</p>}
        {ctaText && ctaUrl && (
          <a href={ctaUrl} className="sigil-hero__cta">
            {ctaText}
          </a>
        )}
      </div>
    </section>
  );
}

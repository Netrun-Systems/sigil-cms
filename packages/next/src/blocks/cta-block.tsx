import type { BlockComponentProps } from '../types.js';

/**
 * Default call-to-action block renderer.
 * Renders a heading, description, and one or two action buttons.
 */
export function CTABlock({ block, content }: BlockComponentProps) {
  const heading = content.heading as string | undefined;
  const description = content.description as string | undefined;
  const primaryText = content.primaryText as string | undefined;
  const primaryUrl = content.primaryUrl as string | undefined;
  const secondaryText = content.secondaryText as string | undefined;
  const secondaryUrl = content.secondaryUrl as string | undefined;

  return (
    <section
      className={`sigil-block sigil-block--cta ${block.settings.customClass ?? ''}`}
      data-block-id={block.id}
      data-block-type="cta"
    >
      {heading && <h2 className="sigil-cta__heading">{heading}</h2>}
      {description && <p className="sigil-cta__description">{description}</p>}
      <div className="sigil-cta__actions">
        {primaryText && primaryUrl && (
          <a href={primaryUrl} className="sigil-cta__button sigil-cta__button--primary">
            {primaryText}
          </a>
        )}
        {secondaryText && secondaryUrl && (
          <a href={secondaryUrl} className="sigil-cta__button sigil-cta__button--secondary">
            {secondaryText}
          </a>
        )}
      </div>
    </section>
  );
}

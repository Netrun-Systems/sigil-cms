import type { BlockComponentProps } from '../types.js';

interface Feature {
  title?: string;
  description?: string;
  icon?: string;
  image?: string;
}

/**
 * Default feature grid block renderer.
 * Renders a grid of feature cards with optional icons/images.
 */
export function FeatureGridBlock({ block, content }: BlockComponentProps) {
  const heading = content.heading as string | undefined;
  const subheading = content.subheading as string | undefined;
  const features = (content.features as Feature[]) ?? (content.items as Feature[]) ?? [];
  const columns = (content.columns as number) ?? 3;

  if (features.length === 0) return null;

  return (
    <section
      className={`sigil-block sigil-block--feature-grid ${block.settings.customClass ?? ''}`}
      data-block-id={block.id}
      data-block-type="feature_grid"
      data-columns={columns}
    >
      {heading && <h2 className="sigil-feature-grid__heading">{heading}</h2>}
      {subheading && <p className="sigil-feature-grid__subheading">{subheading}</p>}
      <div className="sigil-feature-grid__grid">
        {features.map((feature, index) => (
          <div key={index} className="sigil-feature-grid__item">
            {feature.icon && (
              <span className="sigil-feature-grid__icon" aria-hidden="true">
                {feature.icon}
              </span>
            )}
            {feature.image && (
              <img
                src={feature.image}
                alt={feature.title ?? ''}
                className="sigil-feature-grid__image"
                loading="lazy"
              />
            )}
            {feature.title && (
              <h3 className="sigil-feature-grid__title">{feature.title}</h3>
            )}
            {feature.description && (
              <p className="sigil-feature-grid__description">{feature.description}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

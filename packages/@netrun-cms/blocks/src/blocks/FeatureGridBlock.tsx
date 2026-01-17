/**
 * FeatureGridBlock - Grid of feature cards with icons
 *
 * Adapted from NetrunnewSite FeatureGrid component.
 * Displays features in a configurable grid layout with icons.
 *
 * @module @netrun-cms/blocks
 * @author Netrun Systems
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { FeatureGridBlockContent, FeatureItem } from '@netrun-cms/core';
import { cn, getBlockSettingsClasses, type BaseBlockProps } from '../utils';

export interface FeatureGridBlockProps extends BaseBlockProps<FeatureGridBlockContent> {
  /** Card visual style */
  cardStyle?: 'default' | 'bordered' | 'elevated';
  /** Icon color override */
  iconColor?: string;
}

/**
 * Get a Lucide icon component by name
 */
function getIconComponent(iconName?: string): React.ComponentType<{ className?: string }> | null {
  if (!iconName) return null;

  // Convert icon name to PascalCase (e.g., "shield-check" -> "ShieldCheck")
  const pascalCase = iconName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[pascalCase];
  return Icon || null;
}

/**
 * FeatureCard component - individual feature display
 */
const FeatureCard: React.FC<{
  feature: FeatureItem;
  cardStyle: 'default' | 'bordered' | 'elevated';
  iconColor?: string;
  mode: 'view' | 'edit';
  onUpdate?: (feature: FeatureItem) => void;
}> = ({ feature, cardStyle, iconColor, mode, onUpdate }) => {
  const IconComponent = getIconComponent(feature.icon);

  const cardStyles: Record<string, string> = {
    default: 'bg-[var(--netrun-surface)] rounded-lg',
    bordered: 'bg-[var(--netrun-surface)] rounded-lg border-2 border-[var(--netrun-primary)]/20 hover:border-[var(--netrun-primary)] transition-colors',
    elevated: 'bg-[var(--netrun-surface)] rounded-lg shadow-lg hover:shadow-xl transition-shadow',
  };

  if (mode === 'edit') {
    return (
      <div className={cn('p-6', cardStyles[cardStyle])}>
        <div className="flex items-start gap-4 mb-4">
          {IconComponent && (
            <IconComponent
              className={cn('w-10 h-10 flex-shrink-0', iconColor || 'text-[var(--netrun-primary)]')}
            />
          )}
          <input
            type="text"
            value={feature.icon || ''}
            onChange={(e) => onUpdate?.({ ...feature, icon: e.target.value })}
            className="text-xs px-2 py-1 rounded bg-[var(--netrun-background)] border border-[var(--netrun-primary)]/20 text-[var(--netrun-text-secondary)]"
            placeholder="Icon name (e.g., shield-check)"
          />
        </div>
        <input
          type="text"
          value={feature.title}
          onChange={(e) => onUpdate?.({ ...feature, title: e.target.value })}
          className="w-full text-lg font-bold mb-2 bg-transparent border-b border-dashed border-[var(--netrun-primary)]/30 focus:border-[var(--netrun-primary)] outline-none text-[var(--netrun-text)]"
          placeholder="Feature title"
        />
        <textarea
          value={feature.description}
          onChange={(e) => onUpdate?.({ ...feature, description: e.target.value })}
          className="w-full text-sm bg-transparent border-b border-dashed border-[var(--netrun-primary)]/20 focus:border-[var(--netrun-primary)]/50 outline-none resize-none text-[var(--netrun-text-secondary)]"
          placeholder="Feature description"
          rows={3}
        />
      </div>
    );
  }

  return (
    <div className={cn('p-6', cardStyles[cardStyle])}>
      {IconComponent && (
        <IconComponent
          className={cn('w-10 h-10 mb-4', iconColor || 'text-[var(--netrun-primary)]')}
        />
      )}
      <h3 className="text-lg font-bold mb-2 text-[var(--netrun-text)] font-[var(--netrun-font-family-heading)]">
        {feature.title}
      </h3>
      <p className="text-sm text-[var(--netrun-text-secondary)]">
        {feature.description}
      </p>
      {feature.link && (
        <a
          href={feature.link}
          className="inline-flex items-center mt-3 text-sm text-[var(--netrun-primary)] hover:underline"
        >
          Learn more
          <LucideIcons.ArrowRight className="w-4 h-4 ml-1" />
        </a>
      )}
    </div>
  );
};

/**
 * FeatureGridBlock component - displays a grid of feature cards
 */
export const FeatureGridBlock: React.FC<FeatureGridBlockProps> = ({
  content,
  settings,
  mode = 'view',
  className,
  onContentChange,
  cardStyle = 'bordered',
  iconColor,
}) => {
  const { headline, features, columns = 3 } = content;

  const gridCols: Record<number, string> = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const handleFeatureUpdate = (index: number, updatedFeature: FeatureItem) => {
    const newFeatures = [...features];
    newFeatures[index] = updatedFeature;
    onContentChange?.({ ...content, features: newFeatures });
  };

  const handleAddFeature = () => {
    onContentChange?.({
      ...content,
      features: [
        ...features,
        { title: 'New Feature', description: 'Feature description', icon: 'star' },
      ],
    });
  };

  const handleRemoveFeature = (index: number) => {
    const newFeatures = features.filter((_, i) => i !== index);
    onContentChange?.({ ...content, features: newFeatures });
  };

  return (
    <section
      className={cn(
        getBlockSettingsClasses(settings),
        className
      )}
    >
      <div className="container mx-auto max-w-6xl">
        {/* Headline */}
        {(headline || mode === 'edit') && (
          mode === 'edit' ? (
            <input
              type="text"
              value={headline || ''}
              onChange={(e) => onContentChange?.({ ...content, headline: e.target.value })}
              className="w-full text-3xl font-bold text-center mb-12 bg-transparent border-b-2 border-dashed border-[var(--netrun-primary)]/30 focus:border-[var(--netrun-primary)] outline-none text-[var(--netrun-text)]"
              placeholder="Section headline"
            />
          ) : (
            <h2 className="text-3xl font-bold text-center mb-12 text-[var(--netrun-text)] font-[var(--netrun-font-family-heading)]">
              {headline}
            </h2>
          )
        )}

        {/* Column selector in edit mode */}
        {mode === 'edit' && (
          <div className="flex items-center justify-center gap-4 mb-8">
            <label className="text-sm text-[var(--netrun-text-secondary)]">Columns:</label>
            {[2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => onContentChange?.({ ...content, columns: num as 2 | 3 | 4 })}
                className={cn(
                  'w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition-colors',
                  columns === num
                    ? 'bg-[var(--netrun-primary)] text-[var(--netrun-background)]'
                    : 'bg-[var(--netrun-surface)] text-[var(--netrun-text)]'
                )}
              >
                {num}
              </button>
            ))}
          </div>
        )}

        {/* Features Grid */}
        <div className={cn('grid gap-6', gridCols[columns || 3])}>
          {features.map((feature, index) => (
            <div key={index} className="relative group">
              <FeatureCard
                feature={feature}
                cardStyle={cardStyle}
                iconColor={iconColor}
                mode={mode}
                onUpdate={(updated) => handleFeatureUpdate(index, updated)}
              />
              {mode === 'edit' && (
                <button
                  onClick={() => handleRemoveFeature(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <LucideIcons.X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Feature button in edit mode */}
        {mode === 'edit' && (
          <button
            onClick={handleAddFeature}
            className="mt-6 w-full py-4 border-2 border-dashed border-[var(--netrun-primary)]/30 rounded-lg text-[var(--netrun-primary)] hover:border-[var(--netrun-primary)] hover:bg-[var(--netrun-primary)]/5 transition-colors flex items-center justify-center gap-2"
          >
            <LucideIcons.Plus className="w-5 h-5" />
            Add Feature
          </button>
        )}
      </div>
    </section>
  );
};

export default FeatureGridBlock;

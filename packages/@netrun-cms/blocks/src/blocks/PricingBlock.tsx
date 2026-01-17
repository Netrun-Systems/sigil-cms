/**
 * PricingBlock - Pricing tiers display
 *
 * Adapted from NetrunnewSite PricingTiers component.
 * Displays pricing plans with features lists and CTAs.
 *
 * @module @netrun-cms/blocks
 * @author Netrun Systems
 */

import React from 'react';
import { Check, Plus, X, Star } from 'lucide-react';
import type { PricingBlockContent, PricingTier } from '@netrun-cms/core';
import { cn, getBlockSettingsClasses, type BaseBlockProps } from '../utils';

export interface PricingBlockProps extends BaseBlockProps<PricingBlockContent> {
  /** Show annual/monthly toggle */
  showBillingToggle?: boolean;
}

/**
 * PricingTierCard component - individual pricing tier
 */
const PricingTierCard: React.FC<{
  tier: PricingTier;
  mode: 'view' | 'edit';
  onUpdate?: (tier: PricingTier) => void;
  onRemove?: () => void;
}> = ({ tier, mode, onUpdate, onRemove }) => {
  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...tier.features];
    newFeatures[index] = value;
    onUpdate?.({ ...tier, features: newFeatures });
  };

  const handleAddFeature = () => {
    onUpdate?.({ ...tier, features: [...tier.features, 'New feature'] });
  };

  const handleRemoveFeature = (index: number) => {
    const newFeatures = tier.features.filter((_, i) => i !== index);
    onUpdate?.({ ...tier, features: newFeatures });
  };

  const handleCTAClick = () => {
    if (tier.ctaLink.startsWith('#')) {
      document.getElementById(tier.ctaLink.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = tier.ctaLink;
    }
  };

  return (
    <div
      className={cn(
        'relative rounded-xl p-6 flex flex-col h-full transition-all',
        tier.isPopular
          ? 'bg-[var(--netrun-primary)] text-[var(--netrun-background)] scale-105 shadow-xl z-10'
          : 'bg-[var(--netrun-surface)] text-[var(--netrun-text)] border border-[var(--netrun-primary)]/20 hover:border-[var(--netrun-primary)]/50'
      )}
    >
      {/* Popular badge */}
      {tier.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[var(--netrun-background)] text-[var(--netrun-primary)] text-xs font-bold rounded-full flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" />
          POPULAR
        </div>
      )}

      {/* Remove button in edit mode */}
      {mode === 'edit' && onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Tier name */}
      {mode === 'edit' ? (
        <input
          type="text"
          value={tier.name}
          onChange={(e) => onUpdate?.({ ...tier, name: e.target.value })}
          className={cn(
            'text-xl font-bold mb-2 bg-transparent border-b border-dashed focus:outline-none text-center',
            tier.isPopular ? 'border-current/30' : 'border-[var(--netrun-primary)]/30'
          )}
          placeholder="Tier name"
        />
      ) : (
        <h3 className="text-xl font-bold mb-2 text-center font-[var(--netrun-font-family-heading)]">
          {tier.name}
        </h3>
      )}

      {/* Price */}
      <div className="text-center mb-4">
        {mode === 'edit' ? (
          <div className="flex items-baseline justify-center gap-1">
            <input
              type="text"
              value={tier.price}
              onChange={(e) => onUpdate?.({ ...tier, price: e.target.value })}
              className={cn(
                'text-4xl font-bold bg-transparent border-b border-dashed focus:outline-none w-24 text-center',
                tier.isPopular ? 'border-current/30' : 'border-[var(--netrun-primary)]/30'
              )}
              placeholder="$0"
            />
            <input
              type="text"
              value={tier.period || ''}
              onChange={(e) => onUpdate?.({ ...tier, period: e.target.value })}
              className={cn(
                'text-sm bg-transparent border-b border-dashed focus:outline-none w-16 opacity-70',
                tier.isPopular ? 'border-current/30' : 'border-[var(--netrun-primary)]/30'
              )}
              placeholder="/month"
            />
          </div>
        ) : (
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">{tier.price}</span>
            {tier.period && (
              <span className="text-sm opacity-70">{tier.period}</span>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {(tier.description || mode === 'edit') && (
        mode === 'edit' ? (
          <textarea
            value={tier.description || ''}
            onChange={(e) => onUpdate?.({ ...tier, description: e.target.value })}
            className={cn(
              'text-sm mb-4 bg-transparent border-b border-dashed focus:outline-none text-center resize-none opacity-80',
              tier.isPopular ? 'border-current/30' : 'border-[var(--netrun-primary)]/30'
            )}
            placeholder="Tier description"
            rows={2}
          />
        ) : tier.description ? (
          <p className="text-sm mb-4 text-center opacity-80">{tier.description}</p>
        ) : null
      )}

      {/* Popular toggle in edit mode */}
      {mode === 'edit' && (
        <label className="flex items-center justify-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={tier.isPopular || false}
            onChange={(e) => onUpdate?.({ ...tier, isPopular: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-xs">Popular tier</span>
        </label>
      )}

      {/* Features */}
      <ul className="space-y-3 mb-6 flex-grow">
        {tier.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check
              className={cn(
                'w-5 h-5 flex-shrink-0 mt-0.5',
                tier.isPopular ? 'text-current' : 'text-[var(--netrun-primary)]'
              )}
            />
            {mode === 'edit' ? (
              <div className="flex-grow flex items-center gap-1">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleFeatureChange(index, e.target.value)}
                  className="flex-grow text-sm bg-transparent border-b border-dashed border-current/20 focus:border-current/50 focus:outline-none"
                  placeholder="Feature"
                />
                <button
                  onClick={() => handleRemoveFeature(index)}
                  className="p-1 opacity-50 hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <span className="text-sm">{feature}</span>
            )}
          </li>
        ))}
      </ul>

      {/* Add feature in edit mode */}
      {mode === 'edit' && (
        <button
          onClick={handleAddFeature}
          className="mb-4 py-2 text-xs border border-dashed border-current/30 rounded-lg hover:bg-current/10 flex items-center justify-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Add feature
        </button>
      )}

      {/* CTA */}
      {mode === 'edit' ? (
        <div className="space-y-2">
          <input
            type="text"
            value={tier.ctaText}
            onChange={(e) => onUpdate?.({ ...tier, ctaText: e.target.value })}
            className={cn(
              'w-full py-3 px-4 rounded-lg font-bold text-center',
              tier.isPopular
                ? 'bg-[var(--netrun-background)] text-[var(--netrun-primary)]'
                : 'bg-[var(--netrun-primary)] text-[var(--netrun-background)]'
            )}
            placeholder="CTA text"
          />
          <input
            type="text"
            value={tier.ctaLink}
            onChange={(e) => onUpdate?.({ ...tier, ctaLink: e.target.value })}
            className="w-full py-1 px-2 text-xs rounded bg-current/10 text-center"
            placeholder="CTA link"
          />
        </div>
      ) : (
        <button
          onClick={handleCTAClick}
          className={cn(
            'w-full py-3 px-4 rounded-lg font-bold transition-all',
            tier.isPopular
              ? 'bg-[var(--netrun-background)] text-[var(--netrun-primary)] hover:bg-[var(--netrun-background)]/90'
              : 'bg-[var(--netrun-primary)] text-[var(--netrun-background)] hover:bg-[var(--netrun-primary)]/90'
          )}
        >
          {tier.ctaText}
        </button>
      )}
    </div>
  );
};

/**
 * PricingBlock component - displays pricing tiers
 */
export const PricingBlock: React.FC<PricingBlockProps> = ({
  content,
  settings,
  mode = 'view',
  className,
  onContentChange,
}) => {
  const { headline, description, tiers } = content;

  const handleTierUpdate = (index: number, updatedTier: PricingTier) => {
    const newTiers = [...tiers];
    newTiers[index] = updatedTier;
    onContentChange?.({ ...content, tiers: newTiers });
  };

  const handleAddTier = () => {
    onContentChange?.({
      ...content,
      tiers: [
        ...tiers,
        {
          name: 'New Tier',
          price: '$0',
          period: '/month',
          features: ['Feature 1', 'Feature 2'],
          ctaText: 'Get Started',
          ctaLink: '#contact',
        },
      ],
    });
  };

  const handleRemoveTier = (index: number) => {
    const newTiers = tiers.filter((_, i) => i !== index);
    onContentChange?.({ ...content, tiers: newTiers });
  };

  const gridCols: Record<number, string> = {
    1: 'grid-cols-1 max-w-md',
    2: 'grid-cols-1 md:grid-cols-2 max-w-3xl',
    3: 'grid-cols-1 md:grid-cols-3 max-w-5xl',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-6xl',
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
              className="w-full text-3xl md:text-4xl font-bold text-center mb-4 bg-transparent border-b-2 border-dashed border-[var(--netrun-primary)]/30 focus:border-[var(--netrun-primary)] outline-none text-[var(--netrun-text)]"
              placeholder="Section headline"
            />
          ) : (
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-[var(--netrun-text)] font-[var(--netrun-font-family-heading)]">
              {headline}
            </h2>
          )
        )}

        {/* Description */}
        {(description || mode === 'edit') && (
          mode === 'edit' ? (
            <textarea
              value={description || ''}
              onChange={(e) => onContentChange?.({ ...content, description: e.target.value })}
              className="w-full text-lg text-center mb-12 bg-transparent border-b border-dashed border-[var(--netrun-primary)]/20 focus:border-[var(--netrun-primary)]/50 outline-none text-[var(--netrun-text-secondary)] resize-none max-w-2xl mx-auto"
              placeholder="Section description"
              rows={2}
            />
          ) : (
            <p className="text-lg text-center mb-12 text-[var(--netrun-text-secondary)] max-w-2xl mx-auto">
              {description}
            </p>
          )
        )}

        {/* Pricing tiers */}
        <div
          className={cn(
            'grid gap-6 mx-auto items-stretch',
            gridCols[Math.min(tiers.length, 4)]
          )}
        >
          {tiers.map((tier, index) => (
            <PricingTierCard
              key={index}
              tier={tier}
              mode={mode}
              onUpdate={(updated) => handleTierUpdate(index, updated)}
              onRemove={mode === 'edit' ? () => handleRemoveTier(index) : undefined}
            />
          ))}
        </div>

        {/* Add tier button in edit mode */}
        {mode === 'edit' && (
          <button
            onClick={handleAddTier}
            className="mt-8 w-full max-w-md mx-auto py-4 border-2 border-dashed border-[var(--netrun-primary)]/30 rounded-xl text-[var(--netrun-primary)] hover:border-[var(--netrun-primary)] hover:bg-[var(--netrun-primary)]/5 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Pricing Tier
          </button>
        )}
      </div>
    </section>
  );
};

export default PricingBlock;

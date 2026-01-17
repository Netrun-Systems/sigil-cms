/**
 * CTABlock - Call-to-action section with button
 *
 * Adapted from NetrunnewSite ScrollerCTA component.
 * Flexible CTA section with headline, description, and buttons.
 *
 * @module @netrun-cms/blocks
 * @author Netrun Systems
 */

import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { CTABlockContent } from '@netrun-cms/core';
import { cn, getBlockSettingsClasses, type BaseBlockProps } from '../utils';

export interface CTABlockProps extends BaseBlockProps<CTABlockContent> {
  /** Secondary button text (optional) */
  secondaryButtonText?: string;
  /** Secondary button link (optional) */
  secondaryButtonLink?: string;
}

/**
 * CTABlock component - displays a call-to-action section
 */
export const CTABlock: React.FC<CTABlockProps> = ({
  content,
  settings,
  mode = 'view',
  className,
  onContentChange,
  secondaryButtonText,
  secondaryButtonLink,
}) => {
  const {
    headline,
    description,
    buttonText,
    buttonLink,
    buttonVariant = 'primary',
    backgroundStyle = 'solid',
  } = content;

  const backgroundClasses: Record<string, string> = {
    solid: 'bg-[var(--netrun-primary)] text-[var(--netrun-background)]',
    gradient: 'bg-gradient-to-br from-[var(--netrun-primary)] to-[var(--netrun-primary-dark)] text-[var(--netrun-background)]',
    image: 'bg-[var(--netrun-surface)] text-[var(--netrun-text)]',
  };

  const buttonClasses: Record<string, string> = {
    primary: 'bg-[var(--netrun-background)] text-[var(--netrun-primary)] hover:bg-[var(--netrun-background)]/90',
    secondary: 'bg-white/20 text-inherit hover:bg-white/30 backdrop-blur-sm',
    outline: 'bg-transparent border-2 border-current hover:bg-white/10',
  };

  const handleButtonClick = (link: string) => {
    if (link.startsWith('#')) {
      document.getElementById(link.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = link;
    }
  };

  return (
    <section
      className={cn(
        getBlockSettingsClasses({ ...settings, padding: settings?.padding || 'xl' }),
        backgroundClasses[backgroundStyle],
        className
      )}
    >
      <div className="container mx-auto max-w-4xl text-center">
        {/* Headline */}
        {mode === 'edit' ? (
          <input
            type="text"
            value={headline}
            onChange={(e) => onContentChange?.({ ...content, headline: e.target.value })}
            className={cn(
              'w-full text-3xl md:text-4xl font-bold mb-6 bg-transparent border-b-2 border-dashed border-current/30 focus:border-current outline-none text-center',
              backgroundStyle !== 'image' && 'placeholder:text-current/50'
            )}
            placeholder="Enter headline..."
          />
        ) : (
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-[var(--netrun-font-family-heading)]">
            {headline}
          </h2>
        )}

        {/* Description */}
        {(description || mode === 'edit') && (
          mode === 'edit' ? (
            <textarea
              value={description || ''}
              onChange={(e) => onContentChange?.({ ...content, description: e.target.value })}
              className={cn(
                'w-full text-lg md:text-xl mb-8 bg-transparent border-b border-dashed border-current/20 focus:border-current/50 outline-none text-center resize-none opacity-90',
                backgroundStyle !== 'image' && 'placeholder:text-current/50'
              )}
              placeholder="Enter description..."
              rows={2}
            />
          ) : (
            <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              {description}
            </p>
          )
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* Primary button */}
          {mode === 'edit' ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={buttonText}
                onChange={(e) => onContentChange?.({ ...content, buttonText: e.target.value })}
                className="px-6 py-3 rounded-lg font-bold text-center bg-[var(--netrun-background)] text-[var(--netrun-primary)]"
                placeholder="Button text"
              />
              <input
                type="text"
                value={buttonLink}
                onChange={(e) => onContentChange?.({ ...content, buttonLink: e.target.value })}
                className="px-3 py-1 text-xs rounded bg-black/20 text-current text-center"
                placeholder="Button link (URL or #section)"
              />
            </div>
          ) : (
            <button
              onClick={() => handleButtonClick(buttonLink)}
              className={cn(
                'px-8 py-4 rounded-lg text-lg font-bold transition-all inline-flex items-center justify-center gap-2',
                buttonClasses[buttonVariant]
              )}
            >
              {buttonText}
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          {/* Secondary button */}
          {(secondaryButtonText || (mode === 'edit' && content.buttonVariant !== 'outline')) && (
            mode === 'view' && secondaryButtonText && secondaryButtonLink ? (
              <button
                onClick={() => handleButtonClick(secondaryButtonLink)}
                className={cn(
                  'px-8 py-4 rounded-lg text-lg font-bold transition-all',
                  buttonClasses.outline
                )}
              >
                {secondaryButtonText}
              </button>
            ) : null
          )}
        </div>

        {/* Button variant selector in edit mode */}
        {mode === 'edit' && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <label className="text-sm opacity-70">Button style:</label>
            {(['primary', 'secondary', 'outline'] as const).map((variant) => (
              <button
                key={variant}
                onClick={() => onContentChange?.({ ...content, buttonVariant: variant })}
                className={cn(
                  'px-3 py-1 rounded text-xs capitalize transition-colors',
                  buttonVariant === variant
                    ? 'bg-white/30'
                    : 'bg-white/10 hover:bg-white/20'
                )}
              >
                {variant}
              </button>
            ))}
          </div>
        )}

        {/* Background style selector in edit mode */}
        {mode === 'edit' && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <label className="text-sm opacity-70">Background:</label>
            {(['solid', 'gradient', 'image'] as const).map((style) => (
              <button
                key={style}
                onClick={() => onContentChange?.({ ...content, backgroundStyle: style })}
                className={cn(
                  'px-3 py-1 rounded text-xs capitalize transition-colors',
                  backgroundStyle === style
                    ? 'bg-white/30'
                    : 'bg-white/10 hover:bg-white/20'
                )}
              >
                {style}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CTABlock;

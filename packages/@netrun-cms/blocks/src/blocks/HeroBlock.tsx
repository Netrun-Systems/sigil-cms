/**
 * HeroBlock - Full-width hero section with title, subtitle, CTA buttons, and background
 *
 * Adapted from NetrunnewSite LandingHero component for the CMS block system.
 * Supports both view and edit modes with customizable settings.
 *
 * @module @netrun-cms/blocks
 * @author Netrun Systems
 */

import React from 'react';
import type { HeroBlockContent } from '@netrun-cms/core';
import { cn, getBlockSettingsClasses, type BaseBlockProps } from '../utils';

export interface HeroBlockProps extends BaseBlockProps<HeroBlockContent> {
  /** Background overlay opacity (0-1) */
  overlayOpacity?: number;
}

/**
 * HeroBlock component - displays a hero section with headline, subheadline, and CTAs
 */
export const HeroBlock: React.FC<HeroBlockProps> = ({
  content,
  settings,
  mode = 'view',
  className,
  onContentChange,
  overlayOpacity = 0.5,
}) => {
  const {
    headline,
    subheadline,
    backgroundImage,
    backgroundVideo,
    ctaText,
    ctaLink,
    ctaSecondaryText,
    ctaSecondaryLink,
    alignment = 'center',
  } = content;

  const handleCTAClick = (link?: string) => {
    if (!link) return;
    if (link.startsWith('#')) {
      document.getElementById(link.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = link;
    }
  };

  const alignmentClasses: Record<string, string> = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  const hasBackground = backgroundImage || backgroundVideo;

  return (
    <section
      className={cn(
        'relative min-h-[60vh] flex items-center',
        getBlockSettingsClasses({ ...settings, padding: settings?.padding || 'xl' }),
        hasBackground ? 'text-white' : 'text-[var(--netrun-text)]',
        className
      )}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Video Background */}
      {backgroundVideo && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={backgroundVideo} type="video/mp4" />
        </video>
      )}

      {/* Overlay */}
      {hasBackground && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Content */}
      <div className={cn('relative z-10 w-full', settings?.width === 'narrow' ? 'max-w-4xl' : 'max-w-6xl', 'mx-auto px-4')}>
        <div className={cn('flex flex-col', alignmentClasses[alignment])}>
          {/* Headline */}
          {mode === 'edit' ? (
            <input
              type="text"
              value={headline}
              onChange={(e) =>
                onContentChange?.({ ...content, headline: e.target.value })
              }
              className={cn(
                'text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-transparent border-b-2 border-dashed border-white/50 focus:border-white outline-none w-full',
                alignment === 'center' && 'text-center'
              )}
              placeholder="Enter headline..."
            />
          ) : (
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-[var(--netrun-font-family-heading)]">
              {headline}
            </h1>
          )}

          {/* Subheadline */}
          {(subheadline || mode === 'edit') && (
            mode === 'edit' ? (
              <textarea
                value={subheadline || ''}
                onChange={(e) =>
                  onContentChange?.({ ...content, subheadline: e.target.value })
                }
                className={cn(
                  'text-xl md:text-2xl mb-8 bg-transparent border-b-2 border-dashed border-white/30 focus:border-white/50 outline-none w-full max-w-3xl resize-none',
                  alignment === 'center' && 'text-center mx-auto'
                )}
                placeholder="Enter subheadline..."
                rows={2}
              />
            ) : (
              <p className={cn('text-xl md:text-2xl mb-8 opacity-90 max-w-3xl', alignment === 'center' && 'mx-auto')}>
                {subheadline}
              </p>
            )
          )}

          {/* CTA Buttons */}
          {(ctaText || ctaSecondaryText || mode === 'edit') && (
            <div className={cn(
              'flex flex-col sm:flex-row gap-4',
              alignment === 'center' && 'justify-center',
              alignment === 'right' && 'justify-end'
            )}>
              {(ctaText || mode === 'edit') && (
                <button
                  onClick={() => mode === 'view' && handleCTAClick(ctaLink)}
                  className={cn(
                    'px-8 py-4 text-lg font-bold rounded-lg transition-all',
                    'bg-[var(--netrun-primary)] text-[var(--netrun-background)] hover:opacity-90',
                    mode === 'edit' && 'cursor-text'
                  )}
                >
                  {mode === 'edit' ? (
                    <input
                      type="text"
                      value={ctaText || ''}
                      onChange={(e) =>
                        onContentChange?.({ ...content, ctaText: e.target.value })
                      }
                      className="bg-transparent outline-none text-center w-full min-w-[100px]"
                      placeholder="Primary CTA"
                    />
                  ) : (
                    ctaText
                  )}
                </button>
              )}

              {(ctaSecondaryText || mode === 'edit') && (
                <button
                  onClick={() => mode === 'view' && handleCTAClick(ctaSecondaryLink)}
                  className={cn(
                    'px-8 py-4 text-lg font-bold rounded-lg transition-all',
                    'bg-transparent border-2 border-current hover:bg-white/10',
                    mode === 'edit' && 'cursor-text'
                  )}
                >
                  {mode === 'edit' ? (
                    <input
                      type="text"
                      value={ctaSecondaryText || ''}
                      onChange={(e) =>
                        onContentChange?.({ ...content, ctaSecondaryText: e.target.value })
                      }
                      className="bg-transparent outline-none text-center w-full min-w-[100px]"
                      placeholder="Secondary CTA"
                    />
                  ) : (
                    ctaSecondaryText
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroBlock;

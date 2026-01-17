/**
 * TestimonialsBlock - Customer testimonials carousel/grid
 *
 * Displays customer testimonials in grid or carousel layout.
 * Supports avatar, name, role, and company information.
 *
 * @module @netrun-cms/blocks
 * @author Netrun Systems
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Quote, ChevronLeft, ChevronRight, Plus, X, User } from 'lucide-react';
import type { TestimonialBlockContent, Testimonial } from '@netrun-cms/core';
import { cn, getBlockSettingsClasses, type BaseBlockProps } from '../utils';

export interface TestimonialsBlockProps extends BaseBlockProps<TestimonialBlockContent> {
  /** Auto-play carousel (only for carousel layout) */
  autoPlay?: boolean;
  /** Auto-play interval in milliseconds */
  autoPlayInterval?: number;
}

/**
 * TestimonialCard component - individual testimonial display
 */
const TestimonialCard: React.FC<{
  testimonial: Testimonial;
  mode: 'view' | 'edit';
  onUpdate?: (testimonial: Testimonial) => void;
  onRemove?: () => void;
}> = ({ testimonial, mode, onUpdate, onRemove }) => {
  if (mode === 'edit') {
    return (
      <div className="relative p-6 rounded-xl bg-[var(--netrun-surface)] border border-[var(--netrun-primary)]/20 group">
        {/* Remove button */}
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Quote */}
        <Quote className="w-8 h-8 text-[var(--netrun-primary)] mb-4 opacity-50" />
        <textarea
          value={testimonial.quote}
          onChange={(e) => onUpdate?.({ ...testimonial, quote: e.target.value })}
          className="w-full mb-4 bg-transparent border-b border-dashed border-[var(--netrun-primary)]/30 focus:border-[var(--netrun-primary)] outline-none text-[var(--netrun-text)] resize-none"
          placeholder="Testimonial quote..."
          rows={3}
        />

        {/* Author info */}
        <div className="flex items-center gap-4">
          {/* Avatar URL */}
          <div className="flex-shrink-0">
            {testimonial.avatar ? (
              <img
                src={testimonial.avatar}
                alt={testimonial.author}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[var(--netrun-primary)]/20 flex items-center justify-center">
                <User className="w-6 h-6 text-[var(--netrun-primary)]" />
              </div>
            )}
          </div>

          <div className="flex-grow space-y-1">
            <input
              type="text"
              value={testimonial.author}
              onChange={(e) => onUpdate?.({ ...testimonial, author: e.target.value })}
              className="w-full font-bold bg-transparent border-b border-dashed border-[var(--netrun-primary)]/20 focus:border-[var(--netrun-primary)]/50 outline-none text-[var(--netrun-text)] text-sm"
              placeholder="Author name"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={testimonial.role || ''}
                onChange={(e) => onUpdate?.({ ...testimonial, role: e.target.value })}
                className="flex-1 bg-transparent border-b border-dashed border-[var(--netrun-primary)]/10 focus:border-[var(--netrun-primary)]/30 outline-none text-[var(--netrun-text-secondary)] text-xs"
                placeholder="Role"
              />
              <input
                type="text"
                value={testimonial.company || ''}
                onChange={(e) => onUpdate?.({ ...testimonial, company: e.target.value })}
                className="flex-1 bg-transparent border-b border-dashed border-[var(--netrun-primary)]/10 focus:border-[var(--netrun-primary)]/30 outline-none text-[var(--netrun-text-secondary)] text-xs"
                placeholder="Company"
              />
            </div>
            <input
              type="text"
              value={testimonial.avatar || ''}
              onChange={(e) => onUpdate?.({ ...testimonial, avatar: e.target.value })}
              className="w-full bg-transparent border-b border-dashed border-[var(--netrun-primary)]/10 focus:border-[var(--netrun-primary)]/30 outline-none text-[var(--netrun-text-secondary)] text-xs"
              placeholder="Avatar URL (optional)"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-[var(--netrun-surface)] border border-[var(--netrun-primary)]/10 hover:border-[var(--netrun-primary)]/30 transition-colors">
      <Quote className="w-8 h-8 text-[var(--netrun-primary)] mb-4 opacity-50" />
      <p className="text-[var(--netrun-text)] mb-6 leading-relaxed italic">
        "{testimonial.quote}"
      </p>

      <div className="flex items-center gap-4">
        {testimonial.avatar ? (
          <img
            src={testimonial.avatar}
            alt={testimonial.author}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[var(--netrun-primary)]/20 flex items-center justify-center">
            <User className="w-6 h-6 text-[var(--netrun-primary)]" />
          </div>
        )}
        <div>
          <p className="font-bold text-[var(--netrun-text)]">{testimonial.author}</p>
          {(testimonial.role || testimonial.company) && (
            <p className="text-sm text-[var(--netrun-text-secondary)]">
              {testimonial.role}
              {testimonial.role && testimonial.company && ' at '}
              {testimonial.company}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * TestimonialsBlock component - displays testimonials in grid or carousel
 */
export const TestimonialsBlock: React.FC<TestimonialsBlockProps> = ({
  content,
  settings,
  mode = 'view',
  className,
  onContentChange,
  autoPlay = true,
  autoPlayInterval = 5000,
}) => {
  const { testimonials, layout = 'grid' } = content;
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play for carousel
  useEffect(() => {
    if (layout !== 'carousel' || !autoPlay || mode === 'edit' || testimonials.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [layout, autoPlay, autoPlayInterval, testimonials.length, mode]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const handleTestimonialUpdate = (index: number, updated: Testimonial) => {
    const newTestimonials = [...testimonials];
    newTestimonials[index] = updated;
    onContentChange?.({ ...content, testimonials: newTestimonials });
  };

  const handleAddTestimonial = () => {
    onContentChange?.({
      ...content,
      testimonials: [
        ...testimonials,
        {
          quote: 'New testimonial quote',
          author: 'Author Name',
          role: 'Role',
          company: 'Company',
        },
      ],
    });
  };

  const handleRemoveTestimonial = (index: number) => {
    const newTestimonials = testimonials.filter((_, i) => i !== index);
    onContentChange?.({ ...content, testimonials: newTestimonials });
  };

  return (
    <section
      className={cn(
        getBlockSettingsClasses(settings),
        className
      )}
    >
      <div className="container mx-auto max-w-6xl">
        {/* Layout toggle in edit mode */}
        {mode === 'edit' && (
          <div className="flex items-center justify-center gap-4 mb-8">
            <label className="text-sm text-[var(--netrun-text-secondary)]">Layout:</label>
            {(['grid', 'carousel'] as const).map((l) => (
              <button
                key={l}
                onClick={() => onContentChange?.({ ...content, layout: l })}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm capitalize transition-colors',
                  layout === l
                    ? 'bg-[var(--netrun-primary)] text-[var(--netrun-background)]'
                    : 'bg-[var(--netrun-surface)] text-[var(--netrun-text)]'
                )}
              >
                {l}
              </button>
            ))}
          </div>
        )}

        {/* Grid layout */}
        {layout === 'grid' && (
          <div
            className={cn(
              'grid gap-6',
              testimonials.length === 1
                ? 'grid-cols-1 max-w-2xl mx-auto'
                : testimonials.length === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            )}
          >
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                testimonial={testimonial}
                mode={mode}
                onUpdate={(updated) => handleTestimonialUpdate(index, updated)}
                onRemove={mode === 'edit' ? () => handleRemoveTestimonial(index) : undefined}
              />
            ))}
          </div>
        )}

        {/* Carousel layout */}
        {layout === 'carousel' && (
          <div className="relative">
            {/* Carousel container */}
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <div className="max-w-2xl mx-auto">
                      <TestimonialCard
                        testimonial={testimonial}
                        mode={mode}
                        onUpdate={(updated) => handleTestimonialUpdate(index, updated)}
                        onRemove={mode === 'edit' ? () => handleRemoveTestimonial(index) : undefined}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation arrows (view mode only) */}
            {mode === 'view' && testimonials.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[var(--netrun-surface)] border border-[var(--netrun-primary)]/20 text-[var(--netrun-text)] hover:border-[var(--netrun-primary)] transition-colors"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[var(--netrun-surface)] border border-[var(--netrun-primary)]/20 text-[var(--netrun-text)] hover:border-[var(--netrun-primary)] transition-colors"
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Dots navigation */}
            {testimonials.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      'w-2.5 h-2.5 rounded-full transition-colors',
                      index === currentIndex
                        ? 'bg-[var(--netrun-primary)]'
                        : 'bg-[var(--netrun-primary)]/30 hover:bg-[var(--netrun-primary)]/50'
                    )}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add testimonial button in edit mode */}
        {mode === 'edit' && (
          <button
            onClick={handleAddTestimonial}
            className="mt-8 w-full max-w-md mx-auto py-4 border-2 border-dashed border-[var(--netrun-primary)]/30 rounded-xl text-[var(--netrun-primary)] hover:border-[var(--netrun-primary)] hover:bg-[var(--netrun-primary)]/5 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Testimonial
          </button>
        )}
      </div>
    </section>
  );
};

export default TestimonialsBlock;

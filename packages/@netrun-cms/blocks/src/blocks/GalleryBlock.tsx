/**
 * GalleryBlock - Image gallery with lightbox support
 *
 * Displays images in grid, masonry, or carousel layouts.
 * Includes lightbox functionality for full-screen viewing.
 *
 * @module @netrun-cms/blocks
 * @author Netrun Systems
 */

import React, { useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import type { GalleryBlockContent, ImageBlockContent } from '@netrun-cms/core';
import { cn, getBlockSettingsClasses, type BaseBlockProps } from '../utils';

export interface GalleryBlockProps extends BaseBlockProps<GalleryBlockContent> {
  /** Enable lightbox on click */
  enableLightbox?: boolean;
  /** Image aspect ratio */
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'auto';
}

/**
 * Lightbox component for full-screen image viewing
 */
const Lightbox: React.FC<{
  images: ImageBlockContent[];
  currentIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}> = ({ images, currentIndex, onClose, onPrevious, onNext }) => {
  const currentImage = images[currentIndex];

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrevious();
      if (e.key === 'ArrowRight') onNext();
    },
    [onClose, onPrevious, onNext]
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
        aria-label="Close lightbox"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Previous button */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-10 h-10" />
        </button>
      )}

      {/* Image */}
      <div
        className="max-w-[90vw] max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage.src}
          alt={currentImage.alt}
          className="max-w-full max-h-[80vh] object-contain"
        />
        {currentImage.caption && (
          <p className="mt-4 text-white/80 text-center max-w-2xl">
            {currentImage.caption}
          </p>
        )}
        <p className="mt-2 text-white/50 text-sm">
          {currentIndex + 1} / {images.length}
        </p>
      </div>

      {/* Next button */}
      {currentIndex < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition-colors"
          aria-label="Next image"
        >
          <ChevronRight className="w-10 h-10" />
        </button>
      )}
    </div>
  );
};

/**
 * GalleryBlock component - displays images in various layouts
 */
export const GalleryBlock: React.FC<GalleryBlockProps> = ({
  content,
  settings,
  mode = 'view',
  className,
  onContentChange,
  enableLightbox = true,
  aspectRatio = 'landscape',
}) => {
  const { images, layout = 'grid', columns = 3 } = content;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const aspectRatioClasses: Record<string, string> = {
    square: 'aspect-square',
    landscape: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: '',
  };

  const gridColsClasses: Record<number, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  };

  const handleImageClick = (index: number) => {
    if (mode === 'view' && enableLightbox) {
      setLightboxIndex(index);
    }
  };

  const handleImageUpdate = (index: number, updates: Partial<ImageBlockContent>) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], ...updates };
    onContentChange?.({ ...content, images: newImages });
  };

  const handleAddImage = () => {
    onContentChange?.({
      ...content,
      images: [
        ...images,
        {
          src: 'https://via.placeholder.com/800x600',
          alt: 'New image',
        },
      ],
    });
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onContentChange?.({ ...content, images: newImages });
  };

  const renderImage = (image: ImageBlockContent, index: number) => (
    <div
      key={index}
      className={cn(
        'relative group overflow-hidden rounded-lg bg-[var(--netrun-surface)]',
        aspectRatio !== 'auto' && aspectRatioClasses[aspectRatio],
        mode === 'view' && enableLightbox && 'cursor-pointer'
      )}
      onClick={() => handleImageClick(index)}
    >
      <img
        src={image.src}
        alt={image.alt}
        className={cn(
          'w-full h-full object-cover transition-transform duration-300',
          mode === 'view' && enableLightbox && 'group-hover:scale-105'
        )}
      />

      {/* Overlay on hover in view mode */}
      {mode === 'view' && image.caption && (
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
          <p className="p-4 text-white text-sm">{image.caption}</p>
        </div>
      )}

      {/* Edit controls */}
      {mode === 'edit' && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
          <input
            type="text"
            value={image.src}
            onChange={(e) => handleImageUpdate(index, { src: e.target.value })}
            className="w-full px-2 py-1 text-xs rounded bg-white/90 text-gray-800"
            placeholder="Image URL"
            onClick={(e) => e.stopPropagation()}
          />
          <input
            type="text"
            value={image.alt}
            onChange={(e) => handleImageUpdate(index, { alt: e.target.value })}
            className="w-full px-2 py-1 text-xs rounded bg-white/90 text-gray-800"
            placeholder="Alt text"
            onClick={(e) => e.stopPropagation()}
          />
          <input
            type="text"
            value={image.caption || ''}
            onChange={(e) => handleImageUpdate(index, { caption: e.target.value })}
            className="w-full px-2 py-1 text-xs rounded bg-white/90 text-gray-800"
            placeholder="Caption (optional)"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveImage(index);
            }}
            className="mt-2 p-2 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <section
      className={cn(
        getBlockSettingsClasses(settings),
        className
      )}
    >
      <div className="container mx-auto max-w-6xl">
        {/* Layout and column controls in edit mode */}
        {mode === 'edit' && (
          <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--netrun-text-secondary)]">Layout:</label>
              {(['grid', 'masonry', 'carousel'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => onContentChange?.({ ...content, layout: l })}
                  className={cn(
                    'px-3 py-1 rounded text-sm capitalize transition-colors',
                    layout === l
                      ? 'bg-[var(--netrun-primary)] text-[var(--netrun-background)]'
                      : 'bg-[var(--netrun-surface)] text-[var(--netrun-text)]'
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--netrun-text-secondary)]">Columns:</label>
              {[2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => onContentChange?.({ ...content, columns: num })}
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
          </div>
        )}

        {/* Gallery */}
        {layout === 'carousel' ? (
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory">
            {images.map((image, index) => (
              <div
                key={index}
                className={cn('flex-shrink-0 snap-center', 'w-[80%] sm:w-[60%] lg:w-[40%]')}
              >
                {renderImage(image, index)}
              </div>
            ))}
          </div>
        ) : (
          <div className={cn('grid gap-4', gridColsClasses[columns || 3])}>
            {images.map((image, index) => renderImage(image, index))}
          </div>
        )}

        {/* Add image button in edit mode */}
        {mode === 'edit' && (
          <button
            onClick={handleAddImage}
            className="mt-6 w-full py-4 border-2 border-dashed border-[var(--netrun-primary)]/30 rounded-lg text-[var(--netrun-primary)] hover:border-[var(--netrun-primary)] hover:bg-[var(--netrun-primary)]/5 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Image
          </button>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrevious={() => setLightboxIndex(Math.max(0, lightboxIndex - 1))}
          onNext={() => setLightboxIndex(Math.min(images.length - 1, lightboxIndex + 1))}
        />
      )}
    </section>
  );
};

export default GalleryBlock;

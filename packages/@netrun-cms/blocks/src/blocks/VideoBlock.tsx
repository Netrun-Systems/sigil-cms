/**
 * VideoBlock - Embedded video from YouTube or Vimeo
 *
 * Renders an embeddable video player from a YouTube or Vimeo URL.
 * Automatically detects the platform and generates the correct embed URL.
 * Supports both view and edit modes.
 *
 * @module @netrun-cms/blocks
 * @author Netrun Systems
 */

import React, { useMemo } from 'react';
import { cn, getBlockSettingsClasses, type BaseBlockProps } from '../utils';

export interface VideoBlockContent {
  /** YouTube or Vimeo URL */
  url: string;
  /** Optional video title / accessible label */
  title?: string;
  /** Optional caption displayed below the video */
  caption?: string;
  /** Aspect ratio of the video embed */
  aspectRatio?: '16:9' | '4:3' | '1:1';
  /** Auto-play the video (muted) */
  autoPlay?: boolean;
}

export interface VideoBlockProps extends BaseBlockProps<VideoBlockContent> {}

type VideoSource = 'youtube' | 'vimeo' | 'unknown';

interface ParsedVideo {
  source: VideoSource;
  embedUrl: string | null;
}

/**
 * Parse a YouTube or Vimeo URL and return the embed URL
 */
function parseVideoUrl(url: string): ParsedVideo {
  if (!url) return { source: 'unknown', embedUrl: null };

  // YouTube patterns: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID
  const youtubePatterns = [
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return {
        source: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`,
      };
    }
  }

  // Vimeo patterns: vimeo.com/ID, player.vimeo.com/video/ID
  const vimeoPatterns = [
    /(?:vimeo\.com\/)(\d+)/,
    /(?:player\.vimeo\.com\/video\/)(\d+)/,
  ];

  for (const pattern of vimeoPatterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return {
        source: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${match[1]}?dnt=1`,
      };
    }
  }

  return { source: 'unknown', embedUrl: null };
}

const aspectRatioClasses: Record<string, string> = {
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
};

/**
 * VideoBlock component - embeds a YouTube or Vimeo video
 */
export const VideoBlock: React.FC<VideoBlockProps> = ({
  content,
  settings,
  mode = 'view',
  className,
  onContentChange,
}) => {
  const { url, title, caption, aspectRatio = '16:9' } = content;

  const parsed = useMemo(() => parseVideoUrl(url), [url]);

  if (mode === 'edit') {
    return (
      <section
        className={cn(
          getBlockSettingsClasses(settings),
          className
        )}
      >
        <div className="container mx-auto max-w-4xl space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--netrun-text-secondary)]">
              Video URL <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => onContentChange?.({ ...content, url: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--netrun-surface)] border border-[var(--netrun-border)] text-[var(--netrun-text)] focus:outline-none focus:border-[var(--netrun-primary)]"
              placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
            />
            {url && parsed.source !== 'unknown' && (
              <p className="text-xs text-[var(--netrun-primary)]">
                Detected: {parsed.source.charAt(0).toUpperCase() + parsed.source.slice(1)}
              </p>
            )}
            {url && parsed.source === 'unknown' && (
              <p className="text-xs text-red-400">
                Could not parse URL. Supported: YouTube, Vimeo.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--netrun-text-secondary)]">
              Title / Aria Label
            </label>
            <input
              type="text"
              value={title || ''}
              onChange={(e) => onContentChange?.({ ...content, title: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--netrun-surface)] border border-[var(--netrun-border)] text-[var(--netrun-text)] focus:outline-none focus:border-[var(--netrun-primary)]"
              placeholder="Video title (for accessibility)"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--netrun-text-secondary)]">
              Caption (optional)
            </label>
            <input
              type="text"
              value={caption || ''}
              onChange={(e) => onContentChange?.({ ...content, caption: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--netrun-surface)] border border-[var(--netrun-border)] text-[var(--netrun-text)] focus:outline-none focus:border-[var(--netrun-primary)]"
              placeholder="Optional caption below the video"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--netrun-text-secondary)]">
              Aspect Ratio
            </label>
            <div className="flex gap-3">
              {(['16:9', '4:3', '1:1'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => onContentChange?.({ ...content, aspectRatio: ratio })}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    aspectRatio === ratio
                      ? 'bg-[var(--netrun-primary)] text-[var(--netrun-background)]'
                      : 'bg-[var(--netrun-surface)] text-[var(--netrun-text)] hover:bg-[var(--netrun-surface-hover)]'
                  )}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {parsed.embedUrl && (
            <div className="mt-4">
              <p className="text-sm text-[var(--netrun-text-secondary)] mb-2">Preview:</p>
              <div className={cn('relative w-full rounded-lg overflow-hidden bg-black', aspectRatioClasses[aspectRatio])}>
                <iframe
                  src={parsed.embedUrl}
                  title={title || 'Video preview'}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (!parsed.embedUrl) {
    return (
      <section className={cn(getBlockSettingsClasses(settings), className)}>
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center h-48 rounded-lg bg-[var(--netrun-surface)] text-[var(--netrun-text-secondary)]">
            <p className="text-sm">Video unavailable</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        getBlockSettingsClasses(settings),
        className
      )}
    >
      <figure className="container mx-auto max-w-4xl">
        <div className={cn('relative w-full rounded-lg overflow-hidden bg-black shadow-lg', aspectRatioClasses[aspectRatio])}>
          <iframe
            src={parsed.embedUrl}
            title={title || 'Embedded video'}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
        {caption && (
          <figcaption className="mt-3 text-center text-sm text-[var(--netrun-text-secondary)]">
            {caption}
          </figcaption>
        )}
      </figure>
    </section>
  );
};

export default VideoBlock;

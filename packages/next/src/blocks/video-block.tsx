'use client';

import type { BlockComponentProps } from '../types.js';

/**
 * Default video block renderer.
 * Supports direct video URLs and embed URLs (YouTube, Vimeo).
 * Marked 'use client' for potential player interactivity.
 */
export function VideoBlock({ block, content }: BlockComponentProps) {
  const src = (content.src as string) ?? (content.url as string);
  const embedUrl = content.embedUrl as string | undefined;
  const title = (content.title as string) ?? 'Video';
  const poster = content.poster as string | undefined;
  const autoplay = content.autoplay as boolean | undefined;

  const url = embedUrl ?? src;
  if (!url) return null;

  const isEmbed = url.includes('youtube') || url.includes('vimeo') || url.includes('embed');

  return (
    <div
      className={`sigil-block sigil-block--video ${block.settings.customClass ?? ''}`}
      data-block-id={block.id}
      data-block-type="video"
    >
      {isEmbed ? (
        <div className="sigil-video__embed">
          <iframe
            src={url}
            title={title}
            className="sigil-video__iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <video
          src={url}
          poster={poster}
          controls
          autoPlay={autoplay}
          className="sigil-video__player"
          title={title}
        />
      )}
    </div>
  );
}

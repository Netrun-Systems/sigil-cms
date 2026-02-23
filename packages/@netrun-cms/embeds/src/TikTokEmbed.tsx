import { useEffect } from 'react';
import { LazyEmbed } from './LazyEmbed';

interface TikTokEmbedProps {
  /** TikTok video ID */
  videoId: string;
  className?: string;
}

export function TikTokEmbed({ videoId, className }: TikTokEmbedProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).tiktokEmbed) {
      const script = document.createElement('script');
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [videoId]);

  return (
    <LazyEmbed title="TikTok Video" aspectRatio="auto" className={className}>
      {(isVisible) =>
        isVisible ? (
          <blockquote
            className="tiktok-embed"
            cite={`https://www.tiktok.com/video/${videoId}`}
            data-video-id={videoId}
            style={{ maxWidth: '605px', margin: '0 auto' }}
          >
            <section />
          </blockquote>
        ) : (
          <div style={{ height: '700px', background: 'var(--netrun-surface, #1a1a1a)' }} />
        )
      }
    </LazyEmbed>
  );
}

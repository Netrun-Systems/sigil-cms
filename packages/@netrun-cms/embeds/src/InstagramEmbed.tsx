import { useEffect, useRef } from 'react';
import { LazyEmbed } from './LazyEmbed';

interface InstagramEmbedProps {
  /** Instagram post URL */
  url: string;
  className?: string;
}

export function InstagramEmbed({ url, className }: InstagramEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).instgrm) {
      const script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    } else if ((window as any).instgrm) {
      (window as any).instgrm.Embeds.process();
    }
  }, [url]);

  return (
    <LazyEmbed title="Instagram Post" aspectRatio="auto" className={className}>
      {(isVisible) =>
        isVisible ? (
          <div ref={containerRef}>
            <blockquote
              className="instagram-media"
              data-instgrm-permalink={url}
              data-instgrm-version="14"
              style={{
                background: 'var(--netrun-surface, #1a1a1a)',
                borderRadius: '12px',
                maxWidth: '540px',
                width: '100%',
                margin: '0 auto',
              }}
            />
          </div>
        ) : (
          <div style={{ height: '400px', background: 'var(--netrun-surface, #1a1a1a)' }} />
        )
      }
    </LazyEmbed>
  );
}

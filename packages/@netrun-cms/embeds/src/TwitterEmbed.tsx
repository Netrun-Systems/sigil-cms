import { useEffect, useRef } from 'react';
import { LazyEmbed } from './LazyEmbed';

interface TwitterEmbedProps {
  /** Tweet URL or Twitter/X profile URL */
  url: string;
  /** Embed type */
  type?: 'tweet' | 'timeline';
  className?: string;
}

export function TwitterEmbed({ url, type = 'tweet', className }: TwitterEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const existing = document.getElementById('twitter-wjs');
      if (!existing) {
        const script = document.createElement('script');
        script.id = 'twitter-wjs';
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        document.body.appendChild(script);
      } else if ((window as any).twttr?.widgets) {
        (window as any).twttr.widgets.load(containerRef.current);
      }
    }
  }, [url]);

  return (
    <LazyEmbed title="Twitter/X Post" aspectRatio="auto" className={className}>
      {(isVisible) =>
        isVisible ? (
          <div ref={containerRef} style={{ maxWidth: '550px', margin: '0 auto' }}>
            {type === 'tweet' ? (
              <blockquote className="twitter-tweet" data-theme="dark">
                <a href={url}> </a>
              </blockquote>
            ) : (
              <a
                className="twitter-timeline"
                data-theme="dark"
                data-height="600"
                href={url}
              >
                Timeline
              </a>
            )}
          </div>
        ) : (
          <div style={{ height: '400px', background: 'var(--netrun-surface, #1a1a1a)' }} />
        )
      }
    </LazyEmbed>
  );
}

import { LazyEmbed } from './LazyEmbed';

interface AppleMusicEmbedProps {
  /** Apple Music URL (album, playlist, song) */
  url: string;
  height?: number;
  className?: string;
}

export function AppleMusicEmbed({ url, height = 450, className }: AppleMusicEmbedProps) {
  const embedUrl = url.replace('music.apple.com', 'embed.music.apple.com');

  return (
    <LazyEmbed title="Apple Music Player" aspectRatio="auto" className={className}>
      {(isVisible) =>
        isVisible ? (
          <iframe
            src={embedUrl}
            width="100%"
            height={height}
            frameBorder="0"
            allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
            sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
            loading="lazy"
            style={{ borderRadius: '12px', overflow: 'hidden' }}
          />
        ) : (
          <div style={{ height: `${height}px`, background: 'var(--netrun-surface, #1a1a1a)' }} />
        )
      }
    </LazyEmbed>
  );
}

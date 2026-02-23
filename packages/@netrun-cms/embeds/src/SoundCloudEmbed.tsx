import { LazyEmbed } from './LazyEmbed';

interface SoundCloudEmbedProps {
  /** Full SoundCloud track or playlist URL */
  url: string;
  compact?: boolean;
  className?: string;
}

export function SoundCloudEmbed({ url, compact = false, className }: SoundCloudEmbedProps) {
  const height = compact ? 166 : 300;
  const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%236C63FF&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=${!compact}`;

  return (
    <LazyEmbed title="SoundCloud Player" aspectRatio="auto" className={className}>
      {(isVisible) =>
        isVisible ? (
          <iframe
            src={src}
            width="100%"
            height={height}
            frameBorder="0"
            allow="autoplay"
            loading="lazy"
            scrolling="no"
            style={{ borderRadius: '12px' }}
          />
        ) : (
          <div style={{ height: `${height}px`, background: 'var(--netrun-surface, #1a1a1a)' }} />
        )
      }
    </LazyEmbed>
  );
}

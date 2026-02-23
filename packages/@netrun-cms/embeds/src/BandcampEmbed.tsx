import { LazyEmbed } from './LazyEmbed';

interface BandcampEmbedProps {
  /** Bandcamp album or track ID (numeric) */
  albumId: string;
  trackId?: string;
  size?: 'large' | 'small';
  className?: string;
}

export function BandcampEmbed({ albumId, trackId, size = 'large', className }: BandcampEmbedProps) {
  const height = size === 'large' ? 470 : 120;
  const sizeParam = size === 'large' ? 'size=large/bgcol=0a0a12/linkcol=6c63ff' : 'size=small/bgcol=0a0a12/linkcol=6c63ff';
  const trackParam = trackId ? `/track=${trackId}` : '';
  const src = `https://bandcamp.com/EmbeddedPlayer/album=${albumId}${trackParam}/${sizeParam}/transparent=true/`;

  return (
    <LazyEmbed title="Bandcamp Player" aspectRatio="auto" className={className}>
      {(isVisible) =>
        isVisible ? (
          <iframe
            src={src}
            width="100%"
            height={height}
            frameBorder="0"
            seamless
            loading="lazy"
            style={{ borderRadius: '12px' }}
          />
        ) : (
          <div style={{ height: `${height}px`, background: 'var(--netrun-surface, #1a1a1a)' }} />
        )
      }
    </LazyEmbed>
  );
}

import { LazyEmbed } from './LazyEmbed';

interface SpotifyEmbedProps {
  /** Spotify URI or URL (track, album, playlist, artist) */
  uri: string;
  type?: 'track' | 'album' | 'playlist' | 'artist';
  compact?: boolean;
  className?: string;
}

function parseSpotifyId(uri: string): { type: string; id: string } | null {
  const urlMatch = uri.match(/open\.spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
  if (urlMatch) return { type: urlMatch[1], id: urlMatch[2] };

  const uriMatch = uri.match(/spotify:(track|album|playlist|artist):([a-zA-Z0-9]+)/);
  if (uriMatch) return { type: uriMatch[1], id: uriMatch[2] };

  return null;
}

export function SpotifyEmbed({ uri, type, compact = false, className }: SpotifyEmbedProps) {
  const parsed = parseSpotifyId(uri);
  if (!parsed) return null;

  const embedType = type || parsed.type;
  const height = compact ? '80' : embedType === 'track' ? '152' : '352';
  const src = `https://open.spotify.com/embed/${embedType}/${parsed.id}?utm_source=generator&theme=0`;

  return (
    <LazyEmbed title="Spotify Player" aspectRatio="auto" className={className}>
      {(isVisible) =>
        isVisible ? (
          <iframe
            src={src}
            width="100%"
            height={height}
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
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

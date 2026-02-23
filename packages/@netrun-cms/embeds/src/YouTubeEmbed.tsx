import { LazyEmbed } from './LazyEmbed';

interface YouTubeEmbedProps {
  videoId: string;
  className?: string;
}

export function YouTubeEmbed({ videoId, className }: YouTubeEmbedProps) {
  return (
    <LazyEmbed title="YouTube Video" className={className}>
      {(isVisible) =>
        isVisible ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            style={{ position: 'absolute', inset: 0, borderRadius: '12px' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--netrun-surface, #1a1a1a)' }} />
        )
      }
    </LazyEmbed>
  );
}

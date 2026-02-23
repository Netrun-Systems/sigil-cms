import { LazyEmbed } from './LazyEmbed';

interface TwitchEmbedProps {
  /** Twitch channel name */
  channel: string;
  /** Show chat alongside player */
  withChat?: boolean;
  /** Parent domain for Twitch embed security */
  parent?: string;
  className?: string;
}

export function TwitchEmbed({ channel, withChat = false, parent = 'localhost', className }: TwitchEmbedProps) {
  const src = `https://player.twitch.tv/?channel=${channel}&parent=${parent}&muted=true`;

  return (
    <LazyEmbed title="Twitch Stream" className={className}>
      {(isVisible) =>
        isVisible ? (
          <div style={{ display: 'flex', gap: '1rem', width: '100%', height: '100%' }}>
            <iframe
              src={src}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              loading="lazy"
              style={{ position: 'absolute', inset: 0, borderRadius: '12px', flex: 1 }}
            />
            {withChat && (
              <iframe
                src={`https://www.twitch.tv/embed/${channel}/chat?parent=${parent}&darkpopout`}
                width="340"
                height="100%"
                frameBorder="0"
                loading="lazy"
                style={{ borderRadius: '12px' }}
              />
            )}
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--netrun-surface, #1a1a1a)' }} />
        )
      }
    </LazyEmbed>
  );
}

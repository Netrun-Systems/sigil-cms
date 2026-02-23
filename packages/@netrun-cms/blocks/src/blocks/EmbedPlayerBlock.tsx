import React from 'react';
import type { EmbedPlayerBlockContent, BlockSettings } from '@netrun-cms/core';
import { cn, getBlockSettingsClasses, type BlockMode } from '../utils';

export interface EmbedPlayerBlockProps {
  content: EmbedPlayerBlockContent;
  settings?: BlockSettings;
  mode?: BlockMode;
  className?: string;
  onContentChange?: (content: EmbedPlayerBlockContent) => void;
}

const platformEmbedMap: Record<string, (url: string, compact?: boolean) => string | null> = {
  spotify: (url) => {
    const match = url.match(/open\.spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
    if (!match) return null;
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
  },
  youtube: (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (!match) return null;
    return `https://www.youtube-nocookie.com/embed/${match[1]}`;
  },
  apple_music: (url) => url.replace('music.apple.com', 'embed.music.apple.com'),
  soundcloud: (url) =>
    `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%236C63FF&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`,
};

const platformHeights: Record<string, number> = {
  spotify: 352,
  youtube: 0, // Uses aspect ratio
  apple_music: 450,
  soundcloud: 300,
  bandcamp: 470,
  twitch: 0,
};

export const EmbedPlayerBlock: React.FC<EmbedPlayerBlockProps> = ({
  content,
  settings,
  mode = 'view',
  className,
}) => {
  const { platform, url, compact, title } = content;
  const settingsClasses = settings ? getBlockSettingsClasses(settings) : '';

  const embedUrlFn = platformEmbedMap[platform];
  const embedUrl = embedUrlFn ? embedUrlFn(url, compact) : url;

  if (!embedUrl) {
    return (
      <div className={cn(settingsClasses, className, 'text-center py-8 text-[var(--netrun-text-secondary)]')}>
        {mode === 'edit' ? `Configure ${platform} embed URL` : null}
      </div>
    );
  }

  const height = compact ? 152 : (platformHeights[platform] || 352);
  const useAspectRatio = platform === 'youtube' || platform === 'twitch';

  return (
    <div className={cn(settingsClasses, className)}>
      {title && (
        <h3 className="text-lg font-semibold mb-3 text-[var(--netrun-text)]">{title}</h3>
      )}
      <div style={useAspectRatio ? { aspectRatio: '16/9', position: 'relative' } : undefined}>
        <iframe
          src={embedUrl}
          width="100%"
          height={useAspectRatio ? '100%' : height}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
          style={{
            borderRadius: '12px',
            ...(useAspectRatio ? { position: 'absolute', inset: 0 } : {}),
          }}
        />
      </div>
    </div>
  );
};

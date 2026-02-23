import React from 'react';
import type { ReleaseListBlockContent, BlockSettings, Release } from '@netrun-cms/core';
import { cn, getBlockSettingsClasses, type BlockMode } from '../utils';

export interface ReleaseListBlockProps {
  content: ReleaseListBlockContent;
  settings?: BlockSettings;
  mode?: BlockMode;
  className?: string;
  /** Releases data injected by the page renderer */
  releases?: Release[];
  onContentChange?: (content: ReleaseListBlockContent) => void;
}

export const ReleaseListBlock: React.FC<ReleaseListBlockProps> = ({
  content,
  settings,
  mode = 'view',
  className,
  releases = [],
}) => {
  const { maxItems = 10, layout = 'list', showStreamLinks = true } = content;
  const settingsClasses = settings ? getBlockSettingsClasses(settings) : '';
  const displayed = releases.slice(0, maxItems);

  if (displayed.length === 0 && mode === 'view') {
    return null;
  }

  if (displayed.length === 0 && mode === 'edit') {
    return (
      <div className={cn(settingsClasses, className, 'py-8 text-center text-[var(--netrun-text-secondary)]')}>
        No releases yet. Add releases via the Releases tab.
      </div>
    );
  }

  return (
    <div className={cn(settingsClasses, className)}>
      <div className={cn(
        layout === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'flex flex-col gap-4'
      )}>
        {displayed.map((release) => (
          <div
            key={release.id}
            className="flex gap-4 p-4 rounded-lg bg-[var(--netrun-surface)] border border-[var(--netrun-surface)]"
          >
            {release.coverUrl && (
              <img
                src={release.coverUrl}
                alt={release.title}
                className="w-20 h-20 rounded object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[var(--netrun-text)] truncate">{release.title}</h3>
              <p className="text-sm text-[var(--netrun-text-secondary)] capitalize">
                {release.type} &middot; {new Date(release.releaseDate).getFullYear()}
              </p>
              {showStreamLinks && release.streamLinks && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {Object.entries(release.streamLinks).map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 rounded bg-[var(--netrun-primary)]/10 text-[var(--netrun-primary)] hover:bg-[var(--netrun-primary)]/20 capitalize"
                    >
                      {platform.replace('_', ' ')}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

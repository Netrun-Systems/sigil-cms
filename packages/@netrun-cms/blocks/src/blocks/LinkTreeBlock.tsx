import React from 'react';
import type { LinkTreeBlockContent, BlockSettings } from '@netrun-cms/core';
import { cn, getBlockSettingsClasses, type BlockMode } from '../utils';

export interface LinkTreeBlockProps {
  content: LinkTreeBlockContent;
  settings?: BlockSettings;
  mode?: BlockMode;
  className?: string;
  onContentChange?: (content: LinkTreeBlockContent) => void;
}

export const LinkTreeBlock: React.FC<LinkTreeBlockProps> = ({
  content,
  settings,
  mode = 'view',
  className,
}) => {
  const { links, showAvatar, avatarUrl, heading, subheading } = content;
  const settingsClasses = settings ? getBlockSettingsClasses(settings) : '';

  if (!links || links.length === 0) {
    if (mode === 'edit') {
      return (
        <div className={cn(settingsClasses, className, 'py-8 text-center text-[var(--netrun-text-secondary)]')}>
          Add links in block settings
        </div>
      );
    }
    return null;
  }

  return (
    <div className={cn(settingsClasses, className, 'flex flex-col items-center max-w-md mx-auto')}>
      {showAvatar && avatarUrl && (
        <img
          src={avatarUrl}
          alt={heading || ''}
          className="w-20 h-20 rounded-full object-cover mb-4 border-2 border-[var(--netrun-primary)]"
        />
      )}
      {heading && (
        <h2 className="text-xl font-bold text-[var(--netrun-text)] mb-1">{heading}</h2>
      )}
      {subheading && (
        <p className="text-sm text-[var(--netrun-text-secondary)] mb-6">{subheading}</p>
      )}
      <div className="w-full flex flex-col gap-3">
        {links.map((link, i) => (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'block w-full text-center py-3 px-6 rounded-lg font-medium transition-all',
              link.featured
                ? 'bg-[var(--netrun-primary)] text-white hover:opacity-90'
                : 'bg-[var(--netrun-surface)] text-[var(--netrun-text)] border border-[var(--netrun-surface)] hover:border-[var(--netrun-primary)]'
            )}
          >
            {link.title}
          </a>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import type { ArtistBioBlockContent, BlockSettings, ArtistProfile } from '@netrun-cms/core';
import { cn, getBlockSettingsClasses, type BlockMode } from '../utils';

export interface ArtistBioBlockProps {
  content: ArtistBioBlockContent;
  settings?: BlockSettings;
  mode?: BlockMode;
  className?: string;
  /** Artist profile data injected by the page renderer */
  artistProfile?: ArtistProfile;
  onContentChange?: (content: ArtistBioBlockContent) => void;
}

export const ArtistBioBlock: React.FC<ArtistBioBlockProps> = ({
  content,
  settings,
  mode = 'view',
  className,
  artistProfile,
}) => {
  const { showPhoto = true, showGenres = true, showSocialLinks = true, photoPosition = 'top' } = content;
  const settingsClasses = settings ? getBlockSettingsClasses(settings) : '';

  if (!artistProfile) {
    if (mode === 'edit') {
      return (
        <div className={cn(settingsClasses, className, 'py-8 text-center text-[var(--netrun-text-secondary)]')}>
          Set up the artist profile to display bio content
        </div>
      );
    }
    return null;
  }

  const isHorizontal = photoPosition === 'left' || photoPosition === 'right';

  return (
    <div className={cn(settingsClasses, className)}>
      <div className={cn(
        isHorizontal ? 'flex gap-8 items-start' : 'flex flex-col gap-6',
        photoPosition === 'right' && 'flex-row-reverse'
      )}>
        {showPhoto && artistProfile.photoUrl && (
          <img
            src={artistProfile.photoUrl}
            alt={artistProfile.artistName}
            className={cn(
              'rounded-lg object-cover',
              isHorizontal ? 'w-64 h-64 flex-shrink-0' : 'w-full max-h-96'
            )}
          />
        )}
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-[var(--netrun-text)] mb-4">
            {artistProfile.artistName}
          </h2>
          {showGenres && artistProfile.genres.length > 0 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {artistProfile.genres.map((genre, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded-full bg-[var(--netrun-primary)]/10 text-[var(--netrun-primary)]"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
          <div className="text-[var(--netrun-text-secondary)] leading-relaxed whitespace-pre-line">
            {artistProfile.bio}
          </div>
          {showSocialLinks && Object.keys(artistProfile.socialLinks).length > 0 && (
            <div className="flex gap-3 mt-6">
              {Object.entries(artistProfile.socialLinks).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--netrun-text-secondary)] hover:text-[var(--netrun-primary)] capitalize"
                >
                  {platform.replace('_', ' ')}
                </a>
              ))}
            </div>
          )}
          {artistProfile.bookingEmail && (
            <p className="mt-4 text-sm text-[var(--netrun-text-secondary)]">
              Booking: <a href={`mailto:${artistProfile.bookingEmail}`} className="text-[var(--netrun-primary)]">{artistProfile.bookingEmail}</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

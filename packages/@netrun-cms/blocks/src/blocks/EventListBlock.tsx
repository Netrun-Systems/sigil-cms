import React from 'react';
import type { EventListBlockContent, BlockSettings, ArtistEvent } from '@netrun-cms/core';
import { cn, getBlockSettingsClasses, type BlockMode } from '../utils';

export interface EventListBlockProps {
  content: EventListBlockContent;
  settings?: BlockSettings;
  mode?: BlockMode;
  className?: string;
  /** Events data injected by the page renderer */
  events?: ArtistEvent[];
  onContentChange?: (content: EventListBlockContent) => void;
}

function formatEventDate(dateStr: string): { month: string; day: string; full: string } {
  const d = new Date(dateStr);
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate().toString(),
    full: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
  };
}

export const EventListBlock: React.FC<EventListBlockProps> = ({
  content,
  settings,
  mode = 'view',
  className,
  events = [],
}) => {
  const { maxItems = 10, showPastEvents = false } = content;
  const settingsClasses = settings ? getBlockSettingsClasses(settings) : '';

  const now = new Date();
  const filtered = showPastEvents
    ? events
    : events.filter((e) => new Date(e.eventDate) >= now);
  const displayed = filtered.slice(0, maxItems);

  if (displayed.length === 0) {
    return (
      <div className={cn(settingsClasses, className, 'py-8 text-center text-[var(--netrun-text-secondary)]')}>
        {mode === 'edit'
          ? 'No events yet. Add events via the Events tab.'
          : 'No upcoming shows announced yet. Follow on social media for announcements.'}
      </div>
    );
  }

  return (
    <div className={cn(settingsClasses, className)}>
      <div className="flex flex-col gap-3">
        {displayed.map((event) => {
          const { month, day, full } = formatEventDate(event.eventDate);
          return (
            <div
              key={event.id}
              className="flex items-center gap-4 p-4 rounded-lg bg-[var(--netrun-surface)] border border-[var(--netrun-surface)]"
            >
              <div className="flex-shrink-0 w-14 text-center">
                <div className="text-xs font-bold text-[var(--netrun-primary)]">{month}</div>
                <div className="text-2xl font-bold text-[var(--netrun-text)]">{day}</div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[var(--netrun-text)] truncate">{event.title}</h3>
                <p className="text-sm text-[var(--netrun-text-secondary)]">
                  {event.venue} &middot; {event.city}
                </p>
                <p className="text-xs text-[var(--netrun-text-secondary)]">{full}</p>
              </div>
              {event.ticketUrl && (
                <a
                  href={event.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 px-4 py-2 rounded-lg bg-[var(--netrun-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Tickets
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

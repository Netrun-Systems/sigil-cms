/**
 * Music icons — instruments, audio controls, playback, recording
 */
import React from 'react';
import type { IconProps } from '../types';

const icon = (
  displayName: string,
  paths: string
): React.FC<IconProps> => {
  const Component: React.FC<IconProps> = ({
    size = 24,
    color = 'currentColor',
    strokeWidth = 2,
    className,
    onClick,
    ...rest
  }) =>
    React.createElement(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        className,
        onClick,
        'aria-hidden': true,
        ...rest,
      },
      React.createElement('g', {
        dangerouslySetInnerHTML: { __html: paths },
      })
    );
  Component.displayName = displayName;
  return Component;
};

export const Music = icon('Music', '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>');

export const Mic = icon('Mic', '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>');

export const Headphones = icon('Headphones', '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>');

export const Volume2 = icon('Volume2', '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>');

export const Radio = icon('Radio', '<circle cx="12" cy="12" r="2"/><path d="M4.93 19.07a10 10 0 0 1 0-14.14"/><path d="M7.76 16.24a6 6 0 0 1 0-8.49"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>');

export const Disc = icon('Disc', '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>');

export const Play = icon('Play', '<polygon points="5 3 19 12 5 21 5 3"/>');

export const Pause = icon('Pause', '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>');

export const SkipForward = icon('SkipForward', '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>');

export const SkipBack = icon('SkipBack', '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>');

export const Shuffle = icon('Shuffle', '<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>');

export const Speaker = icon('Speaker', '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><circle cx="12" cy="14" r="4"/><line x1="12" y1="6" x2="12.01" y2="6"/>');

export const Guitar = icon('Guitar', '<path d="m11.9 12.1 4.514-4.514"/><path d="M20.1 2.3a1 1 0 0 0-1.4 0l-1.6 1.6a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l1.6-1.6a1 1 0 0 0 0-1.4z"/><path d="m4.1 11.9-1.8 1.8a2.41 2.41 0 0 0 0 3.4l4.5 4.5a2.41 2.41 0 0 0 3.4 0l1.8-1.8a2.41 2.41 0 0 0 0-3.4l-4.5-4.5a2.41 2.41 0 0 0-3.4 0z"/><path d="m7.9 10.5 2 2"/><path d="m10.5 7.9 2 2"/>');

export const Piano = icon('Piano', '<path d="M18.5 8c-1.4 0-2.6-.8-3.2-2"/><path d="M21 3H3v18h18V3z"/><path d="M3 14h18"/><path d="M8 14v7"/><path d="M12 14v7"/><path d="M16 14v7"/>');

export const VolumeX = icon('VolumeX', '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>');

export const Waveform = icon('Waveform', '<path d="M2 12h3"/><path d="M19 12h3"/><path d="M8 12V7"/><path d="M12 12V4"/><path d="M16 12V9"/>');

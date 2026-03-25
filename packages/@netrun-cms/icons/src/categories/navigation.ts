/**
 * Navigation icons — arrows, chevrons, directional controls
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

export const ArrowUp = icon('ArrowUp', '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>');
export const ArrowDown = icon('ArrowDown', '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>');
export const ArrowLeft = icon('ArrowLeft', '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>');
export const ArrowRight = icon('ArrowRight', '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>');

export const ChevronUp = icon('ChevronUp', '<polyline points="18 15 12 9 6 15"/>');
export const ChevronDown = icon('ChevronDown', '<polyline points="6 9 12 15 18 9"/>');
export const ChevronLeft = icon('ChevronLeft', '<polyline points="15 18 9 12 15 6"/>');
export const ChevronRight = icon('ChevronRight', '<polyline points="9 18 15 12 9 6"/>');

export const ChevronsUp = icon('ChevronsUp', '<polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/>');
export const ChevronsDown = icon('ChevronsDown', '<polyline points="7 13 12 18 17 13"/><polyline points="7 6 12 11 17 6"/>');

export const CornerUpRight = icon('CornerUpRight', '<polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/>');
export const CornerDownLeft = icon('CornerDownLeft', '<polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>');

export const MoreHorizontal = icon('MoreHorizontal', '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>');
export const MoreVertical = icon('MoreVertical', '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>');

export const Undo = icon('Undo', '<polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>');
export const Redo = icon('Redo', '<polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/>');

export const Move = icon('Move', '<polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>');

export const Expand = icon('Expand', '<path d="M21 21l-6-6m6 6v-4.8m0 4.8h-4.8"/><path d="M3 16.2V21m0 0h4.8M3 21l6-6"/><path d="M21 7.8V3m0 0h-4.8M21 3l-6 6"/><path d="M3 7.8V3m0 0h4.8M3 3l6 6"/>');

export const Collapse = icon('Collapse', '<path d="M15 15l6 6m-6-6v4.8m0-4.8h4.8"/><path d="M9 19.8V15m0 0H4.2M9 15l-6 6"/><path d="M15 4.2V9m0 0h4.8M15 9l6-6"/><path d="M9 4.2V9m0 0H4.2M9 9L3 3"/>');

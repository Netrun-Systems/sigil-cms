import type { SVGProps } from 'react';

export type IconCategory =
  | 'general'
  | 'navigation'
  | 'content'
  | 'commerce'
  | 'social'
  | 'restaurant'
  | 'music'
  | 'business'
  | 'saas'
  | 'community'
  | 'publishing'
  | 'scheduling'
  | 'status';

export type IconVertical =
  | 'all'
  | 'restaurant'
  | 'music'
  | 'commerce'
  | 'saas'
  | 'publishing'
  | 'community'
  | 'scheduling'
  | 'business';

export interface IconProps extends SVGProps<SVGSVGElement> {
  /** Size in pixels (applied to both width and height). Default: 24 */
  size?: number | string;
  /** Stroke color. Default: 'currentColor' */
  color?: string;
  /** Stroke width. Default: 2 */
  strokeWidth?: number | string;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

export interface IconMeta {
  /** Unique icon identifier used with the Icon component name prop */
  name: string;
  /** Display label */
  label: string;
  /** Icon category */
  category: IconCategory;
  /** Search tags */
  tags: string[];
  /** Which site verticals use this icon */
  verticals: IconVertical[];
}

export interface IconPickerProps {
  /** Currently selected icon name */
  value?: string;
  /** Called when user selects an icon */
  onChange: (name: string) => void;
  /** Filter to specific verticals */
  vertical?: IconVertical;
  /** Placeholder text for search bar */
  placeholder?: string;
  /** Additional CSS classes for the trigger button */
  className?: string;
}

export type IconComponent = React.FC<IconProps>;

export type IconRegistry = Record<string, IconMeta>;

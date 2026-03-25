import React from 'react';
import type { IconProps } from './types';

// Lazy import map — populated at build time from the category barrel files
// Using a dynamic map so callers can use <Icon name="Home" /> without importing
// every icon eagerly.
import * as GeneralIcons from './categories/general';
import * as NavigationIcons from './categories/navigation';
import * as ContentIcons from './categories/content';
import * as CommerceIcons from './categories/commerce';
import * as SocialIcons from './categories/social';
import * as RestaurantIcons from './categories/restaurant';
import * as MusicIcons from './categories/music';
import * as BusinessIcons from './categories/business';
import * as SaasIcons from './categories/saas';
import * as CommunityIcons from './categories/community';
import * as PublishingIcons from './categories/publishing';
import * as SchedulingIcons from './categories/scheduling';
import * as StatusIcons from './categories/status';

const ALL_ICONS: Record<string, React.FC<IconProps>> = {
  ...GeneralIcons,
  ...NavigationIcons,
  ...ContentIcons,
  ...CommerceIcons,
  ...SocialIcons,
  ...RestaurantIcons,
  ...MusicIcons,
  ...BusinessIcons,
  ...SaasIcons,
  ...CommunityIcons,
  ...PublishingIcons,
  ...SchedulingIcons,
  ...StatusIcons,
};

export interface IconNameProps extends IconProps {
  /** The icon component name, e.g. "Home", "ShoppingCart" */
  name: string;
  /** Fallback rendered when the icon name is not found */
  fallback?: React.ReactNode;
}

/**
 * Generic Icon component — looks up any icon by name at runtime.
 *
 * For tree-shaking, prefer importing icon components directly:
 *   import { Home } from '@netrun-cms/icons/general';
 *
 * Use this component when the icon name is dynamic (e.g. stored in the CMS).
 */
export const Icon: React.FC<IconNameProps> = ({
  name,
  fallback = null,
  ...props
}) => {
  const Component = ALL_ICONS[name];
  if (!Component) {
    return <>{fallback}</>;
  }
  return <Component {...props} />;
};

Icon.displayName = 'Icon';

export { ALL_ICONS };
export default Icon;

/**
 * @netrun-cms/icons
 *
 * Comprehensive icon library for Sigil CMS.
 * 200+ SVG icons across 13 categories, all MIT-compatible.
 *
 * Usage:
 *   // Recommended: tree-shakeable direct imports
 *   import { Home, Settings } from '@netrun-cms/icons/general';
 *   import { ShoppingCart, CreditCard } from '@netrun-cms/icons/commerce';
 *
 *   // Dynamic lookup by name (e.g. from CMS data)
 *   import { Icon } from '@netrun-cms/icons';
 *   <Icon name="Home" size={20} />
 *
 *   // Admin icon picker
 *   import { IconPicker } from '@netrun-cms/icons';
 *   <IconPicker value={iconName} onChange={setIconName} />
 */

// ── Core components ──────────────────────────────────────────────────────────
export { Icon, ALL_ICONS } from './Icon';
export type { IconNameProps } from './Icon';
export { IconPicker } from './IconPicker';

// ── Types ────────────────────────────────────────────────────────────────────
export type {
  IconProps,
  IconMeta,
  IconPickerProps,
  IconComponent,
  IconRegistry,
  IconCategory,
  IconVertical,
} from './types';

// ── Registry + search utilities ──────────────────────────────────────────────
export {
  ICON_REGISTRY,
  getAllIcons,
  getIconsByCategory,
  getIconsByVertical,
  searchIcons,
  ICON_CATEGORIES,
  ICON_CATEGORY_LABELS,
} from './registry';

// ── Category re-exports (all icons available from root) ──────────────────────
export * from './categories/general';
export * from './categories/navigation';
export * from './categories/content';
export * from './categories/commerce';
export * from './categories/social';
export * from './categories/restaurant';
export * from './categories/music';
export * from './categories/business';
export * from './categories/saas';
export * from './categories/community';
export * from './categories/publishing';
export * from './categories/scheduling';
export * from './categories/status';

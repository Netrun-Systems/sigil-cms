/**
 * Block defaults for theme layout personalities
 *
 * Each layout personality defines default block settings that change
 * how blocks are laid out when a theme is applied. This separates
 * layout concerns from color/typography, so theme switching can
 * change the spatial feel of a page, not just colors.
 *
 * @module @netrun-cms/theme
 */

export interface ThemeBlockDefaults {
  [blockType: string]: {
    width?: 'full' | 'container' | 'narrow';
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    background?: 'transparent' | 'primary' | 'secondary' | 'surface' | 'gradient';
    animation?: 'none' | 'fade' | 'slide' | 'scale';
    colSpan?: number;
  };
}

/**
 * Base — balanced, container-width, medium padding
 */
const baseDefaults: ThemeBlockDefaults = {
  hero: { width: 'full', padding: 'lg', background: 'gradient', colSpan: 12 },
  text: { width: 'container', padding: 'md', colSpan: 12 },
  image: { width: 'container', padding: 'md', colSpan: 12 },
  gallery: { width: 'container', padding: 'lg', colSpan: 12 },
  video: { width: 'container', padding: 'md', colSpan: 12 },
  cta: { width: 'full', padding: 'lg', background: 'primary', colSpan: 12 },
  feature_grid: { width: 'container', padding: 'lg', colSpan: 12 },
  pricing_table: { width: 'container', padding: 'lg', colSpan: 12 },
  testimonial: { width: 'container', padding: 'lg', background: 'surface', colSpan: 12 },
  faq: { width: 'container', padding: 'lg', colSpan: 12 },
  contact_form: { width: 'narrow', padding: 'xl', colSpan: 8 },
  stats_bar: { width: 'full', padding: 'md', background: 'surface', colSpan: 12 },
  timeline: { width: 'container', padding: 'lg', colSpan: 12 },
  newsletter: { width: 'narrow', padding: 'xl', colSpan: 6 },
};

/**
 * Warm — generous spacing, breathing room, contained
 */
const warmDefaults: ThemeBlockDefaults = {
  hero: { width: 'container', padding: 'xl', background: 'transparent', animation: 'fade', colSpan: 12 },
  text: { width: 'narrow', padding: 'lg', colSpan: 10 },
  image: { width: 'container', padding: 'lg', colSpan: 12 },
  gallery: { width: 'container', padding: 'xl', colSpan: 12 },
  video: { width: 'container', padding: 'lg', colSpan: 10 },
  cta: { width: 'container', padding: 'xl', background: 'surface', animation: 'fade', colSpan: 12 },
  feature_grid: { width: 'container', padding: 'xl', colSpan: 12 },
  pricing_table: { width: 'container', padding: 'xl', colSpan: 12 },
  testimonial: { width: 'narrow', padding: 'xl', background: 'transparent', animation: 'fade', colSpan: 10 },
  faq: { width: 'container', padding: 'xl', colSpan: 10 },
  contact_form: { width: 'narrow', padding: 'xl', colSpan: 6 },
  stats_bar: { width: 'container', padding: 'lg', background: 'transparent', colSpan: 12 },
  timeline: { width: 'narrow', padding: 'xl', colSpan: 10 },
  newsletter: { width: 'narrow', padding: 'xl', animation: 'fade', colSpan: 6 },
};

/**
 * Cool — tight, full-bleed, minimal padding, efficient
 */
const coolDefaults: ThemeBlockDefaults = {
  hero: { width: 'full', padding: 'md', background: 'gradient', colSpan: 12 },
  text: { width: 'container', padding: 'sm', colSpan: 12 },
  image: { width: 'full', padding: 'none', colSpan: 12 },
  gallery: { width: 'full', padding: 'sm', colSpan: 12 },
  video: { width: 'full', padding: 'none', colSpan: 12 },
  cta: { width: 'full', padding: 'md', background: 'primary', colSpan: 12 },
  feature_grid: { width: 'full', padding: 'md', colSpan: 12 },
  pricing_table: { width: 'container', padding: 'md', colSpan: 12 },
  testimonial: { width: 'container', padding: 'md', background: 'surface', colSpan: 12 },
  faq: { width: 'container', padding: 'md', colSpan: 12 },
  contact_form: { width: 'container', padding: 'md', colSpan: 8 },
  stats_bar: { width: 'full', padding: 'sm', background: 'primary', colSpan: 12 },
  timeline: { width: 'container', padding: 'md', colSpan: 12 },
  newsletter: { width: 'container', padding: 'md', colSpan: 8 },
};

/**
 * Bold — dramatic, full-bleed, high-impact, animations
 */
const boldDefaults: ThemeBlockDefaults = {
  hero: { width: 'full', padding: 'none', background: 'gradient', animation: 'scale', colSpan: 12 },
  text: { width: 'container', padding: 'lg', colSpan: 12 },
  image: { width: 'full', padding: 'none', animation: 'slide', colSpan: 12 },
  gallery: { width: 'full', padding: 'md', animation: 'fade', colSpan: 12 },
  video: { width: 'full', padding: 'none', colSpan: 12 },
  cta: { width: 'full', padding: 'xl', background: 'primary', animation: 'slide', colSpan: 12 },
  feature_grid: { width: 'full', padding: 'xl', animation: 'fade', colSpan: 12 },
  pricing_table: { width: 'container', padding: 'xl', animation: 'slide', colSpan: 12 },
  testimonial: { width: 'full', padding: 'xl', background: 'gradient', animation: 'fade', colSpan: 12 },
  faq: { width: 'container', padding: 'xl', colSpan: 12 },
  contact_form: { width: 'container', padding: 'xl', animation: 'slide', colSpan: 8 },
  stats_bar: { width: 'full', padding: 'lg', background: 'gradient', animation: 'scale', colSpan: 12 },
  timeline: { width: 'container', padding: 'xl', animation: 'slide', colSpan: 12 },
  newsletter: { width: 'container', padding: 'xl', animation: 'fade', colSpan: 8 },
};

/**
 * Soft — cozy, narrow, lots of whitespace, gentle animations
 */
const softDefaults: ThemeBlockDefaults = {
  hero: { width: 'container', padding: '2xl', background: 'transparent', animation: 'fade', colSpan: 10 },
  text: { width: 'narrow', padding: 'xl', colSpan: 8 },
  image: { width: 'container', padding: 'xl', animation: 'fade', colSpan: 10 },
  gallery: { width: 'container', padding: 'xl', animation: 'fade', colSpan: 12 },
  video: { width: 'container', padding: 'xl', colSpan: 10 },
  cta: { width: 'container', padding: '2xl', background: 'surface', animation: 'fade', colSpan: 10 },
  feature_grid: { width: 'container', padding: '2xl', colSpan: 12 },
  pricing_table: { width: 'narrow', padding: '2xl', colSpan: 10 },
  testimonial: { width: 'narrow', padding: '2xl', background: 'transparent', animation: 'fade', colSpan: 8 },
  faq: { width: 'narrow', padding: 'xl', colSpan: 8 },
  contact_form: { width: 'narrow', padding: '2xl', animation: 'fade', colSpan: 6 },
  stats_bar: { width: 'container', padding: 'xl', background: 'transparent', colSpan: 12 },
  timeline: { width: 'narrow', padding: '2xl', animation: 'fade', colSpan: 8 },
  newsletter: { width: 'narrow', padding: '2xl', animation: 'fade', colSpan: 6 },
};

/**
 * Mono — editorial, tight grid, no animations, stark
 */
const monoDefaults: ThemeBlockDefaults = {
  hero: { width: 'container', padding: 'lg', background: 'transparent', colSpan: 12 },
  text: { width: 'container', padding: 'md', colSpan: 12 },
  image: { width: 'container', padding: 'sm', colSpan: 12 },
  gallery: { width: 'container', padding: 'md', colSpan: 12 },
  video: { width: 'container', padding: 'md', colSpan: 12 },
  cta: { width: 'container', padding: 'lg', background: 'surface', colSpan: 12 },
  feature_grid: { width: 'container', padding: 'lg', colSpan: 12 },
  pricing_table: { width: 'container', padding: 'lg', colSpan: 12 },
  testimonial: { width: 'container', padding: 'lg', background: 'surface', colSpan: 12 },
  faq: { width: 'container', padding: 'md', colSpan: 12 },
  contact_form: { width: 'container', padding: 'lg', colSpan: 8 },
  stats_bar: { width: 'container', padding: 'md', background: 'surface', colSpan: 12 },
  timeline: { width: 'container', padding: 'lg', colSpan: 12 },
  newsletter: { width: 'container', padding: 'lg', colSpan: 8 },
};

/**
 * Layout personality registry
 */
const layoutPersonalities: Record<string, ThemeBlockDefaults> = {
  base: baseDefaults,
  warm: warmDefaults,
  cool: coolDefaults,
  bold: boldDefaults,
  soft: softDefaults,
  mono: monoDefaults,
};

/**
 * Get block defaults for a given variant suffix.
 *
 * For base presets (no suffix), pass 'base'.
 * For variants like 'netrun-dark-warm', pass 'warm'.
 *
 * @param variantSuffix - One of: 'base', 'warm', 'cool', 'bold', 'soft', 'mono'
 * @returns The matching ThemeBlockDefaults, falling back to baseDefaults
 */
export function getBlockDefaults(variantSuffix: string): ThemeBlockDefaults {
  return layoutPersonalities[variantSuffix] || baseDefaults;
}

export { baseDefaults, warmDefaults, coolDefaults, boldDefaults, softDefaults, monoDefaults };

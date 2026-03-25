/**
 * @netrun-cms/theme - Theme system for NetrunCMS
 *
 * Features:
 * - Dark/light mode with system preference support
 * - Per-site theme customization
 * - Multiple theme presets (Netrun, KOG, Intirkon, Minimal)
 * - CSS variable injection
 * - Token-based theming
 */

// Core theme context and provider
export {
  ThemeProvider,
  useTheme,
  ThemeContext,
  type ThemeContextValue,
  type ThemeProviderProps,
  type ThemeMode,
  type SiteTheme,
} from './ThemeContext';

// Theme presets
export {
  themePresets,
  getPresetById,
  getDefaultPreset,
  netrunDarkPreset,
  kogPreset,
  intirkonPreset,
  minimalPreset,
  type ThemePreset,
  type ThemeBlockDefaults,
} from './presets';

// Block defaults
export { getBlockDefaults } from './block-defaults';

// Re-export core theme types and utilities
export {
  type ThemeTokens,
  type ColorTokens,
  type TypographyTokens,
  type SpacingTokens,
  type EffectTokens,
  defaultDarkThemeTokens,
  defaultLightThemeTokens,
  tokensToCssVariables,
} from '@netrun-cms/core';

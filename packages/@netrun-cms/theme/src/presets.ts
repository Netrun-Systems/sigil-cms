/**
 * Theme presets for NetrunCMS
 *
 * These presets provide ready-to-use theme configurations based on
 * the Netrun design system. Each preset includes both dark and light
 * mode tokens.
 */

import type { ThemeTokens } from '@netrun-cms/core';
import { defaultDarkThemeTokens, defaultLightThemeTokens } from '@netrun-cms/core';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  darkTokens: ThemeTokens;
  lightTokens: ThemeTokens;
}

/**
 * Netrun Dark - The default Netrun Systems theme
 * Primary: #90b9ab (Sage Green)
 * Background: Deep black (#0A0A0A)
 */
export const netrunDarkPreset: ThemePreset = {
  id: 'netrun-dark',
  name: 'Netrun Dark',
  description: 'The default Netrun Systems dark theme with sage green accents',
  darkTokens: defaultDarkThemeTokens,
  lightTokens: defaultLightThemeTokens,
};

/**
 * KOG Theme - Optimized for CRM interfaces
 * Primary: #8AB89B (KOG Gear Green)
 * Slightly different green tone from the main Netrun theme
 */
export const kogPreset: ThemePreset = {
  id: 'kog',
  name: 'KOG',
  description: 'Knowledge Organization & Growth CRM theme',
  darkTokens: {
    colors: {
      primary: '#8AB89B',
      primaryDark: '#6E9A7E',
      primaryLight: '#A5CCB3',
      secondary: '#0A0A0A',
      background: '#0A0A0A',
      backgroundSecondary: '#141414',
      surface: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#B0B0B0',
      success: '#6DD49F',
      warning: '#FFB86C',
      error: '#FF6B6B',
      info: '#64B5F6',
    },
    typography: {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontFamilyHeading: 'Inter, -apple-system, sans-serif',
      fontSizeBase: '1rem',
      fontSizeLg: '1.125rem',
      fontSizeSm: '0.875rem',
      lineHeightBase: 1.5,
      fontWeightNormal: 400,
      fontWeightBold: 600,
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
    },
    effects: {
      borderRadius: '0.5rem',
      borderRadiusLg: '0.75rem',
      shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
      shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
      glassBlur: '12px',
      glassBg: 'rgba(30, 30, 30, 0.95)',
    },
  },
  lightTokens: {
    colors: {
      primary: '#8AB89B',
      primaryDark: '#6E9A7E',
      primaryLight: '#A5CCB3',
      secondary: '#000000',
      background: '#F5F5F5',
      backgroundSecondary: '#FFFFFF',
      surface: '#FFFFFF',
      text: '#0A0A0A',
      textSecondary: '#666666',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      info: '#2196F3',
    },
    typography: {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontFamilyHeading: 'Inter, -apple-system, sans-serif',
      fontSizeBase: '1rem',
      fontSizeLg: '1.125rem',
      fontSizeSm: '0.875rem',
      lineHeightBase: 1.5,
      fontWeightNormal: 400,
      fontWeightBold: 600,
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
    },
    effects: {
      borderRadius: '0.5rem',
      borderRadiusLg: '0.75rem',
      shadowSm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      shadowMd: '0 4px 6px rgba(0, 0, 0, 0.1)',
      shadowLg: '0 10px 15px rgba(0, 0, 0, 0.15)',
      glassBlur: '12px',
      glassBg: 'rgba(255, 255, 255, 0.8)',
    },
  },
};

/**
 * Intirkon Theme - For data visualization and BI interfaces
 * Primary: #A8CFBD (Mint/Teal)
 * Optimized for dashboard and analytics displays
 */
export const intirkonPreset: ThemePreset = {
  id: 'intirkon',
  name: 'Intirkon',
  description: 'Multi-tenant BI platform theme optimized for data visualization',
  darkTokens: {
    colors: {
      primary: '#A8CFBD',
      primaryDark: '#8AB9A5',
      primaryLight: '#C4E0D2',
      secondary: '#1E3A5F',
      background: '#0D1117',
      backgroundSecondary: '#161B22',
      surface: '#21262D',
      text: '#F0F6FC',
      textSecondary: '#8B949E',
      success: '#3FB950',
      warning: '#D29922',
      error: '#F85149',
      info: '#58A6FF',
    },
    typography: {
      fontFamily: "'Futura Medium', 'Futura', system-ui, sans-serif",
      fontFamilyHeading: "'Futura Bold', 'Futura', system-ui, sans-serif",
      fontSizeBase: '0.9375rem',
      fontSizeLg: '1.0625rem',
      fontSizeSm: '0.8125rem',
      lineHeightBase: 1.4,
      fontWeightNormal: 500,
      fontWeightBold: 700,
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
    },
    effects: {
      borderRadius: '6px',
      borderRadiusLg: '10px',
      shadowSm: '0 1px 3px rgba(0, 0, 0, 0.12)',
      shadowMd: '0 4px 6px rgba(0, 0, 0, 0.15)',
      shadowLg: '0 10px 20px rgba(0, 0, 0, 0.2)',
      glassBlur: '16px',
      glassBg: 'rgba(22, 27, 34, 0.9)',
    },
  },
  lightTokens: {
    colors: {
      primary: '#2DA77A',
      primaryDark: '#238B65',
      primaryLight: '#5CC99B',
      secondary: '#1E3A5F',
      background: '#F6F8FA',
      backgroundSecondary: '#FFFFFF',
      surface: '#FFFFFF',
      text: '#24292F',
      textSecondary: '#57606A',
      success: '#2DA44E',
      warning: '#BF8700',
      error: '#CF222E',
      info: '#0969DA',
    },
    typography: {
      fontFamily: "'Futura Medium', 'Futura', system-ui, sans-serif",
      fontFamilyHeading: "'Futura Bold', 'Futura', system-ui, sans-serif",
      fontSizeBase: '0.9375rem',
      fontSizeLg: '1.0625rem',
      fontSizeSm: '0.8125rem',
      lineHeightBase: 1.4,
      fontWeightNormal: 500,
      fontWeightBold: 700,
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
    },
    effects: {
      borderRadius: '6px',
      borderRadiusLg: '10px',
      shadowSm: '0 1px 0 rgba(27, 31, 35, 0.04)',
      shadowMd: '0 3px 6px rgba(140, 149, 159, 0.15)',
      shadowLg: '0 8px 24px rgba(140, 149, 159, 0.2)',
      glassBlur: '16px',
      glassBg: 'rgba(255, 255, 255, 0.85)',
    },
  },
};

/**
 * Minimal Theme - Clean, content-focused design
 * For blogs, documentation, and content-heavy sites
 */
export const minimalPreset: ThemePreset = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Clean, content-focused design for blogs and documentation',
  darkTokens: {
    colors: {
      primary: '#3B82F6',
      primaryDark: '#2563EB',
      primaryLight: '#60A5FA',
      secondary: '#6B7280',
      background: '#111827',
      backgroundSecondary: '#1F2937',
      surface: '#374151',
      text: '#F9FAFB',
      textSecondary: '#D1D5DB',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontFamilyHeading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSizeBase: '1rem',
      fontSizeLg: '1.125rem',
      fontSizeSm: '0.875rem',
      lineHeightBase: 1.75,
      fontWeightNormal: 400,
      fontWeightBold: 600,
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '4rem',
    },
    effects: {
      borderRadius: '4px',
      borderRadiusLg: '8px',
      shadowSm: '0 1px 2px rgba(0, 0, 0, 0.1)',
      shadowMd: '0 4px 6px rgba(0, 0, 0, 0.1)',
      shadowLg: '0 10px 15px rgba(0, 0, 0, 0.1)',
      glassBlur: '8px',
      glassBg: 'rgba(31, 41, 55, 0.8)',
    },
  },
  lightTokens: {
    colors: {
      primary: '#2563EB',
      primaryDark: '#1D4ED8',
      primaryLight: '#3B82F6',
      secondary: '#6B7280',
      background: '#FFFFFF',
      backgroundSecondary: '#F9FAFB',
      surface: '#FFFFFF',
      text: '#111827',
      textSecondary: '#6B7280',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      info: '#2563EB',
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontFamilyHeading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSizeBase: '1rem',
      fontSizeLg: '1.125rem',
      fontSizeSm: '0.875rem',
      lineHeightBase: 1.75,
      fontWeightNormal: 400,
      fontWeightBold: 600,
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '4rem',
    },
    effects: {
      borderRadius: '4px',
      borderRadiusLg: '8px',
      shadowSm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      shadowMd: '0 4px 6px rgba(0, 0, 0, 0.07)',
      shadowLg: '0 10px 15px rgba(0, 0, 0, 0.1)',
      glassBlur: '8px',
      glassBg: 'rgba(255, 255, 255, 0.9)',
    },
  },
};

/**
 * All available theme presets
 */
export const themePresets: ThemePreset[] = [
  netrunDarkPreset,
  kogPreset,
  intirkonPreset,
  minimalPreset,
];

/**
 * Get a theme preset by ID
 */
export function getPresetById(id: string): ThemePreset | undefined {
  return themePresets.find(preset => preset.id === id);
}

/**
 * Get the default theme preset
 */
export function getDefaultPreset(): ThemePreset {
  return netrunDarkPreset;
}

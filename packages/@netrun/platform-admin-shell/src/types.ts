/**
 * Types for the platform admin shell.
 *
 * These mirror the manifest structure served by the platform-runtime
 * plugin registry at GET /api/v1/plugins/manifest.
 */

import type { ComponentType, ReactNode } from 'react';

// ── Plugin Manifest (fetched from server) ────────────────────────────

export interface PluginManifestNavItem {
  label: string;
  icon: string;
  path: string;
  order: number;
  category?: string;
}

export interface PluginManifestEntry {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  nav: PluginManifestNavItem[];
  routes: { path: string; component: string }[];
}

export interface PluginManifest {
  plugins: PluginManifestEntry[];
}

// ── Theme ────────────────────────────────────────────────────────────

export interface ThemeConfig {
  /** Primary accent color (CSS variable value, e.g. '#90b9ab') */
  accentColor?: string;
  /** Background color for panels */
  panelBg?: string;
  /** Base background color */
  baseBg?: string;
  /** Custom CSS variables to inject */
  cssVars?: Record<string, string>;
}

// ── App Configuration ────────────────────────────────────────────────

export interface PlatformAppConfig {
  /** Display name shown in the header */
  productName: string;
  /** Unique product identifier */
  productId: string;
  /** Map of route paths to React page components */
  pageRegistry: Record<string, ComponentType>;
  /** Optional theme overrides */
  theme?: ThemeConfig;
  /** Optional custom logo element */
  logo?: ReactNode;
  /** Base URL for API calls (defaults to '' i.e. same origin) */
  apiBaseUrl?: string;
  /** Route to redirect to after login (defaults to '/') */
  defaultRoute?: string;
}

// ── Auth ─────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenant_id?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * @netrun/platform-admin-shell
 *
 * Reusable admin UI framework with plugin-driven sidebar, routing, and auth.
 * Products call createPlatformApp() to bootstrap their admin SPA.
 */

// Factory
export { createPlatformApp } from './createApp.js';

// Components — for advanced use cases (custom layouts)
export { AdminLayout } from './components/AdminLayout.js';
export { AdminHeader } from './components/AdminHeader.js';
export { DynamicSidebar } from './components/DynamicSidebar.js';
export { PluginRoutes } from './components/PluginRoutes.js';
export { RequireAuth } from './components/RequireAuth.js';
export { LoginPage } from './components/LoginPage.js';

// Hooks
export { useAuth } from './hooks/useAuth.js';
export { usePluginManifest } from './hooks/usePluginManifest.js';

// Types
export type {
  PlatformAppConfig,
  ThemeConfig,
  AuthUser,
  AuthState,
  PluginManifest,
  PluginManifestEntry,
  PluginManifestNavItem,
} from './types.js';
export type { UseAuthReturn, UseAuthOptions } from './hooks/useAuth.js';
export type { UsePluginManifestReturn, UsePluginManifestOptions } from './hooks/usePluginManifest.js';
export type { AdminLayoutProps } from './components/AdminLayout.js';
export type { AdminHeaderProps } from './components/AdminHeader.js';
export type { DynamicSidebarProps } from './components/DynamicSidebar.js';
export type { PluginRoutesProps } from './components/PluginRoutes.js';
export type { RequireAuthProps } from './components/RequireAuth.js';
export type { LoginPageProps } from './components/LoginPage.js';

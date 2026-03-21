/**
 * Plugin contract interfaces for NetrunCMS
 *
 * Defines the API surface that plugins use to register routes,
 * block types, admin navigation, and migrations.
 */

import type { Router } from 'express';

/** Logger interface — subset of pino */
export interface PluginLogger {
  info(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
}

/** Drizzle client — kept generic to avoid hard coupling */
export type DrizzleClient = {
  execute: (query: unknown) => Promise<unknown>;
  select: (...args: unknown[]) => unknown;
  insert: (table: unknown) => unknown;
  update: (table: unknown) => unknown;
  delete: (table: unknown) => unknown;
};

/**
 * Context object passed to each plugin's register() function.
 * Provides access to the Express app, database, and registration helpers.
 */
export interface PluginContext {
  /** Express application instance */
  app: { use: (...args: unknown[]) => void };
  /** Drizzle database client */
  db: DrizzleClient;
  /** Structured logger */
  logger: PluginLogger;
  /** Mount authenticated routes under /api/v1/sites/:siteId/<path> */
  addRoutes(path: string, router: Router): void;
  /** Mount public routes (no auth) under /api/v1/public/<path> */
  addPublicRoutes(path: string, router: Router): void;
  /** Mount global routes (not site-scoped) under /api/v1/<path> */
  addGlobalRoutes(path: string, router: Router): void;
  /** Register block types that this plugin provides */
  addBlockTypes(types: BlockTypeRegistration[]): void;
  /** Register an admin navigation section */
  addAdminNav(section: AdminNavSection): void;
  /** Register admin routes for React lazy loading */
  addAdminRoutes(routes: AdminRoute[]): void;
  /** Run raw SQL migration (CREATE TABLE IF NOT EXISTS, etc.) */
  runMigration(sql: string): Promise<void>;
  /** Read an environment variable */
  getConfig(key: string): string | undefined;
}

/**
 * The main plugin interface. Each plugin exports a default CmsPlugin object.
 */
export interface CmsPlugin {
  /** Unique plugin identifier (e.g., 'artist', 'mailing-list') */
  id: string;
  /** Human-readable name */
  name: string;
  /** Semver version */
  version: string;
  /** Environment variables required for this plugin to function.
   *  If any are missing, the plugin is skipped with a warning. */
  requiredEnv?: string[];
  /** Called at startup to register routes, blocks, nav, etc. */
  register(ctx: PluginContext): void | Promise<void>;
}

/**
 * Registration data for a content block type.
 */
export interface BlockTypeRegistration {
  /** Block type key (e.g., 'embed_player') */
  type: string;
  /** Human-readable label (e.g., 'Embed Player') */
  label: string;
  /** Optional category for grouping in the block picker */
  category?: string;
}

/**
 * A navigation section added to the admin sidebar.
 */
export interface AdminNavSection {
  /** Section heading */
  title: string;
  /** Whether items are scoped to /sites/:siteId */
  siteScoped: boolean;
  /** Navigation items within this section */
  items: AdminNavItem[];
}

export interface AdminNavItem {
  /** Display label */
  label: string;
  /** lucide-react icon name (e.g., 'Disc3') */
  icon: string;
  /** Route path (relative, e.g., 'releases' or '/advisor') */
  href: string;
}

/**
 * An admin route registered by a plugin for React lazy loading.
 */
export interface AdminRoute {
  /** Route path (e.g., 'sites/:siteId/releases') */
  path: string;
  /** Module path for dynamic import (e.g., '@netrun-cms/plugin-artist/admin/ReleasesList') */
  component: string;
}

/**
 * The manifest returned to the admin SPA describing all loaded plugins.
 */
export interface PluginManifest {
  plugins: PluginManifestEntry[];
}

export interface PluginManifestEntry {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  nav: AdminNavSection[];
  routes: AdminRoute[];
  blockTypes: BlockTypeRegistration[];
}

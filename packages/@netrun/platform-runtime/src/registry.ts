/**
 * Plugin Registry
 *
 * In-memory registry populated during startup by the plugin loader.
 * Tracks registered block types, admin nav sections, admin routes,
 * and provides the manifest endpoint data.
 */

import type {
  BlockTypeRegistration,
  AdminNavSection,
  AdminRoute,
  PluginManifest,
  PluginManifestEntry,
} from './types.js';

interface PluginRegistration {
  id: string;
  name: string;
  version: string;
  blockTypes: BlockTypeRegistration[];
  nav: AdminNavSection[];
  routes: AdminRoute[];
}

/** All registered plugins */
const plugins: PluginRegistration[] = [];

/** All registered block types (aggregated across plugins) */
const blockTypes = new Map<string, BlockTypeRegistration>();

/**
 * Start tracking a new plugin registration.
 * Called by the loader before invoking plugin.register().
 */
export function beginPlugin(id: string, name: string, version: string): PluginRegistration {
  const reg: PluginRegistration = {
    id,
    name,
    version,
    blockTypes: [],
    nav: [],
    routes: [],
  };
  plugins.push(reg);
  return reg;
}

/**
 * Register block types for the current plugin.
 */
export function addBlockTypes(reg: PluginRegistration, types: BlockTypeRegistration[]): void {
  for (const t of types) {
    reg.blockTypes.push(t);
    blockTypes.set(t.type, t);
  }
}

/**
 * Register admin nav sections for the current plugin.
 */
export function addAdminNav(reg: PluginRegistration, section: AdminNavSection): void {
  reg.nav.push(section);
}

/**
 * Register admin routes for the current plugin.
 */
export function addAdminRoutes(reg: PluginRegistration, routes: AdminRoute[]): void {
  reg.routes.push(...routes);
}

/**
 * Get the full manifest for the admin SPA.
 */
export function getManifest(): PluginManifest {
  const entries: PluginManifestEntry[] = plugins.map((p) => ({
    id: p.id,
    name: p.name,
    version: p.version,
    enabled: true,
    nav: p.nav,
    routes: p.routes,
    blockTypes: p.blockTypes,
  }));
  return { plugins: entries };
}

/**
 * Get all registered block type keys (across all plugins).
 */
export function getRegisteredBlockTypes(): string[] {
  return Array.from(blockTypes.keys());
}

/**
 * Check if a block type is registered by any plugin.
 */
export function isBlockTypeRegistered(type: string): boolean {
  return blockTypes.has(type);
}

/**
 * Reset the registry (for testing).
 */
export function resetRegistry(): void {
  plugins.length = 0;
  blockTypes.clear();
}

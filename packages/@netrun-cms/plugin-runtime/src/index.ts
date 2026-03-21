/**
 * @netrun-cms/plugin-runtime
 *
 * Plugin infrastructure for NetrunCMS.
 * Provides the loader, registry, and type contracts for plugins.
 */

export { loadPlugins } from './loader.js';

export {
  getManifest,
  getRegisteredBlockTypes,
  isBlockTypeRegistered,
  resetRegistry,
} from './registry.js';

export type {
  CmsPlugin,
  PluginContext,
  BlockTypeRegistration,
  AdminNavSection,
  AdminNavItem,
  AdminRoute,
  PluginManifest,
  PluginManifestEntry,
  PluginLogger,
  DrizzleClient,
} from './types.js';

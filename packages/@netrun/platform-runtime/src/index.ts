/**
 * @netrun/platform-runtime
 *
 * Platform plugin infrastructure for Netrun Systems.
 * Provides the loader, registry, and type contracts for plugins.
 *
 * This is the canonical source package. @netrun-cms/plugin-runtime
 * re-exports everything from here for backward compatibility.
 */

export { loadPlugins, setEmitEvent } from './loader.js';

export {
  beginPlugin,
  addBlockTypes,
  addAdminNav,
  addAdminRoutes,
  getManifest,
  getRegisteredBlockTypes,
  isBlockTypeRegistered,
  resetRegistry,
} from './registry.js';

export {
  getStorageProvider,
  resetStorageProvider,
  uploadFile,
  deleteFile,
  downloadFile,
  ensureStorage,
} from './storage.js';

export type {
  StorageProvider,
  StorageConfig,
  UploadResult,
} from './storage.js';

export type {
  PlatformPlugin,
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

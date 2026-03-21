/**
 * @netrun-cms/plugin-runtime
 *
 * Backward-compatibility wrapper.
 * All implementation has moved to @netrun/platform-runtime.
 * This package re-exports everything so existing Sigil plugins
 * continue to work without changes.
 */
export {
  loadPlugins,
  setEmitEvent,
  getManifest,
  getRegisteredBlockTypes,
  isBlockTypeRegistered,
  resetRegistry,
  getStorageProvider,
  resetStorageProvider,
  uploadFile,
  deleteFile,
  downloadFile,
  ensureStorage,
} from '@netrun/platform-runtime';

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
  StorageProvider,
  StorageConfig,
  UploadResult,
} from '@netrun/platform-runtime';

/**
 * Backward-compatibility re-export.
 * All types are now defined in @netrun/platform-runtime.
 * Existing Sigil plugins importing from @netrun-cms/plugin-runtime
 * continue to work without any changes.
 */
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
} from '@netrun/platform-runtime';

/**
 * Backward-compatibility re-export.
 * Registry implementation is now in @netrun/platform-runtime.
 */
export {
  beginPlugin,
  addBlockTypes,
  addAdminNav,
  addAdminRoutes,
  getManifest,
  getRegisteredBlockTypes,
  isBlockTypeRegistered,
  resetRegistry,
} from '@netrun/platform-runtime';

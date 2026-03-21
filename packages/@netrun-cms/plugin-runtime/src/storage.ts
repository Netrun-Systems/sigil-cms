/**
 * Backward-compatibility re-export.
 * Storage implementation is now in @netrun/platform-runtime.
 */
export {
  getStorageProvider,
  resetStorageProvider,
  uploadFile,
  deleteFile,
  downloadFile,
  ensureStorage,
} from '@netrun/platform-runtime';

export type {
  StorageProvider,
  StorageConfig,
  UploadResult,
} from '@netrun/platform-runtime';

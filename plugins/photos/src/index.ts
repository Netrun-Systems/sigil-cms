/**
 * Photos Plugin — Multi-provider object storage + AI-powered curation.
 *
 * Supports Google Cloud Storage (default), Azure Blob Storage, and AWS S3.
 * Provider auto-detected from env vars:
 *   - GCS: GCS_BUCKET or GOOGLE_APPLICATION_CREDENTIALS
 *   - Azure: AZURE_STORAGE_CONNECTION_STRING
 *   - S3: AWS_ACCESS_KEY_ID or S3_ENDPOINT
 *
 * Optionally uses GEMINI_API_KEY for AI photo curation.
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { getStorageProvider } from '@netrun-cms/plugin-runtime';
import { createRoutes } from './routes.js';
import { ensurePhotosTable, ensureBlobContainer, getStorageProviderName } from './lib/photos.js';

function hasStorageCredentials(): boolean {
  return !!(
    process.env.GCS_BUCKET ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GCS_PROJECT_ID ||
    process.env.AZURE_STORAGE_CONNECTION_STRING ||
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.S3_ENDPOINT ||
    process.env.STORAGE_PROVIDER
  );
}

const photosPlugin: CmsPlugin = {
  id: 'photos',
  name: 'Photo Manager',
  version: '2.0.0',
  // No requiredEnv — we check for any storage provider credential
  // and skip gracefully if none are configured

  async register(ctx) {
    // Check for any storage credentials
    if (!hasStorageCredentials()) {
      ctx.logger.warn(
        {},
        'Photos plugin skipped — no storage credentials found. ' +
        'Set GCS_BUCKET (Google), AZURE_STORAGE_CONNECTION_STRING (Azure), ' +
        'or AWS_ACCESS_KEY_ID (S3) to enable.',
      );
      return;
    }

    // Auto-create cms_photos table
    await ensurePhotosTable();

    // Ensure the storage bucket exists
    await ensureBlobContainer();

    // Mount site-scoped authenticated routes
    const router = createRoutes(ctx.db, ctx.logger);
    ctx.addRoutes('photos', router);

    // Register admin navigation
    ctx.addAdminNav({
      title: 'Media',
      siteScoped: true,
      items: [
        { label: 'Photo Curator', icon: 'Camera', href: 'photos' },
      ],
    });

    // Register admin route
    ctx.addAdminRoutes([
      { path: 'sites/:siteId/photos', component: '@netrun-cms/plugin-photos/admin/PhotoCurator' },
    ]);

    const providerName = getStorageProviderName();
    ctx.logger.info(
      { provider: providerName },
      `Photos plugin registered (storage: ${providerName})`,
    );
  },
};

export default photosPlugin;

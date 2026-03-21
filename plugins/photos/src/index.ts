/**
 * Photos Plugin — Azure Blob Storage upload + AI-powered curation via Gemini.
 *
 * Provides site-scoped photo management: bulk upload, AI curation scoring,
 * selection toggling, and cleanup of stale records.
 *
 * Requires AZURE_STORAGE_CONNECTION_STRING for blob storage.
 * Optionally uses GEMINI_API_KEY for AI curation.
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createRoutes } from './routes.js';
import { ensurePhotosTable, ensureBlobContainer } from './lib/photos.js';

const photosPlugin: CmsPlugin = {
  id: 'photos',
  name: 'Photo Manager',
  version: '1.0.0',
  requiredEnv: ['AZURE_STORAGE_CONNECTION_STRING'],

  async register(ctx) {
    // Auto-create cms_photos table if it does not exist
    await ensurePhotosTable();

    // Ensure the blob container exists
    await ensureBlobContainer();

    // Mount site-scoped authenticated routes
    const router = createRoutes(ctx.db, ctx.logger);
    ctx.addRoutes('photos', router);

    // Register admin navigation — Media section
    ctx.addAdminNav({
      title: 'Media',
      siteScoped: true,
      items: [
        {
          label: 'Photo Curator',
          icon: 'Camera',
          href: 'photos',
        },
      ],
    });

    // Register admin route for the photos page
    ctx.addAdminRoutes([
      {
        path: 'sites/:siteId/photos',
        component: '@netrun-cms/plugin-photos/admin/PhotoCurator',
      },
    ]);

    ctx.logger.info({}, 'Photos plugin registered');
  },
};

export default photosPlugin;

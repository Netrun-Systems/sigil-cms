/**
 * Media Routes
 *
 * CRUD routes for media files with site filtering
 */

import { Router } from 'express';
import type { Router as RouterType } from 'express';
import { MediaController } from '../controllers/MediaController.js';
import { authenticate, requireRole, tenantContext, validateUuidParam } from '../middleware/index.js';

const router: RouterType = Router({ mergeParams: true });

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantContext);

/**
 * GET /api/v1/sites/:siteId/media
 * List all media for a site
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - folder: string (filter by folder path)
 * - mimeType: string (e.g., 'image', 'image/png', 'video')
 * - search: string (search filename, original filename, alt text)
 */
router.get('/', MediaController.list);

/**
 * GET /api/v1/sites/:siteId/media/folders
 * List all folders in the media library with counts
 */
router.get('/folders', MediaController.listFolders);

/**
 * POST /api/v1/sites/:siteId/media
 * Create a new media record
 *
 * Body: {
 *   filename: string,
 *   originalFilename: string,
 *   mimeType: string,
 *   fileSize: number,
 *   url: string,
 *   thumbnailUrl?: string,
 *   altText?: string,
 *   caption?: string,
 *   folder?: string,
 *   metadata?: object
 * }
 */
router.post('/', requireRole('admin', 'editor', 'author'), MediaController.create);

/**
 * GET /api/v1/sites/:siteId/media/:id
 * Get a single media item by ID
 */
router.get('/:id', validateUuidParam('id'), MediaController.get);

/**
 * PUT /api/v1/sites/:siteId/media/:id
 * Update media metadata
 *
 * Body: Partial media data (altText, caption, folder, metadata)
 */
router.put('/:id', validateUuidParam('id'), requireRole('admin', 'editor', 'author'), MediaController.update);

/**
 * DELETE /api/v1/sites/:siteId/media/:id
 * Delete a media item
 */
router.delete('/:id', validateUuidParam('id'), requireRole('admin', 'editor'), MediaController.delete);

export default router;

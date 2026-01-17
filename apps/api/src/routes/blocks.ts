/**
 * Blocks Routes
 *
 * CRUD routes for content blocks with page filtering
 */

import { Router } from 'express';
import { BlocksController } from '../controllers/BlocksController.js';
import { authenticate, requireRole, tenantContext, validateUuidParam } from '../middleware/index.js';

const router = Router({ mergeParams: true });

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantContext);

/**
 * GET /api/v1/sites/:siteId/pages/:pageId/blocks
 * List all blocks for a page
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - blockType: string (e.g., 'hero', 'text', 'image')
 * - isVisible: 'true' | 'false'
 */
router.get('/', BlocksController.list);

/**
 * POST /api/v1/sites/:siteId/pages/:pageId/blocks
 * Create a new block
 *
 * Body: {
 *   blockType: string,
 *   content?: object,
 *   settings?: object,
 *   sortOrder?: number,
 *   isVisible?: boolean
 * }
 */
router.post('/', requireRole('admin', 'editor', 'author'), BlocksController.create);

/**
 * PUT /api/v1/sites/:siteId/pages/:pageId/blocks/reorder
 * Reorder blocks within a page
 *
 * Body: {
 *   blockIds: string[] (ordered list of block IDs)
 * }
 */
router.put('/reorder', requireRole('admin', 'editor', 'author'), BlocksController.reorder);

/**
 * GET /api/v1/sites/:siteId/pages/:pageId/blocks/:id
 * Get a single block by ID
 */
router.get('/:id', validateUuidParam('id'), BlocksController.get);

/**
 * PUT /api/v1/sites/:siteId/pages/:pageId/blocks/:id
 * Update an existing block
 *
 * Body: Partial block data (blockType, content, settings, sortOrder, isVisible)
 */
router.put('/:id', validateUuidParam('id'), requireRole('admin', 'editor', 'author'), BlocksController.update);

/**
 * DELETE /api/v1/sites/:siteId/pages/:pageId/blocks/:id
 * Delete a block
 */
router.delete('/:id', validateUuidParam('id'), requireRole('admin', 'editor'), BlocksController.delete);

export default router;

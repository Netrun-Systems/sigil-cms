/**
 * Pages Routes
 *
 * CRUD routes for CMS pages with site filtering
 */

import { Router } from 'express';
import type { Router as RouterType } from 'express';
import { PagesController } from '../controllers/PagesController.js';
import { authenticate, requireRole, tenantContext, validateUuidParam } from '../middleware/index.js';

const router: RouterType = Router({ mergeParams: true });

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantContext);

/**
 * GET /api/v1/sites/:siteId/pages
 * List all pages for a site
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - status: 'draft' | 'published' | 'scheduled' | 'archived'
 * - language: string (e.g., 'en', 'es')
 * - parentId: string (UUID or 'null' for root pages)
 */
router.get('/', PagesController.list);

/**
 * POST /api/v1/sites/:siteId/pages
 * Create a new page
 *
 * Body: {
 *   title: string,
 *   slug: string,
 *   parentId?: string,
 *   status?: 'draft' | 'published' | 'scheduled' | 'archived',
 *   language?: string,
 *   metaTitle?: string,
 *   metaDescription?: string,
 *   ogImageUrl?: string,
 *   template?: string,
 *   sortOrder?: number
 * }
 */
router.post('/', requireRole('admin', 'editor', 'author'), PagesController.create);

/**
 * GET /api/v1/sites/:siteId/pages/:id
 * Get a single page by ID
 *
 * Query params:
 * - includeBlocks: 'true' to include content blocks
 */
router.get('/:id', validateUuidParam('id'), PagesController.get);

/**
 * PUT /api/v1/sites/:siteId/pages/:id
 * Update an existing page
 *
 * Body: Partial page data
 */
router.put('/:id', validateUuidParam('id'), requireRole('admin', 'editor', 'author'), PagesController.update);

/**
 * DELETE /api/v1/sites/:siteId/pages/:id
 * Delete a page and all its content blocks
 */
router.delete('/:id', validateUuidParam('id'), requireRole('admin', 'editor'), PagesController.delete);

export default router;

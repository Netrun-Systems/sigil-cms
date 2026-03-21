/**
 * Pages Routes
 *
 * CRUD routes for CMS pages with site filtering
 */

import { Router } from 'express';
import type { Router as RouterType } from 'express';
import { PagesController } from '../controllers/PagesController.js';
import { authenticate, requireRole, tenantContext, validateUuidParam, enforcePageLimit } from '../middleware/index.js';

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
router.post('/', requireRole('admin', 'editor', 'author'), enforcePageLimit(), PagesController.create);

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

/**
 * GET /api/v1/sites/:siteId/pages/:id/translations
 * List all translations of a page (pages sharing same slug but different language)
 */
router.get('/:id/translations', validateUuidParam('id'), PagesController.listTranslations);

/**
 * POST /api/v1/sites/:siteId/pages/:id/translate
 * Create a translation of a page into a target language
 *
 * Body: { language: string }
 * Clones the page and all content blocks with the new language code
 */
router.post('/:id/translate', validateUuidParam('id'), requireRole('admin', 'editor', 'author'), PagesController.createTranslation);

/**
 * PATCH /api/v1/sites/:siteId/pages/:id/schedule
 * Set or clear publishAt/unpublishAt for content scheduling
 *
 * Body: {
 *   publishAt?: string (ISO 8601) | null,
 *   unpublishAt?: string (ISO 8601) | null
 * }
 *
 * - publishAt in the future sets status to 'scheduled'
 * - publishAt in the past or now publishes immediately
 * - null clears the schedule
 */
router.patch('/:id/schedule', validateUuidParam('id'), requireRole('admin', 'editor'), PagesController.schedule);

/**
 * GET /api/v1/sites/:siteId/pages/:pageId/revisions
 * List all revisions for a page (newest first)
 */
router.get('/:pageId/revisions', validateUuidParam('pageId'), PagesController.listRevisions);

/**
 * GET /api/v1/sites/:siteId/pages/:pageId/revisions/:revisionId
 * Get a specific revision with its content snapshot
 */
router.get('/:pageId/revisions/:revisionId', validateUuidParam('pageId'), PagesController.getRevision);

/**
 * POST /api/v1/sites/:siteId/pages/:pageId/revisions/:revisionId/revert
 * Revert page to a specific revision
 */
router.post('/:pageId/revisions/:revisionId/revert', validateUuidParam('pageId'), requireRole('admin', 'editor'), PagesController.revertToRevision);

export default router;

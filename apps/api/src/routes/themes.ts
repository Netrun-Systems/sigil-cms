/**
 * Themes Routes
 *
 * CRUD routes for themes with site filtering
 */

import { Router } from 'express';
import { ThemesController } from '../controllers/ThemesController.js';
import { authenticate, requireRole, tenantContext, validateUuidParam } from '../middleware/index.js';

const router = Router({ mergeParams: true });

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantContext);

/**
 * GET /api/v1/sites/:siteId/themes
 * List all themes for a site
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - baseTheme: string (e.g., 'netrun-dark', 'kog', 'minimal')
 * - isActive: 'true' | 'false'
 */
router.get('/', ThemesController.list);

/**
 * GET /api/v1/sites/:siteId/themes/active
 * Get the currently active theme for a site
 */
router.get('/active', ThemesController.getActive);

/**
 * POST /api/v1/sites/:siteId/themes
 * Create a new theme
 *
 * Body: {
 *   name: string,
 *   baseTheme?: string,
 *   isActive?: boolean,
 *   tokens: {
 *     colors: Record<string, string>,
 *     typography: Record<string, string | number>,
 *     spacing?: Record<string, string>,
 *     effects?: Record<string, string>
 *   },
 *   customCss?: string
 * }
 */
router.post('/', requireRole('admin', 'editor'), ThemesController.create);

/**
 * GET /api/v1/sites/:siteId/themes/:id
 * Get a single theme by ID
 */
router.get('/:id', validateUuidParam('id'), ThemesController.get);

/**
 * PUT /api/v1/sites/:siteId/themes/:id
 * Update an existing theme
 *
 * Body: Partial theme data
 */
router.put('/:id', validateUuidParam('id'), requireRole('admin', 'editor'), ThemesController.update);

/**
 * POST /api/v1/sites/:siteId/themes/:id/activate
 * Activate a theme (deactivates all other themes)
 */
router.post('/:id/activate', validateUuidParam('id'), requireRole('admin', 'editor'), ThemesController.activate);

/**
 * POST /api/v1/sites/:siteId/themes/:id/duplicate
 * Duplicate a theme
 *
 * Body: {
 *   name?: string (optional new name)
 * }
 */
router.post('/:id/duplicate', validateUuidParam('id'), requireRole('admin', 'editor'), ThemesController.duplicate);

/**
 * DELETE /api/v1/sites/:siteId/themes/:id
 * Delete a theme (cannot delete active theme)
 */
router.delete('/:id', validateUuidParam('id'), requireRole('admin'), ThemesController.delete);

export default router;

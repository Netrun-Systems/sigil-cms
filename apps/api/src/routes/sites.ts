/**
 * Sites Routes
 *
 * CRUD routes for CMS sites
 */

import { Router } from 'express';
import { SitesController } from '../controllers/SitesController.js';
import { authenticate, requireRole, tenantContext, validateUuidParam } from '../middleware/index.js';

import type { Router as RouterType } from "express";
const router: RouterType = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantContext);

/**
 * GET /api/v1/sites
 * List all sites for the current tenant
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - status: 'draft' | 'published' | 'archived'
 */
router.get('/', SitesController.list);

/**
 * POST /api/v1/sites
 * Create a new site
 *
 * Body: {
 *   name: string,
 *   slug: string,
 *   domain?: string,
 *   defaultLanguage?: string,
 *   status?: 'draft' | 'published' | 'archived',
 *   settings?: object
 * }
 */
router.post('/', requireRole('admin', 'editor'), SitesController.create);

/**
 * GET /api/v1/sites/:id
 * Get a single site by ID
 */
router.get('/:id', validateUuidParam('id'), SitesController.get);

/**
 * PUT /api/v1/sites/:id
 * Update an existing site
 *
 * Body: Partial site data
 */
router.put('/:id', validateUuidParam('id'), requireRole('admin', 'editor'), SitesController.update);

/**
 * DELETE /api/v1/sites/:id
 * Delete a site and all its associated data
 */
router.delete('/:id', validateUuidParam('id'), requireRole('admin'), SitesController.delete);

export default router;

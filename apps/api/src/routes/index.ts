/**
 * API Routes Index
 *
 * Configures all API routes with proper nesting
 */

import { Router } from 'express';
import sitesRouter from './sites.js';
import pagesRouter from './pages.js';
import blocksRouter from './blocks.js';
import mediaRouter from './media.js';
import themesRouter from './themes.js';
import { validateUuidParam } from '../middleware/index.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    },
  });
});

// Sites routes (top-level)
router.use('/sites', sitesRouter);

// Nested routes under sites
// Pages: /api/v1/sites/:siteId/pages
router.use('/sites/:siteId/pages', validateUuidParam('siteId'), pagesRouter);

// Blocks: /api/v1/sites/:siteId/pages/:pageId/blocks
router.use(
  '/sites/:siteId/pages/:pageId/blocks',
  validateUuidParam('siteId'),
  validateUuidParam('pageId'),
  blocksRouter
);

// Media: /api/v1/sites/:siteId/media
router.use('/sites/:siteId/media', validateUuidParam('siteId'), mediaRouter);

// Themes: /api/v1/sites/:siteId/themes
router.use('/sites/:siteId/themes', validateUuidParam('siteId'), themesRouter);

export default router;

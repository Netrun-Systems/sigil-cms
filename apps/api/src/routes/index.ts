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
import releasesRouter from './releases.js';
import eventsRouter from './events.js';
import artistProfilesRouter from './artist-profiles.js';
import publicRouter from './public.js';
import seedRouter from './seed.js';
import advisorRouter from './advisor.js';
import photosRouter from './photos.js';
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

// Public API routes (no auth required)
router.use('/public', publicRouter);

// Seed API routes (own auth: X-Seed-Key for bootstrap, JWT for artist-site)
router.use('/seed', seedRouter);

// AI Advisor routes (JWT-protected, not site-scoped)
router.use('/advisor', advisorRouter);

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

// Artist routes: /api/v1/sites/:siteId/releases
router.use('/sites/:siteId/releases', validateUuidParam('siteId'), releasesRouter);

// Artist routes: /api/v1/sites/:siteId/events
router.use('/sites/:siteId/events', validateUuidParam('siteId'), eventsRouter);

// Artist routes: /api/v1/sites/:siteId/artist-profile
router.use('/sites/:siteId/artist-profile', validateUuidParam('siteId'), artistProfilesRouter);

// Photos: /api/v1/sites/:siteId/photos (Azure Blob Storage + AI curation)
router.use('/sites/:siteId/photos', validateUuidParam('siteId'), photosRouter);

export default router;

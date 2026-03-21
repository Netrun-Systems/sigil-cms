/**
 * API Routes Index
 *
 * Core CMS routes only. Plugin routes are mounted by the plugin loader.
 */

import { Router } from 'express';
import sitesRouter from './sites.js';
import pagesRouter from './pages.js';
import blocksRouter from './blocks.js';
import blockTypesRouter from './block-types.js';
import mediaRouter from './media.js';
import themesRouter from './themes.js';
import publicRouter from './public.js';
import seedRouter from './seed.js';
import { validateUuidParam } from '../middleware/index.js';

import type { Router as RouterType } from "express";
const router: RouterType = Router();

// Public API routes (no auth required)
router.use('/public', publicRouter);

// Seed API routes (own auth: X-Seed-Key for bootstrap, JWT for artist-site)
router.use('/seed', seedRouter);

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

// Block types catalog: /api/v1/blocks/types
router.use('/blocks/types', blockTypesRouter);

// Media: /api/v1/sites/:siteId/media
router.use('/sites/:siteId/media', validateUuidParam('siteId'), mediaRouter);

// Themes: /api/v1/sites/:siteId/themes
router.use('/sites/:siteId/themes', validateUuidParam('siteId'), themesRouter);

// NOTE: The following routes have been moved to plugins:
// - releases, events, artist-profiles → @netrun-cms/plugin-artist
// - photos → @netrun-cms/plugin-photos
// - subscribers → @netrun-cms/plugin-mailing-list
// - contacts → @netrun-cms/plugin-contact
// - advisor → @netrun-cms/plugin-advisor
// They are mounted automatically by the plugin loader in index.ts

export default router;

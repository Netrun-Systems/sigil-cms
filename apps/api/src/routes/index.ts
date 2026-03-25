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
import designAiRouter from './design-ai.js';
import publicRouter from './public.js';
import seedRouter from './seed.js';
import billingRouter from './billing.js';
import authRouter from './auth.js';
import tenantsRouter from './tenants.js';
import auditRouter from './audit.js';
import blockTemplatesRouter from './block-templates.js';
import { validateUuidParam, resolveSubdomain, auditLog } from '../middleware/index.js';

import type { Router as RouterType } from "express";
const router: RouterType = Router();

// Subdomain resolution (sets req.tenantId from host header — runs on all routes)
router.use(resolveSubdomain);

// Audit log (records all write operations — runs on all authenticated routes)
router.use(auditLog);

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

// Design AI: /api/v1/sites/:siteId/design (Stitch generation + Charlotte advisor)
router.use('/sites/:siteId/design', validateUuidParam('siteId'), designAiRouter);

// Billing: /api/v1/billing (subscription management, Stripe integration)
router.use('/billing', billingRouter);

// Auth: /api/v1/auth (tenant switching, multi-tenant auth helpers)
router.use('/auth', authRouter);

// Tenants: /api/v1/tenants (provision, usage, current)
router.use('/tenants', tenantsRouter);
// Auth tenant helpers (switch-tenant, current — also mounted under /tenants for backward compat)
router.use('/tenants', authRouter);

// Block templates: /api/v1/sites/:siteId/block-templates (reusable block presets)
router.use('/sites/:siteId/block-templates', validateUuidParam('siteId'), blockTemplatesRouter);

// Audit log: /api/v1/audit (tenant activity history for compliance)
router.use('/audit', auditRouter);

// NOTE: The following routes have been moved to plugins:
// - releases, events, artist-profiles → @netrun-cms/plugin-artist
// - photos → @netrun-cms/plugin-photos
// - subscribers → @netrun-cms/plugin-mailing-list
// - contacts → @netrun-cms/plugin-contact
// - advisor → @netrun-cms/plugin-advisor
// They are mounted automatically by the plugin loader in index.ts

export default router;

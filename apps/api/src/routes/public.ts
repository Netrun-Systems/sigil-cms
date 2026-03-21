/**
 * Public API Routes (Core)
 *
 * Read-only endpoints for published content — no authentication required.
 * Used by consumer sites (e.g., Frost) to fetch CMS content.
 *
 * Plugin-specific public routes (releases, events, artist-profile,
 * subscribe, unsubscribe, contact, sitemap, RSS) are now handled
 * by their respective plugins.
 */

import { Router, type Request, type Response } from 'express';
import { eq, and, asc } from 'drizzle-orm';
import { sites, pages, contentBlocks, themes } from '@netrun-cms/db';
import { getDb } from '../db.js';

import type { Router as RouterType } from "express";
const router: RouterType = Router();

/**
 * GET /api/v1/public/sites/:siteSlug/pages/:pageSlug
 * Public page content with blocks
 */
router.get('/sites/:siteSlug/pages/:pageSlug', async (req: Request, res: Response) => {
  const db = getDb();
  const siteSlug = req.params.siteSlug as string;
  const pageSlug = req.params.pageSlug as string;

  const [site] = await db.select({ id: sites.id }).from(sites)
    .where(and(eq(sites.slug, siteSlug), eq(sites.status, 'published'))).limit(1);
  if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

  const [page] = await db.select().from(pages)
    .where(and(eq(pages.siteId, site.id), eq(pages.slug, pageSlug), eq(pages.status, 'published')))
    .limit(1);
  if (!page) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Page not found' } }); return; }

  const blocks = await db.select().from(contentBlocks)
    .where(and(eq(contentBlocks.pageId, page.id), eq(contentBlocks.isVisible, true)))
    .orderBy(asc(contentBlocks.sortOrder));

  res.json({ success: true, data: { ...page, blocks } });
});

/**
 * GET /api/v1/public/sites/:siteSlug/theme
 * Public active theme for a site
 */
router.get('/sites/:siteSlug/theme', async (req: Request, res: Response) => {
  const db = getDb();
  const siteSlug = req.params.siteSlug as string;

  const [site] = await db.select({ id: sites.id }).from(sites)
    .where(and(eq(sites.slug, siteSlug), eq(sites.status, 'published'))).limit(1);
  if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

  const [theme] = await db.select().from(themes)
    .where(and(eq(themes.siteId, site.id), eq(themes.isActive, true))).limit(1);

  res.json({ success: true, data: theme || null });
});

export default router;

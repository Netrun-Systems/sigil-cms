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
import { eq, and, asc, sql } from 'drizzle-orm';
import { sites, pages, contentBlocks, themes } from '@netrun-cms/db';
import { getDb } from '../db.js';
import {
  pageCache, themeCache, navCache, siteCache,
  PAGE_TTL, THEME_TTL, NAV_TTL, SITE_TTL,
  cachePurgeHandler, cacheStatsHandler,
} from '../lib/cache.js';
import { authenticate, requireRole } from '../middleware/index.js';

import type { Router as RouterType } from "express";
const router: RouterType = Router();

/**
 * GET /api/v1/public/sites/:siteSlug/pages/:pageSlug(*)
 * Public page content with blocks
 *
 * Query params:
 * - lang: string (e.g., 'es') — fetch the page in a specific language.
 *   Falls back to the site's defaultLanguage if not found.
 */
router.get('/sites/:siteSlug/pages/:pageSlug(*)', async (req: Request, res: Response) => {
  const db = getDb();
  const siteSlug = req.params.siteSlug as string;
  const pageSlug = req.params.pageSlug as string;
  const lang = req.query.lang as string | undefined;
  const cacheKey = `page:${siteSlug}:${pageSlug}:${lang || 'default'}`;

  // Check cache
  const cached = pageCache.get(cacheKey);
  if (cached) {
    if (req.headers['if-none-match'] === `"${cached.etag}"`) {
      res.status(304).end();
      return;
    }
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.set('ETag', `"${cached.etag}"`);
    res.set('Vary', 'Accept-Encoding');
    res.json({ success: true, data: cached.data });
    return;
  }

  // Look up site (with its own cache tier)
  const siteCacheKey = `site:${siteSlug}`;
  let site = siteCache.get<{ id: string; defaultLanguage: string }>(siteCacheKey)?.data ?? null;
  if (!site) {
    const [siteRow] = await db.select({ id: sites.id, defaultLanguage: sites.defaultLanguage }).from(sites)
      .where(and(eq(sites.slug, siteSlug), eq(sites.status, 'published'))).limit(1);
    if (siteRow) {
      siteCache.set(siteCacheKey, siteRow, SITE_TTL);
      site = siteRow;
    }
  }
  if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

  let page;

  // If a specific language is requested, try to find it first
  if (lang) {
    const [langPage] = await db.select().from(pages)
      .where(and(eq(pages.siteId, site.id), eq(pages.slug, pageSlug), eq(pages.status, 'published'), eq(pages.language, lang)))
      .limit(1);
    page = langPage;
  }

  // Fall back to the site's default language if not found
  if (!page) {
    const [defaultPage] = await db.select().from(pages)
      .where(and(eq(pages.siteId, site.id), eq(pages.slug, pageSlug), eq(pages.status, 'published'), eq(pages.language, site.defaultLanguage)))
      .limit(1);
    page = defaultPage;
  }

  // Last resort: any published page with that slug
  if (!page) {
    const [anyPage] = await db.select().from(pages)
      .where(and(eq(pages.siteId, site.id), eq(pages.slug, pageSlug), eq(pages.status, 'published')))
      .limit(1);
    page = anyPage;
  }

  // Fallback: try matching by fullPath (for nested pages like /features/hero-block)
  if (!page && pageSlug.includes('/')) {
    const fullPathValue = '/' + pageSlug;
    const pathResults = await db.execute(
      sql`SELECT * FROM cms_pages WHERE site_id = ${site.id} AND full_path = ${fullPathValue} AND status = 'published' LIMIT 1`
    );
    if (pathResults && Array.isArray(pathResults) && pathResults.length > 0) {
      // Map raw row to page format
      const row = pathResults[0] as Record<string, unknown>;
      page = {
        id: row.id as string,
        siteId: row.site_id as string,
        parentId: row.parent_id as string | null,
        title: row.title as string,
        slug: row.slug as string,
        fullPath: row.full_path as string | null,
        status: row.status as string,
        publishedAt: row.published_at as Date | null,
        publishAt: row.publish_at as Date | null,
        unpublishAt: row.unpublish_at as Date | null,
        language: row.language as string,
        metaTitle: row.meta_title as string | null,
        metaDescription: row.meta_description as string | null,
        ogImageUrl: row.og_image_url as string | null,
        template: row.template as string,
        sortOrder: row.sort_order as number,
        createdAt: row.created_at as Date,
        updatedAt: row.updated_at as Date,
      } as typeof page;
    }
  }

  if (!page) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Page not found' } }); return; }

  const blocks = await db.select().from(contentBlocks)
    .where(and(eq(contentBlocks.pageId, page.id), eq(contentBlocks.isVisible, true)))
    .orderBy(asc(contentBlocks.sortOrder));

  const pageData = { ...page, blocks };
  const entry = pageCache.set(cacheKey, pageData, PAGE_TTL);

  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.set('ETag', `"${entry.etag}"`);
  res.set('Vary', 'Accept-Encoding');
  res.set('Surrogate-Control', 'max-age=300');
  res.set('Surrogate-Key', `site-${siteSlug} page-${pageSlug}`);
  res.json({ success: true, data: pageData });
});

/**
 * GET /api/v1/public/sites/:siteSlug/theme
 * Public active theme for a site
 */
router.get('/sites/:siteSlug/theme', async (req: Request, res: Response) => {
  const db = getDb();
  const siteSlug = req.params.siteSlug as string;
  const cacheKey = `theme:${siteSlug}`;

  // Check cache
  const cached = themeCache.get(cacheKey);
  if (cached) {
    if (req.headers['if-none-match'] === `"${cached.etag}"`) {
      res.status(304).end();
      return;
    }
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.set('ETag', `"${cached.etag}"`);
    res.set('Vary', 'Accept-Encoding');
    res.json({ success: true, data: cached.data });
    return;
  }

  const [site] = await db.select({ id: sites.id }).from(sites)
    .where(and(eq(sites.slug, siteSlug), eq(sites.status, 'published'))).limit(1);
  if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

  const [theme] = await db.select().from(themes)
    .where(and(eq(themes.siteId, site.id), eq(themes.isActive, true))).limit(1);

  const themeData = theme || null;
  const entry = themeCache.set(cacheKey, themeData, THEME_TTL);

  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.set('ETag', `"${entry.etag}"`);
  res.set('Vary', 'Accept-Encoding');
  res.set('Surrogate-Control', 'max-age=300');
  res.set('Surrogate-Key', `site-${siteSlug} theme`);
  res.json({ success: true, data: themeData });
});

/**
 * GET /api/v1/public/sites/:siteSlug/pages
 * List all published pages for a site (for navigation / sitemap)
 */
router.get('/sites/:siteSlug/pages', async (req: Request, res: Response) => {
  const db = getDb();
  const siteSlug = req.params.siteSlug as string;
  const cacheKey = `nav:${siteSlug}`;

  // Check cache
  const cached = navCache.get(cacheKey);
  if (cached) {
    if (req.headers['if-none-match'] === `"${cached.etag}"`) {
      res.status(304).end();
      return;
    }
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.set('ETag', `"${cached.etag}"`);
    res.set('Vary', 'Accept-Encoding');
    res.json({ success: true, data: cached.data });
    return;
  }

  const [site] = await db.select({ id: sites.id }).from(sites)
    .where(and(eq(sites.slug, siteSlug), eq(sites.status, 'published'))).limit(1);
  if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

  const publishedPages = await db.select({
    id: pages.id,
    title: pages.title,
    slug: pages.slug,
    fullPath: pages.fullPath,
    status: pages.status,
    metaTitle: pages.metaTitle,
    metaDescription: pages.metaDescription,
    ogImageUrl: pages.ogImageUrl,
    template: pages.template,
    sortOrder: pages.sortOrder,
  }).from(pages)
    .where(and(eq(pages.siteId, site.id), eq(pages.status, 'published')))
    .orderBy(asc(pages.sortOrder));

  const entry = navCache.set(cacheKey, publishedPages, NAV_TTL);

  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.set('ETag', `"${entry.etag}"`);
  res.set('Vary', 'Accept-Encoding');
  res.set('Surrogate-Control', 'max-age=300');
  res.set('Surrogate-Key', `site-${siteSlug} pages`);
  res.json({ success: true, data: publishedPages });
});

/**
 * GET /api/v1/public/sites/:siteSlug/languages
 * List available languages for a site (distinct languages from published pages)
 */
router.get('/sites/:siteSlug/languages', async (req: Request, res: Response) => {
  const db = getDb();
  const siteSlug = req.params.siteSlug as string;

  const [site] = await db.select({ id: sites.id, defaultLanguage: sites.defaultLanguage }).from(sites)
    .where(and(eq(sites.slug, siteSlug), eq(sites.status, 'published'))).limit(1);
  if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

  const result = await db
    .selectDistinct({ language: pages.language })
    .from(pages)
    .where(and(eq(pages.siteId, site.id), eq(pages.status, 'published')))
    .orderBy(asc(pages.language));

  const languages = result.map((r) => r.language);

  res.json({ success: true, data: { defaultLanguage: site.defaultLanguage, languages } });
});

/**
 * GET /api/v1/public/sites/by-domain/:domain
 * Resolve a site by its custom domain (used by the renderer for multi-site routing)
 */
router.get('/sites/by-domain/:domain', async (req: Request, res: Response) => {
  const db = getDb();
  const domain = (req.params.domain as string).toLowerCase().trim();

  const [site] = await db.select({
    id: sites.id,
    name: sites.name,
    slug: sites.slug,
    domain: sites.domain,
    defaultLanguage: sites.defaultLanguage,
    status: sites.status,
  }).from(sites)
    .where(and(eq(sites.domain, domain), eq(sites.status, 'published')))
    .limit(1);

  if (!site) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No site found for this domain' } });
    return;
  }

  siteCache.set(`site-domain:${domain}`, site, SITE_TTL);

  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.set('Vary', 'Accept-Encoding');
  res.json({ success: true, data: site });
});

// ---------------------------------------------------------------------------
// Cache management endpoints (admin only)
// ---------------------------------------------------------------------------

router.post('/cache/purge', authenticate, requireRole('admin'), cachePurgeHandler);
router.get('/cache/stats', authenticate, cacheStatsHandler);

export default router;

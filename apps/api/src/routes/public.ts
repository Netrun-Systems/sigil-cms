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

  const [site] = await db.select({ id: sites.id, defaultLanguage: sites.defaultLanguage }).from(sites)
    .where(and(eq(sites.slug, siteSlug), eq(sites.status, 'published'))).limit(1);
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

/**
 * GET /api/v1/public/sites/:siteSlug/pages
 * List all published pages for a site (for navigation / sitemap)
 */
router.get('/sites/:siteSlug/pages', async (req: Request, res: Response) => {
  const db = getDb();
  const siteSlug = req.params.siteSlug as string;

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

  res.json({ success: true, data: site });
});

export default router;

/**
 * Public API Routes
 *
 * Read-only endpoints for published content — no authentication required.
 * Used by consumer sites (e.g., Frost) to fetch CMS content.
 */

import { Router, type Request, type Response } from 'express';
import { eq, and, desc, asc, gte } from 'drizzle-orm';
import { sites, pages, contentBlocks, releases, events, artistProfiles, themes } from '@netrun-cms/db';
import { getDb } from '../db.js';
import { SubscribersController } from '../controllers/SubscribersController.js';
import { ContactController } from '../controllers/ContactController.js';

import type { Router as RouterType } from "express";
const router: RouterType = Router();

/**
 * GET /api/v1/public/sites/:siteSlug/releases
 * Public list of published releases, newest first
 */
router.get('/sites/:siteSlug/releases', async (req: Request, res: Response) => {
  const db = getDb();
  const siteSlug = req.params.siteSlug as string;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

  const [site] = await db.select({ id: sites.id }).from(sites)
    .where(and(eq(sites.slug, siteSlug), eq(sites.status, 'published'))).limit(1);
  if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

  const results = await db.select().from(releases)
    .where(and(eq(releases.siteId, site.id), eq(releases.isPublished, true)))
    .orderBy(desc(releases.releaseDate), asc(releases.sortOrder))
    .limit(limit);

  res.json({ success: true, data: results });
});

/**
 * GET /api/v1/public/sites/:siteSlug/events
 * Public list of published events
 * ?upcoming=true returns only future events
 */
router.get('/sites/:siteSlug/events', async (req: Request, res: Response) => {
  const db = getDb();
  const siteSlug = req.params.siteSlug as string;
  const upcoming = req.query.upcoming === 'true';
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

  const [site] = await db.select({ id: sites.id }).from(sites)
    .where(and(eq(sites.slug, siteSlug), eq(sites.status, 'published'))).limit(1);
  if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

  const conditions = [eq(events.siteId, site.id), eq(events.isPublished, true)];
  if (upcoming) {
    conditions.push(gte(events.eventDate, new Date()));
  }

  const results = await db.select().from(events)
    .where(and(...conditions))
    .orderBy(asc(events.eventDate))
    .limit(limit);

  res.json({ success: true, data: results });
});

/**
 * GET /api/v1/public/sites/:siteSlug/artist-profile
 * Public artist profile for a site
 */
router.get('/sites/:siteSlug/artist-profile', async (req: Request, res: Response) => {
  const db = getDb();
  const siteSlug = req.params.siteSlug as string;

  const [site] = await db.select({ id: sites.id }).from(sites)
    .where(and(eq(sites.slug, siteSlug), eq(sites.status, 'published'))).limit(1);
  if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

  const [profile] = await db.select().from(artistProfiles)
    .where(eq(artistProfiles.siteId, site.id)).limit(1);
  if (!profile) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Artist profile not found' } }); return; }

  res.json({ success: true, data: profile });
});

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

// ============================================================================
// MAILING LIST — Public subscribe + unsubscribe
// ============================================================================

/**
 * POST /api/v1/public/subscribe/:siteSlug
 * Public mailing list subscription
 */
router.post('/subscribe/:siteSlug', SubscribersController.subscribe);

/**
 * GET /api/v1/public/unsubscribe/:token
 * One-click unsubscribe from email
 */
router.get('/unsubscribe/:token', SubscribersController.unsubscribe);

/**
 * POST /api/v1/public/unsubscribe/:token
 * RFC 8058 List-Unsubscribe-Post support
 */
router.post('/unsubscribe/:token', SubscribersController.unsubscribe);

// ============================================================================
// CONTACT FORM — Public submission
// ============================================================================

/**
 * POST /api/v1/public/contact/:siteSlug
 * Public contact form submission (general, booking, press)
 */
router.post('/contact/:siteSlug', ContactController.submit);

// ============================================================================
// SITEMAP + RSS — Per-site SEO feeds
// ============================================================================

/**
 * GET /api/v1/public/sites/:siteSlug/sitemap.xml
 * Dynamic sitemap for a site
 */
router.get('/sites/:siteSlug/sitemap.xml', async (req: Request, res: Response) => {
  const db = getDb();
  const siteSlug = req.params.siteSlug as string;

  const [site] = await db.select({ id: sites.id, domain: sites.domain }).from(sites)
    .where(eq(sites.slug, siteSlug)).limit(1);
  if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

  const baseUrl = site.domain ? `https://${site.domain}` : `https://${siteSlug}.example.com`;

  // Get published pages
  const sitePages = await db.select({ slug: pages.slug, updatedAt: pages.updatedAt }).from(pages)
    .where(and(eq(pages.siteId, site.id), eq(pages.status, 'published')));

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += `  <url><loc>${baseUrl}</loc><changefreq>weekly</changefreq></url>\n`;
  for (const p of sitePages) {
    xml += `  <url><loc>${baseUrl}/${p.slug}</loc><lastmod>${p.updatedAt.toISOString().split('T')[0]}</lastmod></url>\n`;
  }
  xml += '</urlset>';

  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

/**
 * GET /api/v1/public/sites/:siteSlug/feed.xml
 * RSS feed for releases
 */
router.get('/sites/:siteSlug/feed.xml', async (req: Request, res: Response) => {
  const db = getDb();
  const siteSlug = req.params.siteSlug as string;

  const [site] = await db.select({ id: sites.id, name: sites.name, domain: sites.domain }).from(sites)
    .where(eq(sites.slug, siteSlug)).limit(1);
  if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

  const baseUrl = site.domain ? `https://${site.domain}` : `https://${siteSlug}.example.com`;

  const siteReleases = await db.select().from(releases)
    .where(and(eq(releases.siteId, site.id), eq(releases.isPublished, true)))
    .orderBy(desc(releases.releaseDate))
    .limit(20);

  let items = '';
  for (const r of siteReleases) {
    const link = (r.streamLinks as Record<string, string>)?.all || (r.streamLinks as Record<string, string>)?.spotify || `${baseUrl}/music`;
    items += `    <item><title>${escapeXml(r.title)}</title><link>${escapeXml(link)}</link><description>New ${r.type}: "${r.title}"</description><pubDate>${new Date(r.releaseDate).toUTCString()}</pubDate><guid>${r.id}</guid></item>\n`;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escapeXml(site.name)} - Releases</title><link>${baseUrl}</link><description>New releases from ${escapeXml(site.name)}</description><language>en-us</language><atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>\n${items}</channel></rss>`;

  res.set('Content-Type', 'application/rss+xml');
  res.send(xml);
});

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default router;

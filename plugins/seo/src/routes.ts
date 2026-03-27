// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * SEO Routes — sitemap.xml and RSS feed
 *
 * Extracted from apps/api/src/routes/public.ts
 */

import { Router, type Request, type Response } from 'express';
import { eq, and, desc, or, like } from 'drizzle-orm';
import { sites, pages, releases } from '@netrun-cms/db';
import type { DrizzleClient } from '@netrun-cms/plugin-runtime';

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function createRoutes(db: DrizzleClient): Router {
  const router = Router({ mergeParams: true });

  // Cast db for drizzle query builder usage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = db as any;

  /**
   * GET /api/v1/public/sites/:siteSlug/sitemap.xml
   */
  router.get('/sitemap.xml', async (req: Request, res: Response) => {
    const siteSlug = req.params.siteSlug as string;

    const [site] = await d.select({ id: sites.id, domain: sites.domain }).from(sites)
      .where(eq(sites.slug, siteSlug)).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

    const baseUrl = site.domain ? `https://${site.domain}` : `https://${siteSlug}.example.com`;

    const sitePages = await d.select({ slug: pages.slug, updatedAt: pages.updatedAt }).from(pages)
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
   */
  router.get('/feed.xml', async (req: Request, res: Response) => {
    const siteSlug = req.params.siteSlug as string;

    const [site] = await d.select({ id: sites.id, name: sites.name, domain: sites.domain }).from(sites)
      .where(eq(sites.slug, siteSlug)).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

    const baseUrl = site.domain ? `https://${site.domain}` : `https://${siteSlug}.example.com`;

    const siteReleases = await d.select().from(releases)
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

  /**
   * GET /api/v1/public/sites/:siteSlug/blog/feed.xml
   */
  router.get('/blog/feed.xml', async (req: Request, res: Response) => {
    const siteSlug = req.params.siteSlug as string;

    const [site] = await d.select({ id: sites.id, name: sites.name, domain: sites.domain }).from(sites)
      .where(eq(sites.slug, siteSlug)).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

    const baseUrl = site.domain ? `https://${site.domain}` : `https://${siteSlug}.example.com`;

    const blogPages = await d.select({
      id: pages.id,
      title: pages.title,
      slug: pages.slug,
      fullPath: pages.fullPath,
      metaDescription: pages.metaDescription,
      publishedAt: pages.publishedAt,
      createdAt: pages.createdAt,
    }).from(pages)
      .where(and(
        eq(pages.siteId, site.id),
        eq(pages.status, 'published'),
        or(
          eq(pages.template, 'blog'),
          like(pages.fullPath, 'blog/%'),
        ),
      ))
      .orderBy(desc(pages.publishedAt), desc(pages.createdAt))
      .limit(50);

    let items = '';
    for (const p of blogPages) {
      const pagePath = p.fullPath ?? `blog/${p.slug}`;
      const link = `${baseUrl}/${pagePath}`;
      const pubDate = (p.publishedAt ?? p.createdAt).toUTCString();
      const description = p.metaDescription
        ? escapeXml(p.metaDescription)
        : escapeXml(p.title);
      items += `    <item><title>${escapeXml(p.title)}</title><link>${escapeXml(link)}</link><description>${description}</description><pubDate>${pubDate}</pubDate><guid>${p.id}</guid></item>\n`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escapeXml(site.name)} Blog</title><link>${baseUrl}/blog</link><description>Blog posts from ${escapeXml(site.name)}</description><language>en-us</language><atom:link href="${baseUrl}/blog/feed.xml" rel="self" type="application/rss+xml"/>\n${items}</channel></rss>`;

    res.set('Content-Type', 'application/rss+xml');
    res.send(xml);
  });

  return router;
}

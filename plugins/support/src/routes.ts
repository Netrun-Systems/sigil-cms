// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * Support Panel Plugin Routes
 *
 * Public routes (mounted under /api/v1/public/support/:siteSlug):
 *   GET    /panel.js        — serves the support panel JavaScript snippet
 *   GET    /announcements   — list active announcements for the site
 *   POST   /search          — search docs/KB articles (proxies to docs plugin)
 *   POST   /contact         — submit contact form (proxies to contact plugin)
 *
 * Admin routes (mounted under /api/v1/sites/:siteId/support):
 *   GET    /announcements        — list all announcements (including inactive)
 *   POST   /announcements        — create announcement
 *   PUT    /announcements/:id    — update announcement
 *   DELETE /announcements/:id    — delete announcement
 *   GET    /config               — get support panel configuration
 *   PUT    /config               — save panel settings
 *
 * Auth note: admin routes are mounted by the API loader under an
 * auth-protected path. The plugin does not apply auth middleware itself.
 */

import { Router, type Request, type Response } from 'express';
import { eq, and, desc, asc, lte, gte, or, isNull } from 'drizzle-orm';
import { sites } from '@netrun-cms/db';
import type { DrizzleClient, PluginLogger } from '@netrun-cms/plugin-runtime';
import { supportAnnouncements } from './schema.js';
import { generateSupportPanelSnippet } from './lib/panel-snippet.js';

// Default panel configuration
const DEFAULT_CONFIG = {
  features: {
    docs: true,
    contact: true,
    chat: false,
    announcements: true,
  },
  position: 'bottom-right' as const,
  primaryColor: '#90b9ab',
  accentColor: '#6b9e8a',
  title: 'Help & Support',
  greeting: 'How can we help?',
};

// In-memory config store per site (persisted via admin PUT /config)
const siteConfigs = new Map<string, typeof DEFAULT_CONFIG>();

function getSiteConfig(siteId: string) {
  return siteConfigs.get(siteId) || { ...DEFAULT_CONFIG };
}

// ── Public Routes ─────────────────────────────────────────────────────────────

export function createPublicRoutes(db: DrizzleClient, logger: PluginLogger): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  /** GET /panel.js — serve the support panel JavaScript snippet */
  router.get('/panel.js', async (req: Request, res: Response) => {
    const { siteSlug } = req.params;

    const [site] = await d
      .select({ id: sites.id, slug: sites.slug })
      .from(sites)
      .where(eq(sites.slug, siteSlug))
      .limit(1);

    if (!site) {
      res.status(404).type('text/javascript').send('/* Site not found */');
      return;
    }

    const config = getSiteConfig(site.id);
    const apiBase = `${req.protocol}://${req.get('host')}/api/v1`;

    const snippet = generateSupportPanelSnippet({
      siteSlug,
      apiBase,
      features: config.features,
      position: config.position,
      primaryColor: config.primaryColor,
      accentColor: config.accentColor,
      title: config.title,
      greeting: config.greeting,
    });

    res.type('text/javascript').set('Cache-Control', 'public, max-age=300').send(snippet);
  });

  /** GET /announcements — list active announcements for a site */
  router.get('/announcements', async (req: Request, res: Response) => {
    const { siteSlug } = req.params;

    const [site] = await d
      .select({ id: sites.id })
      .from(sites)
      .where(eq(sites.slug, siteSlug))
      .limit(1);

    if (!site) {
      res.status(404).json({ success: false, error: { message: 'Site not found' } });
      return;
    }

    const now = new Date();

    const results = await d
      .select()
      .from(supportAnnouncements)
      .where(
        and(
          eq(supportAnnouncements.siteId, site.id),
          eq(supportAnnouncements.isActive, true),
          or(isNull(supportAnnouncements.startsAt), lte(supportAnnouncements.startsAt, now)),
          or(isNull(supportAnnouncements.endsAt), gte(supportAnnouncements.endsAt, now))
        )
      )
      .orderBy(asc(supportAnnouncements.sortOrder), desc(supportAnnouncements.createdAt));

    res.json({ success: true, data: results });
  });

  /** POST /search — proxy search to docs plugin public endpoint */
  router.post('/search', async (req: Request, res: Response) => {
    const { siteSlug } = req.params;
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      res.json({ success: true, data: [] });
      return;
    }

    // Proxy to the docs plugin search — query doc_articles for matching titles/excerpts
    try {
      const [site] = await d
        .select({ id: sites.id })
        .from(sites)
        .where(eq(sites.slug, siteSlug))
        .limit(1);

      if (!site) {
        res.json({ success: true, data: [] });
        return;
      }

      // Direct DB search against doc_articles (avoids HTTP self-request)
      const searchTerm = `%${query.toLowerCase()}%`;
      const results = await d.execute(
        `SELECT id, slug, title, excerpt
         FROM cms_doc_articles
         WHERE site_id = '${site.id}'
           AND (LOWER(title) LIKE '${searchTerm}' OR LOWER(excerpt) LIKE '${searchTerm}')
         ORDER BY is_pinned DESC, is_featured DESC, view_count DESC
         LIMIT 10`
      );

      const articles = (results?.rows || results || []).map((r: any) => ({
        title: r.title,
        excerpt: r.excerpt || '',
        url: `/docs/${r.slug}`,
      }));

      res.json({ success: true, data: articles });
    } catch (err) {
      logger.warn({ err, siteSlug }, 'Support search failed — docs plugin may not be active');
      res.json({ success: true, data: [] });
    }
  });

  /** POST /contact — proxy contact form to contact plugin */
  router.post('/contact', async (req: Request, res: Response) => {
    const { siteSlug } = req.params;
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      res.status(400).json({ success: false, error: { message: 'name, email, and message are required' } });
      return;
    }

    // Forward to contact plugin's public endpoint via internal HTTP
    try {
      const apiBase = `${req.protocol}://${req.get('host')}`;
      const response = await fetch(`${apiBase}/api/v1/public/contact/${siteSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, subject: 'Support Panel Inquiry' }),
      });
      const data = await response.json();
      res.json(data);
    } catch (err) {
      logger.warn({ err, siteSlug }, 'Support contact proxy failed — contact plugin may not be active');
      res.status(503).json({ success: false, error: { message: 'Contact service unavailable' } });
    }
  });

  return router;
}

// ── Admin Routes ──────────────────────────────────────────────────────────────

export function createAdminRoutes(db: DrizzleClient, logger: PluginLogger): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  /** GET /announcements — list all announcements (including inactive) */
  router.get('/announcements', async (req: Request, res: Response) => {
    const { siteId } = req.params;

    const results = await d
      .select()
      .from(supportAnnouncements)
      .where(eq(supportAnnouncements.siteId, siteId))
      .orderBy(asc(supportAnnouncements.sortOrder), desc(supportAnnouncements.createdAt));

    res.json({ success: true, data: results });
  });

  /** POST /announcements — create announcement */
  router.post('/announcements', async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const { title, message, type, isActive, startsAt, endsAt, sortOrder } = req.body;

    if (!title || !message) {
      res.status(400).json({ success: false, error: { message: 'title and message are required' } });
      return;
    }

    const validTypes = ['info', 'warning', 'maintenance', 'resolved'];
    const announcementType = validTypes.includes(type) ? type : 'info';

    const result = await d
      .insert(supportAnnouncements)
      .values({
        siteId,
        title,
        message,
        type: announcementType,
        isActive: isActive !== undefined ? isActive : true,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        sortOrder: sortOrder || 0,
      })
      .returning();

    res.status(201).json({ success: true, data: result[0] });
  });

  /** PUT /announcements/:id — update announcement */
  router.put('/announcements/:id', async (req: Request, res: Response) => {
    const { siteId, id } = req.params;
    const { title, message, type, isActive, startsAt, endsAt, sortOrder } = req.body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title;
    if (message !== undefined) updates.message = message;
    if (type !== undefined) {
      const validTypes = ['info', 'warning', 'maintenance', 'resolved'];
      updates.type = validTypes.includes(type) ? type : 'info';
    }
    if (isActive !== undefined) updates.isActive = isActive;
    if (startsAt !== undefined) updates.startsAt = startsAt ? new Date(startsAt) : null;
    if (endsAt !== undefined) updates.endsAt = endsAt ? new Date(endsAt) : null;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;

    const result = await d
      .update(supportAnnouncements)
      .set(updates)
      .where(and(eq(supportAnnouncements.id, id), eq(supportAnnouncements.siteId, siteId)))
      .returning();

    if (result.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Announcement not found' } });
      return;
    }

    res.json({ success: true, data: result[0] });
  });

  /** DELETE /announcements/:id — delete announcement */
  router.delete('/announcements/:id', async (req: Request, res: Response) => {
    const { siteId, id } = req.params;

    await d
      .delete(supportAnnouncements)
      .where(and(eq(supportAnnouncements.id, id), eq(supportAnnouncements.siteId, siteId)));

    res.json({ success: true });
  });

  /** GET /config — get support panel configuration */
  router.get('/config', async (req: Request, res: Response) => {
    const { siteId } = req.params;
    res.json({ success: true, data: getSiteConfig(siteId) });
  });

  /** PUT /config — save panel settings */
  router.put('/config', async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const { features, position, primaryColor, accentColor, title, greeting } = req.body;

    const current = getSiteConfig(siteId);

    if (features) {
      if (typeof features.docs === 'boolean') current.features.docs = features.docs;
      if (typeof features.contact === 'boolean') current.features.contact = features.contact;
      if (typeof features.chat === 'boolean') current.features.chat = features.chat;
      if (typeof features.announcements === 'boolean') current.features.announcements = features.announcements;
    }
    if (position === 'bottom-right' || position === 'bottom-left') current.position = position;
    if (typeof primaryColor === 'string') current.primaryColor = primaryColor;
    if (typeof accentColor === 'string') current.accentColor = accentColor;
    if (typeof title === 'string') current.title = title;
    if (typeof greeting === 'string') current.greeting = greeting;

    siteConfigs.set(siteId, current);

    logger.info({ siteId }, 'Support panel config updated');
    res.json({ success: true, data: current });
  });

  return router;
}

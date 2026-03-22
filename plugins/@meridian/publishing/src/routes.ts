// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * Meridian Publishing Plugin — Express route factories
 *
 * Admin routes: publications CRUD, flipbook management, reader analytics
 * Public routes: flipbook viewer, embed, page images, analytics beacon
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { eq, and, desc, asc, count, sql, sum } from 'drizzle-orm';
import {
  meridianPublications,
  meridianFlipbooks,
  meridianPages,
  meridianReaderSessions,
  meridianPageAnalytics,
  insertPublicationSchema,
  updatePublicationSchema,
  insertFlipbookSchema,
  flipbookSettingsSchema,
  analyticsBeaconSchema,
} from './schema.js';
import { renderFlipbookViewer, renderEmbedViewer } from './viewer.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parsePagination(req: Request) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 20), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 500);
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export interface MeridianRoutes {
  adminPublications: Router;
  adminFlipbooks: Router;
  adminAnalytics: Router;
  publicFlipbooks: Router;
}

export function createRoutes(db: unknown): MeridianRoutes {
  const d = db as any;

  // =========================================================================
  // Admin — Publications CRUD
  // =========================================================================

  const adminPublications = Router({ mergeParams: true });

  // LIST
  adminPublications.get('/', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { page, limit, offset } = parsePagination(req);
    const status = req.query.status as string | undefined;

    const conditions: any[] = [eq(meridianPublications.tenantId, tenantId)];
    if (status) conditions.push(eq(meridianPublications.status, status));

    const [{ value: total }] = await d.select({ value: count() })
      .from(meridianPublications).where(and(...conditions));

    const results = await d.select().from(meridianPublications)
      .where(and(...conditions))
      .orderBy(desc(meridianPublications.updatedAt))
      .limit(limit).offset(offset);

    res.json({ success: true, data: results, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  });

  // GET
  adminPublications.get('/:id', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { id } = req.params;

    const [pub] = await d.select().from(meridianPublications)
      .where(and(eq(meridianPublications.id, id), eq(meridianPublications.tenantId, tenantId))).limit(1);
    if (!pub) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Publication not found' } }); return; }

    // Include flipbooks
    const flipbooks = await d.select().from(meridianFlipbooks)
      .where(eq(meridianFlipbooks.publicationId, id));

    res.json({ success: true, data: { ...pub, flipbooks } });
  });

  // CREATE
  adminPublications.post('/', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const slug = req.body.slug || slugify(req.body.title || '');

    const parseResult = insertPublicationSchema.safeParse({ ...req.body, tenantId, slug });
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid publication data', details: parseResult.error.errors } });
      return;
    }

    const [pub] = await d.insert(meridianPublications).values(parseResult.data).returning();
    res.status(201).json({ success: true, data: pub });
  });

  // UPDATE
  adminPublications.put('/:id', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { id } = req.params;

    const [existing] = await d.select({ id: meridianPublications.id }).from(meridianPublications)
      .where(and(eq(meridianPublications.id, id), eq(meridianPublications.tenantId, tenantId))).limit(1);
    if (!existing) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Publication not found' } }); return; }

    const parseResult = updatePublicationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid update data', details: parseResult.error.errors } });
      return;
    }

    const [pub] = await d.update(meridianPublications)
      .set({ ...parseResult.data, updatedAt: new Date() })
      .where(eq(meridianPublications.id, id)).returning();
    res.json({ success: true, data: pub });
  });

  // DELETE
  adminPublications.delete('/:id', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { id } = req.params;

    const [existing] = await d.select({ id: meridianPublications.id }).from(meridianPublications)
      .where(and(eq(meridianPublications.id, id), eq(meridianPublications.tenantId, tenantId))).limit(1);
    if (!existing) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Publication not found' } }); return; }

    await d.delete(meridianPublications).where(eq(meridianPublications.id, id));
    res.json({ success: true, data: { id } });
  });

  // PUBLISH
  adminPublications.post('/:id/publish', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { id } = req.params;

    const [existing] = await d.select().from(meridianPublications)
      .where(and(eq(meridianPublications.id, id), eq(meridianPublications.tenantId, tenantId))).limit(1);
    if (!existing) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Publication not found' } }); return; }

    const [pub] = await d.update(meridianPublications)
      .set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(meridianPublications.id, id)).returning();
    res.json({ success: true, data: pub });
  });

  // UNPUBLISH
  adminPublications.post('/:id/unpublish', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { id } = req.params;

    const [existing] = await d.select().from(meridianPublications)
      .where(and(eq(meridianPublications.id, id), eq(meridianPublications.tenantId, tenantId))).limit(1);
    if (!existing) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Publication not found' } }); return; }

    const [pub] = await d.update(meridianPublications)
      .set({ status: 'draft', publishedAt: null, updatedAt: new Date() })
      .where(eq(meridianPublications.id, id)).returning();
    res.json({ success: true, data: pub });
  });

  // =========================================================================
  // Admin — Flipbooks
  // =========================================================================

  const adminFlipbooks = Router({ mergeParams: true });

  // CREATE (upload PDF — actual conversion is stubbed)
  adminFlipbooks.post('/', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;

    const parseResult = insertFlipbookSchema.safeParse({ ...req.body, tenantId });
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid flipbook data', details: parseResult.error.errors } });
      return;
    }

    // Verify publication belongs to tenant
    const [pub] = await d.select({ id: meridianPublications.id }).from(meridianPublications)
      .where(and(
        eq(meridianPublications.id, parseResult.data.publicationId),
        eq(meridianPublications.tenantId, tenantId),
      )).limit(1);
    if (!pub) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Publication not found' } }); return; }

    const [flipbook] = await d.insert(meridianFlipbooks).values(parseResult.data).returning();

    // STUB: In production, a background job would:
    // 1. Download PDF from pdfUrl
    // 2. Convert each page to image (pdf.js / puppeteer / ImageMagick)
    // 3. Generate thumbnails
    // 4. Extract text via OCR
    // 5. Insert rows into meridian_pages
    // 6. Update flipbook.pageCount
    //
    // For now, create placeholder pages based on pageCount
    if (flipbook.pageCount > 0) {
      const pageRows = Array.from({ length: flipbook.pageCount }, (_, i) => ({
        flipbookId: flipbook.id,
        pageNumber: i + 1,
        imageUrl: `/api/v1/public/flipbooks/placeholder/pages/${i + 1}`,
        thumbnailUrl: `/api/v1/public/flipbooks/placeholder/pages/${i + 1}?thumb=1`,
        textContent: null,
      }));
      await d.insert(meridianPages).values(pageRows);
    }

    res.status(201).json({ success: true, data: flipbook });
  });

  // GET
  adminFlipbooks.get('/:id', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { id } = req.params;

    const [flipbook] = await d.select().from(meridianFlipbooks)
      .where(and(eq(meridianFlipbooks.id, id), eq(meridianFlipbooks.tenantId, tenantId))).limit(1);
    if (!flipbook) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Flipbook not found' } }); return; }

    const pages = await d.select().from(meridianPages)
      .where(eq(meridianPages.flipbookId, id))
      .orderBy(asc(meridianPages.pageNumber));

    res.json({ success: true, data: { ...flipbook, pages } });
  });

  // UPDATE SETTINGS
  adminFlipbooks.put('/:id/settings', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { id } = req.params;

    const [existing] = await d.select().from(meridianFlipbooks)
      .where(and(eq(meridianFlipbooks.id, id), eq(meridianFlipbooks.tenantId, tenantId))).limit(1);
    if (!existing) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Flipbook not found' } }); return; }

    const parseResult = flipbookSettingsSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid settings', details: parseResult.error.errors } });
      return;
    }

    const mergedSettings = { ...(existing.settings || {}), ...parseResult.data };
    const [flipbook] = await d.update(meridianFlipbooks)
      .set({ settings: mergedSettings })
      .where(eq(meridianFlipbooks.id, id)).returning();
    res.json({ success: true, data: flipbook });
  });

  // DELETE
  adminFlipbooks.delete('/:id', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { id } = req.params;

    const [existing] = await d.select({ id: meridianFlipbooks.id }).from(meridianFlipbooks)
      .where(and(eq(meridianFlipbooks.id, id), eq(meridianFlipbooks.tenantId, tenantId))).limit(1);
    if (!existing) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Flipbook not found' } }); return; }

    await d.delete(meridianFlipbooks).where(eq(meridianFlipbooks.id, id));
    res.json({ success: true, data: { id } });
  });

  // =========================================================================
  // Admin — Reader Analytics
  // =========================================================================

  const adminAnalytics = Router({ mergeParams: true });

  // Aggregated overview
  adminAnalytics.get('/', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;

    // Total sessions, total pages viewed, avg time
    const sessions = await d.select({
      totalSessions: count(),
      totalPagesViewed: sum(meridianReaderSessions.pagesViewed),
      totalTimeSpent: sum(meridianReaderSessions.timeSpent),
    }).from(meridianReaderSessions)
      .where(eq(meridianReaderSessions.tenantId, tenantId));

    // Per-flipbook summary
    const flipbookStats = await d.select({
      flipbookId: meridianReaderSessions.flipbookId,
      sessions: count(),
      pagesViewed: sum(meridianReaderSessions.pagesViewed),
      timeSpent: sum(meridianReaderSessions.timeSpent),
    }).from(meridianReaderSessions)
      .where(eq(meridianReaderSessions.tenantId, tenantId))
      .groupBy(meridianReaderSessions.flipbookId);

    res.json({
      success: true,
      data: {
        overview: sessions[0] || { totalSessions: 0, totalPagesViewed: 0, totalTimeSpent: 0 },
        flipbooks: flipbookStats,
      },
    });
  });

  // Per-flipbook analytics
  adminAnalytics.get('/:flipbookId', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { flipbookId } = req.params;

    // Verify ownership
    const [flipbook] = await d.select({ id: meridianFlipbooks.id }).from(meridianFlipbooks)
      .where(and(eq(meridianFlipbooks.id, flipbookId), eq(meridianFlipbooks.tenantId, tenantId))).limit(1);
    if (!flipbook) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Flipbook not found' } }); return; }

    const sessions = await d.select({
      totalSessions: count(),
      totalPagesViewed: sum(meridianReaderSessions.pagesViewed),
      totalTimeSpent: sum(meridianReaderSessions.timeSpent),
    }).from(meridianReaderSessions)
      .where(eq(meridianReaderSessions.flipbookId, flipbookId));

    // Recent sessions
    const recentSessions = await d.select().from(meridianReaderSessions)
      .where(eq(meridianReaderSessions.flipbookId, flipbookId))
      .orderBy(desc(meridianReaderSessions.startedAt))
      .limit(50);

    res.json({
      success: true,
      data: {
        overview: sessions[0] || { totalSessions: 0, totalPagesViewed: 0, totalTimeSpent: 0 },
        recentSessions,
      },
    });
  });

  // Per-page heatmap data
  adminAnalytics.get('/:flipbookId/pages', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { flipbookId } = req.params;

    const [flipbook] = await d.select({ id: meridianFlipbooks.id }).from(meridianFlipbooks)
      .where(and(eq(meridianFlipbooks.id, flipbookId), eq(meridianFlipbooks.tenantId, tenantId))).limit(1);
    if (!flipbook) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Flipbook not found' } }); return; }

    const pageStats = await d.select().from(meridianPageAnalytics)
      .where(eq(meridianPageAnalytics.flipbookId, flipbookId))
      .orderBy(asc(meridianPageAnalytics.pageNumber));

    res.json({ success: true, data: pageStats });
  });

  // =========================================================================
  // Public — Flipbook Viewer, Embed, Page Images, Analytics Beacon
  // =========================================================================

  const publicFlipbooks = Router({ mergeParams: true });

  // Render flipbook viewer HTML
  publicFlipbooks.get('/:slug', async (req: Request, res: Response) => {
    const { slug } = req.params;

    const [pub] = await d.select().from(meridianPublications)
      .where(and(eq(meridianPublications.slug, slug), eq(meridianPublications.status, 'published'))).limit(1);
    if (!pub) { res.status(404).send('Publication not found'); return; }

    const [flipbook] = await d.select().from(meridianFlipbooks)
      .where(eq(meridianFlipbooks.publicationId, pub.id)).limit(1);
    if (!flipbook) { res.status(404).send('Flipbook not found'); return; }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const html = renderFlipbookViewer({
      slug,
      title: pub.title,
      pageCount: flipbook.pageCount,
      settings: flipbook.settings || {
        pageFlipAnimation: 'flip',
        backgroundColor: '#1a1a2e',
        autoPlay: false,
        autoPlayInterval: 5000,
        shareEnabled: true,
        downloadEnabled: false,
        showToolbar: true,
        showPageCount: true,
      },
      pdfUrl: flipbook.pdfUrl,
      baseUrl,
    });

    res.type('html').send(html);
  });

  // Embeddable iframe version
  publicFlipbooks.get('/:slug/embed', async (req: Request, res: Response) => {
    const { slug } = req.params;

    const [pub] = await d.select().from(meridianPublications)
      .where(and(eq(meridianPublications.slug, slug), eq(meridianPublications.status, 'published'))).limit(1);
    if (!pub) { res.status(404).send('Publication not found'); return; }

    const [flipbook] = await d.select().from(meridianFlipbooks)
      .where(eq(meridianFlipbooks.publicationId, pub.id)).limit(1);
    if (!flipbook) { res.status(404).send('Flipbook not found'); return; }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const html = renderEmbedViewer({
      slug,
      title: pub.title,
      pageCount: flipbook.pageCount,
      settings: { ...(flipbook.settings || {}), showToolbar: true } as any,
      pdfUrl: flipbook.pdfUrl,
      baseUrl,
    });

    // Allow embedding in iframes
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    res.type('html').send(html);
  });

  // Individual page image
  publicFlipbooks.get('/:slug/pages/:num', async (req: Request, res: Response) => {
    const { slug, num } = req.params;
    const pageNum = parseInt(num, 10);
    if (isNaN(pageNum) || pageNum < 1) { res.status(400).json({ error: 'Invalid page number' }); return; }

    const [pub] = await d.select().from(meridianPublications)
      .where(and(eq(meridianPublications.slug, slug), eq(meridianPublications.status, 'published'))).limit(1);
    if (!pub) { res.status(404).json({ error: 'Publication not found' }); return; }

    const [flipbook] = await d.select().from(meridianFlipbooks)
      .where(eq(meridianFlipbooks.publicationId, pub.id)).limit(1);
    if (!flipbook) { res.status(404).json({ error: 'Flipbook not found' }); return; }

    const [page] = await d.select().from(meridianPages)
      .where(and(
        eq(meridianPages.flipbookId, flipbook.id),
        eq(meridianPages.pageNumber, pageNum),
      )).limit(1);

    if (!page) { res.status(404).json({ error: 'Page not found' }); return; }

    // STUB: In production this would redirect to the actual image URL
    // (e.g., a CDN/storage URL). For now, return a placeholder SVG.
    const isThumb = req.query.thumb === '1';
    const w = isThumb ? 200 : 800;
    const h = isThumb ? 280 : 1120;

    res.type('svg').send(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="100%" height="100%" fill="#f5f5f5"/>
  <rect x="2" y="2" width="${w - 4}" height="${h - 4}" fill="none" stroke="#ddd" stroke-width="1"/>
  <text x="50%" y="45%" text-anchor="middle" font-family="sans-serif" font-size="${isThumb ? 16 : 32}" fill="#999">Page ${pageNum}</text>
  <text x="50%" y="55%" text-anchor="middle" font-family="sans-serif" font-size="${isThumb ? 10 : 16}" fill="#bbb">${pub.title}</text>
</svg>`);
  });

  // Analytics beacon
  publicFlipbooks.post('/:slug/analytics', async (req: Request, res: Response) => {
    const { slug } = req.params;

    const parseResult = analyticsBeaconSchema.safeParse(req.body);
    if (!parseResult.success) { res.status(400).json({ error: 'Invalid beacon data' }); return; }

    const { sessionId, pageNumber, timeOnPage, userAgent, referrer } = parseResult.data;

    // Look up publication + flipbook
    const [pub] = await d.select().from(meridianPublications)
      .where(eq(meridianPublications.slug, slug)).limit(1);
    if (!pub) { res.status(204).end(); return; }

    const [flipbook] = await d.select().from(meridianFlipbooks)
      .where(eq(meridianFlipbooks.publicationId, pub.id)).limit(1);
    if (!flipbook) { res.status(204).end(); return; }

    // Upsert reader session
    const [existingSession] = await d.select().from(meridianReaderSessions)
      .where(and(
        eq(meridianReaderSessions.sessionId, sessionId),
        eq(meridianReaderSessions.flipbookId, flipbook.id),
      )).limit(1);

    if (existingSession) {
      await d.update(meridianReaderSessions).set({
        pagesViewed: existingSession.pagesViewed + 1,
        timeSpent: existingSession.timeSpent + Math.round(timeOnPage),
        lastPage: pageNumber,
      }).where(eq(meridianReaderSessions.id, existingSession.id));
    } else {
      await d.insert(meridianReaderSessions).values({
        flipbookId: flipbook.id,
        tenantId: pub.tenantId,
        sessionId,
        pagesViewed: 1,
        timeSpent: Math.round(timeOnPage),
        lastPage: pageNumber,
        userAgent: userAgent || null,
        referrer: referrer || null,
      });
    }

    // Upsert page analytics (Resonance-style aggregation)
    const [existingAnalytic] = await d.select().from(meridianPageAnalytics)
      .where(and(
        eq(meridianPageAnalytics.flipbookId, flipbook.id),
        eq(meridianPageAnalytics.pageNumber, pageNumber),
      )).limit(1);

    if (existingAnalytic) {
      const newViews = existingAnalytic.views + 1;
      const newAvg = ((existingAnalytic.avgTimeSeconds * existingAnalytic.views) + timeOnPage) / newViews;
      const isBounce = timeOnPage < 2; // less than 2 seconds = bounce
      await d.update(meridianPageAnalytics).set({
        views: newViews,
        avgTimeSeconds: Math.round(newAvg * 100) / 100,
        bounceCount: existingAnalytic.bounceCount + (isBounce ? 1 : 0),
      }).where(eq(meridianPageAnalytics.id, existingAnalytic.id));
    } else {
      await d.insert(meridianPageAnalytics).values({
        flipbookId: flipbook.id,
        pageNumber,
        views: 1,
        avgTimeSeconds: Math.round(timeOnPage * 100) / 100,
        bounceCount: timeOnPage < 2 ? 1 : 0,
      });
    }

    res.status(204).end();
  });

  return { adminPublications, adminFlipbooks, adminAnalytics, publicFlipbooks };
}

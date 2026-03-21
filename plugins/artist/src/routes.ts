// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * Artist Plugin — Express route factories
 *
 * Returns admin (CRUD) and public (read-only) routers for
 * releases, events, and artist profiles.
 *
 * Admin routes do NOT apply auth middleware — the API integration
 * layer mounts them behind its own auth stack.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { eq, and, desc, asc, count, gte } from 'drizzle-orm';
import { sites } from '@netrun-cms/db';
import {
  releases,
  events,
  artistProfiles,
  insertReleaseSchema,
  insertEventSchema,
  insertArtistProfileSchema,
} from './schema.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parsePagination(req: Request) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 20), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

import type { Router as RouterType } from 'express';

interface ArtistRoutes {
  adminReleases: RouterType;
  adminEvents: RouterType;
  adminProfile: RouterType;
  publicReleases: RouterType;
  publicEvents: RouterType;
  publicProfile: RouterType;
}

export function createRoutes(db: unknown): ArtistRoutes {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = db as any;

  // =========================================================================
  // Admin — Releases CRUD
  // =========================================================================

  const adminReleases = Router({ mergeParams: true });

  // LIST
  adminReleases.get('/', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { siteId } = req.params;
    const { page, limit, offset } = parsePagination(req);

    const [site] = await d.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const conditions = [eq(releases.siteId, siteId)];
    const [{ value: total }] = await d.select({ value: count() }).from(releases).where(and(...conditions));

    const results = await d.select().from(releases)
      .where(and(...conditions))
      .orderBy(desc(releases.releaseDate), asc(releases.sortOrder))
      .limit(limit).offset(offset);

    res.json({ success: true, data: results, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  });

  // GET
  adminReleases.get('/:id', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { siteId, id } = req.params;

    const [site] = await d.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const [release] = await d.select().from(releases)
      .where(and(eq(releases.id, id), eq(releases.siteId, siteId))).limit(1);
    if (!release) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Release not found' } }); return; }

    res.json({ success: true, data: release });
  });

  // CREATE
  adminReleases.post('/', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { siteId } = req.params;

    const [site] = await d.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const parseResult = insertReleaseSchema.safeParse({ ...req.body, siteId });
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid release data', details: parseResult.error.errors } });
      return;
    }

    const [release] = await d.insert(releases).values(parseResult.data as any).returning();
    res.status(201).json({ success: true, data: release });
  });

  // UPDATE
  adminReleases.put('/:id', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { siteId, id } = req.params;

    const [site] = await d.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const [existing] = await d.select({ id: releases.id }).from(releases)
      .where(and(eq(releases.id, id), eq(releases.siteId, siteId))).limit(1);
    if (!existing) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Release not found' } }); return; }

    const [release] = await d.update(releases).set({ ...req.body, siteId, updatedAt: new Date() })
      .where(eq(releases.id, id)).returning();
    res.json({ success: true, data: release });
  });

  // DELETE
  adminReleases.delete('/:id', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { siteId, id } = req.params;

    const [site] = await d.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const [existing] = await d.select({ id: releases.id }).from(releases)
      .where(and(eq(releases.id, id), eq(releases.siteId, siteId))).limit(1);
    if (!existing) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Release not found' } }); return; }

    await d.delete(releases).where(eq(releases.id, id));
    res.json({ success: true, data: { id } });
  });

  // =========================================================================
  // Admin — Events CRUD
  // =========================================================================

  const adminEvents = Router({ mergeParams: true });

  // LIST
  adminEvents.get('/', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { siteId } = req.params;
    const { page, limit, offset } = parsePagination(req);
    const upcoming = req.query.upcoming === 'true';

    const [site] = await d.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const conditions = [eq(events.siteId, siteId)];
    if (upcoming) { conditions.push(gte(events.eventDate, new Date())); }

    const [{ value: total }] = await d.select({ value: count() }).from(events).where(and(...conditions));

    const results = await d.select().from(events)
      .where(and(...conditions))
      .orderBy(asc(events.eventDate), asc(events.sortOrder))
      .limit(limit).offset(offset);

    res.json({ success: true, data: results, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  });

  // GET
  adminEvents.get('/:id', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { siteId, id } = req.params;

    const [site] = await d.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const [event] = await d.select().from(events)
      .where(and(eq(events.id, id), eq(events.siteId, siteId))).limit(1);
    if (!event) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } }); return; }

    res.json({ success: true, data: event });
  });

  // CREATE
  adminEvents.post('/', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { siteId } = req.params;

    const [site] = await d.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const parseResult = insertEventSchema.safeParse({ ...req.body, siteId });
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid event data', details: parseResult.error.errors } });
      return;
    }

    const [event] = await d.insert(events).values(parseResult.data as any).returning();
    res.status(201).json({ success: true, data: event });
  });

  // UPDATE
  adminEvents.put('/:id', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { siteId, id } = req.params;

    const [site] = await d.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const [existing] = await d.select({ id: events.id }).from(events)
      .where(and(eq(events.id, id), eq(events.siteId, siteId))).limit(1);
    if (!existing) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } }); return; }

    const [event] = await d.update(events).set({ ...req.body, siteId, updatedAt: new Date() })
      .where(eq(events.id, id)).returning();
    res.json({ success: true, data: event });
  });

  // DELETE
  adminEvents.delete('/:id', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { siteId, id } = req.params;

    const [site] = await d.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const [existing] = await d.select({ id: events.id }).from(events)
      .where(and(eq(events.id, id), eq(events.siteId, siteId))).limit(1);
    if (!existing) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } }); return; }

    await d.delete(events).where(eq(events.id, id));
    res.json({ success: true, data: { id } });
  });

  // =========================================================================
  // Admin — Artist Profile (get / upsert / delete)
  // =========================================================================

  const adminProfile = Router({ mergeParams: true });

  // GET
  adminProfile.get('/', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { siteId } = req.params;

    const [site] = await d.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const [profile] = await d.select().from(artistProfiles)
      .where(eq(artistProfiles.siteId, siteId)).limit(1);
    if (!profile) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Artist profile not found' } }); return; }

    res.json({ success: true, data: profile });
  });

  // UPSERT
  adminProfile.put('/', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { siteId } = req.params;

    const [site] = await d.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const parseResult = insertArtistProfileSchema.safeParse({ ...req.body, siteId });
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid profile data', details: parseResult.error.errors } });
      return;
    }

    const [existing] = await d.select({ id: artistProfiles.id }).from(artistProfiles)
      .where(eq(artistProfiles.siteId, siteId)).limit(1);

    let profile: any;
    if (existing) {
      [profile] = await d.update(artistProfiles)
        .set({ ...(parseResult.data as any), updatedAt: new Date() })
        .where(eq(artistProfiles.id, existing.id))
        .returning();
    } else {
      [profile] = await d.insert(artistProfiles)
        .values(parseResult.data as any)
        .returning();
    }

    res.status(existing ? 200 : 201).json({ success: true, data: profile });
  });

  // DELETE
  adminProfile.delete('/', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId!;
    const { siteId } = req.params;

    const [site] = await d.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const [existing] = await d.select({ id: artistProfiles.id }).from(artistProfiles)
      .where(eq(artistProfiles.siteId, siteId)).limit(1);
    if (!existing) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Artist profile not found' } }); return; }

    await d.delete(artistProfiles).where(eq(artistProfiles.id, existing.id));
    res.json({ success: true, data: { id: existing.id } });
  });

  // =========================================================================
  // Public — Releases (read-only, by site slug)
  // =========================================================================

  const publicReleases = Router({ mergeParams: true });

  publicReleases.get('/', async (req: Request, res: Response) => {
    const siteSlug = req.params.siteSlug as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const [site] = await d.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.slug, siteSlug), eq(sites.status, 'published'))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const results = await d.select().from(releases)
      .where(and(eq(releases.siteId, site.id), eq(releases.isPublished, true)))
      .orderBy(desc(releases.releaseDate), asc(releases.sortOrder))
      .limit(limit);

    res.json({ success: true, data: results });
  });

  // =========================================================================
  // Public — Events (read-only, by site slug)
  // =========================================================================

  const publicEvents = Router({ mergeParams: true });

  publicEvents.get('/', async (req: Request, res: Response) => {
    const siteSlug = req.params.siteSlug as string;
    const upcoming = req.query.upcoming === 'true';
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const [site] = await d.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.slug, siteSlug), eq(sites.status, 'published'))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const conditions: any[] = [eq(events.siteId, site.id), eq(events.isPublished, true)];
    if (upcoming) { conditions.push(gte(events.eventDate, new Date())); }

    const results = await d.select().from(events)
      .where(and(...conditions))
      .orderBy(asc(events.eventDate))
      .limit(limit);

    res.json({ success: true, data: results });
  });

  // =========================================================================
  // Public — Artist Profile (read-only, by site slug)
  // =========================================================================

  const publicProfile = Router({ mergeParams: true });

  publicProfile.get('/', async (req: Request, res: Response) => {
    const siteSlug = req.params.siteSlug as string;

    const [site] = await d.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.slug, siteSlug), eq(sites.status, 'published'))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const [profile] = await d.select().from(artistProfiles)
      .where(eq(artistProfiles.siteId, site.id)).limit(1);
    if (!profile) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Artist profile not found' } }); return; }

    res.json({ success: true, data: profile });
  });

  return { adminReleases, adminEvents, adminProfile, publicReleases, publicEvents, publicProfile };
}

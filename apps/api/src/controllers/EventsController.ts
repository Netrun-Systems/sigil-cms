/**
 * Events Controller
 *
 * CRUD operations for artist events (shows, festivals, livestreams)
 */

import type { Response } from 'express';
import { eq, and, desc, asc, count, gte } from 'drizzle-orm';
import { events, sites, insertEventSchema, type Event } from '@netrun-cms/db';
import { getDb } from '../db.js';
import { parsePagination } from '../middleware/validation.js';
import type { AuthenticatedRequest, ApiResponse, PaginatedResponse } from '../types/index.js';

export class EventsController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId } = req.params;
    const { page, limit, offset } = parsePagination(req);
    const upcoming = req.query.upcoming === 'true';

    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!site) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } });
      return;
    }

    const conditions = [eq(events.siteId, siteId)];
    if (upcoming) {
      conditions.push(gte(events.eventDate, new Date()));
    }

    const [{ value: total }] = await db.select({ value: count() }).from(events).where(and(...conditions));

    const results = await db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(asc(events.eventDate), asc(events.sortOrder))
      .limit(limit)
      .offset(offset);

    const response: PaginatedResponse<Event> = {
      success: true,
      data: results,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
    res.json(response);
  }

  static async get(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId, id } = req.params;

    const [site] = await db.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const [event] = await db.select().from(events)
      .where(and(eq(events.id, id), eq(events.siteId, siteId))).limit(1);
    if (!event) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } }); return; }

    res.json({ success: true, data: event } as ApiResponse<Event>);
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId } = req.params;

    const [site] = await db.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const parseResult = insertEventSchema.safeParse({ ...req.body, siteId });
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid event data', details: parseResult.error.errors } });
      return;
    }

    const [event] = await db.insert(events).values(parseResult.data).returning();
    res.status(201).json({ success: true, data: event } as ApiResponse<Event>);
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId, id } = req.params;

    const [site] = await db.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const [existing] = await db.select({ id: events.id }).from(events)
      .where(and(eq(events.id, id), eq(events.siteId, siteId))).limit(1);
    if (!existing) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } }); return; }

    const [event] = await db.update(events).set({ ...req.body, siteId, updatedAt: new Date() })
      .where(eq(events.id, id)).returning();
    res.json({ success: true, data: event } as ApiResponse<Event>);
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId, id } = req.params;

    const [site] = await db.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const [existing] = await db.select({ id: events.id }).from(events)
      .where(and(eq(events.id, id), eq(events.siteId, siteId))).limit(1);
    if (!existing) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } }); return; }

    await db.delete(events).where(eq(events.id, id));
    res.json({ success: true, data: { id } });
  }
}

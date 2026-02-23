/**
 * Releases Controller
 *
 * CRUD operations for artist releases (singles, albums, EPs)
 */

import type { Response } from 'express';
import { eq, and, desc, asc, count } from 'drizzle-orm';
import { releases, sites, insertReleaseSchema, type Release } from '@netrun-cms/db';
import { getDb } from '../db.js';
import { parsePagination } from '../middleware/validation.js';
import type { AuthenticatedRequest, ApiResponse, PaginatedResponse } from '../types/index.js';

export class ReleasesController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId } = req.params;
    const { page, limit, offset } = parsePagination(req);

    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!site) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } });
      return;
    }

    const conditions = [eq(releases.siteId, siteId)];
    const [{ value: total }] = await db.select({ value: count() }).from(releases).where(and(...conditions));

    const results = await db
      .select()
      .from(releases)
      .where(and(...conditions))
      .orderBy(desc(releases.releaseDate), asc(releases.sortOrder))
      .limit(limit)
      .offset(offset);

    const response: PaginatedResponse<Release> = {
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

    const [release] = await db.select().from(releases)
      .where(and(eq(releases.id, id), eq(releases.siteId, siteId))).limit(1);
    if (!release) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Release not found' } }); return; }

    res.json({ success: true, data: release } as ApiResponse<Release>);
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId } = req.params;

    const [site] = await db.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const parseResult = insertReleaseSchema.safeParse({ ...req.body, siteId });
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid release data', details: parseResult.error.errors } });
      return;
    }

    const [release] = await db.insert(releases).values(parseResult.data).returning();
    res.status(201).json({ success: true, data: release } as ApiResponse<Release>);
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId, id } = req.params;

    const [site] = await db.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const [existing] = await db.select({ id: releases.id }).from(releases)
      .where(and(eq(releases.id, id), eq(releases.siteId, siteId))).limit(1);
    if (!existing) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Release not found' } }); return; }

    const [release] = await db.update(releases).set({ ...req.body, siteId, updatedAt: new Date() })
      .where(eq(releases.id, id)).returning();
    res.json({ success: true, data: release } as ApiResponse<Release>);
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId, id } = req.params;

    const [site] = await db.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const [existing] = await db.select({ id: releases.id }).from(releases)
      .where(and(eq(releases.id, id), eq(releases.siteId, siteId))).limit(1);
    if (!existing) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Release not found' } }); return; }

    await db.delete(releases).where(eq(releases.id, id));
    res.json({ success: true, data: { id } });
  }
}

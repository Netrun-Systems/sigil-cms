/**
 * Artist Profiles Controller
 *
 * Single profile per site — get or upsert pattern
 */

import type { Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { artistProfiles, sites, insertArtistProfileSchema, type ArtistProfile } from '@netrun-cms/db';
import { getDb } from '../db.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';

export class ArtistProfilesController {
  static async get(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId } = req.params;

    const [site] = await db.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const [profile] = await db.select().from(artistProfiles)
      .where(eq(artistProfiles.siteId, siteId)).limit(1);

    if (!profile) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Artist profile not found' } });
      return;
    }

    res.json({ success: true, data: profile } as ApiResponse<ArtistProfile>);
  }

  static async upsert(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId } = req.params;

    const [site] = await db.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const parseResult = insertArtistProfileSchema.safeParse({ ...req.body, siteId });
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid profile data', details: parseResult.error.errors } });
      return;
    }

    const [existing] = await db.select({ id: artistProfiles.id }).from(artistProfiles)
      .where(eq(artistProfiles.siteId, siteId)).limit(1);

    let profile: ArtistProfile;
    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [profile] = await db.update(artistProfiles)
        .set({ ...(parseResult.data as any), updatedAt: new Date() })
        .where(eq(artistProfiles.id, existing.id))
        .returning();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [profile] = await db.insert(artistProfiles)
        .values(parseResult.data as any)
        .returning();
    }

    res.status(existing ? 200 : 201).json({ success: true, data: profile } as ApiResponse<ArtistProfile>);
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId } = req.params;

    const [site] = await db.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

    const [existing] = await db.select({ id: artistProfiles.id }).from(artistProfiles)
      .where(eq(artistProfiles.siteId, siteId)).limit(1);
    if (!existing) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Artist profile not found' } }); return; }

    await db.delete(artistProfiles).where(eq(artistProfiles.id, existing.id));
    res.json({ success: true, data: { id: existing.id } });
  }
}

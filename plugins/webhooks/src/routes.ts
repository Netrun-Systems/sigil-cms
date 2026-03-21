// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * Webhook Plugin Routes
 *
 * Admin routes (mounted under /api/v1/sites/:siteId/webhooks):
 *   GET    /endpoints          — list webhook endpoints for site
 *   POST   /endpoints          — create endpoint
 *   PUT    /endpoints/:id      — update endpoint
 *   DELETE /endpoints/:id      — delete endpoint
 *   GET    /deliveries         — list recent deliveries
 *   POST   /endpoints/:id/test — send a test event
 *   POST   /endpoints/:id/retry — retry all failed deliveries
 *
 * Auth note: admin routes are mounted by the API loader under an
 * auth-protected path. The plugin does not apply auth middleware itself.
 */

import { Router, type Request, type Response } from 'express';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { webhookEndpoints, webhookDeliveries } from './schema.js';
import { emit } from './lib/events.js';
import { retryFailedDeliveries } from './lib/delivery.js';
import type { DrizzleClient } from '@netrun-cms/plugin-runtime';

export function createAdminRoutes(db: DrizzleClient): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  // ── GET /endpoints — list webhook endpoints for site ───────────────────────

  router.get('/endpoints', async (req: Request, res: Response) => {
    const { siteId } = req.params;

    const results = await d
      .select()
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.siteId, siteId))
      .orderBy(desc(webhookEndpoints.createdAt));

    res.json({ success: true, data: results });
  });

  // ── POST /endpoints — create webhook endpoint ─────────────────────────────

  router.post('/endpoints', async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const { url, events, secret } = req.body;

    if (!url) {
      res.status(400).json({ success: false, error: { message: 'url is required' } });
      return;
    }

    const result = await d.insert(webhookEndpoints).values({
      siteId,
      url,
      events: events || ['*'],
      secret: secret || null,
    }).returning();

    res.status(201).json({ success: true, data: result[0] });
  });

  // ── PUT /endpoints/:id — update webhook endpoint ──────────────────────────

  router.put('/endpoints/:id', async (req: Request, res: Response) => {
    const { siteId, id } = req.params;
    const { url, events, secret, isActive } = req.body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (url !== undefined) updates.url = url;
    if (events !== undefined) updates.events = events;
    if (secret !== undefined) updates.secret = secret;
    if (isActive !== undefined) updates.isActive = isActive;

    const result = await d.update(webhookEndpoints)
      .set(updates)
      .where(and(eq(webhookEndpoints.id, id), eq(webhookEndpoints.siteId, siteId)))
      .returning();

    if (result.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
      return;
    }

    res.json({ success: true, data: result[0] });
  });

  // ── DELETE /endpoints/:id — delete webhook endpoint ───────────────────────

  router.delete('/endpoints/:id', async (req: Request, res: Response) => {
    const { siteId, id } = req.params;

    const result = await d.delete(webhookEndpoints)
      .where(and(eq(webhookEndpoints.id, id), eq(webhookEndpoints.siteId, siteId)))
      .returning();

    if (result.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
      return;
    }

    res.json({ success: true });
  });

  // ── GET /deliveries — list recent deliveries ──────────────────────────────

  router.get('/deliveries', async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const endpointId = req.query.endpointId as string | undefined;
    const status = req.query.status as string | undefined;
    const eventType = req.query.eventType as string | undefined;

    // First get all endpoint IDs for this site
    const siteEndpoints = await d
      .select({ id: webhookEndpoints.id })
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.siteId, siteId));

    const endpointIds = siteEndpoints.map((e: any) => e.id);
    if (endpointIds.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    // Build conditions
    const conditions: any[] = [];

    if (endpointId) {
      // Verify the endpoint belongs to this site
      if (!endpointIds.includes(endpointId)) {
        res.status(404).json({ success: false, error: { message: 'Endpoint not found for this site' } });
        return;
      }
      conditions.push(eq(webhookDeliveries.endpointId, endpointId));
    }

    if (status) {
      conditions.push(eq(webhookDeliveries.status, status));
    }

    if (eventType) {
      conditions.push(eq(webhookDeliveries.eventType, eventType));
    }

    let query = d.select().from(webhookDeliveries);

    if (!endpointId) {
      // Filter to only deliveries for this site's endpoints
      conditions.push(inArray(webhookDeliveries.endpointId, endpointIds));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(webhookDeliveries.createdAt)).limit(100);

    res.json({ success: true, data: results });
  });

  // ── POST /endpoints/:id/test — send a test event ──────────────────────────

  router.post('/endpoints/:id/test', async (req: Request, res: Response) => {
    const { siteId, id } = req.params;

    // Verify endpoint exists and belongs to this site
    const [endpoint] = await d
      .select()
      .from(webhookEndpoints)
      .where(and(eq(webhookEndpoints.id, id), eq(webhookEndpoints.siteId, siteId)))
      .limit(1);

    if (!endpoint) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
      return;
    }

    // Emit a test event — the event bus will trigger delivery
    emit({
      type: 'webhook.test',
      siteId,
      resourceType: 'webhook',
      resourceId: id,
      data: { test: true, message: 'This is a test webhook delivery' },
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Test event emitted' });
  });

  // ── POST /endpoints/:id/retry — retry all failed deliveries ───────────────

  router.post('/endpoints/:id/retry', async (req: Request, res: Response) => {
    const { siteId, id } = req.params;

    // Verify endpoint exists and belongs to this site
    const [endpoint] = await d
      .select()
      .from(webhookEndpoints)
      .where(and(eq(webhookEndpoints.id, id), eq(webhookEndpoints.siteId, siteId)))
      .limit(1);

    if (!endpoint) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
      return;
    }

    const retried = await retryFailedDeliveries(db, id);

    res.json({ success: true, data: { retriedCount: retried } });
  });

  return router;
}

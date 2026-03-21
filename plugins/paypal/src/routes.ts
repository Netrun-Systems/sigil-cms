// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * PayPal Routes — create order, capture payment, expose client ID
 *
 * Public routes (no auth) — PayPal handles payment authentication
 * via their Smart Payment Buttons SDK.
 */

import { Router, type Request, type Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { sites } from '@netrun-cms/db';
import type { DrizzleClient } from '@netrun-cms/plugin-runtime';
import { paypalOrders } from './schema.js';
import { createOrder as paypalCreateOrder, captureOrder as paypalCaptureOrder } from './lib/paypal.js';

export function createRoutes(db: DrizzleClient): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  /**
   * GET /api/v1/public/paypal/:siteSlug/client-id
   * Returns the PayPal client ID for the frontend JS SDK.
   */
  router.get('/client-id', (_req: Request, res: Response) => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    if (!clientId) {
      res.status(503).json({ success: false, error: { message: 'PayPal not configured' } });
      return;
    }
    res.json({ success: true, data: { clientId } });
  });

  /**
   * POST /api/v1/public/paypal/:siteSlug/create-order
   * Creates a PayPal order and saves it to the database.
   *
   * Body: { items: [{ name, unitPrice, quantity }], currency? }
   * Returns: { orderId }
   */
  router.post('/create-order', async (req: Request, res: Response) => {
    try {
      const siteSlug = req.params.siteSlug as string;
      const { items, currency = 'USD' } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, error: { message: 'items array is required' } });
        return;
      }

      for (const item of items) {
        if (!item.name || typeof item.unitPrice !== 'number' || typeof item.quantity !== 'number') {
          res.status(400).json({
            success: false,
            error: { message: 'Each item must have name (string), unitPrice (number, cents), and quantity (number)' },
          });
          return;
        }
      }

      const [site] = await d.select({ id: sites.id }).from(sites)
        .where(eq(sites.slug, siteSlug)).limit(1);
      if (!site) {
        res.status(404).json({ success: false, error: { message: 'Site not found' } });
        return;
      }

      const paypalOrder = await paypalCreateOrder(items, currency);
      const totalAmount = items.reduce(
        (sum: number, item: { unitPrice: number; quantity: number }) => sum + item.unitPrice * item.quantity,
        0,
      );

      await d.insert(paypalOrders).values({
        siteId: site.id,
        paypalOrderId: paypalOrder.id,
        status: 'created',
        totalAmount,
        currency,
        lineItems: items,
      });

      res.json({ success: true, data: { orderId: paypalOrder.id } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create PayPal order';
      res.status(500).json({ success: false, error: { message } });
    }
  });

  /**
   * POST /api/v1/public/paypal/:siteSlug/capture-order
   * Captures payment after the customer approves via PayPal buttons.
   *
   * Body: { orderId }
   * Returns: { captureId, status, payerEmail }
   */
  router.post('/capture-order', async (req: Request, res: Response) => {
    try {
      const siteSlug = req.params.siteSlug as string;
      const { orderId } = req.body;

      if (!orderId || typeof orderId !== 'string') {
        res.status(400).json({ success: false, error: { message: 'orderId is required' } });
        return;
      }

      const [site] = await d.select({ id: sites.id }).from(sites)
        .where(eq(sites.slug, siteSlug)).limit(1);
      if (!site) {
        res.status(404).json({ success: false, error: { message: 'Site not found' } });
        return;
      }

      const captureResult = await paypalCaptureOrder(orderId);

      await d.update(paypalOrders)
        .set({
          status: 'completed',
          captureId: captureResult.captureId,
          customerEmail: captureResult.payerEmail ?? null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(paypalOrders.paypalOrderId, orderId),
            eq(paypalOrders.siteId, site.id),
          ),
        );

      res.json({
        success: true,
        data: {
          captureId: captureResult.captureId,
          status: captureResult.status,
          payerEmail: captureResult.payerEmail,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to capture PayPal order';
      res.status(500).json({ success: false, error: { message } });
    }
  });

  return router;
}

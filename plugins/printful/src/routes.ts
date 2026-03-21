// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * Printful Merch Plugin Routes
 *
 * Admin routes (mounted under /api/v1/sites/:siteId/merch):
 *   GET    /products      — list merch products from DB for this site
 *   POST   /sync          — fetch products from Printful API, sync to DB
 *   PUT    /products/:id  — update retail price, active status
 *   DELETE /products/:id  — deactivate product
 *
 * Public routes (mounted under /api/v1/public/merch/:siteSlug):
 *   GET    /              — list active merch products for a site
 *   GET    /:id           — get single product with variants
 *
 * Note: Order creation happens via the store plugin's Stripe checkout flow.
 * Printful order fulfillment would be handled by a webhook (future work).
 */

import { Router, type Request, type Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { sites } from '@netrun-cms/db';
import { merchProducts } from './schema.js';
import type { DrizzleClient } from '@netrun-cms/plugin-runtime';

// ── Printful API Client ─────────────────────────────────────────────────────

const PRINTFUL_BASE = 'https://api.printful.com';

async function printfulFetch(path: string) {
  const apiKey = process.env.PRINTFUL_API_KEY;
  if (!apiKey) throw new Error('PRINTFUL_API_KEY is not configured');

  const res = await fetch(`${PRINTFUL_BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Printful API error: ${res.status} ${body}`);
  }

  return res.json();
}

// ── Admin Routes ────────────────────────────────────────────────────────────

export function createAdminRoutes(db: DrizzleClient): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  /** GET /products — list merch products for this site */
  router.get('/products', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const rows = await d
        .select()
        .from(merchProducts)
        .where(eq(merchProducts.siteId, siteId))
        .orderBy(merchProducts.createdAt);

      res.json({ products: rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** POST /sync — fetch products from Printful and upsert into DB */
  router.post('/sync', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;

      // Fetch all sync products from the Printful store
      const { result: syncProducts } = await printfulFetch('/store/products');

      let synced = 0;

      for (const product of syncProducts) {
        // Fetch full product details including variants
        const { result: fullProduct } = await printfulFetch(
          `/store/products/${product.id}`
        );

        const syncProduct = fullProduct.sync_product;
        const syncVariants = fullProduct.sync_variants || [];

        // Build variants array
        const variants = syncVariants.map((v: any) => ({
          size: v.size || null,
          color: v.color || null,
          printfulVariantId: v.id,
          inStock: v.availability_status !== 'unavailable',
          retailPrice: v.retail_price ? Math.round(parseFloat(v.retail_price) * 100) : null,
          printfulPrice: v.product?.price ? Math.round(parseFloat(v.product.price) * 100) : null,
        }));

        // Get thumbnail from the first variant's preview files
        let thumbnailUrl = syncProduct.thumbnail_url || null;
        if (!thumbnailUrl && syncVariants.length > 0 && syncVariants[0].files) {
          const previewFile = syncVariants[0].files.find(
            (f: any) => f.type === 'preview'
          );
          if (previewFile) thumbnailUrl = previewFile.preview_url || previewFile.url;
        }

        // Calculate base retail price from first variant
        const firstVariantPrice = syncVariants[0]?.retail_price
          ? Math.round(parseFloat(syncVariants[0].retail_price) * 100)
          : 0;
        const firstPrintfulPrice = syncVariants[0]?.product?.price
          ? Math.round(parseFloat(syncVariants[0].product.price) * 100)
          : 0;

        // Check if product already exists for this site
        const existing = await d
          .select()
          .from(merchProducts)
          .where(
            and(
              eq(merchProducts.siteId, siteId),
              eq(merchProducts.printfulSyncProductId, syncProduct.id)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Update existing product
          await d
            .update(merchProducts)
            .set({
              name: syncProduct.name,
              thumbnailUrl,
              printfulPrice: firstPrintfulPrice,
              variants,
              updatedAt: new Date(),
            })
            .where(eq(merchProducts.id, existing[0].id));
        } else {
          // Insert new product
          await d.insert(merchProducts).values({
            siteId,
            printfulSyncProductId: syncProduct.id,
            printfulVariantId: syncVariants[0]?.id || null,
            name: syncProduct.name,
            description: null,
            thumbnailUrl,
            retailPrice: firstVariantPrice,
            currency: 'USD',
            printfulPrice: firstPrintfulPrice,
            isActive: true,
            variants,
            metadata: {},
          });
        }

        synced++;
      }

      res.json({ synced, total: syncProducts.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** PUT /products/:id — update retail price, active status, description */
  router.put('/products/:id', async (req: Request, res: Response) => {
    try {
      const { siteId, id } = req.params;
      const { retailPrice, isActive, description } = req.body;

      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (retailPrice !== undefined) updateData.retailPrice = retailPrice;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (description !== undefined) updateData.description = description;

      const result = await d
        .update(merchProducts)
        .set(updateData)
        .where(
          and(
            eq(merchProducts.id, id),
            eq(merchProducts.siteId, siteId)
          )
        )
        .returning();

      if (!result.length) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ product: result[0] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** DELETE /products/:id — deactivate product (soft delete) */
  router.delete('/products/:id', async (req: Request, res: Response) => {
    try {
      const { siteId, id } = req.params;

      const result = await d
        .update(merchProducts)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(merchProducts.id, id),
            eq(merchProducts.siteId, siteId)
          )
        )
        .returning();

      if (!result.length) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ product: result[0] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

// ── Public Routes ───────────────────────────────────────────────────────────

export function createPublicRoutes(db: DrizzleClient): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  /** GET / — list active merch products for a site (resolved by slug) */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { siteSlug } = req.params;

      // Resolve site by slug
      const siteRows = await d
        .select()
        .from(sites)
        .where(eq(sites.slug, siteSlug))
        .limit(1);

      if (!siteRows.length) {
        return res.status(404).json({ error: 'Site not found' });
      }

      const siteId = siteRows[0].id;

      const rows = await d
        .select()
        .from(merchProducts)
        .where(
          and(
            eq(merchProducts.siteId, siteId),
            eq(merchProducts.isActive, true)
          )
        )
        .orderBy(merchProducts.createdAt);

      res.json({ products: rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** GET /:id — get single product with variants */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { siteSlug, id } = req.params;

      // Resolve site by slug
      const siteRows = await d
        .select()
        .from(sites)
        .where(eq(sites.slug, siteSlug))
        .limit(1);

      if (!siteRows.length) {
        return res.status(404).json({ error: 'Site not found' });
      }

      const siteId = siteRows[0].id;

      const rows = await d
        .select()
        .from(merchProducts)
        .where(
          and(
            eq(merchProducts.id, id),
            eq(merchProducts.siteId, siteId),
            eq(merchProducts.isActive, true)
          )
        )
        .limit(1);

      if (!rows.length) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ product: rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

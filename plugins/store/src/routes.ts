// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * Store Routes — product catalog, checkout sessions, order tracking, Stripe webhooks
 */

import { Router, type Request, type Response } from 'express';
import { eq, and, desc, asc } from 'drizzle-orm';
import { sites } from '@netrun-cms/db';
import { createStripeService } from '@netrun/stripe-client';
import { createWebhookHandler } from '@netrun/stripe-client';
import { products, orders } from './schema.js';
import type { PluginLogger } from '@netrun-cms/plugin-runtime';
import type { Router as RouterType } from 'express';

interface StoreRoutes {
  adminRouter: RouterType;
  publicRouter: RouterType;
  webhookRouter: RouterType;
}

export function createRoutes(db: any, logger: PluginLogger): StoreRoutes {
  const adminRouter = Router({ mergeParams: true });
  const publicRouter = Router({ mergeParams: true });
  const webhookRouter = Router({ mergeParams: true });

  const d = db as any;

  const stripe = createStripeService({
    secretKey: process.env.STRIPE_SECRET_KEY!,
    appInfo: { name: 'NetrunCMS-Store', version: '1.0.0' },
  });

  // ---------------------------------------------------------------------------
  // Admin routes — mounted under /api/v1/sites/:siteId/store
  // ---------------------------------------------------------------------------

  /** GET /products — list products for a site */
  adminRouter.get('/products', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const rows = await d.select().from(products)
        .where(eq(products.siteId, siteId))
        .orderBy(asc(products.sortOrder), desc(products.createdAt));
      res.json({ success: true, data: rows });
    } catch (err) {
      logger.error({ err }, 'Failed to list products');
      res.status(500).json({ success: false, error: { message: 'Failed to list products' } });
    }
  });

  /** POST /products — create a product and sync to Stripe */
  adminRouter.post('/products', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { name, description, productType, unitPrice, currency, billingInterval, imageUrl, metadata, sortOrder } = req.body;

      // Insert into cms_products
      const [product] = await d.insert(products).values({
        siteId,
        name,
        description,
        productType: productType ?? 'one_time',
        unitPrice,
        currency: currency ?? 'USD',
        billingInterval,
        imageUrl,
        metadata: metadata ?? {},
        sortOrder: sortOrder ?? 0,
      }).returning();

      // Sync to Stripe
      const client = await stripe.getClient();
      const stripeProduct = await client.products.create({
        name,
        description: description ?? undefined,
        metadata: { cms_product_id: product.id, site_id: siteId },
        ...(imageUrl ? { images: [imageUrl] } : {}),
      });

      const priceParams: any = {
        product: stripeProduct.id,
        unit_amount: unitPrice,
        currency: (currency ?? 'USD').toLowerCase(),
      };
      if (productType === 'recurring' && billingInterval) {
        priceParams.recurring = { interval: billingInterval };
      }
      const stripePrice = await client.prices.create(priceParams);

      // Update with Stripe IDs
      const [updated] = await d.update(products)
        .set({
          stripeProductId: stripeProduct.id,
          stripePriceId: stripePrice.id,
          updatedAt: new Date(),
        })
        .where(eq(products.id, product.id))
        .returning();

      res.status(201).json({ success: true, data: updated });
    } catch (err) {
      logger.error({ err }, 'Failed to create product');
      res.status(500).json({ success: false, error: { message: 'Failed to create product' } });
    }
  });

  /** PUT /products/:id — update a product and sync to Stripe */
  adminRouter.put('/products/:id', async (req: Request, res: Response) => {
    try {
      const { siteId, id } = req.params;
      const { name, description, unitPrice, currency, billingInterval, imageUrl, isActive, metadata, sortOrder } = req.body;

      const updateData: any = { updatedAt: new Date() };
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (unitPrice !== undefined) updateData.unitPrice = unitPrice;
      if (currency !== undefined) updateData.currency = currency;
      if (billingInterval !== undefined) updateData.billingInterval = billingInterval;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (metadata !== undefined) updateData.metadata = metadata;
      if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

      const [updated] = await d.update(products)
        .set(updateData)
        .where(and(eq(products.id, id), eq(products.siteId, siteId)))
        .returning();

      if (!updated) {
        res.status(404).json({ success: false, error: { message: 'Product not found' } });
        return;
      }

      // Sync to Stripe if product exists there
      if (updated.stripeProductId) {
        const client = await stripe.getClient();
        await client.products.update(updated.stripeProductId, {
          name: updated.name,
          description: updated.description ?? undefined,
          ...(updated.imageUrl ? { images: [updated.imageUrl] } : {}),
        });

        // If price changed, create a new price and archive the old one
        if (unitPrice !== undefined && updated.stripePriceId) {
          const priceParams: any = {
            product: updated.stripeProductId,
            unit_amount: updated.unitPrice,
            currency: (updated.currency ?? 'USD').toLowerCase(),
          };
          if (updated.productType === 'recurring' && updated.billingInterval) {
            priceParams.recurring = { interval: updated.billingInterval };
          }
          const newPrice = await client.prices.create(priceParams);
          await client.prices.update(updated.stripePriceId, { active: false });

          await d.update(products)
            .set({ stripePriceId: newPrice.id, updatedAt: new Date() })
            .where(eq(products.id, id));

          updated.stripePriceId = newPrice.id;
        }
      }

      res.json({ success: true, data: updated });
    } catch (err) {
      logger.error({ err }, 'Failed to update product');
      res.status(500).json({ success: false, error: { message: 'Failed to update product' } });
    }
  });

  /** DELETE /products/:id — deactivate product and archive in Stripe */
  adminRouter.delete('/products/:id', async (req: Request, res: Response) => {
    try {
      const { siteId, id } = req.params;

      const [product] = await d.update(products)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(products.id, id), eq(products.siteId, siteId)))
        .returning();

      if (!product) {
        res.status(404).json({ success: false, error: { message: 'Product not found' } });
        return;
      }

      // Archive in Stripe
      if (product.stripeProductId) {
        const client = await stripe.getClient();
        await client.products.update(product.stripeProductId, { active: false });
      }

      res.json({ success: true, data: product });
    } catch (err) {
      logger.error({ err }, 'Failed to deactivate product');
      res.status(500).json({ success: false, error: { message: 'Failed to deactivate product' } });
    }
  });

  /** GET /orders — list orders for a site */
  adminRouter.get('/orders', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const rows = await d.select().from(orders)
        .where(eq(orders.siteId, siteId))
        .orderBy(desc(orders.createdAt));
      res.json({ success: true, data: rows });
    } catch (err) {
      logger.error({ err }, 'Failed to list orders');
      res.status(500).json({ success: false, error: { message: 'Failed to list orders' } });
    }
  });

  /** POST /products/:id/sync — force re-sync a single product to Stripe */
  adminRouter.post('/products/:id/sync', async (req: Request, res: Response) => {
    try {
      const { siteId, id } = req.params;

      const [product] = await d.select().from(products)
        .where(and(eq(products.id, id), eq(products.siteId, siteId)))
        .limit(1);

      if (!product) {
        res.status(404).json({ success: false, error: { message: 'Product not found' } });
        return;
      }

      const client = await stripe.getClient();

      if (product.stripeProductId) {
        // Update existing Stripe product
        await client.products.update(product.stripeProductId, {
          name: product.name,
          description: product.description ?? undefined,
          metadata: { cms_product_id: product.id, site_id: siteId },
          ...(product.imageUrl ? { images: [product.imageUrl] } : {}),
        });
      } else {
        // Create new Stripe product + price
        const stripeProduct = await client.products.create({
          name: product.name,
          description: product.description ?? undefined,
          metadata: { cms_product_id: product.id, site_id: siteId },
          ...(product.imageUrl ? { images: [product.imageUrl] } : {}),
        });

        const priceParams: any = {
          product: stripeProduct.id,
          unit_amount: product.unitPrice,
          currency: (product.currency ?? 'USD').toLowerCase(),
        };
        if (product.productType === 'recurring' && product.billingInterval) {
          priceParams.recurring = { interval: product.billingInterval };
        }
        const stripePrice = await client.prices.create(priceParams);

        await d.update(products)
          .set({
            stripeProductId: stripeProduct.id,
            stripePriceId: stripePrice.id,
            updatedAt: new Date(),
          })
          .where(eq(products.id, product.id));

        product.stripeProductId = stripeProduct.id;
        product.stripePriceId = stripePrice.id;
      }

      res.json({ success: true, data: product });
    } catch (err) {
      logger.error({ err }, 'Failed to sync product to Stripe');
      res.status(500).json({ success: false, error: { message: 'Failed to sync product' } });
    }
  });

  // ---------------------------------------------------------------------------
  // Public routes — mounted under /api/v1/public/store/:siteSlug
  // ---------------------------------------------------------------------------

  /** GET / — list active products for a site (by slug) */
  publicRouter.get('/', async (req: Request, res: Response) => {
    try {
      const { siteSlug } = req.params;

      const [site] = await d.select({ id: sites.id }).from(sites)
        .where(eq(sites.slug, siteSlug)).limit(1);
      if (!site) {
        res.status(404).json({ success: false, error: { message: 'Site not found' } });
        return;
      }

      const rows = await d.select().from(products)
        .where(and(eq(products.siteId, site.id), eq(products.isActive, true)))
        .orderBy(asc(products.sortOrder), desc(products.createdAt));

      res.json({ success: true, data: rows });
    } catch (err) {
      logger.error({ err }, 'Failed to list public products');
      res.status(500).json({ success: false, error: { message: 'Failed to list products' } });
    }
  });

  /** POST /checkout — create a Stripe Checkout Session for selected products */
  publicRouter.post('/checkout', async (req: Request, res: Response) => {
    try {
      const { siteSlug } = req.params;
      const { items, successUrl, cancelUrl } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, error: { message: 'items array is required' } });
        return;
      }
      if (!successUrl || !cancelUrl) {
        res.status(400).json({ success: false, error: { message: 'successUrl and cancelUrl are required' } });
        return;
      }

      const [site] = await d.select({ id: sites.id }).from(sites)
        .where(eq(sites.slug, siteSlug)).limit(1);
      if (!site) {
        res.status(404).json({ success: false, error: { message: 'Site not found' } });
        return;
      }

      // Look up products and build line_items
      const lineItems: Array<{ price: string; quantity: number }> = [];
      let hasRecurring = false;

      for (const item of items) {
        const [product] = await d.select().from(products)
          .where(and(
            eq(products.id, item.productId),
            eq(products.siteId, site.id),
            eq(products.isActive, true),
          ))
          .limit(1);

        if (!product || !product.stripePriceId) {
          res.status(400).json({
            success: false,
            error: { message: `Product ${item.productId} not found or not synced to Stripe` },
          });
          return;
        }

        if (product.productType === 'recurring') hasRecurring = true;

        lineItems.push({
          price: product.stripePriceId,
          quantity: item.quantity ?? 1,
        });
      }

      const client = await stripe.getClient();
      const session = await client.checkout.sessions.create({
        mode: hasRecurring ? 'subscription' : 'payment',
        line_items: lineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { site_id: site.id },
      });

      res.json({ success: true, data: { url: session.url, sessionId: session.id } });
    } catch (err) {
      logger.error({ err }, 'Failed to create checkout session');
      res.status(500).json({ success: false, error: { message: 'Failed to create checkout session' } });
    }
  });

  // ---------------------------------------------------------------------------
  // Webhook routes — mounted under /api/v1/store/webhook
  // ---------------------------------------------------------------------------

  const { handler: webhookHandler, rawBodyMiddleware } = createWebhookHandler({
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    handlers: {
      'checkout.session.completed': async (session) => {
        const siteId = session.metadata?.site_id;
        if (!siteId) {
          logger.warn({}, 'checkout.session.completed missing site_id in metadata');
          return;
        }

        // Retrieve line items from Stripe for the order record
        const client = await stripe.getClient();
        const lineItemsResponse = await client.checkout.sessions.listLineItems(session.id);
        const items = lineItemsResponse.data.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          amount: li.amount_total,
          currency: li.currency,
          priceId: li.price?.id,
        }));

        await d.insert(orders).values({
          siteId,
          stripeSessionId: session.id,
          stripePaymentIntentId: typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
          customerEmail: session.customer_details?.email ?? null,
          customerName: session.customer_details?.name ?? null,
          status: 'completed',
          totalAmount: session.amount_total ?? 0,
          currency: (session.currency ?? 'usd').toUpperCase(),
          lineItems: items,
          metadata: session.metadata ?? {},
        });

        logger.info({ sessionId: session.id, siteId }, 'Order created from checkout.session.completed');
      },

      'charge.refunded': async (charge) => {
        const paymentIntentId = typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent?.id;

        if (!paymentIntentId) {
          logger.warn({}, 'charge.refunded missing payment_intent');
          return;
        }

        await d.update(orders)
          .set({ status: 'refunded', updatedAt: new Date() })
          .where(eq(orders.stripePaymentIntentId, paymentIntentId));

        logger.info({ paymentIntentId }, 'Order marked refunded from charge.refunded');
      },
    },
    logger: (level, message, meta) => {
      if (level === 'error') {
        logger.error(meta ?? {}, message);
      } else {
        logger.info(meta ?? {}, message);
      }
    },
  });

  webhookRouter.post('/', rawBodyMiddleware, webhookHandler);

  return { adminRouter, publicRouter, webhookRouter };
}

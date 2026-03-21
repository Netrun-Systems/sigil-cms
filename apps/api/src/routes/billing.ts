/**
 * Billing Routes
 *
 * Stripe subscription management, checkout sessions, portal access,
 * webhook handling, and usage reporting.
 */

import { Router } from 'express';
import type { Router as RouterType, Response } from 'express';
import express from 'express';
import { eq, and, count, sum } from 'drizzle-orm';
import { createStripeService } from '@netrun/stripe-client';
import { createWebhookHandler } from '@netrun/stripe-client';
import {
  PLANS,
  getPlanLimits,
  getStripePriceEnvKey,
  type PlanName,
} from '@netrun-cms/core';
import {
  tenants,
  subscriptions,
  sites,
  pages,
  media,
} from '@netrun-cms/db';
import { getDb } from '../db.js';
import { authenticate, requireRole, tenantContext } from '../middleware/index.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';

const router: RouterType = Router();

// Lazy Stripe service — only initialized when billing routes are hit
let stripeService: ReturnType<typeof createStripeService> | null = null;

function getStripe() {
  if (!stripeService) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required for billing');
    }
    stripeService = createStripeService({
      secretKey,
      appInfo: { name: 'Sigil CMS', version: '1.0.0' },
    });
  }
  return stripeService;
}

/**
 * Resolve the Stripe price ID for a plan+interval.
 * Reads from env: STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_STARTER_YEARLY, etc.
 */
function getStripePriceId(plan: string, interval: 'monthly' | 'yearly'): string | null {
  const envKey = getStripePriceEnvKey(plan, interval);
  return process.env[envKey] || null;
}

// ============================================================================
// WEBHOOK (raw body — must be mounted BEFORE json body parser)
// ============================================================================

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

const { handler: webhookHandler, rawBodyMiddleware } = createWebhookHandler({
  webhookSecret,
  handlers: {
    'checkout.session.completed': async (session: any) => {
      const db = getDb();
      const tenantId = session.metadata?.tenantId;
      const plan = session.metadata?.plan as string;
      const interval = session.metadata?.interval as string;

      if (!tenantId || !plan) return;

      const stripeCustomerId = session.customer as string;
      const stripeSubscriptionId = session.subscription as string;

      // Upsert subscription record
      const [existing] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.tenantId, tenantId))
        .limit(1);

      if (existing) {
        await db
          .update(subscriptions)
          .set({
            stripeCustomerId,
            stripeSubscriptionId,
            plan,
            billingInterval: interval || 'monthly',
            status: 'active',
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.tenantId, tenantId));
      } else {
        await db
          .insert(subscriptions)
          .values({
            tenantId,
            stripeCustomerId,
            stripeSubscriptionId,
            plan,
            billingInterval: interval || 'monthly',
            status: 'active',
          } as any);
      }

      // Update tenant plan
      await db
        .update(tenants)
        .set({ plan, updatedAt: new Date() })
        .where(eq(tenants.id, tenantId));
    },

    'customer.subscription.updated': async (subscription: any) => {
      const db = getDb();
      const subId = subscription.id as string;

      const [existing] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, subId))
        .limit(1);

      if (!existing) return;

      await db
        .update(subscriptions)
        .set({
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
          currentPeriodStart: subscription.current_period_start
            ? new Date(subscription.current_period_start * 1000)
            : null,
          currentPeriodEnd: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : null,
          trialEnd: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, subId));
    },

    'customer.subscription.deleted': async (subscription: any) => {
      const db = getDb();
      const subId = subscription.id as string;

      const [existing] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, subId))
        .limit(1);

      if (!existing) return;

      // Downgrade to free
      await db
        .update(subscriptions)
        .set({
          plan: 'free',
          status: 'canceled',
          stripeSubscriptionId: null,
          cancelAtPeriodEnd: false,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, subId));

      await db
        .update(tenants)
        .set({ plan: 'free', updatedAt: new Date() })
        .where(eq(tenants.id, existing.tenantId));
    },

    'invoice.payment_failed': async (invoice: any) => {
      const db = getDb();
      const subId = invoice.subscription as string;
      if (!subId) return;

      await db
        .update(subscriptions)
        .set({ status: 'past_due', updatedAt: new Date() })
        .where(eq(subscriptions.stripeSubscriptionId, subId));
    },
  },
});

// Webhook endpoint — no auth, no JSON parsing (needs raw body)
router.post('/webhook', rawBodyMiddleware, webhookHandler);

// ============================================================================
// AUTHENTICATED ROUTES
// ============================================================================

router.use(authenticate);
router.use(tenantContext);

/**
 * POST /api/v1/billing/checkout
 * Create a Stripe Checkout session for upgrading plans.
 *
 * Body: { plan: 'starter'|'pro'|'business', interval: 'monthly'|'yearly' }
 */
router.post('/checkout', requireRole('admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { plan, interval = 'monthly' } = req.body as { plan?: string; interval?: 'monthly' | 'yearly' };
  const tenantId = req.tenantId!;
  const userEmail = req.user!.email;

  if (!plan || !['starter', 'pro', 'business'].includes(plan)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid plan. Choose starter, pro, or business.' },
    });
    return;
  }

  if (!['monthly', 'yearly'].includes(interval)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid interval. Choose monthly or yearly.' },
    });
    return;
  }

  const priceId = getStripePriceId(plan, interval);
  if (!priceId) {
    res.status(500).json({
      success: false,
      error: { code: 'CONFIG_ERROR', message: `Stripe price ID not configured for ${plan}/${interval}` },
    });
    return;
  }

  const stripe = getStripe();
  const db = getDb();

  // Get or create Stripe customer
  let stripeCustomerId: string | undefined;

  const [existingSub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId))
    .limit(1);

  if (existingSub?.stripeCustomerId) {
    stripeCustomerId = existingSub.stripeCustomerId;
  } else {
    const customer = await stripe.getOrCreateCustomer({
      email: userEmail,
      metadata: { tenantId },
    });
    stripeCustomerId = customer.id;

    // Store customer ID early
    if (existingSub) {
      await db
        .update(subscriptions)
        .set({ stripeCustomerId, updatedAt: new Date() })
        .where(eq(subscriptions.tenantId, tenantId));
    } else {
      await db
        .insert(subscriptions)
        .values({
          tenantId,
          stripeCustomerId,
          plan: 'free',
          status: 'active',
        } as any);
    }
  }

  const baseUrl = process.env.APP_URL || 'http://localhost:5173';

  const session = await stripe.createCheckoutSession({
    customerId: stripeCustomerId,
    priceId,
    mode: 'subscription',
    successUrl: `${baseUrl}/billing?success=true`,
    cancelUrl: `${baseUrl}/billing?canceled=true`,
    metadata: {
      tenantId,
      plan,
      interval,
    },
  });

  res.json({ success: true, data: { url: session.url } });
});

/**
 * GET /api/v1/billing/subscription
 * Get current subscription status and plan details.
 */
router.get('/subscription', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const tenantId = req.tenantId!;
  const db = getDb();

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId))
    .limit(1);

  const planDef = PLANS[tenant?.plan as PlanName] || PLANS.free;

  res.json({
    success: true,
    data: {
      plan: tenant?.plan || 'free',
      planDetails: {
        displayName: planDef.displayName,
        monthlyPrice: planDef.monthlyPrice,
        yearlyPrice: planDef.yearlyPrice,
      },
      subscription: sub
        ? {
            status: sub.status,
            billingInterval: sub.billingInterval,
            currentPeriodStart: sub.currentPeriodStart,
            currentPeriodEnd: sub.currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            trialEnd: sub.trialEnd,
          }
        : null,
    },
  });
});

/**
 * POST /api/v1/billing/portal
 * Create a Stripe Billing Portal session for managing subscription.
 */
router.post('/portal', requireRole('admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const tenantId = req.tenantId!;
  const db = getDb();

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId))
    .limit(1);

  if (!sub?.stripeCustomerId) {
    res.status(400).json({
      success: false,
      error: { code: 'NO_SUBSCRIPTION', message: 'No billing account found. Start a subscription first.' },
    });
    return;
  }

  const stripe = getStripe();
  const baseUrl = process.env.APP_URL || 'http://localhost:5173';

  const url = await stripe.createPortalSession(sub.stripeCustomerId, `${baseUrl}/billing`);

  res.json({ success: true, data: { url } });
});

/**
 * GET /api/v1/billing/usage
 * Get current resource usage vs plan limits.
 */
router.get('/usage', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const tenantId = req.tenantId!;
  const db = getDb();

  const [tenant] = await db
    .select({ plan: tenants.plan })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  const plan = tenant?.plan || 'free';
  const limits = getPlanLimits(plan);

  // Count sites
  const [{ value: siteCount }] = await db
    .select({ value: count() })
    .from(sites)
    .where(eq(sites.tenantId, tenantId));

  // Get site IDs for this tenant
  const tenantSites = await db
    .select({ id: sites.id })
    .from(sites)
    .where(eq(sites.tenantId, tenantId));

  const siteIds = tenantSites.map(s => s.id);

  // Count pages across all sites
  let pageCount = 0;
  let maxPagesInSite = 0;
  for (const siteId of siteIds) {
    const [{ value: sitePagesCount }] = await db
      .select({ value: count() })
      .from(pages)
      .where(eq(pages.siteId, siteId));
    pageCount += sitePagesCount;
    maxPagesInSite = Math.max(maxPagesInSite, sitePagesCount);
  }

  // Sum storage across all sites
  let totalBytes = 0;
  let mediaCount = 0;
  for (const siteId of siteIds) {
    const [sizeResult] = await db
      .select({ total: sum(media.fileSize) })
      .from(media)
      .where(eq(media.siteId, siteId));
    totalBytes += Number(sizeResult?.total || 0);

    const [{ value: fileCount }] = await db
      .select({ value: count() })
      .from(media)
      .where(eq(media.siteId, siteId));
    mediaCount += fileCount;
  }

  const storageMb = Math.round((totalBytes / (1024 * 1024)) * 100) / 100;

  res.json({
    success: true,
    data: {
      plan,
      sites: {
        used: siteCount,
        limit: limits.maxSites,
      },
      pagesPerSite: {
        used: maxPagesInSite,
        limit: limits.maxPagesPerSite,
        totalPages: pageCount,
      },
      storage: {
        usedMb: storageMb,
        limitMb: limits.maxStorageMb,
      },
      mediaFiles: {
        used: mediaCount,
        limit: limits.maxMediaFiles,
      },
      features: {
        customDomain: limits.customDomain,
        removeBranding: limits.removeBranding,
        apiAccess: limits.apiAccess,
        webhooks: limits.webhooks,
        prioritySupport: limits.prioritySupport,
      },
    },
  });
});

export default router;

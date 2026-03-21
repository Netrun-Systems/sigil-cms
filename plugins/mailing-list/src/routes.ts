// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * Mailing List Routes
 *
 * Provides three routers:
 *   - adminRouter:      authenticated site-scoped CRUD + broadcast
 *   - subscribeRouter:  public subscribe endpoint
 *   - unsubscribeRouter: public one-click unsubscribe (GET + POST per RFC 8058)
 */

import { Router, type Request, type Response } from 'express';
import { eq, and, count, sql } from 'drizzle-orm';
import { sites } from '@netrun-cms/db';
import type { DrizzleClient } from '@netrun-cms/plugin-runtime';
import { subscribers } from './schema.js';

const SENDER_ADDRESS = process.env.ACS_SENDER_ADDRESS || 'charlotte@netrunsystems.com';

interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string };
}

// ── Admin Routes (authenticated, site-scoped) ──────────────────────────────

export function createAdminRoutes(db: DrizzleClient): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  /** GET /api/v1/sites/:siteId/subscribers */
  router.get('/', async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const status = req.query.status as string | undefined;

    const conditions = [eq(subscribers.siteId, siteId)];
    if (status) conditions.push(eq(subscribers.status, status));

    const results = await d
      .select()
      .from(subscribers)
      .where(and(...conditions))
      .orderBy(subscribers.subscribedAt);

    res.json({ success: true, data: results });
  });

  /** GET /api/v1/sites/:siteId/subscribers/stats */
  router.get('/stats', async (req: Request, res: Response) => {
    const { siteId } = req.params;

    const results = await d
      .select({ status: subscribers.status, count: count() })
      .from(subscribers)
      .where(eq(subscribers.siteId, siteId))
      .groupBy(subscribers.status);

    const stats: Record<string, number> = { active: 0, unsubscribed: 0 };
    for (const row of results) stats[row.status] = row.count;

    res.json({ success: true, data: stats });
  });

  /** POST /api/v1/sites/:siteId/subscribers/broadcast */
  router.post('/broadcast', async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const { subject, body } = req.body;

    if (!subject || !body) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'subject and body are required' } });
      return;
    }

    // Get site domain for unsubscribe URLs
    const [site] = await d.select({ domain: sites.domain, name: sites.name }).from(sites).where(eq(sites.id, siteId)).limit(1);
    const siteUrl = site?.domain ? `https://${site.domain}` : process.env.SITE_URL || 'https://localhost:3000';

    const active = await d
      .select({ email: subscribers.email, name: subscribers.name, token: subscribers.unsubscribeToken })
      .from(subscribers)
      .where(and(eq(subscribers.siteId, siteId), eq(subscribers.status, 'active')));

    if (active.length === 0) {
      res.json({ success: true, data: { sent: 0, failed: 0, errors: ['No active subscribers'] } });
      return;
    }

    const connStr = process.env.ACS_CONNECTION_STRING || process.env.AZURE_ACS_CONNECTION_STRING;
    if (!connStr) {
      res.json({ success: true, data: { sent: 0, failed: 0, errors: ['ACS_CONNECTION_STRING not configured'] } });
      return;
    }

    const { EmailClient } = await import('@azure/communication-email');
    const client = EmailClient.fromConnectionString(connStr);

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const sub of active) {
      const unsubUrl = `${siteUrl}/api/v1/public/unsubscribe/${sub.token}`;
      const greeting = sub.name || 'there';

      try {
        const poller = await client.beginSend({
          senderAddress: SENDER_ADDRESS,
          recipients: { to: [{ address: sub.email, displayName: sub.name || undefined }] },
          content: {
            subject,
            plainText: `Hey ${greeting},\n\n${body}\n\n---\nYou're receiving this because you subscribed at ${site?.name || 'our site'}.\nUnsubscribe: ${unsubUrl}`,
          },
          headers: {
            'List-Unsubscribe': `<${unsubUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        });

        const result = await poller.result();
        if (result.status === 'Succeeded') sent++;
        else { failed++; errors.push(`${sub.email}: ${result.status}`); }
      } catch (err) {
        failed++;
        errors.push(`${sub.email}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    res.json({ success: true, data: { sent, failed, errors } });
  });

  /** DELETE /api/v1/sites/:siteId/subscribers/:id */
  router.delete('/:id', async (req: Request, res: Response) => {
    const { siteId, id } = req.params;

    await d.delete(subscribers).where(and(eq(subscribers.id, id), eq(subscribers.siteId, siteId)));
    res.json({ success: true });
  });

  return router;
}

// ── Public Subscribe Route ─────────────────────────────────────────────────

export function createSubscribeRoutes(db: DrizzleClient): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  /** POST /api/v1/public/subscribe/:siteSlug */
  router.post('/', async (req: Request, res: Response) => {
    const { siteSlug } = req.params;
    const { email, name } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ success: false, error: { message: 'Valid email is required' } });
      return;
    }

    const [site] = await d.select({ id: sites.id }).from(sites).where(eq(sites.slug, siteSlug)).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

    const normalized = email.toLowerCase().trim();
    const existing = await d.select().from(subscribers)
      .where(and(eq(subscribers.siteId, site.id), eq(subscribers.email, normalized))).limit(1);

    if (existing.length > 0) {
      if (existing[0].status === 'active') {
        res.json({ success: true, message: 'Already subscribed' });
        return;
      }
      await d.update(subscribers)
        .set({ status: 'active', name: name || existing[0].name, unsubscribedAt: null, unsubscribeToken: sql`gen_random_uuid()` })
        .where(eq(subscribers.id, existing[0].id));
      res.json({ success: true, message: 'Re-subscribed successfully' });
      return;
    }

    await d.insert(subscribers).values({ siteId: site.id, email: normalized, name: name || null });
    res.json({ success: true, message: 'Subscribed successfully' });
  });

  return router;
}

// ── Public Unsubscribe Route ───────────────────────────────────────────────

export function createUnsubscribeRoutes(db: DrizzleClient): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  async function handleUnsubscribe(req: Request, res: Response): Promise<void> {
    const { token } = req.params;

    const result = await d.update(subscribers)
      .set({ status: 'unsubscribed', unsubscribedAt: new Date() })
      .where(and(eq(subscribers.unsubscribeToken, token), eq(subscribers.status, 'active')))
      .returning({ email: subscribers.email });

    const success = result.length > 0;
    const message = success ? `${result[0].email} has been unsubscribed` : 'Invalid or already unsubscribed';

    res.status(200).send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${success ? 'Unsubscribed' : 'Already Unsubscribed'}</title><style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#e5e5e5}.card{text-align:center;padding:3rem;max-width:400px}h1{font-size:1.5rem;margin-bottom:1rem}p{color:#a3a3a3}</style></head><body><div class="card"><h1>${success ? 'Unsubscribed' : 'Already Unsubscribed'}</h1><p>${message}</p></div></body></html>`);
  }

  /** GET /api/v1/public/unsubscribe/:token — browser click */
  router.get('/', handleUnsubscribe);

  /** POST /api/v1/public/unsubscribe/:token — RFC 8058 List-Unsubscribe-Post */
  router.post('/', handleUnsubscribe);

  return router;
}

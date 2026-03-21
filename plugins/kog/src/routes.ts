// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * KOG CRM Plugin Routes
 *
 * Public routes (mounted under /api/v1/public/kog/:siteSlug):
 *   POST /lead  — lead capture form submission
 *
 * Admin routes (mounted under /api/v1/sites/:siteId/kog):
 *   GET    /contacts/search?q=term       — search KOG contacts (proxy)
 *   GET    /contacts/:id/activities      — activity feed for a contact
 *   POST   /contacts/:id/activity        — create activity on a contact
 *   GET    /config                       — connection status
 *   PUT    /config                       — save KOG API URL + credentials
 */

import { Router, type Request, type Response } from 'express';
import { eq } from 'drizzle-orm';
import { sites } from '@netrun-cms/db';
import type { DrizzleClient } from '@netrun-cms/plugin-runtime';
import {
  createContact,
  createOrganization,
  createActivity,
  searchContacts,
  getContactActivities,
  checkConnection,
} from './lib/kog-client.js';

// ── Public Routes ────────────────────────────────────────────────────────────

export function createPublicRoutes(db: DrizzleClient): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  /** POST /lead — public lead capture */
  router.post('/lead', async (req: Request, res: Response) => {
    const { siteSlug } = req.params;
    const { name, email, phone, company, message, source } = req.body;

    if (!name || !email) {
      res.status(400).json({
        success: false,
        error: { message: 'name and email are required' },
      });
      return;
    }

    // Verify site exists
    const [site] = await d
      .select({ id: sites.id, name: sites.name })
      .from(sites)
      .where(eq(sites.slug, siteSlug))
      .limit(1);

    if (!site) {
      res.status(404).json({
        success: false,
        error: { message: 'Site not found' },
      });
      return;
    }

    try {
      // Split name into first/last
      const nameParts = name.trim().split(/\s+/);
      const first_name = nameParts[0];
      const last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      // Create organization if company provided
      if (company) {
        try {
          await createOrganization({ name: company });
        } catch {
          // Organization may already exist — non-fatal
        }
      }

      // Create contact in KOG
      const contact = await createContact({
        first_name,
        last_name,
        email,
        phone: phone || undefined,
        source: source || 'sigil-cms',
        notes: message
          ? `Lead from ${site.name}: ${message}`
          : `Lead from ${site.name}`,
      });

      // Log activity
      await createActivity(contact.id, {
        type: 'note',
        subject: 'Website Lead Capture',
        notes: [
          `Source: ${source || 'sigil-cms'}`,
          `Site: ${site.name}`,
          company ? `Company: ${company}` : null,
          message ? `Message: ${message}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
      });

      res.json({ success: true, message: 'Thank you' });
    } catch (err) {
      console.error('[kog] lead capture error:', err);
      res.status(502).json({
        success: false,
        error: { message: 'Failed to submit lead — please try again' },
      });
    }
  });

  return router;
}

// ── Admin Routes ─────────────────────────────────────────────────────────────

export function createAdminRoutes(_db: DrizzleClient): Router {
  const router = Router({ mergeParams: true });

  /** GET /contacts/search?q=term — proxy search to KOG */
  router.get('/contacts/search', async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) {
      res.status(400).json({
        success: false,
        error: { message: 'q query parameter is required' },
      });
      return;
    }

    try {
      const contacts = await searchContacts(q);
      res.json({ success: true, data: contacts });
    } catch (err) {
      console.error('[kog] search error:', err);
      res.status(502).json({
        success: false,
        error: { message: 'Failed to search KOG contacts' },
      });
    }
  });

  /** GET /contacts/:id/activities — activity feed */
  router.get(
    '/contacts/:id/activities',
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      try {
        const activities = await getContactActivities(id, limit);
        res.json({ success: true, data: activities });
      } catch (err) {
        console.error('[kog] activities error:', err);
        res.status(502).json({
          success: false,
          error: { message: 'Failed to fetch activities' },
        });
      }
    },
  );

  /** POST /contacts/:id/activity — create activity */
  router.post(
    '/contacts/:id/activity',
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const { type, subject, notes } = req.body;

      if (!type || !subject) {
        res.status(400).json({
          success: false,
          error: { message: 'type and subject are required' },
        });
        return;
      }

      try {
        const activity = await createActivity(id, { type, subject, notes });
        res.json({ success: true, data: activity });
      } catch (err) {
        console.error('[kog] create activity error:', err);
        res.status(502).json({
          success: false,
          error: { message: 'Failed to create activity' },
        });
      }
    },
  );

  /** GET /config — connection status */
  router.get('/config', async (_req: Request, res: Response) => {
    const status = await checkConnection();
    res.json({
      success: true,
      data: {
        ...status,
        hasCredentials: !!(
          process.env.KOG_SERVICE_USER && process.env.KOG_SERVICE_PASS
        ),
      },
    });
  });

  /** PUT /config — save KOG API URL + credentials (runtime env update) */
  router.put('/config', async (req: Request, res: Response) => {
    const { apiUrl, serviceUser, servicePass } = req.body;

    if (apiUrl) process.env.KOG_API_URL = apiUrl;
    if (serviceUser) process.env.KOG_SERVICE_USER = serviceUser;
    if (servicePass) process.env.KOG_SERVICE_PASS = servicePass;

    const status = await checkConnection();
    res.json({
      success: true,
      message: 'Configuration updated',
      data: status,
    });
  });

  return router;
}

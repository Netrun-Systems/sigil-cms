// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * Intirkast Broadcasting Routes
 *
 * Public routes: podcast episodes, live status, schedule, newsletter signup
 * Admin routes: connection config, A/B variant performance
 */

import { Router, type Request, type Response } from 'express';
import type { PluginLogger } from '@netrun-cms/plugin-runtime';
import {
  getPodcastEpisodes,
  getLiveStatus,
  getBroadcastSchedule,
  getContentVariants,
  subscribeNewsletter,
  intirkastRequest,
} from './lib/intirkast-client.js';

interface IntirkastRoutes {
  adminRouter: Router;
  publicRouter: Router;
}

// In-memory config store (persisted per process lifetime; admin can update)
let intirkastConfig = {
  apiUrl: process.env.INTIRKAST_API_URL || 'http://localhost:8000',
  apiKey: process.env.INTIRKAST_API_KEY || '',
};

export function createRoutes(db: any, logger: PluginLogger): IntirkastRoutes {
  const adminRouter = Router({ mergeParams: true });
  const publicRouter = Router({ mergeParams: true });

  // ===========================================================================
  // Public routes — mounted under /api/v1/public/intirkast/:siteSlug
  // ===========================================================================

  /**
   * GET /podcast/:podcastId/episodes — list recent podcast episodes
   * Query: ?limit=20
   */
  publicRouter.get(
    '/podcast/:podcastId/episodes',
    async (req: Request, res: Response) => {
      try {
        const { podcastId } = req.params;
        const limit = Math.min(Number(req.query.limit) || 20, 100);
        const episodes = await getPodcastEpisodes(podcastId, limit);
        res.json({ ok: true, episodes });
      } catch (err: any) {
        logger.error('Failed to fetch podcast episodes', { error: err.message });
        res.status(502).json({ ok: false, error: 'Failed to fetch episodes from Intirkast' });
      }
    },
  );

  /**
   * GET /live/status — current live stream status
   * Query: ?sessionId=<optional>
   */
  publicRouter.get('/live/status', async (req: Request, res: Response) => {
    try {
      const sessionId = req.query.sessionId as string | undefined;
      const session = await getLiveStatus(sessionId);
      res.json({ ok: true, session });
    } catch (err: any) {
      logger.error('Failed to fetch live status', { error: err.message });
      res.status(502).json({ ok: false, error: 'Failed to fetch live status from Intirkast' });
    }
  });

  /**
   * GET /schedule — upcoming broadcast schedule
   * Query: ?limit=10
   */
  publicRouter.get('/schedule', async (req: Request, res: Response) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      const schedule = await getBroadcastSchedule(limit);
      res.json({ ok: true, schedule });
    } catch (err: any) {
      logger.error('Failed to fetch broadcast schedule', { error: err.message });
      res.status(502).json({ ok: false, error: 'Failed to fetch schedule from Intirkast' });
    }
  });

  /**
   * POST /newsletter/subscribe — newsletter signup
   * Body: { email: string, name?: string }
   */
  publicRouter.post(
    '/newsletter/subscribe',
    async (req: Request, res: Response) => {
      try {
        const { email, name } = req.body || {};

        if (!email || typeof email !== 'string') {
          return res.status(400).json({ ok: false, error: 'Email is required' });
        }

        const result = await subscribeNewsletter(email, name);
        res.json({ ok: true, ...result });
      } catch (err: any) {
        logger.error('Newsletter subscription failed', { error: err.message });
        res.status(502).json({ ok: false, error: 'Newsletter subscription failed' });
      }
    },
  );

  // ===========================================================================
  // Admin routes — mounted under /api/v1/sites/:siteId/intirkast
  // ===========================================================================

  /**
   * GET /config — Intirkast connection status
   */
  adminRouter.get('/config', async (_req: Request, res: Response) => {
    try {
      // Ping Intirkast to check connectivity
      let connected = false;
      try {
        await intirkastRequest('/api/health');
        connected = true;
      } catch {
        connected = false;
      }

      res.json({
        ok: true,
        config: {
          apiUrl: intirkastConfig.apiUrl,
          hasApiKey: !!intirkastConfig.apiKey,
          connected,
        },
      });
    } catch (err: any) {
      logger.error('Failed to fetch Intirkast config', { error: err.message });
      res.status(500).json({ ok: false, error: 'Failed to fetch config' });
    }
  });

  /**
   * PUT /config — save Intirkast API URL and key
   * Body: { apiUrl?: string, apiKey?: string }
   */
  adminRouter.put('/config', async (req: Request, res: Response) => {
    try {
      const { apiUrl, apiKey } = req.body || {};

      if (apiUrl && typeof apiUrl === 'string') {
        intirkastConfig.apiUrl = apiUrl;
        process.env.INTIRKAST_API_URL = apiUrl;
      }
      if (apiKey && typeof apiKey === 'string') {
        intirkastConfig.apiKey = apiKey;
        process.env.INTIRKAST_API_KEY = apiKey;
      }

      logger.info('Intirkast config updated', { apiUrl: intirkastConfig.apiUrl });
      res.json({ ok: true, config: { apiUrl: intirkastConfig.apiUrl, hasApiKey: !!intirkastConfig.apiKey } });
    } catch (err: any) {
      logger.error('Failed to update Intirkast config', { error: err.message });
      res.status(500).json({ ok: false, error: 'Failed to update config' });
    }
  });

  /**
   * GET /variants/:contentId — A/B variant performance data
   */
  adminRouter.get(
    '/variants/:contentId',
    async (req: Request, res: Response) => {
      try {
        const { contentId } = req.params;
        const variants = await getContentVariants(contentId);
        res.json({ ok: true, variants });
      } catch (err: any) {
        logger.error('Failed to fetch content variants', { error: err.message });
        res.status(502).json({ ok: false, error: 'Failed to fetch variants from Intirkast' });
      }
    },
  );

  return { adminRouter, publicRouter };
}

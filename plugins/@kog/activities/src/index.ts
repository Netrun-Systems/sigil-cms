/**
 * @kog/activities — Activities plugin (calls, meetings, notes, tasks)
 *
 * Phase 1: Proxies activity routes to KOG's existing FastAPI backend.
 * Registers admin nav for Activities and Dashboard views.
 */

import type { Router, Request, Response } from 'express';

interface PlatformPluginContext {
  getConfig(key: string): string | undefined;
  addAdminNav(item: {
    label: string;
    icon: string;
    path: string;
    order: number;
    category?: string;
  }): void;
  addRoutes(cb: (router: Router) => void): void;
}

interface PlatformPlugin {
  id: string;
  name: string;
  version: string;
  register(ctx: PlatformPluginContext): void | Promise<void>;
}

async function proxyToKog(
  kogBaseUrl: string,
  path: string,
  req: Request,
  res: Response,
): Promise<void> {
  const url = `${kogBaseUrl}/api/v1${path}`;
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    const fetchOpts: RequestInit = {
      method: req.method,
      headers,
    };
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOpts.body = JSON.stringify(req.body);
    }

    const upstream = await fetch(url, fetchOpts);
    const body = await upstream.text();

    res.status(upstream.status);
    const ct = upstream.headers.get('content-type');
    if (ct) res.setHeader('content-type', ct);
    res.send(body);
  } catch (err) {
    res.status(502).json({
      error: 'KOG backend unreachable',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}

export const kogActivitiesPlugin: PlatformPlugin = {
  id: 'kog-activities',
  name: 'Activities',
  version: '1.0.0',

  register(ctx) {
    const kogBaseUrl = ctx.getConfig('KOG_API_URL') || 'http://localhost:8000';

    // -- Admin navigation --
    ctx.addAdminNav({
      label: 'Dashboard',
      icon: 'layout-dashboard',
      path: '/',
      order: 1,
      category: 'Overview',
    });
    ctx.addAdminNav({
      label: 'Activities',
      icon: 'activity',
      path: '/activities',
      order: 30,
      category: 'CRM',
    });

    // -- API routes (proxy to KOG backend) --
    ctx.addRoutes((router: Router) => {
      // Activities CRUD
      router.get('/activities', (req, res) =>
        proxyToKog(kogBaseUrl, '/activities', req, res));
      router.get('/activities/:id', (req, res) =>
        proxyToKog(kogBaseUrl, `/activities/${req.params.id}`, req, res));
      router.post('/activities', (req, res) =>
        proxyToKog(kogBaseUrl, '/activities', req, res));
      router.put('/activities/:id', (req, res) =>
        proxyToKog(kogBaseUrl, `/activities/${req.params.id}`, req, res));
      router.delete('/activities/:id', (req, res) =>
        proxyToKog(kogBaseUrl, `/activities/${req.params.id}`, req, res));
    });
  },
};

export default kogActivitiesPlugin;

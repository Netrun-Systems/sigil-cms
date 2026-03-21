/**
 * @kog/pipeline — Pipeline / Opportunities plugin
 *
 * Phase 1: Proxies deal/opportunity routes to KOG's existing FastAPI backend.
 * Registers admin nav for Pipeline and Analytics views.
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

export const kogPipelinePlugin: PlatformPlugin = {
  id: 'kog-pipeline',
  name: 'Pipeline & Opportunities',
  version: '1.0.0',

  register(ctx) {
    const kogBaseUrl = ctx.getConfig('KOG_API_URL') || 'http://localhost:8000';

    // -- Admin navigation --
    ctx.addAdminNav({
      label: 'Pipeline',
      icon: 'kanban',
      path: '/pipeline',
      order: 20,
      category: 'Sales',
    });
    ctx.addAdminNav({
      label: 'Analytics',
      icon: 'bar-chart',
      path: '/analytics',
      order: 21,
      category: 'Sales',
    });

    // -- API routes (proxy to KOG backend) --
    ctx.addRoutes((router: Router) => {
      // Opportunities / Deals CRUD
      router.get('/opportunities', (req, res) =>
        proxyToKog(kogBaseUrl, '/opportunities', req, res));
      router.get('/opportunities/:id', (req, res) =>
        proxyToKog(kogBaseUrl, `/opportunities/${req.params.id}`, req, res));
      router.post('/opportunities', (req, res) =>
        proxyToKog(kogBaseUrl, '/opportunities', req, res));
      router.put('/opportunities/:id', (req, res) =>
        proxyToKog(kogBaseUrl, `/opportunities/${req.params.id}`, req, res));
      router.delete('/opportunities/:id', (req, res) =>
        proxyToKog(kogBaseUrl, `/opportunities/${req.params.id}`, req, res));

      // Stage updates (drag-and-drop kanban)
      router.patch('/opportunities/:id/stage', (req, res) =>
        proxyToKog(kogBaseUrl, `/opportunities/${req.params.id}/stage`, req, res));

      // Analytics endpoint
      router.get('/analytics/dashboard', (req, res) =>
        proxyToKog(kogBaseUrl, '/analytics/dashboard', req, res));
    });
  },
};

export default kogPipelinePlugin;

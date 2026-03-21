/**
 * @intirfix/core — Integration Framework Core plugin
 *
 * Phase 1: Proxies connection management, webhook, and dashboard routes
 * to the Intirfix Express backend. Registers admin nav for the
 * integration hub UI.
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

/**
 * Proxy helper: forwards a request to the Intirfix backend.
 * In Phase 1 all integration logic lives in Intirfix's Express app;
 * this plugin acts as a pass-through that adds auth headers.
 */
async function proxyToIntirfix(
  baseUrl: string,
  path: string,
  req: Request,
  res: Response,
): Promise<void> {
  const url = `${baseUrl}/api/v1${path}`;
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
      error: 'Intirfix backend unreachable',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}

export const intirfixCorePlugin: PlatformPlugin = {
  id: 'intirfix-core',
  name: 'Integration Hub',
  version: '1.0.0',

  register(ctx) {
    const baseUrl = ctx.getConfig('INTIRFIX_API_URL') || 'http://localhost:3100';

    // -- Admin navigation --
    ctx.addAdminNav({
      label: 'Integrations',
      icon: 'plug',
      path: '/integrations',
      order: 1,
      category: 'Integrations',
    });
    ctx.addAdminNav({
      label: 'Connections',
      icon: 'link',
      path: '/connections',
      order: 2,
      category: 'Integrations',
    });
    ctx.addAdminNav({
      label: 'Webhooks',
      icon: 'webhook',
      path: '/webhooks',
      order: 3,
      category: 'Integrations',
    });

    // -- API routes (proxy to Intirfix backend) --
    ctx.addRoutes((router: Router) => {
      // Dashboard / overview
      router.get('/integrations/dashboard', (req, res) =>
        proxyToIntirfix(baseUrl, '/dashboard', req, res));

      // Connections CRUD
      router.get('/connections', (req, res) =>
        proxyToIntirfix(baseUrl, '/connections', req, res));
      router.get('/connections/:id', (req, res) =>
        proxyToIntirfix(baseUrl, `/connections/${req.params.id}`, req, res));
      router.post('/connections', (req, res) =>
        proxyToIntirfix(baseUrl, '/connections', req, res));
      router.put('/connections/:id', (req, res) =>
        proxyToIntirfix(baseUrl, `/connections/${req.params.id}`, req, res));
      router.delete('/connections/:id', (req, res) =>
        proxyToIntirfix(baseUrl, `/connections/${req.params.id}`, req, res));

      // Connection actions (connect/disconnect/test)
      router.post('/connections/:platform/connect', (req, res) =>
        proxyToIntirfix(baseUrl, `/connectors/${req.params.platform}/connect`, req, res));
      router.post('/connections/:platform/disconnect', (req, res) =>
        proxyToIntirfix(baseUrl, `/connectors/${req.params.platform}/disconnect`, req, res));
      router.post('/connections/:platform/test', (req, res) =>
        proxyToIntirfix(baseUrl, `/connectors/${req.params.platform}/test`, req, res));
      router.get('/connections/:platform/status', (req, res) =>
        proxyToIntirfix(baseUrl, `/connectors/${req.params.platform}/status`, req, res));

      // Sync management
      router.get('/sync/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/sync/status', req, res));
      router.post('/sync/:platform/trigger', (req, res) =>
        proxyToIntirfix(baseUrl, `/sync/${req.params.platform}/trigger`, req, res));

      // Webhooks management
      router.get('/webhooks', (req, res) =>
        proxyToIntirfix(baseUrl, '/webhooks', req, res));
      router.get('/webhooks/:id', (req, res) =>
        proxyToIntirfix(baseUrl, `/webhooks/${req.params.id}`, req, res));
      router.post('/webhooks', (req, res) =>
        proxyToIntirfix(baseUrl, '/webhooks', req, res));
      router.delete('/webhooks/:id', (req, res) =>
        proxyToIntirfix(baseUrl, `/webhooks/${req.params.id}`, req, res));

      // Webhook receiver (inbound from platforms)
      router.post('/webhooks/receive/:platform', (req, res) =>
        proxyToIntirfix(baseUrl, `/webhooks/receive/${req.params.platform}`, req, res));
    });
  },
};

export { proxyToIntirfix };
export default intirfixCorePlugin;

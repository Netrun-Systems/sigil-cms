/**
 * @intirfix/accounting — Accounting Platform Adapters plugin
 *
 * Phase 1: Proxies QuickBooks, Xero, FreshBooks, and Wave routes to
 * the Intirfix Express backend. Registers admin nav for accounting.
 *
 * Intirfix connectors: CONNECTOR_QUICKBOOKS_v1.0.ts, CONNECTOR_XERO_v1.0.ts,
 * CONNECTOR_FRESHBOOKS_v1.0.ts, CONNECTOR_WAVE_v1.0.ts
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

export const intirfixAccountingPlugin: PlatformPlugin = {
  id: 'intirfix-accounting',
  name: 'Accounting Integrations',
  version: '1.0.0',

  register(ctx) {
    const baseUrl = ctx.getConfig('INTIRFIX_API_URL') || 'http://localhost:3100';

    // -- Admin navigation --
    ctx.addAdminNav({
      label: 'Accounting',
      icon: 'calculator',
      path: '/accounting',
      order: 20,
      category: 'Integrations',
    });

    // -- API routes (proxy to Intirfix backend) --
    ctx.addRoutes((router: Router) => {
      // QuickBooks routes
      router.get('/accounting/quickbooks/invoices', (req, res) =>
        proxyToIntirfix(baseUrl, '/quickbooks/invoices', req, res));
      router.get('/accounting/quickbooks/accounts', (req, res) =>
        proxyToIntirfix(baseUrl, '/quickbooks/accounts', req, res));
      router.post('/accounting/quickbooks/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/quickbooks/connect', req, res));
      router.get('/accounting/quickbooks/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/quickbooks/status', req, res));
      router.post('/accounting/quickbooks/sync', (req, res) =>
        proxyToIntirfix(baseUrl, '/quickbooks/sync', req, res));
      router.post('/accounting/quickbooks/webhook', (req, res) =>
        proxyToIntirfix(baseUrl, '/quickbooks/webhook', req, res));

      // Xero routes
      router.get('/accounting/xero/invoices', (req, res) =>
        proxyToIntirfix(baseUrl, '/xero/invoices', req, res));
      router.get('/accounting/xero/accounts', (req, res) =>
        proxyToIntirfix(baseUrl, '/xero/accounts', req, res));
      router.post('/accounting/xero/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/xero/connect', req, res));
      router.get('/accounting/xero/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/xero/status', req, res));
      router.post('/accounting/xero/sync', (req, res) =>
        proxyToIntirfix(baseUrl, '/xero/sync', req, res));

      // FreshBooks routes
      router.get('/accounting/freshbooks/invoices', (req, res) =>
        proxyToIntirfix(baseUrl, '/freshbooks/invoices', req, res));
      router.post('/accounting/freshbooks/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/freshbooks/connect', req, res));
      router.get('/accounting/freshbooks/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/freshbooks/status', req, res));
      router.post('/accounting/freshbooks/sync', (req, res) =>
        proxyToIntirfix(baseUrl, '/freshbooks/sync', req, res));

      // Wave routes
      router.get('/accounting/wave/invoices', (req, res) =>
        proxyToIntirfix(baseUrl, '/wave/invoices', req, res));
      router.post('/accounting/wave/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/wave/connect', req, res));
      router.get('/accounting/wave/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/wave/status', req, res));

      // GL mapping (cross-platform chart of accounts)
      router.get('/accounting/gl-mapping', (req, res) =>
        proxyToIntirfix(baseUrl, '/accounting/gl-mapping', req, res));
      router.put('/accounting/gl-mapping', (req, res) =>
        proxyToIntirfix(baseUrl, '/accounting/gl-mapping', req, res));
    });
  },
};

export default intirfixAccountingPlugin;

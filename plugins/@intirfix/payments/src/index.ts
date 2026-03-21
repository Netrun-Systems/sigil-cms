/**
 * @intirfix/payments — Payment Platform Adapters plugin
 *
 * Phase 1: Proxies Stripe, Square, PayPal, and Clover routes to the
 * Intirfix Express backend. Registers admin nav for payment management.
 *
 * Intirfix connectors: CONNECTOR_STRIPE_v1.0.ts, CONNECTOR_SQUARE_v1.0.ts,
 * CONNECTOR_PAYPAL_v1.0.ts, CONNECTOR_CLOVER_v1.0.ts, CONNECTOR_PLAID_v1.0.ts
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

export const intirfixPaymentsPlugin: PlatformPlugin = {
  id: 'intirfix-payments',
  name: 'Payment Integrations',
  version: '1.0.0',

  register(ctx) {
    const baseUrl = ctx.getConfig('INTIRFIX_API_URL') || 'http://localhost:3100';

    // -- Admin navigation --
    ctx.addAdminNav({
      label: 'Payments',
      icon: 'credit-card',
      path: '/payments',
      order: 10,
      category: 'Integrations',
    });
    ctx.addAdminNav({
      label: 'Transactions',
      icon: 'receipt',
      path: '/transactions',
      order: 11,
      category: 'Integrations',
    });
    ctx.addAdminNav({
      label: 'Reconciliation',
      icon: 'scale',
      path: '/reconciliation',
      order: 12,
      category: 'Integrations',
    });

    // -- API routes (proxy to Intirfix backend) --
    ctx.addRoutes((router: Router) => {
      // Stripe routes
      router.get('/payments/stripe/transactions', (req, res) =>
        proxyToIntirfix(baseUrl, '/stripe/transactions', req, res));
      router.post('/payments/stripe/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/stripe/connect', req, res));
      router.get('/payments/stripe/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/stripe/status', req, res));
      router.post('/payments/stripe/webhook', (req, res) =>
        proxyToIntirfix(baseUrl, '/stripe/webhook', req, res));

      // Square routes
      router.get('/payments/square/transactions', (req, res) =>
        proxyToIntirfix(baseUrl, '/square/transactions', req, res));
      router.post('/payments/square/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/square/connect', req, res));
      router.get('/payments/square/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/square/status', req, res));
      router.get('/payments/square/locations', (req, res) =>
        proxyToIntirfix(baseUrl, '/square/locations', req, res));

      // PayPal routes
      router.get('/payments/paypal/transactions', (req, res) =>
        proxyToIntirfix(baseUrl, '/paypal/transactions', req, res));
      router.post('/payments/paypal/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/paypal/connect', req, res));
      router.get('/payments/paypal/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/paypal/status', req, res));

      // Clover routes
      router.get('/payments/clover/transactions', (req, res) =>
        proxyToIntirfix(baseUrl, '/clover/transactions', req, res));
      router.post('/payments/clover/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/clover/connect', req, res));
      router.get('/payments/clover/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/clover/status', req, res));

      // Plaid (banking/financial data)
      router.post('/payments/plaid/link', (req, res) =>
        proxyToIntirfix(baseUrl, '/plaid/link', req, res));
      router.post('/payments/plaid/exchange', (req, res) =>
        proxyToIntirfix(baseUrl, '/plaid/exchange', req, res));
      router.get('/payments/plaid/accounts', (req, res) =>
        proxyToIntirfix(baseUrl, '/plaid/accounts', req, res));
      router.get('/payments/plaid/transactions', (req, res) =>
        proxyToIntirfix(baseUrl, '/plaid/transactions', req, res));

      // Transactions aggregate
      router.get('/transactions', (req, res) =>
        proxyToIntirfix(baseUrl, '/transactions', req, res));
      router.get('/transactions/:id', (req, res) =>
        proxyToIntirfix(baseUrl, `/transactions/${req.params.id}`, req, res));

      // Reconciliation
      router.get('/reconciliation', (req, res) =>
        proxyToIntirfix(baseUrl, '/reconciliation', req, res));
      router.post('/reconciliation/run', (req, res) =>
        proxyToIntirfix(baseUrl, '/reconciliation/run', req, res));
      router.get('/reconciliation/:id', (req, res) =>
        proxyToIntirfix(baseUrl, `/reconciliation/${req.params.id}`, req, res));
    });
  },
};

export default intirfixPaymentsPlugin;

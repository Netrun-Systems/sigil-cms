/**
 * @intirfix/marketing — Marketing Platform Adapters plugin
 *
 * Phase 1: Proxies Mailchimp, SendGrid, Constant Contact, Google Analytics,
 * Mixpanel, and advertising platform routes to the Intirfix Express backend.
 *
 * Intirfix connectors: CONNECTOR_MAILCHIMP_v1.0.ts, plus route files for
 * Google Analytics, Google Ads, Meta Ads, Microsoft Ads, Constant Contact, Mixpanel
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

export const intirfixMarketingPlugin: PlatformPlugin = {
  id: 'intirfix-marketing',
  name: 'Marketing Integrations',
  version: '1.0.0',

  register(ctx) {
    const baseUrl = ctx.getConfig('INTIRFIX_API_URL') || 'http://localhost:3100';

    // -- Admin navigation --
    ctx.addAdminNav({
      label: 'Marketing',
      icon: 'megaphone',
      path: '/marketing',
      order: 40,
      category: 'Integrations',
    });

    // -- API routes (proxy to Intirfix backend) --
    ctx.addRoutes((router: Router) => {
      // Mailchimp routes
      router.get('/marketing/mailchimp/lists', (req, res) =>
        proxyToIntirfix(baseUrl, '/mailchimp/lists', req, res));
      router.get('/marketing/mailchimp/campaigns', (req, res) =>
        proxyToIntirfix(baseUrl, '/mailchimp/campaigns', req, res));
      router.post('/marketing/mailchimp/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/mailchimp/connect', req, res));
      router.get('/marketing/mailchimp/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/mailchimp/status', req, res));
      router.post('/marketing/mailchimp/sync', (req, res) =>
        proxyToIntirfix(baseUrl, '/mailchimp/sync', req, res));

      // SendGrid routes
      router.get('/marketing/sendgrid/campaigns', (req, res) =>
        proxyToIntirfix(baseUrl, '/sendgrid/campaigns', req, res));
      router.post('/marketing/sendgrid/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/sendgrid/connect', req, res));
      router.get('/marketing/sendgrid/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/sendgrid/status', req, res));

      // Constant Contact routes
      router.get('/marketing/constant-contact/lists', (req, res) =>
        proxyToIntirfix(baseUrl, '/constant-contact/lists', req, res));
      router.post('/marketing/constant-contact/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/constant-contact/connect', req, res));
      router.get('/marketing/constant-contact/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/constant-contact/status', req, res));

      // Google Analytics routes
      router.get('/marketing/google-analytics/reports', (req, res) =>
        proxyToIntirfix(baseUrl, '/google-analytics/reports', req, res));
      router.post('/marketing/google-analytics/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/google-analytics/connect', req, res));
      router.get('/marketing/google-analytics/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/google-analytics/status', req, res));

      // Mixpanel routes
      router.get('/marketing/mixpanel/events', (req, res) =>
        proxyToIntirfix(baseUrl, '/mixpanel/events', req, res));
      router.post('/marketing/mixpanel/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/mixpanel/connect', req, res));
      router.get('/marketing/mixpanel/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/mixpanel/status', req, res));

      // Advertising platforms
      router.get('/marketing/google-ads/campaigns', (req, res) =>
        proxyToIntirfix(baseUrl, '/google-ads/campaigns', req, res));
      router.post('/marketing/google-ads/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/google-ads/connect', req, res));
      router.get('/marketing/meta-ads/campaigns', (req, res) =>
        proxyToIntirfix(baseUrl, '/meta-ads/campaigns', req, res));
      router.post('/marketing/meta-ads/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/meta-ads/connect', req, res));
      router.get('/marketing/microsoft-ads/campaigns', (req, res) =>
        proxyToIntirfix(baseUrl, '/microsoft-ads/campaigns', req, res));
      router.post('/marketing/microsoft-ads/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/microsoft-ads/connect', req, res));
    });
  },
};

export default intirfixMarketingPlugin;

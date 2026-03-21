/**
 * @intirfix/crm-sync — CRM Platform Adapters plugin
 *
 * Phase 1: Proxies HubSpot, Salesforce, Zoho, and Pipedrive routes
 * to the Intirfix Express backend. Syncs contact/deal data with
 * the KOG CRM plugin when both are active.
 *
 * Intirfix connectors: CONNECTOR_HUBSPOT_v1.0.ts, CONNECTOR_SALESFORCE_v1.0.ts,
 * CONNECTOR_ZOHO_v1.0.ts
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

export const intirfixCrmSyncPlugin: PlatformPlugin = {
  id: 'intirfix-crm-sync',
  name: 'CRM Sync',
  version: '1.0.0',

  register(ctx) {
    const baseUrl = ctx.getConfig('INTIRFIX_API_URL') || 'http://localhost:3100';

    // -- Admin navigation --
    ctx.addAdminNav({
      label: 'CRM Sync',
      icon: 'refresh-cw',
      path: '/crm-sync',
      order: 30,
      category: 'Integrations',
    });

    // -- API routes (proxy to Intirfix backend) --
    ctx.addRoutes((router: Router) => {
      // HubSpot routes
      router.get('/crm-sync/hubspot/contacts', (req, res) =>
        proxyToIntirfix(baseUrl, '/hubspot/contacts', req, res));
      router.get('/crm-sync/hubspot/deals', (req, res) =>
        proxyToIntirfix(baseUrl, '/hubspot/deals', req, res));
      router.post('/crm-sync/hubspot/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/hubspot/connect', req, res));
      router.get('/crm-sync/hubspot/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/hubspot/status', req, res));
      router.post('/crm-sync/hubspot/sync', (req, res) =>
        proxyToIntirfix(baseUrl, '/hubspot/sync', req, res));
      router.post('/crm-sync/hubspot/webhook', (req, res) =>
        proxyToIntirfix(baseUrl, '/hubspot/webhook', req, res));

      // Salesforce routes
      router.get('/crm-sync/salesforce/contacts', (req, res) =>
        proxyToIntirfix(baseUrl, '/salesforce/contacts', req, res));
      router.get('/crm-sync/salesforce/opportunities', (req, res) =>
        proxyToIntirfix(baseUrl, '/salesforce/opportunities', req, res));
      router.post('/crm-sync/salesforce/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/salesforce/connect', req, res));
      router.get('/crm-sync/salesforce/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/salesforce/status', req, res));
      router.post('/crm-sync/salesforce/sync', (req, res) =>
        proxyToIntirfix(baseUrl, '/salesforce/sync', req, res));

      // Zoho CRM routes
      router.get('/crm-sync/zoho/contacts', (req, res) =>
        proxyToIntirfix(baseUrl, '/zoho/contacts', req, res));
      router.get('/crm-sync/zoho/deals', (req, res) =>
        proxyToIntirfix(baseUrl, '/zoho/deals', req, res));
      router.post('/crm-sync/zoho/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/zoho/connect', req, res));
      router.get('/crm-sync/zoho/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/zoho/status', req, res));
      router.post('/crm-sync/zoho/sync', (req, res) =>
        proxyToIntirfix(baseUrl, '/zoho/sync', req, res));

      // Pipedrive routes
      router.get('/crm-sync/pipedrive/contacts', (req, res) =>
        proxyToIntirfix(baseUrl, '/pipedrive/contacts', req, res));
      router.get('/crm-sync/pipedrive/deals', (req, res) =>
        proxyToIntirfix(baseUrl, '/pipedrive/deals', req, res));
      router.post('/crm-sync/pipedrive/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/pipedrive/connect', req, res));
      router.get('/crm-sync/pipedrive/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/pipedrive/status', req, res));
      router.post('/crm-sync/pipedrive/sync', (req, res) =>
        proxyToIntirfix(baseUrl, '/pipedrive/sync', req, res));

      // Cross-platform sync control
      router.get('/crm-sync/mapping', (req, res) =>
        proxyToIntirfix(baseUrl, '/crm-sync/mapping', req, res));
      router.put('/crm-sync/mapping', (req, res) =>
        proxyToIntirfix(baseUrl, '/crm-sync/mapping', req, res));
      router.post('/crm-sync/sync-all', (req, res) =>
        proxyToIntirfix(baseUrl, '/crm-sync/sync-all', req, res));
    });
  },
};

export default intirfixCrmSyncPlugin;

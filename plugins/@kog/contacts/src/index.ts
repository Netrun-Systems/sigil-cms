/**
 * @kog/contacts — Contacts & Organizations plugin
 *
 * Phase 1: Proxies CRUD routes to KOG's existing FastAPI backend.
 * Registers admin nav items for Contacts and Organizations.
 */

import type { Router, Request, Response } from 'express';

/**
 * PlatformPlugin interface — matches @netrun/platform-runtime contract.
 * Defined inline to avoid circular dependency during parallel builds.
 */
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
 * Proxy helper: forwards a request to the KOG backend.
 * In Phase 1 all data lives in KOG's FastAPI; this plugin
 * acts as a pass-through that adds auth headers.
 */
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

export const kogContactsPlugin: PlatformPlugin = {
  id: 'kog-contacts',
  name: 'Contacts & Organizations',
  version: '1.0.0',

  register(ctx) {
    const kogBaseUrl = ctx.getConfig('KOG_API_URL') || 'http://localhost:8000';

    // -- Admin navigation --
    ctx.addAdminNav({
      label: 'Contacts',
      icon: 'users',
      path: '/contacts',
      order: 10,
      category: 'CRM',
    });
    ctx.addAdminNav({
      label: 'Organizations',
      icon: 'building',
      path: '/organizations',
      order: 11,
      category: 'CRM',
    });

    // -- API routes (proxy to KOG backend) --
    ctx.addRoutes((router: Router) => {
      // Contacts CRUD
      router.get('/contacts', (req, res) =>
        proxyToKog(kogBaseUrl, '/contacts', req, res));
      router.get('/contacts/:id', (req, res) =>
        proxyToKog(kogBaseUrl, `/contacts/${req.params.id}`, req, res));
      router.post('/contacts', (req, res) =>
        proxyToKog(kogBaseUrl, '/contacts', req, res));
      router.put('/contacts/:id', (req, res) =>
        proxyToKog(kogBaseUrl, `/contacts/${req.params.id}`, req, res));
      router.delete('/contacts/:id', (req, res) =>
        proxyToKog(kogBaseUrl, `/contacts/${req.params.id}`, req, res));

      // Organizations CRUD
      router.get('/organizations', (req, res) =>
        proxyToKog(kogBaseUrl, '/organizations', req, res));
      router.get('/organizations/:id', (req, res) =>
        proxyToKog(kogBaseUrl, `/organizations/${req.params.id}`, req, res));
      router.post('/organizations', (req, res) =>
        proxyToKog(kogBaseUrl, '/organizations', req, res));
      router.put('/organizations/:id', (req, res) =>
        proxyToKog(kogBaseUrl, `/organizations/${req.params.id}`, req, res));
      router.delete('/organizations/:id', (req, res) =>
        proxyToKog(kogBaseUrl, `/organizations/${req.params.id}`, req, res));
    });
  },
};

export default kogContactsPlugin;

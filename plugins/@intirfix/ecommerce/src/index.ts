/**
 * @intirfix/ecommerce — E-commerce Platform Adapters plugin
 *
 * Phase 1: Proxies Shopify, WooCommerce, Amazon Seller, BigCommerce,
 * Etsy, eBay, Wix, and Squarespace routes to the Intirfix Express backend.
 *
 * Intirfix connectors: CONNECTOR_SHOPIFY_v1.0.ts, CONNECTOR_WOOCOMMERCE_v1.0.ts,
 * CONNECTOR_BIGCOMMERCE_v1.0.ts, plus marketplace services for Etsy, eBay, Amazon
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

export const intirfixEcommercePlugin: PlatformPlugin = {
  id: 'intirfix-ecommerce',
  name: 'E-commerce Integrations',
  version: '1.0.0',

  register(ctx) {
    const baseUrl = ctx.getConfig('INTIRFIX_API_URL') || 'http://localhost:3100';

    // -- Admin navigation --
    ctx.addAdminNav({
      label: 'E-commerce',
      icon: 'shopping-cart',
      path: '/ecommerce',
      order: 50,
      category: 'Integrations',
    });

    // -- API routes (proxy to Intirfix backend) --
    ctx.addRoutes((router: Router) => {
      // Shopify routes
      router.get('/ecommerce/shopify/products', (req, res) =>
        proxyToIntirfix(baseUrl, '/shopify/products', req, res));
      router.get('/ecommerce/shopify/orders', (req, res) =>
        proxyToIntirfix(baseUrl, '/shopify/orders', req, res));
      router.post('/ecommerce/shopify/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/shopify/connect', req, res));
      router.get('/ecommerce/shopify/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/shopify/status', req, res));
      router.post('/ecommerce/shopify/sync', (req, res) =>
        proxyToIntirfix(baseUrl, '/shopify/sync', req, res));
      router.post('/ecommerce/shopify/webhook', (req, res) =>
        proxyToIntirfix(baseUrl, '/shopify/webhook', req, res));

      // WooCommerce routes
      router.get('/ecommerce/woocommerce/products', (req, res) =>
        proxyToIntirfix(baseUrl, '/woocommerce/products', req, res));
      router.get('/ecommerce/woocommerce/orders', (req, res) =>
        proxyToIntirfix(baseUrl, '/woocommerce/orders', req, res));
      router.post('/ecommerce/woocommerce/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/woocommerce/connect', req, res));
      router.get('/ecommerce/woocommerce/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/woocommerce/status', req, res));
      router.post('/ecommerce/woocommerce/sync', (req, res) =>
        proxyToIntirfix(baseUrl, '/woocommerce/sync', req, res));

      // Amazon Seller routes
      router.get('/ecommerce/amazon/products', (req, res) =>
        proxyToIntirfix(baseUrl, '/amazon-seller/products', req, res));
      router.get('/ecommerce/amazon/orders', (req, res) =>
        proxyToIntirfix(baseUrl, '/amazon-seller/orders', req, res));
      router.post('/ecommerce/amazon/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/amazon-seller/connect', req, res));
      router.get('/ecommerce/amazon/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/amazon-seller/status', req, res));

      // BigCommerce routes
      router.get('/ecommerce/bigcommerce/products', (req, res) =>
        proxyToIntirfix(baseUrl, '/bigcommerce/products', req, res));
      router.get('/ecommerce/bigcommerce/orders', (req, res) =>
        proxyToIntirfix(baseUrl, '/bigcommerce/orders', req, res));
      router.post('/ecommerce/bigcommerce/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/bigcommerce/connect', req, res));
      router.get('/ecommerce/bigcommerce/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/bigcommerce/status', req, res));

      // Etsy routes
      router.get('/ecommerce/etsy/listings', (req, res) =>
        proxyToIntirfix(baseUrl, '/etsy/listings', req, res));
      router.get('/ecommerce/etsy/orders', (req, res) =>
        proxyToIntirfix(baseUrl, '/etsy/orders', req, res));
      router.post('/ecommerce/etsy/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/etsy/connect', req, res));
      router.get('/ecommerce/etsy/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/etsy/status', req, res));

      // eBay routes
      router.get('/ecommerce/ebay/listings', (req, res) =>
        proxyToIntirfix(baseUrl, '/ebay/listings', req, res));
      router.get('/ecommerce/ebay/orders', (req, res) =>
        proxyToIntirfix(baseUrl, '/ebay/orders', req, res));
      router.post('/ecommerce/ebay/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/ebay/connect', req, res));
      router.get('/ecommerce/ebay/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/ebay/status', req, res));

      // Wix routes
      router.get('/ecommerce/wix/products', (req, res) =>
        proxyToIntirfix(baseUrl, '/wix/products', req, res));
      router.post('/ecommerce/wix/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/wix/connect', req, res));
      router.get('/ecommerce/wix/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/wix/status', req, res));

      // Squarespace routes
      router.get('/ecommerce/squarespace/products', (req, res) =>
        proxyToIntirfix(baseUrl, '/squarespace/products', req, res));
      router.post('/ecommerce/squarespace/connect', (req, res) =>
        proxyToIntirfix(baseUrl, '/squarespace/connect', req, res));
      router.get('/ecommerce/squarespace/status', (req, res) =>
        proxyToIntirfix(baseUrl, '/squarespace/status', req, res));
    });
  },
};

export default intirfixEcommercePlugin;

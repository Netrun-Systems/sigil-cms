/**
 * Printful Merch Plugin — print-on-demand merchandise integration
 *
 * Syncs product catalog from Printful, displays mockups, and provides
 * a storefront API. Payment is handled via the store plugin's Stripe
 * checkout flow; order fulfillment integration can be added later.
 *
 * Requires PRINTFUL_API_KEY environment variable.
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createAdminRoutes, createPublicRoutes } from './routes.js';

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS cms_merch_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  printful_sync_product_id INTEGER NOT NULL,
  printful_variant_id INTEGER,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  retail_price INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  printful_price INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  variants JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const printfulPlugin: CmsPlugin = {
  id: 'printful',
  name: 'Merch (Printful)',
  version: '1.0.0',
  requiredEnv: ['PRINTFUL_API_KEY'],

  async register(ctx) {
    // Run migration for merch products table
    await ctx.runMigration(MIGRATION_SQL);

    // Mount authenticated admin routes
    const adminRouter = createAdminRoutes(ctx.db);
    ctx.addRoutes('merch', adminRouter);

    // Mount public storefront routes
    const publicRouter = createPublicRoutes(ctx.db);
    ctx.addPublicRoutes('merch/:siteSlug', publicRouter);

    // Register merch_grid block type for the visual editor
    ctx.addBlockTypes([
      { type: 'merch_grid', label: 'Merchandise Grid', category: 'Commerce' },
    ]);

    // Admin sidebar navigation
    ctx.addAdminNav({
      title: 'Merch',
      siteScoped: true,
      items: [
        { label: 'Merchandise', icon: 'ShoppingBag', href: 'merch' },
      ],
    });

    // Admin routes for React lazy loading
    ctx.addAdminRoutes([
      {
        path: 'sites/:siteId/merch',
        component: '@netrun-cms/plugin-printful/admin/MerchPage',
      },
    ]);

    ctx.logger.info({}, 'Printful merch plugin registered');
  },
};

export default printfulPlugin;

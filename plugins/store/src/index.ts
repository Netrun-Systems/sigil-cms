/**
 * Store Plugin — Stripe e-commerce: product catalog, checkout, order tracking
 *
 * Reuses @netrun/stripe-client for Stripe API integration.
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createRoutes } from './routes.js';

const storePlugin: CmsPlugin = {
  id: 'store',
  name: 'Store (Stripe)',
  version: '1.0.0',
  requiredEnv: ['STRIPE_SECRET_KEY'],

  async register(ctx) {
    // Run migration to create tables
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        product_type VARCHAR(20) DEFAULT 'one_time',
        unit_price INTEGER NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        billing_interval VARCHAR(20),
        image_url TEXT,
        is_active BOOLEAN DEFAULT true,
        stripe_product_id VARCHAR(255),
        stripe_price_id VARCHAR(255),
        metadata JSONB DEFAULT '{}',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_cms_products_site_id ON cms_products(site_id);
      CREATE INDEX IF NOT EXISTS idx_cms_products_stripe_product_id ON cms_products(stripe_product_id);

      CREATE TABLE IF NOT EXISTS cms_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID REFERENCES cms_sites(id) ON DELETE CASCADE,
        stripe_session_id VARCHAR(255) UNIQUE,
        stripe_payment_intent_id VARCHAR(255),
        customer_email VARCHAR(320),
        customer_name VARCHAR(200),
        status VARCHAR(20) DEFAULT 'pending',
        total_amount INTEGER NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        line_items JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_cms_orders_site_id ON cms_orders(site_id);
      CREATE INDEX IF NOT EXISTS idx_cms_orders_status ON cms_orders(status);
      CREATE INDEX IF NOT EXISTS idx_cms_orders_stripe_session_id ON cms_orders(stripe_session_id);
    `);

    // Create route handlers
    const { adminRouter, publicRouter, webhookRouter } = createRoutes(ctx.db, ctx.logger);

    // Mount routes
    ctx.addRoutes('store', adminRouter);
    ctx.addRoutes('store/webhook', webhookRouter);
    ctx.addPublicRoutes('store/:siteSlug', publicRouter);

    // Register block types
    ctx.addBlockTypes([
      { type: 'product_grid', label: 'Product Grid', category: 'commerce' },
      { type: 'buy_button', label: 'Buy Button', category: 'commerce' },
    ]);

    // Register admin navigation
    ctx.addAdminNav({
      title: 'Store',
      siteScoped: true,
      items: [
        { label: 'Products', icon: 'ShoppingBag', href: 'store/products' },
        { label: 'Orders', icon: 'Receipt', href: 'store/orders' },
      ],
    });

    // Register admin routes
    ctx.addAdminRoutes([
      { path: 'sites/:siteId/store/products', component: '@netrun-cms/plugin-store/admin/ProductsList' },
      { path: 'sites/:siteId/store/orders', component: '@netrun-cms/plugin-store/admin/OrdersList' },
    ]);
  },
};

export default storePlugin;

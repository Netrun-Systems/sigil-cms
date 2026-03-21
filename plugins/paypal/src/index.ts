/**
 * PayPal Payment Plugin — Smart Payment Buttons and Orders API
 *
 * Provides PayPal as an alternative payment method for NetrunCMS sites.
 * Orders are tracked in cms_paypal_orders and visible in the main store orders view.
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createRoutes } from './routes.js';

const paypalPlugin: CmsPlugin = {
  id: 'paypal',
  name: 'PayPal Payments',
  version: '1.0.0',
  requiredEnv: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'],

  async register(ctx) {
    // Create cms_paypal_orders table if it doesn't exist
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_paypal_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
        paypal_order_id VARCHAR(255) UNIQUE,
        status VARCHAR(20) NOT NULL DEFAULT 'created',
        customer_email VARCHAR(320),
        total_amount INTEGER NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        line_items JSONB NOT NULL DEFAULT '[]',
        capture_id VARCHAR(255),
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT cms_paypal_orders_status_check CHECK (status IN ('created', 'approved', 'completed', 'cancelled'))
      )
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_paypal_orders_site_id ON cms_paypal_orders(site_id)
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_paypal_orders_paypal_order_id ON cms_paypal_orders(paypal_order_id)
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_paypal_orders_status ON cms_paypal_orders(site_id, status)
    `);

    // Mount public routes: /api/v1/public/paypal/:siteSlug
    const publicRouter = createRoutes(ctx.db);
    ctx.addPublicRoutes('paypal/:siteSlug', publicRouter);

    // Register paypal_button block type
    ctx.addBlockTypes([
      { type: 'paypal_button', label: 'PayPal Button', category: 'Commerce' },
    ]);

    ctx.logger.info({ plugin: 'paypal' }, 'PayPal Payments plugin registered');
  },
};

export default paypalPlugin;

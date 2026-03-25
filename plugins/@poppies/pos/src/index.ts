/**
 * @poppies/pos — Point of Sale for Poppies Art & Gifts
 *
 * Replaces Square registers with Stripe Terminal. Manages register sessions,
 * transactions with tax calculation, commission splits for consignment artists,
 * receipt generation, and daily/artist sales reports.
 *
 * Tables:
 *   - pos_sessions: register shifts (open/close with cash reconciliation)
 *   - pos_transactions: sale, refund, and void records
 *   - pos_line_items: individual items per transaction with commission splits
 *   - pos_products: quick-add product catalog for fast checkout
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createPosRoutes } from './routes.js';

const MIGRATION_SQL = `
  -- POS sessions (register shifts)
  CREATE TABLE IF NOT EXISTS pos_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
    cashier_name VARCHAR(100) NOT NULL,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    opening_cash NUMERIC(10,2) DEFAULT 0,
    closing_cash NUMERIC(10,2),
    status VARCHAR(20) CHECK (status IN ('open', 'closed')) DEFAULT 'open',
    notes TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_pos_sessions_site_id ON pos_sessions(site_id);
  CREATE INDEX IF NOT EXISTS idx_pos_sessions_status ON pos_sessions(status);

  -- POS transactions
  CREATE TABLE IF NOT EXISTS pos_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES pos_sessions(id),
    site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('sale', 'refund', 'void')) DEFAULT 'sale',
    subtotal NUMERIC(10,2) NOT NULL,
    tax_amount NUMERIC(10,2) DEFAULT 0,
    tax_rate NUMERIC(5,4) DEFAULT 0.0775,
    discount_amount NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(20) CHECK (payment_method IN ('card', 'cash', 'split')) DEFAULT 'card',
    cash_amount NUMERIC(10,2) DEFAULT 0,
    card_amount NUMERIC(10,2) DEFAULT 0,
    change_due NUMERIC(10,2) DEFAULT 0,
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    card_brand VARCHAR(20),
    card_last4 VARCHAR(4),
    receipt_number VARCHAR(20) NOT NULL,
    customer_name VARCHAR(200),
    customer_email VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_pos_transactions_session_id ON pos_transactions(session_id);
  CREATE INDEX IF NOT EXISTS idx_pos_transactions_site_id ON pos_transactions(site_id);
  CREATE INDEX IF NOT EXISTS idx_pos_transactions_receipt ON pos_transactions(receipt_number);
  CREATE INDEX IF NOT EXISTS idx_pos_transactions_created_at ON pos_transactions(created_at);

  -- POS transaction line items
  CREATE TABLE IF NOT EXISTS pos_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES pos_transactions(id),
    product_name VARCHAR(200) NOT NULL,
    artist_id UUID,
    artist_name VARCHAR(200),
    sku VARCHAR(50),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    line_total NUMERIC(10,2) NOT NULL,
    commission_rate NUMERIC(5,4),
    commission_amount NUMERIC(10,2),
    store_amount NUMERIC(10,2)
  );

  CREATE INDEX IF NOT EXISTS idx_pos_line_items_transaction_id ON pos_line_items(transaction_id);
  CREATE INDEX IF NOT EXISTS idx_pos_line_items_artist_id ON pos_line_items(artist_id);

  -- Quick-add products for fast checkout
  CREATE TABLE IF NOT EXISTS pos_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(50),
    price NUMERIC(10,2) NOT NULL,
    category VARCHAR(100),
    artist_id UUID,
    artist_name VARCHAR(200),
    commission_rate NUMERIC(5,4) DEFAULT 0.60,
    image_url TEXT,
    barcode VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_pos_products_site_id ON pos_products(site_id);
  CREATE INDEX IF NOT EXISTS idx_pos_products_sku ON pos_products(sku);
  CREATE INDEX IF NOT EXISTS idx_pos_products_barcode ON pos_products(barcode);
  CREATE INDEX IF NOT EXISTS idx_pos_products_category ON pos_products(category);
`;

const posPlugin: CmsPlugin = {
  id: 'poppies-pos',
  name: 'Poppies POS',
  version: '1.0.0',
  requiredEnv: ['STRIPE_SECRET_KEY'],

  async register(ctx) {
    // Run migrations
    await ctx.runMigration(MIGRATION_SQL);

    // Create route handler
    const posRouter = createPosRoutes(ctx.db, ctx.logger);

    // Mount all POS routes under /api/v1/sites/:siteId/pos/*
    ctx.addRoutes('pos', posRouter);

    // Admin navigation
    ctx.addAdminNav({
      title: 'Point of Sale',
      siteScoped: true,
      items: [
        { label: 'Register', icon: 'Monitor', href: 'pos' },
        { label: 'Products', icon: 'Package', href: 'pos/products' },
        { label: 'Sessions', icon: 'Clock', href: 'pos/sessions' },
        { label: 'Reports', icon: 'BarChart3', href: 'pos/reports' },
      ],
    });

    // Admin routes for React lazy loading
    ctx.addAdminRoutes([
      { path: 'sites/:siteId/pos', component: '@poppies/pos/admin/POSRegister' },
      { path: 'sites/:siteId/pos/products', component: '@poppies/pos/admin/POSProducts' },
      { path: 'sites/:siteId/pos/sessions', component: '@poppies/pos/admin/POSSessions' },
      { path: 'sites/:siteId/pos/reports', component: '@poppies/pos/admin/POSReports' },
    ]);

    ctx.logger.info({ plugin: 'poppies-pos' }, 'Poppies POS plugin loaded');
  },
};

export default posPlugin;

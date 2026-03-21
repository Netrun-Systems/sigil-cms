/**
 * @poppies/consignment — Consignment tracking for Poppies Art & Gifts
 *
 * Tracks artist consignment inventory, sales, commission splits,
 * and monthly settlement payouts. Integrates with Square POS for
 * real-time sales data import.
 *
 * Tables:
 *   - poppies_consignment_artists: artist commission rates and status
 *   - poppies_consignment_items: items on consignment with Square catalog IDs
 *   - poppies_consignment_sales: individual sale records from Square POS
 *   - poppies_consignment_settlements: monthly payout summaries per artist
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createConsignmentRoutes } from './routes/consignment.js';
import { createSettlementRoutes } from './routes/settlements.js';
import { createSquareSyncRoutes } from './routes/square-sync.js';

const MIGRATION_SQL = `
  -- Consignment artist profiles (links to cms_sites artist data)
  CREATE TABLE IF NOT EXISTS poppies_consignment_artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
    artist_name VARCHAR(255) NOT NULL,
    artist_slug VARCHAR(255),
    email VARCHAR(320),
    phone VARCHAR(50),
    commission_rate NUMERIC(5,2) NOT NULL DEFAULT 60.00,
    rental_tier VARCHAR(50) DEFAULT 'standard',
    status VARCHAR(20) DEFAULT 'active',
    square_customer_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_poppies_ca_site_id ON poppies_consignment_artists(site_id);
  CREATE INDEX IF NOT EXISTS idx_poppies_ca_status ON poppies_consignment_artists(status);

  -- Consignment items (products on consignment from artists)
  CREATE TABLE IF NOT EXISTS poppies_consignment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES poppies_consignment_artists(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    description TEXT,
    category VARCHAR(100),
    unit_price INTEGER NOT NULL,
    quantity_on_hand INTEGER DEFAULT 1,
    square_catalog_id VARCHAR(255),
    square_variation_id VARCHAR(255),
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    consigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_poppies_ci_site_id ON poppies_consignment_items(site_id);
  CREATE INDEX IF NOT EXISTS idx_poppies_ci_artist_id ON poppies_consignment_items(artist_id);
  CREATE INDEX IF NOT EXISTS idx_poppies_ci_square_catalog ON poppies_consignment_items(square_catalog_id);
  CREATE INDEX IF NOT EXISTS idx_poppies_ci_sku ON poppies_consignment_items(sku);

  -- Sales records (imported from Square POS transactions)
  CREATE TABLE IF NOT EXISTS poppies_consignment_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
    item_id UUID REFERENCES poppies_consignment_items(id) ON DELETE SET NULL,
    artist_id UUID NOT NULL REFERENCES poppies_consignment_artists(id) ON DELETE CASCADE,
    square_payment_id VARCHAR(255),
    square_order_id VARCHAR(255),
    quantity INTEGER NOT NULL DEFAULT 1,
    sale_amount INTEGER NOT NULL,
    artist_share INTEGER NOT NULL,
    store_share INTEGER NOT NULL,
    commission_rate_applied NUMERIC(5,2) NOT NULL,
    sale_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settlement_id UUID,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_poppies_cs_site_id ON poppies_consignment_sales(site_id);
  CREATE INDEX IF NOT EXISTS idx_poppies_cs_artist_id ON poppies_consignment_sales(artist_id);
  CREATE INDEX IF NOT EXISTS idx_poppies_cs_settlement ON poppies_consignment_sales(settlement_id);
  CREATE INDEX IF NOT EXISTS idx_poppies_cs_status ON poppies_consignment_sales(status);
  CREATE INDEX IF NOT EXISTS idx_poppies_cs_sale_date ON poppies_consignment_sales(sale_date);

  -- Monthly settlement summaries (payouts to artists)
  CREATE TABLE IF NOT EXISTS poppies_consignment_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES poppies_consignment_artists(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_sales INTEGER NOT NULL DEFAULT 0,
    total_artist_share INTEGER NOT NULL DEFAULT 0,
    total_store_share INTEGER NOT NULL DEFAULT 0,
    sale_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    paid_at TIMESTAMPTZ,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_poppies_cset_site_id ON poppies_consignment_settlements(site_id);
  CREATE INDEX IF NOT EXISTS idx_poppies_cset_artist_id ON poppies_consignment_settlements(artist_id);
  CREATE INDEX IF NOT EXISTS idx_poppies_cset_period ON poppies_consignment_settlements(period_start, period_end);
  CREATE INDEX IF NOT EXISTS idx_poppies_cset_status ON poppies_consignment_settlements(status);
`;

const consignmentPlugin: CmsPlugin = {
  id: 'poppies-consignment',
  name: 'Poppies Consignment',
  version: '1.0.0',
  requiredEnv: ['SQUARE_ACCESS_TOKEN'],

  async register(ctx) {
    // Run migrations
    await ctx.runMigration(MIGRATION_SQL);

    // Create route handlers
    const consignmentRouter = createConsignmentRoutes(ctx.db, ctx.logger);
    const settlementRouter = createSettlementRoutes(ctx.db, ctx.logger);
    const squareSyncRouter = createSquareSyncRoutes(ctx.db, ctx.logger, ctx.getConfig.bind(ctx));

    // Admin routes (site-scoped, behind auth)
    ctx.addRoutes('consignment/artists', consignmentRouter.artistRouter);
    ctx.addRoutes('consignment/items', consignmentRouter.itemRouter);
    ctx.addRoutes('consignment/sales', consignmentRouter.salesRouter);
    ctx.addRoutes('consignment/settlements', settlementRouter);
    ctx.addRoutes('consignment/square', squareSyncRouter);

    // Admin navigation
    ctx.addAdminNav({
      title: 'Consignment',
      siteScoped: true,
      items: [
        { label: 'Artists', icon: 'Users', href: 'consignment/artists' },
        { label: 'Inventory', icon: 'Package', href: 'consignment/items' },
        { label: 'Sales', icon: 'DollarSign', href: 'consignment/sales' },
        { label: 'Settlements', icon: 'Landmark', href: 'consignment/settlements' },
        { label: 'Commission Rates', icon: 'Percent', href: 'consignment/rates' },
        { label: 'Square Sync', icon: 'RefreshCw', href: 'consignment/square' },
      ],
    });

    // Admin routes for React lazy loading
    ctx.addAdminRoutes([
      { path: 'sites/:siteId/consignment/artists', component: '@poppies/consignment/admin/ArtistsList' },
      { path: 'sites/:siteId/consignment/artists/:id', component: '@poppies/consignment/admin/ArtistDetail' },
      { path: 'sites/:siteId/consignment/items', component: '@poppies/consignment/admin/ItemsList' },
      { path: 'sites/:siteId/consignment/items/:id', component: '@poppies/consignment/admin/ItemDetail' },
      { path: 'sites/:siteId/consignment/sales', component: '@poppies/consignment/admin/SalesList' },
      { path: 'sites/:siteId/consignment/settlements', component: '@poppies/consignment/admin/SettlementsList' },
      { path: 'sites/:siteId/consignment/settlements/:id', component: '@poppies/consignment/admin/SettlementDetail' },
      { path: 'sites/:siteId/consignment/rates', component: '@poppies/consignment/admin/CommissionRates' },
      { path: 'sites/:siteId/consignment/square', component: '@poppies/consignment/admin/SquareSync' },
    ]);

    // Block types for Poppies site pages
    ctx.addBlockTypes([
      { type: 'artist_grid', label: 'Consignment Artists Grid', category: 'Poppies' },
      { type: 'featured_artists', label: 'Featured Artists', category: 'Poppies' },
    ]);

    ctx.logger.info({ plugin: 'poppies-consignment' }, 'Poppies consignment plugin loaded');
  },
};

export default consignmentPlugin;

/**
 * Site Migration Plugin — import from WordPress, Shopify, and Square Online
 *
 * Provides content extraction, block mapping, media download, SEO preservation,
 * and navigation import for migrating existing sites into NetrunCMS.
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createRoutes } from './routes.js';

const migratePlugin: CmsPlugin = {
  id: 'migrate',
  name: 'Site Migration',
  version: '1.0.0',

  async register(ctx) {
    // Run migrations to create plugin tables
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_migrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
        source VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        source_url TEXT,
        total_items INTEGER DEFAULT 0,
        imported_items INTEGER DEFAULT 0,
        failed_items INTEGER DEFAULT 0,
        log JSONB DEFAULT '[]',
        config JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_cms_migrations_site_status ON cms_migrations(site_id, status);

      CREATE TABLE IF NOT EXISTS cms_migration_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        migration_id UUID NOT NULL REFERENCES cms_migrations(id) ON DELETE CASCADE,
        source_type VARCHAR(30) NOT NULL,
        source_id VARCHAR(255),
        source_url TEXT,
        target_type VARCHAR(30),
        target_id UUID,
        status VARCHAR(20) DEFAULT 'pending',
        title VARCHAR(500),
        data JSONB DEFAULT '{}',
        error TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_cms_migration_items_status ON cms_migration_items(migration_id, status);
      CREATE INDEX IF NOT EXISTS idx_cms_migration_items_type ON cms_migration_items(migration_id, source_type);
    `);

    // Create route handlers
    const { adminRouter } = createRoutes(ctx.db, ctx.logger);

    // Mount routes under /api/v1/sites/:siteId/migrate
    ctx.addRoutes('migrate', adminRouter);

    // Register admin navigation
    ctx.addAdminNav({
      title: 'Migration',
      siteScoped: true,
      items: [
        { label: 'Import Site', icon: 'Upload', href: 'migrate' },
      ],
    });

    // Register admin routes
    ctx.addAdminRoutes([
      { path: 'sites/:siteId/migrate', component: '@netrun-cms/plugin-migrate/admin/MigrationDashboard' },
    ]);
  },
};

export default migratePlugin;

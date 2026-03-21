/**
 * Marketplace Plugin — Plugin discovery, installation, and management
 *
 * Provides a curated registry of available plugins and tracks installed
 * plugins per tenant. Seeds all 20 built-in Sigil plugins on first run.
 *
 * Public routes:  /api/v1/public/marketplace/browse
 * Admin routes:   /api/v1/marketplace/installed, /install, etc.
 * Registry admin: /api/v1/marketplace/registry (super admin)
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { MIGRATION_SQL, BUILT_IN_PLUGINS } from './schema.js';
import { createPublicRoutes, createAdminRoutes, createRegistryRoutes } from './routes.js';

const marketplacePlugin: CmsPlugin = {
  id: 'marketplace',
  name: 'Plugin Marketplace',
  version: '1.0.0',

  async register(ctx) {
    // 1. Run migrations
    await ctx.runMigration(MIGRATION_SQL);

    // 2. Seed built-in plugins into the registry (idempotent)
    for (const plugin of BUILT_IN_PLUGINS) {
      const safePid = plugin.pluginId.replace(/'/g, "''");
      const safeName = plugin.name.replace(/'/g, "''");
      const safeDesc = plugin.description.replace(/'/g, "''");
      const safeAuthor = plugin.author.replace(/'/g, "''");
      const safeVersion = plugin.version.replace(/'/g, "''");
      const safeCat = plugin.category.replace(/'/g, "''");
      const safeIcon = plugin.iconName.replace(/'/g, "''");
      const safeReqEnv = JSON.stringify(plugin.requiredEnv).replace(/'/g, "''");
      const safeTags = JSON.stringify(plugin.tags).replace(/'/g, "''");

      await ctx.runMigration(`
        INSERT INTO cms_plugin_registry
          (plugin_id, name, description, author, version, category, icon_name,
           is_featured, is_verified, source_type, required_env, tags)
        VALUES
          ('${safePid}', '${safeName}', '${safeDesc}', '${safeAuthor}', '${safeVersion}',
           '${safeCat}', '${safeIcon}', ${plugin.isFeatured}, ${plugin.isVerified},
           'built-in', '${safeReqEnv}'::jsonb, '${safeTags}'::jsonb)
        ON CONFLICT (plugin_id) DO NOTHING
      `);
    }

    ctx.logger.info({ count: BUILT_IN_PLUGINS.length }, 'Marketplace registry seeded');

    // 3. Create and mount routes
    const publicRouter = createPublicRoutes(ctx.db, ctx.logger);
    const adminRouter = createAdminRoutes(ctx.db, ctx.logger);
    const registryRouter = createRegistryRoutes(ctx.db, ctx.logger);

    ctx.addPublicRoutes('marketplace', publicRouter);
    ctx.addGlobalRoutes('marketplace', adminRouter);
    ctx.addGlobalRoutes('marketplace/registry', registryRouter);

    // 4. Admin sidebar navigation
    ctx.addAdminNav({
      title: 'Plugins',
      siteScoped: false,
      items: [
        { label: 'Marketplace', icon: 'Puzzle', href: '/marketplace' },
        { label: 'Installed', icon: 'Package', href: '/marketplace/installed' },
      ],
    });

    // 5. Admin page routes
    ctx.addAdminRoutes([
      { path: 'marketplace', component: '@netrun-cms/plugin-marketplace/admin/MarketplacePage' },
      { path: 'marketplace/installed', component: '@netrun-cms/plugin-marketplace/admin/InstalledPlugins' },
    ]);
  },
};

export default marketplacePlugin;

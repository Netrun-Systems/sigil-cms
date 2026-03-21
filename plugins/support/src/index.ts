/**
 * Support Panel Plugin — Universal support widget
 *
 * Combines help docs (from the docs plugin), contact form (from the contact
 * plugin), Charlotte AI chat (if available), and status/announcements in one
 * slide-out panel accessible from any page via a floating "?" button.
 *
 * Gracefully degrades — only shows features whose backing plugins are active.
 *
 * Admin routes: /api/v1/sites/:siteId/support
 * Public routes: /api/v1/public/support/:siteSlug
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createAdminRoutes, createPublicRoutes } from './routes.js';

const supportPlugin: CmsPlugin = {
  id: 'support',
  name: 'Support Panel',
  version: '1.0.0',

  async register(ctx) {
    // ── Migrations ──

    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_support_announcements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'info',
        is_active BOOLEAN NOT NULL DEFAULT true,
        starts_at TIMESTAMP,
        ends_at TIMESTAMP,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_support_announcements_site_active
        ON cms_support_announcements(site_id, is_active);
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_support_announcements_site_type
        ON cms_support_announcements(site_id, type);
    `);

    // ── Routes ──

    const adminRouter = createAdminRoutes(ctx.db, ctx.logger);
    const publicRouter = createPublicRoutes(ctx.db, ctx.logger);

    ctx.addRoutes('support', adminRouter);
    ctx.addPublicRoutes('support/:siteSlug', publicRouter);

    // ── Block Types ──

    ctx.addBlockTypes([
      { type: 'support_button', label: 'Support Button', category: 'Support' },
    ]);

    // ── Admin Navigation ──

    ctx.addAdminNav({
      title: 'Support',
      siteScoped: true,
      items: [
        { label: 'Announcements', icon: 'Megaphone', href: 'support/announcements' },
        { label: 'Panel Settings', icon: 'Settings', href: 'support/config' },
      ],
    });

    // ── Admin Routes ──

    ctx.addAdminRoutes([
      { path: 'sites/:siteId/support/announcements', component: '@netrun-cms/plugin-support/admin/AnnouncementsList' },
      { path: 'sites/:siteId/support/announcements/new', component: '@netrun-cms/plugin-support/admin/AnnouncementEditor' },
      { path: 'sites/:siteId/support/announcements/:id', component: '@netrun-cms/plugin-support/admin/AnnouncementEditor' },
      { path: 'sites/:siteId/support/config', component: '@netrun-cms/plugin-support/admin/PanelSettings' },
    ]);
  },
};

export default supportPlugin;

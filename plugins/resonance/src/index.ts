/**
 * Resonance Analytics Plugin
 *
 * Block-level content analytics for NetrunCMS. Measures engagement per
 * individual content block (not per page), computes composite resonance
 * scores, supports A/B testing between block variants, and optionally
 * uses Gemini AI to suggest content improvements.
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createRoutes } from './routes.js';

const resonancePlugin: CmsPlugin = {
  id: 'resonance',
  name: 'Resonance Analytics',
  version: '1.0.0',

  async register(ctx) {
    // Create tables if they don't exist
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_resonance_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL,
        page_id UUID NOT NULL,
        block_id UUID NOT NULL,
        block_type VARCHAR(50) NOT NULL,
        event_type VARCHAR(30) NOT NULL,
        value INTEGER NOT NULL,
        session_hash VARCHAR(64) NOT NULL,
        referrer TEXT,
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_res_events_site_page_block_event
        ON cms_resonance_events(site_id, page_id, block_id, event_type);
      CREATE INDEX IF NOT EXISTS idx_res_events_site_created
        ON cms_resonance_events(site_id, created_at);

      CREATE TABLE IF NOT EXISTS cms_resonance_scores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL,
        page_id UUID NOT NULL,
        block_id UUID NOT NULL,
        block_type VARCHAR(50) NOT NULL,
        impressions INTEGER DEFAULT 0,
        unique_sessions INTEGER DEFAULT 0,
        avg_viewport_time_ms INTEGER DEFAULT 0,
        avg_scroll_depth INTEGER DEFAULT 0,
        click_count INTEGER DEFAULT 0,
        bounce_point_count INTEGER DEFAULT 0,
        resonance_score INTEGER DEFAULT 0,
        period VARCHAR(10) NOT NULL,
        period_start DATE NOT NULL,
        computed_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_res_scores_site_block_period
          UNIQUE (site_id, block_id, period, period_start)
      );

      CREATE INDEX IF NOT EXISTS idx_res_scores_site_page_period
        ON cms_resonance_scores(site_id, page_id, period);
      CREATE INDEX IF NOT EXISTS idx_res_scores_resonance_score
        ON cms_resonance_scores(resonance_score);

      CREATE TABLE IF NOT EXISTS cms_resonance_experiments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL,
        page_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        original_block_id UUID NOT NULL,
        variant_block_id UUID NOT NULL,
        traffic_split INTEGER DEFAULT 50,
        status VARCHAR(20) DEFAULT 'draft',
        winner_block_id UUID,
        winner_lift INTEGER,
        started_at TIMESTAMPTZ,
        concluded_at TIMESTAMPTZ,
        min_sessions INTEGER DEFAULT 100,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_res_experiments_site_page_status
        ON cms_resonance_experiments(site_id, page_id, status);

      CREATE TABLE IF NOT EXISTS cms_resonance_suggestions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL,
        page_id UUID NOT NULL,
        block_id UUID NOT NULL,
        suggestion TEXT NOT NULL,
        reason TEXT NOT NULL,
        category VARCHAR(50),
        priority VARCHAR(10) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'pending',
        resonance_score_before INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_res_suggestions_site_block_status
        ON cms_resonance_suggestions(site_id, block_id, status);
    `);

    // Create route handlers
    const { adminRouter, publicRouter } = createRoutes(ctx.db, ctx.logger);

    // Mount routes
    ctx.addRoutes('resonance', adminRouter);
    ctx.addPublicRoutes('resonance/:siteSlug', publicRouter);

    // Register block type: embeddable analytics summary widget
    ctx.addBlockTypes([
      { type: 'resonance_insights', label: 'Resonance Insights', category: 'analytics' },
    ]);

    // Register admin navigation
    ctx.addAdminNav({
      title: 'Analytics',
      siteScoped: true,
      items: [
        { label: 'Resonance', icon: 'Activity', href: 'resonance' },
        { label: 'Experiments', icon: 'FlaskConical', href: 'resonance/experiments' },
      ],
    });

    // Register admin routes
    ctx.addAdminRoutes([
      { path: 'sites/:siteId/resonance', component: '@netrun-cms/plugin-resonance/admin/Dashboard' },
      { path: 'sites/:siteId/resonance/experiments', component: '@netrun-cms/plugin-resonance/admin/Experiments' },
    ]);
  },
};

export default resonancePlugin;

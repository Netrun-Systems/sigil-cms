/**
 * Meridian Publishing Plugin — Digital flipbooks, reader analytics, publication management
 *
 * Turns any Sigil CMS site into a digital publishing platform (anti-Issuu).
 * Upload PDFs, convert to interactive flipbooks, track reader engagement.
 *
 * Block types:
 *   - flipbook       — embed a flipbook viewer inline on any page
 *   - publication-list — display a grid/list of published flipbooks
 *
 * Admin nav: Publications, Flipbooks, Reader Analytics
 * Public routes: flipbook viewer, embed endpoint, page images, analytics beacon
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createRoutes } from './routes.js';

const MIGRATION_SQL = `
-- Meridian Publishing Plugin: Database schema
-- Idempotent — safe to run multiple times

CREATE TABLE IF NOT EXISTS meridian_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL,
  description TEXT,
  cover_image TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_meridian_publications_slug ON meridian_publications(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_meridian_publications_tenant ON meridian_publications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meridian_publications_status ON meridian_publications(tenant_id, status);

CREATE TABLE IF NOT EXISTS meridian_flipbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID NOT NULL REFERENCES meridian_publications(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  pdf_url TEXT NOT NULL,
  page_count INTEGER NOT NULL DEFAULT 0,
  settings JSONB DEFAULT '{"pageFlipAnimation":"flip","backgroundColor":"#1a1a2e","autoPlay":false,"autoPlayInterval":5000,"shareEnabled":true,"downloadEnabled":false,"showToolbar":true,"showPageCount":true}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_meridian_flipbooks_publication ON meridian_flipbooks(publication_id);
CREATE INDEX IF NOT EXISTS idx_meridian_flipbooks_tenant ON meridian_flipbooks(tenant_id);

CREATE TABLE IF NOT EXISTS meridian_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flipbook_id UUID NOT NULL REFERENCES meridian_flipbooks(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  text_content TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_meridian_pages_flipbook_page ON meridian_pages(flipbook_id, page_number);
CREATE INDEX IF NOT EXISTS idx_meridian_pages_flipbook ON meridian_pages(flipbook_id);

CREATE TABLE IF NOT EXISTS meridian_reader_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flipbook_id UUID NOT NULL REFERENCES meridian_flipbooks(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  session_id VARCHAR(128) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pages_viewed INTEGER NOT NULL DEFAULT 0,
  time_spent INTEGER NOT NULL DEFAULT 0,
  last_page INTEGER NOT NULL DEFAULT 1,
  user_agent TEXT,
  referrer TEXT
);
CREATE INDEX IF NOT EXISTS idx_meridian_sessions_flipbook ON meridian_reader_sessions(flipbook_id);
CREATE INDEX IF NOT EXISTS idx_meridian_sessions_tenant ON meridian_reader_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meridian_sessions_session ON meridian_reader_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_meridian_sessions_started ON meridian_reader_sessions(started_at);

CREATE TABLE IF NOT EXISTS meridian_page_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flipbook_id UUID NOT NULL REFERENCES meridian_flipbooks(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  avg_time_seconds REAL NOT NULL DEFAULT 0,
  bounce_count INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_meridian_analytics_flipbook_page ON meridian_page_analytics(flipbook_id, page_number);
CREATE INDEX IF NOT EXISTS idx_meridian_analytics_flipbook ON meridian_page_analytics(flipbook_id);
`;

const meridianPublishingPlugin: CmsPlugin = {
  id: 'meridian-publishing',
  name: 'Digital Publishing',
  version: '1.0.0',

  async register(ctx) {
    // Run schema migration
    await ctx.runMigration(MIGRATION_SQL);

    const {
      adminPublications,
      adminFlipbooks,
      adminAnalytics,
      publicFlipbooks,
    } = createRoutes(ctx.db);

    // Admin routes (mounted behind auth by the API integration layer)
    ctx.addRoutes('publications', adminPublications);
    ctx.addRoutes('flipbooks', adminFlipbooks);
    ctx.addRoutes('reader-analytics', adminAnalytics);

    // Public routes (no auth, accessed by slug)
    ctx.addPublicRoutes('flipbooks', publicFlipbooks);

    // Block types for the visual editor
    ctx.addBlockTypes([
      {
        type: 'flipbook',
        label: 'Flipbook Embed',
        category: 'Publishing',
      },
      {
        type: 'publication_list',
        label: 'Publication List',
        category: 'Publishing',
      },
    ]);

    // Admin navigation
    ctx.addAdminNav({
      title: 'Digital Publishing',
      siteScoped: true,
      items: [
        { label: 'Publications', icon: 'BookOpen', href: 'publications' },
        { label: 'Flipbooks', icon: 'Layers', href: 'flipbooks' },
        { label: 'Reader Analytics', icon: 'BarChart3', href: 'reader-analytics' },
      ],
    });

    // Admin routes for React lazy loading
    ctx.addAdminRoutes([
      { path: 'sites/:siteId/publications', component: '@meridian/publishing/admin/PublicationsList' },
      { path: 'sites/:siteId/publications/new', component: '@meridian/publishing/admin/PublicationEditor' },
      { path: 'sites/:siteId/publications/:id', component: '@meridian/publishing/admin/PublicationEditor' },
      { path: 'sites/:siteId/flipbooks', component: '@meridian/publishing/admin/FlipbooksList' },
      { path: 'sites/:siteId/flipbooks/:id', component: '@meridian/publishing/admin/FlipbookEditor' },
      { path: 'sites/:siteId/reader-analytics', component: '@meridian/publishing/admin/ReaderAnalytics' },
      { path: 'sites/:siteId/reader-analytics/:flipbookId', component: '@meridian/publishing/admin/FlipbookAnalytics' },
    ]);

    ctx.logger.info({ plugin: 'meridian-publishing' }, 'Meridian Digital Publishing plugin registered');
  },
};

export default meridianPublishingPlugin;

// Re-export schema for consumers
export {
  meridianPublications,
  meridianFlipbooks,
  meridianPages,
  meridianReaderSessions,
  meridianPageAnalytics,
} from './schema.js';

export type {
  Publication,
  InsertPublication,
  Flipbook,
  InsertFlipbook,
  FlipbookPage,
  ReaderSession,
  PageAnalytic,
  FlipbookSettings,
} from './schema.js';

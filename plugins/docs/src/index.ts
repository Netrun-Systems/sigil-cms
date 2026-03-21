/**
 * Documentation & Knowledge Base Plugin
 *
 * Provides article categories, full-text search, table of contents,
 * version history, and reader feedback ("Was this helpful?").
 *
 * Articles link to existing CMS pages via pageId — the block editor
 * is used for content authoring, and this plugin adds KB-specific
 * metadata, categorization, revisions, and public reading experience.
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createRoutes } from './routes.js';

const docsPlugin: CmsPlugin = {
  id: 'docs',
  name: 'Documentation & Knowledge Base',
  version: '1.0.0',

  async register(ctx) {
    // ── Migrations ──

    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_doc_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
        parent_id UUID REFERENCES cms_doc_categories(id),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(site_id, slug)
      );
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_doc_categories_site_parent
        ON cms_doc_categories(site_id, parent_id);
    `);

    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_doc_articles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
        page_id UUID NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
        category_id UUID REFERENCES cms_doc_categories(id),
        slug VARCHAR(255) NOT NULL,
        title VARCHAR(500) NOT NULL,
        excerpt TEXT,
        tags JSONB DEFAULT '[]',
        is_featured BOOLEAN NOT NULL DEFAULT false,
        is_pinned BOOLEAN NOT NULL DEFAULT false,
        view_count INTEGER NOT NULL DEFAULT 0,
        helpful_yes INTEGER NOT NULL DEFAULT 0,
        helpful_no INTEGER NOT NULL DEFAULT 0,
        last_revised_at TIMESTAMP,
        last_revised_by VARCHAR(255),
        revision_note TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(site_id, slug)
      );
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_doc_articles_site_category
        ON cms_doc_articles(site_id, category_id);
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_doc_articles_site_featured
        ON cms_doc_articles(site_id, is_featured);
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_doc_articles_tags
        ON cms_doc_articles USING gin(tags);
    `);

    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_doc_revisions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        article_id UUID NOT NULL REFERENCES cms_doc_articles(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        title VARCHAR(500) NOT NULL,
        excerpt TEXT,
        content JSONB NOT NULL,
        changed_by VARCHAR(255),
        change_note TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_doc_revisions_article_version
        ON cms_doc_revisions(article_id, version);
    `);

    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_doc_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        article_id UUID NOT NULL REFERENCES cms_doc_articles(id) ON DELETE CASCADE,
        is_helpful BOOLEAN NOT NULL,
        comment TEXT,
        session_id VARCHAR(100),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_doc_feedback_article
        ON cms_doc_feedback(article_id);
    `);

    // ── Routes ──

    const { adminRouter, publicRouter } = createRoutes(ctx.db, ctx.logger);

    ctx.addRoutes('docs', adminRouter);
    ctx.addPublicRoutes('docs/:siteSlug', publicRouter);

    // ── Block Types ──

    ctx.addBlockTypes([
      { type: 'doc_callout', label: 'Documentation Callout', category: 'Documentation' },
      { type: 'doc_code', label: 'Code Block', category: 'Documentation' },
    ]);

    // ── Admin Navigation ──

    ctx.addAdminNav({
      title: 'Knowledge Base',
      siteScoped: true,
      items: [
        { label: 'Articles', icon: 'FileText', href: 'docs/articles' },
        { label: 'Categories', icon: 'FolderTree', href: 'docs/categories' },
        { label: 'Feedback', icon: 'MessageCircle', href: 'docs/feedback' },
      ],
    });

    // ── Admin Routes ──

    ctx.addAdminRoutes([
      { path: 'sites/:siteId/docs/articles', component: '@netrun-cms/plugin-docs/admin/ArticlesList' },
      { path: 'sites/:siteId/docs/articles/new', component: '@netrun-cms/plugin-docs/admin/ArticleEditor' },
      { path: 'sites/:siteId/docs/articles/:id', component: '@netrun-cms/plugin-docs/admin/ArticleEditor' },
      { path: 'sites/:siteId/docs/articles/:id/revisions', component: '@netrun-cms/plugin-docs/admin/RevisionHistory' },
      { path: 'sites/:siteId/docs/categories', component: '@netrun-cms/plugin-docs/admin/CategoriesList' },
      { path: 'sites/:siteId/docs/feedback', component: '@netrun-cms/plugin-docs/admin/FeedbackList' },
    ]);
  },
};

export default docsPlugin;

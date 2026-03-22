/**
 * Blog Plugin — Full-featured blog engine for Sigil CMS
 *
 * Features:
 *   - Blog posts with markdown content, cover images, reading time
 *   - Categories (nested tree), tags, author profiles
 *   - Threaded comments with moderation
 *   - Revision history with revert
 *   - RSS 2.0, Atom 1.0, JSON Feed 1.1
 *   - Blog post sitemap.xml
 *   - Post scheduling (integrates with existing content scheduler)
 *   - AI-powered excerpt, SEO, tag suggestion, and post generation
 *   - 4 embeddable block types: blog_feed, blog_post_embed, blog_categories_nav, blog_author_card
 *
 * Public routes:  /api/v1/public/blog/:siteSlug
 * Admin routes:   /api/v1/sites/:siteId/blog
 * AI routes:      /api/v1/sites/:siteId/blog/ai
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createRoutes } from './routes.js';

const blogPlugin: CmsPlugin = {
  id: 'blog',
  name: 'Blog',
  version: '1.0.0',

  async register(ctx) {
    // ── Migrations ──

    // Blog authors
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_blog_authors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        user_id UUID,
        display_name VARCHAR(200) NOT NULL,
        bio TEXT,
        avatar_url TEXT,
        social_links JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(tenant_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_cms_blog_authors_tenant
        ON cms_blog_authors(tenant_id);
    `);

    // Blog categories
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_blog_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL,
        description TEXT,
        parent_id UUID,
        sort_order INTEGER NOT NULL DEFAULT 0,
        color VARCHAR(7),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(site_id, slug)
      );
      CREATE INDEX IF NOT EXISTS idx_cms_blog_categories_site
        ON cms_blog_categories(site_id);
      CREATE INDEX IF NOT EXISTS idx_cms_blog_categories_parent
        ON cms_blog_categories(parent_id);
    `);

    // Blog tags
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_blog_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
        name VARCHAR(50) NOT NULL,
        slug VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(site_id, slug)
      );
      CREATE INDEX IF NOT EXISTS idx_cms_blog_tags_site
        ON cms_blog_tags(site_id);
    `);

    // Blog posts
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_blog_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        slug VARCHAR(500) NOT NULL,
        excerpt TEXT,
        content TEXT NOT NULL,
        cover_image TEXT,
        author_id UUID REFERENCES cms_blog_authors(id) ON DELETE SET NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
        published_at TIMESTAMPTZ,
        scheduled_at TIMESTAMPTZ,
        reading_time_minutes INTEGER,
        featured BOOLEAN NOT NULL DEFAULT false,
        allow_comments BOOLEAN NOT NULL DEFAULT true,
        meta_title VARCHAR(70),
        meta_description TEXT,
        og_image TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(site_id, slug)
      );
      CREATE INDEX IF NOT EXISTS idx_cms_blog_posts_site_status
        ON cms_blog_posts(site_id, status);
      CREATE INDEX IF NOT EXISTS idx_cms_blog_posts_site_published_at
        ON cms_blog_posts(site_id, published_at);
      CREATE INDEX IF NOT EXISTS idx_cms_blog_posts_site_featured
        ON cms_blog_posts(site_id, featured);
      CREATE INDEX IF NOT EXISTS idx_cms_blog_posts_author
        ON cms_blog_posts(author_id);
      CREATE INDEX IF NOT EXISTS idx_cms_blog_posts_scheduled
        ON cms_blog_posts(status, scheduled_at);
    `);

    // Full-text search index
    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_blog_posts_fulltext
        ON cms_blog_posts
        USING GIN (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(excerpt, '') || ' ' || COALESCE(content, '')));
    `);

    // Post-categories junction
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_blog_post_categories (
        post_id UUID NOT NULL REFERENCES cms_blog_posts(id) ON DELETE CASCADE,
        category_id UUID NOT NULL REFERENCES cms_blog_categories(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, category_id)
      );
      CREATE INDEX IF NOT EXISTS idx_cms_blog_post_categories_post
        ON cms_blog_post_categories(post_id);
      CREATE INDEX IF NOT EXISTS idx_cms_blog_post_categories_category
        ON cms_blog_post_categories(category_id);
    `);

    // Post-tags junction
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_blog_post_tags (
        post_id UUID NOT NULL REFERENCES cms_blog_posts(id) ON DELETE CASCADE,
        tag_id UUID NOT NULL REFERENCES cms_blog_tags(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, tag_id)
      );
      CREATE INDEX IF NOT EXISTS idx_cms_blog_post_tags_post
        ON cms_blog_post_tags(post_id);
      CREATE INDEX IF NOT EXISTS idx_cms_blog_post_tags_tag
        ON cms_blog_post_tags(tag_id);
    `);

    // Comments
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_blog_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        post_id UUID NOT NULL REFERENCES cms_blog_posts(id) ON DELETE CASCADE,
        author_name VARCHAR(200) NOT NULL,
        author_email VARCHAR(320) NOT NULL,
        content TEXT NOT NULL,
        approved BOOLEAN NOT NULL DEFAULT false,
        parent_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_cms_blog_comments_post_approved
        ON cms_blog_comments(post_id, approved);
      CREATE INDEX IF NOT EXISTS idx_cms_blog_comments_parent
        ON cms_blog_comments(parent_id);
    `);

    // Post revisions
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_blog_post_revisions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES cms_blog_posts(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        revision_number INTEGER NOT NULL,
        author_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_cms_blog_revisions_post
        ON cms_blog_post_revisions(post_id, revision_number);
    `);

    // ── Routes ──

    const { adminRouter, publicRouter, aiRouter } = createRoutes(ctx.db, ctx.logger);

    ctx.addRoutes('blog', adminRouter);
    ctx.addRoutes('blog/ai', aiRouter);
    ctx.addPublicRoutes('blog/:siteSlug', publicRouter);

    // ── Block Types ──

    ctx.addBlockTypes([
      { type: 'blog_feed', label: 'Blog Feed', category: 'Blog' },
      { type: 'blog_post_embed', label: 'Blog Post Embed', category: 'Blog' },
      { type: 'blog_categories_nav', label: 'Blog Categories Nav', category: 'Blog' },
      { type: 'blog_author_card', label: 'Blog Author Card', category: 'Blog' },
    ]);

    // ── Admin Navigation ──

    ctx.addAdminNav({
      title: 'Blog',
      siteScoped: true,
      items: [
        { label: 'Posts', icon: 'FileText', href: 'blog' },
        { label: 'Categories', icon: 'FolderTree', href: 'blog/categories' },
        { label: 'Tags', icon: 'Tags', href: 'blog/tags' },
        { label: 'Authors', icon: 'Users', href: 'blog/authors' },
        { label: 'Comments', icon: 'MessageCircle', href: 'blog/comments' },
      ],
    });

    // ── Admin Routes ──

    ctx.addAdminRoutes([
      { path: 'sites/:siteId/blog', component: '@netrun-cms/plugin-blog/admin/PostsList' },
      { path: 'sites/:siteId/blog/new', component: '@netrun-cms/plugin-blog/admin/PostEditor' },
      { path: 'sites/:siteId/blog/posts/:id', component: '@netrun-cms/plugin-blog/admin/PostEditor' },
      { path: 'sites/:siteId/blog/categories', component: '@netrun-cms/plugin-blog/admin/CategoriesEditor' },
      { path: 'sites/:siteId/blog/tags', component: '@netrun-cms/plugin-blog/admin/TagsManager' },
      { path: 'sites/:siteId/blog/authors', component: '@netrun-cms/plugin-blog/admin/AuthorsList' },
      { path: 'sites/:siteId/blog/authors/:id', component: '@netrun-cms/plugin-blog/admin/AuthorEditor' },
      { path: 'sites/:siteId/blog/comments', component: '@netrun-cms/plugin-blog/admin/CommentsModeration' },
    ]);
  },
};

export default blogPlugin;

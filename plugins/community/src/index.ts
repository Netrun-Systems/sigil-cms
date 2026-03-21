/**
 * Community Forum Plugin — Stack Overflow meets Discourse as a CMS plugin
 *
 * Features:
 *   - Gated membership with magic-link email login (separate from CMS admin auth)
 *   - Discussion threads with replies (tree structure)
 *   - Community-written support articles
 *   - Up/down voting with reputation system
 *   - Tags, bookmarks, and fulltext search
 *   - Leaderboard with reputation titles
 *   - Moderation tools (pin, lock, close, ban)
 *
 * Public routes:  /api/v1/public/community/:siteSlug
 * Member routes:  /api/v1/public/community/:siteSlug/m (auth checked internally)
 * Admin routes:   /api/v1/sites/:siteId/community
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createPublicRoutes, createMemberRoutes, createAdminRoutes } from './routes.js';

const communityPlugin: CmsPlugin = {
  id: 'community',
  name: 'Community Forum',
  version: '1.0.0',

  async register(ctx) {
    // ── Migrations ──

    // Members table
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_community_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
        email VARCHAR(320) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        avatar_url TEXT,
        bio TEXT,
        role VARCHAR(20) NOT NULL DEFAULT 'member',
        reputation INTEGER NOT NULL DEFAULT 0,
        post_count INTEGER NOT NULL DEFAULT 0,
        is_verified BOOLEAN NOT NULL DEFAULT false,
        is_banned BOOLEAN NOT NULL DEFAULT false,
        verification_token UUID DEFAULT gen_random_uuid(),
        last_active_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(site_id, email)
      );
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_community_members_site_role
        ON cms_community_members(site_id, role);
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_community_members_site_reputation
        ON cms_community_members(site_id, reputation DESC);
    `);

    // Categories table
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_community_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        color VARCHAR(7),
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_locked BOOLEAN NOT NULL DEFAULT false,
        post_count INTEGER NOT NULL DEFAULT 0,
        last_post_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(site_id, slug)
      );
    `);

    // Posts table
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_community_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
        category_id UUID NOT NULL REFERENCES cms_community_categories(id) ON DELETE CASCADE,
        parent_id UUID,
        author_id UUID NOT NULL REFERENCES cms_community_members(id) ON DELETE CASCADE,
        title VARCHAR(500),
        slug VARCHAR(500),
        body TEXT NOT NULL,
        body_html TEXT,
        type VARCHAR(20) NOT NULL DEFAULT 'discussion',
        status VARCHAR(20) NOT NULL DEFAULT 'published',
        is_pinned BOOLEAN NOT NULL DEFAULT false,
        is_locked BOOLEAN NOT NULL DEFAULT false,
        is_solved BOOLEAN NOT NULL DEFAULT false,
        solved_answer_id UUID,
        view_count INTEGER NOT NULL DEFAULT 0,
        reply_count INTEGER NOT NULL DEFAULT 0,
        vote_score INTEGER NOT NULL DEFAULT 0,
        last_reply_at TIMESTAMP,
        edited_at TIMESTAMP,
        edited_by UUID,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_community_posts_site_cat_status
        ON cms_community_posts(site_id, category_id, status, created_at DESC);
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_community_posts_site_author
        ON cms_community_posts(site_id, author_id);
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_community_posts_site_type_status
        ON cms_community_posts(site_id, type, status);
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_community_posts_parent
        ON cms_community_posts(parent_id);
    `);

    // GIN fulltext index on title + body
    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_community_posts_fulltext
        ON cms_community_posts
        USING GIN (to_tsvector('english', COALESCE(title, '') || ' ' || body));
    `);

    // Votes table
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_community_votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES cms_community_posts(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES cms_community_members(id) ON DELETE CASCADE,
        value INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(post_id, member_id)
      );
    `);

    // Tags table
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_community_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
        name VARCHAR(50) NOT NULL,
        slug VARCHAR(50) NOT NULL,
        usage_count INTEGER NOT NULL DEFAULT 0,
        UNIQUE(site_id, slug)
      );
    `);

    // Post tags junction table
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_community_post_tags (
        post_id UUID NOT NULL REFERENCES cms_community_posts(id) ON DELETE CASCADE,
        tag_id UUID NOT NULL REFERENCES cms_community_tags(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, tag_id)
      );
    `);

    // Bookmarks table
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_community_bookmarks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        member_id UUID NOT NULL REFERENCES cms_community_members(id) ON DELETE CASCADE,
        post_id UUID NOT NULL REFERENCES cms_community_posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(member_id, post_id)
      );
    `);

    // ── Routes ──

    const publicRouter = createPublicRoutes(ctx.db, ctx.logger);
    const memberRouter = createMemberRoutes(ctx.db, ctx.logger);
    const adminRouter = createAdminRoutes(ctx.db, ctx.logger);

    // Public: registration, login, browsing (no auth)
    ctx.addPublicRoutes('community/:siteSlug', publicRouter);

    // Member: authenticated community member actions (auth checked internally via authenticateMember middleware)
    ctx.addPublicRoutes('community/:siteSlug/m', memberRouter);

    // Admin: moderator/admin actions (uses CMS admin auth via addRoutes)
    ctx.addRoutes('community', adminRouter);

    // ── Block Types ──

    ctx.addBlockTypes([
      { type: 'community_feed', label: 'Community Feed', category: 'Community' },
      { type: 'community_leaderboard', label: 'Leaderboard', category: 'Community' },
      { type: 'community_search', label: 'Community Search', category: 'Community' },
    ]);

    // ── Admin Navigation ──

    ctx.addAdminNav({
      title: 'Community',
      siteScoped: true,
      items: [
        { label: 'Forum', icon: 'MessageSquare', href: 'community' },
        { label: 'Members', icon: 'Users', href: 'community/members' },
      ],
    });

    // ── Admin Routes ──

    ctx.addAdminRoutes([
      { path: 'sites/:siteId/community', component: '@netrun-cms/plugin-community/admin/ForumDashboard' },
      { path: 'sites/:siteId/community/members', component: '@netrun-cms/plugin-community/admin/MembersList' },
      { path: 'sites/:siteId/community/members/:id', component: '@netrun-cms/plugin-community/admin/MemberDetail' },
      { path: 'sites/:siteId/community/categories', component: '@netrun-cms/plugin-community/admin/CategoriesList' },
      { path: 'sites/:siteId/community/posts/:id', component: '@netrun-cms/plugin-community/admin/PostDetail' },
    ]);
  },
};

export default communityPlugin;

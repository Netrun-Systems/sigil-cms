/**
 * GraphQL Resolvers
 *
 * Wires GraphQL queries to existing Drizzle queries from controllers.
 * Reuses the same DB layer — no business logic duplication.
 */

import { eq, and, asc, desc, count, like, or, isNull } from 'drizzle-orm';
import { sites, pages, contentBlocks, themes, media, pageRevisions } from '@netrun-cms/db';
import { getDb } from '../db.js';

// ---------------------------------------------------------------------------
// Helper: build a flat page list into a tree
// ---------------------------------------------------------------------------

interface PageRow {
  id: string;
  title: string;
  slug: string;
  fullPath: string | null;
  status: string;
  template: string;
  sortOrder: number;
  parentId: string | null;
}

interface TreeNode extends PageRow {
  children: TreeNode[];
}

function buildTree(rows: PageRow[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const row of rows) {
    map.set(row.id, { ...row, children: [] });
  }

  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

// ---------------------------------------------------------------------------
// Context type passed through graphql-http
// ---------------------------------------------------------------------------

export interface GraphQLContext {
  tenantId?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Resolvers
// ---------------------------------------------------------------------------

export const resolvers = {
  // =========================================================================
  // Admin queries (caller must set tenantId in context)
  // =========================================================================

  sites: async (
    args: { status?: string; page?: number; limit?: number },
    context: GraphQLContext,
  ) => {
    const db = getDb();
    const tenantId = context.tenantId;
    if (!tenantId) throw new Error('Authentication required');

    const conditions = [eq(sites.tenantId, tenantId)];
    if (args.status) conditions.push(eq(sites.status, args.status));

    return db
      .select()
      .from(sites)
      .where(and(...conditions))
      .orderBy(desc(sites.updatedAt));
  },

  site: async (args: { id: string }, context: GraphQLContext) => {
    const db = getDb();
    const tenantId = context.tenantId;
    if (!tenantId) throw new Error('Authentication required');

    const [row] = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, args.id), eq(sites.tenantId, tenantId)))
      .limit(1);

    return row ?? null;
  },

  pages: async (
    args: {
      siteId: string;
      status?: string;
      parentId?: string;
      language?: string;
      page?: number;
      limit?: number;
    },
    context: GraphQLContext,
  ) => {
    const db = getDb();
    const tenantId = context.tenantId;
    if (!tenantId) throw new Error('Authentication required');

    // Verify site belongs to tenant
    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, args.siteId), eq(sites.tenantId, tenantId)))
      .limit(1);
    if (!site) throw new Error(`Site ${args.siteId} not found`);

    const conditions = [eq(pages.siteId, args.siteId)];
    if (args.status) conditions.push(eq(pages.status, args.status));
    if (args.language) conditions.push(eq(pages.language, args.language));
    if (args.parentId === 'null' || args.parentId === '') {
      conditions.push(isNull(pages.parentId));
    } else if (args.parentId) {
      conditions.push(eq(pages.parentId, args.parentId));
    }

    const pageNum = Math.max(1, args.page ?? 1);
    const limit = Math.min(100, Math.max(1, args.limit ?? 20));
    const offset = (pageNum - 1) * limit;

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(pages)
      .where(and(...conditions));

    const data = await db
      .select()
      .from(pages)
      .where(and(...conditions))
      .orderBy(asc(pages.sortOrder), desc(pages.updatedAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: {
        page: pageNum,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  page: async (
    args: { siteId: string; id: string },
    context: GraphQLContext,
  ) => {
    const db = getDb();
    const tenantId = context.tenantId;
    if (!tenantId) throw new Error('Authentication required');

    // Verify site belongs to tenant
    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, args.siteId), eq(sites.tenantId, tenantId)))
      .limit(1);
    if (!site) return null;

    const [row] = await db
      .select()
      .from(pages)
      .where(and(eq(pages.id, args.id), eq(pages.siteId, args.siteId)))
      .limit(1);

    return row ?? null;
  },

  blocks: async (
    args: { siteId: string; pageId: string },
    context: GraphQLContext,
  ) => {
    const db = getDb();
    const tenantId = context.tenantId;
    if (!tenantId) throw new Error('Authentication required');

    // Verify site belongs to tenant
    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, args.siteId), eq(sites.tenantId, tenantId)))
      .limit(1);
    if (!site) throw new Error(`Site ${args.siteId} not found`);

    return db
      .select()
      .from(contentBlocks)
      .where(eq(contentBlocks.pageId, args.pageId))
      .orderBy(asc(contentBlocks.sortOrder));
  },

  media: async (
    args: {
      siteId: string;
      folder?: string;
      mimeType?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
    context: GraphQLContext,
  ) => {
    const db = getDb();
    const tenantId = context.tenantId;
    if (!tenantId) throw new Error('Authentication required');

    // Verify site belongs to tenant
    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, args.siteId), eq(sites.tenantId, tenantId)))
      .limit(1);
    if (!site) throw new Error(`Site ${args.siteId} not found`);

    const conditions = [eq(media.siteId, args.siteId)];
    if (args.folder) conditions.push(eq(media.folder, args.folder));
    if (args.mimeType) {
      if (args.mimeType.includes('/')) {
        conditions.push(eq(media.mimeType, args.mimeType));
      } else {
        conditions.push(like(media.mimeType, `${args.mimeType}/%`));
      }
    }
    if (args.search) {
      conditions.push(
        or(
          like(media.filename, `%${args.search}%`),
          like(media.originalFilename, `%${args.search}%`),
          like(media.altText, `%${args.search}%`),
        )!,
      );
    }

    const pageNum = Math.max(1, args.page ?? 1);
    const limit = Math.min(100, Math.max(1, args.limit ?? 20));
    const offset = (pageNum - 1) * limit;

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(media)
      .where(and(...conditions));

    const data = await db
      .select()
      .from(media)
      .where(and(...conditions))
      .orderBy(desc(media.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: {
        page: pageNum,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  themes: async (args: { siteId: string }, context: GraphQLContext) => {
    const db = getDb();
    const tenantId = context.tenantId;
    if (!tenantId) throw new Error('Authentication required');

    // Verify site belongs to tenant
    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, args.siteId), eq(sites.tenantId, tenantId)))
      .limit(1);
    if (!site) throw new Error(`Site ${args.siteId} not found`);

    return db
      .select()
      .from(themes)
      .where(eq(themes.siteId, args.siteId))
      .orderBy(desc(themes.isActive), desc(themes.updatedAt));
  },

  activeTheme: async (args: { siteId: string }, context: GraphQLContext) => {
    const db = getDb();
    const tenantId = context.tenantId;
    if (!tenantId) throw new Error('Authentication required');

    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, args.siteId), eq(sites.tenantId, tenantId)))
      .limit(1);
    if (!site) return null;

    const [row] = await db
      .select()
      .from(themes)
      .where(and(eq(themes.siteId, args.siteId), eq(themes.isActive, true)))
      .limit(1);

    return row ?? null;
  },

  revisions: async (
    args: { siteId: string; pageId: string },
    context: GraphQLContext,
  ) => {
    const db = getDb();
    const tenantId = context.tenantId;
    if (!tenantId) throw new Error('Authentication required');

    // Verify site belongs to tenant
    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, args.siteId), eq(sites.tenantId, tenantId)))
      .limit(1);
    if (!site) throw new Error(`Site ${args.siteId} not found`);

    return db
      .select()
      .from(pageRevisions)
      .where(eq(pageRevisions.pageId, args.pageId))
      .orderBy(desc(pageRevisions.version));
  },

  // =========================================================================
  // Public queries (no auth required)
  // =========================================================================

  pageBySlug: async (args: {
    siteSlug: string;
    pageSlug: string;
    lang?: string;
  }) => {
    const db = getDb();

    const [site] = await db
      .select({ id: sites.id, defaultLanguage: sites.defaultLanguage })
      .from(sites)
      .where(and(eq(sites.slug, args.siteSlug), eq(sites.status, 'published')))
      .limit(1);
    if (!site) return null;

    // Try requested language first
    if (args.lang) {
      const [langPage] = await db
        .select()
        .from(pages)
        .where(
          and(
            eq(pages.siteId, site.id),
            eq(pages.slug, args.pageSlug),
            eq(pages.status, 'published'),
            eq(pages.language, args.lang),
          ),
        )
        .limit(1);
      if (langPage) {
        const blocks = await db
          .select()
          .from(contentBlocks)
          .where(
            and(
              eq(contentBlocks.pageId, langPage.id),
              eq(contentBlocks.isVisible, true),
            ),
          )
          .orderBy(asc(contentBlocks.sortOrder));
        return { ...langPage, blocks };
      }
    }

    // Fallback to default language
    const [page] = await db
      .select()
      .from(pages)
      .where(
        and(
          eq(pages.siteId, site.id),
          eq(pages.slug, args.pageSlug),
          eq(pages.status, 'published'),
          eq(pages.language, site.defaultLanguage),
        ),
      )
      .limit(1);

    // Last resort: any published page with that slug
    const target =
      page ??
      (
        await db
          .select()
          .from(pages)
          .where(
            and(
              eq(pages.siteId, site.id),
              eq(pages.slug, args.pageSlug),
              eq(pages.status, 'published'),
            ),
          )
          .limit(1)
      )[0];

    if (!target) return null;

    const blocks = await db
      .select()
      .from(contentBlocks)
      .where(
        and(
          eq(contentBlocks.pageId, target.id),
          eq(contentBlocks.isVisible, true),
        ),
      )
      .orderBy(asc(contentBlocks.sortOrder));

    return { ...target, blocks };
  },

  pageTree: async (args: { siteSlug: string }) => {
    const db = getDb();

    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.slug, args.siteSlug), eq(sites.status, 'published')))
      .limit(1);
    if (!site) return [];

    const rows = await db
      .select({
        id: pages.id,
        title: pages.title,
        slug: pages.slug,
        fullPath: pages.fullPath,
        status: pages.status,
        template: pages.template,
        sortOrder: pages.sortOrder,
        parentId: pages.parentId,
      })
      .from(pages)
      .where(and(eq(pages.siteId, site.id), eq(pages.status, 'published')))
      .orderBy(asc(pages.sortOrder));

    return buildTree(rows);
  },

  publicTheme: async (args: { siteSlug: string }) => {
    const db = getDb();

    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.slug, args.siteSlug), eq(sites.status, 'published')))
      .limit(1);
    if (!site) return null;

    const [row] = await db
      .select()
      .from(themes)
      .where(and(eq(themes.siteId, site.id), eq(themes.isActive, true)))
      .limit(1);

    return row ?? null;
  },

  siteByDomain: async (args: { domain: string }) => {
    const db = getDb();
    const domain = args.domain.toLowerCase().trim();

    const [row] = await db
      .select()
      .from(sites)
      .where(and(eq(sites.domain, domain), eq(sites.status, 'published')))
      .limit(1);

    return row ?? null;
  },
};

// ---------------------------------------------------------------------------
// Field resolver for Page.blocks (lazy-loaded when requested)
// ---------------------------------------------------------------------------

export const pageBlocksResolver = async (page: { id: string }) => {
  const db = getDb();
  return db
    .select()
    .from(contentBlocks)
    .where(eq(contentBlocks.pageId, page.id))
    .orderBy(asc(contentBlocks.sortOrder));
};

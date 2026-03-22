// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * Blog Plugin Routes
 *
 * Admin routes:   /api/v1/sites/:siteId/blog/...
 * Public routes:  /api/v1/public/blog/:siteSlug/...
 */

import { Router, type Request, type Response } from 'express';
import { eq, and, desc, asc, sql, inArray, ilike, lte, count as drizzleCount } from 'drizzle-orm';
import { sites } from '@netrun-cms/db';
import {
  blogPosts,
  blogCategories,
  blogTags,
  blogPostCategories,
  blogPostTags,
  blogAuthors,
  blogComments,
  blogPostRevisions,
} from './schema.js';
import { generateRss, generateAtom, generateJsonFeed, generateSitemap } from './lib/feeds.js';
import { estimateReadingTime } from './lib/reading-time.js';
import type { PluginLogger } from '@netrun-cms/plugin-runtime';
import type { Router as RouterType } from 'express';

interface BlogRoutes {
  adminRouter: RouterType;
  publicRouter: RouterType;
  aiRouter: RouterType;
}

export function createRoutes(db: any, logger: PluginLogger): BlogRoutes {
  const adminRouter = Router({ mergeParams: true });
  const publicRouter = Router({ mergeParams: true });
  const aiRouter = Router({ mergeParams: true });

  const d = db as any;

  // Helper: get site by slug
  async function getSiteBySlug(siteSlug: string) {
    const [site] = await d.select().from(sites).where(eq(sites.slug, siteSlug)).limit(1);
    return site || null;
  }

  // Helper: get tenant context from siteId (admin routes have siteId in params)
  async function getTenantFromSiteId(siteId: string) {
    const [site] = await d.select().from(sites).where(eq(sites.id, siteId)).limit(1);
    return site || null;
  }

  // ===========================================================================
  // ADMIN: POSTS
  // ===========================================================================

  /**
   * GET /posts — list posts (filterable, paginated)
   * Query: ?status, ?categoryId, ?tagId, ?authorId, ?search, ?page, ?limit, ?featured
   */
  adminRouter.get('/posts', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const {
        status, categoryId, tagId, authorId, search, featured,
        page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc',
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
      const offset = (pageNum - 1) * limitNum;

      const conditions: any[] = [eq(blogPosts.siteId, siteId)];

      if (status) conditions.push(eq(blogPosts.status, status as string));
      if (authorId) conditions.push(eq(blogPosts.authorId, authorId as string));
      if (featured === 'true') conditions.push(eq(blogPosts.featured, true));
      if (search) {
        conditions.push(
          sql`to_tsvector('english', COALESCE(${blogPosts.title}, '') || ' ' || COALESCE(${blogPosts.excerpt}, '') || ' ' || COALESCE(${blogPosts.content}, '')) @@ plainto_tsquery('english', ${search as string})`
        );
      }

      // Handle category filter via junction table
      let postIdsFromCategory: string[] | null = null;
      if (categoryId) {
        const catPosts = await d.select({ postId: blogPostCategories.postId })
          .from(blogPostCategories)
          .where(eq(blogPostCategories.categoryId, categoryId as string));
        postIdsFromCategory = catPosts.map((r: any) => r.postId);
        if (postIdsFromCategory.length === 0) {
          res.json({ success: true, data: [], pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 } });
          return;
        }
        conditions.push(inArray(blogPosts.id, postIdsFromCategory));
      }

      // Handle tag filter via junction table
      if (tagId) {
        const tagPosts = await d.select({ postId: blogPostTags.postId })
          .from(blogPostTags)
          .where(eq(blogPostTags.tagId, tagId as string));
        const postIdsFromTag = tagPosts.map((r: any) => r.postId);
        if (postIdsFromTag.length === 0) {
          res.json({ success: true, data: [], pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 } });
          return;
        }
        conditions.push(inArray(blogPosts.id, postIdsFromTag));
      }

      const where = and(...conditions);

      const [{ count: total }] = await d.select({ count: sql<number>`COUNT(*)` })
        .from(blogPosts).where(where);

      const orderCol = sortBy === 'publishedAt' ? blogPosts.publishedAt : blogPosts.createdAt;
      const orderFn = sortOrder === 'asc' ? asc : desc;

      const posts = await d.select().from(blogPosts)
        .where(where)
        .orderBy(orderFn(orderCol))
        .limit(limitNum)
        .offset(offset);

      // Attach categories, tags, and author for each post
      const enriched = await Promise.all(posts.map(async (post: any) => {
        const [cats, tags, author] = await Promise.all([
          d.select({ id: blogCategories.id, name: blogCategories.name, slug: blogCategories.slug })
            .from(blogPostCategories)
            .innerJoin(blogCategories, eq(blogPostCategories.categoryId, blogCategories.id))
            .where(eq(blogPostCategories.postId, post.id)),
          d.select({ id: blogTags.id, name: blogTags.name, slug: blogTags.slug })
            .from(blogPostTags)
            .innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id))
            .where(eq(blogPostTags.postId, post.id)),
          post.authorId
            ? d.select().from(blogAuthors).where(eq(blogAuthors.id, post.authorId)).limit(1).then((r: any[]) => r[0] || null)
            : null,
        ]);
        return { ...post, categories: cats, tags, author };
      }));

      res.json({
        success: true,
        data: enriched,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: Number(total),
          totalPages: Math.ceil(Number(total) / limitNum),
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to list blog posts');
      res.status(500).json({ success: false, error: { message: 'Failed to list posts' } });
    }
  });

  /**
   * GET /posts/featured — featured posts
   */
  adminRouter.get('/posts/featured', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const rows = await d.select().from(blogPosts)
        .where(and(eq(blogPosts.siteId, siteId), eq(blogPosts.featured, true)))
        .orderBy(desc(blogPosts.publishedAt))
        .limit(10);
      res.json({ success: true, data: rows });
    } catch (err) {
      logger.error({ err }, 'Failed to list featured posts');
      res.status(500).json({ success: false, error: { message: 'Failed to list featured posts' } });
    }
  });

  /**
   * POST /posts — create post
   */
  adminRouter.post('/posts', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const site = await getTenantFromSiteId(siteId);
      if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

      const {
        title, slug, excerpt, content, coverImage, authorId,
        status = 'draft', scheduledAt, featured = false,
        allowComments = true, metaTitle, metaDescription, ogImage,
        categoryIds = [], tagIds = [],
      } = req.body;

      const readingTime = estimateReadingTime(content || '');

      const [post] = await d.insert(blogPosts).values({
        tenantId: site.tenantId,
        siteId,
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        excerpt,
        content,
        coverImage,
        authorId,
        status,
        publishedAt: status === 'published' ? new Date() : null,
        scheduledAt: status === 'scheduled' && scheduledAt ? new Date(scheduledAt) : null,
        readingTimeMinutes: readingTime,
        featured,
        allowComments,
        metaTitle,
        metaDescription,
        ogImage,
      }).returning();

      // Link categories
      if (categoryIds.length > 0) {
        await d.insert(blogPostCategories).values(
          categoryIds.map((cid: string) => ({ postId: post.id, categoryId: cid }))
        );
      }

      // Link tags
      if (tagIds.length > 0) {
        await d.insert(blogPostTags).values(
          tagIds.map((tid: string) => ({ postId: post.id, tagId: tid }))
        );
      }

      // Create initial revision
      await d.insert(blogPostRevisions).values({
        postId: post.id,
        title: post.title,
        content: post.content,
        revisionNumber: 1,
        authorId: authorId || null,
      });

      logger.info({ postId: post.id, title }, 'Blog post created');
      res.status(201).json({ success: true, data: post });
    } catch (err) {
      logger.error({ err }, 'Failed to create blog post');
      res.status(500).json({ success: false, error: { message: 'Failed to create post' } });
    }
  });

  /**
   * GET /posts/:id — get single post with categories + tags + author
   */
  adminRouter.get('/posts/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [post] = await d.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
      if (!post) { res.status(404).json({ success: false, error: { message: 'Post not found' } }); return; }

      const [cats, tags, author] = await Promise.all([
        d.select({ id: blogCategories.id, name: blogCategories.name, slug: blogCategories.slug, color: blogCategories.color })
          .from(blogPostCategories)
          .innerJoin(blogCategories, eq(blogPostCategories.categoryId, blogCategories.id))
          .where(eq(blogPostCategories.postId, id)),
        d.select({ id: blogTags.id, name: blogTags.name, slug: blogTags.slug })
          .from(blogPostTags)
          .innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id))
          .where(eq(blogPostTags.postId, id)),
        post.authorId
          ? d.select().from(blogAuthors).where(eq(blogAuthors.id, post.authorId)).limit(1).then((r: any[]) => r[0] || null)
          : null,
      ]);

      res.json({ success: true, data: { ...post, categories: cats, tags, author } });
    } catch (err) {
      logger.error({ err }, 'Failed to get blog post');
      res.status(500).json({ success: false, error: { message: 'Failed to get post' } });
    }
  });

  /**
   * PUT /posts/:id — update post
   */
  adminRouter.put('/posts/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [existing] = await d.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
      if (!existing) { res.status(404).json({ success: false, error: { message: 'Post not found' } }); return; }

      const {
        title, slug, excerpt, content, coverImage, authorId,
        status, scheduledAt, featured, allowComments,
        metaTitle, metaDescription, ogImage,
        categoryIds, tagIds,
      } = req.body;

      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (title !== undefined) updateData.title = title;
      if (slug !== undefined) updateData.slug = slug;
      if (excerpt !== undefined) updateData.excerpt = excerpt;
      if (content !== undefined) {
        updateData.content = content;
        updateData.readingTimeMinutes = estimateReadingTime(content);
      }
      if (coverImage !== undefined) updateData.coverImage = coverImage;
      if (authorId !== undefined) updateData.authorId = authorId;
      if (featured !== undefined) updateData.featured = featured;
      if (allowComments !== undefined) updateData.allowComments = allowComments;
      if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
      if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
      if (ogImage !== undefined) updateData.ogImage = ogImage;

      if (status !== undefined) {
        updateData.status = status;
        if (status === 'published' && existing.status !== 'published') {
          updateData.publishedAt = new Date();
        }
        if (status === 'scheduled' && scheduledAt) {
          updateData.scheduledAt = new Date(scheduledAt);
        }
        if (status === 'draft') {
          updateData.scheduledAt = null;
        }
      }

      const [updated] = await d.update(blogPosts).set(updateData).where(eq(blogPosts.id, id)).returning();

      // Update category links
      if (categoryIds !== undefined) {
        await d.delete(blogPostCategories).where(eq(blogPostCategories.postId, id));
        if (categoryIds.length > 0) {
          await d.insert(blogPostCategories).values(
            categoryIds.map((cid: string) => ({ postId: id, categoryId: cid }))
          );
        }
      }

      // Update tag links
      if (tagIds !== undefined) {
        await d.delete(blogPostTags).where(eq(blogPostTags.postId, id));
        if (tagIds.length > 0) {
          await d.insert(blogPostTags).values(
            tagIds.map((tid: string) => ({ postId: id, tagId: tid }))
          );
        }
      }

      // Save revision if content or title changed
      if (content !== undefined || title !== undefined) {
        const [lastRev] = await d.select({ revisionNumber: blogPostRevisions.revisionNumber })
          .from(blogPostRevisions)
          .where(eq(blogPostRevisions.postId, id))
          .orderBy(desc(blogPostRevisions.revisionNumber))
          .limit(1);

        await d.insert(blogPostRevisions).values({
          postId: id,
          title: updated.title,
          content: updated.content,
          revisionNumber: (lastRev?.revisionNumber || 0) + 1,
          authorId: authorId || existing.authorId || null,
        });
      }

      logger.info({ postId: id }, 'Blog post updated');
      res.json({ success: true, data: updated });
    } catch (err) {
      logger.error({ err }, 'Failed to update blog post');
      res.status(500).json({ success: false, error: { message: 'Failed to update post' } });
    }
  });

  /**
   * DELETE /posts/:id — soft delete (archive)
   */
  adminRouter.delete('/posts/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [updated] = await d.update(blogPosts)
        .set({ status: 'archived', updatedAt: new Date() })
        .where(eq(blogPosts.id, id))
        .returning();
      if (!updated) { res.status(404).json({ success: false, error: { message: 'Post not found' } }); return; }
      logger.info({ postId: id }, 'Blog post archived');
      res.json({ success: true, data: updated });
    } catch (err) {
      logger.error({ err }, 'Failed to archive blog post');
      res.status(500).json({ success: false, error: { message: 'Failed to archive post' } });
    }
  });

  /**
   * POST /posts/:id/publish — publish now
   */
  adminRouter.post('/posts/:id/publish', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [updated] = await d.update(blogPosts)
        .set({ status: 'published', publishedAt: new Date(), scheduledAt: null, updatedAt: new Date() })
        .where(eq(blogPosts.id, id))
        .returning();
      if (!updated) { res.status(404).json({ success: false, error: { message: 'Post not found' } }); return; }
      logger.info({ postId: id }, 'Blog post published');
      res.json({ success: true, data: updated });
    } catch (err) {
      logger.error({ err }, 'Failed to publish blog post');
      res.status(500).json({ success: false, error: { message: 'Failed to publish post' } });
    }
  });

  /**
   * POST /posts/:id/schedule — schedule for future publish
   */
  adminRouter.post('/posts/:id/schedule', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { scheduledAt } = req.body;
      if (!scheduledAt) {
        res.status(400).json({ success: false, error: { message: 'scheduledAt is required' } });
        return;
      }
      const [updated] = await d.update(blogPosts)
        .set({ status: 'scheduled', scheduledAt: new Date(scheduledAt), updatedAt: new Date() })
        .where(eq(blogPosts.id, id))
        .returning();
      if (!updated) { res.status(404).json({ success: false, error: { message: 'Post not found' } }); return; }
      logger.info({ postId: id, scheduledAt }, 'Blog post scheduled');
      res.json({ success: true, data: updated });
    } catch (err) {
      logger.error({ err }, 'Failed to schedule blog post');
      res.status(500).json({ success: false, error: { message: 'Failed to schedule post' } });
    }
  });

  /**
   * GET /posts/:id/revisions — revision history
   */
  adminRouter.get('/posts/:id/revisions', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const revisions = await d.select().from(blogPostRevisions)
        .where(eq(blogPostRevisions.postId, id))
        .orderBy(desc(blogPostRevisions.revisionNumber));
      res.json({ success: true, data: revisions });
    } catch (err) {
      logger.error({ err }, 'Failed to list revisions');
      res.status(500).json({ success: false, error: { message: 'Failed to list revisions' } });
    }
  });

  /**
   * POST /posts/:id/revisions/:revId/revert — revert to a revision
   */
  adminRouter.post('/posts/:id/revisions/:revId/revert', async (req: Request, res: Response) => {
    try {
      const { id, revId } = req.params;
      const [rev] = await d.select().from(blogPostRevisions)
        .where(and(eq(blogPostRevisions.id, revId), eq(blogPostRevisions.postId, id)))
        .limit(1);
      if (!rev) { res.status(404).json({ success: false, error: { message: 'Revision not found' } }); return; }

      const [updated] = await d.update(blogPosts)
        .set({
          title: rev.title,
          content: rev.content,
          readingTimeMinutes: estimateReadingTime(rev.content),
          updatedAt: new Date(),
        })
        .where(eq(blogPosts.id, id))
        .returning();

      // Create new revision for the revert
      const [lastRev] = await d.select({ revisionNumber: blogPostRevisions.revisionNumber })
        .from(blogPostRevisions)
        .where(eq(blogPostRevisions.postId, id))
        .orderBy(desc(blogPostRevisions.revisionNumber))
        .limit(1);

      await d.insert(blogPostRevisions).values({
        postId: id,
        title: rev.title,
        content: rev.content,
        revisionNumber: (lastRev?.revisionNumber || 0) + 1,
        authorId: rev.authorId,
      });

      logger.info({ postId: id, revertedTo: revId }, 'Blog post reverted');
      res.json({ success: true, data: updated });
    } catch (err) {
      logger.error({ err }, 'Failed to revert blog post');
      res.status(500).json({ success: false, error: { message: 'Failed to revert post' } });
    }
  });

  // ===========================================================================
  // ADMIN: CATEGORIES
  // ===========================================================================

  adminRouter.get('/categories', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const cats = await d.select().from(blogCategories)
        .where(eq(blogCategories.siteId, siteId))
        .orderBy(asc(blogCategories.sortOrder), asc(blogCategories.name));

      // Build tree structure
      const map = new Map<string, any>();
      const roots: any[] = [];
      for (const c of cats) {
        map.set(c.id, { ...c, children: [] });
      }
      for (const c of cats) {
        const node = map.get(c.id)!;
        if (c.parentId && map.has(c.parentId)) {
          map.get(c.parentId)!.children.push(node);
        } else {
          roots.push(node);
        }
      }

      res.json({ success: true, data: roots });
    } catch (err) {
      logger.error({ err }, 'Failed to list categories');
      res.status(500).json({ success: false, error: { message: 'Failed to list categories' } });
    }
  });

  adminRouter.post('/categories', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const site = await getTenantFromSiteId(siteId);
      if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

      const { name, slug, description, parentId, sortOrder = 0, color } = req.body;
      const [cat] = await d.insert(blogCategories).values({
        tenantId: site.tenantId,
        siteId,
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description,
        parentId,
        sortOrder,
        color,
      }).returning();

      res.status(201).json({ success: true, data: cat });
    } catch (err) {
      logger.error({ err }, 'Failed to create category');
      res.status(500).json({ success: false, error: { message: 'Failed to create category' } });
    }
  });

  adminRouter.put('/categories/:catId', async (req: Request, res: Response) => {
    try {
      const { catId } = req.params;
      const { name, slug, description, parentId, sortOrder, color } = req.body;
      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (name !== undefined) updateData.name = name;
      if (slug !== undefined) updateData.slug = slug;
      if (description !== undefined) updateData.description = description;
      if (parentId !== undefined) updateData.parentId = parentId;
      if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
      if (color !== undefined) updateData.color = color;

      const [updated] = await d.update(blogCategories).set(updateData).where(eq(blogCategories.id, catId)).returning();
      if (!updated) { res.status(404).json({ success: false, error: { message: 'Category not found' } }); return; }
      res.json({ success: true, data: updated });
    } catch (err) {
      logger.error({ err }, 'Failed to update category');
      res.status(500).json({ success: false, error: { message: 'Failed to update category' } });
    }
  });

  adminRouter.delete('/categories/:catId', async (req: Request, res: Response) => {
    try {
      const { catId } = req.params;
      await d.delete(blogPostCategories).where(eq(blogPostCategories.categoryId, catId));
      const deleted = await d.delete(blogCategories).where(eq(blogCategories.id, catId)).returning();
      if (deleted.length === 0) { res.status(404).json({ success: false, error: { message: 'Category not found' } }); return; }
      res.json({ success: true, message: 'Category deleted' });
    } catch (err) {
      logger.error({ err }, 'Failed to delete category');
      res.status(500).json({ success: false, error: { message: 'Failed to delete category' } });
    }
  });

  // ===========================================================================
  // ADMIN: TAGS
  // ===========================================================================

  adminRouter.get('/tags', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const tags = await d.select({
        id: blogTags.id,
        name: blogTags.name,
        slug: blogTags.slug,
        postCount: sql<number>`(SELECT COUNT(*) FROM cms_blog_post_tags WHERE tag_id = ${blogTags.id})`,
      })
        .from(blogTags)
        .where(eq(blogTags.siteId, siteId))
        .orderBy(asc(blogTags.name));
      res.json({ success: true, data: tags });
    } catch (err) {
      logger.error({ err }, 'Failed to list tags');
      res.status(500).json({ success: false, error: { message: 'Failed to list tags' } });
    }
  });

  adminRouter.post('/tags', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const site = await getTenantFromSiteId(siteId);
      if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

      const { name, slug } = req.body;
      const [tag] = await d.insert(blogTags).values({
        tenantId: site.tenantId,
        siteId,
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }).returning();
      res.status(201).json({ success: true, data: tag });
    } catch (err) {
      logger.error({ err }, 'Failed to create tag');
      res.status(500).json({ success: false, error: { message: 'Failed to create tag' } });
    }
  });

  adminRouter.delete('/tags/:tagId', async (req: Request, res: Response) => {
    try {
      const { tagId } = req.params;
      await d.delete(blogPostTags).where(eq(blogPostTags.tagId, tagId));
      const deleted = await d.delete(blogTags).where(eq(blogTags.id, tagId)).returning();
      if (deleted.length === 0) { res.status(404).json({ success: false, error: { message: 'Tag not found' } }); return; }
      res.json({ success: true, message: 'Tag deleted' });
    } catch (err) {
      logger.error({ err }, 'Failed to delete tag');
      res.status(500).json({ success: false, error: { message: 'Failed to delete tag' } });
    }
  });

  // ===========================================================================
  // ADMIN: AUTHORS
  // ===========================================================================

  adminRouter.get('/authors', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const site = await getTenantFromSiteId(siteId);
      if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

      const authors = await d.select().from(blogAuthors)
        .where(eq(blogAuthors.tenantId, site.tenantId))
        .orderBy(asc(blogAuthors.displayName));
      res.json({ success: true, data: authors });
    } catch (err) {
      logger.error({ err }, 'Failed to list authors');
      res.status(500).json({ success: false, error: { message: 'Failed to list authors' } });
    }
  });

  adminRouter.get('/authors/:authorId', async (req: Request, res: Response) => {
    try {
      const { authorId } = req.params;
      const [author] = await d.select().from(blogAuthors).where(eq(blogAuthors.id, authorId)).limit(1);
      if (!author) { res.status(404).json({ success: false, error: { message: 'Author not found' } }); return; }

      const recentPosts = await d.select({
        id: blogPosts.id, title: blogPosts.title, slug: blogPosts.slug,
        status: blogPosts.status, publishedAt: blogPosts.publishedAt,
      }).from(blogPosts)
        .where(eq(blogPosts.authorId, authorId))
        .orderBy(desc(blogPosts.createdAt))
        .limit(10);

      res.json({ success: true, data: { ...author, recentPosts } });
    } catch (err) {
      logger.error({ err }, 'Failed to get author');
      res.status(500).json({ success: false, error: { message: 'Failed to get author' } });
    }
  });

  adminRouter.put('/authors/:authorId', async (req: Request, res: Response) => {
    try {
      const { authorId } = req.params;
      const { displayName, bio, avatarUrl, socialLinks } = req.body;
      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (displayName !== undefined) updateData.displayName = displayName;
      if (bio !== undefined) updateData.bio = bio;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
      if (socialLinks !== undefined) updateData.socialLinks = socialLinks;

      const [updated] = await d.update(blogAuthors).set(updateData).where(eq(blogAuthors.id, authorId)).returning();
      if (!updated) { res.status(404).json({ success: false, error: { message: 'Author not found' } }); return; }
      res.json({ success: true, data: updated });
    } catch (err) {
      logger.error({ err }, 'Failed to update author');
      res.status(500).json({ success: false, error: { message: 'Failed to update author' } });
    }
  });

  // ===========================================================================
  // ADMIN: COMMENTS
  // ===========================================================================

  adminRouter.get('/posts/:id/comments', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const comments = await d.select().from(blogComments)
        .where(eq(blogComments.postId, id))
        .orderBy(asc(blogComments.createdAt));

      // Build threaded tree
      const map = new Map<string, any>();
      const roots: any[] = [];
      for (const c of comments) {
        map.set(c.id, { ...c, replies: [] });
      }
      for (const c of comments) {
        const node = map.get(c.id)!;
        if (c.parentId && map.has(c.parentId)) {
          map.get(c.parentId)!.replies.push(node);
        } else {
          roots.push(node);
        }
      }

      res.json({ success: true, data: roots });
    } catch (err) {
      logger.error({ err }, 'Failed to list comments');
      res.status(500).json({ success: false, error: { message: 'Failed to list comments' } });
    }
  });

  adminRouter.put('/comments/:commentId/approve', async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      const [updated] = await d.update(blogComments)
        .set({ approved: true })
        .where(eq(blogComments.id, commentId))
        .returning();
      if (!updated) { res.status(404).json({ success: false, error: { message: 'Comment not found' } }); return; }
      res.json({ success: true, data: updated });
    } catch (err) {
      logger.error({ err }, 'Failed to approve comment');
      res.status(500).json({ success: false, error: { message: 'Failed to approve comment' } });
    }
  });

  adminRouter.delete('/comments/:commentId', async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      const deleted = await d.delete(blogComments).where(eq(blogComments.id, commentId)).returning();
      if (deleted.length === 0) { res.status(404).json({ success: false, error: { message: 'Comment not found' } }); return; }
      res.json({ success: true, message: 'Comment deleted' });
    } catch (err) {
      logger.error({ err }, 'Failed to delete comment');
      res.status(500).json({ success: false, error: { message: 'Failed to delete comment' } });
    }
  });

  // ===========================================================================
  // PUBLIC ROUTES (unauthenticated)
  // ===========================================================================

  /**
   * GET /posts — published posts (paginated, filterable)
   */
  publicRouter.get('/posts', async (req: Request, res: Response) => {
    try {
      const siteSlug = req.params.siteSlug as string;
      const site = await getSiteBySlug(siteSlug);
      if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

      const { categorySlug, tagSlug, search, page = '1', limit = '10' } = req.query;
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));
      const offset = (pageNum - 1) * limitNum;

      const conditions: any[] = [
        eq(blogPosts.siteId, site.id),
        eq(blogPosts.status, 'published'),
      ];

      if (search) {
        conditions.push(
          sql`to_tsvector('english', COALESCE(${blogPosts.title}, '') || ' ' || COALESCE(${blogPosts.excerpt}, '') || ' ' || COALESCE(${blogPosts.content}, '')) @@ plainto_tsquery('english', ${search as string})`
        );
      }

      if (categorySlug) {
        const [cat] = await d.select({ id: blogCategories.id })
          .from(blogCategories)
          .where(and(eq(blogCategories.siteId, site.id), eq(blogCategories.slug, categorySlug as string)))
          .limit(1);
        if (cat) {
          const catPosts = await d.select({ postId: blogPostCategories.postId })
            .from(blogPostCategories).where(eq(blogPostCategories.categoryId, cat.id));
          const pids = catPosts.map((r: any) => r.postId);
          if (pids.length === 0) {
            res.json({ success: true, data: [], pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 } });
            return;
          }
          conditions.push(inArray(blogPosts.id, pids));
        }
      }

      if (tagSlug) {
        const [tag] = await d.select({ id: blogTags.id })
          .from(blogTags)
          .where(and(eq(blogTags.siteId, site.id), eq(blogTags.slug, tagSlug as string)))
          .limit(1);
        if (tag) {
          const tagPosts = await d.select({ postId: blogPostTags.postId })
            .from(blogPostTags).where(eq(blogPostTags.tagId, tag.id));
          const pids = tagPosts.map((r: any) => r.postId);
          if (pids.length === 0) {
            res.json({ success: true, data: [], pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 } });
            return;
          }
          conditions.push(inArray(blogPosts.id, pids));
        }
      }

      const where = and(...conditions);
      const [{ count: total }] = await d.select({ count: sql<number>`COUNT(*)` }).from(blogPosts).where(where);

      const posts = await d.select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        coverImage: blogPosts.coverImage,
        publishedAt: blogPosts.publishedAt,
        readingTimeMinutes: blogPosts.readingTimeMinutes,
        featured: blogPosts.featured,
        authorId: blogPosts.authorId,
      }).from(blogPosts)
        .where(where)
        .orderBy(desc(blogPosts.publishedAt))
        .limit(limitNum)
        .offset(offset);

      // Attach author names and categories
      const enriched = await Promise.all(posts.map(async (post: any) => {
        const [author, cats] = await Promise.all([
          post.authorId
            ? d.select({ displayName: blogAuthors.displayName, avatarUrl: blogAuthors.avatarUrl })
                .from(blogAuthors).where(eq(blogAuthors.id, post.authorId)).limit(1).then((r: any[]) => r[0] || null)
            : null,
          d.select({ name: blogCategories.name, slug: blogCategories.slug })
            .from(blogPostCategories)
            .innerJoin(blogCategories, eq(blogPostCategories.categoryId, blogCategories.id))
            .where(eq(blogPostCategories.postId, post.id)),
        ]);
        return { ...post, author, categories: cats };
      }));

      res.json({
        success: true,
        data: enriched,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: Number(total),
          totalPages: Math.ceil(Number(total) / limitNum),
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to list public posts');
      res.status(500).json({ success: false, error: { message: 'Failed to list posts' } });
    }
  });

  /**
   * GET /posts/:slug — single published post by slug
   */
  publicRouter.get('/posts/:slug', async (req: Request, res: Response) => {
    try {
      const siteSlug = req.params.siteSlug as string;
      const site = await getSiteBySlug(siteSlug);
      if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

      const [post] = await d.select().from(blogPosts)
        .where(and(
          eq(blogPosts.siteId, site.id),
          eq(blogPosts.slug, req.params.slug),
          eq(blogPosts.status, 'published')
        )).limit(1);

      if (!post) { res.status(404).json({ success: false, error: { message: 'Post not found' } }); return; }

      const [cats, tags, author, comments] = await Promise.all([
        d.select({ id: blogCategories.id, name: blogCategories.name, slug: blogCategories.slug, color: blogCategories.color })
          .from(blogPostCategories)
          .innerJoin(blogCategories, eq(blogPostCategories.categoryId, blogCategories.id))
          .where(eq(blogPostCategories.postId, post.id)),
        d.select({ id: blogTags.id, name: blogTags.name, slug: blogTags.slug })
          .from(blogPostTags)
          .innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id))
          .where(eq(blogPostTags.postId, post.id)),
        post.authorId
          ? d.select({ displayName: blogAuthors.displayName, bio: blogAuthors.bio, avatarUrl: blogAuthors.avatarUrl, socialLinks: blogAuthors.socialLinks })
              .from(blogAuthors).where(eq(blogAuthors.id, post.authorId)).limit(1).then((r: any[]) => r[0] || null)
          : null,
        post.allowComments
          ? d.select().from(blogComments)
              .where(and(eq(blogComments.postId, post.id), eq(blogComments.approved, true)))
              .orderBy(asc(blogComments.createdAt))
          : [],
      ]);

      // Thread comments
      const commentMap = new Map<string, any>();
      const rootComments: any[] = [];
      for (const c of (comments as any[])) {
        commentMap.set(c.id, { ...c, replies: [] });
      }
      for (const c of (comments as any[])) {
        const node = commentMap.get(c.id)!;
        if (c.parentId && commentMap.has(c.parentId)) {
          commentMap.get(c.parentId)!.replies.push(node);
        } else {
          rootComments.push(node);
        }
      }

      res.json({
        success: true,
        data: { ...post, categories: cats, tags, author, comments: rootComments },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to get public post');
      res.status(500).json({ success: false, error: { message: 'Failed to get post' } });
    }
  });

  /**
   * GET /categories — public categories with post counts
   */
  publicRouter.get('/categories', async (req: Request, res: Response) => {
    try {
      const siteSlug = req.params.siteSlug as string;
      const site = await getSiteBySlug(siteSlug);
      if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

      const cats = await d.select({
        id: blogCategories.id,
        name: blogCategories.name,
        slug: blogCategories.slug,
        description: blogCategories.description,
        color: blogCategories.color,
        parentId: blogCategories.parentId,
        postCount: sql<number>`(
          SELECT COUNT(*) FROM cms_blog_post_categories pc
          JOIN cms_blog_posts p ON p.id = pc.post_id
          WHERE pc.category_id = ${blogCategories.id}
          AND p.status = 'published'
        )`,
      }).from(blogCategories)
        .where(eq(blogCategories.siteId, site.id))
        .orderBy(asc(blogCategories.sortOrder));

      res.json({ success: true, data: cats });
    } catch (err) {
      logger.error({ err }, 'Failed to list public categories');
      res.status(500).json({ success: false, error: { message: 'Failed to list categories' } });
    }
  });

  /**
   * GET /tags — public tags with post counts
   */
  publicRouter.get('/tags', async (req: Request, res: Response) => {
    try {
      const siteSlug = req.params.siteSlug as string;
      const site = await getSiteBySlug(siteSlug);
      if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

      const tags = await d.select({
        id: blogTags.id,
        name: blogTags.name,
        slug: blogTags.slug,
        postCount: sql<number>`(
          SELECT COUNT(*) FROM cms_blog_post_tags pt
          JOIN cms_blog_posts p ON p.id = pt.post_id
          WHERE pt.tag_id = ${blogTags.id}
          AND p.status = 'published'
        )`,
      }).from(blogTags)
        .where(eq(blogTags.siteId, site.id))
        .orderBy(asc(blogTags.name));

      res.json({ success: true, data: tags });
    } catch (err) {
      logger.error({ err }, 'Failed to list public tags');
      res.status(500).json({ success: false, error: { message: 'Failed to list tags' } });
    }
  });

  /**
   * GET /authors/:id — public author profile with recent posts
   */
  publicRouter.get('/authors/:authorId', async (req: Request, res: Response) => {
    try {
      const { authorId } = req.params;
      const [author] = await d.select({
        id: blogAuthors.id,
        displayName: blogAuthors.displayName,
        bio: blogAuthors.bio,
        avatarUrl: blogAuthors.avatarUrl,
        socialLinks: blogAuthors.socialLinks,
      }).from(blogAuthors).where(eq(blogAuthors.id, authorId)).limit(1);

      if (!author) { res.status(404).json({ success: false, error: { message: 'Author not found' } }); return; }

      const recentPosts = await d.select({
        id: blogPosts.id, title: blogPosts.title, slug: blogPosts.slug,
        excerpt: blogPosts.excerpt, coverImage: blogPosts.coverImage,
        publishedAt: blogPosts.publishedAt, readingTimeMinutes: blogPosts.readingTimeMinutes,
      }).from(blogPosts)
        .where(and(eq(blogPosts.authorId, authorId), eq(blogPosts.status, 'published')))
        .orderBy(desc(blogPosts.publishedAt))
        .limit(10);

      res.json({ success: true, data: { ...author, recentPosts } });
    } catch (err) {
      logger.error({ err }, 'Failed to get public author');
      res.status(500).json({ success: false, error: { message: 'Failed to get author' } });
    }
  });

  /**
   * POST /posts/:slug/comments — submit comment (public)
   */
  publicRouter.post('/posts/:slug/comments', async (req: Request, res: Response) => {
    try {
      const siteSlug = req.params.siteSlug as string;
      const site = await getSiteBySlug(siteSlug);
      if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

      const [post] = await d.select({ id: blogPosts.id, allowComments: blogPosts.allowComments })
        .from(blogPosts)
        .where(and(eq(blogPosts.siteId, site.id), eq(blogPosts.slug, req.params.slug), eq(blogPosts.status, 'published')))
        .limit(1);

      if (!post) { res.status(404).json({ success: false, error: { message: 'Post not found' } }); return; }
      if (!post.allowComments) { res.status(403).json({ success: false, error: { message: 'Comments are disabled for this post' } }); return; }

      const { authorName, authorEmail, content, parentId } = req.body;
      if (!authorName || !authorEmail || !content) {
        res.status(400).json({ success: false, error: { message: 'authorName, authorEmail, and content are required' } });
        return;
      }

      const [comment] = await d.insert(blogComments).values({
        tenantId: site.tenantId,
        postId: post.id,
        authorName,
        authorEmail,
        content,
        approved: false,
        parentId: parentId || null,
      }).returning();

      res.status(201).json({ success: true, data: comment, message: 'Comment submitted for moderation' });
    } catch (err) {
      logger.error({ err }, 'Failed to submit comment');
      res.status(500).json({ success: false, error: { message: 'Failed to submit comment' } });
    }
  });

  // ===========================================================================
  // PUBLIC: FEEDS
  // ===========================================================================

  publicRouter.get('/feed/rss', async (req: Request, res: Response) => {
    try {
      const siteSlug = req.params.siteSlug as string;
      const site = await getSiteBySlug(siteSlug);
      if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

      const baseUrl = site.domain ? `https://${site.domain}` : `https://${siteSlug}.example.com`;
      const posts = await d.select().from(blogPosts)
        .where(and(eq(blogPosts.siteId, site.id), eq(blogPosts.status, 'published')))
        .orderBy(desc(blogPosts.publishedAt))
        .limit(20);

      const feedPosts = await Promise.all(posts.map(async (p: any) => {
        const cats = await d.select({ name: blogCategories.name })
          .from(blogPostCategories)
          .innerJoin(blogCategories, eq(blogPostCategories.categoryId, blogCategories.id))
          .where(eq(blogPostCategories.postId, p.id));
        const author = p.authorId
          ? await d.select({ displayName: blogAuthors.displayName }).from(blogAuthors).where(eq(blogAuthors.id, p.authorId)).limit(1).then((r: any[]) => r[0]?.displayName || null)
          : null;
        return {
          id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt, content: p.content,
          coverImage: p.coverImage, authorName: author, publishedAt: p.publishedAt,
          categories: cats.map((c: any) => c.name),
        };
      }));

      const feedSite = {
        title: site.name, description: `Blog from ${site.name}`, baseUrl,
        language: site.defaultLanguage || 'en', siteSlug,
      };

      res.set('Content-Type', 'application/rss+xml; charset=utf-8');
      res.send(generateRss(feedSite, feedPosts));
    } catch (err) {
      logger.error({ err }, 'Failed to generate RSS feed');
      res.status(500).json({ success: false, error: { message: 'Failed to generate feed' } });
    }
  });

  publicRouter.get('/feed/atom', async (req: Request, res: Response) => {
    try {
      const siteSlug = req.params.siteSlug as string;
      const site = await getSiteBySlug(siteSlug);
      if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

      const baseUrl = site.domain ? `https://${site.domain}` : `https://${siteSlug}.example.com`;
      const posts = await d.select().from(blogPosts)
        .where(and(eq(blogPosts.siteId, site.id), eq(blogPosts.status, 'published')))
        .orderBy(desc(blogPosts.publishedAt))
        .limit(20);

      const feedPosts = await Promise.all(posts.map(async (p: any) => {
        const cats = await d.select({ name: blogCategories.name })
          .from(blogPostCategories)
          .innerJoin(blogCategories, eq(blogPostCategories.categoryId, blogCategories.id))
          .where(eq(blogPostCategories.postId, p.id));
        const author = p.authorId
          ? await d.select({ displayName: blogAuthors.displayName }).from(blogAuthors).where(eq(blogAuthors.id, p.authorId)).limit(1).then((r: any[]) => r[0]?.displayName || null)
          : null;
        return {
          id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt, content: p.content,
          coverImage: p.coverImage, authorName: author, publishedAt: p.publishedAt,
          categories: cats.map((c: any) => c.name),
        };
      }));

      const feedSite = {
        title: site.name, description: `Blog from ${site.name}`, baseUrl,
        language: site.defaultLanguage || 'en', siteSlug,
      };

      res.set('Content-Type', 'application/atom+xml; charset=utf-8');
      res.send(generateAtom(feedSite, feedPosts));
    } catch (err) {
      logger.error({ err }, 'Failed to generate Atom feed');
      res.status(500).json({ success: false, error: { message: 'Failed to generate feed' } });
    }
  });

  publicRouter.get('/feed/json', async (req: Request, res: Response) => {
    try {
      const siteSlug = req.params.siteSlug as string;
      const site = await getSiteBySlug(siteSlug);
      if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

      const baseUrl = site.domain ? `https://${site.domain}` : `https://${siteSlug}.example.com`;
      const posts = await d.select().from(blogPosts)
        .where(and(eq(blogPosts.siteId, site.id), eq(blogPosts.status, 'published')))
        .orderBy(desc(blogPosts.publishedAt))
        .limit(20);

      const feedPosts = await Promise.all(posts.map(async (p: any) => {
        const cats = await d.select({ name: blogCategories.name })
          .from(blogPostCategories)
          .innerJoin(blogCategories, eq(blogPostCategories.categoryId, blogCategories.id))
          .where(eq(blogPostCategories.postId, p.id));
        const author = p.authorId
          ? await d.select({ displayName: blogAuthors.displayName }).from(blogAuthors).where(eq(blogAuthors.id, p.authorId)).limit(1).then((r: any[]) => r[0]?.displayName || null)
          : null;
        return {
          id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt, content: p.content,
          coverImage: p.coverImage, authorName: author, publishedAt: p.publishedAt,
          categories: cats.map((c: any) => c.name),
        };
      }));

      const feedSite = {
        title: site.name, description: `Blog from ${site.name}`, baseUrl,
        language: site.defaultLanguage || 'en', siteSlug,
      };

      res.set('Content-Type', 'application/feed+json; charset=utf-8');
      res.json(generateJsonFeed(feedSite, feedPosts));
    } catch (err) {
      logger.error({ err }, 'Failed to generate JSON feed');
      res.status(500).json({ success: false, error: { message: 'Failed to generate feed' } });
    }
  });

  /**
   * GET /sitemap-posts.xml — blog post sitemap
   */
  publicRouter.get('/sitemap-posts.xml', async (req: Request, res: Response) => {
    try {
      const siteSlug = req.params.siteSlug as string;
      const site = await getSiteBySlug(siteSlug);
      if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

      const baseUrl = site.domain ? `https://${site.domain}` : `https://${siteSlug}.example.com`;
      const posts = await d.select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
        .from(blogPosts)
        .where(and(eq(blogPosts.siteId, site.id), eq(blogPosts.status, 'published')))
        .orderBy(desc(blogPosts.publishedAt));

      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.send(generateSitemap(baseUrl, posts));
    } catch (err) {
      logger.error({ err }, 'Failed to generate sitemap');
      res.status(500).json({ success: false, error: { message: 'Failed to generate sitemap' } });
    }
  });

  // ===========================================================================
  // AI-POWERED ROUTES (admin-authenticated)
  // ===========================================================================

  /**
   * POST /posts/:id/generate-excerpt — AI-generate excerpt from content
   */
  aiRouter.post('/posts/:id/generate-excerpt', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [post] = await d.select({ content: blogPosts.content, title: blogPosts.title })
        .from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
      if (!post) { res.status(404).json({ success: false, error: { message: 'Post not found' } }); return; }

      // Placeholder: actual AI call would use Charlotte/Gemini API
      // For now return a truncated excerpt
      const excerpt = post.content.replace(/[#*_~`>|]/g, '').substring(0, 300).trim() + '...';

      res.json({ success: true, data: { excerpt } });
    } catch (err) {
      logger.error({ err }, 'Failed to generate excerpt');
      res.status(500).json({ success: false, error: { message: 'Failed to generate excerpt' } });
    }
  });

  /**
   * POST /posts/:id/generate-seo — AI-generate meta title + description + OG tags
   */
  aiRouter.post('/posts/:id/generate-seo', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [post] = await d.select({ content: blogPosts.content, title: blogPosts.title, excerpt: blogPosts.excerpt })
        .from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
      if (!post) { res.status(404).json({ success: false, error: { message: 'Post not found' } }); return; }

      // Placeholder: actual AI call would use Charlotte/Gemini API
      const metaTitle = post.title.substring(0, 60);
      const metaDescription = (post.excerpt || post.content.substring(0, 155)).substring(0, 155);

      res.json({
        success: true,
        data: { metaTitle, metaDescription, ogImage: null },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to generate SEO');
      res.status(500).json({ success: false, error: { message: 'Failed to generate SEO' } });
    }
  });

  /**
   * POST /posts/generate — generate a full blog post from a topic/prompt
   */
  aiRouter.post('/posts/generate', async (req: Request, res: Response) => {
    try {
      const { topic, prompt, tone = 'professional' } = req.body;
      if (!topic && !prompt) {
        res.status(400).json({ success: false, error: { message: 'topic or prompt is required' } });
        return;
      }

      // Placeholder: actual AI call would use Charlotte/Gemini API
      const title = topic || 'Generated Post';
      const content = `# ${title}\n\nThis is a placeholder for AI-generated content based on the prompt: "${prompt || topic}".\n\nReplace this integration with your Charlotte/Gemini API call.`;

      res.json({
        success: true,
        data: {
          title,
          content,
          excerpt: content.substring(0, 200),
          suggestedSlug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to generate post');
      res.status(500).json({ success: false, error: { message: 'Failed to generate post' } });
    }
  });

  /**
   * POST /posts/:id/suggest-tags — AI-suggest tags from content
   */
  aiRouter.post('/posts/:id/suggest-tags', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [post] = await d.select({ content: blogPosts.content, title: blogPosts.title })
        .from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
      if (!post) { res.status(404).json({ success: false, error: { message: 'Post not found' } }); return; }

      // Placeholder: extract keywords from content as tag suggestions
      const words = (post.title + ' ' + post.content)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w: string) => w.length > 4);
      const freq = new Map<string, number>();
      for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
      const suggestions = [...freq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([word]) => word);

      res.json({ success: true, data: { suggestions } });
    } catch (err) {
      logger.error({ err }, 'Failed to suggest tags');
      res.status(500).json({ success: false, error: { message: 'Failed to suggest tags' } });
    }
  });

  return { adminRouter, publicRouter, aiRouter };
}

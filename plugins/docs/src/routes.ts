// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * Documentation & Knowledge Base Routes
 *
 * Provides two routers:
 *   - adminRouter:  authenticated site-scoped CRUD for categories, articles, revisions, feedback
 *   - publicRouter: public knowledge base browsing, search, and feedback submission
 */

import { Router, type Request, type Response } from 'express';
import { eq, and, desc, asc, sql, count } from 'drizzle-orm';
import { sites, pages, contentBlocks } from '@netrun-cms/db';
import type { DrizzleClient, PluginLogger } from '@netrun-cms/plugin-runtime';
import { docCategories, docArticles, docRevisions, docFeedback } from './schema.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a category tree from a flat list */
function buildCategoryTree(categories: any[], parentId: string | null = null): any[] {
  return categories
    .filter((c) => (c.parentId || null) === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({
      ...c,
      children: buildCategoryTree(categories, c.id),
    }));
}

/** Extract table of contents from content blocks — looks for heading markers */
function extractTableOfContents(blocks: any[]): { id: string; text: string; level: number }[] {
  const toc: { id: string; text: string; level: number }[] = [];
  for (const block of blocks) {
    if (!block.content) continue;
    const content = block.content;

    // Check for blocks with heading-type content
    if (block.blockType === 'rich_text' || block.blockType === 'text') {
      // Look for heading nodes in structured content
      if (content.headings && Array.isArray(content.headings)) {
        for (const h of content.headings) {
          toc.push({
            id: h.id || slugify(h.text || ''),
            text: h.text || '',
            level: h.level || 2,
          });
        }
      }
      // Look for markdown-style headings in raw text
      if (typeof content.text === 'string') {
        const headingRegex = /^(#{1,6})\s+(.+)$/gm;
        let match;
        while ((match = headingRegex.exec(content.text)) !== null) {
          const level = match[1].length;
          const text = match[2].trim();
          toc.push({ id: slugify(text), text, level });
        }
      }
      // Look for HTML-style headings
      if (typeof content.html === 'string') {
        const htmlHeadingRegex = /<h([1-6])[^>]*(?:id="([^"]*)")?[^>]*>([^<]+)<\/h\1>/gi;
        let match;
        while ((match = htmlHeadingRegex.exec(content.html)) !== null) {
          toc.push({
            id: match[2] || slugify(match[3]),
            text: match[3].trim(),
            level: parseInt(match[1], 10),
          });
        }
      }
    }

    // doc_callout blocks may have a title that acts as a section marker
    if (block.blockType === 'doc_callout' && content.title) {
      toc.push({ id: slugify(content.title), text: content.title, level: 3 });
    }
  }
  return toc;
}

/** Simple slug generator */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Admin Routes ─────────────────────────────────────────────────────────────

function createAdminRouter(db: DrizzleClient, logger: PluginLogger): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  // ── Categories ──

  /** GET /categories — list categories as tree */
  router.get('/categories', async (req: Request, res: Response) => {
    const { siteId } = req.params;

    const allCategories = await d.select().from(docCategories)
      .where(eq(docCategories.siteId, siteId))
      .orderBy(asc(docCategories.sortOrder));

    const tree = buildCategoryTree(allCategories);
    res.json({ success: true, data: tree });
  });

  /** POST /categories — create category */
  router.post('/categories', async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const { name, slug, description, icon, parentId, sortOrder, isActive } = req.body;

    if (!name || !slug) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'name and slug are required' } });
      return;
    }

    const [category] = await d.insert(docCategories).values({
      siteId,
      name,
      slug,
      description: description || null,
      icon: icon || null,
      parentId: parentId || null,
      sortOrder: sortOrder ?? 0,
      isActive: isActive ?? true,
    }).returning();

    logger.info({ categoryId: category.id }, 'Doc category created');
    res.status(201).json({ success: true, data: category });
  });

  /** PUT /categories/:id — update category */
  router.put('/categories/:id', async (req: Request, res: Response) => {
    const { siteId, id } = req.params;
    const { name, slug, description, icon, parentId, sortOrder, isActive } = req.body;

    const [updated] = await d.update(docCategories)
      .set({
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(parentId !== undefined && { parentId }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(and(eq(docCategories.id, id), eq(docCategories.siteId, siteId)))
      .returning();

    if (!updated) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } });
      return;
    }

    res.json({ success: true, data: updated });
  });

  /** DELETE /categories/:id — delete category (reassign articles to parent or uncategorized) */
  router.delete('/categories/:id', async (req: Request, res: Response) => {
    const { siteId, id } = req.params;

    // Get the category to find its parent
    const [category] = await d.select().from(docCategories)
      .where(and(eq(docCategories.id, id), eq(docCategories.siteId, siteId)))
      .limit(1);

    if (!category) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } });
      return;
    }

    // Reassign articles in this category to the parent category (or null)
    await d.update(docArticles)
      .set({ categoryId: category.parentId || null, updatedAt: new Date() })
      .where(and(eq(docArticles.categoryId, id), eq(docArticles.siteId, siteId)));

    // Reassign child categories to the parent
    await d.update(docCategories)
      .set({ parentId: category.parentId || null, updatedAt: new Date() })
      .where(and(eq(docCategories.parentId, id), eq(docCategories.siteId, siteId)));

    // Delete the category
    await d.delete(docCategories)
      .where(and(eq(docCategories.id, id), eq(docCategories.siteId, siteId)));

    logger.info({ categoryId: id }, 'Doc category deleted');
    res.json({ success: true, data: { deleted: true } });
  });

  // ── Articles ──

  /** GET /articles — list articles with filters */
  router.get('/articles', async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const { categoryId, tag, featured, search } = req.query;

    let query = d.select().from(docArticles)
      .where(eq(docArticles.siteId, siteId));

    if (categoryId) {
      query = query.where(and(eq(docArticles.siteId, siteId), eq(docArticles.categoryId, categoryId)));
    }

    if (featured === 'true') {
      query = query.where(and(eq(docArticles.siteId, siteId), eq(docArticles.isFeatured, true)));
    }

    if (tag) {
      query = query.where(and(
        eq(docArticles.siteId, siteId),
        sql`${docArticles.tags} @> ${JSON.stringify([tag])}::jsonb`
      ));
    }

    if (search) {
      query = query.where(and(
        eq(docArticles.siteId, siteId),
        sql`(${docArticles.title} ILIKE ${'%' + search + '%'} OR ${docArticles.excerpt} ILIKE ${'%' + search + '%'})`
      ));
    }

    const results = await query.orderBy(asc(docArticles.sortOrder), desc(docArticles.createdAt));
    res.json({ success: true, data: results });
  });

  /** POST /articles — create article (auto-creates cms_page if pageId not provided) */
  router.post('/articles', async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const {
      pageId, categoryId, slug, title, excerpt, tags,
      isFeatured, isPinned, sortOrder, metadata,
      lastRevisedBy, revisionNote,
    } = req.body;

    if (!title || !slug) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'title and slug are required' } });
      return;
    }

    let resolvedPageId = pageId;

    // Auto-create a CMS page if none provided
    if (!resolvedPageId) {
      const [newPage] = await d.insert(pages).values({
        siteId,
        title,
        slug: `docs-${slug}`,
        status: 'published',
        template: 'default',
        metaDescription: excerpt || null,
        publishedAt: new Date(),
      }).returning();

      resolvedPageId = newPage.id;

      // Create initial rich_text content block
      await d.insert(contentBlocks).values({
        pageId: resolvedPageId,
        blockType: 'rich_text',
        content: { text: '', html: '' },
        sortOrder: 0,
      });

      logger.info({ pageId: resolvedPageId }, 'Auto-created CMS page for doc article');
    }

    const [article] = await d.insert(docArticles).values({
      siteId,
      pageId: resolvedPageId,
      categoryId: categoryId || null,
      slug,
      title,
      excerpt: excerpt || null,
      tags: tags || [],
      isFeatured: isFeatured ?? false,
      isPinned: isPinned ?? false,
      sortOrder: sortOrder ?? 0,
      metadata: metadata || {},
      lastRevisedAt: new Date(),
      lastRevisedBy: lastRevisedBy || null,
      revisionNote: revisionNote || null,
    }).returning();

    // Create initial revision (version 1)
    const currentBlocks = await d.select().from(contentBlocks)
      .where(eq(contentBlocks.pageId, resolvedPageId))
      .orderBy(asc(contentBlocks.sortOrder));

    await d.insert(docRevisions).values({
      articleId: article.id,
      version: 1,
      title,
      excerpt: excerpt || null,
      content: currentBlocks.map((b: any) => ({
        blockType: b.blockType,
        content: b.content,
        settings: b.settings,
        sortOrder: b.sortOrder,
      })),
      changedBy: lastRevisedBy || null,
      changeNote: revisionNote || 'Initial version',
    });

    logger.info({ articleId: article.id }, 'Doc article created');
    res.status(201).json({ success: true, data: article });
  });

  /** PUT /articles/:id — update article metadata + create revision snapshot */
  router.put('/articles/:id', async (req: Request, res: Response) => {
    const { siteId, id } = req.params;
    const {
      categoryId, slug, title, excerpt, tags,
      isFeatured, isPinned, sortOrder, metadata,
      lastRevisedBy, revisionNote,
    } = req.body;

    // Get existing article
    const [existing] = await d.select().from(docArticles)
      .where(and(eq(docArticles.id, id), eq(docArticles.siteId, siteId)))
      .limit(1);

    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } });
      return;
    }

    const [updated] = await d.update(docArticles)
      .set({
        ...(categoryId !== undefined && { categoryId }),
        ...(slug !== undefined && { slug }),
        ...(title !== undefined && { title }),
        ...(excerpt !== undefined && { excerpt }),
        ...(tags !== undefined && { tags }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(isPinned !== undefined && { isPinned }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(metadata !== undefined && { metadata }),
        lastRevisedAt: new Date(),
        lastRevisedBy: lastRevisedBy || existing.lastRevisedBy,
        revisionNote: revisionNote || null,
        updatedAt: new Date(),
      })
      .where(and(eq(docArticles.id, id), eq(docArticles.siteId, siteId)))
      .returning();

    // Create a revision snapshot
    const currentBlocks = await d.select().from(contentBlocks)
      .where(eq(contentBlocks.pageId, existing.pageId))
      .orderBy(asc(contentBlocks.sortOrder));

    // Get latest version number
    const [latestRevision] = await d.select({ version: docRevisions.version })
      .from(docRevisions)
      .where(eq(docRevisions.articleId, id))
      .orderBy(desc(docRevisions.version))
      .limit(1);

    const nextVersion = (latestRevision?.version || 0) + 1;

    await d.insert(docRevisions).values({
      articleId: id,
      version: nextVersion,
      title: title || existing.title,
      excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
      content: currentBlocks.map((b: any) => ({
        blockType: b.blockType,
        content: b.content,
        settings: b.settings,
        sortOrder: b.sortOrder,
      })),
      changedBy: lastRevisedBy || null,
      changeNote: revisionNote || null,
    });

    logger.info({ articleId: id, version: nextVersion }, 'Doc article updated with revision');
    res.json({ success: true, data: updated });
  });

  /** DELETE /articles/:id — delete article (optionally delete linked page) */
  router.delete('/articles/:id', async (req: Request, res: Response) => {
    const { siteId, id } = req.params;
    const { deletePage } = req.query;

    const [article] = await d.select().from(docArticles)
      .where(and(eq(docArticles.id, id), eq(docArticles.siteId, siteId)))
      .limit(1);

    if (!article) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } });
      return;
    }

    // Delete the article (cascades to revisions and feedback)
    await d.delete(docArticles)
      .where(and(eq(docArticles.id, id), eq(docArticles.siteId, siteId)));

    // Optionally delete the linked CMS page
    if (deletePage === 'true' && article.pageId) {
      await d.delete(pages).where(eq(pages.id, article.pageId));
      logger.info({ pageId: article.pageId }, 'Deleted linked CMS page');
    }

    logger.info({ articleId: id }, 'Doc article deleted');
    res.json({ success: true, data: { deleted: true } });
  });

  /** GET /articles/:id/revisions — list revision history */
  router.get('/articles/:id/revisions', async (req: Request, res: Response) => {
    const { siteId, id } = req.params;

    // Verify article belongs to site
    const [article] = await d.select({ id: docArticles.id }).from(docArticles)
      .where(and(eq(docArticles.id, id), eq(docArticles.siteId, siteId)))
      .limit(1);

    if (!article) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } });
      return;
    }

    const revisions = await d.select().from(docRevisions)
      .where(eq(docRevisions.articleId, id))
      .orderBy(desc(docRevisions.version));

    res.json({ success: true, data: revisions });
  });

  /** POST /articles/:id/revert/:revisionId — revert to a previous revision */
  router.post('/articles/:id/revert/:revisionId', async (req: Request, res: Response) => {
    const { siteId, id, revisionId } = req.params;
    const { changedBy } = req.body;

    // Verify article
    const [article] = await d.select().from(docArticles)
      .where(and(eq(docArticles.id, id), eq(docArticles.siteId, siteId)))
      .limit(1);

    if (!article) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } });
      return;
    }

    // Get the target revision
    const [revision] = await d.select().from(docRevisions)
      .where(and(eq(docRevisions.id, revisionId), eq(docRevisions.articleId, id)))
      .limit(1);

    if (!revision) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Revision not found' } });
      return;
    }

    // Delete existing content blocks for the linked page
    await d.delete(contentBlocks).where(eq(contentBlocks.pageId, article.pageId));

    // Restore content blocks from the revision snapshot
    const snapshotBlocks = revision.content as any[];
    for (const block of snapshotBlocks) {
      await d.insert(contentBlocks).values({
        pageId: article.pageId,
        blockType: block.blockType,
        content: block.content,
        settings: block.settings || {},
        sortOrder: block.sortOrder || 0,
      });
    }

    // Update article metadata
    await d.update(docArticles)
      .set({
        title: revision.title,
        excerpt: revision.excerpt,
        lastRevisedAt: new Date(),
        lastRevisedBy: changedBy || null,
        revisionNote: `Reverted to version ${revision.version}`,
        updatedAt: new Date(),
      })
      .where(eq(docArticles.id, id));

    // Update the page title too
    await d.update(pages)
      .set({ title: revision.title, updatedAt: new Date() })
      .where(eq(pages.id, article.pageId));

    // Create a new revision recording the revert
    const [latestRevision] = await d.select({ version: docRevisions.version })
      .from(docRevisions)
      .where(eq(docRevisions.articleId, id))
      .orderBy(desc(docRevisions.version))
      .limit(1);

    const nextVersion = (latestRevision?.version || 0) + 1;

    await d.insert(docRevisions).values({
      articleId: id,
      version: nextVersion,
      title: revision.title,
      excerpt: revision.excerpt,
      content: revision.content,
      changedBy: changedBy || null,
      changeNote: `Reverted to version ${revision.version}`,
    });

    logger.info({ articleId: id, revertedTo: revision.version, newVersion: nextVersion }, 'Doc article reverted');
    res.json({ success: true, data: { revertedToVersion: revision.version, newVersion: nextVersion } });
  });

  // ── Feedback ──

  /** GET /feedback — list feedback for site */
  router.get('/feedback', async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const { articleId } = req.query;

    let query;
    if (articleId) {
      // Verify article belongs to site
      const [article] = await d.select({ id: docArticles.id }).from(docArticles)
        .where(and(eq(docArticles.id, articleId), eq(docArticles.siteId, siteId)))
        .limit(1);

      if (!article) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } });
        return;
      }

      query = d.select().from(docFeedback)
        .where(eq(docFeedback.articleId, articleId));
    } else {
      // All feedback for articles in this site
      query = d.select({
        id: docFeedback.id,
        articleId: docFeedback.articleId,
        isHelpful: docFeedback.isHelpful,
        comment: docFeedback.comment,
        sessionId: docFeedback.sessionId,
        createdAt: docFeedback.createdAt,
        articleTitle: docArticles.title,
        articleSlug: docArticles.slug,
      }).from(docFeedback)
        .innerJoin(docArticles, eq(docFeedback.articleId, docArticles.id))
        .where(eq(docArticles.siteId, siteId));
    }

    const results = await query.orderBy(desc(docFeedback.createdAt));
    res.json({ success: true, data: results });
  });

  /** GET /feedback/stats — aggregate feedback stats */
  router.get('/feedback/stats', async (req: Request, res: Response) => {
    const { siteId } = req.params;

    const stats = await d.select({
      articleId: docArticles.id,
      title: docArticles.title,
      slug: docArticles.slug,
      helpfulYes: docArticles.helpfulYes,
      helpfulNo: docArticles.helpfulNo,
      viewCount: docArticles.viewCount,
    }).from(docArticles)
      .where(eq(docArticles.siteId, siteId))
      .orderBy(desc(sql`${docArticles.helpfulYes} + ${docArticles.helpfulNo}`));

    const totalFeedback = stats.reduce((acc: number, s: any) => acc + s.helpfulYes + s.helpfulNo, 0);
    const totalHelpful = stats.reduce((acc: number, s: any) => acc + s.helpfulYes, 0);

    res.json({
      success: true,
      data: {
        totalArticles: stats.length,
        totalFeedback,
        totalHelpful,
        helpfulRate: totalFeedback > 0 ? Math.round((totalHelpful / totalFeedback) * 100) : 0,
        articles: stats,
      },
    });
  });

  return router;
}

// ── Public Routes ────────────────────────────────────────────────────────────

function createPublicRouter(db: DrizzleClient, logger: PluginLogger): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  /** Resolve site by slug — shared helper */
  async function resolveSite(siteSlug: string): Promise<{ id: string; name: string; domain: string | null } | null> {
    const [site] = await d.select({ id: sites.id, name: sites.name, domain: sites.domain })
      .from(sites)
      .where(eq(sites.slug, siteSlug))
      .limit(1);
    return site || null;
  }

  /** GET / — KB home: featured articles, category tree, recent articles */
  router.get('/', async (req: Request, res: Response) => {
    const site = await resolveSite(req.params.siteSlug);
    if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

    const [allCategories, featuredArticles, recentArticles] = await Promise.all([
      d.select().from(docCategories)
        .where(and(eq(docCategories.siteId, site.id), eq(docCategories.isActive, true)))
        .orderBy(asc(docCategories.sortOrder)),
      d.select().from(docArticles)
        .where(and(eq(docArticles.siteId, site.id), eq(docArticles.isFeatured, true)))
        .orderBy(asc(docArticles.sortOrder))
        .limit(10),
      d.select().from(docArticles)
        .where(eq(docArticles.siteId, site.id))
        .orderBy(desc(docArticles.createdAt))
        .limit(10),
    ]);

    const categoryTree = buildCategoryTree(allCategories);

    res.json({
      success: true,
      data: {
        categories: categoryTree,
        featured: featuredArticles,
        recent: recentArticles,
      },
    });
  });

  /** GET /categories — category tree with article counts */
  router.get('/categories', async (req: Request, res: Response) => {
    const site = await resolveSite(req.params.siteSlug);
    if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

    const allCategories = await d.select().from(docCategories)
      .where(and(eq(docCategories.siteId, site.id), eq(docCategories.isActive, true)))
      .orderBy(asc(docCategories.sortOrder));

    // Get article counts per category
    const articleCounts = await d.select({
      categoryId: docArticles.categoryId,
      count: count(),
    }).from(docArticles)
      .where(eq(docArticles.siteId, site.id))
      .groupBy(docArticles.categoryId);

    const countMap: Record<string, number> = {};
    for (const ac of articleCounts) {
      if (ac.categoryId) countMap[ac.categoryId] = Number(ac.count);
    }

    const categoriesWithCounts = allCategories.map((c: any) => ({
      ...c,
      articleCount: countMap[c.id] || 0,
    }));

    const tree = buildCategoryTree(categoriesWithCounts);
    res.json({ success: true, data: tree });
  });

  /** GET /categories/:categorySlug — articles in a category */
  router.get('/categories/:categorySlug', async (req: Request, res: Response) => {
    const site = await resolveSite(req.params.siteSlug);
    if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

    const [category] = await d.select().from(docCategories)
      .where(and(eq(docCategories.siteId, site.id), eq(docCategories.slug, req.params.categorySlug)))
      .limit(1);

    if (!category) {
      res.status(404).json({ success: false, error: { message: 'Category not found' } });
      return;
    }

    const articles = await d.select().from(docArticles)
      .where(and(eq(docArticles.siteId, site.id), eq(docArticles.categoryId, category.id)))
      .orderBy(asc(docArticles.sortOrder), desc(docArticles.createdAt));

    // Build breadcrumb
    const breadcrumb = [{ name: category.name, slug: category.slug }];
    let parentId = category.parentId;
    while (parentId) {
      const [parent] = await d.select().from(docCategories)
        .where(eq(docCategories.id, parentId)).limit(1);
      if (!parent) break;
      breadcrumb.unshift({ name: parent.name, slug: parent.slug });
      parentId = parent.parentId;
    }

    res.json({
      success: true,
      data: {
        category,
        breadcrumb,
        articles,
      },
    });
  });

  /** GET /articles/:articleSlug — full article with content, TOC, nav */
  router.get('/articles/:articleSlug', async (req: Request, res: Response) => {
    const site = await resolveSite(req.params.siteSlug);
    if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

    const [article] = await d.select().from(docArticles)
      .where(and(eq(docArticles.siteId, site.id), eq(docArticles.slug, req.params.articleSlug)))
      .limit(1);

    if (!article) {
      res.status(404).json({ success: false, error: { message: 'Article not found' } });
      return;
    }

    // Increment view count (fire-and-forget is acceptable for analytics)
    d.update(docArticles)
      .set({ viewCount: sql`${docArticles.viewCount} + 1` })
      .where(eq(docArticles.id, article.id))
      .then(() => {})
      .catch((err: any) => logger.warn({ err: err.message }, 'Failed to increment view count'));

    // Get content blocks from the linked CMS page
    const blocks = await d.select().from(contentBlocks)
      .where(eq(contentBlocks.pageId, article.pageId))
      .orderBy(asc(contentBlocks.sortOrder));

    // Build table of contents
    const tableOfContents = extractTableOfContents(blocks);

    // Get category info and breadcrumb
    let category = null;
    const breadcrumb: { name: string; slug: string }[] = [];
    if (article.categoryId) {
      const [cat] = await d.select().from(docCategories)
        .where(eq(docCategories.id, article.categoryId)).limit(1);
      if (cat) {
        category = cat;
        breadcrumb.push({ name: cat.name, slug: cat.slug });
        let parentId = cat.parentId;
        while (parentId) {
          const [parent] = await d.select().from(docCategories)
            .where(eq(docCategories.id, parentId)).limit(1);
          if (!parent) break;
          breadcrumb.unshift({ name: parent.name, slug: parent.slug });
          parentId = parent.parentId;
        }
      }
    }

    // Get prev/next articles within the same category
    let prevArticle = null;
    let nextArticle = null;
    if (article.categoryId) {
      const categoryArticles = await d.select({
        id: docArticles.id,
        slug: docArticles.slug,
        title: docArticles.title,
      }).from(docArticles)
        .where(and(eq(docArticles.siteId, site.id), eq(docArticles.categoryId, article.categoryId)))
        .orderBy(asc(docArticles.sortOrder), desc(docArticles.createdAt));

      const currentIndex = categoryArticles.findIndex((a: any) => a.id === article.id);
      if (currentIndex > 0) {
        prevArticle = categoryArticles[currentIndex - 1];
      }
      if (currentIndex < categoryArticles.length - 1) {
        nextArticle = categoryArticles[currentIndex + 1];
      }
    }

    // Get related articles (same category, excluding current, limit 5)
    let relatedArticles: any[] = [];
    if (article.categoryId) {
      relatedArticles = await d.select({
        id: docArticles.id,
        slug: docArticles.slug,
        title: docArticles.title,
        excerpt: docArticles.excerpt,
      }).from(docArticles)
        .where(and(
          eq(docArticles.siteId, site.id),
          eq(docArticles.categoryId, article.categoryId),
          sql`${docArticles.id} != ${article.id}`
        ))
        .orderBy(asc(docArticles.sortOrder))
        .limit(5);
    }

    res.json({
      success: true,
      data: {
        ...article,
        contentBlocks: blocks,
        tableOfContents,
        category,
        breadcrumb,
        prevArticle,
        nextArticle,
        relatedArticles,
      },
    });
  });

  /** GET /search?q=term — full-text search across articles */
  router.get('/search', async (req: Request, res: Response) => {
    const site = await resolveSite(req.params.siteSlug);
    if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

    const q = (req.query.q as string || '').trim();
    if (!q) {
      res.json({ success: true, data: [] });
      return;
    }

    // Full-text search using PostgreSQL tsvector on cms_pages
    const results = await d.execute(sql`
      SELECT
        a.id,
        a.slug,
        a.title,
        a.excerpt,
        a.tags,
        a.category_id,
        a.view_count,
        a.helpful_yes,
        a.helpful_no,
        a.created_at,
        ts_rank(
          to_tsvector('english', p.title || ' ' || COALESCE(p.meta_description, '')),
          plainto_tsquery('english', ${q})
        ) as rank
      FROM cms_doc_articles a
      JOIN cms_pages p ON a.page_id = p.id
      WHERE a.site_id = ${site.id}
        AND (
          to_tsvector('english', p.title || ' ' || COALESCE(p.meta_description, ''))
            @@ plainto_tsquery('english', ${q})
          OR a.title ILIKE ${'%' + q + '%'}
          OR a.excerpt ILIKE ${'%' + q + '%'}
          OR a.tags @> ${JSON.stringify([q])}::jsonb
        )
      ORDER BY rank DESC, a.sort_order ASC
      LIMIT 50
    `);

    res.json({ success: true, data: results });
  });

  /** POST /articles/:articleSlug/feedback — submit "was this helpful?" vote */
  router.post('/articles/:articleSlug/feedback', async (req: Request, res: Response) => {
    const site = await resolveSite(req.params.siteSlug);
    if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

    const { helpful, comment, sessionId } = req.body;

    if (typeof helpful !== 'boolean') {
      res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'helpful (boolean) is required' } });
      return;
    }

    if (!sessionId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'sessionId is required' } });
      return;
    }

    const [article] = await d.select().from(docArticles)
      .where(and(eq(docArticles.siteId, site.id), eq(docArticles.slug, req.params.articleSlug)))
      .limit(1);

    if (!article) {
      res.status(404).json({ success: false, error: { message: 'Article not found' } });
      return;
    }

    // Check for duplicate vote by sessionId
    const [existingVote] = await d.select({ id: docFeedback.id }).from(docFeedback)
      .where(and(eq(docFeedback.articleId, article.id), eq(docFeedback.sessionId, sessionId)))
      .limit(1);

    if (existingVote) {
      res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'Feedback already submitted for this session' } });
      return;
    }

    // Insert feedback
    const [feedback] = await d.insert(docFeedback).values({
      articleId: article.id,
      isHelpful: helpful,
      comment: comment || null,
      sessionId,
    }).returning();

    // Increment counter on the article
    if (helpful) {
      await d.update(docArticles)
        .set({ helpfulYes: sql`${docArticles.helpfulYes} + 1` })
        .where(eq(docArticles.id, article.id));
    } else {
      await d.update(docArticles)
        .set({ helpfulNo: sql`${docArticles.helpfulNo} + 1` })
        .where(eq(docArticles.id, article.id));
    }

    res.status(201).json({ success: true, data: feedback });
  });

  return router;
}

// ── Factory ──────────────────────────────────────────────────────────────────

export function createRoutes(db: DrizzleClient, logger: PluginLogger): {
  adminRouter: Router;
  publicRouter: Router;
} {
  return {
    adminRouter: createAdminRouter(db, logger),
    publicRouter: createPublicRouter(db, logger),
  };
}

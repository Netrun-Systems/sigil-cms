/**
 * Pages Controller
 *
 * CRUD operations for CMS pages with site filtering
 */

import type { Response } from 'express';
import { eq, and, desc, asc, count, isNull, ne, max } from 'drizzle-orm';
import { pages, sites, contentBlocks, pageRevisions, insertPageSchema, type Page, type PageWithBlocks, type ContentBlock } from '@netrun-cms/db';
import { schedulePageSchema } from '@netrun-cms/core';
import { getDb } from '../db.js';
import { parsePagination } from '../middleware/validation.js';
import type { AuthenticatedRequest, ApiResponse, PaginatedResponse } from '../types/index.js';

export class PagesController {
  /**
   * List all pages for a site
   *
   * GET /api/v1/sites/:siteId/pages
   */
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId } = req.params;
    const { page, limit, offset } = parsePagination(req);
    const status = req.query.status as string | undefined;
    const language = req.query.language as string | undefined;
    const parentId = req.query.parentId as string | undefined;

    // Verify site belongs to tenant
    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!site) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Site with ID ${siteId} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    // Build query conditions
    const conditions = [eq(pages.siteId, siteId)];
    if (status) {
      conditions.push(eq(pages.status, status));
    }
    if (language) {
      conditions.push(eq(pages.language, language));
    }
    if (parentId === 'null' || parentId === '') {
      conditions.push(isNull(pages.parentId));
    } else if (parentId) {
      conditions.push(eq(pages.parentId, parentId));
    }

    // Get total count
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(pages)
      .where(and(...conditions));

    // Get paginated results
    const results = await db
      .select()
      .from(pages)
      .where(and(...conditions))
      .orderBy(asc(pages.sortOrder), desc(pages.updatedAt))
      .limit(limit)
      .offset(offset);

    const response: PaginatedResponse<Page> = {
      success: true,
      data: results,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    res.json(response);
  }

  /**
   * Get a single page by ID with optional blocks
   *
   * GET /api/v1/sites/:siteId/pages/:id
   */
  static async get(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId, id } = req.params;
    const includeBlocks = req.query.includeBlocks === 'true';

    // Verify site belongs to tenant
    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!site) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Site with ID ${siteId} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    const [page] = await db
      .select()
      .from(pages)
      .where(and(eq(pages.id, id), eq(pages.siteId, siteId)))
      .limit(1);

    if (!page) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Page with ID ${id} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    if (includeBlocks) {
      const blocks = await db
        .select()
        .from(contentBlocks)
        .where(eq(contentBlocks.pageId, id))
        .orderBy(asc(contentBlocks.sortOrder));

      const pageWithBlocks: PageWithBlocks = {
        ...page,
        blocks,
      };

      const response: ApiResponse<PageWithBlocks> = {
        success: true,
        data: pageWithBlocks,
      };

      res.json(response);
      return;
    }

    const response: ApiResponse<Page> = {
      success: true,
      data: page,
    };

    res.json(response);
  }

  /**
   * Create a new page
   *
   * POST /api/v1/sites/:siteId/pages
   */
  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId } = req.params;

    // Verify site belongs to tenant
    const [site] = await db
      .select({ id: sites.id, defaultLanguage: sites.defaultLanguage })
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!site) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Site with ID ${siteId} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    // Validate request body
    const parseResult = insertPageSchema.safeParse({
      language: site.defaultLanguage,
      ...req.body,
      siteId,
    });

    if (!parseResult.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid page data',
          details: parseResult.error.errors,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Cast to typed insert data to work around drizzle-zod unknown inference
    const insertData = parseResult.data as { slug: string; language?: string; parentId?: string; [key: string]: unknown };

    // Check for slug uniqueness within site and language
    const [existing] = await db
      .select({ id: pages.id })
      .from(pages)
      .where(
        and(
          eq(pages.siteId, siteId),
          eq(pages.slug, insertData.slug),
          eq(pages.language, insertData.language || site.defaultLanguage)
        )
      )
      .limit(1);

    if (existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'DUPLICATE_SLUG',
          message: `A page with slug "${insertData.slug}" already exists for this language`,
        },
      };
      res.status(409).json(response);
      return;
    }

    // Compute full path
    let fullPath = '/' + insertData.slug;
    if (insertData.parentId) {
      const [parent] = await db
        .select({ fullPath: pages.fullPath })
        .from(pages)
        .where(eq(pages.id, insertData.parentId))
        .limit(1);

      if (parent?.fullPath) {
        fullPath = parent.fullPath + '/' + insertData.slug;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [page] = await db
      .insert(pages)
      .values({
        ...(insertData as any),
        fullPath,
      })
      .returning();

    const response: ApiResponse<Page> = {
      success: true,
      data: page,
    };

    res.status(201).json(response);
  }

  /**
   * Update an existing page
   *
   * PUT /api/v1/sites/:siteId/pages/:id
   */
  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId, id } = req.params;

    // Verify site belongs to tenant
    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!site) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Site with ID ${siteId} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check page exists
    const [existing] = await db
      .select()
      .from(pages)
      .where(and(eq(pages.id, id), eq(pages.siteId, siteId)))
      .limit(1);

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Page with ID ${id} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    // Snapshot current state as a revision before applying changes
    const currentBlocks = await db
      .select()
      .from(contentBlocks)
      .where(eq(contentBlocks.pageId, id))
      .orderBy(asc(contentBlocks.sortOrder));

    const [maxVersionRow] = await db
      .select({ maxVersion: max(pageRevisions.version) })
      .from(pageRevisions)
      .where(eq(pageRevisions.pageId, id));

    const nextVersion = ((maxVersionRow?.maxVersion as number | null) ?? 0) + 1;

    await db.insert(pageRevisions).values({
      pageId: id,
      version: nextVersion,
      title: existing.title,
      slug: existing.slug,
      contentSnapshot: currentBlocks.map((b) => ({
        blockType: b.blockType,
        content: b.content,
        settings: b.settings,
        sortOrder: b.sortOrder,
        isVisible: b.isVisible,
      })),
      settingsSnapshot: {
        status: existing.status,
        template: existing.template,
        metaTitle: existing.metaTitle,
        metaDescription: existing.metaDescription,
        ogImageUrl: existing.ogImageUrl,
      },
      changedBy: req.user?.email ?? null,
      changeNote: (req.body as Record<string, unknown>).changeNote as string ?? null,
    });

    const updateData = {
      ...req.body,
      siteId, // Ensure site cannot be changed
      updatedAt: new Date(),
    };
    // Remove changeNote from update payload — it's revision metadata, not a page field
    delete updateData.changeNote;

    // If slug is being changed, check uniqueness
    if (updateData.slug && updateData.slug !== existing.slug) {
      const [slugConflict] = await db
        .select({ id: pages.id })
        .from(pages)
        .where(
          and(
            eq(pages.siteId, siteId),
            eq(pages.slug, updateData.slug),
            eq(pages.language, updateData.language || existing.language)
          )
        )
        .limit(1);

      if (slugConflict && slugConflict.id !== id) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'DUPLICATE_SLUG',
            message: `A page with slug "${updateData.slug}" already exists for this language`,
          },
        };
        res.status(409).json(response);
        return;
      }

      // Recompute full path if slug changes
      let fullPath = '/' + updateData.slug;
      const parentId = updateData.parentId || existing.parentId;
      if (parentId) {
        const [parent] = await db
          .select({ fullPath: pages.fullPath })
          .from(pages)
          .where(eq(pages.id, parentId))
          .limit(1);

        if (parent?.fullPath) {
          fullPath = parent.fullPath + '/' + updateData.slug;
        }
      }
      updateData.fullPath = fullPath;
    }

    const [page] = await db
      .update(pages)
      .set(updateData)
      .where(eq(pages.id, id))
      .returning();

    const response: ApiResponse<Page> = {
      success: true,
      data: page,
    };

    res.json(response);
  }

  /**
   * Delete a page
   *
   * DELETE /api/v1/sites/:siteId/pages/:id
   */
  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId, id } = req.params;

    // Verify site belongs to tenant
    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!site) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Site with ID ${siteId} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check page exists
    const [existing] = await db
      .select({ id: pages.id })
      .from(pages)
      .where(and(eq(pages.id, id), eq(pages.siteId, siteId)))
      .limit(1);

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Page with ID ${id} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    // Delete page (cascades to content blocks)
    await db.delete(pages).where(eq(pages.id, id));

    const response: ApiResponse<{ id: string }> = {
      success: true,
      data: { id },
    };

    res.json(response);
  }

  /**
   * List all translations of a page
   *
   * GET /api/v1/sites/:siteId/pages/:id/translations
   *
   * Returns all pages sharing the same slug and siteId but with different languages.
   */
  static async listTranslations(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId, id } = req.params;

    // Verify site belongs to tenant
    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!site) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'NOT_FOUND', message: `Site with ID ${siteId} not found` },
      };
      res.status(404).json(response);
      return;
    }

    // Get the source page to find its slug
    const [sourcePage] = await db
      .select()
      .from(pages)
      .where(and(eq(pages.id, id), eq(pages.siteId, siteId)))
      .limit(1);

    if (!sourcePage) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'NOT_FOUND', message: `Page with ID ${id} not found` },
      };
      res.status(404).json(response);
      return;
    }

    // Find all pages with the same slug in this site (all languages)
    const translations = await db
      .select()
      .from(pages)
      .where(and(eq(pages.siteId, siteId), eq(pages.slug, sourcePage.slug)))
      .orderBy(asc(pages.language));

    const response: ApiResponse<Page[]> = {
      success: true,
      data: translations,
    };

    res.json(response);
  }

  /**
   * Create a translation of a page
   *
   * POST /api/v1/sites/:siteId/pages/:id/translate
   *
   * Clones the page and its content blocks into the target language.
   */
  static async createTranslation(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId, id } = req.params;
    const { language } = req.body;

    if (!language || typeof language !== 'string' || language.length < 2 || language.length > 5) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'A valid language code is required (2-5 characters)' },
      };
      res.status(400).json(response);
      return;
    }

    // Verify site belongs to tenant
    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!site) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'NOT_FOUND', message: `Site with ID ${siteId} not found` },
      };
      res.status(404).json(response);
      return;
    }

    // Get the source page
    const [sourcePage] = await db
      .select()
      .from(pages)
      .where(and(eq(pages.id, id), eq(pages.siteId, siteId)))
      .limit(1);

    if (!sourcePage) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'NOT_FOUND', message: `Page with ID ${id} not found` },
      };
      res.status(404).json(response);
      return;
    }

    // Check if translation already exists for this language
    const [existing] = await db
      .select({ id: pages.id })
      .from(pages)
      .where(
        and(
          eq(pages.siteId, siteId),
          eq(pages.slug, sourcePage.slug),
          eq(pages.language, language)
        )
      )
      .limit(1);

    if (existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'DUPLICATE_TRANSLATION',
          message: `A translation for language "${language}" already exists for this page`,
        },
      };
      res.status(409).json(response);
      return;
    }

    // Clone the page with the new language
    const [newPage] = await db
      .insert(pages)
      .values({
        siteId: sourcePage.siteId,
        parentId: sourcePage.parentId,
        title: sourcePage.title,
        slug: sourcePage.slug,
        fullPath: sourcePage.fullPath,
        status: 'draft' as const,
        language,
        metaTitle: sourcePage.metaTitle,
        metaDescription: sourcePage.metaDescription,
        ogImageUrl: sourcePage.ogImageUrl,
        template: sourcePage.template,
        sortOrder: sourcePage.sortOrder,
      })
      .returning();

    // Clone content blocks from the source page
    const sourceBlocks = await db
      .select()
      .from(contentBlocks)
      .where(eq(contentBlocks.pageId, id))
      .orderBy(asc(contentBlocks.sortOrder));

    const clonedBlocks: ContentBlock[] = [];
    for (const block of sourceBlocks) {
      const [cloned] = await db
        .insert(contentBlocks)
        .values({
          pageId: newPage.id,
          blockType: block.blockType,
          content: block.content,
          settings: block.settings,
          sortOrder: block.sortOrder,
          isVisible: block.isVisible,
        })
        .returning();
      clonedBlocks.push(cloned);
    }

    const pageWithBlocks: PageWithBlocks = {
      ...newPage,
      blocks: clonedBlocks,
    };

    const response: ApiResponse<PageWithBlocks> = {
      success: true,
      data: pageWithBlocks,
    };

    res.status(201).json(response);
  }

  /**
   * List revisions for a page
   *
   * GET /api/v1/sites/:siteId/pages/:pageId/revisions
   */
  static async listRevisions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId, pageId } = req.params;

    // Verify site belongs to tenant
    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!site) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Site with ID ${siteId} not found` } });
      return;
    }

    // Verify page belongs to site
    const [page] = await db
      .select({ id: pages.id })
      .from(pages)
      .where(and(eq(pages.id, pageId), eq(pages.siteId, siteId)))
      .limit(1);

    if (!page) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Page with ID ${pageId} not found` } });
      return;
    }

    const revisions = await db
      .select()
      .from(pageRevisions)
      .where(eq(pageRevisions.pageId, pageId))
      .orderBy(desc(pageRevisions.version));

    res.json({ success: true, data: revisions });
  }

  /**
   * Get a single revision
   *
   * GET /api/v1/sites/:siteId/pages/:pageId/revisions/:revisionId
   */
  static async getRevision(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId, pageId, revisionId } = req.params;

    // Verify site belongs to tenant
    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!site) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Site with ID ${siteId} not found` } });
      return;
    }

    const [revision] = await db
      .select()
      .from(pageRevisions)
      .where(and(eq(pageRevisions.id, revisionId), eq(pageRevisions.pageId, pageId)))
      .limit(1);

    if (!revision) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Revision with ID ${revisionId} not found` } });
      return;
    }

    res.json({ success: true, data: revision });
  }

  /**
   * Revert a page to a specific revision
   *
   * POST /api/v1/sites/:siteId/pages/:pageId/revisions/:revisionId/revert
   */
  static async revertToRevision(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId, pageId, revisionId } = req.params;

    // Verify site belongs to tenant
    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!site) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Site with ID ${siteId} not found` } });
      return;
    }

    // Verify page belongs to site
    const [existingPage] = await db
      .select()
      .from(pages)
      .where(and(eq(pages.id, pageId), eq(pages.siteId, siteId)))
      .limit(1);

    if (!existingPage) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Page with ID ${pageId} not found` } });
      return;
    }

    // Get the revision to revert to
    const [revision] = await db
      .select()
      .from(pageRevisions)
      .where(and(eq(pageRevisions.id, revisionId), eq(pageRevisions.pageId, pageId)))
      .limit(1);

    if (!revision) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Revision with ID ${revisionId} not found` } });
      return;
    }

    // Snapshot current state before reverting
    const currentBlocks = await db
      .select()
      .from(contentBlocks)
      .where(eq(contentBlocks.pageId, pageId))
      .orderBy(asc(contentBlocks.sortOrder));

    const [maxVersionRow] = await db
      .select({ maxVersion: max(pageRevisions.version) })
      .from(pageRevisions)
      .where(eq(pageRevisions.pageId, pageId));

    const nextVersion = ((maxVersionRow?.maxVersion as number | null) ?? 0) + 1;

    await db.insert(pageRevisions).values({
      pageId,
      version: nextVersion,
      title: existingPage.title,
      slug: existingPage.slug,
      contentSnapshot: currentBlocks.map((b) => ({
        blockType: b.blockType,
        content: b.content,
        settings: b.settings,
        sortOrder: b.sortOrder,
        isVisible: b.isVisible,
      })),
      settingsSnapshot: {
        status: existingPage.status,
        template: existingPage.template,
        metaTitle: existingPage.metaTitle,
        metaDescription: existingPage.metaDescription,
        ogImageUrl: existingPage.ogImageUrl,
      },
      changedBy: req.user?.email ?? null,
      changeNote: `Reverted to version ${revision.version}`,
    });

    // Restore page fields from the revision
    const settings = (revision.settingsSnapshot ?? {}) as Record<string, unknown>;
    await db.update(pages).set({
      title: revision.title,
      slug: revision.slug,
      status: (settings.status as string) ?? existingPage.status,
      template: (settings.template as string) ?? existingPage.template,
      metaTitle: (settings.metaTitle as string) ?? null,
      metaDescription: (settings.metaDescription as string) ?? null,
      ogImageUrl: (settings.ogImageUrl as string) ?? null,
      updatedAt: new Date(),
    }).where(eq(pages.id, pageId));

    // Delete current blocks and recreate from snapshot
    await db.delete(contentBlocks).where(eq(contentBlocks.pageId, pageId));

    const snapshot = (revision.contentSnapshot ?? []) as Array<Record<string, unknown>>;
    const restoredBlocks: ContentBlock[] = [];
    for (const block of snapshot) {
      const [created] = await db
        .insert(contentBlocks)
        .values({
          pageId,
          blockType: block.blockType as string,
          content: (block.content as Record<string, unknown>) ?? {},
          settings: (block.settings as Record<string, unknown>) ?? {},
          sortOrder: (block.sortOrder as number) ?? 0,
          isVisible: (block.isVisible as boolean) ?? true,
        })
        .returning();
      restoredBlocks.push(created);
    }

    // Fetch the updated page
    const [restoredPage] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, pageId))
      .limit(1);

    const pageWithBlocks: PageWithBlocks = {
      ...restoredPage,
      blocks: restoredBlocks,
    };

    res.json({ success: true, data: pageWithBlocks });
  }

  /**
   * Schedule a page for future publish/unpublish
   *
   * PATCH /api/v1/sites/:siteId/pages/:id/schedule
   *
   * Body: { publishAt?: string (ISO 8601), unpublishAt?: string (ISO 8601) }
   *
   * - If publishAt is in the past or now, publishes immediately.
   * - If publishAt is in the future, sets status to 'scheduled'.
   * - unpublishAt sets a future auto-archive time.
   * - Sending null for either field clears that schedule.
   */
  static async schedule(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId, id } = req.params;

    // Verify site belongs to tenant
    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!site) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Site with ID ${siteId} not found` },
      });
      return;
    }

    // Check page exists
    const [existing] = await db
      .select()
      .from(pages)
      .where(and(eq(pages.id, id), eq(pages.siteId, siteId)))
      .limit(1);

    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Page with ID ${id} not found` },
      });
      return;
    }

    // Validate request body
    const parseResult = schedulePageSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid schedule data',
          details: parseResult.error.errors,
        },
      });
      return;
    }

    const { publishAt: publishAtStr, unpublishAt: unpublishAtStr } = parseResult.data;
    const now = new Date();

    const updateData: Record<string, unknown> = { updatedAt: now };

    // Handle publishAt
    if (publishAtStr === null) {
      // Clear schedule — revert to draft if currently scheduled
      updateData.publishAt = null;
      if (existing.status === 'scheduled') {
        updateData.status = 'draft';
      }
    } else if (publishAtStr !== undefined) {
      const publishAt = new Date(publishAtStr);
      if (publishAt <= now) {
        // Publish immediately
        updateData.publishAt = null;
        updateData.status = 'published';
        updateData.publishedAt = now;
      } else {
        // Schedule for future
        updateData.publishAt = publishAt;
        updateData.status = 'scheduled';
      }
    }

    // Handle unpublishAt
    if (unpublishAtStr === null) {
      updateData.unpublishAt = null;
    } else if (unpublishAtStr !== undefined) {
      updateData.unpublishAt = new Date(unpublishAtStr);
    }

    const [updated] = await db
      .update(pages)
      .set(updateData)
      .where(eq(pages.id, id))
      .returning();

    const response: ApiResponse<Page> = {
      success: true,
      data: updated,
    };

    res.json(response);
  }
}

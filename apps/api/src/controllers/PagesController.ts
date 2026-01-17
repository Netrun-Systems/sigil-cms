/**
 * Pages Controller
 *
 * CRUD operations for CMS pages with site filtering
 */

import type { Response } from 'express';
import { eq, and, desc, asc, count, isNull } from 'drizzle-orm';
import { pages, sites, contentBlocks, insertPageSchema, type Page, type PageWithBlocks } from '@netrun-cms/db';
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

    // Check for slug uniqueness within site and language
    const [existing] = await db
      .select({ id: pages.id })
      .from(pages)
      .where(
        and(
          eq(pages.siteId, siteId),
          eq(pages.slug, parseResult.data.slug),
          eq(pages.language, parseResult.data.language || site.defaultLanguage)
        )
      )
      .limit(1);

    if (existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'DUPLICATE_SLUG',
          message: `A page with slug "${parseResult.data.slug}" already exists for this language`,
        },
      };
      res.status(409).json(response);
      return;
    }

    // Compute full path
    let fullPath = '/' + parseResult.data.slug;
    if (parseResult.data.parentId) {
      const [parent] = await db
        .select({ fullPath: pages.fullPath })
        .from(pages)
        .where(eq(pages.id, parseResult.data.parentId))
        .limit(1);

      if (parent?.fullPath) {
        fullPath = parent.fullPath + '/' + parseResult.data.slug;
      }
    }

    const [page] = await db
      .insert(pages)
      .values({
        ...parseResult.data,
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

    const updateData = {
      ...req.body,
      siteId, // Ensure site cannot be changed
      updatedAt: new Date(),
    };

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
}

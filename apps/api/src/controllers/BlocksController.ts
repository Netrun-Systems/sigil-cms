/**
 * Blocks Controller
 *
 * CRUD operations for content blocks with page filtering
 */

import type { Response } from 'express';
import { eq, and, asc, count } from 'drizzle-orm';
import { contentBlocks, pages, sites, insertContentBlockSchema, type ContentBlock } from '@netrun-cms/db';
import { getDb } from '../db.js';
import { parsePagination } from '../middleware/validation.js';
import type { AuthenticatedRequest, ApiResponse, PaginatedResponse } from '../types/index.js';

export class BlocksController {
  /**
   * List all blocks for a page
   *
   * GET /api/v1/sites/:siteId/pages/:pageId/blocks
   */
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId, pageId } = req.params;
    const { page, limit, offset } = parsePagination(req);
    const blockType = req.query.blockType as string | undefined;
    const isVisible = req.query.isVisible as string | undefined;

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

    // Verify page belongs to site
    const [pageRecord] = await db
      .select({ id: pages.id })
      .from(pages)
      .where(and(eq(pages.id, pageId), eq(pages.siteId, siteId)))
      .limit(1);

    if (!pageRecord) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Page with ID ${pageId} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    // Build query conditions
    const conditions = [eq(contentBlocks.pageId, pageId)];
    if (blockType) {
      conditions.push(eq(contentBlocks.blockType, blockType));
    }
    if (isVisible !== undefined) {
      conditions.push(eq(contentBlocks.isVisible, isVisible === 'true'));
    }

    // Get total count
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(contentBlocks)
      .where(and(...conditions));

    // Get paginated results
    const results = await db
      .select()
      .from(contentBlocks)
      .where(and(...conditions))
      .orderBy(asc(contentBlocks.sortOrder))
      .limit(limit)
      .offset(offset);

    const response: PaginatedResponse<ContentBlock> = {
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
   * Get a single block by ID
   *
   * GET /api/v1/sites/:siteId/pages/:pageId/blocks/:id
   */
  static async get(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId, pageId, id } = req.params;

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

    // Verify page belongs to site
    const [pageRecord] = await db
      .select({ id: pages.id })
      .from(pages)
      .where(and(eq(pages.id, pageId), eq(pages.siteId, siteId)))
      .limit(1);

    if (!pageRecord) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Page with ID ${pageId} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    const [block] = await db
      .select()
      .from(contentBlocks)
      .where(and(eq(contentBlocks.id, id), eq(contentBlocks.pageId, pageId)))
      .limit(1);

    if (!block) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Block with ID ${id} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<ContentBlock> = {
      success: true,
      data: block,
    };

    res.json(response);
  }

  /**
   * Create a new block
   *
   * POST /api/v1/sites/:siteId/pages/:pageId/blocks
   */
  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
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

    // Verify page belongs to site
    const [pageRecord] = await db
      .select({ id: pages.id })
      .from(pages)
      .where(and(eq(pages.id, pageId), eq(pages.siteId, siteId)))
      .limit(1);

    if (!pageRecord) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Page with ID ${pageId} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    // Validate request body
    const parseResult = insertContentBlockSchema.safeParse({
      ...req.body,
      pageId,
    });

    if (!parseResult.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid block data',
          details: parseResult.error.errors,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Get max sort order if not provided
    if (parseResult.data.sortOrder === undefined || parseResult.data.sortOrder === 0) {
      const [maxSort] = await db
        .select({ maxOrder: count() })
        .from(contentBlocks)
        .where(eq(contentBlocks.pageId, pageId));

      parseResult.data.sortOrder = (maxSort?.maxOrder || 0) + 1;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [block] = await db
      .insert(contentBlocks)
      .values(parseResult.data as any)
      .returning();

    const response: ApiResponse<ContentBlock> = {
      success: true,
      data: block,
    };

    res.status(201).json(response);
  }

  /**
   * Update an existing block
   *
   * PUT /api/v1/sites/:siteId/pages/:pageId/blocks/:id
   */
  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId, pageId, id } = req.params;

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

    // Verify page belongs to site
    const [pageRecord] = await db
      .select({ id: pages.id })
      .from(pages)
      .where(and(eq(pages.id, pageId), eq(pages.siteId, siteId)))
      .limit(1);

    if (!pageRecord) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Page with ID ${pageId} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check block exists
    const [existing] = await db
      .select({ id: contentBlocks.id })
      .from(contentBlocks)
      .where(and(eq(contentBlocks.id, id), eq(contentBlocks.pageId, pageId)))
      .limit(1);

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Block with ID ${id} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    const updateData = {
      ...req.body,
      pageId, // Ensure page cannot be changed
      updatedAt: new Date(),
    };

    const [block] = await db
      .update(contentBlocks)
      .set(updateData)
      .where(eq(contentBlocks.id, id))
      .returning();

    const response: ApiResponse<ContentBlock> = {
      success: true,
      data: block,
    };

    res.json(response);
  }

  /**
   * Delete a block
   *
   * DELETE /api/v1/sites/:siteId/pages/:pageId/blocks/:id
   */
  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId, pageId, id } = req.params;

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

    // Verify page belongs to site
    const [pageRecord] = await db
      .select({ id: pages.id })
      .from(pages)
      .where(and(eq(pages.id, pageId), eq(pages.siteId, siteId)))
      .limit(1);

    if (!pageRecord) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Page with ID ${pageId} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check block exists
    const [existing] = await db
      .select({ id: contentBlocks.id })
      .from(contentBlocks)
      .where(and(eq(contentBlocks.id, id), eq(contentBlocks.pageId, pageId)))
      .limit(1);

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Block with ID ${id} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    await db.delete(contentBlocks).where(eq(contentBlocks.id, id));

    const response: ApiResponse<{ id: string }> = {
      success: true,
      data: { id },
    };

    res.json(response);
  }

  /**
   * Reorder blocks within a page
   *
   * PUT /api/v1/sites/:siteId/pages/:pageId/blocks/reorder
   */
  static async reorder(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId, pageId } = req.params;
    const { blockIds } = req.body as { blockIds: string[] };

    if (!Array.isArray(blockIds) || blockIds.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'blockIds must be a non-empty array of block IDs',
        },
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
        error: {
          code: 'NOT_FOUND',
          message: `Site with ID ${siteId} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    // Verify page belongs to site
    const [pageRecord] = await db
      .select({ id: pages.id })
      .from(pages)
      .where(and(eq(pages.id, pageId), eq(pages.siteId, siteId)))
      .limit(1);

    if (!pageRecord) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Page with ID ${pageId} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    // Update sort order for each block
    const updates = blockIds.map((blockId, index) =>
      db
        .update(contentBlocks)
        .set({ sortOrder: index + 1, updatedAt: new Date() })
        .where(and(eq(contentBlocks.id, blockId), eq(contentBlocks.pageId, pageId)))
    );

    await Promise.all(updates);

    // Fetch updated blocks
    const blocks = await db
      .select()
      .from(contentBlocks)
      .where(eq(contentBlocks.pageId, pageId))
      .orderBy(asc(contentBlocks.sortOrder));

    const response: ApiResponse<ContentBlock[]> = {
      success: true,
      data: blocks,
    };

    res.json(response);
  }
}

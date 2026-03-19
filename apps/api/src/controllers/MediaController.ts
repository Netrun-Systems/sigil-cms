/**
 * Media Controller
 *
 * CRUD operations for media files with site filtering
 */

import type { Response } from 'express';
import { eq, and, desc, asc, count, like, or } from 'drizzle-orm';
import { media, sites, insertMediaSchema, type Media } from '@netrun-cms/db';
import { getDb } from '../db.js';
import { parsePagination } from '../middleware/validation.js';
import type { AuthenticatedRequest, ApiResponse, PaginatedResponse } from '../types/index.js';

export class MediaController {
  /**
   * List all media for a site
   *
   * GET /api/v1/sites/:siteId/media
   */
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId } = req.params;
    const { page, limit, offset } = parsePagination(req);
    const folder = req.query.folder as string | undefined;
    const mimeType = req.query.mimeType as string | undefined;
    const search = req.query.search as string | undefined;

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
    const conditions = [eq(media.siteId, siteId)];
    if (folder) {
      conditions.push(eq(media.folder, folder));
    }
    if (mimeType) {
      // Support partial mime type matching (e.g., "image" matches "image/png", "image/jpeg")
      if (mimeType.includes('/')) {
        conditions.push(eq(media.mimeType, mimeType));
      } else {
        conditions.push(like(media.mimeType, `${mimeType}/%`));
      }
    }
    if (search) {
      conditions.push(
        or(
          like(media.filename, `%${search}%`),
          like(media.originalFilename, `%${search}%`),
          like(media.altText, `%${search}%`)
        )!
      );
    }

    // Get total count
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(media)
      .where(and(...conditions));

    // Get paginated results
    const results = await db
      .select()
      .from(media)
      .where(and(...conditions))
      .orderBy(desc(media.createdAt))
      .limit(limit)
      .offset(offset);

    const response: PaginatedResponse<Media> = {
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
   * Get a single media item by ID
   *
   * GET /api/v1/sites/:siteId/media/:id
   */
  static async get(req: AuthenticatedRequest, res: Response): Promise<void> {
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

    const [mediaItem] = await db
      .select()
      .from(media)
      .where(and(eq(media.id, id), eq(media.siteId, siteId)))
      .limit(1);

    if (!mediaItem) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Media with ID ${id} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<Media> = {
      success: true,
      data: mediaItem,
    };

    res.json(response);
  }

  /**
   * Create a new media record
   *
   * POST /api/v1/sites/:siteId/media
   *
   * Note: This creates the database record. File upload should be handled separately
   * (e.g., direct to blob storage with signed URLs)
   */
  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId } = req.params;

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

    // Validate request body
    const parseResult = insertMediaSchema.safeParse({
      ...req.body,
      siteId,
    });

    if (!parseResult.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid media data',
          details: parseResult.error.errors,
        },
      };
      res.status(400).json(response);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [mediaItem] = await db
      .insert(media)
      .values(parseResult.data as any)
      .returning();

    const response: ApiResponse<Media> = {
      success: true,
      data: mediaItem,
    };

    res.status(201).json(response);
  }

  /**
   * Update media metadata
   *
   * PUT /api/v1/sites/:siteId/media/:id
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

    // Check media exists
    const [existing] = await db
      .select({ id: media.id })
      .from(media)
      .where(and(eq(media.id, id), eq(media.siteId, siteId)))
      .limit(1);

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Media with ID ${id} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    // Only allow updating certain fields
    const allowedFields = ['altText', 'caption', 'folder', 'metadata'];
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const [mediaItem] = await db
      .update(media)
      .set(updateData)
      .where(eq(media.id, id))
      .returning();

    const response: ApiResponse<Media> = {
      success: true,
      data: mediaItem,
    };

    res.json(response);
  }

  /**
   * Delete a media item
   *
   * DELETE /api/v1/sites/:siteId/media/:id
   *
   * Note: This deletes the database record. File deletion from storage
   * should be handled separately (e.g., via a background job or webhook)
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

    // Check media exists and get URL for potential cleanup
    const [existing] = await db
      .select({ id: media.id, url: media.url, filename: media.filename })
      .from(media)
      .where(and(eq(media.id, id), eq(media.siteId, siteId)))
      .limit(1);

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Media with ID ${id} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    await db.delete(media).where(eq(media.id, id));

    const response: ApiResponse<{ id: string; url: string }> = {
      success: true,
      data: { id, url: existing.url },
    };

    res.json(response);
  }

  /**
   * List folders in a site's media library
   *
   * GET /api/v1/sites/:siteId/media/folders
   */
  static async listFolders(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId } = req.params;

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

    // Get distinct folders with counts
    const folders = await db
      .select({
        folder: media.folder,
        count: count(),
      })
      .from(media)
      .where(eq(media.siteId, siteId))
      .groupBy(media.folder)
      .orderBy(asc(media.folder));

    const response: ApiResponse<Array<{ folder: string; count: number }>> = {
      success: true,
      data: folders,
    };

    res.json(response);
  }
}

/**
 * Media Controller
 *
 * CRUD operations for media files with site filtering
 */

import type { Response } from 'express';
import { eq, and, desc, asc, count, like, or } from 'drizzle-orm';
import { media, sites, insertMediaSchema, type Media } from '@netrun-cms/db';
import { uploadFile } from '@netrun-cms/plugin-runtime';
import { getDb } from '../db.js';
import { parsePagination } from '../middleware/validation.js';
import type { AuthenticatedRequest, ApiResponse, PaginatedResponse } from '../types/index.js';

/**
 * Build a tenant-isolated storage path prefix.
 *
 * All media uploads are stored under `media/{tenantId}/{siteId}/` to prevent
 * cross-tenant URL leakage. The prefix is prepended to the filename that the
 * storage provider receives, producing object keys like:
 *   `media/abc-123/def-456/uuid.jpg`
 */
function buildStoragePath(tenantId: string, siteId: string, filename: string): string {
  return `media/${tenantId}/${siteId}/${filename}`;
}

/**
 * Validate that a media URL belongs to the requesting tenant.
 * Returns true if the URL contains the expected tenant path prefix or if the
 * URL predates tenant-isolated storage (legacy flat paths).
 */
function validateMediaTenantPath(url: string, tenantId: string): boolean {
  // Tenant-isolated URLs contain the tenant ID in the path
  if (url.includes(`/media/${tenantId}/`)) {
    return true;
  }
  // Legacy URLs without tenant prefix are accessible (backward compat)
  if (!url.includes('/media/') || !url.match(/\/media\/[0-9a-f]{8}-/)) {
    return true;
  }
  // URL has a tenant prefix but it doesn't match -- reject
  return false;
}

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

    // Validate the media URL belongs to the requesting tenant (cross-tenant leak prevention)
    if (!validateMediaTenantPath(mediaItem.url, tenantId)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Media does not belong to the current tenant',
        },
      };
      res.status(403).json(response);
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

  /**
   * Upload a single file and create a media record
   *
   * POST /api/v1/sites/:siteId/media/upload
   */
  static async createWithFile(req: AuthenticatedRequest, res: Response): Promise<void> {
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

    const file = req.file;
    if (!file) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No file provided. Send a file in the "file" field.',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Upload to storage with tenant-isolated path prefix: media/{tenantId}/{siteId}/{uuid.ext}
    const storagePath = buildStoragePath(tenantId, siteId, '');
    const { id: storageId, storedName, url } = await uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      { pathPrefix: storagePath },
    );

    // Create media record
    const insertData = {
      siteId,
      filename: storedName,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      url,
      altText: (req.body.altText as string) || null,
      caption: (req.body.caption as string) || null,
      folder: (req.body.folder as string) || null,
      metadata: { storageId, storedName },
    };

    const parseResult = insertMediaSchema.safeParse(insertData);
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
   * Upload multiple files and create media records
   *
   * POST /api/v1/sites/:siteId/media/upload/bulk
   */
  static async createWithFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
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

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No files provided. Send files in the "files" field.',
        },
      };
      res.status(400).json(response);
      return;
    }

    const folder = (req.body.folder as string) || null;
    const created: Media[] = [];
    const errors: Array<{ filename: string; error: string }> = [];

    // Build tenant-isolated storage path prefix
    const storagePath = buildStoragePath(tenantId, siteId, '');

    for (const file of files) {
      try {
        const { id: storageId, storedName, url } = await uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          { pathPrefix: storagePath },
        );

        const insertData = {
          siteId,
          filename: storedName,
          originalFilename: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          url,
          folder,
          metadata: { storageId, storedName },
        };

        const parseResult = insertMediaSchema.safeParse(insertData);
        if (!parseResult.success) {
          errors.push({ filename: file.originalname, error: 'Validation failed' });
          continue;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [mediaItem] = await db
          .insert(media)
          .values(parseResult.data as any)
          .returning();

        created.push(mediaItem);
      } catch (err) {
        errors.push({
          filename: file.originalname,
          error: err instanceof Error ? err.message : 'Upload failed',
        });
      }
    }

    const response: ApiResponse<{ uploaded: Media[]; errors: Array<{ filename: string; error: string }> }> = {
      success: true,
      data: { uploaded: created, errors },
    };

    res.status(created.length > 0 ? 201 : 400).json(response);
  }

  /**
   * Set the focal point for an image.
   *
   * PUT /api/v1/sites/:siteId/media/:id/focal-point
   *
   * The focal point defines the point of interest for responsive cropping.
   * Values are percentages: x=0 is left edge, x=100 is right edge,
   * y=0 is top, y=100 is bottom. Default is (50, 50) = center.
   *
   * Body: { x: number (0-100), y: number (0-100) }
   */
  static async setFocalPoint(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId, id } = req.params;
    const { x, y } = req.body;

    if (typeof x !== 'number' || typeof y !== 'number' || x < 0 || x > 100 || y < 0 || y > 100) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'x and y must be numbers between 0 and 100' },
      });
      return;
    }

    // Verify site belongs to tenant
    const [site] = await db.select({ id: sites.id }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
    if (!site) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } });
      return;
    }

    // Update focal point via raw SQL (columns added by migration 005)
    const result = await db.execute({
      text: `
        UPDATE cms_media SET focal_x = $1, focal_y = $2, updated_at = NOW()
        WHERE id = $3 AND site_id = $4
        RETURNING id, filename, url, focal_x, focal_y
      `,
      values: [x, y, id, siteId],
    } as any);

    const rows = (result as any).rows ?? result;
    if (!rows.length) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Media not found' } });
      return;
    }

    res.json({
      success: true,
      data: {
        id: rows[0].id,
        focalPoint: { x: rows[0].focal_x, y: rows[0].focal_y },
        css: `object-position: ${x}% ${y}%`,
      },
    });
  }
}

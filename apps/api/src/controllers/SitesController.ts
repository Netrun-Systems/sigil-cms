/**
 * Sites Controller
 *
 * CRUD operations for CMS sites
 */

import type { Response } from 'express';
import { eq, and, desc, asc, count } from 'drizzle-orm';
import { sites, insertSiteSchema, type Site } from '@netrun-cms/db';
import { getDb } from '../db.js';
import { parsePagination } from '../middleware/validation.js';
import type { AuthenticatedRequest, ApiResponse, PaginatedResponse } from '../types/index.js';

export class SitesController {
  /**
   * List all sites for the current tenant
   *
   * GET /api/v1/sites
   */
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { page, limit, offset } = parsePagination(req);
    const status = req.query.status as string | undefined;

    // Build query conditions
    const conditions = [eq(sites.tenantId, tenantId)];
    if (status) {
      conditions.push(eq(sites.status, status));
    }

    // Get total count
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(sites)
      .where(and(...conditions));

    // Get paginated results
    const results = await db
      .select()
      .from(sites)
      .where(and(...conditions))
      .orderBy(desc(sites.updatedAt))
      .limit(limit)
      .offset(offset);

    const response: PaginatedResponse<Site> = {
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
   * Get a single site by ID
   *
   * GET /api/v1/sites/:id
   */
  static async get(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const [site] = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, id), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!site) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Site with ID ${id} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<Site> = {
      success: true,
      data: site,
    };

    res.json(response);
  }

  /**
   * Create a new site
   *
   * POST /api/v1/sites
   */
  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;

    // Validate request body
    const parseResult = insertSiteSchema.safeParse({
      ...req.body,
      tenantId,
    });

    if (!parseResult.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid site data',
          details: parseResult.error.errors,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Check for slug uniqueness within tenant
    const [existing] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.tenantId, tenantId), eq(sites.slug, parseResult.data.slug)))
      .limit(1);

    if (existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'DUPLICATE_SLUG',
          message: `A site with slug "${parseResult.data.slug}" already exists`,
        },
      };
      res.status(409).json(response);
      return;
    }

    const [site] = await db
      .insert(sites)
      .values(parseResult.data)
      .returning();

    const response: ApiResponse<Site> = {
      success: true,
      data: site,
    };

    res.status(201).json(response);
  }

  /**
   * Update an existing site
   *
   * PUT /api/v1/sites/:id
   */
  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { id } = req.params;

    // Check site exists and belongs to tenant
    const [existing] = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, id), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Site with ID ${id} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    // Validate update data (partial)
    const updateData = {
      ...req.body,
      tenantId, // Ensure tenant cannot be changed
      updatedAt: new Date(),
    };

    // If slug is being changed, check uniqueness
    if (updateData.slug && updateData.slug !== existing.slug) {
      const [slugConflict] = await db
        .select({ id: sites.id })
        .from(sites)
        .where(and(eq(sites.tenantId, tenantId), eq(sites.slug, updateData.slug)))
        .limit(1);

      if (slugConflict) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'DUPLICATE_SLUG',
            message: `A site with slug "${updateData.slug}" already exists`,
          },
        };
        res.status(409).json(response);
        return;
      }
    }

    const [site] = await db
      .update(sites)
      .set(updateData)
      .where(eq(sites.id, id))
      .returning();

    const response: ApiResponse<Site> = {
      success: true,
      data: site,
    };

    res.json(response);
  }

  /**
   * Delete a site
   *
   * DELETE /api/v1/sites/:id
   */
  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { id } = req.params;

    // Check site exists and belongs to tenant
    const [existing] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, id), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Site with ID ${id} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    await db.delete(sites).where(eq(sites.id, id));

    const response: ApiResponse<{ id: string }> = {
      success: true,
      data: { id },
    };

    res.json(response);
  }
}

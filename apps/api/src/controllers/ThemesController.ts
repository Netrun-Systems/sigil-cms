/**
 * Themes Controller
 *
 * CRUD operations for themes with site filtering
 */

import type { Response } from 'express';
import { eq, and, desc, asc, count } from 'drizzle-orm';
import { themes, sites, insertThemeSchema, type Theme } from '@netrun-cms/db';
import { getDb } from '../db.js';
import { parsePagination } from '../middleware/validation.js';
import type { AuthenticatedRequest, ApiResponse, PaginatedResponse } from '../types/index.js';

export class ThemesController {
  /**
   * List all themes for a site
   *
   * GET /api/v1/sites/:siteId/themes
   */
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId } = req.params;
    const { page, limit, offset } = parsePagination(req);
    const baseTheme = req.query.baseTheme as string | undefined;
    const isActive = req.query.isActive as string | undefined;

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
    const conditions = [eq(themes.siteId, siteId)];
    if (baseTheme) {
      conditions.push(eq(themes.baseTheme, baseTheme));
    }
    if (isActive !== undefined) {
      conditions.push(eq(themes.isActive, isActive === 'true'));
    }

    // Get total count
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(themes)
      .where(and(...conditions));

    // Get paginated results
    const results = await db
      .select()
      .from(themes)
      .where(and(...conditions))
      .orderBy(desc(themes.isActive), desc(themes.updatedAt))
      .limit(limit)
      .offset(offset);

    const response: PaginatedResponse<Theme> = {
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
   * Get a single theme by ID
   *
   * GET /api/v1/sites/:siteId/themes/:id
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

    const [theme] = await db
      .select()
      .from(themes)
      .where(and(eq(themes.id, id), eq(themes.siteId, siteId)))
      .limit(1);

    if (!theme) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Theme with ID ${id} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<Theme> = {
      success: true,
      data: theme,
    };

    res.json(response);
  }

  /**
   * Get the active theme for a site
   *
   * GET /api/v1/sites/:siteId/themes/active
   */
  static async getActive(req: AuthenticatedRequest, res: Response): Promise<void> {
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

    const [theme] = await db
      .select()
      .from(themes)
      .where(and(eq(themes.siteId, siteId), eq(themes.isActive, true)))
      .limit(1);

    if (!theme) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No active theme found for this site',
        },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<Theme> = {
      success: true,
      data: theme,
    };

    res.json(response);
  }

  /**
   * Create a new theme
   *
   * POST /api/v1/sites/:siteId/themes
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
    const parseResult = insertThemeSchema.safeParse({
      ...req.body,
      siteId,
    });

    if (!parseResult.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid theme data',
          details: parseResult.error.errors,
        },
      };
      res.status(400).json(response);
      return;
    }

    // If this theme should be active, deactivate other themes first
    if (parseResult.data.isActive) {
      await db
        .update(themes)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(themes.siteId, siteId), eq(themes.isActive, true)));
    }

    const [theme] = await db
      .insert(themes)
      .values(parseResult.data)
      .returning();

    const response: ApiResponse<Theme> = {
      success: true,
      data: theme,
    };

    res.status(201).json(response);
  }

  /**
   * Update an existing theme
   *
   * PUT /api/v1/sites/:siteId/themes/:id
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

    // Check theme exists
    const [existing] = await db
      .select()
      .from(themes)
      .where(and(eq(themes.id, id), eq(themes.siteId, siteId)))
      .limit(1);

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Theme with ID ${id} not found`,
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

    // If setting this theme to active, deactivate other themes first
    if (updateData.isActive && !existing.isActive) {
      await db
        .update(themes)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(themes.siteId, siteId), eq(themes.isActive, true)));
    }

    const [theme] = await db
      .update(themes)
      .set(updateData)
      .where(eq(themes.id, id))
      .returning();

    const response: ApiResponse<Theme> = {
      success: true,
      data: theme,
    };

    res.json(response);
  }

  /**
   * Activate a theme (deactivates all other themes for the site)
   *
   * POST /api/v1/sites/:siteId/themes/:id/activate
   */
  static async activate(req: AuthenticatedRequest, res: Response): Promise<void> {
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

    // Check theme exists
    const [existing] = await db
      .select({ id: themes.id })
      .from(themes)
      .where(and(eq(themes.id, id), eq(themes.siteId, siteId)))
      .limit(1);

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Theme with ID ${id} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    // Deactivate all themes for this site
    await db
      .update(themes)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(themes.siteId, siteId));

    // Activate the target theme
    const [theme] = await db
      .update(themes)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(themes.id, id))
      .returning();

    const response: ApiResponse<Theme> = {
      success: true,
      data: theme,
    };

    res.json(response);
  }

  /**
   * Delete a theme
   *
   * DELETE /api/v1/sites/:siteId/themes/:id
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

    // Check theme exists
    const [existing] = await db
      .select({ id: themes.id, isActive: themes.isActive })
      .from(themes)
      .where(and(eq(themes.id, id), eq(themes.siteId, siteId)))
      .limit(1);

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Theme with ID ${id} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    // Prevent deleting active theme
    if (existing.isActive) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'CANNOT_DELETE_ACTIVE',
          message: 'Cannot delete the active theme. Please activate another theme first.',
        },
      };
      res.status(400).json(response);
      return;
    }

    await db.delete(themes).where(eq(themes.id, id));

    const response: ApiResponse<{ id: string }> = {
      success: true,
      data: { id },
    };

    res.json(response);
  }

  /**
   * Duplicate a theme
   *
   * POST /api/v1/sites/:siteId/themes/:id/duplicate
   */
  static async duplicate(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { siteId, id } = req.params;
    const { name } = req.body as { name?: string };

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

    // Get source theme
    const [source] = await db
      .select()
      .from(themes)
      .where(and(eq(themes.id, id), eq(themes.siteId, siteId)))
      .limit(1);

    if (!source) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Theme with ID ${id} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    // Create duplicate
    const [theme] = await db
      .insert(themes)
      .values({
        siteId,
        name: name || `${source.name} (Copy)`,
        baseTheme: source.baseTheme,
        tokens: source.tokens,
        customCss: source.customCss,
        isActive: false, // New theme is never active
      })
      .returning();

    const response: ApiResponse<Theme> = {
      success: true,
      data: theme,
    };

    res.status(201).json(response);
  }
}

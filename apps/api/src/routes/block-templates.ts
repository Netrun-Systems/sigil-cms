/**
 * Block Templates Routes
 *
 * CRUD routes for reusable block templates with cross-tenant sharing.
 *
 * Templates have three scopes:
 * - 'site':   visible only within the owning site (default)
 * - 'tenant': visible to all sites in the owning tenant (requires admin role)
 * - 'global': visible to all tenants (requires admin role -- platform presets)
 */

import { Router } from 'express';
import type { Router as RouterType } from 'express';
import { eq, and, or, desc, count } from 'drizzle-orm';
import { blockTemplates, sites, insertBlockTemplateSchema, type BlockTemplate } from '@netrun-cms/db';
import { getDb } from '../db.js';
import { authenticate, requireRole, tenantContext, validateUuidParam } from '../middleware/index.js';
import { parsePagination } from '../middleware/validation.js';
import type { AuthenticatedRequest, ApiResponse, PaginatedResponse } from '../types/index.js';

const router: RouterType = Router({ mergeParams: true });

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantContext);

/**
 * GET /api/v1/sites/:siteId/block-templates
 * List block templates available for a site.
 *
 * Returns:
 * - Templates scoped to this site (scope = 'site' AND site_id = :siteId)
 * - Templates scoped to the tenant (scope = 'tenant' AND tenant_id = current tenant)
 * - Global platform templates (scope = 'global')
 *
 * Query params:
 * - page, limit: pagination
 * - blockType: filter by block type
 * - scope: filter by scope ('site', 'tenant', 'global')
 */
router.get('/', async (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const tenantId = req.tenantId!;
  const { siteId } = req.params;
  const { page, limit, offset } = parsePagination(req);
  const blockType = req.query.blockType as string | undefined;
  const scopeFilter = req.query.scope as string | undefined;

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

  // Build visibility conditions:
  // site-scoped for this site OR tenant-scoped for this tenant OR global
  const visibilityConditions = scopeFilter
    ? scopeFilter === 'site'
      ? and(eq(blockTemplates.scope, 'site'), eq(blockTemplates.siteId, siteId))
      : scopeFilter === 'tenant'
        ? and(eq(blockTemplates.scope, 'tenant'), eq(blockTemplates.tenantId, tenantId))
        : eq(blockTemplates.scope, 'global')
    : or(
        and(eq(blockTemplates.scope, 'site'), eq(blockTemplates.siteId, siteId)),
        and(eq(blockTemplates.scope, 'tenant'), eq(blockTemplates.tenantId, tenantId)),
        eq(blockTemplates.scope, 'global'),
      );

  const conditions = blockType
    ? and(visibilityConditions!, eq(blockTemplates.blockType, blockType))
    : visibilityConditions;

  // Get total count
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(blockTemplates)
    .where(conditions);

  // Get paginated results
  const results = await db
    .select()
    .from(blockTemplates)
    .where(conditions)
    .orderBy(desc(blockTemplates.createdAt))
    .limit(limit)
    .offset(offset);

  const response: PaginatedResponse<BlockTemplate> = {
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
});

/**
 * GET /api/v1/sites/:siteId/block-templates/:id
 * Get a single block template by ID.
 *
 * Enforces visibility: the template must be accessible to the current site.
 */
router.get('/:id', validateUuidParam('id'), async (req: AuthenticatedRequest, res) => {
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

  const [template] = await db
    .select()
    .from(blockTemplates)
    .where(
      and(
        eq(blockTemplates.id, id),
        or(
          and(eq(blockTemplates.scope, 'site'), eq(blockTemplates.siteId, siteId)),
          and(eq(blockTemplates.scope, 'tenant'), eq(blockTemplates.tenantId, tenantId)),
          eq(blockTemplates.scope, 'global'),
        ),
      ),
    )
    .limit(1);

  if (!template) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Block template with ID ${id} not found`,
      },
    };
    res.status(404).json(response);
    return;
  }

  const response: ApiResponse<BlockTemplate> = {
    success: true,
    data: template,
  };

  res.json(response);
});

/**
 * POST /api/v1/sites/:siteId/block-templates
 * Create a new block template.
 *
 * Body: {
 *   name: string,
 *   blockType: string,
 *   content?: object,
 *   settings?: object,
 *   scope?: 'site' | 'tenant' | 'global' (default: 'site')
 * }
 *
 * Authorization:
 * - 'site' scope: admin, editor, or author
 * - 'tenant' scope: admin only
 * - 'global' scope: admin only (platform-wide presets)
 */
router.post('/', requireRole('admin', 'editor', 'author'), async (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const tenantId = req.tenantId!;
  const { siteId } = req.params;
  const requestedScope = (req.body.scope as string) || 'site';

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

  // Only admins can create tenant-scoped or global templates
  if ((requestedScope === 'tenant' || requestedScope === 'global') && req.user!.role !== 'admin') {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `Only admins can create ${requestedScope}-scoped templates`,
      },
    };
    res.status(403).json(response);
    return;
  }

  // Build insert data with proper scoping
  const insertData = {
    ...req.body,
    siteId: requestedScope === 'global' ? null : siteId,
    tenantId: requestedScope === 'global' ? null : tenantId,
    scope: requestedScope,
    isGlobal: requestedScope === 'global',
  };

  const parseResult = insertBlockTemplateSchema.safeParse(insertData);
  if (!parseResult.success) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid block template data',
        details: parseResult.error.errors,
      },
    };
    res.status(400).json(response);
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [template] = await db
    .insert(blockTemplates)
    .values(parseResult.data as any)
    .returning();

  const response: ApiResponse<BlockTemplate> = {
    success: true,
    data: template,
  };

  res.status(201).json(response);
});

/**
 * PUT /api/v1/sites/:siteId/block-templates/:id
 * Update a block template.
 *
 * Only the owner (matching site or tenant) can update.
 * Global templates require admin role.
 */
router.put('/:id', validateUuidParam('id'), requireRole('admin', 'editor', 'author'), async (req: AuthenticatedRequest, res) => {
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

  // Find template — must be editable by this user
  const [existing] = await db
    .select()
    .from(blockTemplates)
    .where(
      and(
        eq(blockTemplates.id, id),
        or(
          // Site-scoped: must own the site
          and(eq(blockTemplates.scope, 'site'), eq(blockTemplates.siteId, siteId)),
          // Tenant-scoped: must be in the same tenant
          and(eq(blockTemplates.scope, 'tenant'), eq(blockTemplates.tenantId, tenantId)),
          // Global: admin only (checked below)
          eq(blockTemplates.scope, 'global'),
        ),
      ),
    )
    .limit(1);

  if (!existing) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Block template with ID ${id} not found`,
      },
    };
    res.status(404).json(response);
    return;
  }

  // Global and tenant-scoped templates require admin
  if ((existing.scope === 'global' || existing.scope === 'tenant') && req.user!.role !== 'admin') {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `Only admins can update ${existing.scope}-scoped templates`,
      },
    };
    res.status(403).json(response);
    return;
  }

  const allowedFields = ['name', 'blockType', 'content', 'settings'];
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  const [template] = await db
    .update(blockTemplates)
    .set(updateData)
    .where(eq(blockTemplates.id, id))
    .returning();

  const response: ApiResponse<BlockTemplate> = {
    success: true,
    data: template,
  };

  res.json(response);
});

/**
 * DELETE /api/v1/sites/:siteId/block-templates/:id
 * Delete a block template.
 *
 * Site-scoped: admin or editor who owns the site.
 * Tenant/global-scoped: admin only.
 */
router.delete('/:id', validateUuidParam('id'), requireRole('admin', 'editor'), async (req: AuthenticatedRequest, res) => {
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

  const [existing] = await db
    .select({ id: blockTemplates.id, scope: blockTemplates.scope })
    .from(blockTemplates)
    .where(
      and(
        eq(blockTemplates.id, id),
        or(
          and(eq(blockTemplates.scope, 'site'), eq(blockTemplates.siteId, siteId)),
          and(eq(blockTemplates.scope, 'tenant'), eq(blockTemplates.tenantId, tenantId)),
          eq(blockTemplates.scope, 'global'),
        ),
      ),
    )
    .limit(1);

  if (!existing) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Block template with ID ${id} not found`,
      },
    };
    res.status(404).json(response);
    return;
  }

  if ((existing.scope === 'global' || existing.scope === 'tenant') && req.user!.role !== 'admin') {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `Only admins can delete ${existing.scope}-scoped templates`,
      },
    };
    res.status(403).json(response);
    return;
  }

  await db.delete(blockTemplates).where(eq(blockTemplates.id, id));

  const response: ApiResponse<{ id: string }> = {
    success: true,
    data: { id },
  };

  res.json(response);
});

export default router;

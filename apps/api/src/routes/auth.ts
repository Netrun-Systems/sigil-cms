/**
 * Auth Routes
 *
 * Multi-tenant authentication helpers:
 * - List tenants a user has access to
 * - Switch active tenant (re-issue JWT)
 * - Get current tenant info
 */

import { Router } from 'express';
import type { Router as RouterType } from 'express';
import { eq, and } from 'drizzle-orm';
import { users, tenants } from '@netrun-cms/db';
import { getDb } from '../db.js';
import { authenticate, generateToken } from '../middleware/index.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';

const router: RouterType = Router();

/**
 * GET /api/v1/auth/tenants
 * List all tenants the authenticated user has access to.
 *
 * Looks up every user row that shares the caller's email across
 * different tenants and returns the tenant + role for each.
 */
router.get('/tenants', authenticate, async (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const email = req.user!.email;

  const rows = await db
    .select({
      tenantId: tenants.id,
      tenantName: tenants.name,
      tenantSlug: tenants.slug,
      tenantPlan: tenants.plan,
      role: users.role,
      userId: users.id,
    })
    .from(users)
    .innerJoin(tenants, eq(users.tenantId, tenants.id))
    .where(and(eq(users.email, email), eq(users.isActive, true), eq(tenants.isActive, true)));

  const response: ApiResponse<typeof rows> = {
    success: true,
    data: rows,
  };

  res.json(response);
});

/**
 * POST /api/v1/auth/switch-tenant
 * Issue a new JWT scoped to a different tenant.
 *
 * Body: { tenant_id: string }
 *
 * The caller must have an active user record in the target tenant
 * (same email address). Returns a fresh token with the new tenant context.
 */
router.post('/switch-tenant', authenticate, async (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const email = req.user!.email;
  const { tenant_id } = req.body as { tenant_id?: string };

  if (!tenant_id) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'tenant_id is required in the request body',
      },
    };
    res.status(400).json(response);
    return;
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(tenant_id)) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INVALID_TENANT_ID',
        message: 'tenant_id must be a valid UUID',
      },
    };
    res.status(400).json(response);
    return;
  }

  // Verify the user has an active record in the target tenant
  const [targetUser] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      tenantId: users.tenantId,
    })
    .from(users)
    .innerJoin(tenants, eq(users.tenantId, tenants.id))
    .where(
      and(
        eq(users.email, email),
        eq(users.tenantId, tenant_id),
        eq(users.isActive, true),
        eq(tenants.isActive, true),
      ),
    )
    .limit(1);

  if (!targetUser) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have access to the requested tenant',
      },
    };
    res.status(403).json(response);
    return;
  }

  // Issue a new JWT with the target tenant context
  const token = generateToken({
    id: targetUser.id,
    email: targetUser.email,
    role: targetUser.role as 'admin' | 'editor' | 'author' | 'viewer',
    tenantId: targetUser.tenantId,
  });

  const response: ApiResponse<{ token: string; tenantId: string; role: string }> = {
    success: true,
    data: {
      token,
      tenantId: targetUser.tenantId,
      role: targetUser.role,
    },
  };

  res.json(response);
});

/**
 * GET /api/v1/tenants/current
 * Return info about the tenant in the caller's JWT.
 */
router.get('/current', authenticate, async (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const tenantId = req.tenantId!;

  const [tenant] = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      plan: tenants.plan,
      isActive: tenants.isActive,
      createdAt: tenants.createdAt,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Current tenant not found',
      },
    };
    res.status(404).json(response);
    return;
  }

  const response: ApiResponse<typeof tenant> = {
    success: true,
    data: tenant,
  };

  res.json(response);
});

export default router;

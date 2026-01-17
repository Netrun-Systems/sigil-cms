/**
 * Multi-tenant Context Middleware
 *
 * Sets PostgreSQL session variables for Row-Level Security (RLS)
 */

import type { Response, NextFunction } from 'express';
import { setTenantContext, clearTenantContext } from '@netrun-cms/db';
import type { AuthenticatedRequest } from '../types/index.js';
import { getDb } from '../db.js';

/**
 * Set tenant context for RLS-enabled database queries
 *
 * This middleware must run after authentication and before any database operations
 */
export function tenantContext(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const tenantId = req.tenantId || req.headers['x-tenant-id'] as string;

  if (!tenantId) {
    res.status(400).json({
      success: false,
      error: {
        code: 'TENANT_REQUIRED',
        message: 'Tenant context is required. Provide via authentication or X-Tenant-Id header.',
      },
    });
    return;
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(tenantId)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_TENANT_ID',
        message: 'Tenant ID must be a valid UUID',
      },
    });
    return;
  }

  req.tenantId = tenantId;

  // Set up RLS context for database operations
  const db = getDb();
  const userId = req.user?.id;

  setTenantContext(db, tenantId, userId)
    .then(() => {
      // Clean up tenant context after response is sent
      res.on('finish', () => {
        clearTenantContext(db).catch((err) => {
          console.error('Failed to clear tenant context:', err);
        });
      });
      next();
    })
    .catch((error) => {
      console.error('Failed to set tenant context:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_CONTEXT_ERROR',
          message: 'Failed to establish tenant context',
        },
      });
    });
}

/**
 * Extract tenant from site parameter
 *
 * For routes like /sites/:siteId/pages, extract and validate the site's tenant
 */
export async function siteToTenantContext(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { siteId } = req.params;

  if (!siteId) {
    res.status(400).json({
      success: false,
      error: {
        code: 'SITE_ID_REQUIRED',
        message: 'Site ID is required in the URL path',
      },
    });
    return;
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(siteId)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_SITE_ID',
        message: 'Site ID must be a valid UUID',
      },
    });
    return;
  }

  // Site validation and tenant extraction happens in controllers
  // This middleware just ensures the siteId is accessible
  next();
}

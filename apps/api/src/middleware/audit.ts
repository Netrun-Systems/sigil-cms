/**
 * Tenant Activity Audit Log Middleware
 *
 * Records all write operations (POST, PUT, PATCH, DELETE) with:
 *   - Who did it (user ID, email, role)
 *   - What they did (action, resource type, resource ID)
 *   - When (timestamp)
 *   - Which tenant/site
 *
 * Stored in cms_audit_log table. Queryable for compliance (SOC2, GDPR).
 *
 * Usage: Mount after authentication on routes that modify data.
 *   router.use(auditLog);
 */

import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { sql } from 'drizzle-orm';
import { getDb } from '../db.js';

// Map HTTP methods to action verbs
const METHOD_TO_ACTION: Record<string, string> = {
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
};

// Extract resource type and ID from URL path
function parseResource(path: string): { resourceType: string; resourceId?: string } {
  // Strip /api/v1/ prefix and query string
  const clean = path.replace(/^\/api\/v\d+\//, '').split('?')[0];
  const parts = clean.split('/').filter(Boolean);

  // Common patterns:
  // sites/:id → { resourceType: 'site', resourceId: id }
  // sites/:id/pages/:id → { resourceType: 'page', resourceId: id }
  // sites/:id/pages/:id/blocks/:id → { resourceType: 'block', resourceId: id }
  // tenants/provision → { resourceType: 'tenant', resourceId: undefined }

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;

  // Walk from the end to find the most specific resource
  for (let i = parts.length - 1; i >= 0; i--) {
    if (UUID_RE.test(parts[i]) && i > 0) {
      // The part before the UUID is the resource type
      const type = parts[i - 1].replace(/s$/, ''); // "sites" → "site", "pages" → "page"
      return { resourceType: type, resourceId: parts[i] };
    }
  }

  // No UUID found — use the last path segment as the action
  const lastPart = parts[parts.length - 1] || 'unknown';
  // If it's a known action word, use the second-to-last as resource
  if (['clone', 'provision', 'publish', 'archive', 'verify'].includes(lastPart) && parts.length > 1) {
    return { resourceType: parts[parts.length - 2].replace(/s$/, ''), resourceId: undefined };
  }

  return { resourceType: lastPart.replace(/s$/, ''), resourceId: undefined };
}

/**
 * Audit log middleware — records write operations to cms_audit_log.
 *
 * Runs AFTER the response is sent (non-blocking) to avoid adding latency.
 */
export function auditLog(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  // Only audit write operations
  const action = METHOD_TO_ACTION[req.method];
  if (!action) {
    next();
    return;
  }

  // Capture the original end() to log after response completes
  const originalEnd = res.end;
  const startTime = Date.now();

  res.end = function (this: Response, ...args: unknown[]) {
    // Restore original end
    res.end = originalEnd;
    const result = (res.end as Function).apply(res, args);

    // Log asynchronously (non-blocking)
    const { resourceType, resourceId } = parseResource(req.originalUrl || req.url);
    const tenantId = req.tenantId;
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    const userRole = req.user?.role;
    const siteId = req.params?.siteId;
    const statusCode = res.statusCode;
    const durationMs = Date.now() - startTime;

    // Only log if we have a tenant context (skip unauthenticated/public routes)
    if (!tenantId) return result;

    const db = getDb();
    const reqPath = (req.originalUrl || req.url).slice(0, 500);
    const ipAddr = req.ip || (req.headers['x-forwarded-for'] as string) || null;
    const ua = ((req.headers['user-agent'] as string) || '').slice(0, 500);
    db.execute(sql`
        INSERT INTO cms_audit_log
          (tenant_id, user_id, user_email, user_role, action, resource_type, resource_id,
           site_id, request_method, request_path, status_code, duration_ms, ip_address, user_agent)
        VALUES (${tenantId}, ${userId || null}, ${userEmail || null}, ${userRole || null},
                ${action}, ${resourceType}, ${resourceId || null}, ${siteId || null},
                ${req.method}, ${reqPath}, ${statusCode}, ${durationMs},
                ${ipAddr}, ${ua})
      `).catch((err: any) => {
      // Audit logging should never break the request — log and continue
      console.warn('Audit log insert failed:', err.message);
    });

    return result;
  } as any;

  next();
}

/**
 * Audit Log Routes — query tenant activity history
 *
 * GET /api/v1/audit                — list recent activity
 * GET /api/v1/audit/resource/:id   — activity for a specific resource
 * GET /api/v1/audit/user/:userId   — activity by a specific user
 * GET /api/v1/audit/stats          — summary stats (actions per day, top users, etc.)
 */

import { Router } from 'express';
import { authenticate, tenantContext } from '../middleware/index.js';
import { getDb } from '../db.js';
import type { AuthenticatedRequest } from '../types/index.js';

import type { Router as RouterType } from 'express';
const router: RouterType = Router();

router.use(authenticate);
router.use(tenantContext);

// Run migration on first access
let migrationRun = false;
async function ensureTable() {
  if (migrationRun) return;
  const db = getDb();
  await db.execute({ text: `
    CREATE TABLE IF NOT EXISTS cms_audit_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL,
      user_id UUID,
      user_email VARCHAR(320),
      user_role VARCHAR(50),
      action VARCHAR(20) NOT NULL,
      resource_type VARCHAR(50) NOT NULL,
      resource_id UUID,
      site_id UUID,
      request_method VARCHAR(10) NOT NULL,
      request_path VARCHAR(500) NOT NULL,
      status_code INTEGER,
      duration_ms INTEGER,
      ip_address VARCHAR(45),
      user_agent VARCHAR(500),
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_cms_audit_tenant_time ON cms_audit_log(tenant_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_cms_audit_resource ON cms_audit_log(resource_type, resource_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_cms_audit_user ON cms_audit_log(tenant_id, user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_cms_audit_site ON cms_audit_log(site_id, created_at DESC);
  `, values: [] } as any);
  migrationRun = true;
}

/**
 * GET /api/v1/audit
 * List recent audit events for the current tenant.
 *
 * Query params:
 *  - action: create | update | delete
 *  - resource_type: site | page | block | theme | media | user | tenant
 *  - site_id: UUID — filter to a specific site
 *  - user_id: UUID — filter to a specific user
 *  - from: ISO date — start of time range
 *  - to: ISO date — end of time range
 *  - limit: number (default 50, max 200)
 *  - offset: number (default 0)
 */
router.get('/', async (req: AuthenticatedRequest, res) => {
  await ensureTable();
  const db = getDb();
  const tenantId = req.tenantId!;
  const { action, resource_type, site_id, user_id, from, to } = req.query;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = parseInt(req.query.offset as string) || 0;

  let query = 'SELECT * FROM cms_audit_log WHERE tenant_id = $1';
  const params: unknown[] = [tenantId];

  if (action) { params.push(action); query += ` AND action = $${params.length}`; }
  if (resource_type) { params.push(resource_type); query += ` AND resource_type = $${params.length}`; }
  if (site_id) { params.push(site_id); query += ` AND site_id = $${params.length}`; }
  if (user_id) { params.push(user_id); query += ` AND user_id = $${params.length}`; }
  if (from) { params.push(from); query += ` AND created_at >= $${params.length}`; }
  if (to) { params.push(to); query += ` AND created_at <= $${params.length}`; }

  query += ' ORDER BY created_at DESC';
  params.push(limit); query += ` LIMIT $${params.length}`;
  params.push(offset); query += ` OFFSET $${params.length}`;

  const result = await db.execute({ text: query, values: params } as any);
  const rows = (result as any).rows ?? result;

  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM cms_audit_log WHERE tenant_id = $1';
  const countParams: unknown[] = [tenantId];
  if (action) { countParams.push(action); countQuery += ` AND action = $${countParams.length}`; }
  if (resource_type) { countParams.push(resource_type); countQuery += ` AND resource_type = $${countParams.length}`; }
  if (site_id) { countParams.push(site_id); countQuery += ` AND site_id = $${countParams.length}`; }
  if (user_id) { countParams.push(user_id); countQuery += ` AND user_id = $${countParams.length}`; }
  if (from) { countParams.push(from); countQuery += ` AND created_at >= $${countParams.length}`; }
  if (to) { countParams.push(to); countQuery += ` AND created_at <= $${countParams.length}`; }

  const countResult = await db.execute({ text: countQuery, values: countParams } as any);
  const total = parseInt(((countResult as any).rows ?? countResult)[0]?.total || '0', 10);

  res.json({
    success: true,
    data: rows,
    meta: { total, limit, offset },
  });
});

/**
 * GET /api/v1/audit/resource/:resourceId
 * Get all activity for a specific resource (page, block, site, etc.)
 */
router.get('/resource/:resourceId', async (req: AuthenticatedRequest, res) => {
  await ensureTable();
  const db = getDb();
  const tenantId = req.tenantId!;
  const { resourceId } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

  const result = await db.execute({
    text: `
      SELECT * FROM cms_audit_log
      WHERE tenant_id = $1 AND resource_id = $2
      ORDER BY created_at DESC
      LIMIT $3
    `,
    values: [tenantId, resourceId, limit],
  } as any);

  res.json({ success: true, data: (result as any).rows ?? result });
});

/**
 * GET /api/v1/audit/stats
 * Summary stats for the current tenant:
 *   - actions per day (last 30 days)
 *   - top active users
 *   - most modified resources
 */
router.get('/stats', async (req: AuthenticatedRequest, res) => {
  await ensureTable();
  const db = getDb();
  const tenantId = req.tenantId!;

  const [dailyResult, usersResult, resourcesResult] = await Promise.all([
    // Actions per day (last 30 days)
    db.execute({
      text: `
        SELECT DATE(created_at) as day, action, COUNT(*) as count
        FROM cms_audit_log
        WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at), action
        ORDER BY day DESC
      `,
      values: [tenantId],
    } as any),

    // Top 10 most active users (last 30 days)
    db.execute({
      text: `
        SELECT user_email, user_role, COUNT(*) as action_count,
               MAX(created_at) as last_active
        FROM cms_audit_log
        WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '30 days' AND user_email IS NOT NULL
        GROUP BY user_email, user_role
        ORDER BY action_count DESC
        LIMIT 10
      `,
      values: [tenantId],
    } as any),

    // Most modified resources (last 30 days)
    db.execute({
      text: `
        SELECT resource_type, COUNT(*) as modification_count
        FROM cms_audit_log
        WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY resource_type
        ORDER BY modification_count DESC
      `,
      values: [tenantId],
    } as any),
  ]);

  res.json({
    success: true,
    data: {
      dailyActivity: (dailyResult as any).rows ?? dailyResult,
      topUsers: (usersResult as any).rows ?? usersResult,
      resourceBreakdown: (resourcesResult as any).rows ?? resourcesResult,
    },
  });
});

export default router;

/**
 * Plan Enforcement Middleware
 *
 * Checks tenant plan limits before allowing resource creation.
 * Returns 403 with upgrade message when limits are exceeded.
 */

import type { Response, NextFunction } from 'express';
import { eq, and, count, sum } from 'drizzle-orm';
import { getPlanLimits, isWithinLimit, isPluginAllowed } from '@netrun-cms/core';
import { tenants, sites, pages, media } from '@netrun-cms/db';
import { getDb } from '../db.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';

/**
 * Fetch the plan name for a tenant. Returns 'free' if not found.
 */
async function getTenantPlan(tenantId: string): Promise<string> {
  const db = getDb();
  const [tenant] = await db
    .select({ plan: tenants.plan })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  return tenant?.plan || 'free';
}

function planLimitResponse(message: string): ApiResponse<null> {
  return {
    success: false,
    error: {
      code: 'PLAN_LIMIT',
      message,
    },
  };
}

/**
 * Enforce site creation limit based on tenant plan.
 * Apply to POST /api/v1/sites
 */
export function enforceSiteLimit() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenantId;
    if (!tenantId) { next(); return; }

    const plan = await getTenantPlan(tenantId);
    const limits = getPlanLimits(plan);

    if (limits.maxSites === -1) { next(); return; }

    const db = getDb();
    const [{ value: currentCount }] = await db
      .select({ value: count() })
      .from(sites)
      .where(eq(sites.tenantId, tenantId));

    if (!isWithinLimit(currentCount, limits.maxSites)) {
      res.status(403).json(planLimitResponse(
        `Your ${plan} plan allows ${limits.maxSites} site${limits.maxSites !== 1 ? 's' : ''}. Upgrade to create more.`
      ));
      return;
    }

    next();
  };
}

/**
 * Enforce page creation limit per site based on tenant plan.
 * Apply to POST /api/v1/sites/:siteId/pages
 */
export function enforcePageLimit() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenantId;
    const siteId = req.params.siteId;
    if (!tenantId || !siteId) { next(); return; }

    const plan = await getTenantPlan(tenantId);
    const limits = getPlanLimits(plan);

    if (limits.maxPagesPerSite === -1) { next(); return; }

    const db = getDb();
    const [{ value: currentCount }] = await db
      .select({ value: count() })
      .from(pages)
      .where(eq(pages.siteId, siteId));

    if (!isWithinLimit(currentCount, limits.maxPagesPerSite)) {
      res.status(403).json(planLimitResponse(
        `Your ${plan} plan allows ${limits.maxPagesPerSite} pages per site. Upgrade to create more.`
      ));
      return;
    }

    next();
  };
}

/**
 * Enforce storage limit based on tenant plan.
 * Checks total media file size across all tenant sites.
 * Apply to media upload routes.
 */
export function enforceStorageLimit() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenantId;
    if (!tenantId) { next(); return; }

    const plan = await getTenantPlan(tenantId);
    const limits = getPlanLimits(plan);

    if (limits.maxStorageMb === -1) { next(); return; }

    const db = getDb();

    // Get all site IDs for this tenant
    const tenantSites = await db
      .select({ id: sites.id })
      .from(sites)
      .where(eq(sites.tenantId, tenantId));

    if (tenantSites.length === 0) { next(); return; }

    const siteIds = tenantSites.map(s => s.id);

    // Sum file sizes across all tenant sites
    let totalBytes = 0;
    for (const siteId of siteIds) {
      const [result] = await db
        .select({ total: sum(media.fileSize) })
        .from(media)
        .where(eq(media.siteId, siteId));
      totalBytes += Number(result?.total || 0);
    }

    const totalMb = totalBytes / (1024 * 1024);

    if (totalMb >= limits.maxStorageMb) {
      res.status(403).json(planLimitResponse(
        `Your ${plan} plan allows ${limits.maxStorageMb}MB of storage. You've used ${Math.round(totalMb)}MB. Upgrade for more storage.`
      ));
      return;
    }

    // Also check media file count limit
    if (limits.maxMediaFiles !== -1) {
      let totalFiles = 0;
      for (const siteId of siteIds) {
        const [{ value: fileCount }] = await db
          .select({ value: count() })
          .from(media)
          .where(eq(media.siteId, siteId));
        totalFiles += fileCount;
      }

      if (!isWithinLimit(totalFiles, limits.maxMediaFiles)) {
        res.status(403).json(planLimitResponse(
          `Your ${plan} plan allows ${limits.maxMediaFiles} media files. Upgrade for more.`
        ));
        return;
      }
    }

    next();
  };
}

/**
 * Enforce custom domain feature based on tenant plan.
 * Apply to domain update routes.
 */
export function enforceCustomDomain() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenantId;
    if (!tenantId) { next(); return; }

    const plan = await getTenantPlan(tenantId);
    const limits = getPlanLimits(plan);

    if (!limits.customDomain) {
      res.status(403).json(planLimitResponse(
        'Custom domains are not available on the free plan. Upgrade to Starter or above to use custom domains.'
      ));
      return;
    }

    next();
  };
}

/**
 * Enforce plugin access based on tenant plan.
 * Apply to plugin-specific route groups.
 */
export function enforcePluginAccess(pluginId: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenantId;
    if (!tenantId) { next(); return; }

    const plan = await getTenantPlan(tenantId);

    if (!isPluginAllowed(plan, pluginId)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'PLUGIN_NOT_AVAILABLE',
          message: `The "${pluginId}" feature is not available on your ${plan} plan. Upgrade to Pro to access this feature.`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Enforce API access based on tenant plan.
 * Apply to programmatic API endpoints.
 */
export function enforceApiAccess() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenantId;
    if (!tenantId) { next(); return; }

    const plan = await getTenantPlan(tenantId);
    const limits = getPlanLimits(plan);

    if (!limits.apiAccess) {
      res.status(403).json({
        success: false,
        error: {
          code: 'API_NOT_AVAILABLE',
          message: `API access is not available on your ${plan} plan. Upgrade to Pro to use the API.`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Subdomain-based Tenant Routing Middleware
 *
 * Resolves subdomains to tenants for white-label agency deployments:
 *   client-a.agency.com  →  tenant "client-a"
 *   client-b.agency.com  →  tenant "client-b"
 *
 * Also resolves custom domains to sites:
 *   clientsite.com  →  site with domain = "clientsite.com"
 *
 * The middleware sets req.tenantId, req.resolvedSiteId, and req.resolvedSiteSlug
 * on incoming requests, so downstream handlers know which tenant and site
 * the request targets without requiring authentication.
 *
 * Used on public routes where there is no JWT to extract tenant_id from.
 */

import type { Request, Response, NextFunction } from 'express';
import { getDb } from '../db.js';

// Base domain — subdomains are resolved relative to this.
// Set via SIGIL_BASE_DOMAIN env var (e.g., "sigil.netrunsystems.com")
const BASE_DOMAIN = process.env.SIGIL_BASE_DOMAIN || '';

// Cache resolved subdomains/domains for 5 minutes to avoid DB hits on every request
const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map<string, { tenantId: string; siteId?: string; siteSlug?: string; expiresAt: number }>();

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) return entry;
  if (entry) cache.delete(key);
  return null;
}

function setCache(key: string, data: { tenantId: string; siteId?: string; siteSlug?: string }) {
  cache.set(key, { ...data, expiresAt: Date.now() + CACHE_TTL });
  // Prevent unbounded growth
  if (cache.size > 10000) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

export interface SubdomainRequest extends Request {
  tenantId?: string;
  resolvedSiteId?: string;
  resolvedSiteSlug?: string;
}

/**
 * Resolve subdomain → tenant, or custom domain → site → tenant.
 *
 * Priority:
 * 1. Custom domain match (exact match on cms_sites.domain)
 * 2. Subdomain match (subdomain portion of host → platform_tenants.subdomain)
 * 3. X-Tenant-Subdomain header (for proxied setups)
 *
 * If no match is found, the request continues without tenant context
 * (subsequent middleware or handlers can reject if needed).
 */
export function resolveSubdomain(
  req: SubdomainRequest,
  _res: Response,
  next: NextFunction,
): void {
  const host = (req.hostname || req.headers.host || '').split(':')[0].toLowerCase();

  if (!host) {
    next();
    return;
  }

  // Check header override (for reverse-proxy setups)
  const headerSubdomain = req.headers['x-tenant-subdomain'] as string | undefined;

  // Determine what to resolve
  let lookupType: 'subdomain' | 'domain' = 'domain';
  let lookupValue = host;

  if (headerSubdomain) {
    lookupType = 'subdomain';
    lookupValue = headerSubdomain;
  } else if (BASE_DOMAIN && host.endsWith(`.${BASE_DOMAIN}`)) {
    // Extract subdomain: "client-a.sigil.netrunsystems.com" → "client-a"
    const sub = host.slice(0, -(BASE_DOMAIN.length + 1));
    if (sub && !sub.includes('.')) {
      lookupType = 'subdomain';
      lookupValue = sub;
    }
  }

  const cacheKey = `${lookupType}:${lookupValue}`;
  const cached = getCached(cacheKey);
  if (cached) {
    req.tenantId = cached.tenantId;
    req.resolvedSiteId = cached.siteId;
    req.resolvedSiteSlug = cached.siteSlug;
    next();
    return;
  }

  // Resolve from database
  const db = getDb();

  if (lookupType === 'subdomain') {
    // Subdomain → tenant
    db.execute({
      text: `
        SELECT t.id as tenant_id, s.id as site_id, s.slug as site_slug
        FROM platform_tenants t
        LEFT JOIN cms_sites s ON s.tenant_id = t.id AND s.status = 'published'
        WHERE t.subdomain = $1 AND t.is_active = true
        ORDER BY s.created_at ASC
        LIMIT 1
      `,
      values: [lookupValue],
    } as any)
      .then((result: any) => {
        const rows = result.rows ?? result;
        if (rows.length > 0) {
          const row = rows[0];
          req.tenantId = row.tenant_id;
          req.resolvedSiteId = row.site_id || undefined;
          req.resolvedSiteSlug = row.site_slug || undefined;
          setCache(cacheKey, { tenantId: row.tenant_id, siteId: row.site_id, siteSlug: row.site_slug });
        }
        next();
      })
      .catch(() => next());
  } else {
    // Custom domain → site → tenant
    db.execute({
      text: `
        SELECT s.id as site_id, s.slug as site_slug, s.tenant_id
        FROM cms_sites s
        WHERE s.domain = $1 AND s.status = 'published'
        LIMIT 1
      `,
      values: [lookupValue],
    } as any)
      .then((result: any) => {
        const rows = result.rows ?? result;
        if (rows.length > 0) {
          const row = rows[0];
          req.tenantId = row.tenant_id;
          req.resolvedSiteId = row.site_id;
          req.resolvedSiteSlug = row.site_slug;
          setCache(cacheKey, { tenantId: row.tenant_id, siteId: row.site_id, siteSlug: row.site_slug });
        }
        next();
      })
      .catch(() => next());
  }
}

/**
 * Require that subdomain/domain resolution succeeded.
 * Use after resolveSubdomain on routes that must have tenant context.
 */
export function requireSubdomainResolution(
  req: SubdomainRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.tenantId) {
    res.status(404).json({
      success: false,
      error: {
        code: 'TENANT_NOT_FOUND',
        message: 'No tenant found for this domain. Check your subdomain or custom domain configuration.',
      },
    });
    return;
  }
  next();
}

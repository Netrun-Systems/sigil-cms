/**
 * Tenants Routes — Tenant provisioning and management
 *
 * POST /api/v1/tenants/provision — Create tenant + site + theme + admin user in one call.
 * Used by agencies to onboard new clients programmatically.
 *
 * GET /api/v1/tenants/current — (handled by auth.ts)
 */

import { Router } from 'express';
import crypto from 'crypto';
import { promisify } from 'util';
import { sql } from 'drizzle-orm';
import { getDb } from '../db.js';
import { authenticate, tenantContext } from '../middleware/index.js';

const scryptAsync = promisify(crypto.scrypt);

/** Hash a password using scrypt (Node built-in, no external deps). */
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString('hex')}`;
}
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';

import type { Router as RouterType } from 'express';
const router: RouterType = Router();

// Default theme tokens (Netrun Dark)
const DEFAULT_THEME_TOKENS = {
  colors: {
    primary: '#3b82f6',
    secondary: '#6366f1',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    accent: '#22d3ee',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
  },
  typography: {
    fontFamily: "'Inter', system-ui, sans-serif",
    headingFamily: "'Inter', system-ui, sans-serif",
    baseFontSize: 16,
    lineHeight: 1.6,
    headingWeight: 700,
  },
};

/**
 * POST /api/v1/tenants/provision
 *
 * Provision a complete tenant environment in one call:
 * 1. Creates a new tenant
 * 2. Creates a default site
 * 3. Creates a default theme (Netrun Dark)
 * 4. Creates an admin user for the tenant
 * 5. Optionally creates starter pages (home, about, contact)
 *
 * Body: {
 *   tenant: { name: string, subdomain: string, plan?: string },
 *   site: { name: string, slug: string, domain?: string },
 *   admin: { email: string, name: string, password: string },
 *   options?: {
 *     createStarterPages?: boolean,  // default true
 *     themePreset?: string,          // default 'netrun-dark'
 *     cloneFromSiteId?: string,      // clone an existing site instead of creating blank
 *   }
 * }
 *
 * Requires: platform admin or authenticated user (for self-service signup)
 */
router.post('/provision', async (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const { tenant, site, admin, options = {} } = req.body;

  // Validate required fields
  if (!tenant?.name || !tenant?.subdomain) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'tenant.name and tenant.subdomain are required' },
    });
    return;
  }

  if (!site?.name || !site?.slug) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'site.name and site.slug are required' },
    });
    return;
  }

  if (!admin?.email || !admin?.name || !admin?.password) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'admin.email, admin.name, and admin.password are required' },
    });
    return;
  }

  if (admin.password.length < 8) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters' },
    });
    return;
  }

  try {
    // Check subdomain uniqueness
    const subdomainCheck = await db.execute(sql`SELECT id FROM platform_tenants WHERE subdomain = ${tenant.subdomain} LIMIT 1`);
    if (((subdomainCheck as any).rows ?? subdomainCheck).length > 0) {
      res.status(409).json({
        success: false,
        error: { code: 'SUBDOMAIN_TAKEN', message: `Subdomain "${tenant.subdomain}" is already in use` },
      });
      return;
    }

    // Check admin email uniqueness
    const emailCheck = await db.execute(sql`SELECT id FROM platform_users WHERE email = ${admin.email} LIMIT 1`);
    if (((emailCheck as any).rows ?? emailCheck).length > 0) {
      res.status(409).json({
        success: false,
        error: { code: 'EMAIL_TAKEN', message: `Email "${admin.email}" is already registered` },
      });
      return;
    }

    // 1. Create tenant
    const tenantResult = await db.execute(sql`
      INSERT INTO platform_tenants (name, subdomain, plan, is_active)
      VALUES (${tenant.name}, ${tenant.subdomain}, ${tenant.plan || 'starter'}, true)
      RETURNING id, name, subdomain, plan, created_at
    `);
    const newTenant = ((tenantResult as any).rows ?? tenantResult)[0];

    // 2. Create admin user with hashed password
    const passwordHash = await hashPassword(admin.password);

    const userResult = await db.execute(sql`
      INSERT INTO platform_users (tenant_id, email, name, full_name, role, status, password_hash, auth_provider)
      VALUES (${newTenant.id}, ${admin.email}, ${admin.name}, ${admin.name}, 'admin', 'active', ${passwordHash}, 'local')
      RETURNING id, email, name, role
    `);
    const newUser = ((userResult as any).rows ?? userResult)[0];

    // 3. Create default site
    const siteResult = await db.execute(sql`
      INSERT INTO cms_sites (tenant_id, name, slug, domain, default_language, status)
      VALUES (${newTenant.id}, ${site.name}, ${site.slug}, ${site.domain || null}, 'en', 'draft')
      RETURNING id, name, slug, domain
    `);
    const newSite = ((siteResult as any).rows ?? siteResult)[0];

    // 4. Create default theme
    await db.execute(sql`
      INSERT INTO cms_themes (site_id, name, is_active, base_theme, tokens)
      VALUES (${newSite.id}, 'Default', true, ${options.themePreset || 'netrun-dark'}, ${JSON.stringify(DEFAULT_THEME_TOKENS)})
    `);

    // 5. Create starter pages (optional, default true)
    let starterPages: string[] = [];
    if (options.createStarterPages !== false) {
      const starterDefs = [
        { title: 'Home', slug: 'home', sortOrder: 0, template: 'landing' },
        { title: 'About', slug: 'about', sortOrder: 1, template: 'default' },
        { title: 'Contact', slug: 'contact', sortOrder: 2, template: 'contact' },
      ];

      for (const p of starterDefs) {
        await db.execute(sql`
          INSERT INTO cms_pages (site_id, title, slug, full_path, status, template, sort_order)
          VALUES (${newSite.id}, ${p.title}, ${p.slug}, ${`/${p.slug}`}, 'draft', ${p.template}, ${p.sortOrder})
        `);
        starterPages.push(p.slug);
      }
    }

    const response: ApiResponse<{
      tenant: { id: string; name: string; subdomain: string; plan: string };
      site: { id: string; name: string; slug: string; domain: string | null };
      admin: { id: string; email: string; name: string; role: string };
      starterPages: string[];
    }> = {
      success: true,
      data: {
        tenant: newTenant,
        site: newSite,
        admin: { ...newUser, password: undefined }, // never return password
        starterPages,
      },
    };

    res.status(201).json(response);
  } catch (err: any) {
    // Handle unique constraint violations gracefully
    if (err.code === '23505') {
      res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE', message: err.detail || 'A record with this identifier already exists' },
      });
      return;
    }

    console.error('Tenant provisioning failed:', err);
    res.status(500).json({
      success: false,
      error: { code: 'PROVISION_FAILED', message: 'Tenant provisioning failed. Check server logs.' },
    });
  }
});

/**
 * GET /api/v1/tenants/usage
 * Get usage stats across all sites in the current tenant.
 * Useful for agency dashboards.
 */
router.get('/usage', authenticate, tenantContext, async (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const tenantId = req.tenantId!;

  const result = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM cms_sites WHERE tenant_id = ${tenantId}) as site_count,
      (SELECT COUNT(*) FROM cms_pages p JOIN cms_sites s ON s.id = p.site_id WHERE s.tenant_id = ${tenantId}) as page_count,
      (SELECT COUNT(*) FROM cms_content_blocks b JOIN cms_pages p ON p.id = b.page_id JOIN cms_sites s ON s.id = p.site_id WHERE s.tenant_id = ${tenantId}) as block_count,
      (SELECT COUNT(*) FROM cms_media m JOIN cms_sites s ON s.id = m.site_id WHERE s.tenant_id = ${tenantId}) as media_count,
      (SELECT COALESCE(SUM(m.file_size), 0) FROM cms_media m JOIN cms_sites s ON s.id = m.site_id WHERE s.tenant_id = ${tenantId}) as total_storage_bytes,
      (SELECT COUNT(*) FROM platform_users WHERE tenant_id = ${tenantId} AND status = 'active') as user_count
  `);

  const stats = ((result as any).rows ?? result)[0];

  res.json({
    success: true,
    data: {
      sites: parseInt(stats.site_count, 10),
      pages: parseInt(stats.page_count, 10),
      blocks: parseInt(stats.block_count, 10),
      media: parseInt(stats.media_count, 10),
      storageBytes: parseInt(stats.total_storage_bytes, 10),
      storageMB: Math.round(parseInt(stats.total_storage_bytes, 10) / 1048576 * 10) / 10,
      users: parseInt(stats.user_count, 10),
    },
  });
});

export default router;

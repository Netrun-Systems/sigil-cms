/**
 * Seed Routes
 *
 * Programmatic data seeding API for bootstrapping tenants and artist sites.
 *
 * POST /api/v1/seed/bootstrap    - Create tenant + admin JWT (X-Seed-Key auth)
 * POST /api/v1/seed/artist-site  - Create full artist site with data (JWT auth)
 */

import { Router } from 'express';
import { eq, and, count } from 'drizzle-orm';
import {
  tenants,
  sites,
  users,
  releases,
  artistProfiles,
  themes,
  pages,
  seedArtistTemplate,
  seedSigilLanding,
} from '@netrun-cms/db';
import { getPresetById } from '@netrun-cms/theme/presets';
import { getDb } from '../db.js';
import { authenticate, requireRole, generateToken } from '../middleware/index.js';
import type { AuthenticatedRequest } from '../types/index.js';

import type { Router as RouterType } from "express";
const router: RouterType = Router();

// ============================================================================
// POST /bootstrap - Create tenant + return admin JWT
// Auth: X-Seed-Key header (no JWT exists yet)
// ============================================================================
router.post('/bootstrap', async (req, res) => {
  // Verify seed API key
  const seedKey = req.headers['x-seed-key'] as string | undefined;
  const expectedKey = process.env.SEED_API_KEY;

  if (!expectedKey) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SEED_NOT_CONFIGURED',
        message: 'SEED_API_KEY environment variable is not set on the server',
      },
    });
    return;
  }

  if (!seedKey || seedKey !== expectedKey) {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid or missing X-Seed-Key header',
      },
    });
    return;
  }

  // Validate request body
  const { tenantName, tenantSlug, adminEmail } = req.body;

  if (!tenantName || !tenantSlug || !adminEmail) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'tenantName, tenantSlug, and adminEmail are required',
      },
    });
    return;
  }

  const db = getDb();

  // Check if tenant already exists (idempotent)
  const [existingTenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  const tenant = existingTenant
    ? existingTenant
    : (
        await db
          .insert(tenants)
          .values({
            name: tenantName,
            slug: tenantSlug,
            plan: 'pro',
          })
          .returning()
      )[0];

  // Upsert admin user for this tenant
  const [existingUser] = await db
    .select()
    .from(users)
    .where(and(eq(users.tenantId, tenant.id), eq(users.email, adminEmail)))
    .limit(1);

  const user = existingUser
    ? existingUser
    : (
        await db
          .insert(users)
          .values({
            tenantId: tenant.id,
            email: adminEmail,
            username: 'seed-admin',
            passwordHash: 'seed-no-interactive-login',
            role: 'admin',
            isActive: true,
          })
          .returning()
      )[0];

  // Generate admin JWT
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: 'admin',
    tenantId: tenant.id,
  });

  res.json({
    success: true,
    data: {
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      token,
    },
  });
});

// ============================================================================
// POST /artist-site - Create full artist site with all data
// Auth: JWT Bearer token (admin role required)
// ============================================================================
router.post(
  '/artist-site',
  authenticate,
  requireRole('admin'),
  async (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const tenantId = req.tenantId!;

    const {
      site: siteData,
      artistProfile: profileData,
      releases: releasesData,
      theme: themeId,
      publishAll,
    } = req.body;

    // Validate required site fields
    if (!siteData?.name || !siteData?.slug) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'site.name and site.slug are required',
        },
      });
      return;
    }

    // Check if site already exists for this tenant (409 Conflict)
    const [existingSite] = await db
      .select()
      .from(sites)
      .where(and(eq(sites.tenantId, tenantId), eq(sites.slug, siteData.slug)))
      .limit(1);

    if (existingSite) {
      res.status(409).json({
        success: false,
        error: {
          code: 'SITE_EXISTS',
          message: `Site with slug '${siteData.slug}' already exists for this tenant`,
        },
        data: {
          site: {
            id: existingSite.id,
            slug: existingSite.slug,
            status: existingSite.status,
          },
        },
      });
      return;
    }

    // 1. Create site
    const [site] = await db
      .insert(sites)
      .values({
        tenantId,
        name: siteData.name,
        slug: siteData.slug,
        domain: siteData.domain || null,
        template: siteData.template || 'artist',
        status: publishAll ? 'published' : 'draft',
      })
      .returning();

    // 2. Seed artist template pages + blocks
    await seedArtistTemplate(db, site.id);

    // 3. Insert artist profile
    let profile: { id: string } | null = null;
    if (profileData?.artistName) {
      const [inserted] = await db
        .insert(artistProfiles)
        .values({
          siteId: site.id,
          artistName: profileData.artistName,
          bio: profileData.bio || '',
          photoUrl: profileData.photoUrl || null,
          genres: profileData.genres || [],
          socialLinks: profileData.socialLinks || {},
          bookingEmail: profileData.bookingEmail || null,
          managementEmail: profileData.managementEmail || null,
        })
        .returning();
      profile = inserted;
    }

    // 4. Insert releases
    let insertedReleases: Array<{ id: string }> = [];
    if (Array.isArray(releasesData) && releasesData.length > 0) {
      insertedReleases = await db
        .insert(releases)
        .values(
          releasesData.map(
            (r: Record<string, unknown>, i: number) => ({
              siteId: site.id,
              title: r.title as string,
              type: (r.type as string) || 'single',
              releaseDate: r.releaseDate as string,
              coverUrl: (r.coverUrl as string) || null,
              streamLinks: (r.streamLinks as Record<string, string>) || {},
              embedUrl: (r.embedUrl as string) || null,
              embedPlatform: (r.embedPlatform as string) || null,
              description: (r.description as string) || null,
              isPublished: publishAll ? true : Boolean(r.isPublished),
              sortOrder: i,
            })
          )
        )
        .returning();
    }

    // 5. Create theme from preset
    let themeRecord: { id: string; isActive: boolean } | null = null;
    if (themeId) {
      const preset = getPresetById(themeId as string);
      if (preset) {
        const [insertedTheme] = await db
          .insert(themes)
          .values({
            siteId: site.id,
            name: preset.name,
            isActive: true,
            baseTheme: themeId as string,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tokens: preset.darkTokens as any,
          })
          .returning();
        themeRecord = insertedTheme;
      }
    }

    // 6. Publish all pages if requested
    if (publishAll) {
      await db
        .update(pages)
        .set({ status: 'published', publishedAt: new Date() })
        .where(eq(pages.siteId, site.id));
    }

    // Count seeded pages
    const [{ value: pageCount }] = await db
      .select({ value: count() })
      .from(pages)
      .where(eq(pages.siteId, site.id));

    res.status(201).json({
      success: true,
      data: {
        site: { id: site.id, slug: site.slug, status: site.status },
        pages: Number(pageCount),
        releases: insertedReleases.length,
        artistProfile: profile ? { id: profile.id } : null,
        theme: themeRecord
          ? { id: themeRecord.id, isActive: themeRecord.isActive }
          : null,
      },
    });
  }
);

// ============================================================================
// POST /landing-site - Seed the Sigil CMS marketing site
// Auth: JWT Bearer token (admin role required)
// ============================================================================
router.post(
  '/landing-site',
  authenticate,
  requireRole('admin'),
  async (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const tenantId = req.tenantId!;

    const siteSlug = (req.body.siteSlug as string) || 'sigil';
    const siteName = (req.body.siteName as string) || 'Sigil CMS';
    const publishAll = req.body.publishAll !== false; // default true

    // Check if site already exists for this tenant (409 Conflict)
    const [existingSite] = await db
      .select()
      .from(sites)
      .where(and(eq(sites.tenantId, tenantId), eq(sites.slug, siteSlug)))
      .limit(1);

    if (existingSite) {
      res.status(409).json({
        success: false,
        error: {
          code: 'SITE_EXISTS',
          message: `Site with slug '${siteSlug}' already exists for this tenant`,
        },
        data: {
          site: {
            id: existingSite.id,
            slug: existingSite.slug,
            status: existingSite.status,
          },
        },
      });
      return;
    }

    // 1. Create site
    const [site] = await db
      .insert(sites)
      .values({
        tenantId,
        name: siteName,
        slug: siteSlug,
        domain: (req.body.domain as string) || null,
        template: 'landing',
        status: publishAll ? 'published' : 'draft',
      })
      .returning();

    // 2. Seed landing pages + blocks
    await seedSigilLanding(db, site.id);

    // 3. Create and activate netrun-dark theme
    const preset = getPresetById('netrun-dark');
    let themeRecord: { id: string; isActive: boolean } | null = null;
    if (preset) {
      const [insertedTheme] = await db
        .insert(themes)
        .values({
          siteId: site.id,
          name: preset.name,
          isActive: true,
          baseTheme: 'netrun-dark',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tokens: preset.darkTokens as any,
        })
        .returning();
      themeRecord = insertedTheme;
    }

    // 4. Publish all pages
    if (publishAll) {
      await db
        .update(pages)
        .set({ status: 'published', publishedAt: new Date() })
        .where(eq(pages.siteId, site.id));
    }

    // Count seeded pages
    const [{ value: pageCount }] = await db
      .select({ value: count() })
      .from(pages)
      .where(eq(pages.siteId, site.id));

    res.status(201).json({
      success: true,
      data: {
        site: { id: site.id, slug: site.slug, status: site.status },
        pages: Number(pageCount),
        theme: themeRecord
          ? { id: themeRecord.id, isActive: themeRecord.isActive }
          : null,
      },
    });
  }
);

export default router;

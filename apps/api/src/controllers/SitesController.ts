/**
 * Sites Controller
 *
 * CRUD operations for CMS sites
 */

import dns from 'dns';
import type { Response } from 'express';
import { eq, and, desc, asc, count, ne } from 'drizzle-orm';
import { sites, themes, pages, contentBlocks, insertSiteSchema, type Site } from '@netrun-cms/db';
import { getDb } from '../db.js';
import { parsePagination } from '../middleware/validation.js';
import type { AuthenticatedRequest, ApiResponse, PaginatedResponse } from '../types/index.js';

const DOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;
const EXPECTED_DOMAIN_TARGET = process.env.DOMAIN_TARGET || 'sigil.netrunsystems.com';

export class SitesController {
  /**
   * List all sites for the current tenant
   *
   * GET /api/v1/sites
   */
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { page, limit, offset } = parsePagination(req);
    const status = req.query.status as string | undefined;

    // Build query conditions
    const conditions = [eq(sites.tenantId, tenantId)];
    if (status) {
      conditions.push(eq(sites.status, status));
    }

    // Get total count
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(sites)
      .where(and(...conditions));

    // Get paginated results
    const results = await db
      .select()
      .from(sites)
      .where(and(...conditions))
      .orderBy(desc(sites.updatedAt))
      .limit(limit)
      .offset(offset);

    const response: PaginatedResponse<Site> = {
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
   * Get a single site by ID
   *
   * GET /api/v1/sites/:id
   */
  static async get(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const [site] = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, id), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!site) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Site with ID ${id} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<Site> = {
      success: true,
      data: site,
    };

    res.json(response);
  }

  /**
   * Create a new site
   *
   * POST /api/v1/sites
   */
  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;

    // Validate request body
    const parseResult = insertSiteSchema.safeParse({
      ...req.body,
      tenantId,
    });

    if (!parseResult.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid site data',
          details: parseResult.error.errors,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Check for slug uniqueness within tenant
    const insertData = parseResult.data as { slug: string; [key: string]: unknown };
    const [existing] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.tenantId, tenantId), eq(sites.slug, insertData.slug)))
      .limit(1);

    if (existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'DUPLICATE_SLUG',
          message: `A site with slug "${insertData.slug}" already exists`,
        },
      };
      res.status(409).json(response);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [site] = await db
      .insert(sites)
      .values(parseResult.data as any)
      .returning();

    const response: ApiResponse<Site> = {
      success: true,
      data: site,
    };

    res.status(201).json(response);
  }

  /**
   * Update an existing site
   *
   * PUT /api/v1/sites/:id
   */
  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { id } = req.params;

    // Check site exists and belongs to tenant
    const [existing] = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, id), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Site with ID ${id} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    // Validate update data (partial)
    const updateData = {
      ...req.body,
      tenantId, // Ensure tenant cannot be changed
      updatedAt: new Date(),
    };

    // If slug is being changed, check uniqueness
    if (updateData.slug && updateData.slug !== existing.slug) {
      const [slugConflict] = await db
        .select({ id: sites.id })
        .from(sites)
        .where(and(eq(sites.tenantId, tenantId), eq(sites.slug, updateData.slug)))
        .limit(1);

      if (slugConflict) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'DUPLICATE_SLUG',
            message: `A site with slug "${updateData.slug}" already exists`,
          },
        };
        res.status(409).json(response);
        return;
      }
    }

    const [site] = await db
      .update(sites)
      .set(updateData)
      .where(eq(sites.id, id))
      .returning();

    const response: ApiResponse<Site> = {
      success: true,
      data: site,
    };

    res.json(response);
  }

  /**
   * Delete a site
   *
   * DELETE /api/v1/sites/:id
   */
  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { id } = req.params;

    // Check site exists and belongs to tenant
    const [existing] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, id), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Site with ID ${id} not found`,
        },
      };
      res.status(404).json(response);
      return;
    }

    await db.delete(sites).where(eq(sites.id, id));

    const response: ApiResponse<{ id: string }> = {
      success: true,
      data: { id },
    };

    res.json(response);
  }

  /**
   * Update domain for a site
   *
   * PUT /api/v1/sites/:id/domain
   */
  static async updateDomain(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const { domain } = req.body as { domain?: string };

    if (!domain || typeof domain !== 'string') {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Domain is required' },
      };
      res.status(400).json(response);
      return;
    }

    const normalizedDomain = domain.toLowerCase().trim();

    if (!DOMAIN_REGEX.test(normalizedDomain)) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid domain format. Use a valid domain like example.com' },
      };
      res.status(400).json(response);
      return;
    }

    // Check site exists and belongs to tenant
    const [existing] = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, id), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'NOT_FOUND', message: `Site with ID ${id} not found` },
      };
      res.status(404).json(response);
      return;
    }

    // Check uniqueness — no other site should use this domain
    const [conflict] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.domain, normalizedDomain), ne(sites.id, id)))
      .limit(1);

    if (conflict) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'DOMAIN_TAKEN', message: `Domain "${normalizedDomain}" is already in use by another site` },
      };
      res.status(409).json(response);
      return;
    }

    const [site] = await db
      .update(sites)
      .set({ domain: normalizedDomain, updatedAt: new Date() })
      .where(eq(sites.id, id))
      .returning();

    const response: ApiResponse<Site> = {
      success: true,
      data: site,
    };

    res.json(response);
  }

  /**
   * Remove domain from a site
   *
   * DELETE /api/v1/sites/:id/domain
   */
  static async removeDomain(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { id } = req.params;

    // Check site exists and belongs to tenant
    const [existing] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, id), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'NOT_FOUND', message: `Site with ID ${id} not found` },
      };
      res.status(404).json(response);
      return;
    }

    const [site] = await db
      .update(sites)
      .set({ domain: null, updatedAt: new Date() })
      .where(eq(sites.id, id))
      .returning();

    const response: ApiResponse<Site> = {
      success: true,
      data: site,
    };

    res.json(response);
  }

  /**
   * Verify domain DNS configuration
   *
   * GET /api/v1/sites/:id/domain/verify
   */
  static async verifyDomain(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const { id } = req.params;

    // Check site exists and belongs to tenant
    const [existing] = await db
      .select({ id: sites.id, domain: sites.domain })
      .from(sites)
      .where(and(eq(sites.id, id), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'NOT_FOUND', message: `Site with ID ${id} not found` },
      };
      res.status(404).json(response);
      return;
    }

    if (!existing.domain) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'NO_DOMAIN', message: 'No domain configured for this site' },
      };
      res.status(400).json(response);
      return;
    }

    const records: string[] = [];
    let verified = false;

    // Resolve expected target IP for comparison
    let expectedIps: string[] = [];
    try {
      expectedIps = await dns.promises.resolve4(EXPECTED_DOMAIN_TARGET);
    } catch {
      // Target may not have A records if it's behind a load balancer
    }

    // Check CNAME records
    try {
      const cnames = await dns.promises.resolveCname(existing.domain);
      for (const cname of cnames) {
        records.push(`CNAME ${cname}`);
        if (cname.replace(/\.$/, '') === EXPECTED_DOMAIN_TARGET) {
          verified = true;
        }
      }
    } catch {
      // No CNAME records — that's fine, check A records
    }

    // Check A records
    try {
      const aRecords = await dns.promises.resolve4(existing.domain);
      for (const ip of aRecords) {
        records.push(`A ${ip}`);
        if (expectedIps.includes(ip)) {
          verified = true;
        }
      }
    } catch {
      // No A records found
    }

    res.json({
      success: true,
      data: {
        domain: existing.domain,
        verified,
        records,
        expected: EXPECTED_DOMAIN_TARGET,
      },
    });
  }

  /**
   * Clone a site — duplicates pages, blocks, theme, and settings into a new site.
   * One-click client onboarding for agencies.
   *
   * POST /api/v1/sites/:id/clone
   *
   * Body: {
   *   name: string,          // New site name (required)
   *   slug: string,          // New site slug (required)
   *   includeContent?: bool, // Clone pages + blocks (default true)
   *   includeTheme?: bool,   // Clone active theme (default true)
   *   status?: string,       // New site status (default 'draft')
   * }
   */
  static async clone(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const tenantId = req.tenantId!;
    const sourceId = req.params.id;
    const {
      name,
      slug,
      includeContent = true,
      includeTheme = true,
      status = 'draft',
    } = req.body;

    if (!name || !slug) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'name and slug are required' },
      });
      return;
    }

    // Verify source site exists and belongs to tenant
    const [source] = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, sourceId), eq(sites.tenantId, tenantId)))
      .limit(1);

    if (!source) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Source site ${sourceId} not found` },
      });
      return;
    }

    // Check slug uniqueness within tenant
    const [slugConflict] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.tenantId, tenantId), eq(sites.slug, slug)))
      .limit(1);

    if (slugConflict) {
      res.status(409).json({
        success: false,
        error: { code: 'SLUG_TAKEN', message: `Slug "${slug}" is already used in this tenant` },
      });
      return;
    }

    // Create the new site
    const [newSite] = await db.insert(sites).values({
      tenantId,
      name,
      slug,
      defaultLanguage: source.defaultLanguage,
      status,
      template: source.template,
      settings: source.settings,
    }).returning();

    let clonedPages = 0;
    let clonedBlocks = 0;
    let clonedTheme = false;

    // Clone active theme
    if (includeTheme) {
      const sourceThemes = await db
        .select()
        .from(themes)
        .where(and(eq(themes.siteId, sourceId), eq(themes.isActive, true)))
        .limit(1);

      if (sourceThemes.length > 0) {
        const t = sourceThemes[0];
        await db.insert(themes).values({
          siteId: newSite.id,
          name: t.name,
          isActive: true,
          baseTheme: t.baseTheme,
          tokens: t.tokens,
          customCss: t.customCss,
        });
        clonedTheme = true;
      }
    }

    // Clone pages + blocks (preserving hierarchy)
    if (includeContent) {
      // Get all pages from source site (ordered by parent to handle hierarchy)
      const sourcePages = await db
        .select()
        .from(pages)
        .where(eq(pages.siteId, sourceId))
        .orderBy(asc(pages.sortOrder));

      // Map old page IDs to new page IDs (for parent references)
      const pageIdMap = new Map<string, string>();

      for (const p of sourcePages) {
        const [newPage] = await db.insert(pages).values({
          siteId: newSite.id,
          parentId: p.parentId ? pageIdMap.get(p.parentId) || null : null,
          title: p.title,
          slug: p.slug,
          fullPath: p.fullPath,
          status: 'draft', // Clone as draft regardless of source status
          language: p.language,
          metaTitle: p.metaTitle,
          metaDescription: p.metaDescription,
          ogImageUrl: p.ogImageUrl,
          template: p.template,
          sortOrder: p.sortOrder,
        }).returning();

        pageIdMap.set(p.id, newPage.id);
        clonedPages++;

        // Clone blocks for this page
        const sourceBlocks = await db
          .select()
          .from(contentBlocks)
          .where(eq(contentBlocks.pageId, p.id))
          .orderBy(asc(contentBlocks.sortOrder));

        for (const b of sourceBlocks) {
          await db.insert(contentBlocks).values({
            pageId: newPage.id,
            blockType: b.blockType,
            content: b.content,
            settings: b.settings,
            sortOrder: b.sortOrder,
          });
          clonedBlocks++;
        }
      }
    }

    const response: ApiResponse<Site & { cloned: { pages: number; blocks: number; theme: boolean } }> = {
      success: true,
      data: {
        ...newSite,
        cloned: { pages: clonedPages, blocks: clonedBlocks, theme: clonedTheme },
      },
    };

    res.status(201).json(response);
  }
}

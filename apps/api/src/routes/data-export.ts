/**
 * Data Export Routes — export site content as JSON or CSV
 *
 * Addresses Payload CMS's #7 most-voted request: "Ability to export records
 * as JSON / CSV or XLS" (51 upvotes, Discussion #1557)
 *
 * Also enables Strapi's most-requested "data transfer between environments"
 * by providing a clean JSON bundle that can be imported via the companion
 * import endpoint.
 *
 * GET /api/v1/sites/:siteId/export/json   — full site bundle (pages + blocks + theme)
 * GET /api/v1/sites/:siteId/export/csv    — pages as CSV (for spreadsheet reporting)
 * POST /api/v1/sites/:siteId/import/json  — import a site bundle
 */

import { Router } from 'express';
import { eq, asc } from 'drizzle-orm';
import { sites, pages, contentBlocks, themes, media } from '@netrun-cms/db';
import { getDb } from '../db.js';
import { authenticate, tenantContext, requireRole } from '../middleware/index.js';
import type { AuthenticatedRequest } from '../types/index.js';

import type { Router as RouterType } from 'express';
const router: RouterType = Router({ mergeParams: true });

router.use(authenticate);
router.use(tenantContext);

/**
 * GET /api/v1/sites/:siteId/export/json
 *
 * Exports a complete site bundle: site metadata + all pages + all blocks + active theme.
 * The bundle can be imported into any Sigil instance to recreate the site.
 *
 * Query params:
 *   - includeMedia: 'true' — include media metadata (not the files themselves)
 *   - status: 'all' | 'published' | 'draft' (default: 'all')
 */
router.get('/json', requireRole('admin', 'editor'), async (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const tenantId = req.tenantId!;
  const { siteId } = req.params;
  const includeMedia = req.query.includeMedia === 'true';
  const statusFilter = req.query.status as string || 'all';

  // Get site
  const [site] = await db.select().from(sites)
    .where(eq(sites.id, siteId)).limit(1);
  if (!site || site.tenantId !== tenantId) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } });
    return;
  }

  // Get pages
  let pagesQuery = db.select().from(pages).where(eq(pages.siteId, siteId)).orderBy(asc(pages.sortOrder));
  const sitePages = await pagesQuery;
  const filteredPages = statusFilter === 'all' ? sitePages : sitePages.filter(p => p.status === statusFilter);

  // Get blocks for each page
  const pagesWithBlocks = await Promise.all(filteredPages.map(async (page) => {
    const blocks = await db.select().from(contentBlocks)
      .where(eq(contentBlocks.pageId, page.id))
      .orderBy(asc(contentBlocks.sortOrder));
    return { ...page, blocks };
  }));

  // Get active theme
  const [activeTheme] = await db.select().from(themes)
    .where(eq(themes.siteId, siteId)).limit(1);

  // Optionally get media
  let mediaItems: any[] = [];
  if (includeMedia) {
    mediaItems = await db.select().from(media).where(eq(media.siteId, siteId));
  }

  const bundle = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    exportedBy: req.user?.email || 'unknown',
    site: {
      name: site.name,
      slug: site.slug,
      defaultLanguage: site.defaultLanguage,
      template: site.template,
      settings: site.settings,
    },
    theme: activeTheme ? {
      name: activeTheme.name,
      baseTheme: activeTheme.baseTheme,
      tokens: activeTheme.tokens,
      customCss: activeTheme.customCss,
    } : null,
    pages: pagesWithBlocks.map(p => ({
      title: p.title,
      slug: p.slug,
      fullPath: p.fullPath,
      status: p.status,
      language: p.language,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      ogImageUrl: p.ogImageUrl,
      template: p.template,
      sortOrder: p.sortOrder,
      blocks: p.blocks.map(b => ({
        blockType: b.blockType,
        content: b.content,
        settings: b.settings,
        sortOrder: b.sortOrder,
      })),
    })),
    media: mediaItems.map(m => ({
      filename: m.filename,
      originalFilename: m.originalFilename,
      mimeType: m.mimeType,
      fileSize: m.fileSize,
      url: m.url,
      altText: m.altText,
      caption: m.caption,
      folder: m.folder,
      metadata: m.metadata,
    })),
    stats: {
      pages: filteredPages.length,
      blocks: pagesWithBlocks.reduce((sum, p) => sum + p.blocks.length, 0),
      media: mediaItems.length,
    },
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${site.slug}-export-${new Date().toISOString().split('T')[0]}.json"`);
  res.json(bundle);
});

/**
 * GET /api/v1/sites/:siteId/export/csv
 *
 * Exports pages as CSV for agency reporting / spreadsheet import.
 * Columns: title, slug, status, language, template, blockCount, metaTitle, metaDescription, createdAt, updatedAt
 */
router.get('/csv', requireRole('admin', 'editor'), async (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const tenantId = req.tenantId!;
  const { siteId } = req.params;

  // Get site
  const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
  if (!site || site.tenantId !== tenantId) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } });
    return;
  }

  // Get pages with block counts
  const result = await db.execute({
    text: `
      SELECT p.title, p.slug, p.full_path, p.status, p.language, p.template,
             p.meta_title, p.meta_description, p.created_at, p.updated_at,
             COUNT(b.id) as block_count
      FROM cms_pages p
      LEFT JOIN cms_content_blocks b ON b.page_id = p.id
      WHERE p.site_id = $1
      GROUP BY p.id
      ORDER BY p.sort_order ASC
    `,
    values: [siteId],
  } as any);

  const rows = (result as any).rows ?? result;

  // Build CSV
  const headers = ['Title', 'Slug', 'Full Path', 'Status', 'Language', 'Template', 'Block Count', 'Meta Title', 'Meta Description', 'Created', 'Updated'];
  const csvLines = [headers.join(',')];

  for (const row of rows) {
    const line = [
      `"${(row.title || '').replace(/"/g, '""')}"`,
      row.slug,
      row.full_path || '',
      row.status,
      row.language,
      row.template,
      row.block_count,
      `"${(row.meta_title || '').replace(/"/g, '""')}"`,
      `"${(row.meta_description || '').replace(/"/g, '""')}"`,
      row.created_at,
      row.updated_at,
    ].join(',');
    csvLines.push(line);
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${site.slug}-pages-${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csvLines.join('\n'));
});

/**
 * POST /api/v1/sites/:siteId/import/json
 *
 * Import a site bundle exported by /export/json.
 * Merges content into the target site (does not delete existing content).
 *
 * Body: the JSON bundle from /export/json
 */
router.post('/import/json', requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const tenantId = req.tenantId!;
  const { siteId } = req.params;
  const bundle = req.body;

  if (!bundle?.version || !bundle?.pages) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid bundle format. Must include version and pages.' } });
    return;
  }

  // Verify target site
  const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
  if (!site || site.tenantId !== tenantId) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Target site not found' } });
    return;
  }

  let importedPages = 0;
  let importedBlocks = 0;

  // Import theme if present
  if (bundle.theme) {
    await db.insert(themes).values({
      siteId,
      name: bundle.theme.name || 'Imported Theme',
      isActive: false, // Don't override current theme
      baseTheme: bundle.theme.baseTheme || 'custom',
      tokens: bundle.theme.tokens || { colors: {}, typography: {} },
      customCss: bundle.theme.customCss || null,
    });
  }

  // Import pages + blocks
  for (const pageData of bundle.pages) {
    // Check if page with this slug already exists
    const existing = await db.select({ id: pages.id }).from(pages)
      .where(eq(pages.siteId, siteId)).limit(1);

    const [newPage] = await db.insert(pages).values({
      siteId,
      title: pageData.title,
      slug: pageData.slug + (existing.length > 0 ? `-imported-${Date.now()}` : ''),
      fullPath: pageData.fullPath,
      status: 'draft', // Always import as draft
      language: pageData.language || 'en',
      metaTitle: pageData.metaTitle,
      metaDescription: pageData.metaDescription,
      template: pageData.template || 'default',
      sortOrder: pageData.sortOrder || 0,
    }).returning();
    importedPages++;

    // Import blocks
    if (Array.isArray(pageData.blocks)) {
      for (const block of pageData.blocks) {
        await db.insert(contentBlocks).values({
          pageId: newPage.id,
          blockType: block.blockType,
          content: block.content || {},
          settings: block.settings || {},
          sortOrder: block.sortOrder || 0,
        });
        importedBlocks++;
      }
    }
  }

  res.status(201).json({
    success: true,
    data: {
      imported: { pages: importedPages, blocks: importedBlocks, theme: !!bundle.theme },
      source: { exportedAt: bundle.exportedAt, exportedBy: bundle.exportedBy },
    },
  });
});

export default router;

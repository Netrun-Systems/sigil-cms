/**
 * Block Clipboard Routes — copy/paste blocks between pages
 *
 * Addresses Strapi's #1 content editing complaint: "Cannot copy blocks between entries"
 * (47 votes on feedback.strapi.io, multiple users in Discussion #25117)
 *
 * POST /api/v1/sites/:siteId/clipboard/copy   — copy blocks from a page to a server-side clipboard
 * POST /api/v1/sites/:siteId/clipboard/paste   — paste clipboard blocks into a target page
 * GET  /api/v1/sites/:siteId/clipboard         — view current clipboard contents
 * DELETE /api/v1/sites/:siteId/clipboard        — clear clipboard
 *
 * The clipboard is stored per-user per-tenant in a temporary table.
 * Blocks can be copied across pages AND across sites within the same tenant.
 */

import { Router } from 'express';
import { eq, and, asc, inArray } from 'drizzle-orm';
import { contentBlocks, pages, sites } from '@netrun-cms/db';
import { getDb } from '../db.js';
import { authenticate, tenantContext, requireRole } from '../middleware/index.js';
import type { AuthenticatedRequest } from '../types/index.js';

import type { Router as RouterType } from 'express';
const router: RouterType = Router({ mergeParams: true });

router.use(authenticate);
router.use(tenantContext);

/**
 * POST /api/v1/sites/:siteId/clipboard/copy
 *
 * Body: {
 *   blockIds: string[]      — blocks to copy (from any page in this site)
 *   sourcePageId: string    — source page (for validation)
 * }
 */
router.post('/copy', requireRole('admin', 'editor', 'author'), async (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const tenantId = req.tenantId!;
  const userId = req.user!.id;
  const { siteId } = req.params;
  const { blockIds, sourcePageId } = req.body;

  if (!Array.isArray(blockIds) || blockIds.length === 0 || !sourcePageId) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'blockIds (array) and sourcePageId required' } });
    return;
  }

  // Verify site belongs to tenant
  const [site] = await db.select({ id: sites.id }).from(sites)
    .where(and(eq(sites.id, siteId), eq(sites.tenantId, tenantId))).limit(1);
  if (!site) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } }); return; }

  // Fetch the blocks
  const blocks = await db.select().from(contentBlocks)
    .where(and(eq(contentBlocks.pageId, sourcePageId), inArray(contentBlocks.id, blockIds)))
    .orderBy(asc(contentBlocks.sortOrder));

  if (blocks.length === 0) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No matching blocks found' } });
    return;
  }

  // Store in clipboard table (upsert per user+tenant)
  await db.execute({
    text: `
      CREATE TABLE IF NOT EXISTS cms_clipboard (
        user_id UUID NOT NULL,
        tenant_id UUID NOT NULL,
        blocks JSONB NOT NULL DEFAULT '[]',
        source_site_id UUID,
        source_page_id UUID,
        copied_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, tenant_id)
      )
    `, values: [],
  } as any);

  const blockData = blocks.map(b => ({
    blockType: b.blockType,
    content: b.content,
    settings: b.settings,
    sortOrder: b.sortOrder,
  }));

  await db.execute({
    text: `
      INSERT INTO cms_clipboard (user_id, tenant_id, blocks, source_site_id, source_page_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, tenant_id) DO UPDATE SET
        blocks = $3, source_site_id = $4, source_page_id = $5, copied_at = NOW()
    `,
    values: [userId, tenantId, JSON.stringify(blockData), siteId, sourcePageId],
  } as any);

  res.json({ success: true, data: { copied: blockData.length, blocks: blockData } });
});

/**
 * POST /api/v1/sites/:siteId/clipboard/paste
 *
 * Body: {
 *   targetPageId: string   — page to paste into
 *   position?: number      — insert at this sortOrder (appends if omitted)
 * }
 */
router.post('/paste', requireRole('admin', 'editor', 'author'), async (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const tenantId = req.tenantId!;
  const userId = req.user!.id;
  const { siteId } = req.params;
  const { targetPageId, position } = req.body;

  if (!targetPageId) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'targetPageId required' } });
    return;
  }

  // Verify target page exists in this site
  const [page] = await db.select({ id: pages.id }).from(pages)
    .where(and(eq(pages.id, targetPageId), eq(pages.siteId, siteId))).limit(1);
  if (!page) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Target page not found' } }); return; }

  // Get clipboard
  const clipResult = await db.execute({
    text: 'SELECT blocks FROM cms_clipboard WHERE user_id = $1 AND tenant_id = $2',
    values: [userId, tenantId],
  } as any);
  const clipRows = (clipResult as any).rows ?? clipResult;
  if (!clipRows.length || !clipRows[0].blocks) {
    res.status(404).json({ success: false, error: { code: 'EMPTY_CLIPBOARD', message: 'Clipboard is empty. Copy blocks first.' } });
    return;
  }

  const blockData = typeof clipRows[0].blocks === 'string' ? JSON.parse(clipRows[0].blocks) : clipRows[0].blocks;

  // Get current max sortOrder in target page
  const maxResult = await db.execute({
    text: 'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM cms_content_blocks WHERE page_id = $1',
    values: [targetPageId],
  } as any);
  let nextOrder = parseInt(((maxResult as any).rows ?? maxResult)[0]?.max_order ?? '-1', 10) + 1;
  if (typeof position === 'number') nextOrder = position;

  // Insert blocks
  const inserted = [];
  for (const block of blockData) {
    const result = await db.insert(contentBlocks).values({
      pageId: targetPageId,
      blockType: block.blockType,
      content: block.content,
      settings: block.settings,
      sortOrder: nextOrder++,
    }).returning();
    inserted.push(result[0]);
  }

  res.status(201).json({ success: true, data: { pasted: inserted.length, blocks: inserted } });
});

/**
 * GET /api/v1/sites/:siteId/clipboard
 * View current clipboard contents
 */
router.get('/', async (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const tenantId = req.tenantId!;
  const userId = req.user!.id;

  const result = await db.execute({
    text: 'SELECT * FROM cms_clipboard WHERE user_id = $1 AND tenant_id = $2',
    values: [userId, tenantId],
  } as any);
  const rows = (result as any).rows ?? result;

  if (!rows.length) {
    res.json({ success: true, data: { blocks: [], copied_at: null } });
    return;
  }

  res.json({ success: true, data: rows[0] });
});

/**
 * DELETE /api/v1/sites/:siteId/clipboard
 * Clear clipboard
 */
router.delete('/', async (req: AuthenticatedRequest, res) => {
  const db = getDb();
  await db.execute({
    text: 'DELETE FROM cms_clipboard WHERE user_id = $1 AND tenant_id = $2',
    values: [req.user!.id, req.tenantId!],
  } as any);
  res.json({ success: true, data: { cleared: true } });
});

export default router;

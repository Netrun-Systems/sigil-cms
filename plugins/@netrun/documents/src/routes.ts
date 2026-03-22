// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * @netrun/documents -- API Routes
 *
 * All routes are tenant-scoped. Tenant ID comes from JWT claims
 * or x-tenant-id header (set by platform auth middleware).
 *
 * Route groups:
 * - Wikis: CRUD for wiki containers + page tree
 * - Wiki Pages: CRUD + search + backlinks + history + revert
 * - Connected Drives: OAuth connect/disconnect, sync, browse, search
 * - Unified: cross-source search, recent activity
 */

import { Router, type Request, type Response } from 'express';
import { eq, and, desc, asc, sql, count, ilike, or, inArray } from 'drizzle-orm';
import type { PluginLogger } from '@netrun-cms/plugin-runtime';
import type { Router as RouterType } from 'express';
import {
  docsWikis,
  docsWikiPages,
  docsWikiLinks,
  docsConnectedDrives,
  docsExternalDocuments,
  docsDocumentTags,
  docsActivityLog,
  docsWikiPageRevisions,
} from './schema.js';
import * as wikiEngine from './services/wiki-engine.js';
import * as msGraph from './services/microsoft-graph.js';
import * as googleDrive from './services/google-drive.js';

interface DocumentRoutes {
  router: RouterType;
}

function getTenantId(req: Request): string {
  return (req as any).tenantId || (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;
}

function getUserId(req: Request): string | null {
  return (req as any).user?.id || (req as any).userId || req.headers['x-user-id'] as string || null;
}

export function createRoutes(db: any, logger: PluginLogger): DocumentRoutes {
  const router = Router({ mergeParams: true });
  const d = db as any;

  // =========================================================================
  // WIKIS
  // =========================================================================

  /** GET /wikis -- list wikis for tenant */
  router.get('/wikis', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const wikis = await d.select().from(docsWikis)
        .where(eq(docsWikis.tenantId, tenantId))
        .orderBy(asc(docsWikis.name));
      res.json({ success: true, data: wikis });
    } catch (err) {
      logger.error({ err }, 'Failed to list wikis');
      res.status(500).json({ success: false, error: { message: 'Failed to list wikis' } });
    }
  });

  /** POST /wikis -- create wiki */
  router.post('/wikis', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const { name, description, icon } = req.body;
      const slug = wikiEngine.slugify(name);

      const [wiki] = await d.insert(docsWikis).values({
        tenantId,
        name,
        slug,
        description: description || null,
        icon: icon || 'book',
      }).returning();

      await logActivity(d, tenantId, wiki.id, 'wiki', getUserId(req), 'created', { name });
      res.status(201).json({ success: true, data: wiki });
    } catch (err) {
      logger.error({ err }, 'Failed to create wiki');
      res.status(500).json({ success: false, error: { message: 'Failed to create wiki' } });
    }
  });

  /** GET /wikis/:id -- get wiki with page tree */
  router.get('/wikis/:id', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const [wiki] = await d.select().from(docsWikis)
        .where(and(eq(docsWikis.id, req.params.id), eq(docsWikis.tenantId, tenantId)));

      if (!wiki) return res.status(404).json({ success: false, error: { message: 'Wiki not found' } });

      const pages = await d.select({
        id: docsWikiPages.id,
        title: docsWikiPages.title,
        slug: docsWikiPages.slug,
        status: docsWikiPages.status,
        order: docsWikiPages.order,
        parentId: docsWikiPages.parentId,
      }).from(docsWikiPages)
        .where(eq(docsWikiPages.wikiId, wiki.id))
        .orderBy(asc(docsWikiPages.order));

      const pageTree = wikiEngine.buildPageTree(pages);
      res.json({ success: true, data: { ...wiki, pages: pageTree } });
    } catch (err) {
      logger.error({ err }, 'Failed to get wiki');
      res.status(500).json({ success: false, error: { message: 'Failed to get wiki' } });
    }
  });

  /** PUT /wikis/:id -- update wiki */
  router.put('/wikis/:id', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const { name, description, icon } = req.body;
      const updates: any = { updatedAt: new Date() };
      if (name !== undefined) {
        updates.name = name;
        updates.slug = wikiEngine.slugify(name);
      }
      if (description !== undefined) updates.description = description;
      if (icon !== undefined) updates.icon = icon;

      const [wiki] = await d.update(docsWikis).set(updates)
        .where(and(eq(docsWikis.id, req.params.id), eq(docsWikis.tenantId, tenantId)))
        .returning();

      if (!wiki) return res.status(404).json({ success: false, error: { message: 'Wiki not found' } });
      res.json({ success: true, data: wiki });
    } catch (err) {
      logger.error({ err }, 'Failed to update wiki');
      res.status(500).json({ success: false, error: { message: 'Failed to update wiki' } });
    }
  });

  /** DELETE /wikis/:id -- delete wiki and all pages */
  router.delete('/wikis/:id', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const [wiki] = await d.delete(docsWikis)
        .where(and(eq(docsWikis.id, req.params.id), eq(docsWikis.tenantId, tenantId)))
        .returning();

      if (!wiki) return res.status(404).json({ success: false, error: { message: 'Wiki not found' } });
      res.json({ success: true, data: wiki });
    } catch (err) {
      logger.error({ err }, 'Failed to delete wiki');
      res.status(500).json({ success: false, error: { message: 'Failed to delete wiki' } });
    }
  });

  // =========================================================================
  // WIKI PAGES
  // =========================================================================

  /** GET /wikis/:wikiId/pages -- list pages (flat, sorted by order) */
  router.get('/wikis/:wikiId/pages', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const pages = await d.select().from(docsWikiPages)
        .where(and(
          eq(docsWikiPages.wikiId, req.params.wikiId),
          eq(docsWikiPages.tenantId, tenantId),
        ))
        .orderBy(asc(docsWikiPages.order), asc(docsWikiPages.title));

      const tree = wikiEngine.buildPageTree(pages);
      res.json({ success: true, data: pages, tree });
    } catch (err) {
      logger.error({ err }, 'Failed to list pages');
      res.status(500).json({ success: false, error: { message: 'Failed to list pages' } });
    }
  });

  /** POST /wikis/:wikiId/pages -- create page */
  router.post('/wikis/:wikiId/pages', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const { title, content, parentId, status } = req.body;
      const slug = wikiEngine.slugify(title);

      const [page] = await d.insert(docsWikiPages).values({
        tenantId,
        wikiId: req.params.wikiId,
        title,
        slug,
        content: content || '',
        parentId: parentId || null,
        status: status || 'draft',
        authorId: userId,
      }).returning();

      // Track backlinks
      if (content) {
        await wikiEngine.syncBacklinks(d, page.id, req.params.wikiId, content);
      }

      await logActivity(d, tenantId, page.id, 'wiki_page', userId, 'created', { title });
      res.status(201).json({ success: true, data: page });
    } catch (err) {
      logger.error({ err }, 'Failed to create page');
      res.status(500).json({ success: false, error: { message: 'Failed to create page' } });
    }
  });

  /** GET /wikis/:wikiId/pages/:id -- get page with content + backlinks */
  router.get('/wikis/:wikiId/pages/:id', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const [page] = await d.select().from(docsWikiPages)
        .where(and(
          eq(docsWikiPages.id, req.params.id),
          eq(docsWikiPages.wikiId, req.params.wikiId),
          eq(docsWikiPages.tenantId, tenantId),
        ));

      if (!page) return res.status(404).json({ success: false, error: { message: 'Page not found' } });

      // Get backlinks (pages that link TO this page)
      const backlinks = await d.select({
        id: docsWikiPages.id,
        title: docsWikiPages.title,
        slug: docsWikiPages.slug,
        linkText: docsWikiLinks.linkText,
      })
        .from(docsWikiLinks)
        .innerJoin(docsWikiPages, eq(docsWikiLinks.sourcePageId, docsWikiPages.id))
        .where(eq(docsWikiLinks.targetPageId, page.id));

      // Generate TOC
      const toc = wikiEngine.generateToc(page.content || '');

      // Log view
      await logActivity(d, tenantId, page.id, 'wiki_page', getUserId(req), 'viewed', {});

      res.json({ success: true, data: { ...page, backlinks, toc } });
    } catch (err) {
      logger.error({ err }, 'Failed to get page');
      res.status(500).json({ success: false, error: { message: 'Failed to get page' } });
    }
  });

  /** PUT /wikis/:wikiId/pages/:id -- update page */
  router.put('/wikis/:wikiId/pages/:id', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const { title, content, parentId, order, status } = req.body;

      // Get current page for revision snapshot
      const [current] = await d.select().from(docsWikiPages)
        .where(and(
          eq(docsWikiPages.id, req.params.id),
          eq(docsWikiPages.wikiId, req.params.wikiId),
          eq(docsWikiPages.tenantId, tenantId),
        ));

      if (!current) return res.status(404).json({ success: false, error: { message: 'Page not found' } });

      // Create revision before update (if content or title changed)
      if ((content !== undefined && content !== current.content) || (title !== undefined && title !== current.title)) {
        await wikiEngine.createRevision(d, current.id, current.title, current.content || '', current.authorId);
      }

      const updates: any = { updatedAt: new Date() };
      if (title !== undefined) {
        updates.title = title;
        updates.slug = wikiEngine.slugify(title);
      }
      if (content !== undefined) updates.content = content;
      if (parentId !== undefined) updates.parentId = parentId || null;
      if (order !== undefined) updates.order = order;
      if (status !== undefined) updates.status = status;
      if (userId) updates.authorId = userId;

      const [page] = await d.update(docsWikiPages).set(updates)
        .where(and(
          eq(docsWikiPages.id, req.params.id),
          eq(docsWikiPages.tenantId, tenantId),
        ))
        .returning();

      // Re-sync backlinks if content changed
      if (content !== undefined) {
        await wikiEngine.syncBacklinks(d, page.id, req.params.wikiId, content);
      }

      await logActivity(d, tenantId, page.id, 'wiki_page', userId, 'edited', {
        fieldsChanged: Object.keys(updates).filter(k => k !== 'updatedAt'),
      });

      res.json({ success: true, data: page });
    } catch (err) {
      logger.error({ err }, 'Failed to update page');
      res.status(500).json({ success: false, error: { message: 'Failed to update page' } });
    }
  });

  /** DELETE /wikis/:wikiId/pages/:id -- delete page */
  router.delete('/wikis/:wikiId/pages/:id', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const [page] = await d.delete(docsWikiPages)
        .where(and(
          eq(docsWikiPages.id, req.params.id),
          eq(docsWikiPages.wikiId, req.params.wikiId),
          eq(docsWikiPages.tenantId, tenantId),
        ))
        .returning();

      if (!page) return res.status(404).json({ success: false, error: { message: 'Page not found' } });
      res.json({ success: true, data: page });
    } catch (err) {
      logger.error({ err }, 'Failed to delete page');
      res.status(500).json({ success: false, error: { message: 'Failed to delete page' } });
    }
  });

  /** GET /wikis/:wikiId/pages/:id/history -- revision history */
  router.get('/wikis/:wikiId/pages/:id/history', async (req: Request, res: Response) => {
    try {
      const revisions = await d.select().from(docsWikiPageRevisions)
        .where(eq(docsWikiPageRevisions.pageId, req.params.id))
        .orderBy(desc(docsWikiPageRevisions.revisionNumber));

      res.json({ success: true, data: revisions });
    } catch (err) {
      logger.error({ err }, 'Failed to get page history');
      res.status(500).json({ success: false, error: { message: 'Failed to get page history' } });
    }
  });

  /** POST /wikis/:wikiId/pages/:id/revert -- revert to a revision */
  router.post('/wikis/:wikiId/pages/:id/revert', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const { revisionId } = req.body;

      const [revision] = await d.select().from(docsWikiPageRevisions)
        .where(and(
          eq(docsWikiPageRevisions.id, revisionId),
          eq(docsWikiPageRevisions.pageId, req.params.id),
        ));

      if (!revision) return res.status(404).json({ success: false, error: { message: 'Revision not found' } });

      // Snapshot current state before reverting
      const [current] = await d.select().from(docsWikiPages)
        .where(eq(docsWikiPages.id, req.params.id));

      if (current) {
        await wikiEngine.createRevision(d, current.id, current.title, current.content || '', userId);
      }

      // Apply revision
      const [page] = await d.update(docsWikiPages).set({
        title: revision.title,
        content: revision.content,
        updatedAt: new Date(),
        authorId: userId,
      })
        .where(and(eq(docsWikiPages.id, req.params.id), eq(docsWikiPages.tenantId, tenantId)))
        .returning();

      // Re-sync backlinks
      await wikiEngine.syncBacklinks(d, page.id, req.params.wikiId, revision.content || '');

      await logActivity(d, tenantId, page.id, 'wiki_page', userId, 'reverted', {
        revisionNumber: revision.revisionNumber,
      });

      res.json({ success: true, data: page });
    } catch (err) {
      logger.error({ err }, 'Failed to revert page');
      res.status(500).json({ success: false, error: { message: 'Failed to revert page' } });
    }
  });

  /** GET /wikis/:wikiId/search -- full-text search */
  router.get('/wikis/:wikiId/search', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const query = req.query.q as string;
      if (!query) return res.json({ success: true, data: [] });

      const rankExpr = wikiEngine.searchRank(query);
      const pages = await d.select({
        id: docsWikiPages.id,
        title: docsWikiPages.title,
        slug: docsWikiPages.slug,
        status: docsWikiPages.status,
        updatedAt: docsWikiPages.updatedAt,
        rank: rankExpr,
      })
        .from(docsWikiPages)
        .where(and(
          eq(docsWikiPages.wikiId, req.params.wikiId),
          eq(docsWikiPages.tenantId, tenantId),
          wikiEngine.buildSearchQuery(query),
        ))
        .orderBy(desc(rankExpr))
        .limit(50);

      res.json({ success: true, data: pages });
    } catch (err) {
      logger.error({ err }, 'Failed to search wiki');
      res.status(500).json({ success: false, error: { message: 'Failed to search wiki' } });
    }
  });

  /** GET /wikis/:wikiId/pages/:id/backlinks -- pages linking to this page */
  router.get('/wikis/:wikiId/pages/:id/backlinks', async (req: Request, res: Response) => {
    try {
      const backlinks = await d.select({
        id: docsWikiPages.id,
        title: docsWikiPages.title,
        slug: docsWikiPages.slug,
        linkText: docsWikiLinks.linkText,
      })
        .from(docsWikiLinks)
        .innerJoin(docsWikiPages, eq(docsWikiLinks.sourcePageId, docsWikiPages.id))
        .where(eq(docsWikiLinks.targetPageId, req.params.id));

      res.json({ success: true, data: backlinks });
    } catch (err) {
      logger.error({ err }, 'Failed to get backlinks');
      res.status(500).json({ success: false, error: { message: 'Failed to get backlinks' } });
    }
  });

  // =========================================================================
  // CONNECTED DRIVES
  // =========================================================================

  /** GET /drives -- list connected drives */
  router.get('/drives', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const drives = await d.select({
        id: docsConnectedDrives.id,
        provider: docsConnectedDrives.provider,
        accountEmail: docsConnectedDrives.accountEmail,
        driveName: docsConnectedDrives.driveName,
        connectedAt: docsConnectedDrives.connectedAt,
        lastSyncAt: docsConnectedDrives.lastSyncAt,
      }).from(docsConnectedDrives)
        .where(eq(docsConnectedDrives.tenantId, tenantId))
        .orderBy(desc(docsConnectedDrives.connectedAt));

      // Include provider availability
      res.json({
        success: true,
        data: drives,
        providers: {
          microsoft: msGraph.isConfigured(),
          google: googleDrive.isConfigured(),
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to list drives');
      res.status(500).json({ success: false, error: { message: 'Failed to list drives' } });
    }
  });

  /** POST /drives/connect/microsoft -- initiate Microsoft OAuth */
  router.post('/drives/connect/microsoft', async (req: Request, res: Response) => {
    try {
      if (!msGraph.isConfigured()) {
        return res.status(400).json({ success: false, error: { message: 'Microsoft integration not configured' } });
      }
      const { redirectUri } = req.body;
      const state = `ms_${getTenantId(req)}_${Date.now()}`;
      const authUrl = msGraph.getAuthUrl(redirectUri, state);
      res.json({ success: true, data: { authUrl, state } });
    } catch (err) {
      logger.error({ err }, 'Failed to initiate Microsoft OAuth');
      res.status(500).json({ success: false, error: { message: 'Failed to initiate Microsoft OAuth' } });
    }
  });

  /** POST /drives/connect/google -- initiate Google OAuth */
  router.post('/drives/connect/google', async (req: Request, res: Response) => {
    try {
      if (!googleDrive.isConfigured()) {
        return res.status(400).json({ success: false, error: { message: 'Google Drive integration not configured' } });
      }
      const { redirectUri } = req.body;
      const state = `g_${getTenantId(req)}_${Date.now()}`;
      const authUrl = googleDrive.getAuthUrl(redirectUri, state);
      res.json({ success: true, data: { authUrl, state } });
    } catch (err) {
      logger.error({ err }, 'Failed to initiate Google OAuth');
      res.status(500).json({ success: false, error: { message: 'Failed to initiate Google OAuth' } });
    }
  });

  /** GET /drives/callback/microsoft -- Microsoft OAuth callback */
  router.get('/drives/callback/microsoft', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const { code, state } = req.query;
      const redirectUri = req.query.redirect_uri as string || process.env.MICROSOFT_REDIRECT_URI || '';

      const tokens = await msGraph.exchangeCode(code as string, redirectUri);
      const userInfo = await msGraph.getUserInfo(tokens.accessToken);
      const drive = await msGraph.getDefaultDrive(tokens.accessToken);

      const [connectedDrive] = await d.insert(docsConnectedDrives).values({
        tenantId,
        provider: 'microsoft',
        accountEmail: userInfo.mail || userInfo.userPrincipalName,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
        driveId: drive.id,
        driveName: drive.name || 'OneDrive',
      }).returning();

      await logActivity(d, tenantId, connectedDrive.id, 'drive', getUserId(req), 'created', {
        provider: 'microsoft',
        email: userInfo.mail || userInfo.userPrincipalName,
      });

      res.json({ success: true, data: connectedDrive });
    } catch (err) {
      logger.error({ err }, 'Microsoft OAuth callback failed');
      res.status(500).json({ success: false, error: { message: 'Microsoft OAuth callback failed' } });
    }
  });

  /** GET /drives/callback/google -- Google OAuth callback */
  router.get('/drives/callback/google', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const { code } = req.query;
      const redirectUri = req.query.redirect_uri as string || process.env.GOOGLE_REDIRECT_URI || '';

      const tokens = await googleDrive.exchangeCode(code as string, redirectUri);
      const email = await googleDrive.getUserEmail(tokens.accessToken);

      const [connectedDrive] = await d.insert(docsConnectedDrives).values({
        tenantId,
        provider: 'google',
        accountEmail: email,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
        driveId: 'root',
        driveName: 'Google Drive',
      }).returning();

      await logActivity(d, tenantId, connectedDrive.id, 'drive', getUserId(req), 'created', {
        provider: 'google',
        email,
      });

      res.json({ success: true, data: connectedDrive });
    } catch (err) {
      logger.error({ err }, 'Google OAuth callback failed');
      res.status(500).json({ success: false, error: { message: 'Google OAuth callback failed' } });
    }
  });

  /** DELETE /drives/:id -- disconnect drive */
  router.delete('/drives/:id', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const [drive] = await d.delete(docsConnectedDrives)
        .where(and(eq(docsConnectedDrives.id, req.params.id), eq(docsConnectedDrives.tenantId, tenantId)))
        .returning();

      if (!drive) return res.status(404).json({ success: false, error: { message: 'Drive not found' } });
      res.json({ success: true, data: drive });
    } catch (err) {
      logger.error({ err }, 'Failed to disconnect drive');
      res.status(500).json({ success: false, error: { message: 'Failed to disconnect drive' } });
    }
  });

  /** POST /drives/:id/sync -- trigger sync (refresh file listing) */
  router.post('/drives/:id/sync', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const [drive] = await d.select().from(docsConnectedDrives)
        .where(and(eq(docsConnectedDrives.id, req.params.id), eq(docsConnectedDrives.tenantId, tenantId)));

      if (!drive) return res.status(404).json({ success: false, error: { message: 'Drive not found' } });

      let files: any[];
      if (drive.provider === 'microsoft') {
        files = await msGraph.listFiles(drive.accessToken, drive.driveId!);
      } else {
        files = await googleDrive.listFiles(drive.accessToken);
      }

      // Upsert external documents
      let synced = 0;
      for (const file of files) {
        await d.insert(docsExternalDocuments).values({
          tenantId,
          driveId: drive.id,
          externalId: file.id,
          name: file.name,
          mimeType: file.mimeType,
          webUrl: file.webUrl,
          lastModified: file.lastModified ? new Date(file.lastModified) : null,
          lastSynced: new Date(),
          sizeBytes: file.size || 0,
          path: file.path,
          parentFolderId: file.parentFolderId,
          isFolder: file.isFolder,
        }).onConflictDoUpdate({
          target: [docsExternalDocuments.driveId, docsExternalDocuments.externalId],
          set: {
            name: file.name,
            mimeType: file.mimeType,
            webUrl: file.webUrl,
            lastModified: file.lastModified ? new Date(file.lastModified) : null,
            lastSynced: new Date(),
            sizeBytes: file.size || 0,
            path: file.path,
            parentFolderId: file.parentFolderId,
            isFolder: file.isFolder,
          },
        });
        synced++;
      }

      // Update last sync timestamp
      await d.update(docsConnectedDrives).set({ lastSyncAt: new Date() })
        .where(eq(docsConnectedDrives.id, drive.id));

      await logActivity(d, tenantId, drive.id, 'drive', getUserId(req), 'synced', { filesSynced: synced });
      res.json({ success: true, data: { synced } });
    } catch (err) {
      logger.error({ err }, 'Failed to sync drive');
      res.status(500).json({ success: false, error: { message: 'Failed to sync drive' } });
    }
  });

  /** GET /drives/:id/files -- browse files */
  router.get('/drives/:id/files', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const folderId = req.query.folderId as string | undefined;

      const [drive] = await d.select().from(docsConnectedDrives)
        .where(and(eq(docsConnectedDrives.id, req.params.id), eq(docsConnectedDrives.tenantId, tenantId)));

      if (!drive) return res.status(404).json({ success: false, error: { message: 'Drive not found' } });

      // Fetch live from provider API for freshness
      let files: any[];
      if (drive.provider === 'microsoft') {
        files = await msGraph.listFiles(drive.accessToken, drive.driveId!, folderId);
      } else {
        files = await googleDrive.listFiles(drive.accessToken, folderId);
      }

      res.json({ success: true, data: files });
    } catch (err) {
      logger.error({ err }, 'Failed to list drive files');
      res.status(500).json({ success: false, error: { message: 'Failed to list drive files' } });
    }
  });

  /** GET /drives/:id/files/:fileId -- file details + preview URL */
  router.get('/drives/:id/files/:fileId', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const [drive] = await d.select().from(docsConnectedDrives)
        .where(and(eq(docsConnectedDrives.id, req.params.id), eq(docsConnectedDrives.tenantId, tenantId)));

      if (!drive) return res.status(404).json({ success: false, error: { message: 'Drive not found' } });

      let file: any;
      let previewUrl: string;
      let editUrl: string;

      if (drive.provider === 'microsoft') {
        file = await msGraph.getFile(drive.accessToken, drive.driveId!, req.params.fileId);
        previewUrl = await msGraph.getPreviewUrl(drive.accessToken, drive.driveId!, req.params.fileId);
        editUrl = await msGraph.getEditUrl(drive.accessToken, drive.driveId!, req.params.fileId);
      } else {
        file = await googleDrive.getFile(drive.accessToken, req.params.fileId);
        previewUrl = googleDrive.getPreviewUrl(req.params.fileId, file.mimeType);
        editUrl = googleDrive.getEditUrl(req.params.fileId, file.mimeType);
      }

      res.json({ success: true, data: { ...file, previewUrl, editUrl } });
    } catch (err) {
      logger.error({ err }, 'Failed to get file details');
      res.status(500).json({ success: false, error: { message: 'Failed to get file details' } });
    }
  });

  /** GET /drives/:id/files/:fileId/preview -- embeddable preview URL */
  router.get('/drives/:id/files/:fileId/preview', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const [drive] = await d.select().from(docsConnectedDrives)
        .where(and(eq(docsConnectedDrives.id, req.params.id), eq(docsConnectedDrives.tenantId, tenantId)));

      if (!drive) return res.status(404).json({ success: false, error: { message: 'Drive not found' } });

      let previewUrl: string;
      if (drive.provider === 'microsoft') {
        previewUrl = await msGraph.getPreviewUrl(drive.accessToken, drive.driveId!, req.params.fileId);
      } else {
        const file = await googleDrive.getFile(drive.accessToken, req.params.fileId);
        previewUrl = googleDrive.getPreviewUrl(req.params.fileId, file.mimeType);
      }

      res.json({ success: true, data: { previewUrl } });
    } catch (err) {
      logger.error({ err }, 'Failed to get preview URL');
      res.status(500).json({ success: false, error: { message: 'Failed to get preview URL' } });
    }
  });

  /** GET /drives/:id/search -- search files in drive */
  router.get('/drives/:id/search', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const query = req.query.q as string;
      if (!query) return res.json({ success: true, data: [] });

      const [drive] = await d.select().from(docsConnectedDrives)
        .where(and(eq(docsConnectedDrives.id, req.params.id), eq(docsConnectedDrives.tenantId, tenantId)));

      if (!drive) return res.status(404).json({ success: false, error: { message: 'Drive not found' } });

      let files: any[];
      if (drive.provider === 'microsoft') {
        files = await msGraph.searchFiles(drive.accessToken, drive.driveId!, query);
      } else {
        files = await googleDrive.searchFiles(drive.accessToken, query);
      }

      res.json({ success: true, data: files });
    } catch (err) {
      logger.error({ err }, 'Failed to search drive');
      res.status(500).json({ success: false, error: { message: 'Failed to search drive' } });
    }
  });

  // =========================================================================
  // UNIFIED SEARCH + ACTIVITY
  // =========================================================================

  /** GET /documents/search -- search across wikis + connected drives */
  router.get('/documents/search', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const query = req.query.q as string;
      if (!query) return res.json({ success: true, data: { wiki: [], external: [] } });

      // Search wiki pages
      const wikiResults = await d.select({
        id: docsWikiPages.id,
        title: docsWikiPages.title,
        slug: docsWikiPages.slug,
        wikiId: docsWikiPages.wikiId,
        status: docsWikiPages.status,
        updatedAt: docsWikiPages.updatedAt,
        source: sql<string>`'wiki'`,
      })
        .from(docsWikiPages)
        .where(and(
          eq(docsWikiPages.tenantId, tenantId),
          wikiEngine.buildSearchQuery(query),
        ))
        .limit(25);

      // Search cached external docs by name
      const externalResults = await d.select({
        id: docsExternalDocuments.id,
        name: docsExternalDocuments.name,
        mimeType: docsExternalDocuments.mimeType,
        webUrl: docsExternalDocuments.webUrl,
        driveId: docsExternalDocuments.driveId,
        lastModified: docsExternalDocuments.lastModified,
        source: sql<string>`'external'`,
      })
        .from(docsExternalDocuments)
        .where(and(
          eq(docsExternalDocuments.tenantId, tenantId),
          ilike(docsExternalDocuments.name, `%${query}%`),
        ))
        .limit(25);

      res.json({ success: true, data: { wiki: wikiResults, external: externalResults } });
    } catch (err) {
      logger.error({ err }, 'Failed to search documents');
      res.status(500).json({ success: false, error: { message: 'Failed to search documents' } });
    }
  });

  /** GET /documents/recent -- recently viewed/edited */
  router.get('/documents/recent', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const limit = parseInt(req.query.limit as string) || 20;

      const activities = await d.select().from(docsActivityLog)
        .where(and(
          eq(docsActivityLog.tenantId, tenantId),
          or(
            eq(docsActivityLog.action, 'viewed'),
            eq(docsActivityLog.action, 'edited'),
            eq(docsActivityLog.action, 'created'),
          ),
        ))
        .orderBy(desc(docsActivityLog.createdAt))
        .limit(limit);

      res.json({ success: true, data: activities });
    } catch (err) {
      logger.error({ err }, 'Failed to get recent documents');
      res.status(500).json({ success: false, error: { message: 'Failed to get recent documents' } });
    }
  });

  /** GET /documents/activity -- full activity log */
  router.get('/documents/activity', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const activities = await d.select().from(docsActivityLog)
        .where(eq(docsActivityLog.tenantId, tenantId))
        .orderBy(desc(docsActivityLog.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ total }] = await d.select({ total: count() }).from(docsActivityLog)
        .where(eq(docsActivityLog.tenantId, tenantId));

      res.json({ success: true, data: activities, total });
    } catch (err) {
      logger.error({ err }, 'Failed to get activity log');
      res.status(500).json({ success: false, error: { message: 'Failed to get activity log' } });
    }
  });

  // =========================================================================
  // TAGS
  // =========================================================================

  /** PUT /documents/:documentId/tags -- set tags for a document */
  router.put('/documents/:documentId/tags', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const { tags, documentType } = req.body;

      // Delete existing tags
      await d.delete(docsDocumentTags)
        .where(and(
          eq(docsDocumentTags.documentId, req.params.documentId),
          eq(docsDocumentTags.tenantId, tenantId),
        ));

      // Insert new tags
      if (tags && tags.length > 0) {
        await d.insert(docsDocumentTags).values(
          tags.map((tag: string) => ({
            tenantId,
            documentId: req.params.documentId,
            documentType: documentType || 'wiki_page',
            tag,
          })),
        );
      }

      res.json({ success: true, data: tags });
    } catch (err) {
      logger.error({ err }, 'Failed to update tags');
      res.status(500).json({ success: false, error: { message: 'Failed to update tags' } });
    }
  });

  /** GET /documents/:documentId/tags -- get tags */
  router.get('/documents/:documentId/tags', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const tags = await d.select({ tag: docsDocumentTags.tag }).from(docsDocumentTags)
        .where(and(
          eq(docsDocumentTags.documentId, req.params.documentId),
          eq(docsDocumentTags.tenantId, tenantId),
        ));

      res.json({ success: true, data: tags.map((t: any) => t.tag) });
    } catch (err) {
      logger.error({ err }, 'Failed to get tags');
      res.status(500).json({ success: false, error: { message: 'Failed to get tags' } });
    }
  });

  return { router };
}

// =========================================================================
// HELPERS
// =========================================================================

async function logActivity(
  db: any,
  tenantId: string,
  documentId: string | null,
  documentType: string,
  userId: string | null,
  action: string,
  details: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(docsActivityLog).values({
      tenantId,
      documentId,
      documentType,
      userId,
      action,
      details,
    });
  } catch {
    // Activity logging should not fail the request
  }
}

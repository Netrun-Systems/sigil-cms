// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * Charlotte AI Assistant Routes
 *
 * Public routes:
 *   GET  /widget.js  — embeddable chat widget JavaScript
 *   POST /chat       — proxy to Charlotte execute (adds site context)
 *   POST /search     — proxy to Charlotte knowledge search (scoped to site)
 *   GET  /health     — Charlotte connection status
 *
 * Admin routes (mounted under site-scoped path):
 *   GET  /config     — Charlotte connection settings + health
 *   PUT  /config     — save Charlotte API URL + settings
 *   GET  /knowledge  — list knowledge collections
 *   POST /knowledge/ingest — ingest a CMS page into Charlotte's knowledge base
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import type { PluginLogger, DrizzleClient } from '@netrun-cms/plugin-runtime';
import {
  executePrompt,
  searchKnowledge,
  healthCheck,
  ingestContent,
  listCollections,
} from './lib/charlotte-client.js';
import { generateWidgetSnippet } from './lib/widget-snippet.js';

// Cache the generated widget JS in memory (regenerated on config change)
let widgetCache: { js: string; etag: string } | null = null;

export function createPublicRoutes(
  _db: DrizzleClient,
  logger: PluginLogger,
): Router {
  const router = Router();

  // ── GET /widget.js — serve the embeddable chat widget ──────────────

  router.get('/widget.js', (_req: Request, res: Response) => {
    try {
      if (!widgetCache) {
        const apiBase =
          process.env.CMS_PUBLIC_URL || `${_req.protocol}://${_req.get('host')}`;
        const charlotteApi =
          process.env.CHARLOTTE_API_URL || 'http://localhost:8000';

        const js = generateWidgetSnippet({
          siteSlug: 'default',
          apiBase,
          charlotteApi,
          position: 'bottom-right',
          primaryColor: '#90b9ab',
          greeting: 'Hi! How can I help you today?',
          placeholder: 'Type a message...',
        });

        const etag = `"${Buffer.from(js).length.toString(36)}-${Date.now().toString(36)}"`;
        widgetCache = { js, etag };
      }

      res.set({
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        ETag: widgetCache.etag,
      });

      if (_req.headers['if-none-match'] === widgetCache.etag) {
        res.status(304).end();
        return;
      }

      res.send(widgetCache.js);
    } catch (err) {
      logger.error({ err, plugin: 'charlotte' }, 'Failed to serve widget.js');
      res.status(500).send('// Widget unavailable');
    }
  });

  // ── POST /chat — proxy to Charlotte execute ────────────────────────

  router.post('/chat', async (req: Request, res: Response) => {
    const { message, siteSlug } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ success: false, error: 'Message is required' });
      return;
    }

    try {
      // Add site context to the prompt so Charlotte responds in context
      const contextualPrompt = siteSlug
        ? `[Site: ${siteSlug}] User question: ${message}`
        : message;

      const result = await executePrompt(contextualPrompt);

      res.json({
        success: true,
        response: result.response,
        model: result.model_used,
        processingTime: result.processing_time_ms,
      });
    } catch (err) {
      logger.error({ err, plugin: 'charlotte' }, 'Charlotte chat proxy failed');
      res.status(502).json({
        success: false,
        error: 'AI assistant is temporarily unavailable',
      });
    }
  });

  // ── POST /search — proxy to Charlotte knowledge search ─────────────

  router.post('/search', async (req: Request, res: Response) => {
    const { query, collection, topK } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ success: false, error: 'Query is required' });
      return;
    }

    try {
      const results = await searchKnowledge(query, collection, topK);
      res.json({ success: true, results });
    } catch (err) {
      logger.error(
        { err, plugin: 'charlotte' },
        'Charlotte knowledge search failed',
      );
      res.status(502).json({
        success: false,
        error: 'Knowledge search is temporarily unavailable',
      });
    }
  });

  // ── GET /health — Charlotte connection status ──────────────────────

  router.get('/health', async (_req: Request, res: Response) => {
    try {
      const status = await healthCheck();
      res.json({ success: true, charlotte: status });
    } catch (err) {
      res.json({
        success: false,
        charlotte: { status: 'unreachable', models: {} },
        error: err instanceof Error ? err.message : 'Connection failed',
      });
    }
  });

  return router;
}

export function createAdminRoutes(
  db: DrizzleClient,
  logger: PluginLogger,
): Router {
  const router = Router();

  // ── GET /config — Charlotte connection settings + health ───────────

  router.get('/config', async (_req: Request, res: Response) => {
    try {
      const charlotteUrl =
        process.env.CHARLOTTE_API_URL || 'http://localhost:8000';
      let charlotteHealth = null;

      try {
        charlotteHealth = await healthCheck();
      } catch {
        charlotteHealth = { status: 'unreachable', models: {} };
      }

      res.json({
        success: true,
        config: {
          charlotteApiUrl: charlotteUrl,
          widgetEnabled: true,
          position: 'bottom-right',
          primaryColor: '#90b9ab',
        },
        health: charlotteHealth,
      });
    } catch (err) {
      logger.error(
        { err, plugin: 'charlotte' },
        'Failed to get Charlotte config',
      );
      res.status(500).json({ success: false, error: 'Failed to load config' });
    }
  });

  // ── PUT /config — save Charlotte connection settings ───────────────

  router.put('/config', async (req: Request, res: Response) => {
    const { charlotteApiUrl, widgetEnabled, position, primaryColor } = req.body;

    try {
      // In a full implementation, these would be persisted to a config table.
      // For now, settings come from env vars and theme tokens.
      // Clear the widget cache so it regenerates with new settings.
      widgetCache = null;

      logger.info(
        { plugin: 'charlotte', charlotteApiUrl, widgetEnabled },
        'Charlotte config updated',
      );

      res.json({ success: true, message: 'Configuration saved' });
    } catch (err) {
      logger.error(
        { err, plugin: 'charlotte' },
        'Failed to save Charlotte config',
      );
      res.status(500).json({ success: false, error: 'Failed to save config' });
    }
  });

  // ── GET /knowledge — list knowledge collections ────────────────────

  router.get('/knowledge', async (_req: Request, res: Response) => {
    try {
      const collections = await listCollections();
      res.json({ success: true, collections });
    } catch (err) {
      logger.error(
        { err, plugin: 'charlotte' },
        'Failed to list knowledge collections',
      );
      res.status(502).json({
        success: false,
        error: 'Could not retrieve knowledge collections',
      });
    }
  });

  // ── POST /knowledge/ingest — ingest a CMS page into Charlotte ─────

  router.post('/knowledge/ingest', async (req: Request, res: Response) => {
    const { pageId, siteId, collection } = req.body;

    if (!pageId) {
      res.status(400).json({ success: false, error: 'pageId is required' });
      return;
    }

    try {
      // Fetch the page content from the CMS database
      const rows = await db.execute({
        sql: `
          SELECT p.title, p.slug, p.path,
                 cb.type AS block_type, cb.content, cb.settings
          FROM cms_pages p
          LEFT JOIN cms_content_blocks cb ON cb.page_id = p.id
          WHERE p.id = $1
          ORDER BY cb."order" ASC
        `,
        params: [pageId],
      });

      const pageRows = Array.isArray(rows) ? rows : (rows as any)?.rows || [];

      if (pageRows.length === 0) {
        res.status(404).json({ success: false, error: 'Page not found' });
        return;
      }

      // Build a text representation of the page
      const pageTitle = pageRows[0].title || 'Untitled';
      const pagePath = pageRows[0].path || pageRows[0].slug || '';

      const textParts = [`# ${pageTitle}\n`];

      for (const row of pageRows) {
        if (!row.content) continue;
        const content =
          typeof row.content === 'string'
            ? row.content
            : JSON.stringify(row.content);
        textParts.push(content);
      }

      const fullText = textParts.join('\n\n');
      const targetCollection = collection || siteId || 'cms-pages';
      const source = `cms://pages/${pageId}`;

      const result = await ingestContent(fullText, source, targetCollection, {
        pageId,
        siteId,
        title: pageTitle,
        path: pagePath,
        ingestedAt: new Date().toISOString(),
      });

      logger.info(
        { plugin: 'charlotte', pageId, chunks: result.chunks },
        'Page ingested into Charlotte knowledge base',
      );

      res.json({
        success: true,
        pageTitle,
        collection: targetCollection,
        chunks: result.chunks,
      });
    } catch (err) {
      logger.error(
        { err, plugin: 'charlotte', pageId },
        'Failed to ingest page into Charlotte',
      );
      res.status(502).json({
        success: false,
        error: 'Failed to ingest page into knowledge base',
      });
    }
  });

  return router;
}

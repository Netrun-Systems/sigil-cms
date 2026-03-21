// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * Marketplace Plugin Routes
 *
 * Public routes (mounted under /api/v1/public/marketplace):
 *   GET  /browse              — list available plugins (filter, search, featured)
 *   GET  /browse/:pluginId    — plugin detail (description, README, requirements)
 *
 * Admin routes (mounted under /api/v1/marketplace):
 *   GET    /installed                 — list installed plugins for this tenant
 *   POST   /install                   — install a plugin
 *   PUT    /installed/:id             — update plugin config or enable/disable
 *   DELETE /installed/:id             — uninstall a plugin
 *   POST   /installed/:id/toggle      — toggle enabled/disabled
 *
 * Registry admin routes (super admin only, mounted under /api/v1/marketplace/registry):
 *   POST   /                  — add plugin to curated registry
 *   PUT    /:pluginId         — update registry entry
 *   DELETE /:pluginId         — remove from registry
 */

import { Router, type Request, type Response } from 'express';
import type { DrizzleClient, PluginLogger } from '@netrun-cms/plugin-runtime';

// ── Public Routes ────────────────────────────────────────────────────────────

export function createPublicRoutes(db: DrizzleClient, logger: PluginLogger): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  /** GET /browse — list available plugins */
  router.get('/browse', async (req: Request, res: Response) => {
    try {
      const { category, search, featured } = req.query;

      let query = 'SELECT * FROM cms_plugin_registry WHERE 1=1';
      const params: unknown[] = [];
      let paramIdx = 1;

      if (category && category !== 'all') {
        query += ` AND category = $${paramIdx++}`;
        params.push(category);
      }

      if (featured === 'true') {
        query += ' AND is_featured = true';
      }

      if (search) {
        query += ` AND (name ILIKE $${paramIdx} OR description ILIKE $${paramIdx} OR plugin_id ILIKE $${paramIdx})`;
        params.push(`%${search}%`);
        paramIdx++;
      }

      query += ' ORDER BY is_featured DESC, downloads DESC, name ASC';

      const result = await d.execute({
        queryChunks: [query, ...params.map((p, i) => ({ value: p, paramIndex: i + 1 }))],
      });

      // Fallback: use raw SQL via drizzle execute
      const rows = await d.execute({ queryChunks: [query] });

      res.json({ success: true, data: Array.isArray(rows) ? rows : (rows?.rows || []) });
    } catch (err) {
      logger.error({ err: err instanceof Error ? err.message : String(err) }, 'Failed to browse plugins');
      res.status(500).json({ success: false, error: 'Failed to browse plugins' });
    }
  });

  /** GET /browse/:pluginId — plugin detail */
  router.get('/browse/:pluginId', async (req: Request, res: Response) => {
    try {
      const { pluginId } = req.params;

      const rows = await d.execute({
        queryChunks: [`SELECT * FROM cms_plugin_registry WHERE plugin_id = '${pluginId.replace(/'/g, "''")}'`],
      });

      const results = Array.isArray(rows) ? rows : (rows?.rows || []);
      if (results.length === 0) {
        return res.status(404).json({ success: false, error: 'Plugin not found' });
      }

      res.json({ success: true, data: results[0] });
    } catch (err) {
      logger.error({ err: err instanceof Error ? err.message : String(err) }, 'Failed to get plugin details');
      res.status(500).json({ success: false, error: 'Failed to get plugin details' });
    }
  });

  return router;
}

// ── Admin Routes ─────────────────────────────────────────────────────────────

export function createAdminRoutes(db: DrizzleClient, logger: PluginLogger): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  /** GET /installed — list installed plugins for the requesting tenant */
  router.get('/installed', async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantId || req.query.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'tenantId is required' });
      }

      const rows = await d.execute({
        queryChunks: [
          `SELECT ip.*, pr.description, pr.category, pr.icon_name, pr.author, pr.is_verified
           FROM cms_installed_plugins ip
           LEFT JOIN cms_plugin_registry pr ON pr.plugin_id = ip.plugin_id
           WHERE ip.tenant_id = '${String(tenantId).replace(/'/g, "''")}'
           ORDER BY ip.installed_at DESC`,
        ],
      });

      const results = Array.isArray(rows) ? rows : (rows?.rows || []);
      res.json({ success: true, data: results });
    } catch (err) {
      logger.error({ err: err instanceof Error ? err.message : String(err) }, 'Failed to list installed plugins');
      res.status(500).json({ success: false, error: 'Failed to list installed plugins' });
    }
  });

  /** POST /install — install a plugin */
  router.post('/install', async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantId || req.body.tenantId;
      const { pluginId, source = 'registry', sourceUrl } = req.body;

      if (!tenantId || !pluginId) {
        return res.status(400).json({ success: false, error: 'tenantId and pluginId are required' });
      }

      let pluginName = pluginId;
      let pluginVersion = '1.0.0';
      let resolvedSourceUrl = sourceUrl || null;

      // For registry installs, look up the plugin details
      if (source === 'registry') {
        const regRows = await d.execute({
          queryChunks: [
            `SELECT * FROM cms_plugin_registry WHERE plugin_id = '${pluginId.replace(/'/g, "''")}'`,
          ],
        });
        const regResults = Array.isArray(regRows) ? regRows : (regRows?.rows || []);
        if (regResults.length === 0) {
          return res.status(404).json({ success: false, error: 'Plugin not found in registry' });
        }
        const regPlugin = regResults[0];
        pluginName = regPlugin.name;
        pluginVersion = regPlugin.version;
        resolvedSourceUrl = regPlugin.source_url;

        // Increment download count
        await d.execute({
          queryChunks: [
            `UPDATE cms_plugin_registry SET downloads = downloads + 1 WHERE plugin_id = '${pluginId.replace(/'/g, "''")}'`,
          ],
        });
      }

      // Insert into installed_plugins
      const safeId = String(tenantId).replace(/'/g, "''");
      const safePid = String(pluginId).replace(/'/g, "''");
      const safeName = String(pluginName).replace(/'/g, "''");
      const safeVersion = String(pluginVersion).replace(/'/g, "''");
      const safeSource = String(source).replace(/'/g, "''");
      const safeSrcUrl = resolvedSourceUrl ? `'${String(resolvedSourceUrl).replace(/'/g, "''")}'` : 'NULL';
      const safeInstalledBy = (req as any).user?.email
        ? `'${String((req as any).user.email).replace(/'/g, "''")}'`
        : 'NULL';

      await d.execute({
        queryChunks: [
          `INSERT INTO cms_installed_plugins (tenant_id, plugin_id, name, version, source, source_url, installed_by)
           VALUES ('${safeId}', '${safePid}', '${safeName}', '${safeVersion}', '${safeSource}', ${safeSrcUrl}, ${safeInstalledBy})
           ON CONFLICT (tenant_id, plugin_id) DO UPDATE SET
             version = EXCLUDED.version,
             is_enabled = true,
             updated_at = NOW()`,
        ],
      });

      logger.info({ tenantId, pluginId, source }, 'Plugin installed');

      res.json({
        success: true,
        plugin: { pluginId, name: pluginName, version: pluginVersion, source },
        message: 'Plugin installed. Restart required to activate.',
      });
    } catch (err) {
      logger.error({ err: err instanceof Error ? err.message : String(err) }, 'Failed to install plugin');
      res.status(500).json({ success: false, error: 'Failed to install plugin' });
    }
  });

  /** PUT /installed/:id — update plugin config or enable/disable */
  router.put('/installed/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { config, isEnabled } = req.body;

      const setClauses: string[] = ['updated_at = NOW()'];
      if (config !== undefined) {
        setClauses.push(`config = '${JSON.stringify(config).replace(/'/g, "''")}'::jsonb`);
      }
      if (isEnabled !== undefined) {
        setClauses.push(`is_enabled = ${isEnabled ? 'true' : 'false'}`);
      }

      await d.execute({
        queryChunks: [
          `UPDATE cms_installed_plugins SET ${setClauses.join(', ')} WHERE id = '${String(id).replace(/'/g, "''")}'`,
        ],
      });

      res.json({ success: true, message: 'Plugin updated' });
    } catch (err) {
      logger.error({ err: err instanceof Error ? err.message : String(err) }, 'Failed to update plugin');
      res.status(500).json({ success: false, error: 'Failed to update plugin' });
    }
  });

  /** DELETE /installed/:id — uninstall a plugin */
  router.delete('/installed/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await d.execute({
        queryChunks: [
          `DELETE FROM cms_installed_plugins WHERE id = '${String(id).replace(/'/g, "''")}'`,
        ],
      });

      logger.info({ installId: id }, 'Plugin uninstalled');
      res.json({ success: true, message: 'Plugin uninstalled' });
    } catch (err) {
      logger.error({ err: err instanceof Error ? err.message : String(err) }, 'Failed to uninstall plugin');
      res.status(500).json({ success: false, error: 'Failed to uninstall plugin' });
    }
  });

  /** POST /installed/:id/toggle — toggle enabled/disabled */
  router.post('/installed/:id/toggle', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await d.execute({
        queryChunks: [
          `UPDATE cms_installed_plugins
           SET is_enabled = NOT is_enabled, updated_at = NOW()
           WHERE id = '${String(id).replace(/'/g, "''")}'`,
        ],
      });

      res.json({ success: true, message: 'Plugin toggled' });
    } catch (err) {
      logger.error({ err: err instanceof Error ? err.message : String(err) }, 'Failed to toggle plugin');
      res.status(500).json({ success: false, error: 'Failed to toggle plugin' });
    }
  });

  return router;
}

// ── Registry Admin Routes (super admin) ──────────────────────────────────────

export function createRegistryRoutes(db: DrizzleClient, logger: PluginLogger): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  /** POST / — add a plugin to the curated registry */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const {
        pluginId, name, description, author, version, category,
        iconName, isFeatured, isVerified, sourceType, sourceUrl,
        readme, requiredEnv, tags,
      } = req.body;

      if (!pluginId || !name || !version) {
        return res.status(400).json({ success: false, error: 'pluginId, name, and version are required' });
      }

      const safePid = String(pluginId).replace(/'/g, "''");
      const safeName = String(name).replace(/'/g, "''");
      const safeDesc = description ? `'${String(description).replace(/'/g, "''")}'` : 'NULL';
      const safeAuthor = author ? `'${String(author).replace(/'/g, "''")}'` : 'NULL';
      const safeVersion = String(version).replace(/'/g, "''");
      const safeCat = category ? `'${String(category).replace(/'/g, "''")}'` : 'NULL';
      const safeIcon = iconName ? `'${String(iconName).replace(/'/g, "''")}'` : 'NULL';
      const safeSrcType = sourceType ? `'${String(sourceType).replace(/'/g, "''")}'` : "'npm'";
      const safeSrcUrl = sourceUrl ? `'${String(sourceUrl).replace(/'/g, "''")}'` : 'NULL';
      const safeReadme = readme ? `'${String(readme).replace(/'/g, "''")}'` : 'NULL';
      const safeReqEnv = requiredEnv ? `'${JSON.stringify(requiredEnv).replace(/'/g, "''")}'::jsonb` : "'[]'::jsonb";
      const safeTags = tags ? `'${JSON.stringify(tags).replace(/'/g, "''")}'::jsonb` : "'[]'::jsonb";

      await d.execute({
        queryChunks: [
          `INSERT INTO cms_plugin_registry
            (plugin_id, name, description, author, version, category, icon_name,
             is_featured, is_verified, source_type, source_url, readme, required_env, tags)
           VALUES
            ('${safePid}', '${safeName}', ${safeDesc}, ${safeAuthor}, '${safeVersion}', ${safeCat}, ${safeIcon},
             ${isFeatured ? 'true' : 'false'}, ${isVerified ? 'true' : 'false'}, ${safeSrcType}, ${safeSrcUrl},
             ${safeReadme}, ${safeReqEnv}, ${safeTags})
           ON CONFLICT (plugin_id) DO NOTHING`,
        ],
      });

      logger.info({ pluginId }, 'Plugin added to registry');
      res.json({ success: true, message: 'Plugin added to registry' });
    } catch (err) {
      logger.error({ err: err instanceof Error ? err.message : String(err) }, 'Failed to add to registry');
      res.status(500).json({ success: false, error: 'Failed to add plugin to registry' });
    }
  });

  /** PUT /:pluginId — update registry entry */
  router.put('/:pluginId', async (req: Request, res: Response) => {
    try {
      const { pluginId } = req.params;
      const fields = req.body;
      const setClauses: string[] = ['updated_at = NOW()'];

      const fieldMap: Record<string, string> = {
        name: 'name', description: 'description', author: 'author',
        version: 'version', category: 'category', iconName: 'icon_name',
        isFeatured: 'is_featured', isVerified: 'is_verified',
        sourceType: 'source_type', sourceUrl: 'source_url', readme: 'readme',
      };

      for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
        if (fields[jsKey] !== undefined) {
          if (typeof fields[jsKey] === 'boolean') {
            setClauses.push(`${dbCol} = ${fields[jsKey] ? 'true' : 'false'}`);
          } else {
            setClauses.push(`${dbCol} = '${String(fields[jsKey]).replace(/'/g, "''")}'`);
          }
        }
      }

      if (fields.requiredEnv !== undefined) {
        setClauses.push(`required_env = '${JSON.stringify(fields.requiredEnv).replace(/'/g, "''")}'::jsonb`);
      }
      if (fields.tags !== undefined) {
        setClauses.push(`tags = '${JSON.stringify(fields.tags).replace(/'/g, "''")}'::jsonb`);
      }

      await d.execute({
        queryChunks: [
          `UPDATE cms_plugin_registry SET ${setClauses.join(', ')}
           WHERE plugin_id = '${String(pluginId).replace(/'/g, "''")}'`,
        ],
      });

      res.json({ success: true, message: 'Registry entry updated' });
    } catch (err) {
      logger.error({ err: err instanceof Error ? err.message : String(err) }, 'Failed to update registry');
      res.status(500).json({ success: false, error: 'Failed to update registry entry' });
    }
  });

  /** DELETE /:pluginId — remove from registry */
  router.delete('/:pluginId', async (req: Request, res: Response) => {
    try {
      const { pluginId } = req.params;

      await d.execute({
        queryChunks: [
          `DELETE FROM cms_plugin_registry WHERE plugin_id = '${String(pluginId).replace(/'/g, "''")}'`,
        ],
      });

      logger.info({ pluginId }, 'Plugin removed from registry');
      res.json({ success: true, message: 'Plugin removed from registry' });
    } catch (err) {
      logger.error({ err: err instanceof Error ? err.message : String(err) }, 'Failed to remove from registry');
      res.status(500).json({ success: false, error: 'Failed to remove plugin from registry' });
    }
  });

  return router;
}

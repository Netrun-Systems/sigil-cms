/**
 * Plugin Loader
 *
 * Loads and initializes CMS plugins at startup.
 * Each plugin's register() is wrapped in try/catch so one
 * failing plugin doesn't break the rest of the application.
 */

import type { Router } from 'express';
import type { CmsPlugin, PluginContext, PluginLogger, DrizzleClient } from './types.js';
import * as registry from './registry.js';

interface LoadPluginsOptions {
  /** Express app instance */
  app: { use: (...args: unknown[]) => void };
  /** Drizzle database client */
  db: DrizzleClient;
  /** Structured logger */
  logger: PluginLogger;
}

/**
 * Load and initialize all provided plugins.
 *
 * For each plugin:
 * 1. Check requiredEnv — skip with warning if any are missing
 * 2. Call plugin.register(ctx) — wrapped in try/catch
 * 3. Mount plugin routes on the Express app
 *
 * Returns the registry module for accessing manifest/block types.
 */
export async function loadPlugins(
  plugins: CmsPlugin[],
  options: LoadPluginsOptions,
): Promise<typeof registry> {
  const { app, db, logger } = options;

  for (const plugin of plugins) {
    // Check required environment variables
    if (plugin.requiredEnv?.length) {
      const missing = plugin.requiredEnv.filter((key) => !process.env[key]);
      if (missing.length > 0) {
        logger.warn(
          { plugin: plugin.id, missing },
          `Plugin "${plugin.name}" skipped — missing env: ${missing.join(', ')}`,
        );
        continue;
      }
    }

    // Create plugin registration in the registry
    const reg = registry.beginPlugin(plugin.id, plugin.name, plugin.version);

    // Collect routes for deferred mounting
    const siteRoutes: Array<{ path: string; router: Router }> = [];
    const publicRoutes: Array<{ path: string; router: Router }> = [];
    const globalRoutes: Array<{ path: string; router: Router }> = [];

    // Build context for this plugin
    const ctx: PluginContext = {
      app,
      db,
      logger,

      addRoutes(path: string, router: Router) {
        siteRoutes.push({ path, router });
      },

      addPublicRoutes(path: string, router: Router) {
        publicRoutes.push({ path, router });
      },

      addGlobalRoutes(path: string, router: Router) {
        globalRoutes.push({ path, router });
      },

      addBlockTypes(types) {
        registry.addBlockTypes(reg, types);
      },

      addAdminNav(section) {
        registry.addAdminNav(reg, section);
      },

      addAdminRoutes(routes) {
        registry.addAdminRoutes(reg, routes);
      },

      async runMigration(sqlStr: string) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db as any).execute({ queryChunks: [sqlStr] });
      },

      getConfig(key: string) {
        return process.env[key];
      },
    };

    try {
      await plugin.register(ctx);

      // Mount collected routes on the Express app
      for (const { path, router } of siteRoutes) {
        app.use(`/api/v1/sites/:siteId/${path}` as string, router as unknown as Parameters<typeof app.use>[0]);
      }
      for (const { path, router } of publicRoutes) {
        app.use(`/api/v1/public/${path}` as string, router as unknown as Parameters<typeof app.use>[0]);
      }
      for (const { path, router } of globalRoutes) {
        app.use(`/api/v1/${path}` as string, router as unknown as Parameters<typeof app.use>[0]);
      }

      logger.info(
        { plugin: plugin.id, version: plugin.version },
        `Plugin "${plugin.name}" loaded`,
      );
    } catch (err) {
      logger.error(
        { plugin: plugin.id, error: err instanceof Error ? err.message : String(err) },
        `Plugin "${plugin.name}" failed to load`,
      );
    }
  }

  return registry;
}

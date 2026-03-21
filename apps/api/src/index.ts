/**
 * NetrunCMS API Server
 *
 * Express.js backend with CRUD routes for all CMS entities.
 * Supports a plugin system for optional features.
 */

import 'dotenv/config';
import 'express-async-errors';
import express, { type Express } from 'express';
import cors from 'cors';
import { sql } from 'drizzle-orm';
import { createLogger, requestLogger } from '@netrun/logger';
import { createHelmetConfig, createApiRateLimiter } from '@netrun/security-middleware';
import { correlationIdMiddleware, notFoundHandler, errorHandler } from '@netrun/error-handling';
import { createHealthRoutes } from '@netrun/health';
import { getDb } from './db.js';
import apiRoutes from './routes/index.js';
import { loadPlugins } from '@netrun-cms/plugin-runtime';
import { loadEnabledPlugins } from './plugins.config.js';
import { startScheduler } from './lib/scheduler.js';
import { mountGraphQL } from './graphql/index.js';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger({ service: 'sigil-api' });

// ============================================================================
// APP SETUP
// ============================================================================

const app: Express = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Correlation ID (must be first so all subsequent middleware/handlers get it)
app.use(correlationIdMiddleware);

// Security headers via @netrun/security-middleware (replaces inline helmet config)
app.use(createHelmetConfig({
  connectSrc: [],
  imgSrc: ['data:', 'https:'],
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id', 'X-Seed-Key', 'X-Correlation-Id'],
}));

// Structured request logging (replaces morgan)
app.use(requestLogger(logger, {
  skip: (req) => req.path === '/health' || req.path === '/ready',
}));

// Rate limiting on all API traffic
app.use('/api', createApiRateLimiter());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for proper IP detection behind reverse proxy
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ============================================================================
// HEALTH ROUTES  (@netrun/health)
// ============================================================================

app.use(createHealthRoutes({
  service: 'sigil-api',
  version: process.env.npm_package_version || '1.0.0',
  dbCheck: async () => {
    const start = Date.now();
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    return Date.now() - start;
  },
  endpoints: {
    sites: 'operational',
    pages: 'operational',
    media: 'operational',
  },
}));

// ============================================================================
// PLUGIN SYSTEM
// ============================================================================

async function initPlugins() {
  try {
    const plugins = await loadEnabledPlugins();

    if (plugins.length > 0) {
      const registry = await loadPlugins(plugins, {
        app,
        db: getDb() as Parameters<typeof loadPlugins>[1]['db'],
        logger: logger as Parameters<typeof loadPlugins>[1]['logger'],
      });

      // Plugin manifest endpoint — used by admin SPA
      app.get('/api/v1/plugins/manifest', (_req, res) => {
        res.json({ success: true, data: registry.getManifest() });
      });

      logger.info({ count: plugins.length }, 'Plugin system initialized');
    } else {
      // No plugins — still provide empty manifest
      app.get('/api/v1/plugins/manifest', (_req, res) => {
        res.json({ success: true, data: { plugins: [] } });
      });
    }
  } catch (err) {
    logger.error(
      { error: err instanceof Error ? err.message : String(err) },
      'Plugin system failed to initialize',
    );
    // Still provide empty manifest so admin doesn't break
    app.get('/api/v1/plugins/manifest', (_req, res) => {
      res.json({ success: true, data: { plugins: [] } });
    });
  }
}

// ============================================================================
// ROUTES
// ============================================================================

// API v1 core routes
app.use('/api/v1', apiRoutes);

// GraphQL API (read-only, supports both public and authenticated queries)
mountGraphQL(app);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Sigil CMS API',
      version: '1.0.0',
      documentation: '/api/v1/health',
    },
  });
});

// ============================================================================
// ERROR HANDLING  (@netrun/error-handling)
// ============================================================================

// 404 handler — must come after all routes
app.use(notFoundHandler);

// Global error handler — must be last (4-arg signature)
app.use(errorHandler({
  includeStackTrace: process.env.NODE_ENV !== 'production',
  logger: (level, message, meta) => logger[level as 'error' | 'warn' | 'info']?.(meta ?? {}, message),
}));

// ============================================================================
// SERVER STARTUP
// ============================================================================

// ============================================================================
// CONTENT SCHEDULER
// ============================================================================

let stopScheduler: (() => void) | null = null;

function initScheduler() {
  const intervalMs = parseInt(process.env.SCHEDULER_INTERVAL_MS || '60000', 10);
  const disabled = process.env.SCHEDULER_DISABLED === 'true';

  if (disabled) {
    logger.info({}, 'Content scheduler disabled via SCHEDULER_DISABLED=true');
    return;
  }

  const scheduler = startScheduler(getDb(), { intervalMs, logger: logger as any });
  stopScheduler = scheduler.stop;
}

function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Graceful shutdown initiated');
  if (stopScheduler) stopScheduler();
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Initialize plugins, scheduler, then start listening
initPlugins().then(() => {
  initScheduler();

  app.listen(PORT, HOST, () => {
    logger.info(
      { host: HOST, port: PORT, env: process.env.NODE_ENV || 'development' },
      'Sigil CMS API server started',
    );
  });
});

export default app;

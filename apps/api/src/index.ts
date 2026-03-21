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

// Stripe webhook needs raw body BEFORE json parsing
// The billing router's /webhook route uses its own rawBodyMiddleware
app.use('/api/v1/billing/webhook', express.raw({ type: 'application/json' }));

// Body parsing (all other routes)
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

// Manifest handler — set after plugins load, invoked by the route below
let _manifestHandler: ((_req: unknown, res: { json: (data: unknown) => void }) => void) | null = null;

// Register manifest route EARLY (before 404 handler) — handler is set later by initPlugins
app.get('/api/v1/plugins/manifest', (_req, res) => {
  if (_manifestHandler) {
    _manifestHandler(_req, res);
  } else {
    res.json({ success: true, data: { plugins: [] } });
  }
});

async function initPlugins() {
  try {
    const plugins = await loadEnabledPlugins();

    logger.info({ count: plugins.length }, 'Loading plugins...');

    const registry = await loadPlugins(plugins, {
      app,
      db: getDb() as Parameters<typeof loadPlugins>[1]['db'],
      logger: logger as Parameters<typeof loadPlugins>[1]['logger'],
    });

    const manifest = registry.getManifest();
    logger.info({ pluginCount: manifest.plugins.length, pluginIds: manifest.plugins.map((p: { id: string }) => p.id) }, 'Plugin manifest built');

    _manifestHandler = (_req, res) => {
      res.json({ success: true, data: registry.getManifest() });
    };

    logger.info({ count: plugins.length, active: manifest.plugins.length }, 'Plugin system initialized');
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : '';
    logger.error(
      { error: errMsg, stack: errStack },
      'Plugin system failed to initialize',
    );
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

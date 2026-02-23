/**
 * NetrunCMS API Server
 *
 * Express.js backend with CRUD routes for all CMS entities
 */

import 'dotenv/config';
import 'express-async-errors';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRoutes from './routes/index.js';
import type { ApiResponse } from './types/index.js';

// Create Express app
const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id', 'X-Seed-Key'],
}));

// Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for proper IP detection behind reverse proxy
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ============================================================================
// ROUTES
// ============================================================================

// API v1 routes
app.use('/api/v1', apiRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'NetrunCMS API',
      version: '1.0.0',
      documentation: '/api/v1/health',
    },
  });
});

// 404 handler
app.use((_req, res) => {
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  };
  res.status(404).json(response);
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);

  // Handle specific error types
  if (err.name === 'SyntaxError' && 'body' in err) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Request body contains invalid JSON',
      },
    };
    res.status(400).json(response);
    return;
  }

  if (err.name === 'PayloadTooLargeError') {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request body exceeds the maximum allowed size',
      },
    };
    res.status(413).json(response);
    return;
  }

  // Generic error response
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An internal server error occurred'
        : err.message,
      ...(process.env.NODE_ENV !== 'production' && { details: err.stack }),
    },
  };

  res.status(500).json(response);
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

// Graceful shutdown handler
function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received, shutting down gracefully...`);
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
app.listen(PORT, HOST, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║   NetrunCMS API Server                                   ║
  ║   ────────────────────────────────────────               ║
  ║                                                          ║
  ║   Server:      http://${HOST}:${PORT}                       ║
  ║   API Base:    http://${HOST}:${PORT}/api/v1                ║
  ║   Health:      http://${HOST}:${PORT}/api/v1/health         ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                           ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
  `);
});

export default app;

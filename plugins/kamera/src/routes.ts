// @ts-nocheck — plugin routes use dynamic db queries with `any` db client
/**
 * KAMERA Routes — Survai 3D scan viewer embeds, status, and report generation
 */

import { Router, type Request, type Response } from 'express';
import {
  listScans,
  getScan,
  getScanDetections,
  generateReport,
  getExport,
} from './lib/survai-client.js';
import type { PluginLogger } from '@netrun-cms/plugin-runtime';
import type { Router as RouterType } from 'express';

interface KameraRoutes {
  publicRouter: RouterType;
  adminRouter: RouterType;
}

export function createRoutes(db: any, logger: PluginLogger): KameraRoutes {
  const publicRouter = Router({ mergeParams: true });
  const adminRouter = Router({ mergeParams: true });

  // ---------------------------------------------------------------------------
  // Public routes — embeddable on CMS pages
  // ---------------------------------------------------------------------------

  /** GET /scans — list scans, optionally filtered by project */
  publicRouter.get('/scans', async (req: Request, res: Response) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const scans = await listScans(projectId);
      res.json({ success: true, data: scans });
    } catch (err) {
      logger.error({ err }, 'Failed to list scans from Survai');
      res.status(502).json({
        success: false,
        error: { message: 'Failed to fetch scans from Survai API' },
      });
    }
  });

  /** GET /scans/:scanId — get scan details + detections */
  publicRouter.get('/scans/:scanId', async (req: Request, res: Response) => {
    try {
      const { scanId } = req.params;
      const [scan, detections] = await Promise.all([
        getScan(scanId),
        getScanDetections(scanId),
      ]);
      res.json({ success: true, data: { ...scan, detections } });
    } catch (err) {
      logger.error({ err, scanId: req.params.scanId }, 'Failed to get scan');
      res.status(502).json({
        success: false,
        error: { message: 'Failed to fetch scan details from Survai API' },
      });
    }
  });

  /** GET /scans/:scanId/viewer — embeddable 3D viewer HTML (iframe-ready) */
  publicRouter.get('/scans/:scanId/viewer', async (req: Request, res: Response) => {
    try {
      const { scanId } = req.params;
      const scan = await getScan(scanId);

      const survaiBaseUrl = process.env.SURVAI_API_URL || 'http://localhost:8000';

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>3D Scan Viewer — ${escapeHtml(scan.filename)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #0a0a0a; color: #e5e5e5; font-family: Inter, system-ui, sans-serif; }
    #viewer-container { width: 100%; height: 100%; position: relative; }
    .scan-info {
      position: absolute; top: 12px; left: 12px;
      background: rgba(10,10,10,0.85); backdrop-filter: blur(8px);
      border: 1px solid rgba(144,185,171,0.3); border-radius: 8px;
      padding: 12px 16px; font-size: 13px; z-index: 10;
    }
    .scan-info h3 { font-size: 14px; color: #90b9ab; margin-bottom: 4px; }
    .scan-info p { color: #a3a3a3; line-height: 1.5; }
    .scan-info .status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .status-completed { background: rgba(34,197,94,0.2); color: #22c55e; }
    .status-processing { background: rgba(234,179,8,0.2); color: #eab308; }
    .status-failed { background: rgba(239,68,68,0.2); color: #ef4444; }
    .status-queued { background: rgba(59,130,246,0.2); color: #3b82f6; }
    #viewport {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      color: #737373; font-size: 15px;
    }
  </style>
</head>
<body>
  <div id="viewer-container">
    <div class="scan-info">
      <h3>${escapeHtml(scan.filename)}</h3>
      <p>
        <span class="status status-${scan.status}">${escapeHtml(scan.status)}</span>
        &nbsp; ${scan.detectionCount ?? 0} detections
      </p>
    </div>
    <div id="viewport">
      <p>3D viewer for scan <strong>${escapeHtml(scanId)}</strong>.<br/>
      Connect a WebGL renderer (e.g. Three.js, Potree) pointed at<br/>
      <code>${escapeHtml(survaiBaseUrl)}/api/scans/${escapeHtml(scanId)}/pointcloud</code></p>
    </div>
  </div>
</body>
</html>`;

      res.type('html').send(html);
    } catch (err) {
      logger.error({ err, scanId: req.params.scanId }, 'Failed to render viewer');
      res.status(502).send('Failed to load scan viewer');
    }
  });

  /** POST /scans/:scanId/report — trigger report generation */
  publicRouter.post('/scans/:scanId/report', async (req: Request, res: Response) => {
    try {
      const { scanId } = req.params;
      const format = req.body?.format || 'json';

      if (!['json', 'csv', 'geojson'].includes(format)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid format. Must be one of: json, csv, geojson' },
        });
      }

      const result = await generateReport(scanId, format);
      res.json({ success: true, data: result });
    } catch (err) {
      logger.error({ err, scanId: req.params.scanId }, 'Failed to generate report');
      res.status(502).json({
        success: false,
        error: { message: 'Failed to generate report via Survai API' },
      });
    }
  });

  /** GET /scans/:scanId/export/:format — download exported report */
  publicRouter.get('/scans/:scanId/export/:format', async (req: Request, res: Response) => {
    try {
      const { scanId, format } = req.params;
      const buffer = await getExport(scanId, format);

      const contentTypes: Record<string, string> = {
        json: 'application/json',
        csv: 'text/csv',
        geojson: 'application/geo+json',
      };

      res.set({
        'Content-Type': contentTypes[format] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="scan-${scanId}.${format}"`,
      });
      res.send(buffer);
    } catch (err) {
      logger.error({ err, scanId: req.params.scanId, format: req.params.format }, 'Failed to export scan');
      res.status(502).json({
        success: false,
        error: { message: 'Failed to export scan data' },
      });
    }
  });

  // ---------------------------------------------------------------------------
  // Admin routes — Survai connection configuration
  // ---------------------------------------------------------------------------

  /** GET /config — get current Survai connection status */
  adminRouter.get('/config', async (_req: Request, res: Response) => {
    try {
      const apiUrl = process.env.SURVAI_API_URL || 'http://localhost:8000';
      const hasToken = !!process.env.SURVAI_API_TOKEN;

      // Ping Survai to check connectivity
      let connected = false;
      try {
        const response = await fetch(`${apiUrl}/health`, {
          signal: AbortSignal.timeout(5000),
        });
        connected = response.ok;
      } catch {
        connected = false;
      }

      res.json({
        success: true,
        data: {
          apiUrl,
          hasToken,
          connected,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to get KAMERA config');
      res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve configuration' },
      });
    }
  });

  /** PUT /config — save Survai API URL + token to site settings */
  adminRouter.put('/config', async (req: Request, res: Response) => {
    try {
      const { apiUrl, apiToken } = req.body;

      if (!apiUrl || typeof apiUrl !== 'string') {
        return res.status(400).json({
          success: false,
          error: { message: 'apiUrl is required' },
        });
      }

      // Verify connectivity before saving
      let connected = false;
      try {
        const headers: Record<string, string> = {};
        if (apiToken) {
          headers['Authorization'] = `Bearer ${apiToken}`;
        }
        const response = await fetch(`${apiUrl}/health`, {
          headers,
          signal: AbortSignal.timeout(5000),
        });
        connected = response.ok;
      } catch {
        connected = false;
      }

      if (!connected) {
        return res.status(422).json({
          success: false,
          error: {
            message: `Cannot connect to Survai API at ${apiUrl}. Verify the URL and token are correct.`,
          },
        });
      }

      // Store in environment (runtime only — persist via Key Vault in production)
      process.env.SURVAI_API_URL = apiUrl;
      if (apiToken) {
        process.env.SURVAI_API_TOKEN = apiToken;
      }

      logger.info({ apiUrl, connected }, 'KAMERA config updated');

      res.json({
        success: true,
        data: { apiUrl, hasToken: !!apiToken, connected },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to update KAMERA config');
      res.status(500).json({
        success: false,
        error: { message: 'Failed to update configuration' },
      });
    }
  });

  return { publicRouter, adminRouter };
}

/** Escape HTML to prevent XSS in the viewer template */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

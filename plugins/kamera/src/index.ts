/**
 * KAMERA Plugin — Survai 3D scan processing pipeline integration
 *
 * Embeds scan viewers, project status dashboards, and report generation
 * into CMS pages by proxying the Survai API.
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createRoutes } from './routes.js';

const kameraPlugin: CmsPlugin = {
  id: 'kamera',
  name: 'KAMERA (3D Scanning)',
  version: '1.0.0',
  requiredEnv: ['SURVAI_API_URL'],

  async register(ctx) {
    const { publicRouter, adminRouter } = createRoutes(ctx.db, ctx.logger);

    // Mount public routes (embeddable on CMS pages)
    ctx.addPublicRoutes('kamera', publicRouter);

    // Mount admin routes (configuration)
    ctx.addRoutes('kamera', adminRouter);

    // Register content block types
    ctx.addBlockTypes([
      { type: 'scan_viewer', label: '3D Scan Viewer', category: 'kamera' },
      { type: 'scan_status', label: 'Scan Status Dashboard', category: 'kamera' },
      { type: 'report_generator', label: 'Report Generator', category: 'kamera' },
    ]);

    // Register admin navigation
    ctx.addAdminNav({
      title: 'KAMERA',
      siteScoped: true,
      items: [
        { label: 'Scans', icon: 'ScanLine', href: 'kamera' },
      ],
    });
  },
};

export default kameraPlugin;

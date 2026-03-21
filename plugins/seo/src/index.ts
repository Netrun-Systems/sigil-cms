/**
 * SEO Plugin — Sitemap.xml and RSS feed generation
 *
 * No database tables, no admin UI, no required env vars.
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createRoutes } from './routes.js';

const seoPlugin: CmsPlugin = {
  id: 'seo',
  name: 'SEO (Sitemap + RSS)',
  version: '1.0.0',

  register(ctx) {
    const router = createRoutes(ctx.db);
    ctx.addPublicRoutes('sites/:siteSlug', router);
  },
};

export default seoPlugin;

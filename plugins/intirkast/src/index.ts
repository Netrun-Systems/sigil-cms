/**
 * Intirkast Broadcasting Plugin
 *
 * Embeds live stream status, podcast feeds, and broadcast schedules into
 * CMS pages. Connects to the Intirkast broadcasting platform API to pull
 * real-time data for public-facing content blocks.
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createRoutes } from './routes.js';

const intirkastPlugin: CmsPlugin = {
  id: 'intirkast',
  name: 'Intirkast Broadcasting',
  version: '1.0.0',

  requiredEnv: ['INTIRKAST_API_URL'],

  async register(ctx) {
    // Create route handlers
    const { adminRouter, publicRouter } = createRoutes(ctx.db, ctx.logger);

    // Mount routes
    ctx.addRoutes('intirkast', adminRouter);
    ctx.addPublicRoutes('intirkast/:siteSlug', publicRouter);

    // Register content block types
    ctx.addBlockTypes([
      { type: 'podcast_player', label: 'Podcast Player', category: 'media' },
      { type: 'live_status', label: 'Live Stream Status', category: 'media' },
      { type: 'broadcast_schedule', label: 'Broadcast Schedule', category: 'media' },
      { type: 'newsletter_signup', label: 'Newsletter Signup', category: 'forms' },
    ]);

    // Register admin navigation
    ctx.addAdminNav({
      title: 'Broadcasting',
      siteScoped: true,
      items: [
        { label: 'Broadcasts', icon: 'Radio', href: 'intirkast' },
      ],
    });

    // Register admin routes
    ctx.addAdminRoutes([
      { path: 'sites/:siteId/intirkast', component: '@netrun-cms/plugin-intirkast/admin/Broadcasts' },
    ]);
  },
};

export default intirkastPlugin;

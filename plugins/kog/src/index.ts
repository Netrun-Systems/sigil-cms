/**
 * KOG CRM Plugin — Lead capture, contact sync, activity feeds
 *
 * Admin routes: /api/v1/sites/:siteId/kog
 * Public routes: /api/v1/public/kog/:siteSlug
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createAdminRoutes, createPublicRoutes } from './routes.js';

const kogPlugin: CmsPlugin = {
  id: 'kog',
  name: 'KOG CRM',
  version: '1.0.0',

  requiredEnv: ['KOG_API_URL'],

  register(ctx) {
    ctx.addBlockTypes([
      { type: 'lead_capture', label: 'Lead Capture Form' },
      { type: 'activity_feed', label: 'Activity Feed' },
      { type: 'contact_lookup', label: 'Contact Lookup' },
    ]);
    const adminRouter = createAdminRoutes(ctx.db);
    const publicRouter = createPublicRoutes(ctx.db);

    ctx.addRoutes('kog', adminRouter);
    ctx.addPublicRoutes('kog/:siteSlug', publicRouter);

    ctx.addAdminNav({
      title: 'CRM',
      siteScoped: true,
      items: [
        { label: 'Leads', icon: 'UserPlus', href: 'kog' },
      ],
    });

    ctx.addAdminRoutes([
      { path: 'sites/:siteId/kog', component: '@netrun-cms/plugin-kog/admin/LeadsList' },
    ]);
  },
};

export default kogPlugin;

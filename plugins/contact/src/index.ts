/**
 * Contact Plugin — Contact form submissions, booking inquiries, admin management
 *
 * Admin routes: /api/v1/sites/:siteId/contacts
 * Public routes: /api/v1/public/contact/:siteSlug
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createAdminRoutes, createPublicRoutes } from './routes.js';

const contactPlugin: CmsPlugin = {
  id: 'contact',
  name: 'Contact & Booking',
  version: '1.0.0',

  register(ctx) {
    const adminRouter = createAdminRoutes(ctx.db);
    const publicRouter = createPublicRoutes(ctx.db);

    ctx.addRoutes('contacts', adminRouter);
    ctx.addPublicRoutes('contact/:siteSlug', publicRouter);

    ctx.addAdminNav({
      title: 'Engagement',
      siteScoped: true,
      items: [
        { label: 'Contacts', icon: 'Inbox', href: 'contacts' },
      ],
    });

    ctx.addAdminRoutes([
      { path: 'sites/:siteId/contacts', component: '@netrun-cms/plugin-contact/admin/ContactsList' },
    ]);
  },
};

export default contactPlugin;

/**
 * Mailing List Plugin — subscribe, unsubscribe, broadcast
 *
 * CAN-SPAM / GDPR compliant with one-click unsubscribe tokens.
 * ACS (Azure Communication Services) degrades gracefully when not configured.
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createAdminRoutes, createSubscribeRoutes, createUnsubscribeRoutes } from './routes.js';

const mailingListPlugin: CmsPlugin = {
  id: 'mailing-list',
  name: 'Mailing List',
  version: '1.0.0',

  register(ctx) {
    // Authenticated admin routes: /api/v1/sites/:siteId/subscribers
    const adminRouter = createAdminRoutes(ctx.db);
    ctx.addRoutes('subscribers', adminRouter);

    // Public subscribe: /api/v1/public/subscribe/:siteSlug
    const subscribeRouter = createSubscribeRoutes(ctx.db);
    ctx.addPublicRoutes('subscribe/:siteSlug', subscribeRouter);

    // Public unsubscribe: /api/v1/public/unsubscribe/:token
    const unsubscribeRouter = createUnsubscribeRoutes(ctx.db);
    ctx.addPublicRoutes('unsubscribe/:token', unsubscribeRouter);

    // Admin sidebar navigation
    ctx.addAdminNav({
      title: 'Engagement',
      siteScoped: true,
      items: [
        { label: 'Mailing List', icon: 'Mail', href: 'subscribers' },
      ],
    });

    // Admin routes for subscribers list page
    ctx.addAdminRoutes([
      { path: 'sites/:siteId/subscribers', component: '@netrun-cms/plugin-mailing-list/admin/SubscribersList' },
    ]);
  },
};

export default mailingListPlugin;

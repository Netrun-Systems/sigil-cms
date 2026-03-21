/**
 * Webhooks & Events Plugin
 *
 * Provides an in-memory event bus and webhook delivery system for NetrunCMS.
 * Other plugins can emit events via the PluginContext.emitEvent() method
 * or by importing { emit } from this plugin directly.
 *
 * Admin routes: /api/v1/sites/:siteId/webhooks
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { setEmitEvent } from '@netrun-cms/plugin-runtime';
import { createAdminRoutes } from './routes.js';
import { on, emit, off, EVENT_TYPES, type CmsEvent } from './lib/events.js';
import { deliverWebhook } from './lib/delivery.js';

// Re-export event bus for direct imports by other plugins
export { on, emit, off, EVENT_TYPES };
export type { CmsEvent };

const webhooksPlugin: CmsPlugin = {
  id: 'webhooks',
  name: 'Webhooks & Events',
  version: '1.0.0',

  async register(ctx) {
    // Register the wildcard listener that triggers webhook delivery
    // for every event emitted through the bus
    on('*', async (event: CmsEvent) => {
      try {
        await deliverWebhook(ctx.db, event);
      } catch (err) {
        ctx.logger.error(
          { error: err instanceof Error ? err.message : String(err), eventType: event.type },
          'Webhook delivery failed',
        );
      }
    });

    // Wire up the global emitEvent so all plugins' ctx.emitEvent() calls
    // route through the event bus
    setEmitEvent((event) => {
      emit({
        ...event,
        timestamp: new Date().toISOString(),
      });
    });

    // Mount admin routes
    const adminRouter = createAdminRoutes(ctx.db);
    ctx.addRoutes('webhooks', adminRouter);

    ctx.addAdminNav({
      title: 'Integrations',
      siteScoped: true,
      items: [
        { label: 'Webhooks', icon: 'Webhook', href: 'webhooks' },
      ],
    });

    ctx.addAdminRoutes([
      { path: 'sites/:siteId/webhooks', component: '@netrun-cms/plugin-webhooks/admin/WebhooksList' },
    ]);

    // Run migration to create tables
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_webhook_endpoints (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        events JSONB DEFAULT '["*"]',
        secret VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT true,
        last_delivery_at TIMESTAMP,
        last_delivery_status INTEGER,
        fail_count INTEGER NOT NULL DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_cms_webhook_endpoints_site_id
        ON cms_webhook_endpoints(site_id);
      CREATE INDEX IF NOT EXISTS idx_cms_webhook_endpoints_is_active
        ON cms_webhook_endpoints(is_active);

      CREATE TABLE IF NOT EXISTS cms_webhook_deliveries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        endpoint_id UUID NOT NULL REFERENCES cms_webhook_endpoints(id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        http_status INTEGER,
        response_body TEXT,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        next_retry_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_cms_webhook_deliveries_endpoint_created
        ON cms_webhook_deliveries(endpoint_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_cms_webhook_deliveries_status_retry
        ON cms_webhook_deliveries(status, next_retry_at);
    `);

    ctx.logger.info({}, 'Webhooks & Events plugin loaded');
  },
};

export default webhooksPlugin;

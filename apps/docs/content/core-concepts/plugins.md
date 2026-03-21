---
title: Plugin System
description: Sigil's 19-plugin architecture with env-gated activation and graceful degradation.
order: 6
---

## Architecture

Sigil plugins are self-contained feature modules that register routes, block types, admin navigation, and database migrations through a unified `PluginContext` API.

**Key design principle**: missing environment variables cause a graceful skip -- the core CMS always works. Plugins only activate when their required env vars are present.

## Plugin Interface

Every plugin exports a default `CmsPlugin` object:

```typescript
interface CmsPlugin {
  id: string;            // Unique identifier (e.g., 'artist')
  name: string;          // Human-readable name
  version: string;       // Semver version
  requiredEnv?: string[];// Env vars needed (skip if missing)
  register(ctx: PluginContext): void | Promise<void>;
}
```

## Plugin Context

The `register()` function receives a `PluginContext` with these methods:

| Method | Purpose |
|--------|---------|
| `addRoutes(path, router)` | Mount authenticated routes under `/api/v1/sites/:siteId/<path>` |
| `addPublicRoutes(path, router)` | Mount public routes under `/api/v1/public/<path>` |
| `addGlobalRoutes(path, router)` | Mount global routes under `/api/v1/<path>` |
| `addBlockTypes(types)` | Register content block types |
| `addAdminNav(section)` | Add a navigation section to the admin sidebar |
| `addAdminRoutes(routes)` | Register admin panel routes for React lazy loading |
| `runMigration(sql)` | Execute raw SQL (CREATE TABLE IF NOT EXISTS) |
| `getConfig(key)` | Read an environment variable |
| `emitEvent(event)` | Emit a CMS event through the webhook event bus |

## Plugin Manifest

The admin SPA fetches plugin metadata to build the UI:

```
GET /api/v1/plugins/manifest
```

Returns:

```json
{
  "plugins": [
    {
      "id": "artist",
      "name": "Artist",
      "version": "1.0.0",
      "enabled": true,
      "nav": [...],
      "routes": [...],
      "blockTypes": [...]
    }
  ]
}
```

## Available Plugins

| Plugin | Features | Required Env |
|--------|----------|-------------|
| **SEO** | Sitemap.xml, RSS feed | -- |
| **Artist** | Releases, events, profiles, 6 block types | -- |
| **Mailing List** | Subscribe/unsubscribe, broadcast | -- (ACS optional) |
| **Contact** | Form submissions, booking inquiries | -- (ACS optional) |
| **Photos** | Azure Blob upload, Gemini AI curation | `AZURE_STORAGE_CONNECTION_STRING` |
| **AI Advisor** | Gemini chat, pgvector RAG, TTS | `GEMINI_API_KEY` |
| **Store** | Stripe products, checkout, orders, webhooks | `STRIPE_SECRET_KEY` |
| **Merch** | Printful print-on-demand catalog | `PRINTFUL_API_KEY` |
| **PayPal** | PayPal Orders API, Smart Buttons | `PAYPAL_CLIENT_ID` |
| **Booking** | Appointments, Google Calendar sync | -- (GCal optional) |
| **Docs** | Knowledge base, versioning, search, feedback | -- |
| **Resonance** | Block analytics, A/B testing, AI suggestions | -- (Gemini optional) |
| **Migrate** | Import from WordPress, Shopify, Square Online | -- |
| **Support** | Floating help panel, search, chat, announcements | -- |
| **Charlotte** | Charlotte AI assistant widget | -- |
| **Webhooks** | Event bus, delivery tracking, retry | -- |
| **Kamera** | Survai/KAMERA integration | -- |
| **Intirkast** | Broadcasting/streaming integration | -- |
| **KOG** | CRM integration | -- |

## Creating a Plugin

```typescript
import type { CmsPlugin } from '@netrun-cms/plugin-runtime';

const myPlugin: CmsPlugin = {
  id: 'my-plugin',
  name: 'My Custom Plugin',
  version: '1.0.0',

  async register(ctx) {
    // Run migrations
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_my_table (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
        data JSONB DEFAULT '{}'
      );
    `);

    // Add routes
    const router = createMyRoutes(ctx.db, ctx.logger);
    ctx.addRoutes('my-plugin', router);

    // Register block types
    ctx.addBlockTypes([
      { type: 'my_block', label: 'My Block', category: 'Custom' },
    ]);

    // Add admin navigation
    ctx.addAdminNav({
      title: 'My Plugin',
      siteScoped: true,
      items: [
        { label: 'Dashboard', icon: 'LayoutDashboard', href: 'my-plugin' },
      ],
    });
  },
};

export default myPlugin;
```

Place your plugin in `plugins/my-plugin/` with `src/index.ts`, `package.json`, and `tsconfig.json`.

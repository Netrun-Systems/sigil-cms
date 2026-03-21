# Sigil CMS Plugin Developer Guide

This guide covers everything you need to build, test, and publish plugins for Sigil CMS. Plugins can add API routes, content block types, admin UI pages, database tables, and webhook events.

## Quick Start

A Sigil plugin is a TypeScript package that exports a `CmsPlugin` object. Here is the simplest possible plugin:

```typescript
// plugins/hello/src/index.ts
import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { Router } from 'express';

const helloPlugin: CmsPlugin = {
  id: 'hello',
  name: 'Hello World',
  version: '1.0.0',

  register(ctx) {
    const router = Router();
    router.get('/greeting', (_req, res) => {
      res.json({ message: 'Hello from my plugin!' });
    });
    ctx.addPublicRoutes('hello', router);
    ctx.logger.info({ plugin: 'hello' }, 'Hello plugin registered');
  },
};

export default helloPlugin;
```

This mounts a public endpoint at `GET /api/v1/public/hello/greeting`.

### File Structure Convention

```
plugins/my-plugin/
  package.json
  tsconfig.json
  src/
    index.ts          # CmsPlugin export (entry point)
    routes.ts         # Express route handlers (optional)
    schema.ts         # Drizzle schema or raw SQL (optional)
```

### package.json Template

```json
{
  "name": "@netrun-cms/plugin-my-plugin",
  "version": "1.0.0",
  "description": "My custom Sigil CMS plugin",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@netrun-cms/plugin-runtime": "workspace:*"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "tsup": "^8.3.0",
    "typescript": "^5.7.0"
  },
  "peerDependencies": {
    "express": "^4.21.0",
    "drizzle-orm": "^0.39.0"
  }
}
```

### tsconfig.json Template

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Plugin Interface (CmsPlugin)

Every plugin must export a default object implementing `CmsPlugin`:

```typescript
export interface CmsPlugin {
  /** Unique plugin identifier (e.g., 'my-plugin') */
  id: string;

  /** Human-readable display name */
  name: string;

  /** Semver version string */
  version: string;

  /** Environment variables required for this plugin to function.
   *  If any are missing, the plugin is skipped with a warning at startup. */
  requiredEnv?: string[];

  /** Called at startup to register routes, blocks, nav, etc. */
  register(ctx: PluginContext): void | Promise<void>;
}
```

### Key behaviors

- **`id`** must be unique across all plugins. Use lowercase kebab-case (e.g., `'my-plugin'`).
- **`requiredEnv`** is checked before `register()` is called. If any listed environment variable is not set, the plugin is skipped entirely and a warning is logged. This prevents startup crashes when optional integrations are not configured.
- **`register()`** can be synchronous or async. If it throws, the error is caught and the plugin is marked as failed — other plugins continue loading normally.

---

## PluginContext API

The `ctx` object passed to `register()` provides all the hooks a plugin needs to integrate with Sigil.

### ctx.db — Drizzle Database Client

A Drizzle ORM client connected to the CMS PostgreSQL database. Use it for querying existing tables or tables you create via `runMigration()`.

```typescript
// The type is generic; cast to `any` for full query builder access
const d = ctx.db as any;
const rows = await d.select().from(myTable).where(eq(myTable.siteId, siteId));
```

If you need Drizzle schema objects from the core CMS tables, import them from `@netrun-cms/db`:

```typescript
import { sites, pages, contentBlocks } from '@netrun-cms/db';
```

### ctx.logger — Structured Logger

A Pino-compatible logger with `info`, `warn`, and `error` methods. Always pass a context object as the first argument:

```typescript
ctx.logger.info({ plugin: 'my-plugin', action: 'sync' }, 'Starting data sync');
ctx.logger.warn({ missing: 'API_KEY' }, 'Optional integration unavailable');
ctx.logger.error({ err: error.message }, 'Failed to process webhook');
```

### ctx.app — Express App Reference

The raw Express application instance. You rarely need this directly — use the route registration helpers instead. Available for advanced middleware use cases.

### ctx.addRoutes(path, router) — Site-Scoped Authenticated Routes

Mounts an Express router under `/api/v1/sites/:siteId/<path>`. These routes are behind authentication middleware — only logged-in users with access to the site can call them.

```typescript
const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  const { siteId } = req.params;  // available via mergeParams
  // ... query data for this site
  res.json({ success: true, data: results });
});

ctx.addRoutes('my-feature', router);
// Mounts at: GET /api/v1/sites/:siteId/my-feature/
```

**Always use `Router({ mergeParams: true })`** so `req.params.siteId` is accessible inside your handlers.

### ctx.addPublicRoutes(path, router) — Public Routes (No Auth)

Mounts an Express router under `/api/v1/public/<path>`. No authentication required — suitable for public-facing APIs like form submissions, RSS feeds, or embed endpoints.

```typescript
const publicRouter = Router({ mergeParams: true });

publicRouter.post('/', async (req, res) => {
  // Handle public form submission
  res.json({ success: true });
});

ctx.addPublicRoutes('contact/:siteSlug', publicRouter);
// Mounts at: POST /api/v1/public/contact/:siteSlug/
```

### ctx.addGlobalRoutes(path, router) — Global Routes (Not Site-Scoped)

Mounts an Express router under `/api/v1/<path>`. These are authenticated but not scoped to a specific site — useful for cross-site features like an AI advisor or plugin marketplace.

```typescript
ctx.addGlobalRoutes('advisor', advisorRouter);
// Mounts at: /api/v1/advisor/
```

### ctx.addBlockTypes(types) — Register Content Block Types

Registers custom content block types that appear in the admin page editor's block picker.

```typescript
ctx.addBlockTypes([
  { type: 'product_grid', label: 'Product Grid', category: 'commerce' },
  { type: 'buy_button', label: 'Buy Button', category: 'commerce' },
]);
```

Each `BlockTypeRegistration` has:

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | Unique block type key (e.g., `'embed_player'`) |
| `label` | `string` | Human-readable label shown in the block picker |
| `category` | `string?` | Optional grouping category |

### ctx.addAdminNav(section) — Add Sidebar Navigation

Adds a navigation section to the admin sidebar. Each section has a title and a list of navigation items.

```typescript
ctx.addAdminNav({
  title: 'Store',
  siteScoped: true,
  items: [
    { label: 'Products', icon: 'ShoppingBag', href: 'store/products' },
    { label: 'Orders', icon: 'Receipt', href: 'store/orders' },
  ],
});
```

**`AdminNavSection` interface:**

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Section heading in the sidebar |
| `siteScoped` | `boolean` | `true` = items appear under `/sites/:siteId/`, `false` = global nav |
| `items` | `AdminNavItem[]` | Navigation entries |

**`AdminNavItem` interface:**

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Display text |
| `icon` | `string` | lucide-react icon name (e.g., `'ShoppingBag'`, `'Inbox'`, `'Disc3'`) |
| `href` | `string` | Route path, relative (e.g., `'store/products'` or `'/advisor'`) |

Available icons include: `Disc3`, `CalendarDays`, `User`, `Camera`, `Mail`, `Inbox`, `MessageSquare`, `FileText`, `Image`, `Globe`, `Palette`, `Settings`, `LayoutDashboard`, `Music`, `Rss`, `Search`, `Plus`, `Puzzle`, `ShoppingBag`, `Receipt`, `CreditCard`, `Shirt`, `CalendarCheck`, `Clock`, `FolderTree`, `MessageCircle`, `Activity`, `FlaskConical`, `Upload`, `Webhook`, `Languages`, `History`, `ScanLine`, `UserPlus`, `Radio`, `Bot`, `Megaphone`, `HelpCircle`, `Users`, `Package`. If an icon name is not in the registry, it falls back to `Puzzle`.

### ctx.addAdminRoutes(routes) — Register Admin UI Routes

Registers route paths for admin pages. The admin SPA uses these to create React Router entries with lazy-loaded components.

```typescript
ctx.addAdminRoutes([
  {
    path: 'sites/:siteId/store/products',
    component: '@netrun-cms/plugin-store/admin/ProductsList',
  },
  {
    path: 'sites/:siteId/store/orders',
    component: '@netrun-cms/plugin-store/admin/OrdersList',
  },
]);
```

**`AdminRoute` interface:**

| Field | Type | Description |
|-------|------|-------------|
| `path` | `string` | React Router path (e.g., `'sites/:siteId/releases'`) |
| `component` | `string` | Module path for the admin page component |

Note: The admin SPA has a static lookup map (`knownPluginPages`) that maps route paths to actual component imports. For third-party plugins, you will need to add your component to this map in the admin build. See [Admin Routes](#admin-routes-1) below for details.

### ctx.runMigration(sql) — Run Raw SQL

Executes raw SQL against the database. Use this for creating tables, indexes, and other DDL operations. Always use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` for idempotency — `runMigration` is called on every startup.

```typescript
await ctx.runMigration(`
  CREATE TABLE IF NOT EXISTS cms_my_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_cms_my_records_site_id
    ON cms_my_records(site_id);
`);
```

### ctx.getConfig(key) — Read Environment Variable

Returns the value of an environment variable, or `undefined` if not set. Equivalent to `process.env[key]` but goes through the plugin context for consistency.

```typescript
const apiKey = ctx.getConfig('MY_SERVICE_API_KEY');
if (!apiKey) {
  ctx.logger.warn({}, 'MY_SERVICE_API_KEY not set, feature disabled');
  return;
}
```

For required env vars, prefer using the `requiredEnv` field on `CmsPlugin` instead — the loader will skip your plugin automatically with a clear warning.

### ctx.emitEvent(event) — Emit Webhook Events

Emits an event through the CMS event bus. If the webhooks plugin is loaded, these events are delivered to configured webhook endpoints.

```typescript
ctx.emitEvent({
  type: 'order.completed',
  siteId: order.siteId,
  resourceType: 'order',
  resourceId: order.id,
  data: { total: order.totalAmount, currency: order.currency },
});
```

The event bus is a no-op if the webhooks plugin is not loaded.

---

## Storage API

Sigil provides a unified storage abstraction that auto-detects the cloud provider (GCS, Azure Blob, or S3/S3-compatible) from environment variables. Import from `@netrun-cms/plugin-runtime/storage`:

```typescript
import {
  uploadFile,
  deleteFile,
  downloadFile,
  ensureStorage,
} from '@netrun-cms/plugin-runtime/storage';
```

### Functions

**`uploadFile(buffer, originalName, mimeType, config?)`** — Upload a file with auto-generated UUID filename. Returns `{ id, storedName, url }`.

```typescript
const result = await uploadFile(fileBuffer, 'photo.jpg', 'image/jpeg');
// result.url → 'https://storage.googleapis.com/sigil-media/abc-123.jpg'
```

**`deleteFile(storedName, config?)`** — Delete a file by its stored name.

**`downloadFile(storedName, config?)`** — Download a file to a Buffer.

**`ensureStorage(config?)`** — Ensure the storage bucket/container exists. Call during plugin registration if your plugin uploads files.

### Provider Detection

The provider is selected automatically based on environment variables:

| Provider | Detected When |
|----------|---------------|
| GCS | `GCS_BUCKET`, `GOOGLE_APPLICATION_CREDENTIALS`, or `GCS_PROJECT_ID` is set |
| Azure | `AZURE_STORAGE_CONNECTION_STRING` is set |
| S3 | `AWS_ACCESS_KEY_ID` or `S3_ENDPOINT` is set |

Override with `STORAGE_PROVIDER=gcs|azure|s3`. Set the bucket name with `STORAGE_BUCKET`.

---

## Database Patterns

### Creating Tables

Use `ctx.runMigration()` in your `register()` function. Tables are created idempotently on every startup.

- Always prefix table names with `cms_` to avoid collisions.
- Always include a `site_id` foreign key referencing `cms_sites(id) ON DELETE CASCADE` for site-scoped data.
- Use `gen_random_uuid()` for primary keys.
- Include `created_at` and `updated_at` timestamps.

```typescript
async register(ctx) {
  await ctx.runMigration(`
    CREATE TABLE IF NOT EXISTS cms_feedback (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
      page_id UUID REFERENCES cms_pages(id) ON DELETE SET NULL,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `);
}
```

### Querying Data

Cast `ctx.db` to `any` for full Drizzle query builder access:

```typescript
import { eq, desc } from 'drizzle-orm';

export function createRoutes(db: DrizzleClient): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  router.get('/', async (req, res) => {
    const { siteId } = req.params;
    const rows = await d
      .select()
      .from(myTable)
      .where(eq(myTable.siteId, siteId))
      .orderBy(desc(myTable.createdAt));
    res.json({ success: true, data: rows });
  });

  return router;
}
```

### Using Core CMS Tables

Import schema objects from `@netrun-cms/db` to query core tables:

```typescript
import { sites, pages, contentBlocks } from '@netrun-cms/db';
```

---

## Event System

The event system lets plugins emit structured events that are delivered to webhook endpoints configured by users.

### Emitting Events

```typescript
ctx.emitEvent({
  type: 'contact.submitted',        // dot-notation event type
  siteId: submission.siteId,        // which site this belongs to
  resourceType: 'contact',          // resource category
  resourceId: submission.id,        // specific resource ID
  data: {                           // arbitrary payload
    email: submission.email,
    type: submission.type,
  },
});
```

### Common Event Types

| Event Type | When Emitted |
|------------|--------------|
| `page.created` | A new page is created |
| `page.updated` | A page is modified |
| `page.published` | A page is published |
| `contact.submitted` | A contact form is submitted |
| `order.completed` | An e-commerce order is completed |
| `subscriber.added` | A new mailing list subscriber |

You can define any event type string for your plugin. The webhooks plugin delivers all events to matching webhook endpoints.

---

## Testing Your Plugin

### Development Setup

1. Create your plugin directory under `plugins/`:
   ```bash
   mkdir -p plugins/my-plugin/src
   ```

2. Add `package.json` and `tsconfig.json` (see templates above).

3. Write your `src/index.ts`.

4. Install dependencies:
   ```bash
   pnpm install
   ```

5. Build your plugin:
   ```bash
   pnpm --filter @netrun-cms/plugin-my-plugin build
   ```

### Registering Your Plugin

Add your plugin to the loader in `apps/api/src/plugins.config.ts`:

```typescript
const loaders: Array<() => Promise<{ default: CmsPlugin }>> = [
  // ... existing plugins
  () => import('@netrun-cms/plugin-my-plugin'),
];
```

### Hot Reload

Run the dev server with watch mode:

```bash
# Terminal 1: Watch your plugin for changes
pnpm --filter @netrun-cms/plugin-my-plugin dev

# Terminal 2: Run the API with hot reload
pnpm --filter @netrun-cms/api dev
```

The API uses `tsx watch` and will restart when your plugin's built output changes.

### Adding Admin Pages

If your plugin registers admin routes, you need to add corresponding entries to `apps/admin/src/components/PluginRoutes.tsx` in the `knownPluginPages` map:

```typescript
const knownPluginPages: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  // ... existing entries
  'sites/:siteId/my-feature': () =>
    import('../pages/MyFeature/MyFeaturePage')
      .then(m => ({ default: m.MyFeaturePage as React.ComponentType })),
};
```

Then create the corresponding React page component under `apps/admin/src/pages/`.

---

## Publishing

### As an npm Package

1. Set the `name` field in `package.json` to your scoped package name (e.g., `@my-org/sigil-plugin-analytics`).
2. Build: `pnpm build`
3. Publish: `npm publish`

Users install your plugin with:

```bash
pnpm add @my-org/sigil-plugin-analytics
```

Then add the import to their `plugins.config.ts`.

### As a Git Repository

Users can install directly from a git URL:

```bash
pnpm add git+https://github.com/my-org/sigil-plugin-analytics.git
```

### Plugin Marketplace

Sigil includes a built-in Plugin Marketplace. To list your plugin in the curated registry, submit a PR adding your plugin metadata to the marketplace seed data, or contact the Sigil maintainers.

---

## Examples

### Minimal: SEO Plugin

The SEO plugin generates `sitemap.xml` and RSS feeds. It has no database tables, no admin UI, and no required environment variables.

```typescript
// plugins/seo/src/index.ts
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
```

Key takeaway: a plugin can be as simple as mounting a single router.

### Medium: Contact Plugin

The Contact plugin handles form submissions with both public and admin routes, plus admin sidebar navigation.

```typescript
// plugins/contact/src/index.ts
import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createAdminRoutes, createPublicRoutes } from './routes.js';

const contactPlugin: CmsPlugin = {
  id: 'contact',
  name: 'Contact & Booking',
  version: '1.0.0',

  register(ctx) {
    const adminRouter = createAdminRoutes(ctx.db);
    const publicRouter = createPublicRoutes(ctx.db);

    // Authenticated routes for admins to view submissions
    ctx.addRoutes('contacts', adminRouter);

    // Public route for form submissions (no auth)
    ctx.addPublicRoutes('contact/:siteSlug', publicRouter);

    // Sidebar navigation
    ctx.addAdminNav({
      title: 'Engagement',
      siteScoped: true,
      items: [
        { label: 'Contacts', icon: 'Inbox', href: 'contacts' },
      ],
    });

    // Admin page route
    ctx.addAdminRoutes([
      { path: 'sites/:siteId/contacts', component: '@netrun-cms/plugin-contact/admin/ContactsList' },
    ]);
  },
};

export default contactPlugin;
```

Key takeaway: separate public-facing and admin routes, add sidebar navigation with icons.

### Complex: Store Plugin

The Store plugin demonstrates the full API surface: database migrations, multiple route types, block types, admin navigation with multiple pages, and environment variable requirements.

```typescript
// plugins/store/src/index.ts
import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createRoutes } from './routes.js';

const storePlugin: CmsPlugin = {
  id: 'store',
  name: 'Store (Stripe)',
  version: '1.0.0',
  requiredEnv: ['STRIPE_SECRET_KEY'],  // Skipped if Stripe not configured

  async register(ctx) {
    // 1. Create database tables
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        product_type VARCHAR(20) DEFAULT 'one_time',
        unit_price INTEGER NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        stripe_product_id VARCHAR(255),
        stripe_price_id VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cms_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID REFERENCES cms_sites(id) ON DELETE CASCADE,
        stripe_session_id VARCHAR(255) UNIQUE,
        customer_email VARCHAR(320),
        status VARCHAR(20) DEFAULT 'pending',
        total_amount INTEGER NOT NULL,
        line_items JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `);

    // 2. Create routes
    const { adminRouter, publicRouter, webhookRouter } = createRoutes(ctx.db, ctx.logger);

    // 3. Mount routes
    ctx.addRoutes('store', adminRouter);                  // /api/v1/sites/:siteId/store
    ctx.addRoutes('store/webhook', webhookRouter);        // /api/v1/sites/:siteId/store/webhook
    ctx.addPublicRoutes('store/:siteSlug', publicRouter); // /api/v1/public/store/:siteSlug

    // 4. Register block types for the page editor
    ctx.addBlockTypes([
      { type: 'product_grid', label: 'Product Grid', category: 'commerce' },
      { type: 'buy_button', label: 'Buy Button', category: 'commerce' },
    ]);

    // 5. Admin sidebar navigation
    ctx.addAdminNav({
      title: 'Store',
      siteScoped: true,
      items: [
        { label: 'Products', icon: 'ShoppingBag', href: 'store/products' },
        { label: 'Orders', icon: 'Receipt', href: 'store/orders' },
      ],
    });

    // 6. Admin page routes
    ctx.addAdminRoutes([
      { path: 'sites/:siteId/store/products', component: '@netrun-cms/plugin-store/admin/ProductsList' },
      { path: 'sites/:siteId/store/orders', component: '@netrun-cms/plugin-store/admin/OrdersList' },
    ]);
  },
};

export default storePlugin;
```

Key takeaway: use `requiredEnv` to conditionally load, `runMigration` for schema, and the full set of registration helpers for a complete feature.

---

## API Reference Summary

| Method | Mount Point | Auth | Use Case |
|--------|-------------|------|----------|
| `addRoutes(path, router)` | `/api/v1/sites/:siteId/<path>` | Yes | Admin CRUD operations |
| `addPublicRoutes(path, router)` | `/api/v1/public/<path>` | No | Public forms, feeds, embeds |
| `addGlobalRoutes(path, router)` | `/api/v1/<path>` | Yes | Cross-site features |
| `addBlockTypes(types)` | — | — | Register block types for page editor |
| `addAdminNav(section)` | — | — | Add sidebar navigation |
| `addAdminRoutes(routes)` | — | — | Register admin page routes |
| `runMigration(sql)` | — | — | Create/alter database tables |
| `getConfig(key)` | — | — | Read environment variable |
| `emitEvent(event)` | — | — | Emit webhook event |

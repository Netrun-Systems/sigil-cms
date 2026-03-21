# @sigil-cms/client

TypeScript client SDK for [Sigil CMS](https://github.com/Netrun-Systems/netrun-cms). Fetch and manage content from any Sigil instance in Next.js, Nuxt, Astro, or plain Node.js.

- Zero runtime dependencies (uses native `fetch`)
- Works in Node.js 18+, browsers, and edge runtimes (Cloudflare Workers, Vercel Edge, Deno)
- Full TypeScript types for all API responses
- Supports both public (read-only) and authenticated (admin) operations

## Installation

```bash
npm install @sigil-cms/client
# or
pnpm add @sigil-cms/client
# or
yarn add @sigil-cms/client
```

## Quick Start

### Public content (no auth required)

```typescript
import { createClient } from '@sigil-cms/client';

const client = createClient({
  baseUrl: 'https://cms.example.com',
  siteSlug: 'my-site',
});

// Fetch a page by slug (includes content blocks)
const page = await client.pages.getBySlug('about');
console.log(page.title, page.blocks);

// List all published pages
const pages = await client.pages.listPublished();

// Get hierarchical page tree (for navigation)
const tree = await client.pages.getTree();

// Get site theme
const theme = await client.sites.getPublicTheme();

// Get available languages
const langs = await client.sites.getLanguages();

// Resolve site by domain
const site = await client.sites.getByDomain('example.com');

// Search pages
const results = await client.search('pricing');
```

### Authenticated operations (admin)

```typescript
const admin = createClient({
  baseUrl: 'https://cms.example.com',
  siteId: '550e8400-e29b-41d4-a716-446655440000',
  apiKey: 'your-jwt-token',
});

// Pages
const drafts = await admin.pages.list({ status: 'draft' });
const newPage = await admin.pages.create({ title: 'New Page', slug: 'new-page' });
await admin.pages.update(newPage.id, { status: 'published' });
await admin.pages.delete(newPage.id);

// Content blocks
const blocks = await admin.blocks.list(pageId);
const hero = await admin.blocks.create(pageId, {
  blockType: 'hero',
  content: { headline: 'Welcome' },
});
await admin.blocks.reorder(pageId, [hero.id, ...otherBlockIds]);

// Media
const media = await admin.media.list({ mimeType: 'image' });
const folders = await admin.media.listFolders();

// Themes
const themes = await admin.themes.list();
const active = await admin.themes.getActive();
await admin.themes.activate(themeId);
const copy = await admin.themes.duplicate(themeId, 'My Theme Copy');

// Sites
const sites = await admin.sites.list();
await admin.sites.updateDomain(siteId, 'custom.example.com');
const verified = await admin.sites.verifyDomain(siteId);

// Translations
const translations = await admin.pages.listTranslations(pageId);
const spanish = await admin.pages.createTranslation(pageId, 'es');

// Revisions
const revisions = await admin.pages.listRevisions(pageId);
await admin.pages.revertToRevision(pageId, revisionId);

// Block type catalog
const blockTypes = await admin.blocks.listTypes({ category: 'content' });
```

## Pagination

List endpoints return a `PaginatedResponse`:

```typescript
const result = await client.pages.list({ page: 1, limit: 10 });

console.log(result.data);     // Page[]
console.log(result.total);    // Total number of pages
console.log(result.page);     // Current page (1)
console.log(result.pageSize); // Items per page (10)
console.log(result.hasMore);  // true if more pages available
```

## Error Handling

All API errors throw a typed `SigilError`:

```typescript
import { SigilError, SigilNetworkError, SigilTimeoutError } from '@sigil-cms/client';

try {
  const page = await client.pages.getBySlug('nonexistent');
} catch (err) {
  if (err instanceof SigilError) {
    console.log(err.status);       // 404
    console.log(err.code);         // 'NOT_FOUND'
    console.log(err.message);      // 'Page not found'
    console.log(err.isNotFound);   // true
    console.log(err.isServerError); // false
  }

  if (err instanceof SigilNetworkError) {
    // Network failure (DNS, connection refused, etc.)
  }

  if (err instanceof SigilTimeoutError) {
    // Request exceeded timeout
  }
}
```

## Configuration

```typescript
const client = createClient({
  // Required
  baseUrl: 'https://cms.example.com',

  // For public endpoints (read-only, no auth)
  siteSlug: 'my-site',

  // For authenticated endpoints (admin CRUD)
  siteId: '550e8400-e29b-41d4-a716-446655440000',
  apiKey: 'your-jwt-token',

  // Optional
  timeout: 15000,            // Request timeout in ms (default: 30000)
  headers: {                 // Custom headers for every request
    'X-Custom-Header': 'value',
  },
  fetch: customFetch,        // Custom fetch implementation
});
```

## Framework Examples

### Next.js (App Router)

```typescript
// app/[slug]/page.tsx
import { createClient } from '@sigil-cms/client';

const cms = createClient({
  baseUrl: process.env.SIGIL_URL!,
  siteSlug: process.env.SIGIL_SITE_SLUG!,
});

export default async function Page({ params }: { params: { slug: string } }) {
  const page = await cms.pages.getBySlug(params.slug);

  return (
    <main>
      <h1>{page.title}</h1>
      {page.blocks.map((block) => (
        <div key={block.id}>{/* render block by type */}</div>
      ))}
    </main>
  );
}
```

### Astro

```typescript
// src/pages/[slug].astro
---
import { createClient } from '@sigil-cms/client';

const cms = createClient({
  baseUrl: import.meta.env.SIGIL_URL,
  siteSlug: import.meta.env.SIGIL_SITE_SLUG,
});

const page = await cms.pages.getBySlug(Astro.params.slug!);
---

<h1>{page.title}</h1>
```

## License

MIT

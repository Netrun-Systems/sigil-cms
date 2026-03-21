---
title: TypeScript SDK
description: "@sigil-cms/client -- fetch and manage content from any Sigil instance."
order: 2
---

## Installation

```bash
npm install @sigil-cms/client
# or
pnpm add @sigil-cms/client
```

## Features

- Zero runtime dependencies (uses native `fetch`)
- Works in Node.js 18+, browsers, and edge runtimes (Cloudflare Workers, Vercel Edge, Deno)
- Full TypeScript types for all API responses
- Supports both public (read-only) and authenticated (admin) operations

## Quick Start

### Public content (no auth)

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

### Authenticated operations

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

result.data;     // Page[]
result.total;    // Total count
result.page;     // Current page (1)
result.pageSize; // Items per page (10)
result.hasMore;  // true if more pages available
```

## Error Handling

```typescript
import { SigilError, SigilNetworkError, SigilTimeoutError } from '@sigil-cms/client';

try {
  const page = await client.pages.getBySlug('nonexistent');
} catch (err) {
  if (err instanceof SigilError) {
    err.status;       // 404
    err.code;         // 'NOT_FOUND'
    err.message;      // 'Page not found'
    err.isNotFound;   // true
    err.isServerError; // false
  }

  if (err instanceof SigilNetworkError) {
    // DNS, connection refused, etc.
  }

  if (err instanceof SigilTimeoutError) {
    // Request exceeded timeout
  }
}
```

## Configuration

```typescript
const client = createClient({
  baseUrl: 'https://cms.example.com',  // Required

  // Public mode
  siteSlug: 'my-site',

  // Admin mode
  siteId: 'uuid',
  apiKey: 'jwt-token',

  // Options
  timeout: 15000,          // Default: 30000ms
  headers: { 'X-Custom': 'value' },
  fetch: customFetch,      // Custom fetch implementation
});
```

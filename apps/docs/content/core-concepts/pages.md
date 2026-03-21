---
title: Pages
description: Hierarchical pages with content blocks, scheduling, translations, and revisions.
order: 2
---

## Page Model

Pages are the primary content unit in Sigil. Each page belongs to a site and can contain multiple content blocks.

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Page title |
| `slug` | string | URL-friendly identifier |
| `parentId` | UUID | Parent page for hierarchy |
| `status` | enum | `draft`, `published`, `scheduled`, `archived` |
| `language` | string | Language code (e.g., `en`, `es`) |
| `metaTitle` | string | SEO title |
| `metaDescription` | string | SEO description |
| `ogImageUrl` | string | Open Graph image |
| `template` | string | Page template identifier |
| `sortOrder` | integer | Position in navigation |
| `publishAt` | timestamp | Scheduled publish time |
| `unpublishAt` | timestamp | Scheduled unpublish time |

## Page CRUD

All page routes are scoped to a site: `/api/v1/sites/:siteId/pages`.

### List pages

```
GET /api/v1/sites/:siteId/pages
```

Query params:
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `status` -- filter by `draft`, `published`, `scheduled`, `archived`
- `language` -- filter by language code
- `parentId` -- filter by parent (use `null` for root pages)

### Create a page

```
POST /api/v1/sites/:siteId/pages
```

```json
{
  "title": "About Us",
  "slug": "about",
  "status": "draft",
  "language": "en",
  "metaTitle": "About Our Company",
  "metaDescription": "Learn about our team and mission."
}
```

Requires role: `admin`, `editor`, or `author`.

### Update / Delete

```
PUT    /api/v1/sites/:siteId/pages/:id
DELETE /api/v1/sites/:siteId/pages/:id
```

Delete removes the page and all its content blocks. Requires `admin` or `editor`.

## Content Scheduling

Schedule pages to publish or unpublish at specific times:

```
PATCH /api/v1/sites/:siteId/pages/:id/schedule
```

```json
{
  "publishAt": "2026-04-01T09:00:00Z",
  "unpublishAt": "2026-04-30T23:59:59Z"
}
```

- `publishAt` in the future sets status to `scheduled`
- `publishAt` in the past publishes immediately
- `null` clears the schedule

Requires role: `admin` or `editor`.

## Translations

Sigil supports multi-language content through page translations. Each translation shares the same slug but has a different language code.

```
GET  /api/v1/sites/:siteId/pages/:id/translations
POST /api/v1/sites/:siteId/pages/:id/translate
```

The translate endpoint clones the page and all its content blocks with the new language code:

```json
{ "language": "es" }
```

## Revisions

Every page maintains a revision history:

```
GET  /api/v1/sites/:siteId/pages/:pageId/revisions
GET  /api/v1/sites/:siteId/pages/:pageId/revisions/:revisionId
POST /api/v1/sites/:siteId/pages/:pageId/revisions/:revisionId/revert
```

Revisions are listed newest first. Reverting restores the page content to a specific revision snapshot.

## Public Access

Consumer sites fetch published pages without authentication:

```
GET /api/v1/public/sites/:siteSlug/pages/:pageSlug
```

Query params:
- `lang` -- fetch a specific language translation (falls back to site default)

Returns the page data with all visible content blocks, ordered by `sortOrder`.

---
title: REST API Reference
description: Complete reference for all Sigil CMS REST API endpoints.
order: 1
---

## Base URL

```
https://your-instance.com/api/v1
```

## Authentication

All authenticated endpoints require a JWT Bearer token:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All responses follow this shape:

```json
{
  "success": true,
  "data": { ... },
  "meta": { "total": 100, "page": 1, "pageSize": 20 }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Page not found"
  }
}
```

## Sites

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/sites` | Yes | List sites for current tenant |
| `POST` | `/sites` | admin, editor | Create a site |
| `GET` | `/sites/:id` | Yes | Get site by ID |
| `PUT` | `/sites/:id` | admin, editor | Update a site |
| `DELETE` | `/sites/:id` | admin | Delete a site |
| `PUT` | `/sites/:id/domain` | admin, editor | Set custom domain |
| `DELETE` | `/sites/:id/domain` | admin, editor | Remove custom domain |
| `GET` | `/sites/:id/domain/verify` | admin, editor | Verify DNS config |

## Pages

All scoped to `/sites/:siteId/pages`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | Yes | List pages (filter: status, language, parentId) |
| `POST` | `/` | admin, editor, author | Create a page |
| `GET` | `/:id` | Yes | Get page (query: includeBlocks) |
| `PUT` | `/:id` | admin, editor, author | Update a page |
| `DELETE` | `/:id` | admin, editor | Delete page + blocks |
| `GET` | `/:id/translations` | Yes | List translations |
| `POST` | `/:id/translate` | admin, editor, author | Clone page to new language |
| `PATCH` | `/:id/schedule` | admin, editor | Set publish/unpublish schedule |
| `GET` | `/:pageId/revisions` | Yes | List revision history |
| `GET` | `/:pageId/revisions/:revisionId` | Yes | Get specific revision |
| `POST` | `/:pageId/revisions/:revisionId/revert` | admin, editor | Revert to revision |

## Content Blocks

All scoped to `/sites/:siteId/pages/:pageId/blocks`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | Yes | List blocks (filter: blockType, isVisible) |
| `POST` | `/` | admin, editor, author | Create a block |
| `PUT` | `/reorder` | admin, editor, author | Reorder blocks |
| `GET` | `/:id` | Yes | Get block by ID |
| `PUT` | `/:id` | admin, editor, author | Update block |
| `DELETE` | `/:id` | admin, editor | Delete block |

## Block Types Catalog

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/blocks/types` | No | List all block types (query: category) |

Categories: `layout`, `content`, `media`, `interactive`, `artist`.

## Media

All scoped to `/sites/:siteId/media`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/upload` | admin, editor, author | Upload single file (multipart, 50MB max) |
| `POST` | `/upload/bulk` | admin, editor, author | Upload up to 20 files |
| `GET` | `/` | Yes | List media (filter: folder, mimeType, search) |
| `GET` | `/folders` | Yes | List folders with counts |
| `POST` | `/` | admin, editor, author | Create media record (URL reference) |
| `GET` | `/:id` | Yes | Get media item |
| `PUT` | `/:id` | admin, editor, author | Update metadata |
| `DELETE` | `/:id` | admin, editor | Delete media item |

## Themes

All scoped to `/sites/:siteId/themes`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | Yes | List themes (filter: baseTheme, isActive) |
| `GET` | `/active` | Yes | Get active theme |
| `POST` | `/` | admin, editor | Create a theme |
| `GET` | `/:id` | Yes | Get theme by ID |
| `PUT` | `/:id` | admin, editor | Update theme |
| `POST` | `/:id/activate` | admin, editor | Activate theme |
| `POST` | `/:id/duplicate` | admin, editor | Duplicate theme |
| `DELETE` | `/:id` | admin | Delete theme (not active) |

## Public Endpoints (No Auth)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/public/sites/:siteSlug/pages/:pageSlug` | Published page with blocks |
| `GET` | `/public/sites/:siteSlug/pages` | All published pages |
| `GET` | `/public/sites/:siteSlug/theme` | Active theme |
| `GET` | `/public/sites/:siteSlug/languages` | Available languages |
| `GET` | `/public/sites/by-domain/:domain` | Resolve site by domain |

## Plugin Manifest

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/plugins/manifest` | List loaded plugins with nav, routes, block types |

## Seed

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/seed` | Bootstrap demo data (requires `X-Seed-Key` header) |

## Pagination

List endpoints support:
- `page` -- page number (default: 1)
- `limit` -- items per page (default: 20, max: 100)

Response includes `meta.total`, `meta.page`, `meta.pageSize`.

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | No auth header or invalid token |
| `TOKEN_EXPIRED` | 401 | JWT token has expired |
| `INVALID_TOKEN` | 401 | Token failed verification |
| `FORBIDDEN` | 403 | Insufficient role permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request body validation failed |

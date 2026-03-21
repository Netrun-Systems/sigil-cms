---
title: Sites & Multi-Tenancy
description: How Sigil manages multiple sites within a single tenant.
order: 1
---

## Multi-Tenant Architecture

Sigil uses a two-level hierarchy: **tenants** contain **sites**.

- **Tenant** -- an organization or account. Has a plan (`free`, `starter`, `pro`, `enterprise`), settings, and owns multiple sites.
- **Site** -- an individual website. Has pages, blocks, media, themes, and a custom domain.

### Tenant Schema

```sql
cms_tenants (
  id          UUID PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(50) UNIQUE NOT NULL,
  plan        VARCHAR(20) DEFAULT 'free',  -- free | starter | pro | enterprise
  settings    JSONB DEFAULT '{}',
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP,
  updated_at  TIMESTAMP
)
```

### Site Schema

```sql
cms_sites (
  id                UUID PRIMARY KEY,
  tenant_id         UUID REFERENCES cms_tenants(id),
  name              VARCHAR(100) NOT NULL,
  slug              VARCHAR(100) NOT NULL,
  domain            VARCHAR(255),          -- custom domain
  default_language  VARCHAR(5) DEFAULT 'en',
  status            VARCHAR(20) DEFAULT 'draft',  -- draft | published | archived
  template          VARCHAR(50),
  settings          JSONB,
  created_at        TIMESTAMP,
  updated_at        TIMESTAMP
)
```

## Site CRUD API

All site endpoints require authentication and tenant context.

### List sites

```
GET /api/v1/sites
```

Query params: `page`, `limit`, `status`.

### Create a site

```
POST /api/v1/sites
```

```json
{
  "name": "My Brand Site",
  "slug": "my-brand",
  "domain": "mybrand.com",
  "defaultLanguage": "en",
  "status": "draft"
}
```

Requires role: `admin` or `editor`.

### Custom Domains

```
PUT  /api/v1/sites/:id/domain       -- set domain
DELETE /api/v1/sites/:id/domain      -- remove domain
GET  /api/v1/sites/:id/domain/verify -- verify DNS
```

Set the body to `{ "domain": "mybrand.com" }`. The verify endpoint checks DNS configuration.

### Public Site Resolution

Consumer apps resolve sites by slug or domain:

```
GET /api/v1/public/sites/:siteSlug/pages     -- list published pages
GET /api/v1/public/sites/by-domain/:domain   -- resolve by custom domain
```

No authentication required.

## Tenant Context Middleware

All authenticated routes pass through `tenantContext` middleware, which extracts the `tenantId` from the JWT token and scopes all database queries to that tenant. This prevents cross-tenant data leakage.

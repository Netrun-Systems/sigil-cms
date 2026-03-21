---
title: Introduction
description: What is Sigil CMS and why was it built?
order: 1
---

## What is Sigil CMS?

Sigil is a **multi-tenant headless CMS framework** built by Netrun Systems. It provides composable content blocks, a 19-plugin architecture, a Design Playground with 70+ Google Fonts, and an admin panel with visual editing.

> *A sigil is a mark of identity and purpose -- exactly what your brand's web presence should be.*

Sigil is designed for:

- **Brand landing pages** -- marketing sites with rich content blocks
- **Artist sites** -- music releases, events, streaming links, EPKs
- **Service businesses** -- booking, contact forms, mailing lists
- **Documentation portals** -- knowledge bases with search and feedback

## Architecture Overview

Sigil is built as a pnpm monorepo with Turborepo orchestration:

```
packages/@netrun-cms/
  core/           -- Types, enums, Zod schemas, theme tokens, utilities
  db/             -- Drizzle ORM schema, migrations, client
  ui/             -- 64 Shadcn/Radix UI components + design system CSS
  theme/          -- ThemeProvider + 5 presets (netrun-dark, kog, intirkon, minimal, frost)
  blocks/         -- Composable content blocks with open registry
  embeds/         -- Platform embed components
  plugin-runtime/ -- Plugin loader, registry, manifest system

apps/
  api/            -- Express.js backend (port 3001 dev / 3000 prod)
  admin/          -- Vite + React 18 SPA (admin panel)

plugins/          -- 19 feature plugins (env-gated, graceful skip)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+, TypeScript 5.7, pnpm 9.15 |
| Backend | Express.js 4.21, Drizzle ORM 0.39, PostgreSQL |
| Frontend | React 18, Vite 5, Tailwind CSS, Radix UI |
| Build | Turborepo, tsup |
| Database | PostgreSQL with RLS-ready multi-tenant schema |

## Shared Libraries

The API uses shared libraries from `@netrun/`:

- **@netrun/error-handling** -- Error classes, correlation IDs, Express error handler
- **@netrun/health** -- `/health` and `/ready` endpoint factory
- **@netrun/logger** -- Pino structured logging + request middleware
- **@netrun/security-middleware** -- Helmet, CSRF, rate limiting

## Design System

- **Primary Color**: `#90b9ab` (Netrun Sage Green)
- **Typography**: Futura Medium/Bold (headings), Inter (body)
- **Dark mode**: Class-based + `data-theme` attribute
- **CSS Variables**: Over 1,400 variables in the design system

## License

Sigil CMS is proprietary software by Netrun Systems, Inc.

SDK packages (`@sigil-cms/client`, `@sigil-cms/next`) are MIT licensed.

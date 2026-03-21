# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sigil** (formerly NetrunCMS) is a multi-tenant headless CMS framework built as a pnpm monorepo with Turborepo orchestration. It provides composable content blocks, a plugin architecture with 12 feature plugins, a Design Playground with 70+ Google Fonts, and an admin panel with visual editing. Built for brand landing pages, artist sites, service businesses, and documentation portals.

## Development Commands

```bash
# Install dependencies
pnpm install

# Build all packages (respects dependency order via Turbo)
pnpm build

# Development mode (all packages with hot reload)
pnpm dev

# Type check / lint all packages
pnpm typecheck
pnpm lint

# Run tests (API only currently has vitest configured)
pnpm test
pnpm --filter @netrun-cms/api test:watch   # Watch mode

# Filter to single package
pnpm --filter @netrun-cms/api dev          # API only (tsx watch, port 3001)
pnpm --filter @netrun-cms/admin dev        # Admin only (Vite, port 3001)
pnpm build --filter @netrun-cms/core       # Build single package

# Database (from packages/@netrun-cms/db/)
cd packages/@netrun-cms/db
pnpm db:generate    # Generate migrations from schema changes
pnpm db:migrate     # Run pending migrations
pnpm db:push        # Push schema directly (dev only)
pnpm db:studio      # Open Drizzle Studio UI

# Clean everything
pnpm clean          # Removes all dist/ and node_modules/
```

## Build Dependency Order

Turbo handles this automatically, but when building manually:

```
@netrun-cms/core        (no deps — build first)
  ├── @netrun-cms/db    (depends on core)
  ├── @netrun-cms/theme (depends on core)
  ├── @netrun-cms/ui    (no workspace deps, but build after core)
  ├── @netrun-cms/embeds
  └── @netrun-cms/blocks (depends on core, ui, theme)
       ├── apps/api     (depends on core, db, theme + @netrun/shared libs)
       └── apps/admin   (depends on core, ui, theme, blocks)
```

## Architecture

**Monorepo**: pnpm workspaces + Turborepo. Node >= 20, pnpm 9.15.

**Packages** (`packages/@netrun-cms/`):
- **core** — TypeScript types, enums (28), Zod validation schemas, theme token defaults, utilities (`slugify`, `generatePagePath`, `tokensToCssVariables`)
- **ui** — 64 Shadcn/Radix UI components + design system CSS (1,400+ variables). Exports components from `./` and CSS from `./styles`
- **theme** — ThemeProvider (React context) + 4 presets (netrun-dark, kog, intirkon, minimal). Exports provider from `./` and presets from `./presets`
- **blocks** — Composable content block components (Hero, Gallery, CTA, Pricing, FAQ, etc.)
- **db** — Drizzle ORM schema, migrations, client. Tables: `cms_tenants`, `cms_sites`, `cms_themes`, `cms_pages`, `cms_content_blocks`, `cms_media`, `cms_users`. Uses PostgreSQL with RLS support
- **embeds** — Platform embed components (Spotify, YouTube, etc.)

**Apps** (`apps/`):
- **api** — Express.js backend. Uses `tsx watch` for dev, `tsup` for production build (CJS, node18 target). Bundles @netrun-cms/* packages but externalizes @azure/* packages. Port 3001 dev / 3000 prod
- **admin** — Vite + React 18 SPA. Code-split into vendor chunks (react, radix, query, forms, zod, icons). Deployed to Azure Static Web Apps

## External Dependencies

The API depends on shared libraries from `netrun-shared-ts` (referenced via `file:` paths):
- `@netrun/error-handling` — Error classes, correlation IDs, Express error handler
- `@netrun/health` — `/health` and `/ready` endpoint factory
- `@netrun/logger` — Pino structured logging + request middleware
- `@netrun/security-middleware` — Helmet, CSRF, rate limiting

If these fail to resolve, rebuild them: `cd /data/workspace/github/netrun-shared-ts && npx turbo build`

## Database

- **ORM**: Drizzle with `postgres` driver
- **Config**: `packages/@netrun-cms/db/drizzle.config.ts`
- **Schema**: `packages/@netrun-cms/db/src/schema.ts` (27KB, 7 tables with check constraints and indexes)
- **Connection**: `DATABASE_URL` env var, defaults to `postgresql://localhost:5432/netrun_cms`
- **Production DB**: `netrun_cms_dev` on `psql-interfix-westus3`

## Environment Variables

See `apps/api/.env.example` for the full list. Key variables:
- `DATABASE_URL` — CMS PostgreSQL connection
- `JWT_SECRET` — Auth token signing
- `GEMINI_API_KEY` — AI advisor integration
- `AZURE_STORAGE_CONNECTION_STRING` + `PHOTOS_CONTAINER` — Photo storage
- `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASS` — pgvector RAG database (separate from CMS DB)

## Design System

- **Primary Color**: `#90b9ab` (Netrun Sage Green)
- **Typography**: Futura Medium/Bold (headings), Inter (body)
- **Dark mode**: Class-based + `data-theme` attribute
- **CSS Variables**: `packages/@netrun-cms/ui/src/styles/netrun-design-system.css`

## Deployment

- **Admin**: Azure Static Web Apps (`apps/admin/staticwebapp.config.json`)
- **API**: Docker multi-stage build (`apps/api/Dockerfile`), node:20-alpine, port 3000

## Frost Backports

The API includes features backported from Frost (reference implementation):
- **pgvector RAG** (`lib/rag.ts`, `lib/embeddings.ts`) — replaces ChromaDB
- **PostgreSQL sessions** (`lib/sessions.ts`) — replaces Redis
- **Lazy Gemini client** (`lib/gemini.ts`) — AI advisor
- **Photo management** (`lib/photos.ts`, `routes/photos.ts`) — Azure Blob Storage + PostgreSQL metadata
- ChromaDB (`lib/chroma.ts`) and Redis (`lib/redis.ts`) remain as deprecated stubs

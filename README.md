# NetrunCMS

A multi-tenant headless CMS framework with a modular plugin architecture. Built with TypeScript, React 18, Express.js, Drizzle ORM, and PostgreSQL.

## Architecture

```
packages/@netrun-cms/
  core/           — Types, enums, Zod schemas, theme tokens, utilities
  db/             — Drizzle ORM schema, migrations, client
  ui/             — 64 Shadcn/Radix UI components + design system CSS
  theme/          — ThemeProvider + 5 presets (netrun-dark, kog, intirkon, minimal, frost)
  blocks/         — Composable content blocks with open registry
  embeds/         — Platform embed components
  plugin-runtime/ — Plugin loader, registry, manifest system

apps/
  api/            — Express.js backend (port 3001 dev / 3000 prod)
  admin/          — Vite + React 18 SPA (admin panel)

plugins/          — 12 feature plugins (env-gated, graceful skip)
```

## Quick Start

```bash
# Prerequisites: Node >= 20, pnpm 9.15+, PostgreSQL

# Install dependencies
pnpm install

# Build all packages (respects dependency order via Turbo)
pnpm build

# Development mode (all packages with hot reload)
pnpm dev

# Run API only
pnpm --filter @netrun-cms/api dev

# Run admin only
pnpm --filter @netrun-cms/admin dev
```

## Environment Variables

Copy `apps/api/.env.example` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Auth token signing secret |
| `CORS_ORIGIN` | No | Allowed origins (comma-separated) |
| `STRIPE_SECRET_KEY` | No | Enables Store plugin |
| `PRINTFUL_API_KEY` | No | Enables Merch plugin |
| `PAYPAL_CLIENT_ID` + `_SECRET` | No | Enables PayPal plugin |
| `GEMINI_API_KEY` | No | Enables AI Advisor + Resonance AI suggestions |
| `AZURE_STORAGE_CONNECTION_STRING` | No | Enables Photos plugin |
| `GOOGLE_CALENDAR_CREDENTIALS` | No | Enables Booking calendar sync |

## Plugins

Plugins are self-contained feature modules. Missing env vars cause a graceful skip — the core CMS always works.

| Plugin | Features | Required Env |
|--------|----------|-------------|
| **SEO** | Sitemap.xml, RSS feed | — |
| **Artist** | Releases, events, profiles, 6 block types | — |
| **Mailing List** | Subscribe/unsubscribe, broadcast | — (ACS optional) |
| **Contact** | Form submissions, booking inquiries | — (ACS optional) |
| **Photos** | Azure Blob upload, Gemini AI curation | `AZURE_STORAGE_CONNECTION_STRING` |
| **AI Advisor** | Gemini chat, pgvector RAG, TTS | `GEMINI_API_KEY` |
| **Store** | Stripe products, checkout, orders, webhooks | `STRIPE_SECRET_KEY` |
| **Merch** | Printful print-on-demand catalog | `PRINTFUL_API_KEY` |
| **PayPal** | PayPal Orders API, Smart Buttons | `PAYPAL_CLIENT_ID` |
| **Booking** | Appointment scheduling, Google Calendar | — (GCal optional) |
| **Docs** | Knowledge base, versioning, search, feedback | — |
| **Resonance** | Block-level analytics, A/B testing, AI suggestions | — (Gemini optional) |

## Core CMS Features

- **Multi-tenant** — tenant isolation with RLS-ready schema
- **Pages** — hierarchical with full-text search, SEO metadata
- **Content Blocks** — composable block system with open registry (plugins add block types)
- **Media Library** — file management with folder organization
- **Themes** — Design Playground with 70+ Google Fonts, button shapes, spacing, shadows, glass effects
- **Font Browser** — search Google Fonts or upload custom .woff2/.ttf/.otf files

## Database

- **ORM**: Drizzle with `postgres` driver
- **Schema**: `packages/@netrun-cms/db/src/schema.ts`
- **Migrations**: `packages/@netrun-cms/db/migrations/`

```bash
cd packages/@netrun-cms/db
pnpm db:generate    # Generate migrations
pnpm db:migrate     # Run migrations
pnpm db:push        # Push schema (dev only)
pnpm db:studio      # Drizzle Studio UI
```

## Build Order

Turbo handles this automatically. Manual order:

```
core → db, theme, ui, embeds, plugin-runtime → blocks → plugins → api, admin
```

## API Endpoints

### Core (always available)
- `GET/POST /api/v1/sites` — Site management
- `GET/POST /api/v1/sites/:siteId/pages` — Page CRUD
- `GET/POST /api/v1/sites/:siteId/pages/:pageId/blocks` — Block CRUD
- `GET/POST /api/v1/sites/:siteId/media` — Media library
- `GET/POST /api/v1/sites/:siteId/themes` — Theme management
- `GET /api/v1/public/sites/:slug/pages/:slug` — Public page content
- `GET /api/v1/public/sites/:slug/theme` — Public theme
- `GET /api/v1/plugins/manifest` — Plugin manifest for admin SPA

### Plugin routes (mounted when plugin is active)
Each plugin registers its own routes at startup. See plugin source for endpoint details.

## Deployment

- **API**: Docker multi-stage build (`apps/api/Dockerfile`), node:20-alpine, port 3000
- **Admin**: Azure Static Web Apps (`apps/admin/staticwebapp.config.json`)

## Tech Stack

- **Runtime**: Node.js 20+, TypeScript 5.7, pnpm 9.15
- **Backend**: Express.js 4.21, Drizzle ORM 0.39, PostgreSQL
- **Frontend**: React 18, Vite 5, Tailwind CSS, Radix UI
- **Build**: Turborepo, tsup
- **Shared Libraries**: @netrun/error-handling, @netrun/health, @netrun/logger, @netrun/security-middleware, @netrun/stripe-client

## License

Proprietary — Netrun Systems, Inc.

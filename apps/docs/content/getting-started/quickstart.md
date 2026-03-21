---
title: Quick Start
description: Install Sigil CMS and create your first site in under 5 minutes.
order: 2
---

## Prerequisites

- Node.js >= 20
- pnpm 9.15+
- PostgreSQL database

## Option 1: CLI Scaffolding

The fastest way to get started:

```bash
# Global install
npm install -g sigil-cms

# Create a new project
sigil create my-site
cd my-site
npm install
sigil dev
```

This creates a project with:
- `package.json` with Sigil dependencies
- `sigil.config.ts` configuration file
- `.env.example` environment template
- `tsconfig.json` TypeScript configuration
- `content/`, `src/`, `public/` directories

## Option 2: From the Monorepo

For contributors or full-stack development:

```bash
git clone https://github.com/Netrun-Systems/netrun-cms.git
cd netrun-cms
pnpm install
pnpm build
pnpm dev
```

This starts:
- **API** on `http://localhost:3001`
- **Admin panel** on `http://localhost:3001` (Vite dev)

## Environment Variables

Copy `apps/api/.env.example` and set at minimum:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Auth token signing secret |
| `CORS_ORIGIN` | No | Allowed origins (comma-separated) |

Optional variables enable plugins:

| Variable | Enables |
|----------|---------|
| `STRIPE_SECRET_KEY` | Store plugin (e-commerce) |
| `PRINTFUL_API_KEY` | Merch plugin (print-on-demand) |
| `PAYPAL_CLIENT_ID` + `_SECRET` | PayPal plugin |
| `GEMINI_API_KEY` | AI Advisor + Resonance AI suggestions |
| `AZURE_STORAGE_CONNECTION_STRING` | Photos plugin (Azure Blob Storage) |
| `GOOGLE_CALENDAR_CREDENTIALS` | Booking plugin (calendar sync) |

## Database Setup

```bash
cd packages/@netrun-cms/db
pnpm db:generate    # Generate migrations from schema
pnpm db:migrate     # Apply pending migrations
pnpm db:push        # Push schema directly (dev only)
pnpm db:studio      # Open Drizzle Studio UI
```

Or via the CLI:

```bash
sigil migrate              # Apply pending migrations
sigil migrate --generate   # Generate from schema changes
sigil migrate --status     # Show migration status
```

## Seed Demo Content

```bash
sigil seed             # Populate with sample data
sigil seed --reset     # Drop existing data first
```

## Verify Installation

```bash
sigil info
```

This displays Node.js version, installed Sigil packages, config file status, and database connection status.

## Next Steps

- [Core Concepts: Sites](/docs/core-concepts/sites/) -- understand multi-tenancy
- [Core Concepts: Pages](/docs/core-concepts/pages/) -- create content
- [Core Concepts: Blocks](/docs/core-concepts/blocks/) -- composable content blocks
- [REST API Reference](/docs/developer-guide/rest-api/) -- full endpoint documentation

# NetrunCMS - Claude Code Project Instructions

## Project Overview

NetrunCMS is a lean, multi-tenant headless CMS framework maximizing code reuse from the Netrun portfolio. It provides a composable content system with integrated design system and theme customization.

**Estimated Code Reuse**: 72-78% from existing Netrun projects

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐        │
│  │ Public Sites│  │ Admin Panel │  │ Theme Playground │        │
│  │ (React 18)  │  │ Block Editor│  │ (from KOG)       │        │
│  └─────────────┘  └─────────────┘  └──────────────────┘        │
│                          │                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  @netrun-cms/ui (64 components) + design system CSS     │   │
│  │  @netrun-cms/theme (ThemeProvider + presets)            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│  Express.js + Drizzle ORM                                       │
│  PostgreSQL with Row-Level Security (RLS)                       │
└─────────────────────────────────────────────────────────────────┘
```

## Package Structure

```
packages/
├── @netrun-cms/core/     # Core types, enums, utilities
├── @netrun-cms/ui/       # 64 Shadcn UI components + design system CSS
├── @netrun-cms/theme/    # ThemeProvider + 4 presets (netrun, kog, intirkon, minimal)
├── @netrun-cms/db/       # Drizzle schema for CMS tables
└── @netrun-cms/blocks/   # (Planned) Content block components

apps/
├── admin/                # (Planned) Visual editor admin panel
├── api/                  # (Planned) Express.js backend
└── preview/              # (Planned) Public site renderer
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run development mode
pnpm dev

# Type check
pnpm typecheck

# Database migrations
cd packages/@netrun-cms/db && pnpm db:generate
```

## Key Files

| Package | File | Purpose |
|---------|------|---------|
| `@netrun-cms/core` | `src/index.ts` | Block types, theme tokens, utilities |
| `@netrun-cms/ui` | `src/styles/netrun-design-system.css` | 1,415 lines CSS variables |
| `@netrun-cms/theme` | `src/ThemeContext.tsx` | Theme provider with dark/light modes |
| `@netrun-cms/theme` | `src/presets.ts` | 4 theme presets |
| `@netrun-cms/db` | `src/schema.ts` | Drizzle schema for all CMS tables |

## Design System

**Primary Color**: `#90b9ab` (Netrun Sage Green)
**Typography**: Futura Medium/Bold
**CSS Variables**: 1,400+ variables in `netrun-design-system.css`

### Theme Presets

1. **netrun-dark** - Default dark theme with sage green
2. **kog** - KOG CRM theme with Inter font
3. **intirkon** - BI platform theme optimized for data viz
4. **minimal** - Clean content-focused theme

## Database Schema

PostgreSQL tables with RLS support:

- `cms_tenants` - Multi-tenant organizations
- `cms_sites` - Individual websites
- `cms_themes` - Per-site theme customization
- `cms_pages` - Content pages with hierarchy
- `cms_content_blocks` - Composable page content
- `cms_media` - Asset management
- `cms_users` - CMS users with role-based access

## Code Sources

| Asset | Source Project | Lines |
|-------|---------------|-------|
| 64 UI Components | NetrunnewSite | ~15,000 |
| Design System CSS | KOG (netrun-crm) | 1,415 |
| ThemeContext | KOG (netrun-crm) | 108 |
| Theme Presets | KOG + Intirkon themes | ~350 |
| Core Types | New (based on patterns) | ~600 |
| Database Schema | New (based on NetrunnewSite) | ~400 |

## Next Steps

1. ~~Create `@netrun-cms/blocks` package with block components~~ ✓ Done
2. ~~Set up `apps/api` with Express routes~~ ✓ Done
3. ~~Build `apps/admin` visual editor~~ ✓ Done (10 pages)
4. Adapt Design Playground from KOG for theme customization

## Frost Backports (March 2026)

Backported from Frost (reference implementation):

| Feature | Files | Status |
|---------|-------|--------|
| pgvector RAG | `apps/api/src/lib/rag.ts`, `lib/embeddings.ts` | Done |
| PostgreSQL sessions | `apps/api/src/lib/sessions.ts` | Done |
| Lazy Gemini client | `apps/api/src/lib/gemini.ts` | Done |
| Photo management | `apps/api/src/lib/photos.ts`, `routes/photos.ts` | Done |
| Photo Curator admin | `apps/admin/src/pages/Photos/PhotoCuratorPage.tsx` | Done |
| Deprecated ChromaDB | `apps/api/src/lib/chroma.ts` (stub) | Done |
| Deprecated Redis sessions | `apps/api/src/lib/redis.ts` (stub) | Done |

The advisor now uses pgvector (charlotte_db Cloud SQL) for RAG instead of ChromaDB,
and PostgreSQL for session persistence instead of Redis. Photo management uses
Azure Blob Storage + PostgreSQL metadata (same pattern as Frost).

---

*Version: 1.0.0*
*Created: January 2026*
*Based on plan: /home/garza/.claude/plans/cached-strolling-swan.md*

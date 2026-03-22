# Sigil CMS: The Multi-Tenant Headless CMS Built for Agencies, Developers, and the AI Era

**Version**: 2.0
**Published**: March 2026
**Author**: Netrun Systems
**Status**: Public

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The Problem](#2-the-problem)
3. [Sigil Architecture](#3-sigil-architecture)
4. [Core Features](#4-core-features)
5. [Plugin Ecosystem](#5-plugin-ecosystem)
6. [Developer Experience](#6-developer-experience)
7. [Deployment and Operations](#7-deployment-and-operations)
8. [Security and Compliance](#8-security-and-compliance)
9. [Competitive Analysis](#9-competitive-analysis)
10. [Pricing](#10-pricing)
11. [Roadmap](#11-roadmap)
12. [About Netrun Systems](#12-about-netrun-systems)

---

## 1. Executive Summary

Sigil is a multi-tenant headless CMS built for the way agencies and developers actually work: managing multiple client sites from a single deployment, giving designers visual control without requiring developer intervention, and connecting content to AI systems through a fully documented API.

Built as a pnpm monorepo with Turborepo orchestration, Sigil runs on Express.js + PostgreSQL + React 18. It ships 21 vertical-specific plugins (e-commerce, booking, artist content, analytics, documentation, AI advisor), a Design Playground with 1,400+ CSS variables and 70+ Google Fonts, a TypeScript SDK, a CLI with 5 starter templates, a GraphQL API, Next.js App Router integration, and AI-powered design generation via Google Stitch. Every feature has a REST and GraphQL endpoint, making every CMS capability accessible to both human editors and AI agents.

**Five reasons senior developers choose Sigil:**

- **Native multi-tenancy**: One deployment serves unlimited client tenants with Row-Level Security. No separate deployments, no manual middleware, no per-tenant billing surprises.
- **Design Playground**: 1,400+ CSS theme variables, 70+ Google Fonts, and 7 presets give non-technical designers full visual control — without touching code or asking a developer.
- **21 vertical plugins shipped**: Music artist, e-commerce (Stripe + Printful + PayPal), appointment booking (Google Calendar), documentation/knowledge base, mailing list, Resonance analytics, community forum, plugin marketplace, and more — baked into the framework, not bolted on from a marketplace.
- **AI design generation**: Google Stitch integration generates full-page HTML from a text prompt, then a Stitch-to-blocks converter imports that design as structured Sigil content blocks. Charlotte AI (Gemini 2.0 Flash) provides context-aware design advice with access to the current page's blocks and theme tokens.
- **Community-driven support**: Built-in gated forum with reputation system, magic-link authentication, and solved-answer workflows — replacing Discourse or Circle as a separate SaaS.
- **Platform ecosystem**: Sigil integrates with the full Netrun Systems product suite — KOG CRM for lead capture, Charlotte AI for conversational support, KAMERA for 3D scan visualization, and Intirkast for broadcast content.
- **Radical self-hosting**: Runs on any PostgreSQL host for ~$0-5/month on scale-to-zero infrastructure. The same codebase powers the free self-hosted tier and the paid cloud offering — no feature gating, no watermarking, no betrayal.

**Who should read this:**

- **Developers and technical leads** evaluating a headless CMS for a new project or for agency client management
- **Agencies and MSPs** who manage 5+ client websites and are tired of paying per-seat per-client
- **Enterprise architects** assessing headless CMS options for a multi-brand or multi-property deployment
- **Investors and analysts** seeking a technical foundation document for Sigil as a product

---

## 2. The Problem

### 2.1 The CMS Market Is Broken in Three Different Ways

The content management landscape has three dominant failure modes, each afflicting a different class of platform:

**The Cloud Lock-In Problem (Sanity)**

Sanity positions itself as a "Content Operating System" and charges $15 per seat per month, with no self-hosting option. The content store — called the Content Lake — is proprietary SaaS. Your data lives in Sanity's infrastructure. Moving it requires their export tooling. For ten editors, that is $150/month for the Growth tier. Enterprise SSO costs an additional $1,399/month. If a regulation requires your data to stay in a specific jurisdiction, or if your client simply does not want their content in a third-party database, Sanity is not an option at any price.

**The Plugin Hell Problem (Strapi)**

Strapi is the most mature open-source headless CMS with over 65,000 GitHub stars and a 150+ plugin marketplace. It solves the self-hosting problem. It does not solve the agency problem. Strapi has no native multi-tenancy — managing 20 client sites means 20 separate Strapi deployments, 20 separate databases, and 20 separate upgrade cycles. There is no built-in visual design editor. There is no block-level analytics. Strapi's content model is field-based, not block-based, which makes it excellent for structured data and awkward for visual page composition. Enterprise features — advanced RBAC, SSO, audit logs, content history — require the Enterprise license.

**The Monolith Problem (WordPress)**

WordPress powers 43% of the internet and approximately 43% of all developer frustration. It is a monolith by design: themes, plugins, and content are tightly coupled, upgrade paths are treacherous, and building a headless deployment requires bolting on a REST API to a system that was never designed to be headless. For new projects, choosing WordPress in 2026 is a statement about institutional inertia, not technical merit.

### 2.2 Agencies Need Multi-Tenancy — No CMS Provides It Natively

An agency managing 20 client websites faces a choice with every existing CMS: run 20 separate instances (20x infrastructure costs, 20x maintenance burden, 20x upgrade cycles) or attempt to hack multi-tenancy into a platform that was not designed for it.

Sanity uses a "projects" model — each project is a separate billing unit with its own pricing. There is no shared infrastructure between projects. An agency managing 20 Sanity clients pays 20 separate Sanity bills.

Strapi requires one deployment per client. There is no `cms_tenants` table. There is no row-level security. There is no per-tenant site isolation baked into the framework.

Payload CMS, which is the most technically advanced self-hosted option and is now backed by Figma following their June 2025 acquisition, also has no native multi-tenancy. One Payload instance is one project.

**Sigil's `cms_tenants` table is the first-class primitive that no other headless CMS ships.** One Sigil deployment can serve unlimited tenants, each with unlimited sites, each with their own pages, themes, users, and media — all isolated by tenant ID and protected by Row-Level Security at the database layer.

### 2.3 Designers Are Locked Out

In every headless CMS, the design layer is the developer's domain. A designer who wants to change the primary color, try a different font pairing, or preview a layout change needs to file a ticket, wait for a developer to update a CSS variable or a Tailwind config, and then get a build deployed. This is not a content management problem — it is a team coordination problem that headless CMSs have systematically made worse by separating content from design.

Sanity's Studio theming is limited to a handful of config options. Strapi's admin theming is similarly narrow. Neither has a visual design system editor. Neither ships a Design Playground.

### 2.4 AI Has Arrived and CMS Platforms Have Not Caught Up

The gap between what AI can do and what a CMS enables is widening. Modern AI image generators, design tools, and language models can produce high-quality web design assets from a text prompt in seconds. No major headless CMS has integrated this capability into the content creation workflow in a meaningful way.

Sanity has "AI Assist" for generating text content within existing fields and "Content Agent" for bulk operations. Strapi AI can generate content type schemas from a natural language description — a developer tool, not an editor tool.

None of them can take a natural language prompt, generate a full-page HTML mockup, and automatically convert that mockup into structured, editable content blocks that an editor can modify. Sigil can.

---

## 3. Sigil Architecture

### 3.1 Monorepo Structure

Sigil is a pnpm workspaces monorepo with Turborepo orchestration. The build dependency graph is explicit and deterministic:

```
@netrun-cms/core        — TypeScript types, enums (28), Zod schemas, utilities
  ├── @netrun-cms/db    — Drizzle ORM schema, migrations, PostgreSQL client
  ├── @netrun-cms/theme — ThemeProvider (React context) + 4 presets
  ├── @netrun-cms/ui    — 64 Shadcn/Radix components + design system CSS (1,400+ vars)
  ├── @netrun-cms/embeds — Platform embed components (Spotify, YouTube, etc.)
  └── @netrun-cms/blocks — Composable content block React components
       ├── apps/api     — Express.js backend, port 3001/3000
       └── apps/admin   — Vite + React 18 SPA
```

**Runtime environment**: Node.js >= 20, pnpm 9.15. The API builds to CommonJS targeting Node 18 via tsup, with a Docker multi-stage build for production. The admin panel deploys as a static site (Azure Static Web Apps or any CDN-compatible host). Plugins and packages use TypeScript strict mode throughout.

**External shared libraries**: The API integrates with `netrun-shared-ts`, a separate monorepo providing `@netrun/error-handling`, `@netrun/health`, `@netrun/logger` (Pino), and `@netrun/security-middleware` (Helmet, CSRF, rate limiting). These are referenced via `file:` paths in development and published to npm for production.

### 3.2 Database Schema

Sigil uses PostgreSQL with Drizzle ORM. The schema is declared in TypeScript (`packages/@netrun-cms/db/src/schema.ts`) and generates both runtime types and SQL migrations. Every table definition includes Zod schemas for insert/select operations, TypeScript types, and database-enforced check constraints.

**Core tables:**

| Table | Purpose |
|-------|---------|
| `cms_tenants` | Multi-tenant root. Each tenant is an organization with a plan, settings, and active flag. Indexed by slug and plan. Plan constraint: `free`, `starter`, `pro`, `enterprise`. |
| `cms_sites` | Individual websites per tenant. Stores name, slug, domain, default language, status, template, and settings JSONB (favicon, logo, social links, analytics, SEO). Unique constraint on `(tenantId, slug)`. |
| `cms_themes` | Per-site theme customization. Stores base theme name, token JSONB (colors, typography, spacing, effects), and optional custom CSS. Active theme tracked via `isActive` flag. Base theme constraint: `netrun-dark`, `netrun-light`, `kog`, `intirkon`, `minimal`, `frost`, `custom`. |
| `cms_pages` | Content pages with hierarchical structure (`parentId` self-reference), full `fullPath` computed field, status workflow (`draft`, `published`, `scheduled`, `archived`), language code, SEO fields with database-enforced length limits (metaTitle ≤ 60 chars, metaDescription ≤ 160 chars), and scheduling fields (`publishAt`, `unpublishAt`). GIN full-text index on title + metaDescription for PostgreSQL native search. |
| `cms_page_revisions` | Versioned content snapshots. Each revision stores the full content block array and settings as JSONB, along with the author and a change note. Indexed by `(pageId, version)`. |
| `cms_content_blocks` | The fundamental content unit. Each block has a `blockType` string, a `content` JSONB object, a `settings` JSONB object (padding, margin, background, width, animation, customClass), a sort order, and a visibility flag. Block type validation moved to the plugin registry (no hardcoded check constraint), allowing plugins to register new block types at runtime. |
| `cms_block_templates` | Reusable block presets. Can be global (available to all sites in a tenant) or per-site. Enables agencies to maintain a library of on-brand block configurations. |
| `cms_media` | Media asset metadata. Stores filename, MIME type, file size, URL, thumbnail URL, alt text, caption, folder path, and dimension metadata. File size check constraint ensures non-zero values. |
| `cms_users` | CMS users scoped to a tenant. Stores email, username, password hash (bcrypt), role, active flag, per-site permission overrides (JSONB), and last login. Unique constraint on `(tenantId, email)`. Role constraint: `admin`, `editor`, `author`, `viewer`. Email format enforced by DB check constraint. |
| `cms_subscribers` | Per-site mailing list. Each subscriber has an unsubscribe token (UUID, auto-generated), status (`active`, `unsubscribed`), and timestamps. Token indexed for O(1) lookup during unsubscribe. |
| `cms_contact_submissions` | Per-site contact form entries. Typed by inquiry type (`general`, `booking`, `press`, `collaboration`) and workflow status (`new`, `responded`, `booked`, `declined`, `archived`). |
| `cms_releases` | Music releases (artist plugin). Type constraint: `single`, `album`, `ep`, `mixtape`. Platform constraint for embed: `spotify`, `youtube`, `apple_music`, `soundcloud`, `bandcamp`. |
| `cms_events` | Live events (artist plugin). Type constraint: `show`, `festival`, `livestream`. |
| `cms_artist_profiles` | One-to-one with site. Stores artist name, bio, photo, genres array (JSONB), social links (JSONB), booking email, management email. |

Plugin tables (created via `runMigration()` at startup): `cms_products`, `cms_orders`, `cms_booking_services`, `cms_booking_availability`, `cms_appointments`, `cms_doc_categories`, `cms_doc_articles`, `cms_doc_revisions`, `cms_doc_feedback`, `cms_resonance_events`, `cms_resonance_scores`, `cms_resonance_experiments`, `cms_resonance_suggestions`, `cms_webhook_endpoints`, `cms_webhook_deliveries`, `cms_migrations`, `cms_migration_items`, `rag_collections`, `rag_documents`, `rag_chunks`, `ncms_advisor_sessions`.

### 3.3 Multi-Tenancy Model

The multi-tenancy hierarchy flows as: `Tenant → Sites → Pages → Blocks`.

Every site belongs to a tenant. Every page belongs to a site. Every block belongs to a page. Every user belongs to a tenant with a default role, plus per-site permission overrides stored in a JSONB column (`sitePermissions: Record<string, string[]>`). This allows an admin user to have `viewer` permissions on one site but `editor` permissions on another within the same tenant.

Row-Level Security is supported at the database layer. All queries that are tenant-scoped pass through an Express middleware (`tenantContext`) that injects the tenant ID from the authenticated JWT token. This means a user authenticated as `tenant-A` cannot read, create, or modify resources belonging to `tenant-B` — even if they know the IDs.

For agencies: one Sigil deployment, one database, one admin panel. Each agency client is a tenant. The agency's staff are users with appropriate roles. Client contacts can be invited as `viewer` or `author` users on their specific site.

### 3.4 Plugin Runtime Architecture

Sigil's plugin system is defined by a single TypeScript interface (`CmsPlugin`) in `@netrun-cms/plugin-runtime`. Each plugin exports a default object implementing this interface:

```typescript
interface CmsPlugin {
  id: string;
  name: string;
  version: string;
  requiredEnv?: string[];
  register(ctx: PluginContext): void | Promise<void>;
}
```

The `PluginContext` object passed to `register()` provides everything a plugin needs:

- `addRoutes(path, router)` — mounts authenticated routes under `/api/v1/sites/:siteId/<path>`
- `addPublicRoutes(path, router)` — mounts unauthenticated routes under `/api/v1/public/<path>`
- `addGlobalRoutes(path, router)` — mounts non-site-scoped routes under `/api/v1/<path>`
- `addBlockTypes(types)` — registers new block types in the global block registry
- `addAdminNav(section)` — adds a section to the admin sidebar
- `addAdminRoutes(routes)` — registers React components for admin-side routing (lazy loaded)
- `runMigration(sql)` — executes CREATE TABLE IF NOT EXISTS and other idempotent DDL at startup
- `emitEvent(event)` — fires events through the webhooks event bus
- `getConfig(key)` — reads environment variables
- `db` — Drizzle database client
- `logger` — Pino structured logger

Plugins with `requiredEnv` set are skipped with a warning if any required environment variable is absent. The store plugin requires `STRIPE_SECRET_KEY`. The advisor plugin requires `GEMINI_API_KEY`. The photos plugin auto-detects from GCS, Azure, or S3 credentials. Skipped plugins do not block startup — the rest of the system initializes normally.

The plugin manifest is returned to the admin SPA at login, describing all loaded plugins with their nav sections, admin routes, and registered block types. This is how the admin sidebar, block picker, and routing are all dynamically assembled.

### 3.5 API-First Design Philosophy

Every feature in Sigil has a corresponding REST endpoint. Every read operation also has a GraphQL query. This is intentional: the same API surface that the admin panel uses is available to external consumers — Next.js frontends, Astro sites, AI agents, CI/CD pipelines, and automated content workflows.

The REST API is versioned under `/api/v1/`. The GraphQL endpoint lives at `/graphql`. Public (unauthenticated) endpoints live under `/api/v1/public/`. Authentication uses Bearer JWT tokens. All admin endpoints require a valid JWT, which carries the tenant ID and user role.

### 3.6 Authentication and RBAC

Authentication is JWT-based. Tokens are signed with a configurable `JWT_SECRET` and carry the user ID, tenant ID, and role. The `authenticate` middleware validates the token on every request. The `tenantContext` middleware resolves the full tenant record and attaches it to `req.tenant`.

Role enforcement uses the `requireRole(...roles)` middleware factory:

- `admin` — full access to all operations
- `editor` — create, read, update on pages, blocks, media, themes
- `author` — create and edit own content; cannot publish
- `viewer` — read-only access

Per-site permissions override the default role. A user with role `editor` and `sitePermissions: { "site-a-id": ["viewer"] }` has read-only access to site A but editor access to all other sites in the tenant.

---

## 4. Core Features

### 4.1 Content Management

#### Sites, Pages, and Blocks

Sigil's content model is hierarchical. A tenant has sites. A site has pages. A page has blocks.

**Sites** are the top-level content containers. Each site has its own domain, theme, media library, user permissions, and plugin data. A site can have a custom domain (`domain` field) verified via the API. Site settings store favicon, logo (with dark mode variant), social links, analytics IDs, and SEO configuration.

**Pages** support a full hierarchy with `parentId` self-reference. The `fullPath` field stores the computed URL path (e.g., `/docs/getting-started/installation`) and is indexed for fast slug resolution. Pages carry status: `draft`, `published`, `scheduled`, or `archived`. Each page has SEO fields built in: `metaTitle` (database-enforced max 60 characters), `metaDescription` (database-enforced max 160 characters), and `ogImageUrl`. Slug format is database-enforced as `^[a-z0-9-]+$`. Page templates are constrained to `default`, `landing`, `blog`, `product`, `contact`, or `artist`.

**Content Blocks** are the fundamental content unit. Every block has:
- `blockType` — identifies which of the 23 built-in block types (or plugin-registered types) this block uses
- `content` — a JSONB object whose structure depends on the block type
- `settings` — layout settings (padding, margin, background, width, animation, customClass)
- `sortOrder` — position within the page (reorderable via API)
- `isVisible` — soft-hide a block without deleting it

Blocks can be reordered, duplicated, hidden/shown, and bulk-deleted via the API. Block templates (saved presets) are stored in `cms_block_templates` and can be marked `isGlobal` to share across all sites in a tenant.

#### The 23 Built-in Block Types

The block type catalog is defined in `apps/api/src/routes/block-types.ts` and categorized as layout, content, media, interactive, or artist:

| Category | Block Types |
|----------|-------------|
| **Layout** | Hero, Call to Action, Bento Grid |
| **Content** | Text, Rich Text, Feature Grid, Pricing Table, Testimonials, FAQ, Stats Bar, Timeline, Code Block, Custom HTML |
| **Media** | Image, Video, Gallery |
| **Interactive** | Contact Form, Newsletter |
| **Artist** | Embed Player, Release List, Event List, Social Links, Link Tree, Artist Bio |

Each block type ships with default content that the editor can override. For example, the Hero block defaults to a centered layout with placeholder headline and CTA. The Code Block defaults to empty HTML/CSS/JS fields. The Gallery defaults to a 3-column grid layout.

Block types registered by plugins (such as `product_grid`, `buy_button`, `booking_calendar`, `resonance_insights`, `doc_callout`, `doc_code`) are added to the registry at startup via `ctx.addBlockTypes()` and appear in the block picker alongside the built-in types.

#### Media Library

The media library (`cms_media`) supports:
- Single and bulk upload (up to 20 files, 50MB per file)
- MIME type filtering and folder organization
- Dimension metadata for images (width, height)
- Duration metadata for audio/video
- Thumbnail URL for image previews
- Alt text and caption fields

Multi-provider storage is supported via the photos plugin (GCS, Azure Blob Storage, AWS S3 — auto-detected from environment variables). The core media library routes handle direct file upload and metadata management; the storage backend is injected via the plugin.

#### Content Versioning and Revision History

Every time a page is saved, a revision is created in `cms_page_revisions`. Each revision stores:
- Incremented version number
- Full snapshot of the title and slug at that version
- Full snapshot of all content blocks as a JSONB array (`contentSnapshot`)
- Settings snapshot
- Author (`changedBy`) and optional change note

Revisions are unlimited (no 90-day window, no paid tier required). The `revertToRevision` endpoint restores a page to any previous state. This provides a complete audit trail of every content change.

#### Internationalization and Localization

Sigil supports 15 languages via a page-clone model. Each page has a `language` field. Creating a translation clones the page structure and blocks to a new page record with a different language code. The unique constraint on `(siteId, slug, language)` ensures no two pages with the same slug can have the same language. The public API returns the appropriate language version based on the `lang` query parameter or the `Accept-Language` header.

The admin panel ships a 15-language selector for creating translations. The `cms_sites` table stores `defaultLanguage` for fallback resolution.

#### Content Scheduling

Content scheduling is built into the page model via `publishAt` and `unpublishAt` timestamp fields. The scheduling daemon (`apps/api/src/lib/scheduler.ts`) runs as a background interval inside the API server, checking every 60 seconds (configurable via `intervalMs`) for pages that need status transitions:

- Pages where `publishAt <= now()` and `status = 'scheduled'` are transitioned to `published`
- Pages where `unpublishAt <= now()` and `status = 'published'` are transitioned to `archived`

The daemon can also be invoked as a standalone one-shot call (`runSchedulerOnce()`), enabling external cron orchestration. Both publish and unpublish events are logged with structured Pino output.

### 4.2 Design Playground

The Design Playground is Sigil's most visually distinctive feature and, based on competitive analysis, a capability that no other headless CMS ships.

The theme system stores design tokens as a structured JSONB object in `cms_themes`:

```typescript
tokens: {
  colors: Record<string, string>;       // 1,400+ CSS variables
  typography: Record<string, string | number>;
  spacing?: Record<string, string>;
  effects?: Record<string, string>;
}
```

**What the Design Playground provides:**

- **1,400+ CSS theme variables**: A comprehensive design system covering colors, typography, spacing, border radius, shadows, and effects. Variables map directly to CSS custom properties (`--primary`, `--background`, `--card-foreground`, etc.) consumed by the Shadcn/Radix component library in the admin panel.
- **Color controls**: Visual color pickers for every named token, with real-time preview.
- **Typography controls**: Font family selectors, size scales, line height, letter spacing. 70+ Google Fonts available via the font browser.
- **Spacing and effects tabs**: Border radius, shadow depth, backdrop blur — all controllable without CSS knowledge.
- **7 preset themes**: `netrun-dark`, `netrun-light`, `kog`, `intirkon`, `minimal`, `frost`, `custom`. Presets provide a starting point that designers can modify.
- **Live dark/light mode preview**: Toggle between color modes to verify contrast and legibility.
- **Custom CSS**: Advanced users can inject arbitrary CSS that renders after the token-generated variables.
- **Theme duplication**: Clone any theme as a starting point for a new variant.
- **Multiple themes per site**: Create and save multiple theme variants; activate any one with a single API call.

The separation between token-based customization and custom CSS means non-technical designers can control 90% of the visual design through the Design Playground UI, while developers retain the ability to handle edge cases via raw CSS.

### 4.3 AI Design Generation

AI design generation is Sigil's most novel capability and the one with the highest technical differentiation. It consists of two integrated systems: Google Stitch for visual design generation and Charlotte AI for contextual design advice.

#### Google Stitch Integration

Google Stitch is a generative design API that produces web page HTML from a text prompt. Sigil's `StitchService` (`apps/api/src/services/stitch.ts`) wraps the Stitch API with these capabilities:

**`generateScreen(prompt, deviceType)`**: Takes a free-text description and a device target (`DESKTOP`, `MOBILE`, `TABLET`) and returns a rendered HTML mockup. Example: `"A dark-themed landing page for a jazz musician with a hero section and upcoming shows list"` → full HTML with inline styles.

**`editScreen(screenId, prompt)`**: Iteratively edits an existing screen. Example: after generating the initial design, a follow-up prompt of `"Make the hero section more minimal, remove the background gradient"` modifies the existing screen in place.

**`generateVariants(screenId, count)`**: Generates design alternatives from an existing screen. Pass `count: 3` to get three variations on the same design. Used for A/B testing exploration.

**`getScreenCode(screenId)`**: Retrieves the HTML source of a specific screen. Used by the import pipeline.

When `STITCH_API_KEY` is not configured, the service falls back to a built-in mock that returns sample HTML. This means the full import and advisor workflow can be developed and tested without a Stitch API key.

#### Stitch-to-Blocks Converter

The generated HTML is not just displayed as a preview — it is parsed and converted into structured Sigil content blocks by `services/stitch-converter.ts`. The converter analyzes the HTML structure and maps sections to block types:

- A `<section>` with a large heading and a CTA button → `hero` block
- A grid of feature cards → `feature_grid` block
- A centered CTA section → `cta` block
- A text section → `text` block

The resulting blocks array is returned by the `/design/import` endpoint and can be directly added to any page. The design goes from text prompt to editable content blocks without any manual data entry.

#### Design AI REST Endpoints

Five endpoints are defined in `apps/api/src/routes/design-ai.ts`, all under `/api/v1/sites/:siteId/design/`:

| Method | Path | Role Required | Description |
|--------|------|---------------|-------------|
| `POST` | `/generate` | admin, editor | Generate a new screen from a text prompt |
| `POST` | `/edit` | admin, editor | Edit an existing screen with a follow-up prompt |
| `POST` | `/variants` | admin, editor | Generate design variants from an existing screen |
| `POST` | `/import` | admin, editor | Convert a screen to Sigil blocks and add to a page |
| `POST` | `/advisor` | admin, editor, author | Ask Charlotte for design advice with optional preview generation |

All endpoints are API-first. They are the same endpoints the admin panel uses, meaning an AI agent can programmatically generate a design, iterate on it, and import it to a page without any human interaction.

#### Charlotte AI Design Advisor

The `DesignAdvisorService` (`apps/api/src/services/design-advisor.ts`) provides context-aware design advice via Gemini 2.0 Flash. The advisor receives:
- A free-text question from the user
- Optional context: the current page's block list, the active theme tokens (colors, typography), and the site name

Charlotte's system prompt instructs it to give specific, actionable advice — referencing exact color hex values, naming specific Sigil block types, citing WCAG contrast ratios, and suggesting concrete improvements rather than abstract guidance.

When a user asks for something visual ("show me what a minimal hero would look like"), the advisor sets `generatePreview: true` in its response, triggering an automatic Stitch screen generation. The API response includes both the text advice and a preview URL. For questions that do not require a visual, only the text response is returned — no unnecessary Stitch calls.

Charlotte's advice is grounded in the actual theme tokens and block structure of the current site. It is not a generic design chatbot. It knows what colors the site is using, what blocks are on the current page, and what block types are available to choose from.

### 4.4 Live Preview

The Live Preview panel (`apps/admin/src/components/LivePreviewPanel.tsx`) embeds the published frontend site in an iframe within the admin panel, scaled to match the selected viewport. Three viewing modes are available:

- **Edit** — editor panel only, no preview
- **Split** — side-by-side editor and preview (`Columns2` icon in toolbar)
- **Preview** — full-width preview

Three viewport presets are available:

| Viewport | Width |
|----------|-------|
| Desktop | 1,280px |
| Tablet | 768px |
| Mobile | 375px |

The iframe is scaled down proportionally when the viewport width exceeds the available panel width (e.g., desktop at 1,280px scaled to fit a 640px panel renders at 0.5x scale using CSS transform). A `ResizeObserver` watches the panel width and updates the scale factor continuously.

The panel connects to the frontend site via the `VITE_PREVIEW_URL` environment variable. Frontend projects using `@sigil-cms/next` wrap their layout in `<SigilPreviewProvider>`, which handles the `postMessage` protocol for real-time content updates. When the editor modifies a block and saves, the change propagates to the iframe without a full page reload.

---

## 5. Plugin Ecosystem

Sigil ships 19 first-party plugins. Each plugin registers its database tables, API routes, block types, admin navigation sections, and admin UI components at startup via the `CmsPlugin` interface. Plugins are composable — a music artist site might activate `artist`, `store`, `mailing-list`, `booking`, and `resonance`. A documentation portal might activate `docs`, `seo`, and `webhooks`.

### Core Infrastructure Plugins

**`seo` — SEO, Sitemap, and RSS**

No required environment variables. No admin UI. Generates `sitemap.xml` and RSS feeds from published pages. Mounted as public routes under `/api/v1/public/sites/:siteSlug/`. Zero configuration required — activate the plugin and the routes are available.

**`contact` — Contact Form Submissions**

Provides public form submission endpoint (`POST /api/v1/public/contact/:siteSlug`) and admin management UI for reviewing, responding to, archiving, and categorizing submissions. Four inquiry types: `general`, `booking`, `press`, `collaboration`. Five status values: `new`, `responded`, `booked`, `declined`, `archived`. Contact form block (`contact_form`) registered for visual editor.

**`docs` — Documentation and Knowledge Base**

A complete documentation portal system with hierarchical categories (nested via `parent_id`), articles linked to CMS pages, article revisions with change notes, reader feedback ("Was this helpful?" with comment capture), full-text search, pinned/featured article flags, and view count tracking. Admin routes for article editor, category management, feedback list, and revision history. Two block types: `doc_callout`, `doc_code`.

**`webhooks` — Webhook Delivery and Event Bus**

An in-memory event bus that delivers events to configured HTTP endpoints. Stores endpoint configurations in `cms_webhook_endpoints` (URL, event filter array, secret, active flag, fail count, last delivery timestamp) and delivery logs in `cms_webhook_deliveries` (status, HTTP response code, response body, attempt count, next retry timestamp). Other plugins emit events via `ctx.emitEvent()` and the webhooks plugin routes them to all matching configured endpoints. Dead-letter tracking via `fail_count` and `next_retry_at` for automatic retry scheduling.

**`migrate` — Site Migration from WordPress, Shopify, Square Online**

Provides content extraction, block mapping, media download, SEO field preservation, and navigation import from three source platforms. Migration jobs are tracked in `cms_migrations` (status, source URL, progress counters, log array) with per-item detail in `cms_migration_items`. The admin dashboard shows live migration progress. This is the path for prospects currently on WordPress or Shopify — not a script to run once, but an integrated migration tool with full visibility.

### Creative and Vertical Plugins

**`artist` — Music Artist Content Management**

The largest plugin. Provides full CRUD for releases (singles, albums, EPs, mixtapes), events (shows, festivals, livestreams), and artist profiles (bio, photo, genres, social links, booking/management emails). Stream links stored as a flexible JSONB map (Spotify, Apple Music, SoundCloud, Bandcamp, YouTube). Six block types: `embed_player`, `release_list`, `event_list`, `social_links`, `link_tree`, `artist_bio`. Public endpoints for all artist data (no auth required for frontend consumption). Platform-specific embed constraints enforced at the database layer.

**`photos` — Multi-Provider Photo Curator with AI Tagging**

Supports Google Cloud Storage (GCS), Azure Blob Storage, and AWS S3 — auto-detected from environment variables. No required env vars; the plugin skips gracefully if no storage credentials are found. Optionally uses `GEMINI_API_KEY` for AI photo curation (auto-tagging, description generation, quality scoring). Admin UI: Photo Curator panel. Version 2.0 of the plugin.

**`resonance` — Block-Level Content Analytics**

Resonance measures engagement at the individual content block level, not just per page. This is a meaningful distinction: knowing that a page has a high bounce rate tells you something; knowing that users consistently scroll past the pricing table block without clicking but spend 8 seconds on the feature grid tells you more.

**Four tables:**

- `cms_resonance_events` — raw engagement events (viewport time, scroll depth, clicks, session hash). Events are beacon-submitted from the frontend.
- `cms_resonance_scores` — pre-computed composite scores per block per time period (impressions, unique sessions, avg viewport time, avg scroll depth, click count, bounce point count, resonance score 0-100). Unique constraint on `(siteId, blockId, period, periodStart)`.
- `cms_resonance_experiments` — A/B experiments between two block variants (original vs. variant, traffic split, min sessions, winner, winner lift percentage).
- `cms_resonance_suggestions` — AI-generated improvement suggestions per block (powered by Gemini), with priority, category, and status tracking.

Admin UI: Resonance analytics dashboard and Experiments management. One block type registered: `resonance_insights` (embeds an analytics summary widget directly in a page).

### Commerce Plugins

**`store` — Stripe E-Commerce**

Full Stripe product catalog and checkout flow. Products stored in `cms_products` with Stripe product ID and price ID references. Orders tracked in `cms_orders` with Stripe session ID, payment intent ID, customer details, line items (JSONB), and status. Webhook handler for Stripe event processing. Public endpoints for product listings and checkout initiation. Two block types: `product_grid`, `buy_button`. Requires `STRIPE_SECRET_KEY`.

**`printful` — Print-on-Demand via Printful**

Integration with Printful for print-on-demand merchandise. Enables artists, creators, and service businesses to sell physical products (t-shirts, prints, posters) without managing inventory. Complements the store plugin for physical goods.

**`paypal` — PayPal Payments**

PayPal checkout integration as an alternative to Stripe. Enables sites to accept PayPal, Venmo, and credit cards via the PayPal gateway.

**`booking` — Appointment Scheduling**

A complete appointment booking system for service businesses. Services configured with duration, price, buffer time, advance notice requirements, and maximum advance booking window. Availability rules defined per service and day of week with timezone support. Appointments have a confirmation/cancellation token system — customers receive unique URLs for self-service confirmation and cancellation. Google Calendar integration stores `google_event_id` per appointment. Azure Communication Services (ACS) for email confirmations (optional — degrades gracefully). Status workflow: `pending`, `confirmed`, `cancelled`, `completed`, `no_show`. Two block types: `booking_calendar`, `service_list`.

### Communication Plugins

**`mailing-list` — GDPR-Compliant Subscriber Management**

Subscribe/unsubscribe with one-click unsubscribe tokens (UUID, auto-generated per subscriber). CAN-SPAM and GDPR compliant — no re-subscribe without explicit consent, tokenized unsubscribe links that do not require authentication. Public subscribe endpoint scoped by site slug. Admin management of subscriber list. ACS (Azure Communication Services) for broadcast sends, degrades gracefully when not configured.

**`advisor` — Charlotte AI Advisor with pgvector RAG**

An embedded AI knowledge assistant powered by Gemini and pgvector. Provides three capabilities:
1. Streaming chat with session history (sessions stored in `ncms_advisor_sessions`)
2. Document ingestion — upload PDFs, text files, or URLs to a `rag_documents` table, chunked and embedded into `rag_chunks` (768-dimensional vectors via pgvector extension)
3. Text-to-speech (TTS) for spoken AI responses

The advisor is global (not site-scoped) and available to all authenticated users. Requires `GEMINI_API_KEY`. The pgvector tables are created via `runMigration()` at startup, including `CREATE EXTENSION IF NOT EXISTS vector`.

### Integration Plugins

**`kamera` — Survai 3D Scan Integration**

Netrun Systems integration. Connects Sigil sites to the Survai smart site scanner pipeline (3D scan → MEP planning → web visualization). Enables construction and architecture firms using Survai to publish scan results to their Sigil-powered websites.

**`kog` — K0DE Platform Integration**

Netrun Systems integration. Connects Sigil to the K0DE by Wilbur AI development platform. Enables K0DE customer project sites to be managed via Sigil.

**`intirkast` — Intirkast Streaming Integration**

Netrun Systems integration. Connects Sigil sites to the Intirkast broadcasting platform for embedding live and recorded streaming content.

**`charlotte` — Charlotte AI Assistant Widget**

Integrates the Charlotte voice assistant (Netrun's primary AI product) as an embeddable chat widget on any Sigil site. Provides a widget snippet generator and a client library for communicating with the Charlotte backend.

**`support` — Support Panel Widget**

Embeds a support panel widget for customer support workflows.

### Building a Custom Plugin

The `CmsPlugin` interface is the complete contract. A minimal plugin:

```typescript
import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { Router } from 'express';

const myPlugin: CmsPlugin = {
  id: 'my-feature',
  name: 'My Feature',
  version: '1.0.0',
  requiredEnv: ['MY_API_KEY'],

  async register(ctx) {
    // Create your tables
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS my_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
        data JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Add authenticated routes
    const router = Router({ mergeParams: true });
    router.get('/', async (req, res) => {
      const records = await ctx.db.select()...;
      res.json({ success: true, data: records });
    });
    ctx.addRoutes('my-feature', router);

    // Add block types to the visual editor
    ctx.addBlockTypes([
      { type: 'my_widget', label: 'My Widget', category: 'content' }
    ]);

    // Add to admin sidebar
    ctx.addAdminNav({
      title: 'My Feature',
      siteScoped: true,
      items: [{ label: 'Records', icon: 'Database', href: 'my-feature' }],
    });
  },
};

export default myPlugin;
```

Register the plugin in `plugins.config.ts` and it is available on the next startup.

---

## 6. Developer Experience

### 6.1 TypeScript SDK (`@sigil-cms/client`)

The `@sigil-cms/client` package provides a zero-dependency TypeScript SDK that works in Node.js 18+, browsers, and edge runtimes (Cloudflare Workers, Vercel Edge, Deno).

```bash
npm install @sigil-cms/client
```

The client is initialized with a base URL and optionally a site slug (for public operations) or an API key (for authenticated operations):

```typescript
import { createClient } from '@sigil-cms/client';

// Public client — no auth required, read-only
const client = createClient({
  baseUrl: 'https://cms.example.com',
  siteSlug: 'my-site',
});

// Admin client — authenticated, full CRUD
const admin = createClient({
  baseUrl: 'https://cms.example.com',
  siteId: '550e8400-e29b-41d4-a716-446655440000',
  apiKey: process.env.SIGIL_API_KEY,
});
```

**Public operations (no authentication):**

```typescript
const page = await client.pages.getBySlug('about');          // Page by slug
const pages = await client.pages.listPublished();            // All published pages
const tree = await client.pages.getTree();                   // Navigation tree
const theme = await client.sites.getPublicTheme();           // Active theme tokens
const langs = await client.sites.getLanguages();             // Available locales
const site = await client.sites.getByDomain('example.com'); // Domain resolution
const results = await client.search('pricing');              // Full-text search
```

**Authenticated operations:**

```typescript
// Pages
await admin.pages.list({ status: 'draft' });
await admin.pages.create({ title: 'New Page', slug: 'new-page' });
await admin.pages.update(pageId, { status: 'published' });
await admin.pages.delete(pageId);

// Blocks
await admin.blocks.list(pageId);
await admin.blocks.create(pageId, { blockType: 'hero', content: { headline: 'Welcome' } });
await admin.blocks.reorder(pageId, [blockId1, blockId2, blockId3]);

// Media
await admin.media.list({ mimeType: 'image' });
await admin.media.listFolders();

// Themes
await admin.themes.list();
await admin.themes.getActive();
await admin.themes.activate(themeId);
await admin.themes.duplicate(themeId, 'My Theme Copy');

// Sites
await admin.sites.list();
await admin.sites.updateDomain(siteId, 'custom.example.com');
await admin.sites.verifyDomain(siteId);

// Translations
await admin.pages.listTranslations(pageId);
await admin.pages.createTranslation(pageId, 'es');

// Revisions
await admin.pages.listRevisions(pageId);
await admin.pages.revertToRevision(pageId, revisionId);

// Block type catalog
await admin.blocks.listTypes({ category: 'content' });
```

List endpoints return a typed `PaginatedResponse`:

```typescript
const result = await client.pages.list({ page: 1, limit: 10 });
// result.data       — Page[]
// result.total      — number
// result.page       — number
// result.pageSize   — number
// result.hasMore    — boolean
```

Errors are typed and introspectable:

```typescript
import { SigilError, SigilNetworkError, SigilTimeoutError } from '@sigil-cms/client';

try {
  const page = await client.pages.getBySlug('nonexistent');
} catch (err) {
  if (err instanceof SigilError) {
    console.log(err.status);        // 404
    console.log(err.code);          // 'NOT_FOUND'
    console.log(err.isNotFound);    // true
    console.log(err.isServerError); // false
  }
}
```

### 6.2 CLI (`sigil-cms`)

The CLI provides 7 commands for scaffolding, development, building, and database management:

```bash
npm install -g sigil-cms
# or
npx sigil-cms create my-site
```

| Command | Description |
|---------|-------------|
| `sigil create <name>` | Scaffold a new project. Creates `package.json`, `sigil.config.ts`, `.env.example`, `tsconfig.json`, and directory structure. Options: `--template <name>`, `--no-git`. |
| `sigil dev` | Start dev server with hot reload. Options: `-p, --port`, `-H, --host`. |
| `sigil build` | Build for production. Compiles TypeScript to `./dist/`. |
| `sigil start` | Start production server. Requires `sigil build`. Options: `-p, --port`. |
| `sigil migrate` | Run database migrations via Drizzle Kit. Sub-commands: `--generate`, `--push` (dev only), `--status`. |
| `sigil seed` | Seed the database with demo content. Options: `--reset`. |
| `sigil info` | Show environment info: Node.js version, installed Sigil packages, config file status, DB connection. |

**Deploy templates** available via `sigil create --template <name>`:

| Template | Platform | Monthly Cost |
|----------|----------|-------------|
| `local` | Local VM / NUC / Raspberry Pi | $0 |
| `gcp` | Google Cloud Run (scale-to-zero) | ~$0-5 |
| `aws` | AWS Fargate (scale-to-zero) | ~$3-8 |
| `azure` | Azure Container Apps | ~$5-10 |
| `fly` | Fly.io | ~$3-5 |
| `railway` | Railway | ~$5 |
| `digitalocean` | DigitalOcean App Platform | ~$5-12 |
| `docker` | Docker Compose (any VPS) | ~$5-10 |
| `coolify` | Coolify / Dokku (self-managed PaaS) | $0 + VPS cost |

### 6.3 GraphQL API

The GraphQL endpoint at `/graphql` exposes a read-focused API for headless consumers. The schema is SDL-first, defined in `apps/api/src/graphql/schema.ts` with two custom scalars (`DateTime` as ISO 8601, `JSON` for arbitrary objects).

**14 queries:**

| Query | Auth | Description |
|-------|------|-------------|
| `sites(status, page, limit)` | Required | List all sites for the authenticated tenant |
| `site(id)` | Required | Get a single site by ID |
| `pages(siteId, status, parentId, language, page, limit)` | Required | List pages with filtering (returns `PaginatedPages`) |
| `page(siteId, id)` | Required | Get a single page by ID |
| `blocks(siteId, pageId)` | Required | List content blocks for a page |
| `media(siteId, folder, mimeType, search, page, limit)` | Required | List media with search (returns `PaginatedMedia`) |
| `themes(siteId)` | Required | List all themes for a site |
| `activeTheme(siteId)` | Required | Get the active theme |
| `revisions(siteId, pageId)` | Required | List page revision history |
| `pageBySlug(siteSlug, pageSlug, lang)` | None | Get published page by site + page slug (public) |
| `pageTree(siteSlug)` | None | Get page navigation tree (public) |
| `publicTheme(siteSlug)` | None | Get active theme for a site (public) |
| `siteByDomain(domain)` | None | Resolve a site by its custom domain (public) |

Mutations are handled by the REST API. The GraphQL endpoint is read-only by design — this makes it safe to expose publicly for frontend consumption without authentication on public queries.

Example query for rendering a page in a Next.js app:

```graphql
query GetPage($siteSlug: String!, $slug: String!) {
  pageBySlug(siteSlug: $siteSlug, pageSlug: $slug) {
    id
    title
    metaTitle
    metaDescription
    ogImageUrl
    blocks {
      id
      blockType
      content
      settings
      sortOrder
      isVisible
    }
  }
  publicTheme(siteSlug: $siteSlug) {
    tokens
  }
}
```

### 6.4 Next.js App Router Integration (`@sigil-cms/next`)

The `@sigil-cms/next` package provides native Next.js App Router integration. It requires Next.js 14+ with App Router, React 18+, and `@sigil-cms/client`.

```bash
npm install @sigil-cms/next @sigil-cms/client
```

**Minimal integration — 1 file:**

```tsx
// app/[[...slug]]/page.tsx
import { SigilPage, generateSigilMetadata, generateSigilStaticParams } from '@sigil-cms/next';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return generateSigilMetadata(slug?.join('/') ?? 'home');
}

export async function generateStaticParams() {
  return generateSigilStaticParams();
}

export default async function Page({ params }) {
  const { slug } = await params;
  return <SigilPage slug={slug?.join('/') ?? 'home'} />;
}
```

That is the complete integration. Every page published in Sigil is rendered at its slug. SEO metadata is generated automatically from the page's `metaTitle`, `metaDescription`, and `ogImageUrl` fields.

**Block customization** — override any block type with your own React component:

```tsx
function MyHero({ block, content }: BlockComponentProps) {
  return (
    <div className="my-hero">
      <h1>{content.heading as string}</h1>
      <p>{content.subheading as string}</p>
    </div>
  );
}

<SigilPage slug="home" components={{ hero: MyHero }} />
```

**Static generation and ISR:**

```tsx
// Full static generation at build time
export async function generateStaticParams() {
  return generateSigilStaticParams({ templates: ['landing', 'blog'] });
}

// ISR — revalidate every 60 seconds
export const revalidate = 60;

// On-demand revalidation via webhook
// app/api/revalidate/route.ts
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  const { slug, secret } = await request.json();
  if (secret !== process.env.REVALIDATION_SECRET) return NextResponse.json({}, { status: 401 });
  revalidatePath(`/${slug}`);
  return NextResponse.json({ revalidated: true });
}
```

**Default block components** ship for 9 core block types: `hero` (`HeroBlock`), `text` (`TextBlock`), `rich_text` (`TextBlock`), `image` (`ImageBlock`), `gallery` (`GalleryBlock`), `cta` (`CTABlock`), `video` (`VideoBlock`), `code_block` (`CodeBlock`), `feature_grid` (`FeatureGridBlock`). All components use BEM-style CSS classes prefixed with `sigil-` for easy overriding.

**`SigilImage`** wraps `next/image` for optimized image rendering from media items:

```tsx
import { SigilImage } from '@sigil-cms/next';
<SigilImage media={heroImage} width={1200} height={630} priority />
```

**Environment variables:**

| Variable | Required | Description |
|----------|----------|-------------|
| `SIGIL_URL` | Yes | Base URL of your Sigil instance |
| `SIGIL_SITE_SLUG` | One of these | Site slug for public fetching |
| `SIGIL_SITE_ID` | One of these | Site UUID for admin operations |
| `SIGIL_API_KEY` | No | JWT for admin operations |

### 6.5 Live Preview Protocol

Frontend projects integrate with the admin panel's live preview via `<SigilPreviewProvider>`. The provider listens for `postMessage` events from the admin panel's iframe and applies content changes in real time. Data attributes `data-block-id` and `data-block-type` are added to every rendered block, enabling the admin panel to correlate visual elements with their content records.

---

## 7. Deployment and Operations

### 7.1 Self-Hosted Deployment

Sigil self-hosting is free, unlimited, and permanent. The same codebase powers the cloud offering with no feature gates or license checks.

The `sigil create --template <name>` command generates a complete deployment-ready project for nine platforms. Each template includes the appropriate infrastructure configuration, environment variable template, and setup instructions.

**Recommended for most teams — Google Cloud Run (scale-to-zero):**

Cloud Run scales to zero when the admin panel is not in use. For most sites, the CMS admin is accessed sporadically — once to create content, occasionally to update it. Scale-to-zero means you pay nearly nothing when no one is logged in.

Estimated monthly cost breakdown:
- Cloud Run idle: ~$0.50/month
- Cloud Run active (admin sessions): ~$2-5/month
- Cloud SQL or Supabase PostgreSQL: ~$0-10/month (shared or small instance)
- Media storage (GCS/S3/Azure Blob): usage-based, pennies per GB
- **Total: ~$3-15/month** for a production deployment

**Docker Compose** is the simplest self-hosted path for teams with an existing VPS:

```yaml
services:
  api:
    image: your-registry/sigil-api:latest
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgresql://postgres:secret@db:5432/sigil
      JWT_SECRET: your-jwt-secret
      GEMINI_API_KEY: your-gemini-key  # optional
      STITCH_API_KEY: your-stitch-key  # optional
    depends_on: [db]

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: sigil
      POSTGRES_PASSWORD: secret
    volumes: [postgres_data:/var/lib/postgresql/data]
```

### 7.2 Health and Monitoring

The API exposes `/health` and `/ready` endpoints via `@netrun/health`. Structured Pino logging goes to stdout for ingestion by any log aggregator (Cloud Logging, Datadog, Papertrail). All requests are logged with correlation IDs from `@netrun/error-handling`.

The scheduling daemon logs every status transition at `info` level with page ID, title, and site ID. Failed scheduler cycles log at `error` with the full error message. This provides observability into the content automation pipeline without additional tooling.

### 7.3 Database Operations

```bash
sigil migrate              # Apply pending Drizzle migrations
sigil migrate --generate   # Generate migration from schema change
sigil migrate --push       # Push schema directly (dev only — no migration file)
sigil migrate --status     # Show which migrations have been applied
```

Drizzle Studio (`pnpm db:studio`) provides a web-based database browser for inspecting and editing records during development.

Backups are handled at the PostgreSQL layer via `pg_dump`. For cloud deployments, managed PostgreSQL services (Cloud SQL, Supabase, Neon, Railway) provide automated backups.

---

## 8. Security and Compliance

### 8.1 Authentication

All write operations require a valid JWT. Tokens are signed with a configurable `JWT_SECRET` using the `jsonwebtoken` library. Token expiry is configurable. The `authenticate` middleware verifies the token signature, checks expiry, and rejects expired or malformed tokens with a `401 Unauthorized`. Tenant context is resolved from the token's tenant ID claim on every authenticated request.

Public endpoints (sitemap, RSS, page content, theme) require no authentication and are explicitly mounted under `/api/v1/public/` with no middleware applied.

### 8.2 Role-Based Access Control

Four roles enforce a least-privilege model:

| Role | Capabilities |
|------|-------------|
| `admin` | All operations on all resources within the tenant |
| `editor` | Create, read, update pages, blocks, media, themes; cannot delete sites or manage users |
| `author` | Create content, edit own content; cannot publish or access system settings |
| `viewer` | Read-only on all content resources |

Role enforcement is at the route level via `requireRole()` middleware. Per-site permission overrides allow granular cross-site access control within a tenant.

The design-ai advisor endpoint (`POST /design/advisor`) is accessible to `author` role — content creators can ask for design advice without needing editor permissions. Generation and import endpoints (`/generate`, `/edit`, `/variants`, `/import`) require `editor` or higher.

### 8.3 Multi-Tenancy Isolation

Tenant isolation is enforced at two layers:
1. **Application layer**: The `tenantContext` middleware injects the tenant ID from the authenticated JWT into every request. All database queries include `WHERE tenant_id = :tenantId`.
2. **Database layer**: PostgreSQL Row-Level Security (RLS) policies can be applied to the core tables for defense-in-depth. The schema is designed with RLS in mind — every tenant-scoped table has a `tenant_id` or `site_id` foreign key chain that resolves to a tenant.

### 8.4 Input Validation

All route handlers validate request bodies using Zod schemas generated from the Drizzle schema via `drizzle-zod`. Database-level check constraints provide a second validation layer:
- Page slugs: format enforced at DB (`^[a-z0-9-]+$`)
- Meta titles: max 60 characters enforced at DB
- Meta descriptions: max 160 characters enforced at DB
- User emails: format enforced at DB
- Role values: enum constraint at DB
- Media file sizes: positive integer enforced at DB
- Page status, block types, theme names: all enum-constrained at DB

### 8.5 Network Security

`@netrun/security-middleware` applies:
- **Helmet**: Sets standard HTTP security headers (X-Frame-Options, Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, etc.)
- **CORS**: Configured per environment with origin allow-list
- **Rate limiting**: Per-IP rate limiting on auth and write endpoints
- **CSRF protection**: HMAC double-submit cookie pattern for state-mutating requests from browser clients

### 8.6 GDPR Compliance

The mailing-list plugin provides GDPR-compliant subscriber management:
- Opt-in only (no pre-checked boxes)
- One-click unsubscribe via UUID token (no authentication required to unsubscribe)
- `unsubscribeToken` indexed for O(1) lookup — unsubscribe links never require a login
- `unsubscribedAt` timestamp preserved for audit compliance
- `status` constraint: only `active` or `unsubscribed` — no soft-deletes that hide unsubscribed state

### 8.7 Audit Trail

Page revision history provides a complete audit trail for content changes:
- Every save creates a versioned snapshot with author and timestamp
- Revisions cannot be deleted (cascade delete only on page deletion)
- `changedBy` and `changeNote` fields support human-readable audit annotations

Webhook delivery logs (`cms_webhook_deliveries`) provide an audit trail for all outbound integrations: payload, HTTP status, response body, attempt count.

---

## 9. Competitive Analysis

### 9.1 Sigil vs. Sanity

Sanity is cloud-only, per-seat priced, and built on a proprietary content store. It is the right choice for large teams that want zero infrastructure management and are comfortable with vendor lock-in. It is the wrong choice for anyone who needs to self-host, manage multiple client organizations affordably, or avoid per-seat costs.

**Key comparisons:**

| Dimension | Sigil | Sanity |
|-----------|-------|--------|
| Self-hosting | Yes, free, unlimited | No — cloud only |
| Pricing (10 users) | $29/mo (Team, 5 sites) | $150/mo ($15/seat/mo) |
| Multi-tenancy | Native, RLS-backed | Projects (separate billing per project) |
| Design editor | Design Playground (1,400+ CSS vars, 70+ fonts) | No |
| Block analytics | Resonance (block-level engagement, A/B) | No |
| AI design generation | Yes (Stitch + Charlotte) | AI Assist (text content only) |
| Content versioning | Unlimited, all plans | 90 days (Growth), 365 days (Enterprise) |
| SSO | Roadmap | $1,399/mo add-on on Growth, included in Enterprise |
| Open-source content store | Yes | No (Content Lake is proprietary) |

**When to choose Sanity over Sigil**: Real-time multiplayer editing, GROQ query language, Sanity's plugin ecosystem, or when zero infrastructure management is a hard requirement.

### 9.2 Sigil vs. Strapi

Strapi is the closest architectural peer: open-source, self-hosted, TypeScript, PostgreSQL-capable. The fundamental difference is that Strapi is a general-purpose content API builder while Sigil is an opinionated CMS product with vertical-specific capabilities built in.

**Key comparisons:**

| Dimension | Sigil | Strapi |
|-----------|-------|--------|
| Multi-tenancy | Native | No (requires separate deployments per client) |
| Design editor | Design Playground | No |
| Block analytics | Resonance (unique) | No |
| Vertical plugins | 19 first-party (booking, artist, e-commerce, docs) | Marketplace (150+ community, variable quality) |
| Content scheduling | Yes (daemon in API) | Yes (built-in) |
| AI advisor | Yes (Gemini RAG, TTS, streaming chat) | Strapi AI (schema generation from prompts only) |
| Migration tooling | WordPress, Shopify, Square Online (first-party) | DITS (transfer format, not a crawler) |
| Cloud pricing (5 sites, 10 users) | $29/mo (Team) | ~$75/mo (Pro Cloud, 2 projects max) |

**When to choose Strapi over Sigil**: A 65,000-star GitHub community, the Strapi Marketplace, a GUI content type builder (no code required to define schemas), or existing Strapi expertise on the team.

### 9.3 Sigil vs. Payload CMS

Payload is the most technically sophisticated self-hosted CMS and the most direct competitor. It was acquired by Figma in June 2025 and is growing rapidly (~40,800 GitHub stars as of early 2026).

The core strategic difference: **Payload is a platform for building your own CMS-driven application. Sigil is a vertical-specific CMS product.** This distinction drives every architectural decision in both systems.

**Payload's genuine advantages:**
- Embedded Next.js architecture (one deployment, Local API for zero-HTTP content fetching)
- Lexical rich text editor (Meta's Lexical, extensible, inline embeds, custom features)
- `payload generate:types` automatic TypeScript interface generation
- Jobs queue built in (deferred tasks, cron scheduling, workflows, retry)
- Field-level access control (read/write per field based on runtime logic)
- 40,800+ GitHub stars and active community
- Figma integration trajectory (design-to-CMS pipeline in development)

**Sigil's genuine advantages:**
- Native multi-tenancy (`cms_tenants`, RLS, per-site permissions) — agencies can manage unlimited client sites from one deployment
- Design Playground (1,400+ CSS variables, 70+ fonts, presets) — designers can work independently
- Resonance analytics (block-level engagement, A/B experiments, AI suggestions) — not available in Payload
- 19 vertical plugins (booking, artist, e-commerce with Stripe + Printful + PayPal, docs, AI advisor) vs. Payload's handful of official plugins
- WordPress/Shopify/Square Online migration tooling first-party
- Cloud pricing (10 seats, 5 sites at $29/mo) vs. Payload Cloud ($35/mo, 1 site, 3 users)

**When to choose Payload over Sigil**: Next.js-native deployments where the Local API matters, editorial use cases requiring Lexical-quality rich text, when code-first schema version control is a priority, or when you are building a complex application where Payload's extensibility depth matters more than Sigil's vertical-specific functionality.

### 9.4 Feature Comparison Matrix

| Feature | Sigil | Sanity | Strapi | Payload |
|---------|-------|--------|--------|---------|
| Self-hosted free | Yes | No | Yes | Yes |
| Native multi-tenancy | Yes | No | No | No |
| Visual design editor | Yes | No | No | No |
| Block-level analytics | Yes | No | No | No |
| AI design generation | Yes | No | No | No |
| Content versioning | Unlimited | 90d (paid) | Paid (Growth) | Yes |
| Content scheduling | Yes | Yes (paid) | Yes | Yes |
| GraphQL API | Yes (read) | GROQ | Yes | Yes |
| TypeScript SDK | Yes | Yes | No official | Yes (auto-gen) |
| CLI | Yes | Yes | Yes | Yes |
| Next.js integration | Yes | Yes | Yes | Native (embedded) |
| Migration tooling | WP, Shopify, Square | None built-in | DITS (transfer) | No |
| 19 vertical plugins | Yes | No | Marketplace | No |
| Booking / appointments | Yes | No | No | No |
| Music artist content | Yes | No | No | No |
| Mailing list (GDPR) | Yes | No | No | No |
| E-commerce (Stripe) | Yes | No | No | Unofficial |
| AI advisor (RAG) | Yes | AI Assist (text) | Schema gen only | No |
| SSO | Roadmap | Enterprise / $1,399/mo add-on | Enterprise | Enterprise |
| Real-time collab | No | Yes | No | Enterprise |
| Lexical rich text | No (roadmap) | Portable Text | TipTap (Strapi 5) | Yes |
| Jobs queue | No (roadmap) | No | No | Yes |

---

## 10. Pricing

### 10.1 Self-Hosted: Free Forever

Self-hosted Sigil is free, unlimited, and permanent. No user limits, no site limits, no content limits, no API call limits, no watermarking. The code is identical to what powers the cloud offering.

```bash
sigil create my-cms --template gcp  # Deploy to Google Cloud Run
sigil migrate                        # Initialize database
```

A production self-hosted deployment on Google Cloud Run (scale-to-zero) costs approximately $1-6/month including database.

### 10.2 Cloud-Hosted Plans

| Feature | Starter | Team | Business | Enterprise |
|---------|---------|------|----------|------------|
| **Price** | **Free** | **$29/mo** | **$79/mo** | **$249/mo** |
| **Seats** | 3 | 10 | 25 | Unlimited |
| **Sites** | 1 | 5 | 25 | Unlimited |
| **Content items** | 1,000 | 10,000 | 100,000 | Unlimited |
| **Media storage** | 1 GB | 10 GB | 100 GB | 1 TB |
| **API calls/mo** | 50K | 500K | 5M | Unlimited |
| **Custom domain** | No | Yes | Yes | Yes |
| **Plugins** | Core (8) | All (19) | All (19) | All + custom |
| **GraphQL** | Yes | Yes | Yes | Yes |
| **Content scheduling** | No | Yes | Yes | Yes |
| **Resonance analytics** | No | No | Yes | Yes |
| **Design Playground** | Basic | Full | Full | Full + white-label |
| **Multi-tenancy** | No | No | Yes | Yes |
| **SSO (SAML/OIDC)** | No | No | No | Yes |
| **Audit logs** | No | No | Yes | Yes |
| **SLA** | None | 99.5% | 99.9% | 99.95% |
| **Support** | Community | Email (48h) | Email (24h) | Dedicated (4h SLA) |

Annual billing: 2 months free (17% discount) on all paid plans.

Migration from self-hosted to cloud: `sigil migrate --to-cloud` exports your database and media, provisions your cloud instance, and imports everything. Takes approximately 10 minutes.

### 10.3 Why We Can Price This Way

Sigil runs on scale-to-zero Cloud Run. Monthly overhead per customer:
- Cloud Run (idle): ~$0.50
- Cloud Run (active admin sessions): ~$2-5
- PostgreSQL shared instance: ~$0.50 per site
- Media CDN: usage-based, pennies per GB
- **Total: ~$1-6/month per customer**

This is why $29/month for 10 seats and 5 sites is a real margin, not a loss leader. Compare: Sanity charges $150/month for 10 seats on a single project. Sigil charges $29/month for 10 seats across 5 sites.

We are not subsidizing growth with venture capital or free trials designed to convert. We built with radical efficiency — one engineer, 20 AI agents, zero wasteful infrastructure — and we pass those savings to customers.

---

## 11. Roadmap

### 11.1 Completed (Shipped in v1.0)

Every feature documented in this whitepaper exists in the codebase and is verifiable in source. The following were completed as part of the v1.0 build:

- Full multi-tenant architecture with RLS
- 23 core block types + plugin-registered block types
- 19 first-party plugins (all described in Section 5)
- Design Playground (1,400+ CSS variables, 70+ Google Fonts, 7 presets)
- TypeScript SDK (`@sigil-cms/client`) with 44+ typed methods
- CLI (`sigil-cms`) with 7 commands and 9 deploy templates
- GraphQL API (14 queries, public + authenticated)
- Next.js App Router integration (`@sigil-cms/next`)
- Live preview with viewport toggles and postMessage protocol
- Content scheduling daemon (publishAt / unpublishAt)
- Page revision history with unlimited revisions and revert
- Content migration from WordPress, Shopify, Square Online
- i18n (15 languages, page-clone model)
- AI design generation via Google Stitch (5 REST endpoints)
- Charlotte AI design advisor (Gemini 2.0 Flash, context-aware)
- Resonance analytics (block-level, A/B experiments, AI suggestions)
- Webhook delivery system with retry and delivery log

### 11.2 Near-Term (Next 90 Days)

- **SSO / OIDC**: SAML 2.0 and OpenID Connect for Enterprise tier. Third-party identity providers (Okta, Azure AD, Google Workspace).
- **Audit logs**: Structured audit trail for all content operations, stored and queryable via API.
- **Image transforms**: On-the-fly resizing, cropping, format conversion (WebP, AVIF) via Cloud Run or CDN.
- **Tiptap rich text field**: A full-featured rich text editor block that provides flowing prose with inline media, links, tables, and callouts. Addresses the long-form content gap identified in competitive analysis.
- **Jobs queue**: Background task processing for scheduled workflows, nightly analytics aggregation, email sequence scheduling, and AI tagging runs.
- **Field-level ACL**: Role-based control at the field level within blocks for enterprise content governance.

### 11.3 Vision: The AI-Native CMS

The long-term direction for Sigil is the API-first CMS where every feature is equally usable by a human editor and an AI agent.

The design AI integration is the first manifestation of this vision: text prompt → Stitch-generated mockup → blocks import is a fully automated workflow that requires no human clicks. An AI agent can call `POST /design/generate` with a prompt, then `POST /design/import` with the resulting screen ID and a page ID, and the page is populated with structured, editable content — programmatically, in one API call chain.

The same principle applies across the entire platform. An AI agent can publish a page, schedule its unpublish date, fire a webhook when it goes live, and track Resonance engagement metrics — all via documented REST or GraphQL endpoints that humans and machines share equally.

The CMS that wins the next decade will be the one that is as usable by the AI systems building and maintaining content as it is by the humans who author it.

---

## 12. About Netrun Systems

Netrun Systems is a California C Corp incorporated May 2025. Daniel Garza, Founder and CEO, has provided cloud infrastructure and DevSecOps consulting since 2001 — a 25-year track record serving enterprise clients in financial services, media, and public sector.

Sigil is one product in a portfolio of 25 interconnected projects developed under the Netrun Systems SDLC v2.3 governance framework. Netrun's development methodology is itself a proof of concept: one engineer, 20 specialized AI agents operating in parallel, building and maintaining a 25-project portfolio with the output velocity of a mid-size engineering team.

The AI agents are not copilots suggesting autocomplete. They are specialist engineers — a cloud architect, a security engineer, a solution architect, an AI/ML engineer, a UI/UX architect, a DevOps engineer — each operating in an isolated Git worktree on their own branch, coordinated by an orchestration layer that follows the SDLC v2.3 protocol. Code reviews, security audits, compliance checks, and retrospectives are automated. Human review gates are preserved for critical decisions.

This methodology has produced, in nine months:
- 25 active projects
- 7 sellable products (Sigil, Wilbur, Frost, Intirkon, K0DE, Survai, Intirkast)
- 2 open-source libraries
- 21 provisional patent applications via the Netrun Patent Suite

Sigil is offered as both a self-hosted open-source product and a managed cloud service. The open-source release is not a limited edition designed to funnel users to paid tiers — it is the full product, unlimited, with the expectation that some percentage of users will choose the convenience of managed hosting and the service levels of cloud support.

**Philosophy**: Technology should not be gatekept behind per-seat pricing, vendor lock-in, or artificial feature tiers. The best way to build a sustainable business is to give people the real product, compete on quality and support, and charge fair prices for the infrastructure work that customers do not want to do themselves.

**Contact**: Netrun Systems — [www.netrun.net](https://www.netrun.net)

---

_Last reviewed: 2026-03-21_

_Sigil CMS — WHITEPAPER v1.0 — Copyright 2026 Netrun Systems. All rights reserved._

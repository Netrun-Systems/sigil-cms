<div align="center">

# Sigil CMS

**The multi-tenant headless CMS built for agencies, developers, and the AI era.**

One deployment. Unlimited clients. Free forever.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/sigil-cms.svg)](https://www.npmjs.com/package/sigil-cms)
[![GitHub stars](https://img.shields.io/github/stars/Netrun-Systems/sigil-cms.svg)](https://github.com/Netrun-Systems/sigil-cms/stargazers)
[![Discord](https://img.shields.io/discord/sigil-cms?label=Discord)](https://discord.gg/sigil-cms)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## Why Sigil?

Every headless CMS forces agencies to choose between cloud lock-in (Sanity), plugin hell (Strapi), or running separate deployments per client. Sigil is the first headless CMS with **native multi-tenancy** -- one deployment serves unlimited client tenants with Row-Level Security at the database layer. No per-seat pricing traps, no separate instances per client, no vendor lock-in.

Ship client sites with a **Design Playground** (1,400+ CSS variables, 70+ Google Fonts), block-level **Resonance analytics**, **AI design generation** (describe a page, get editable blocks), and **19 built-in plugins** covering e-commerce, booking, docs, artist content, and more -- all from a single MIT-licensed codebase you own.

## Quick Start

```bash
npx sigil-cms create my-site --template website
cd my-site
sigil dev
```

Open [http://localhost:4000/admin](http://localhost:4000/admin) to launch the admin panel.

```bash
# Other templates
npx sigil-cms create my-blog --template blog
npx sigil-cms create my-docs --template docs
npx sigil-cms create my-store --template ecommerce
npx sigil-cms create my-band --template artist
```

## What Makes Sigil Different

| Feature | Sigil | Strapi | Sanity | Payload |
|---------|-------|--------|--------|---------|
| **Multi-tenancy** | Native (RLS) | No | No (per-project billing) | No |
| **Self-hosting** | Free, unlimited | Free, unlimited | Not available | Free, unlimited |
| **Visual design editor** | Design Playground | No | No | No |
| **Block-level analytics** | Resonance | No | No | No |
| **AI design generation** | Stitch + Charlotte | No | AI Assist (text only) | No |
| **Built-in plugins** | 19 | Marketplace | No | Marketplace |
| **Content scheduling** | Built-in | Enterprise only | Yes | Yes |
| **GraphQL API** | Yes | Yes | GROQ | Yes |
| **Seats at $29/mo** | **10** | 5 | 2 ($15/user) | 3 |
| **Sites at $29/mo** | **5** | 1 | 1 project | 1 |

## Features

### Native Multi-Tenancy

One Sigil deployment. One database. Unlimited tenants. Each agency client gets their own isolated space with separate sites, themes, users, and media -- all protected by Row-Level Security at the PostgreSQL layer.

```
Agency (Tenant)
 ├── Client A (Site) ── pages, blocks, themes, media
 ├── Client B (Site) ── pages, blocks, themes, media
 └── Client C (Site) ── pages, blocks, themes, media
```

```typescript
// Every API call is tenant-scoped via JWT
const client = createClient({
  baseUrl: 'https://cms.agency.com',
  siteSlug: 'client-a',
});
const pages = await client.pages.listPublished();
```

Users can have different roles per site -- an `editor` on one client site and a `viewer` on another, all within the same tenant.

### Design Playground

Give designers control without filing tickets. The Design Playground exposes 1,400+ CSS variables through a visual editor -- colors, typography (70+ Google Fonts), spacing, border radius, shadows, backdrop blur, and glass effects. Seven built-in presets provide starting points. Designers work in the browser; developers never need to touch a config file.

- Real-time dark/light mode preview
- Custom CSS injection for edge cases
- Theme duplication and multiple themes per site
- Font browser with Google Fonts search and custom font upload (.woff2, .ttf, .otf)

### Resonance Analytics

Block-level engagement metrics that tell you *which block* users engage with, not just which page they visited. Resonance tracks viewport time, scroll depth, clicks, and bounce points per content block.

- Composite resonance score (0-100) per block per time period
- A/B experiments between block variants with traffic splitting
- AI-generated improvement suggestions per block (via Gemini)
- Embeddable `resonance_insights` block for in-page analytics

### AI Design Generation

Describe a page in plain English. Get structured, editable content blocks.

**Stitch integration** generates full-page HTML from a text prompt, then the Stitch-to-blocks converter parses it into Sigil blocks (hero, feature grid, CTA, text). Import the result directly to any page.

**Charlotte AI** provides context-aware design advice grounded in your actual theme tokens and block structure -- not generic tips. She knows your colors, your fonts, and your block types.

```
POST /api/v1/sites/:siteId/design/generate
{ "prompt": "A dark-themed landing page for a jazz musician with hero and upcoming shows" }
→ Full HTML mockup

POST /api/v1/sites/:siteId/design/import
{ "screenId": "...", "pageId": "..." }
→ Structured Sigil blocks added to page
```

### 19 Built-In Plugins

Every plugin is environment-gated -- missing env vars cause a graceful skip, never a crash. The core CMS always works.

| Category | Plugin | What It Does |
|----------|--------|-------------|
| **Creative** | Artist | Releases, events, profiles, 6 block types for musicians |
| **Creative** | Photos | Multi-provider storage (GCS/Azure/S3), AI tagging via Gemini |
| **Commerce** | Store | Stripe products, checkout, orders, webhooks |
| **Commerce** | Printful | Print-on-demand merchandise via Printful |
| **Commerce** | PayPal | PayPal/Venmo checkout integration |
| **Commerce** | Booking | Appointment scheduling, Google Calendar sync |
| **Communication** | Mailing List | GDPR-compliant subscribe/unsubscribe, broadcast |
| **Communication** | Contact | Form submissions with inquiry types and status workflow |
| **Communication** | Support | Embeddable support panel widget |
| **Developer** | SEO | Sitemap.xml, RSS feeds, zero-config |
| **Developer** | Docs | Knowledge base with categories, versioning, feedback |
| **Developer** | Webhooks | Event bus with delivery tracking and retry |
| **Developer** | Migrate | Import from WordPress, Shopify, Square Online |
| **Developer** | Resonance | Block-level analytics, A/B testing, AI suggestions |
| **AI** | Advisor | Charlotte AI chat with pgvector RAG and TTS |
| **AI** | Charlotte | Embeddable voice assistant widget |
| **Integration** | KAMERA | Survai 3D scan visualization |
| **Integration** | KOG | K0DE platform project sites |
| **Integration** | Intirkast | Live and recorded streaming embeds |

### Developer Experience

**TypeScript SDK** -- zero dependencies, works in Node.js, browsers, and edge runtimes:

```bash
npm install @sigil-cms/client
```

```typescript
import { createClient } from '@sigil-cms/client';

const cms = createClient({ baseUrl: 'https://cms.example.com', siteSlug: 'my-site' });
const page = await cms.pages.getBySlug('about');
const tree = await cms.pages.getTree(); // hierarchical nav
const theme = await cms.sites.getPublicTheme();
```

**Next.js integration** -- App Router, server components, static generation, ISR:

```bash
npm install @sigil-cms/next @sigil-cms/client
```

```tsx
// app/[[...slug]]/page.tsx
import { SigilPage, generateSigilMetadata, generateSigilStaticParams } from '@sigil-cms/next';

export const generateMetadata = ({ params }) => generateSigilMetadata(params.slug?.join('/') ?? 'home');
export const generateStaticParams = () => generateSigilStaticParams();

export default async function Page({ params }) {
  const { slug } = await params;
  return <SigilPage slug={slug?.join('/') ?? 'home'} />;
}
```

**GraphQL API** at `/graphql` with queries for pages, blocks, themes, media, sites, navigation, and search.

**CLI** for scaffolding, dev server, builds, migrations, and seeding:

```bash
npx sigil-cms create my-site    # scaffold project
sigil dev                        # dev server with hot reload
sigil build                      # production build
sigil migrate                    # run database migrations
sigil seed                       # seed demo content
sigil info                       # environment diagnostics
```

**REST API** versioned at `/api/v1/` with public and authenticated endpoints. Bearer JWT auth. Full CRUD on sites, pages, blocks, media, themes, users, and all plugin resources.

### 23 Built-In Block Types

| Category | Block Types |
|----------|-------------|
| **Layout** | Hero, Call to Action, Bento Grid |
| **Content** | Text, Rich Text, Feature Grid, Pricing Table, Testimonials, FAQ, Stats Bar, Timeline, Code Block, Custom HTML |
| **Media** | Image, Video, Gallery |
| **Interactive** | Contact Form, Newsletter |
| **Artist** | Embed Player, Release List, Event List, Social Links, Link Tree, Artist Bio |

Plugins add more: `product_grid`, `buy_button`, `booking_calendar`, `service_list`, `resonance_insights`, `doc_callout`, `doc_code`. Build your own with the `CmsPlugin` interface.

### Content Management

- **Hierarchical pages** with computed URL paths, full-text search, and SEO fields (meta title, description, OG image) with database-enforced character limits
- **Content versioning** -- unlimited revision history with full snapshots, revert to any version
- **Content scheduling** -- publish and unpublish at specific times via built-in daemon
- **15-language i18n** via page-clone model with per-language slug uniqueness
- **Media library** -- bulk upload (20 files, 50MB each), folder organization, dimension metadata, multi-provider storage
- **Block templates** -- save and reuse block presets across sites in a tenant
- **Live preview** -- split-view editor with desktop/tablet/mobile viewports

## Self-Hosting

Sigil runs on Node.js + PostgreSQL. No proprietary dependencies. Self-host for free -- forever, with no feature limits.

| Platform | Monthly Cost | Setup Time | Command |
|----------|-------------|------------|---------|
| **Docker Compose** (any VPS) | ~$5-10/mo | 10 min | `sigil create --template docker` |
| **Google Cloud Run** | ~$0-5/mo | 10 min | `sigil create --template gcp` |
| **AWS Fargate** | ~$3-8/mo | 15 min | `sigil create --template aws` |
| **Fly.io** | ~$3-5/mo | 5 min | `sigil create --template fly` |
| **Railway** | ~$5/mo | 5 min | `sigil create --template railway` |
| **DigitalOcean** | ~$5-12/mo | 10 min | `sigil create --template digitalocean` |
| **Azure Container Apps** | ~$5-10/mo | 15 min | `sigil create --template azure` |
| **Coolify / Dokku** | $0 + VPS | 15 min | `sigil create --template coolify` |
| **Local / Raspberry Pi** | $0 | 15 min | `sigil create --template local` |

Scale-to-zero on Cloud Run and Fargate means you pay almost nothing when the admin panel is idle. A $5/mo VPS handles thousands of page views.

## Cloud Pricing

For teams that want managed hosting, automatic updates, and priority support.

| | **Starter** | **Team** | **Business** | **Enterprise** |
|---|---|---|---|---|
| **Price** | Free | $29/mo | $79/mo | $249/mo |
| **Seats** | 3 | 10 | 25 | Unlimited |
| **Sites** | 1 | 5 | 25 | Unlimited |
| **Content items** | 1,000 | 10,000 | 100,000 | Unlimited |
| **Media storage** | 1 GB | 10 GB | 100 GB | 1 TB |
| **API calls** | 50K/mo | 500K/mo | 5M/mo | Unlimited |
| **Plugins** | Core (8) | All (19) | All (19) | All + custom |
| **Design Playground** | Basic | Full | Full | Full + white-label |
| **Multi-tenancy** | -- | -- | Yes | Yes |
| **Resonance analytics** | -- | -- | Yes | Yes |
| **SSO (SAML/OIDC)** | -- | -- | -- | Yes |
| **Support** | Community | Email (48h) | Email (24h) | Dedicated (4h SLA) |
| **SLA** | -- | 99.5% | 99.9% | 99.95% |

Annual billing: 2 months free (save 17%).

## Architecture

```
sigil-cms/
├── packages/@netrun-cms/
│   ├── core         — TypeScript types, enums (28), Zod schemas, utilities
│   ├── db           — Drizzle ORM schema, migrations, PostgreSQL client
│   ├── ui           — 64 Shadcn/Radix components + 1,400+ CSS variable design system
│   ├── theme        — ThemeProvider + 7 presets
│   ├── blocks       — Composable content block components
│   ├── embeds       — Platform embed components (Spotify, YouTube, etc.)
│   └── plugin-runtime — Plugin loader, registry, manifest system
├── packages/
│   ├── client       — @sigil-cms/client TypeScript SDK
│   ├── cli          — sigil-cms CLI (create, dev, build, migrate, seed)
│   └── next         — @sigil-cms/next App Router integration
├── apps/
│   ├── api          — Express.js backend (REST + GraphQL)
│   └── admin        — Vite + React 18 SPA
└── plugins/         — 19 feature plugins (env-gated, graceful skip)
```

**Stack**: TypeScript 5.7, Node.js 20+, Express.js, React 18, PostgreSQL, Drizzle ORM, Vite, Turborepo, pnpm workspaces.

## Documentation

- [TypeScript SDK](packages/client/README.md) -- `@sigil-cms/client` API reference
- [Next.js Integration](packages/next/README.md) -- `@sigil-cms/next` App Router guide
- [CLI Reference](packages/cli/README.md) -- `sigil-cms` command reference
- [Whitepaper](WHITEPAPER.md) -- Full technical architecture and competitive analysis
- [Pricing](PRICING.md) -- Detailed pricing, self-hosting templates, competitor comparison
- [Contributing](CONTRIBUTING.md) -- How to contribute

## Community

- [GitHub Issues](https://github.com/Netrun-Systems/sigil-cms/issues) -- Bug reports and feature requests
- [GitHub Discussions](https://github.com/Netrun-Systems/sigil-cms/discussions) -- Questions and ideas
- [Contributing](CONTRIBUTING.md) -- Fork/branch/PR workflow and code style
- [Code of Conduct](CODE_OF_CONDUCT.md) -- Contributor Covenant v2.1

## Built With

Sigil was built by a solo founder with 25 years of cloud infrastructure experience and 20 AI development agents under [SDLC v2.3](https://netrunsystems.com) governance. The entire platform -- API, admin panel, 19 plugins, SDK, CLI, Next.js integration, Design Playground, Resonance analytics, AI design generation -- was architected and shipped by one person coordinating a fleet of specialized AI agents.

We use our own products to bring Sigil to market: **KOG CRM** for lead tracking, **Intirkast** for social media scheduling, **KAMERA** for prospect research, **Charlotte** for AI assistance. Built, not subscribed.

**[Netrun Systems](https://netrunsystems.com)** -- California, USA.

## License

[MIT](LICENSE) -- use it, modify it, ship it. No feature gating, no watermarking, no betrayal.

# Netrun Systems Website — Sigil CMS Migration Plan

**Version**: 1.0
**Date**: March 28, 2026
**Author**: Daniel Garza + Claude Code
**Branch**: `sigil-netrunsystems`
**Status**: PLANNING

---

## Context

The netrunsystems.com website currently runs as a React SPA (`NetrunSite` repo) deployed on Cloud Run as `netrunsite`. It has ~90 routes, a PostgreSQL backend, and complex integrations (Stripe, Azure AD, KAMERA, K0DE, Intirkast, KOG CRM).

We're migrating the public-facing marketing site to Sigil CMS while keeping the backend services (KAMERA, K0DE, auth, payments, account management) on the existing React app. The Sigil site will run as a separate Cloud Run service (`netrun-sigil-site`) during development, then replace the production site once ready.

### Why Migrate
- The React app mixes marketing content with application logic — content changes require developer deploys
- Sigil CMS provides a block editor for non-developer content management
- Product pages, blog, and marketing content should be editable without code changes
- The React app's 90+ routes include many that are application features, not marketing pages

### What Changes
- Marketing pages move to Sigil CMS (managed via block editor)
- Application features (KAMERA, K0DE, Intirkast, auth, account) stay on the React app
- Both services share the same domain via path-based routing

---

## Architecture

### Target State

```
www.netrunsystems.com
├── / (home)                    → Sigil renderer (marketing)
├── /products/*                 → Sigil renderer (product pages)
├── /services/*                 → Sigil renderer (service pages)
├── /about, /contact, /blog     → Sigil renderer (content pages)
├── /legal/*                    → Sigil renderer (legal pages)
├── /kamera/*                   → React app (KAMERA application)
├── /kode/*                     → React app (K0DE application)
├── /intirkast/*                → React app (Intirkast editor)
├── /account/*                  → React app (user account)
├── /admin/*                    → React app (admin panel)
├── /login, /register           → React app (authentication)
└── /api/*                      → React app (all APIs)
```

### Cloud Run Services

| Service | Image | Purpose | Domain |
|---------|-------|---------|--------|
| `netrunsite` | `netrunsite:v1` | React app (applications + API) | www.netrunsystems.com (current) |
| `netrun-sigil-site` | `netrun-sigil-renderer:v1` | Sigil renderer (marketing) | staging-www.netrunsystems.com (dev) |
| `sigil-api` | `sigil-api:latest` | Sigil CMS API | sigil-api.netrunsystems.com |

### Phase 1: Parallel Development
Both services run simultaneously. Sigil site on a staging URL. React app serves production.

### Phase 2: Path-Based Routing
Cloud Run URL map or load balancer routes marketing paths to Sigil, application paths to React.

### Phase 3: Full Cutover
Sigil renderer becomes the primary service. React app serves only `/kamera/*`, `/kode/*`, `/intirkast/*`, `/account/*`, `/admin/*`, `/api/*`.

---

## Content Migration Matrix

### Pages Moving to Sigil CMS

| Current Route | Page Title | Block Types Needed | Priority |
|---------------|------------|-------------------|----------|
| `/` (home) | Home | hero, feature_grid, stats_bar, testimonial, cta | P0 |
| `/products` | Products Index | feature_grid, cta | P0 |
| `/products/intirkon` | Intirkon | hero, feature_grid, pricing_table, faq, cta | P0 |
| `/products/intirkast` | Intirkast | hero, feature_grid, pricing_table, cta | P1 |
| `/products/intirfix` | Intirfix | hero, feature_grid, pricing_table, cta | P2 |
| `/products/netrun-kare` | KARE | hero, feature_grid, pricing_table, cta | P1 |
| `/products/netrun-klip` | KLIP | hero, feature_grid, cta | P2 |
| `/products/netrun-crm` | KOG CRM | hero, feature_grid, pricing_table, cta | P2 |
| `/products/charlotte` | Charlotte | hero, feature_grid, cta | P2 |
| `/products/optikal` | Optikal | hero, feature_grid, pricing_table, cta | P2 |
| `/products/meridian` | Meridian | hero, feature_grid, cta | P2 |
| `/products/patlas` | PATLAS | hero, feature_grid, cta | P2 |
| `/products/survai` | Survai | hero, feature_grid, cta | P2 |
| `/products/ghostgrid` | GhostGrid | hero, text, cta | P2 |
| `/products/meshbook` | Meshbook | hero, feature_grid, cta | P3 |
| `/products/eiscore` | EIS | hero, feature_grid, cta | P3 |
| `/products/dungeonmaster` | DungeonMaster | hero, feature_grid, cta | P3 |
| `/services` | Services | hero, feature_grid, cta | P0 |
| `/services/cloud-audit` | Cloud Audit | hero, text, pricing_table, cta | P1 |
| `/services/ai-assessment` | AI Assessment | hero, text, pricing_table, cta | P1 |
| `/services/agentic-coding` | Agentic Coding | hero, text, cta | P1 |
| `/services/virtual-tours` | Virtual Tours | hero, text, pricing_table, cta | P2 |
| `/about` | About | hero, text, timeline, stats_bar | P0 |
| `/contact` | Contact | hero, contact_form | P0 |
| `/blog` | Blog | hero, text (+ blog plugin) | P0 |
| `/research` | Research | hero, feature_grid | P1 |
| `/ojai` | For Ojai | hero, feature_grid, cta | P1 |
| `/ojai-it` | Ojai IT | hero, feature_grid, pricing_table | P1 |
| `/events` | Events | hero, text | P2 |
| `/legal/privacy-policy` | Privacy Policy | text | P1 |
| `/legal/terms-of-service` | Terms of Service | text | P1 |
| `/legal/eula` | EULA | text | P1 |
| `/legal/beta-terms` | Beta Terms | text | P2 |
| `/kare` | KARE Landing | hero, feature_grid, pricing_table, cta | P1 |
| `/docs/intirkon-whitepaper` | Intirkon Whitepaper | text | P1 |
| `/docs/ghostgrid-whitepaper` | GhostGrid Whitepaper | text | P1 |
| `/docs/kamera-whitepaper` | KAMERA Whitepaper | text | P1 |

### Pages Staying on React App (NOT migrated)

| Route | Reason |
|-------|--------|
| `/kamera/*` (6 routes) | Complex application: job creation, Stripe checkout, report viewer, dashboard |
| `/kode` | Job creation form + GitHub automation |
| `/intirkast/*` (2 routes) | SLAET editor + content library |
| `/account/*` (12 routes) | Full account management with auth |
| `/admin/*` (4 routes) | Admin panel with user/product management |
| `/login`, `/register` | Authentication flows (local + MSAL) |
| `/tools/resume` | Interactive tool |
| `/jobs/*` | Indeed API integration |
| `/ai-scorecard` | Interactive assessment |
| `/klip-snapshot` | Interactive tool |
| `/securevault-beta` | Beta application |
| `/support/*` (11 routes) | Support center with widget integration |

---

## Sigil CMS Content Setup

### Site Configuration (already exists)

```
Site slug: netrun
Domain: netrunsystems.com
Theme: Dark (--sigil-primary: #90b9ab, --sigil-background: #0A0A0A)
```

### Pages to Create in CMS

**P0 (Launch Blockers — must have before cutover):**
1. `home` — Hero + feature grid (6 products) + stats bar + testimonials + CTA
2. `products` — Product catalog grid with links to individual product pages
3. `products/intirkon` — Problem-first narrative (from new marketing materials)
4. `services` — Service overview with links to individual services
5. `about` — Company story, timeline, team
6. `contact` — Contact form (uses Sigil contact plugin)
7. `blog` — Blog listing (uses Sigil blog plugin or direct API)

**P1 (Before public announcement):**
8-15. Individual product pages (Intirkast, KARE, Optikal, etc.)
16-19. Service landing pages (Cloud Audit, AI Assessment, etc.)
20-22. Legal pages (Privacy, ToS, EULA)
23-25. Whitepapers

**P2 (Nice to have):**
26-35. Remaining product pages, Ojai pages, events

### Navigation Structure

```
Services    Products    Research    Blog    About    Contact
```

Short labels. No product-level items in top nav. Products page links to all product detail pages.

---

## Technical Requirements

### Renderer Changes (on `sigil-netrunsystems` branch)

Already done:
- [x] Top-level nav filter (6 links, short labels)
- [x] Netrun N logo in nav (48x48 webp)
- [x] Mobile hamburger menu
- [x] Fixed nav with green→black scroll transition
- [x] Dockerfile copies static/ directory

Still needed:
- [ ] Footer: company info, social links, legal links, product links
- [ ] Contact form wired to ACS email delivery (or Sigil contact plugin)
- [ ] Blog rendering: either via blog plugin public routes or custom block
- [ ] Product page template: standardized layout for all product pages
- [ ] 404 page: branded, with search or navigation suggestions
- [ ] Favicon: Netrun N favicon
- [ ] SEO: JSON-LD structured data, canonical URLs, hreflang
- [ ] Analytics: GA4 measurement ID injection
- [ ] Support widget: embed the @netrun/support-widget script
- [ ] Stripe payment links: `/signup?plan=X` redirect handler (exists in server.ts)

### New Block Types Needed

| Block Type | Purpose | Complexity |
|------------|---------|------------|
| `video` | YouTube/Vimeo embeds for product demos | Low — extend embed_player |
| `comparison_table` | Old Way / New Way feature comparison | Medium — new block |
| `logo_grid` | Partner/integration logos (38 vendor logos) | Low — image grid variant |
| `accordion` | Expandable sections for product details | Low — extend FAQ block |
| `tab_panel` | Tabbed content for product features | Medium — requires JS |

### Integration Points

| Feature | Current (React) | Sigil Approach |
|---------|----------------|----------------|
| Contact form | React modal → `/api/contact` | Sigil contact_form block → plugin route → ACS email |
| Blog | PostgreSQL + admin panel | Sigil blog plugin (13 articles already in CMS DB) |
| Newsletter | React form → KOG CRM API | Sigil mailing-list plugin or custom block → KOG |
| Analytics | GA4 gtag.js in index.html | GA4 script injection in layout.ts |
| Auth | MSAL + local | NOT in Sigil — stays on React app |
| Payments | Stripe redirect | `/signup?plan=X` handler (already in server.ts) |
| Search | None (client-side) | Sigil search plugin or none |

---

## Data Migration

### Blog Posts (13 articles)

Source: `netrunsite` PostgreSQL (`posts` table)
Destination: `sigil` PostgreSQL (`cms_pages` table with template='blog')

Migration script needed:
1. Export posts from `netrunsite` DB
2. Create corresponding pages in Sigil CMS with `fullPath: 'blog/{slug}'`
3. Convert markdown content to Sigil text blocks
4. Map featured images, tags, meta descriptions

### Product Content

Source: React components (hardcoded JSX + markdown files)
Destination: Sigil CMS pages with block editor

Migration approach:
1. Extract content from each product page component
2. Map to Sigil block types (hero, feature_grid, pricing_table, etc.)
3. Create pages in CMS via admin UI or seed script
4. Verify rendering matches original design

### Assets

| Asset Type | Current Location | Sigil Location |
|------------|-----------------|----------------|
| Logos | `client/public/assets/logo/` | `apps/renderer/static/` |
| Fonts | `client/public/fonts/` | Google Fonts (via theme tokens) or static/ |
| Product screenshots | Unsplash URLs / Azure Blob | Same URLs (external) |
| Favicon | `client/public/favicon.ico` | `apps/renderer/static/favicon.png` |

---

## Deployment Plan

### Step 1: Deploy Sigil Site Service (Development)

```bash
# From netrun-cms repo, sigil-netrunsystems branch
docker build -t us-central1-docker.pkg.dev/gen-lang-client-0047375361/charlotte-artifacts/netrun-sigil-renderer:v1 \
  -f apps/renderer/Dockerfile apps/renderer/

docker push us-central1-docker.pkg.dev/gen-lang-client-0047375361/charlotte-artifacts/netrun-sigil-renderer:v1

gcloud run deploy netrun-sigil-site \
  --image us-central1-docker.pkg.dev/gen-lang-client-0047375361/charlotte-artifacts/netrun-sigil-renderer:v1 \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 256Mi \
  --set-env-vars="SITE_SLUG=netrun,API_URL=https://sigil-api.netrunsystems.com/api/v1/public,SITE_NAME=Netrun Systems" \
  --port 3000
```

### Step 2: Map Staging Domain

```bash
gcloud beta run domain-mappings create \
  --service netrun-sigil-site \
  --domain staging.netrunsystems.com \
  --region us-central1

# Add DNS record at DreamHost
# staging CNAME ghs.googlehosted.com
```

### Step 3: Create Content in CMS

Use Sigil admin (`sigil.netrunsystems.com`) to create pages for the `netrun` site:
- Create P0 pages (home, products, services, about, contact, blog)
- Apply Netrun theme tokens (dark background, green primary)
- Test rendering on staging URL

### Step 4: Production Cutover

Option A: Domain swap (simple)
- Point `www.netrunsystems.com` to `netrun-sigil-site`
- Point application routes to React app via a path-based load balancer

Option B: URL map (granular)
- GCP URL map routes marketing paths to Sigil, application paths to React
- Requires GCP external HTTPS load balancer

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| SEO regression (broken URLs) | High | 301 redirects for all changed paths |
| Blog content loss | Medium | Verify migration before cutover |
| Payment flow breaks | High | `/signup?plan=X` handler tested independently |
| Auth disruption | High | Auth stays on React app — no migration needed |
| Performance regression | Medium | Sigil renderer is lighter than React SPA |
| Content editing friction | Low | Train on Sigil block editor before cutover |
| Plugin route conflicts | Medium | Test all plugin routes on staging first |

---

## Success Criteria

- [ ] All P0 pages rendering on staging URL
- [ ] Blog posts migrated and displaying
- [ ] Contact form delivering emails
- [ ] GA4 tracking active
- [ ] Mobile responsive (hamburger nav, stacked blocks)
- [ ] Lighthouse score >= 90 on all P0 pages
- [ ] No broken links from external sources
- [ ] Payment links working (`/signup?plan=X`)
- [ ] Support widget loading
- [ ] Staging tested by Daniel and approved

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|-------------|
| Service deployment + staging domain | 1 hour | Branch ready |
| P0 page content creation (7 pages) | 4-6 hours | CMS admin access |
| Blog migration script | 1-2 hours | DB access to both DBs |
| Footer, analytics, support widget | 2-3 hours | Renderer code |
| Testing + fixes | 2-3 hours | Content created |
| P1 pages (18 pages) | 6-8 hours | P0 complete |
| Production cutover | 1 hour | All P0+P1 tested |

**Total: ~2-3 days of focused work**

---

*Netrun Systems | netrun-cms repo | Branch: sigil-netrunsystems*

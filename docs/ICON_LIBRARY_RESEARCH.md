# ICON_LIBRARY_RESEARCH_v1.0.md

**Project**: Sigil CMS (netrun-cms)
**Date**: 2026-03-24
**Author**: Research Agent (SDLC v2.3)
**Scope**: Open-source icon libraries, Iconify API, reusable icon package architecture for React 18 + TypeScript + Shadcn/Radix UI + Tailwind CSS

---

## Executive Summary

Sigil CMS serves 10 industry verticals and requires a reusable, extensible icon system for both the admin UI and tenant-facing content blocks. The recommended architecture is a **two-layer approach**:

1. **Static layer**: Bundle `lucide-react` as the primary icon set for all admin UI chrome (navigation, toolbars, actions). It is the lowest bundle-cost, tree-shakeable, MIT-licensed library available — already used by Shadcn.
2. **Dynamic layer**: Integrate the **Iconify REST API** to power a searchable icon picker in the admin, allowing tenant users to browse and assign 185,000+ icons across 180+ sets without bundling anything extra.

No custom SVG bundling is needed for the initial release. A dedicated `@netrun-cms/icons` package should be created as a thin wrapper that re-exports categorized Lucide icons and provides the Iconify picker component.

---

## 1. Open-Source Icon Libraries

### 1.1 Lucide Icons (PRIMARY RECOMMENDATION)

| Property | Value |
|----------|-------|
| Icons | ~1,703 (growing; actively maintained) |
| React package | `lucide-react` |
| Install | `pnpm add lucide-react` |
| License | ISC (permissive, functionally MIT) |
| Tree-shaking | Yes — file-level ESM, only imported icons bundled |
| TypeScript | Full — every icon is a typed React component |
| Weekly downloads | ~35 million (npm, March 2026) |
| Bundle cost | ~5.16 KB gzip per 50 icons (best-in-class) |
| Shadcn compatibility | Native — Shadcn/ui uses Lucide internally |

**Why Lucide is the top choice**: Lucide is the direct successor to Feather Icons. It has the most favorable bundle size benchmark among all major React icon libraries — 5.16 KB gzip per 50 icons vs Heroicons at 3.49 KB (fewer icons overall) and Phosphor at 33.91 KB. Its file-level ESM structure aligns perfectly with Turbopack and Vite's tree-shaking. Shadcn already depends on it, so there is zero additional dependency overhead.

**Usage in Sigil**:
```tsx
import { ShoppingCart, Utensils, BarChart2, Music, Users } from "lucide-react";

// Size and color via props
<ShoppingCart size={20} className="text-muted-foreground" />
```

**Key vertical coverage in Lucide**:
- Restaurant: `Utensils`, `UtensilsCrossed`, `Wine`, `ChefHat`, `Coffee`, `Pizza`, `Soup`
- E-commerce: `ShoppingCart`, `ShoppingBag`, `CreditCard`, `Truck`, `Package`, `Tag`
- SaaS: `LayoutDashboard`, `Cloud`, `Terminal`, `Webhook`, `Code2`, `Key`, `Database`
- Music/Artist: `Music`, `Music2`, `Mic`, `Mic2`, `Ticket`, `Speaker`, `Radio`, `Drum`
- Agency: `Briefcase`, `BarChart2`, `Presentation`, `Handshake`, `LineChart`, `TrendingUp`
- Community: `Users`, `Heart`, `Trophy`, `Flag`, `MessageSquare`, `Globe`
- Publisher: `BookOpen`, `Newspaper`, `FileText`, `Pen`, `PenLine`, `Quote`
- Consultant: `Calendar`, `Video`, `Award`, `Clock`, `ClipboardList`, `UserCheck`
- Cooperative: `Store`, `Scale`, `Receipt`, `HandHeart`, `Coins`
- Small Business: `MapPin`, `Phone`, `Star`, `Wrench`, `Building2`, `Hammer`

---

### 1.2 Heroicons (Tailwind Team)

| Property | Value |
|----------|-------|
| Icons | ~292 unique shapes, 4 sizes/styles each (outline 24px, solid 24px, mini 20px, micro 16px) |
| React package | `@heroicons/react` |
| Install | `pnpm add @heroicons/react` |
| License | MIT |
| Tree-shaking | Yes |
| TypeScript | Full |
| Bundle cost | ~3.49 KB gzip per 50 icons |

Heroicons has excellent design quality (same team as Tailwind CSS) but a smaller icon selection than Lucide. It shines for clean, minimal UI chrome. However, since Lucide already covers the same use cases with more icons and Shadcn uses Lucide natively, Heroicons adds no advantage for Sigil CMS. Suitable as a **supplementary** set if a specific icon is needed that Lucide lacks.

Import paths use style-specific subpaths:
```tsx
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { ShoppingCartIcon } from "@heroicons/react/24/solid";
```

---

### 1.3 Phosphor Icons

| Property | Value |
|----------|-------|
| Icons | 9,072+ (6 weights per shape = 1,512 base shapes) |
| React package | `@phosphor-icons/react` |
| Install | `pnpm add @phosphor-icons/react` |
| License | MIT |
| Weights/Variants | Thin, Light, Regular, Bold, Fill, Duotone |
| TypeScript | Full — exports `Icon`, `IconWeight`, `IconBase` types |
| SSR support | Yes — via `/ssr` submodule |
| Bundle cost | ~33.91 KB gzip per 50 icons (significant overhead vs Lucide) |

Phosphor is the most visually expressive library: 6 weights give designers the most flexibility. However, its bundle cost is ~6.5x higher than Lucide for the same icon count. The Duotone weight is useful for onboarding illustrations or empty states.

**Recommendation**: Use Phosphor selectively via the Iconify API (prefix: `ph`) rather than bundling the full package. This avoids the bundle cost while still providing access to its 9,000+ icons in the icon picker.

---

### 1.4 Tabler Icons

| Property | Value |
|----------|-------|
| Icons | 6,074+ (outline and filled variants) |
| React package | `@tabler/icons-react` |
| Install | `pnpm add @tabler/icons-react` |
| License | MIT |
| TypeScript | Full |
| Design | Consistent 24px stroke-based, 2px stroke width |

Tabler is exceptionally comprehensive for SaaS and developer-tool UIs. It covers technical categories (terminals, APIs, cloud, databases) more thoroughly than Lucide. Strong candidate for the SaaS vertical.

Available individually via Iconify prefix `tabler`.

---

### 1.5 Simple Icons (Brand Logos)

| Property | Value |
|----------|-------|
| Icons | 3,414+ SVG icons for popular brands |
| npm package | `simple-icons` |
| Install | `pnpm add simple-icons` |
| License | CC0 1.0 (public domain) |
| TypeScript | Yes — exports `SimpleIcon` type |
| Tree-shaking | Yes — individual named imports |

Simple Icons is the definitive source for brand/logo SVGs: Stripe, GitHub, Slack, Shopify, Spotify, etc. Essential for the SaaS and agency verticals where clients want to display integration badges or payment method logos.

```typescript
import { siStripe, siGithub, siShopify } from "simple-icons";
// Access: siStripe.svg (raw SVG string), siStripe.hex (brand color)
```

Available via Iconify prefix `simple-icons`.

---

### 1.6 Radix Icons (Already in Shadcn)

| Property | Value |
|----------|-------|
| Icons | ~252 icons (15x15px grid) |
| npm package | `@radix-ui/react-icons` |
| Install | Already installed via Shadcn setup |
| License | MIT |

Radix Icons are small (15x15px), designed for tight UI density within Radix primitives. Shadcn components already pull from this package. Do not add new usage — use Lucide instead for consistency and larger size support.

---

### 1.7 Material Design Icons (MDI)

| Property | Value |
|----------|-------|
| Icons | 7,447+ (MDI community set), 15,222 (Material Symbols), 10,955 (Google Material) |
| React packages | `@mdi/react` + `@mdi/js` OR via `@mui/icons-material` |
| License | Apache 2.0 |
| Design | Google Material Design spec, rounded/sharp/outlined variants |

MDI is the largest single-design-language icon set available. The sheer count (37,000+ total across all Material variants in Iconify) makes it valuable for the icon picker but not for direct bundling. The MDI community set (`mdi` prefix in Iconify) covers essentially every UI need.

**Not recommended for direct bundling** in Sigil due to Apache 2.0 (requires attribution) and large bundle size. Access via Iconify API instead.

---

### 1.8 Comparison Matrix

| Library | Icons | Bundle/50 icons | License | Recommended Use |
|---------|-------|-----------------|---------|-----------------|
| Lucide | 1,703 | 5.16 KB | ISC | PRIMARY — all admin UI chrome |
| Heroicons | ~292 shapes | 3.49 KB | MIT | Supplementary if needed |
| Phosphor | 9,072 | 33.91 KB | MIT | Via Iconify picker only |
| Tabler | 6,074 | ~6-8 KB est. | MIT | Via Iconify picker / SaaS vertical |
| Simple Icons | 3,414 | Variable | CC0 | Brand logos — small direct bundle |
| Radix | 252 | Already bundled | MIT | Already present via Shadcn |
| MDI/Symbols | 37,000+ | Very large | Apache 2.0 | Via Iconify picker only |

---

## 2. Iconify API (Deep Dive)

Iconify is an aggregator API and runtime loader that provides on-demand access to 185,000+ icons across 180+ open-source icon sets. It is the key infrastructure for the Sigil CMS icon picker.

### 2.1 API Fundamentals

**Public API hosts** (load-balanced globally across US, EU, Asia, Oceania):
```
https://api.iconify.design      (primary)
https://api.simplesvg.com       (backup 1)
https://api.unisvg.com          (backup 2)
```

No authentication required. No rate limit documented for reasonable usage.

---

### 2.2 REST API Endpoints (Complete Reference)

#### Search Icons
```
GET https://api.iconify.design/search?query={keyword}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | required | Search term (case-insensitive) |
| `limit` | number | 64 | Results per page. Min: 32, Max: 999 |
| `start` | number | 0 | Pagination offset |
| `prefix` | string | — | Filter to single icon set (e.g., `lucide`) |
| `prefixes` | string | — | Comma-separated prefixes; supports partial (`mdi-`) |
| `category` | string | — | Filter to icon set category |

**Response schema**:
```json
{
  "icons": ["mdi:home", "mdi-light:home", "lucide:home"],
  "total": 47,
  "limit": 64,
  "start": 0,
  "collections": {
    "mdi": {
      "name": "Material Design Icons",
      "total": 7447,
      "author": { "name": "Pictogrammers" },
      "license": { "title": "Apache 2.0", "spdx": "Apache-2.0" },
      "samples": ["home", "account", "alert"],
      "palette": false
    }
  },
  "request": { "query": "home", "limit": "64" }
}
```

**Pagination note**: Recommended strategy per docs — set initial limit to fit 2 pages. If `icons.length === limit`, more results exist. For subsequent pages, use `limit=999` with incrementing `start`.

---

#### Fetch SVG Directly
```
GET https://api.iconify.design/{prefix}/{icon}.svg
```

Example:
```
GET https://api.iconify.design/lucide/shopping-cart.svg
GET https://api.iconify.design/mdi/home.svg
GET https://api.iconify.design/tabler/brand-stripe.svg
```

**Optional query parameters for SVG**:
- `color=#000000` — Set fill/stroke color
- `width=24&height=24` — Set dimensions
- `box=true` — Add viewBox

This endpoint is ideal for preview in the icon picker: render an `<img>` tag pointing to the SVG URL, or inline it at selection time.

---

#### Fetch Icon JSON Data
```
GET https://api.iconify.design/{prefix}.json?icons={icon1},{icon2}
```

Example:
```
GET https://api.iconify.design/lucide.json?icons=home,shopping-cart,music
```

**Response**:
```json
{
  "prefix": "lucide",
  "icons": {
    "home": { "body": "<path d=\"...\"/>", "width": 24, "height": 24 },
    "shopping-cart": { "body": "<path d=\"...\"/>", "width": 24, "height": 24 }
  },
  "width": 24,
  "height": 24,
  "not_found": []
}
```

**Constraint**: One icon set per request. Browser URL length limit is 500 chars — split large requests.

---

#### List All Icon Sets
```
GET https://api.iconify.design/collections
```
Returns metadata for all 180+ icon sets. Requires `ENABLE_ICON_LISTS=true` on self-hosted instances.

---

#### List Icons in a Set
```
GET https://api.iconify.design/collection?prefix={prefix}
```

Example: `GET https://api.iconify.design/collection?prefix=lucide`

---

#### Keyword Autocomplete (for search UI)
```
GET https://api.iconify.design/keywords?prefix={keyword}
GET https://api.iconify.design/keywords?keyword={keyword}
```

Returns matching keyword suggestions for real-time search autocomplete.

---

#### Cache Invalidation Check
```
GET https://api.iconify.design/last-modified?prefixes=lucide,mdi,tabler
```

Use this to check if cached icon data needs refreshing without re-fetching all icons. Integrate with `localStorage` caching in the icon picker.

---

### 2.3 React Package: @iconify/react

```bash
pnpm add @iconify/react
```

**Basic usage** (fetches from API at runtime):
```tsx
import { Icon } from "@iconify/react";

// Icon name format: "prefix:icon-name"
<Icon icon="lucide:shopping-cart" width={24} height={24} />
<Icon icon="mdi:home" className="text-primary" />
<Icon icon="tabler:brand-stripe" />
```

The component fetches icon data from the Iconify API on first use, then caches in memory. Subsequent renders of the same icon are instant.

**Offline / pre-loaded usage**:
```tsx
import { Icon, addCollection } from "@iconify/react";
import lucideIcons from "@iconify-json/lucide/icons.json";

// Pre-load at app startup — no API calls for these icons
addCollection(lucideIcons);

// Now renders without network request
<Icon icon="lucide:home" />
```

---

### 2.4 Icon Sets Available in Iconify (Key Sets for Sigil Verticals)

| Prefix | Name | Count | License | Best For |
|--------|------|-------|---------|----------|
| `lucide` | Lucide | 1,703 | ISC | General UI, all verticals |
| `ph` | Phosphor | 9,072 | MIT | Expressive UI, duotone |
| `tabler` | Tabler Icons | 6,074 | MIT | SaaS/dev tools |
| `mdi` | Material Design Icons | 7,447 | Apache 2.0 | Comprehensive general |
| `material-symbols` | Material Symbols | 15,222 | Apache 2.0 | Google-style UI |
| `fluent` | Fluent UI Icons | 19,152 | MIT | Microsoft-style UI |
| `heroicons` | Heroicons | 1,288 | MIT | Tailwind-native |
| `simple-icons` | Simple Icons | 3,414 | CC0 | Brand logos |
| `carbon` | Carbon Icons | 2,468 | Apache 2.0 | IBM/enterprise |
| `bi` | Bootstrap Icons | 2,078 | MIT | Bootstrap-style |
| `ri` | Remix Icon | 2,776 | Apache 2.0 | Clean general-purpose |
| `game-icons` | Game Icons | 4,000+ | CC BY 3.0 | Gaming vertical |

**Total available**: 185,000+ icons across 180+ sets.

---

### 2.5 Self-Hosting the Iconify API

For production use where you cannot rely on an external API, or for airgapped/enterprise tenants:

**Docker (recommended)**:
```bash
# Clone the API repo
git clone https://github.com/iconify/api
cd api

# Build Docker image
./docker.sh

# Run (maps port 3000)
docker run -d -p 3000:3000 \
  -e ICONIFY_SOURCE=split \
  -e ENABLE_ICON_LISTS=true \
  -e ENABLE_SEARCH_ENGINE=true \
  -e ALLOW_FILTER_ICONS_BY_STYLE=true \
  iconify/api
```

**Key environment variables**:

| Variable | Value | Description |
|----------|-------|-------------|
| `ICONIFY_SOURCE` | `full` / `split` / `none` | `split` = install only `@iconify-json/*` packages you need |
| `ENABLE_ICON_LISTS` | `true` | Enables `/collections` and `/collection` endpoints |
| `ENABLE_SEARCH_ENGINE` | `true` | Enables `/search` endpoint |
| `ALLOW_FILTER_ICONS_BY_STYLE` | `true` | Allows `style=fill/stroke` filtering |
| `PORT` | `3000` | HTTP port (use nginx/Cloud Run for HTTPS) |

**HTTPS**: Not supported natively — use a reverse proxy (nginx, Cloud Run, Azure Front Door).

**Recommended icon sets for self-hosted Sigil** (install as `@iconify-json/*` packages, avoids downloading all 185K icons):
```bash
pnpm add @iconify-json/lucide      # Primary — 1,703 icons
pnpm add @iconify-json/ph          # Phosphor — 9,072 icons
pnpm add @iconify-json/tabler      # Tabler — 6,074 icons
pnpm add @iconify-json/mdi         # MDI — 7,447 icons
pnpm add @iconify-json/simple-icons # Brand logos — 3,414 icons
pnpm add @iconify-json/heroicons   # Heroicons — 1,288 icons
pnpm add @iconify-json/ri          # Remix Icon — 2,776 icons
```

This gives ~31,000 curated icons for the Sigil picker, keeping the self-hosted API lean.

**Note**: `ICONIFY_SOURCE=full` installs `@iconify/json` (~70-100 MB, all 185K icons). Use `split` + selected `@iconify-json/*` packages for production.

**GCP Cloud Run deployment** (recommended for Sigil on GCP):
- Containerize the API as above
- Deploy to `us-central1` alongside other Sigil services
- Point icon picker at `https://icons.sigil.netrunsystems.com` (Cloud Run service)

---

## 3. Industry-Specific Icon Needs by Vertical

The following maps each of Sigil's 10 verticals to specific Lucide icon names (bundled in primary layer) and recommended Iconify prefixes for extended picks via the picker.

### 3.1 Restaurant

| Purpose | Lucide Icon | Iconify Alternatives |
|---------|-------------|----------------------|
| Menu / food | `Utensils`, `UtensilsCrossed` | `mdi:food`, `ph:fork-knife` |
| Chef | `ChefHat` | `mdi:chef-hat`, `tabler:chef-hat` |
| Wine / bar | `Wine`, `GlassWater` | `mdi:wine`, `ph:wine` |
| Reservation | `CalendarCheck`, `Clock` | `mdi:calendar-check` |
| Pizza / specific food | `Pizza`, `Soup`, `Coffee`, `IceCream` | `ph:hamburger`, `ph:coffee` |
| Delivery | `Bike`, `Truck` | `mdi:moped`, `tabler:bike` |
| Table | `LayoutGrid` | `mdi:table-furniture` |
| Receipt | `Receipt` | `mdi:receipt`, `tabler:receipt` |

---

### 3.2 E-commerce

| Purpose | Lucide Icon | Iconify Alternatives |
|---------|-------------|----------------------|
| Cart | `ShoppingCart` | `mdi:cart`, `ph:shopping-cart` |
| Bag | `ShoppingBag` | `mdi:bag`, `tabler:shopping-bag` |
| Payment | `CreditCard`, `Wallet` | `simple-icons:stripe`, `simple-icons:paypal` |
| Shipping | `Truck`, `Package` | `mdi:truck-delivery`, `ph:package` |
| Returns | `RotateCcw`, `PackageOpen` | `mdi:package-variant-return` |
| Tag / discount | `Tag`, `Percent`, `BadgePercent` | `mdi:tag-outline` |
| Wishlist | `Heart`, `Bookmark` | `ph:heart`, `tabler:heart` |
| Reviews | `Star`, `StarHalf` | `mdi:star`, `ph:star` |
| Inventory | `Boxes`, `Warehouse` | `mdi:warehouse`, `tabler:box` |

---

### 3.3 SaaS / Developer

| Purpose | Lucide Icon | Iconify Alternatives |
|---------|-------------|----------------------|
| Dashboard | `LayoutDashboard` | `mdi:view-dashboard`, `tabler:layout-dashboard` |
| API | `Code2`, `Braces` | `tabler:api`, `mdi:api` |
| Cloud | `Cloud`, `CloudUpload`, `Server` | `mdi:cloud`, `tabler:cloud` |
| Terminal | `Terminal`, `SquareTerminal` | `tabler:terminal`, `mdi:console` |
| Webhook | `Webhook` | `mdi:webhook`, `tabler:webhook` |
| Key / auth | `Key`, `Lock`, `Shield` | `mdi:key`, `ph:key` |
| Database | `Database`, `DatabaseZap` | `mdi:database`, `tabler:database` |
| Analytics | `BarChart2`, `TrendingUp`, `LineChart` | `mdi:chart-line` |
| Integrations (brands) | — | `simple-icons:stripe`, `simple-icons:github`, `simple-icons:slack` |

---

### 3.4 Artist / Band

| Purpose | Lucide Icon | Iconify Alternatives |
|---------|-------------|----------------------|
| Music | `Music`, `Music2`, `Music3`, `Music4` | `ph:music-note`, `mdi:music` |
| Microphone | `Mic`, `Mic2`, `MicOff` | `mdi:microphone`, `tabler:microphone` |
| Ticket | `Ticket`, `TicketCheck` | `mdi:ticket`, `ph:ticket` |
| Vinyl | `Disc`, `Disc2`, `Disc3` | `ph:vinyl-record`, `mdi:record` |
| Speaker | `Speaker`, `Volume2` | `mdi:speaker`, `tabler:device-speaker` |
| Headphones | `Headphones` | `ph:headphones`, `mdi:headphones` |
| Guitar | — | `mdi:guitar-electric`, `ph:guitar` |
| Drum | `Drum` | `mdi:drum`, `tabler:music` |
| Stage / spotlight | — | `mdi:spotlight`, `ph:spotlight` |

---

### 3.5 Agency

| Purpose | Lucide Icon | Iconify Alternatives |
|---------|-------------|----------------------|
| Briefcase | `Briefcase`, `BriefcaseBusiness` | `mdi:briefcase`, `ph:briefcase` |
| Chart | `BarChart2`, `PieChart`, `LineChart` | `mdi:chart-bar`, `tabler:chart-bar` |
| Presentation | `Presentation`, `PresentationChart` (via tabler) | `mdi:presentation`, `tabler:presentation` |
| Handshake | `Handshake` | `mdi:handshake`, `ph:handshake` |
| Team | `Users`, `UsersRound` | `mdi:account-group`, `ph:users-three` |
| Campaign | `Megaphone`, `Rss` | `mdi:bullhorn`, `tabler:speakerphone` |
| Target | `Target`, `Crosshair` | `mdi:bullseye`, `ph:target` |

---

### 3.6 Community

| Purpose | Lucide Icon | Iconify Alternatives |
|---------|-------------|----------------------|
| Members | `Users`, `UserPlus` | `mdi:account-group`, `ph:users` |
| Forum | `MessageSquare`, `MessagesSquare` | `mdi:forum`, `tabler:message-circle` |
| Heart / like | `Heart`, `ThumbsUp` | `ph:heart`, `mdi:thumb-up` |
| Flag / report | `Flag`, `FlagOff` | `mdi:flag`, `ph:flag` |
| Trophy | `Trophy` | `mdi:trophy`, `ph:trophy` |
| Badge | `Badge`, `BadgeCheck` | `mdi:badge-account`, `tabler:badge` |
| Event | `CalendarDays`, `PartyPopper` | `mdi:calendar-star`, `ph:confetti` |

---

### 3.7 Publisher

| Purpose | Lucide Icon | Iconify Alternatives |
|---------|-------------|----------------------|
| Book | `BookOpen`, `Book`, `BookMarked` | `mdi:book-open`, `ph:book-open` |
| Newspaper | `Newspaper` | `mdi:newspaper`, `ph:newspaper` |
| Magazine | `BookImage` | `mdi:magazine`, `tabler:news` |
| Pen / writing | `Pen`, `PenLine`, `PenTool` | `ph:pen`, `mdi:pen` |
| Print | `Printer` | `mdi:printer`, `tabler:printer` |
| RSS | `Rss` | `mdi:rss`, `ph:rss` |
| Quote | `Quote` | `mdi:format-quote-close`, `tabler:quote` |

---

### 3.8 Consultant

| Purpose | Lucide Icon | Iconify Alternatives |
|---------|-------------|----------------------|
| Calendar / schedule | `Calendar`, `CalendarDays`, `CalendarCheck` | `mdi:calendar`, `ph:calendar` |
| Video call | `Video`, `VideoIcon`, `Monitor` | `mdi:video`, `simple-icons:zoom` |
| Certificate | `Award`, `GraduationCap` | `mdi:certificate`, `ph:certificate` |
| Clock / time | `Clock`, `Timer`, `AlarmClock` | `mdi:clock`, `tabler:clock` |
| Notes | `ClipboardList`, `StickyNote` | `mdi:clipboard`, `ph:clipboard-text` |
| Invoice | `FileText`, `Receipt` | `mdi:file-document`, `tabler:file-invoice` |

---

### 3.9 Cooperative

| Purpose | Lucide Icon | Iconify Alternatives |
|---------|-------------|----------------------|
| Hands together | `HandHeart`, `Handshake` | `mdi:hand-heart`, `ph:hands-clapping` |
| Store / market | `Store`, `Building` | `mdi:store`, `tabler:building-store` |
| Scale / fairness | `Scale` | `mdi:scale-balance`, `ph:scales` |
| Receipt | `Receipt` | `mdi:receipt`, `tabler:receipt` |
| Members | `UsersRound` | `mdi:account-group` |
| Vote | `Vote` (via tabler) | `mdi:vote`, `tabler:checkbox` |

---

### 3.10 Small Business

| Purpose | Lucide Icon | Iconify Alternatives |
|---------|-------------|----------------------|
| Storefront | `Store`, `Building2` | `mdi:storefront`, `tabler:building-store` |
| Phone | `Phone`, `PhoneCall` | `mdi:phone`, `ph:phone` |
| Map pin | `MapPin`, `LocateFixed` | `mdi:map-marker`, `ph:map-pin` |
| Star / rating | `Star`, `StarHalf` | `mdi:star`, `ph:star` |
| Tools | `Wrench`, `Hammer`, `Settings` | `mdi:tools`, `tabler:tools` |
| Hours | `Clock`, `Timer` | `mdi:clock-outline` |
| Social proof | `MessageSquare`, `ThumbsUp` | `mdi:comment-check` |

---

## 4. Recommended Architecture for @netrun-cms/icons

### 4.1 Package Structure

Create a new monorepo package: `packages/@netrun-cms/icons`

```
packages/@netrun-cms/icons/
├── package.json
├── src/
│   ├── index.ts              # Re-exports all categorized icons
│   ├── categories/
│   │   ├── restaurant.ts     # Named exports for restaurant vertical
│   │   ├── ecommerce.ts      # Named exports for e-commerce vertical
│   │   ├── saas.ts           # Named exports for SaaS vertical
│   │   ├── music.ts          # Named exports for artist/band vertical
│   │   ├── agency.ts         # Named exports for agency vertical
│   │   ├── community.ts      # Named exports for community vertical
│   │   ├── publisher.ts      # Named exports for publisher vertical
│   │   ├── consultant.ts     # Named exports for consultant vertical
│   │   ├── cooperative.ts    # Named exports for cooperative vertical
│   │   ├── small-business.ts # Named exports for small business vertical
│   │   └── ui.ts             # Admin UI chrome icons (nav, toolbar, etc.)
│   ├── components/
│   │   ├── IconPicker.tsx    # Full icon picker with Iconify search
│   │   ├── IconRenderer.tsx  # Renders a stored icon reference
│   │   └── VerticalIcons.tsx # Pre-curated icons for a given vertical
│   └── hooks/
│       └── useIconSearch.ts  # Iconify API hook
└── tsconfig.json
```

### 4.2 Category File Pattern

```typescript
// packages/@netrun-cms/icons/src/categories/restaurant.ts
// Re-export Lucide icons with semantic names for the restaurant vertical
export {
  Utensils as MenuIcon,
  UtensilsCrossed as DiningIcon,
  ChefHat as ChefIcon,
  Wine as WineIcon,
  Coffee as CoffeeIcon,
  Pizza as PizzaIcon,
  CalendarCheck as ReservationIcon,
  Receipt as ReceiptIcon,
  Bike as DeliveryIcon,
  Clock as HoursIcon,
  MapPin as LocationIcon,
  Star as RatingIcon,
  Phone as PhoneIcon,
} from "lucide-react";

// Metadata for the icon picker
export const RESTAURANT_ICONS = [
  { name: "MenuIcon", label: "Menu / Utensils", tags: ["menu", "food", "dining"] },
  { name: "ChefIcon", label: "Chef Hat", tags: ["chef", "kitchen", "cook"] },
  { name: "WineIcon", label: "Wine / Bar", tags: ["wine", "bar", "drinks"] },
  { name: "ReservationIcon", label: "Reservation", tags: ["booking", "reservation", "calendar"] },
  // ...
] as const;
```

### 4.3 IconPicker Component Design

```typescript
// packages/@netrun-cms/icons/src/components/IconPicker.tsx
interface IconPickerProps {
  value?: string;          // Stored as "prefix:icon-name" e.g. "lucide:home"
  onChange: (icon: string) => void;
  vertical?: SigilVertical; // Pre-filter to vertical icons
  allowAllSets?: boolean;   // Open search across all Iconify sets
}
```

**UX flow**:
1. Dialog trigger button shows current icon (or placeholder)
2. Tab 1: "Suggested" — pre-curated Lucide icons for the selected vertical (no API call)
3. Tab 2: "Search All" — real-time search via Iconify API with debounce (300ms)
4. Selection stores the icon reference string (`"lucide:shopping-cart"`) in the database
5. `IconRenderer` component resolves and renders the stored reference at display time

**Database storage**: Store icon references as strings (`"lucide:shopping-cart"` or `"mdi:home"`), never raw SVG. This keeps the data small and allows the render layer to change.

### 4.4 useIconSearch Hook

```typescript
// packages/@netrun-cms/icons/src/hooks/useIconSearch.ts

const ICONIFY_API = "https://api.iconify.design";

export function useIconSearch(query: string, options?: {
  prefix?: string;      // Limit to one set
  prefixes?: string;    // Comma-separated set prefixes
  limit?: number;
}) {
  return useQuery({
    queryKey: ["iconify-search", query, options],
    queryFn: async () => {
      if (!query || query.length < 2) return { icons: [], total: 0 };

      const params = new URLSearchParams({
        query,
        limit: String(options?.limit ?? 64),
        ...(options?.prefix && { prefix: options.prefix }),
        ...(options?.prefixes && { prefixes: options.prefixes }),
      });

      const res = await fetch(`${ICONIFY_API}/search?${params}`);
      if (!res.ok) throw new Error("Icon search failed");
      return res.json() as Promise<IconifySearchResult>;
    },
    staleTime: 5 * 60 * 1000,   // Cache for 5 minutes
    enabled: query.length >= 2,
  });
}
```

### 4.5 IconRenderer Component

```typescript
// packages/@netrun-cms/icons/src/components/IconRenderer.tsx
import { Icon } from "@iconify/react";
import type { LucideIcon } from "lucide-react";

interface IconRendererProps {
  icon: string;         // "lucide:home" | "mdi:home" | etc.
  size?: number;
  className?: string;
}

export function IconRenderer({ icon, size = 20, className }: IconRendererProps) {
  // For Lucide icons, we can optionally resolve from local bundle
  // For all others, use @iconify/react (fetches from API/cache)
  return (
    <Icon
      icon={icon}
      width={size}
      height={size}
      className={className}
    />
  );
}
```

### 4.6 Tree-Shaking Strategy

**Admin bundle** (Vite + code-splitting):
- The `@netrun-cms/icons` package re-exports individual Lucide components
- Vite's tree-shaker eliminates unused icons automatically
- Admin bundle already has `icons` as a separate vendor chunk (see CLAUDE.md)

**Production tenant sites**:
- Lucide icons used in blocks are imported directly in the block component
- `@iconify/react` loads icon data on-demand from API (no bundling of icon data)
- For SSR/SSG: pre-load specific icons at build time via `addCollection`

**Bundle size impact** (estimated at 100 admin UI icons, Lucide):
- ~8.58 KB gzip (Lucide benchmark data)
- Iconify runtime: ~15 KB gzip for `@iconify/react` package itself
- Zero additional icon data bundled (API-fetched and cached)

---

## 5. API-Based Icon Picker: Performance Analysis

### 5.1 Runtime API Approach

**When the picker is opened** by a tenant user in the CMS admin:
- Initial load: display pre-curated vertical icons (zero API calls — bundled Lucide)
- Search action: debounced Iconify API call (300ms delay, 64 results)
- API latency: ~50-100ms from Iconify's CDN (global distribution)
- Response cached by React Query for 5 minutes

**User experience**: Search results appear in under 200ms on first query for most users. No perceptible lag.

### 5.2 CDN Approach (Recommended for Production)

Iconify SVG endpoint (`/{prefix}/{icon}.svg`) is CDN-cacheable. For the icon picker preview grid, use `<img>` tags pointing to the Iconify SVG URL:

```html
<!-- Icon preview in picker grid -->
<img
  src="https://api.iconify.design/lucide/home.svg"
  width="24"
  height="24"
  loading="lazy"
  alt="home icon"
/>
```

This offloads rendering entirely to the browser's image pipeline with lazy loading. No JavaScript required for preview.

### 5.3 Performance Impact Summary

| Scenario | Strategy | Impact |
|----------|----------|--------|
| Admin UI chrome | Bundled Lucide (tree-shaken) | ~8-16 KB gzip, zero API calls |
| Vertical icon suggestions | Pre-curated Lucide list, no API | Instant (bundled) |
| Icon search in picker | Iconify REST API, React Query | 50-150ms, cached 5 min |
| Icon preview in picker | Iconify SVG CDN URLs | Lazy loaded, CDN-cached |
| Selected icon at runtime | `@iconify/react` (API or pre-loaded) | Cached after first load |
| Self-hosted option | Iconify API on Cloud Run | Same latency, private |

### 5.4 Self-Hosting Decision

| Factor | Public Iconify API | Self-Hosted (Cloud Run) |
|--------|--------------------|------------------------|
| Setup time | Zero | ~2 hours |
| Cost | Free | ~$5-10/month (Cloud Run) |
| Reliability | 99.9%+ (redundant hosts) | Depends on your infra |
| Latency | 50-100ms (global CDN) | ~10-20ms (us-central1) |
| Control | None | Full |
| Icon set updates | Automatic | Manual (`pnpm update @iconify-json/*`) |
| Recommendation | Start here | Migrate if enterprise/airgap needed |

**Recommendation**: Use the public Iconify API for the initial Sigil release. Add a self-hosted fallback URL as a config option (`ICONIFY_API_BASE` env var) to support airgapped or enterprise deployments later.

---

## 6. Recommended Implementation Plan

### Phase 1: Static Icon Layer (Sprint 1)

1. Create `packages/@netrun-cms/icons` package in the monorepo
2. Install `lucide-react` (if not already present in admin)
3. Create category files for all 10 verticals (map Lucide icons to semantic names)
4. Export an icon registry object: `{ vertical, iconName, label, tags }[]`
5. Create `VerticalIcons` component for block editors that shows a pre-curated grid

**Estimated effort**: 1 day

### Phase 2: Iconify Picker (Sprint 2)

1. Install `@iconify/react` in admin app
2. Create `useIconSearch` hook (React Query + Iconify REST API)
3. Build `IconPicker` component with two tabs (Suggested / Search All)
4. Build `IconRenderer` component for displaying stored icon references
5. Integrate picker into block editor for icon-type fields

**Estimated effort**: 2-3 days

### Phase 3: Self-Hosted API (Future / Enterprise)

1. Containerize Iconify API with selected `@iconify-json/*` sets
2. Deploy to Cloud Run in `us-central1`
3. Configure `ICONIFY_API_BASE` env var to point to self-hosted instance
4. Add to GCP shared infrastructure registry

**Estimated effort**: 4-6 hours

---

## 7. npm Package Installation Summary

```bash
# In packages/@netrun-cms/icons (new package)
pnpm add lucide-react           # Primary icon set — static layer
pnpm add @iconify/react         # Dynamic icon component — API layer
pnpm add simple-icons           # Brand logos (CC0)

# In apps/admin (if not already present)
pnpm add lucide-react           # Should already be present via Shadcn
pnpm add @tanstack/react-query  # For useIconSearch hook caching

# For self-hosted Iconify API (optional, install in API docker image)
pnpm add @iconify-json/lucide
pnpm add @iconify-json/ph
pnpm add @iconify-json/tabler
pnpm add @iconify-json/mdi
pnpm add @iconify-json/simple-icons
pnpm add @iconify-json/heroicons
pnpm add @iconify-json/ri
```

---

## 8. Key API Endpoints Quick Reference

```
# Search
GET https://api.iconify.design/search?query=home&limit=64
GET https://api.iconify.design/search?query=cart&prefix=lucide
GET https://api.iconify.design/search?query=music&prefixes=lucide,ph,tabler

# Fetch SVG directly
GET https://api.iconify.design/lucide/home.svg
GET https://api.iconify.design/mdi/shopping-cart.svg?color=%23000000&width=24

# Icon JSON data (for programmatic use)
GET https://api.iconify.design/lucide.json?icons=home,cart,music

# Discovery
GET https://api.iconify.design/collections
GET https://api.iconify.design/collection?prefix=lucide
GET https://api.iconify.design/keywords?prefix=shop

# Cache validation
GET https://api.iconify.design/last-modified?prefixes=lucide,mdi,tabler
```

---

## 9. Sources

- [Lucide React Documentation](https://lucide.dev/guide/packages/lucide-react) — ISC license, ~1,703 icons, 35M weekly downloads
- [Iconify API Documentation](https://iconify.design/docs/api/) — 185,000+ icons, 180+ sets
- [Iconify API Search Endpoint](https://iconify.design/docs/api/search.html) — Full search parameter spec
- [Iconify API Icon Data](https://iconify.design/docs/api/icon-data.html) — JSON fetch endpoint spec
- [Iconify Self-Hosting (Node.js)](https://iconify.design/docs/api/hosting-js/) — Docker + env var config
- [Iconify React Component](https://iconify.design/docs/icon-components/react/) — `@iconify/react` package
- [Iconify Individual Icon Sets](https://iconify.design/docs/icons/json.html) — `@iconify-json/*` packages
- [Phosphor Icons React](https://github.com/phosphor-icons/react) — MIT, 9,072 icons, 6 weights
- [Heroicons GitHub](https://github.com/tailwindlabs/heroicons) — MIT, `@heroicons/react`
- [Simple Icons](https://github.com/simple-icons/simple-icons) — CC0, 3,414 brand SVGs
- [Radix UI Icons](https://www.radix-ui.com/icons) — MIT, `@radix-ui/react-icons`, 252 icons
- [React Icons Bundle Size Benchmark (2026)](https://medium.com/codetodeploy/the-hidden-bundle-cost-of-react-icons-why-lucide-wins-in-2026-1ddb74c1a86c) — Lucide at 5.16 KB/50 icons
- [Iconify Icon Sets Browser](https://icon-sets.iconify.design/) — 180+ sets, 185,000+ icons
- [Iconify API GitHub](https://github.com/iconify/api) — Self-hosting source, Docker setup
- [Shadcn Icon Picker (alan-crts)](https://github.com/alan-crts/shadcn-iconpicker) — Reference implementation for picker UI

---

## Micro-Retrospective

### What Went Well
1. Iconify's API documentation was comprehensive and the search endpoint spec was fully extractable in one fetch — saved significant time vs reading through community posts.
2. Bundle size benchmark data from the 2026 Next.js/Turbopack comparison article provided concrete numbers that make the Lucide recommendation evidence-based, not opinionated.

### What Needs Improvement
1. NPM package pages returned 403 errors, requiring fallback to GitHub and web search for download counts and exact package sizes. The `@iconify/json` full package size (estimated 70-100 MB) could not be confirmed from an official source.
2. Heroicons total icon count was ambiguous — the website said 316 but GitHub indicated ~292 unique shapes across multiple size variants. Reported the range rather than a single number.

### Action Items
1. When confirmed with actual Sigil sprint: validate `@iconify-json/lucide` can be pre-loaded into `@iconify/react` via `addCollection()` in the admin app entry point to eliminate first-render API calls for the most common icons. Target: before `IconPicker` implementation begins.
2. Add `ICONIFY_API_BASE` as a documented env var to `apps/api/.env.example` from the start, even before self-hosting is implemented, so the configuration surface is established early.

### Patterns Discovered
- **Pattern**: For icon libraries, the Iconify aggregator + a single primary library (Lucide) gives optimal coverage: static performance for common admin chrome, dynamic search for everything else. Avoids the trap of installing 3-4 full icon library packages.
- **Anti-Pattern**: Storing raw SVG strings in the database for user-selected icons — reference strings (`"lucide:home"`) are portable, searchable, and renderable by the Iconify runtime without schema changes.

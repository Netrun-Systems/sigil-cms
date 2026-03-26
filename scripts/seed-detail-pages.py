#!/usr/bin/env python3
"""
Seed 43 detail pages for Sigil CMS features and plugins.
Each page gets: hero block + text block + optional feature_grid + cta block.

Usage:
  python3 scripts/seed-detail-pages.py > seed-detail-pages.sql
  # or pipe directly:
  python3 scripts/seed-detail-pages.py | PGPASSWORD=... psql -h localhost -U postgres -d sigil
"""

import json
import uuid
import textwrap

SITE_ID = "602e8c07-496f-42a8-a399-5cb71bf3afb4"
FEATURES_PAGE_ID = "55b94497-30b0-4387-9e11-90fbd4c63f7c"
PLUGINS_PAGE_ID = "eff2cd30-520c-4230-a38c-ba2601c30f07"


def sql_str(s):
    """Escape single quotes for SQL."""
    return s.replace("'", "''")


def emit_page(title, slug, full_path, parent_id, sort_order, meta_desc):
    """Return (page_id, SQL) for a cms_pages INSERT."""
    page_id = str(uuid.uuid4())
    meta_desc_truncated = meta_desc[:160] if meta_desc else None
    meta_title = title[:60] if title else None
    sql = (
        f"INSERT INTO cms_pages (id, site_id, parent_id, title, slug, full_path, status, published_at, language, template, sort_order, meta_title, meta_description) VALUES (\n"
        f"  '{page_id}', '{SITE_ID}', '{parent_id}', '{sql_str(title)}', '{sql_str(slug)}', '{sql_str(full_path)}',\n"
        f"  'published', NOW(), 'en', 'default', {sort_order},\n"
        f"  '{sql_str(meta_title)}', '{sql_str(meta_desc_truncated)}'\n"
        f");\n"
    )
    return page_id, sql


def emit_block(page_id, block_type, content, sort_order, settings=None):
    """Return SQL for a cms_content_blocks INSERT."""
    block_id = str(uuid.uuid4())
    content_json = sql_str(json.dumps(content, ensure_ascii=False))
    settings_json = sql_str(json.dumps(settings or {}, ensure_ascii=False))
    return (
        f"INSERT INTO cms_content_blocks (id, page_id, block_type, content, sort_order, is_visible, settings) VALUES (\n"
        f"  '{block_id}', '{page_id}', '{block_type}',\n"
        f"  '{content_json}'::jsonb, {sort_order}, true,\n"
        f"  '{settings_json}'::jsonb\n"
        f");\n"
    )


# =============================================================================
# FEATURE DETAIL PAGES (21)
# =============================================================================

FEATURE_PAGES = [
    {
        "slug": "hero-block",
        "title": "Hero Block",
        "headline": "Hero Block",
        "subheadline": "Full-width sections with headlines, CTAs, and background images.",
        "meta": "Hero Block in Sigil CMS: full-width sections with headline, subheadline, background images, dual CTAs, and alignment control.",
        "text": textwrap.dedent("""\
## What It Does

The Hero Block is the primary visual anchor for any landing page. It renders a full-width section with a headline, subheadline, optional background image, and up to two call-to-action buttons. Heroes support left, center, and right text alignment, and the background can be a solid color, gradient, or image with an overlay.

Every page template in Sigil starts with a Hero Block by default. It's the first block visitors see and sets the visual tone for the rest of the page.

## How to Use It

1. Navigate to **Pages** in the admin sidebar and open the page you want to edit.
2. Click **Add Block** and select **Hero** from the block picker.
3. Fill in the fields:
   - **Headline** — the primary text (rendered as `<h1>`).
   - **Subheadline** — secondary text below the headline.
   - **Background Image** — paste an image URL or select from the media library.
   - **Primary CTA** — button text and link URL.
   - **Secondary CTA** — optional second button with text and link.
   - **Alignment** — left, center, or right.
4. Click **Save** to publish your changes.

## Configuration Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `headline` | string | — | Main heading text |
| `subheadline` | string | — | Supporting text |
| `backgroundImage` | URL | — | Background image URL |
| `backgroundColor` | CSS color | `#1a1a2e` | Fallback background color |
| `overlay` | number (0-1) | `0.5` | Dark overlay opacity on image |
| `alignment` | enum | `center` | Text alignment: left, center, right |
| `primaryCta.text` | string | — | Primary button label |
| `primaryCta.link` | URL | — | Primary button destination |
| `secondaryCta.text` | string | — | Secondary button label |
| `secondaryCta.link` | URL | — | Secondary button destination |

## Example Use Cases

- **Landing page hero** with a product screenshot background and "Get Started" CTA.
- **Event announcement** with date, venue in the subheadline, and a "Register" button.
- **Artist portfolio** with a moody background image, name as headline, and "Listen Now" linking to Spotify.
"""),
    },
    {
        "slug": "text-blocks",
        "title": "Text & Rich Text",
        "headline": "Text & Rich Text",
        "subheadline": "Markdown, HTML, and plain text content blocks with flexible formatting.",
        "meta": "Text blocks in Sigil CMS: Markdown, HTML, and plain text with heading levels, inline code, and rich formatting options.",
        "text": textwrap.dedent("""\
## What It Does

The Text Block renders rich content using Markdown, raw HTML, or plain text. It's the workhorse block for body content — articles, descriptions, documentation, and any long-form writing. The block supports heading levels (h1-h6), bold, italic, links, inline code, code fences, blockquotes, ordered/unordered lists, and embedded images via Markdown syntax.

The renderer converts Markdown to HTML at render time, so you write in Markdown but visitors see fully styled content.

## How to Use It

1. Open a page in the admin editor.
2. Click **Add Block** and select **Text**.
3. Choose the format:
   - **Markdown** (default) — write using standard Markdown syntax.
   - **HTML** — paste raw HTML for full control.
   - **Plain** — no formatting, rendered as `<p>` tags.
4. Enter your content in the editor area.
5. Use the **Preview** toggle to see rendered output before saving.

## Configuration Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `body` | string | — | The content text |
| `format` | enum | `markdown` | Rendering format: `markdown`, `html`, `plain` |
| `headingLevel` | number | — | Override starting heading level (1-6) |
| `maxWidth` | string | `prose` | Content width: `prose` (65ch), `full`, or CSS value |

## Tips

- Use `---` for horizontal rules between sections.
- Inline code with backticks renders with the theme's monospace font.
- Markdown images (`![alt](url)`) are rendered as responsive `<img>` tags with lazy loading.
- For documentation pages, use heading levels consistently — the renderer generates anchor IDs for deep linking.

## Example Use Cases

- **Blog posts** — write articles with headings, images, and code samples.
- **Service descriptions** — explain what you offer with formatted lists and CTAs.
- **Legal pages** — terms of service, privacy policy with heading structure.
"""),
    },
    {
        "slug": "feature-grid",
        "title": "Feature Grid",
        "headline": "Feature Grid",
        "subheadline": "Configurable card grids for showcasing services, features, and capabilities.",
        "meta": "Feature Grid block in Sigil CMS: configurable columns, icons, images, titles, descriptions, and links for showcasing capabilities.",
        "text": textwrap.dedent("""\
## What It Does

The Feature Grid block displays a responsive grid of cards, each with an optional icon, image, title, description, and link. It's designed for showcasing a list of services, product features, team members, or any collection of items that benefit from a card layout. The grid supports 1-4 columns and automatically stacks on mobile.

## How to Use It

1. Open a page and click **Add Block** > **Feature Grid**.
2. Set the **Columns** count (1-4). This controls how many cards appear per row on desktop.
3. Set an optional **Headline** that renders above the grid.
4. For each feature card, fill in:
   - **Title** — card heading.
   - **Description** — short text (1-2 sentences).
   - **Icon** — Lucide icon name (e.g., `star`, `shield`, `zap`). See [lucide.dev/icons](https://lucide.dev/icons) for the full list.
   - **Image** — optional card image URL (displayed above the title).
   - **Link** — optional URL the card links to.
5. Use the drag handles to reorder cards.
6. Save the block.

## Configuration Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `headline` | string | — | Section heading above the grid |
| `columns` | number | `3` | Cards per row (1-4) |
| `features` | array | `[]` | Array of feature objects |
| `features[].title` | string | — | Card title |
| `features[].description` | string | — | Card description |
| `features[].icon` | string | — | Lucide icon name |
| `features[].image` | URL | — | Card image |
| `features[].link` | URL | — | Card link destination |

## Example Use Cases

- **SaaS features page** — 3-column grid of product capabilities with icons.
- **Team page** — 4-column grid with headshots as images, names as titles, roles as descriptions.
- **Services listing** — 2-column grid linking to individual service detail pages.
"""),
    },
    {
        "slug": "pricing-table",
        "title": "Pricing Table",
        "headline": "Pricing Table",
        "subheadline": "Tiered pricing cards with feature checklists and call-to-action buttons.",
        "meta": "Pricing Table block in Sigil CMS: horizontal tier cards, popular badge, feature checklists, CTA per tier, annual/monthly toggle.",
        "text": textwrap.dedent("""\
## What It Does

The Pricing Table block renders horizontal pricing tier cards, each with a name, price, feature checklist, and call-to-action button. One tier can be marked as "popular" to receive visual emphasis (highlighted border and badge). The block supports both monthly and annual pricing with a toggle switch.

## How to Use It

1. Open a page and click **Add Block** > **Pricing Table**.
2. For each pricing tier, add:
   - **Name** — tier label (e.g., "Starter", "Pro", "Enterprise").
   - **Monthly Price** — the monthly rate (e.g., "$9/mo").
   - **Annual Price** — optional discounted annual rate (e.g., "$90/yr").
   - **Features** — checklist of included features (one per line).
   - **CTA Text** — button label (e.g., "Get Started").
   - **CTA Link** — button destination URL.
   - **Popular** — toggle to highlight this tier.
3. Save the block.

## Configuration Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `tiers` | array | `[]` | Array of tier objects |
| `tiers[].name` | string | — | Tier name |
| `tiers[].monthlyPrice` | string | — | Monthly price display |
| `tiers[].annualPrice` | string | — | Annual price display |
| `tiers[].features` | string[] | `[]` | Feature checklist items |
| `tiers[].ctaText` | string | — | Button text |
| `tiers[].ctaLink` | URL | — | Button URL |
| `tiers[].popular` | boolean | `false` | Highlight this tier |
| `showToggle` | boolean | `true` | Show monthly/annual toggle |

## Example Use Cases

- **SaaS pricing page** — three tiers (Free, Pro, Enterprise) with "Pro" marked popular.
- **Service packages** — Bronze/Silver/Gold consulting packages with feature lists.
- **Membership levels** — community membership tiers with different access levels.
"""),
    },
    {
        "slug": "gallery",
        "title": "Gallery",
        "headline": "Gallery",
        "subheadline": "Image galleries with grid and masonry layouts, lightbox zoom, and captions.",
        "meta": "Gallery block in Sigil CMS: grid and masonry layouts, lightbox zoom, captions, lazy loading, and responsive images.",
        "text": textwrap.dedent("""\
## What It Does

The Gallery block displays a collection of images in either a uniform grid or a masonry (Pinterest-style) layout. Each image can have a caption, alt text, and clicking opens a full-screen lightbox with navigation arrows. Images are lazy-loaded for performance and automatically generate responsive srcsets.

## How to Use It

1. Open a page and click **Add Block** > **Gallery**.
2. Choose the layout: **Grid** (uniform cells) or **Masonry** (variable height).
3. Set columns (2-6).
4. Add images:
   - Upload via the media library or paste URLs.
   - Add **Caption** and **Alt Text** for each image.
5. Enable or disable **Lightbox** (enabled by default).
6. Save the block.

## Configuration Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `layout` | enum | `grid` | `grid` or `masonry` |
| `columns` | number | `3` | Columns per row (2-6) |
| `images` | array | `[]` | Array of image objects |
| `images[].url` | URL | — | Image source URL |
| `images[].caption` | string | — | Caption text |
| `images[].alt` | string | — | Alt text for accessibility |
| `lightbox` | boolean | `true` | Enable click-to-zoom lightbox |
| `gap` | string | `1rem` | Gap between images |

## Example Use Cases

- **Photography portfolio** — masonry layout with lightbox for full-resolution viewing.
- **Product gallery** — grid layout showing product photos from different angles.
- **Event recap** — grid of event photos with captions describing each moment.
"""),
    },
    {
        "slug": "cta-forms",
        "title": "CTA & Contact Forms",
        "headline": "CTA & Contact Forms",
        "subheadline": "Call-to-action sections and configurable forms with field types and validation.",
        "meta": "CTA and Contact Forms in Sigil CMS: call-to-action sections plus configurable forms with field types, validation, and submission API.",
        "text": textwrap.dedent("""\
## What It Does

The CTA block renders a focused call-to-action section with a headline, description, and button. It's designed to drive conversions — sign-ups, purchases, or navigation to key pages.

The Contact Form variant extends this with a configurable form that supports text, email, textarea, select, and checkbox fields. Submissions are stored in the database and optionally forwarded via email through the Contact plugin.

## How to Use It

### CTA Block
1. Open a page and click **Add Block** > **CTA**.
2. Fill in:
   - **Headline** — the action-driving heading.
   - **Description** — supporting text.
   - **Button Text** and **Button Link** — the primary action.
3. Save.

### Contact Form Block
1. Click **Add Block** > **Contact Form**.
2. Define form fields:
   - **Label** — field name shown to users.
   - **Type** — `text`, `email`, `textarea`, `select`, `checkbox`.
   - **Required** — toggle validation.
   - **Placeholder** — hint text.
   - **Options** — for select fields, comma-separated values.
3. Set **Submit Button Text** (default: "Send").
4. Optionally set **Success Message** (default: "Thank you for your message!").
5. Save.

## Configuration Options (CTA)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `headline` | string | — | CTA heading |
| `description` | string | — | Supporting text |
| `buttonText` | string | — | Button label |
| `buttonLink` | URL | — | Button destination |
| `style` | enum | `default` | Visual style: `default`, `highlight`, `minimal` |

## Configuration Options (Contact Form)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `fields` | array | `[]` | Form field definitions |
| `fields[].label` | string | — | Field label |
| `fields[].type` | enum | `text` | Field type |
| `fields[].required` | boolean | `false` | Validation flag |
| `submitText` | string | `"Send"` | Submit button label |
| `successMessage` | string | `"Thank you!"` | Post-submit message |

## Submission API

Form submissions POST to `/api/public/sites/:siteId/contact` with the field values as JSON. The Contact plugin must be enabled for email forwarding.

## Example Use Cases

- **Newsletter sign-up** — CTA block with "Subscribe" linking to a mailing list form.
- **Contact page** — form with name, email, message fields and a success confirmation.
- **Demo request** — form with company name, size (select), and message fields.
"""),
    },
    {
        "slug": "faq",
        "title": "FAQ",
        "headline": "FAQ",
        "subheadline": "Accordion-style FAQ sections with structured data for SEO.",
        "meta": "FAQ block in Sigil CMS: accordion collapse, schema.org structured data for SEO, and Markdown support in answers.",
        "text": textwrap.dedent("""\
## What It Does

The FAQ block renders a list of questions and answers in an accordion layout — click a question to expand its answer. The block automatically generates `schema.org/FAQPage` structured data, which helps search engines display your FAQ directly in search results as rich snippets.

Answers support Markdown formatting, so you can include links, bold text, code, and lists within each answer.

## How to Use It

1. Open a page and click **Add Block** > **FAQ**.
2. Add question/answer pairs:
   - **Question** — the question text (rendered as the accordion header).
   - **Answer** — the answer text in Markdown format.
3. Reorder questions using the drag handles.
4. Save. The structured data is generated automatically on render.

## Configuration Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `items` | array | `[]` | Array of Q&A objects |
| `items[].question` | string | — | Question text |
| `items[].answer` | string | — | Answer in Markdown |
| `allowMultiple` | boolean | `false` | Allow multiple items open simultaneously |
| `defaultOpen` | number | — | Index of item open by default |
| `schemaOrg` | boolean | `true` | Generate FAQPage structured data |

## SEO Benefits

When `schemaOrg` is enabled (default), the renderer injects a `<script type="application/ld+json">` tag with `FAQPage` schema. Google and Bing use this to display expandable FAQ rich results directly in search.

## Example Use Cases

- **Product FAQ** — answer common questions about pricing, features, and support.
- **Event FAQ** — parking, dress code, refund policy, accessibility info.
- **Service FAQ** — explain processes, timelines, and deliverables.
"""),
    },
    {
        "slug": "timeline",
        "title": "Timeline",
        "headline": "Timeline",
        "subheadline": "Chronological milestones with alternating left/right layout.",
        "meta": "Timeline block in Sigil CMS: chronological milestones, left/right alternating layout, dates, and descriptions.",
        "text": textwrap.dedent("""\
## What It Does

The Timeline block displays a series of chronological events along a vertical line. Events alternate between left and right sides (on desktop) and stack vertically on mobile. Each event has a date, title, and description. The block is ideal for company history, project milestones, or any sequential narrative.

## How to Use It

1. Open a page and click **Add Block** > **Timeline**.
2. Add events:
   - **Date** — displayed as a badge on the timeline (free-form text: "2024", "March 2025", "Q1 2026", etc.).
   - **Title** — event heading.
   - **Description** — event details (supports Markdown).
3. Events render in the order you add them (top = earliest).
4. Save.

## Configuration Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `events` | array | `[]` | Array of event objects |
| `events[].date` | string | — | Date label |
| `events[].title` | string | — | Event title |
| `events[].description` | string | — | Event description (Markdown) |
| `layout` | enum | `alternating` | `alternating`, `left`, or `right` |
| `lineColor` | CSS color | theme accent | Color of the vertical line |

## Example Use Cases

- **Company history** — founding, funding rounds, product launches, milestones.
- **Project roadmap** — past achievements and upcoming planned milestones.
- **Personal portfolio** — career timeline with roles and accomplishments.
"""),
    },
    {
        "slug": "stats-bar",
        "title": "Stats Bar",
        "headline": "Stats Bar",
        "subheadline": "Horizontal counter display with animated counting and custom labels.",
        "meta": "Stats Bar block in Sigil CMS: horizontal counter display, animated counting, custom labels and values.",
        "text": textwrap.dedent("""\
## What It Does

The Stats Bar renders a horizontal row of key metrics with large numbers and descriptive labels. When the block scrolls into view, the numbers animate from zero to their target value (count-up animation). It's designed for social proof — showing visitor counts, customers served, years in business, or any impressive numeric.

## How to Use It

1. Open a page and click **Add Block** > **Stats Bar**.
2. Add stat items:
   - **Value** — the target number (e.g., "500", "99.9%", "$1M+").
   - **Label** — description below the number (e.g., "Happy Customers").
   - **Prefix** — optional character before the number (e.g., "$", "#").
   - **Suffix** — optional character after the number (e.g., "%", "+", "K").
3. Save.

## Configuration Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `stats` | array | `[]` | Array of stat objects |
| `stats[].value` | string | — | Target number |
| `stats[].label` | string | — | Description label |
| `stats[].prefix` | string | — | Prefix character |
| `stats[].suffix` | string | — | Suffix character |
| `animate` | boolean | `true` | Enable count-up animation |
| `duration` | number | `2000` | Animation duration in ms |

## Example Use Cases

- **Company overview** — "25 Years Experience | 500+ Projects | 99.9% Uptime".
- **SaaS metrics** — "10K Users | 50M API Calls | 99.95% SLA".
- **Event stats** — "3 Days | 42 Speakers | 1200 Attendees".
"""),
    },
    {
        "slug": "testimonials",
        "title": "Testimonials",
        "headline": "Testimonials",
        "subheadline": "Customer quotes with avatars, names, roles, and grid or carousel display.",
        "meta": "Testimonials block in Sigil CMS: customer quotes, avatar images, name/role/company, grid or carousel layout.",
        "text": textwrap.dedent("""\
## What It Does

The Testimonials block displays customer or client quotes in either a grid or carousel layout. Each testimonial includes a quote, person's name, role, company, and optional avatar image. The carousel variant auto-rotates with navigation dots.

## How to Use It

1. Open a page and click **Add Block** > **Testimonials**.
2. Choose layout: **Grid** or **Carousel**.
3. Add testimonials:
   - **Quote** — the testimonial text.
   - **Name** — person's name.
   - **Role** — their title/position.
   - **Company** — their organization.
   - **Avatar** — optional headshot URL.
4. Save.

## Configuration Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `layout` | enum | `grid` | `grid` or `carousel` |
| `columns` | number | `3` | Grid columns (2-4) |
| `testimonials` | array | `[]` | Array of testimonial objects |
| `testimonials[].quote` | string | — | Testimonial text |
| `testimonials[].name` | string | — | Person's name |
| `testimonials[].role` | string | — | Title/position |
| `testimonials[].company` | string | — | Organization |
| `testimonials[].avatar` | URL | — | Headshot image |
| `autoRotate` | boolean | `true` | Auto-rotate carousel |
| `rotateInterval` | number | `5000` | Ms between carousel slides |

## Example Use Cases

- **Landing page social proof** — three customer quotes in a grid.
- **Case study page** — carousel of quotes from the project team.
- **Service page** — client testimonials relevant to that specific service.
"""),
    },
    {
        "slug": "bento-grid",
        "title": "Bento Grid",
        "headline": "Bento Grid",
        "subheadline": "Visual layout presets with configurable column spans per item.",
        "meta": "Bento Grid block in Sigil CMS: visual layout presets (2-col, 3-col, featured-left, featured-right), column span per item.",
        "text": textwrap.dedent("""\
## What It Does

The Bento Grid block creates visually interesting asymmetric layouts inspired by Apple's "bento box" design pattern. Instead of uniform cards, items can span multiple columns, creating a dynamic visual hierarchy. Presets include 2-column, 3-column, featured-left (one large item + two small), and featured-right layouts.

## How to Use It

1. Open a page and click **Add Block** > **Bento Grid**.
2. Choose a **Preset**:
   - **2-col** — two equal columns.
   - **3-col** — three equal columns.
   - **featured-left** — left item spans 2 columns, right column has 2 stacked items.
   - **featured-right** — mirror of featured-left.
3. Add items (each item has):
   - **Title** — item heading.
   - **Description** — item text.
   - **Image** — background or top image.
   - **Span** — column span override (1-3).
4. Save.

## Configuration Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `preset` | enum | `3-col` | Layout preset |
| `items` | array | `[]` | Array of bento items |
| `items[].title` | string | — | Item title |
| `items[].description` | string | — | Item description |
| `items[].image` | URL | — | Item image |
| `items[].span` | number | `1` | Column span (1-3) |
| `gap` | string | `1rem` | Gap between items |

## Example Use Cases

- **Product overview** — featured-left with hero product image, smaller detail cards on right.
- **Dashboard preview** — 3-col bento showing different UI screenshots.
- **Service categories** — asymmetric layout emphasizing the primary service.
"""),
    },
    {
        "slug": "code-block",
        "title": "Code Block",
        "headline": "Code Block",
        "subheadline": "Syntax-highlighted code snippets with language labels and copy button.",
        "meta": "Code Block in Sigil CMS: syntax highlighting, language label, copy button, line numbers, and theme-aware colors.",
        "text": textwrap.dedent("""\
## What It Does

The Code Block renders syntax-highlighted code snippets with a language label, optional line numbers, and a one-click copy button. It supports all major languages via Prism.js and respects the site's light/dark theme for color schemes.

## How to Use It

1. Open a page and click **Add Block** > **Code Block**.
2. Select the **Language** from the dropdown (e.g., `javascript`, `python`, `bash`, `sql`, `typescript`, `html`, `css`, `json`, `yaml`).
3. Paste your code into the **Code** field.
4. Optionally set:
   - **Title** — a label above the code block (e.g., "Install dependencies").
   - **Line Numbers** — toggle on to show line numbers.
   - **Highlight Lines** — comma-separated line numbers to highlight (e.g., "3,7-9").
5. Save.

## Configuration Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `code` | string | — | The code content |
| `language` | string | `text` | Programming language for highlighting |
| `title` | string | — | Optional title/filename above the block |
| `lineNumbers` | boolean | `false` | Show line numbers |
| `highlightLines` | string | — | Lines to highlight (e.g., "3,7-9") |
| `copyButton` | boolean | `true` | Show copy-to-clipboard button |

## Supported Languages

The renderer includes Prism.js with support for: `javascript`, `typescript`, `python`, `bash`, `shell`, `sql`, `html`, `css`, `json`, `yaml`, `toml`, `markdown`, `go`, `rust`, `java`, `csharp`, `php`, `ruby`, `swift`, `kotlin`, `dockerfile`, `terraform`, `graphql`, and more.

## Example Use Cases

- **Documentation** — show API request examples with `bash` or `javascript`.
- **Tutorial pages** — step-by-step code with highlighted key lines.
- **Changelog** — display configuration snippets in `yaml` or `json`.
"""),
    },
    {
        "slug": "multi-tenancy",
        "title": "Multi-Tenancy",
        "headline": "Multi-Tenancy",
        "subheadline": "One deployment, unlimited sites. Full tenant isolation with row-level security.",
        "meta": "Multi-tenancy in Sigil CMS: tenant isolation, row-level security, one deployment for unlimited sites, tenant provisioning API.",
        "text": textwrap.dedent("""\
## What It Does

Sigil is built as a multi-tenant platform from the ground up. Every table in the database is scoped by `tenant_id` and `site_id`, and PostgreSQL Row-Level Security (RLS) policies ensure that one tenant's data is completely invisible to another. A single deployment of Sigil can host hundreds of independent sites.

Tenants get their own sites, pages, blocks, media, users, and settings. There is no data leakage between tenants — even if a bug occurs in application code, the database-level RLS policies act as a safety net.

## How It Works

1. **Tenant Provisioning** — create a new tenant via the admin API:
   ```
   POST /api/admin/tenants
   { "name": "Acme Corp", "slug": "acme" }
   ```
2. **Site Creation** — each tenant can have multiple sites:
   ```
   POST /api/admin/sites
   { "tenantId": "...", "name": "Marketing Site", "slug": "marketing" }
   ```
3. **Automatic Scoping** — all queries include `WHERE site_id = :siteId`, and RLS policies enforce tenant boundaries at the database level.

## Configuration Options

| Setting | Location | Description |
|---------|----------|-------------|
| `TENANT_ISOLATION` | env | `strict` (RLS enforced) or `application` (app-level only) |
| RLS policies | database | Automatically applied via Drizzle migrations |
| Tenant API | `/api/admin/tenants` | CRUD operations for tenant management |
| Site API | `/api/admin/sites` | CRUD operations for site management |

## Key Tables

- `cms_tenants` — tenant registry (name, slug, plan, settings).
- `cms_sites` — sites within a tenant (name, domain, theme, status).
- All content tables (`cms_pages`, `cms_content_blocks`, `cms_media`) reference `site_id`.

## Example Use Cases

- **Agency model** — one Sigil deployment for all client sites, each fully isolated.
- **SaaS platform** — self-service tenant onboarding where customers create their own sites.
- **Enterprise** — internal sites for different departments, all managed centrally.
"""),
    },
    {
        "slug": "i18n",
        "title": "Internationalization",
        "headline": "Internationalization",
        "subheadline": "Multi-language content with per-page variants and automatic fallback.",
        "meta": "Internationalization in Sigil CMS: per-page language variants, language switcher, fallback chain, RTL support.",
        "text": textwrap.dedent("""\
## What It Does

Sigil supports multi-language content at the page level. Each page can have variants in different languages, sharing the same slug but with a different `language` field. The renderer automatically serves the correct variant based on the visitor's browser language or a URL prefix (`/es/about`, `/fr/about`).

If a page variant doesn't exist in the requested language, the fallback chain returns the default language (usually `en`).

## How to Use It

1. Open a page in the admin editor.
2. Click the **Language** dropdown in the page settings panel.
3. Select **Add Translation** and choose the target language.
4. A new variant is created with the same slug. Edit the title, meta, and all blocks in the target language.
5. The language switcher component automatically appears on the rendered page when multiple variants exist.

## Configuration Options

| Setting | Location | Description |
|---------|----------|-------------|
| `language` | page field | ISO 639-1 code: `en`, `es`, `fr`, `de`, `ja`, `ar`, etc. |
| `defaultLanguage` | site settings | Fallback language (default: `en`) |
| `supportedLanguages` | site settings | Array of enabled language codes |
| URL prefix | renderer | `/es/`, `/fr/` prefix routing for language variants |
| `rtl` | automatic | RTL layout applied for `ar`, `he`, `fa`, `ur` language codes |

## Database Structure

Pages use a composite unique constraint: `(site_id, slug, language)`. This means the same slug can exist multiple times — once per language. The `full_path` column includes the language prefix for non-default languages.

## Example Use Cases

- **International business** — English and Spanish versions of all pages.
- **Documentation** — technical docs translated by the community.
- **E-commerce** — localized product descriptions and pricing pages.
"""),
    },
    {
        "slug": "custom-domains",
        "title": "Custom Domains",
        "headline": "Custom Domains",
        "subheadline": "Map any domain to any site with automatic SSL provisioning.",
        "meta": "Custom domains in Sigil CMS: domain mapping, automatic SSL, subdomain routing (tenant.sigil.netrunsystems.com).",
        "text": textwrap.dedent("""\
## What It Does

Sigil supports custom domain mapping so each site can be accessed via its own domain (e.g., `www.example.com`) instead of a tenant subdomain. The system handles SSL certificate provisioning, DNS validation, and domain-to-site routing automatically.

By default, every site is accessible at `{tenant}.sigil.netrunsystems.com`. Custom domains add a CNAME record pointing to Sigil's ingress, and the platform routes requests to the correct site based on the `Host` header.

## How to Use It

1. Go to **Sites** > your site > **Settings** > **Custom Domain**.
2. Enter the domain (e.g., `www.example.com`).
3. Sigil displays a CNAME record to add to your DNS:
   ```
   CNAME www.example.com -> ingress.sigil.netrunsystems.com
   ```
4. Click **Verify DNS** — Sigil checks the CNAME record.
5. Once verified, SSL is provisioned automatically via Let's Encrypt.
6. The site is now accessible at `https://www.example.com`.

## Configuration Options

| Setting | Location | Description |
|---------|----------|-------------|
| `customDomain` | site settings | The custom domain name |
| `sslStatus` | site settings | `pending`, `provisioning`, `active`, `failed` |
| `dnsVerified` | site settings | Whether DNS CNAME is verified |
| Default subdomain | automatic | `{tenant-slug}.sigil.netrunsystems.com` |

## DNS Setup

| Record Type | Name | Value |
|-------------|------|-------|
| CNAME | `www` | `ingress.sigil.netrunsystems.com` |
| CNAME | `@` (root) | Use a CNAME-flattening provider or ALIAS record |

## Example Use Cases

- **Client sites** — agency deploys client sites, each on the client's own domain.
- **Personal brand** — `www.janedoe.com` pointing to a Sigil-hosted portfolio.
- **Product microsites** — `launch.product.com` for a product launch landing page.
"""),
    },
    {
        "slug": "revisions",
        "title": "Page Revisions",
        "headline": "Page Revisions",
        "subheadline": "Version history for every page with one-click rollback.",
        "meta": "Page revisions in Sigil CMS: version history, diff view, one-click rollback, revision notes, changed-by tracking.",
        "text": textwrap.dedent("""\
## What It Does

Every time a page is saved, Sigil creates a revision snapshot. The revision system stores the complete page state (all blocks, settings, and metadata) so you can view the history, compare versions, and roll back to any previous state with one click.

Revisions track who made the change and when, making it easy to audit content changes across a team.

## How to Use It

1. Open a page in the admin editor.
2. Click the **Revisions** tab in the right sidebar.
3. You'll see a chronological list of revisions with:
   - **Timestamp** — when the revision was created.
   - **Changed By** — the user who made the change.
   - **Note** — optional revision note (you can add one when saving).
4. Click a revision to see the **Diff View** — a side-by-side comparison with the current version.
5. Click **Restore** to roll back to that revision.

## Configuration Options

| Setting | Location | Description |
|---------|----------|-------------|
| `maxRevisions` | site settings | Maximum revisions kept per page (default: 50) |
| `revisionNote` | save dialog | Optional note when saving a page |
| Revision API | `/api/admin/pages/:id/revisions` | List, view, and restore revisions |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/pages/:id/revisions` | List all revisions for a page |
| GET | `/api/admin/pages/:id/revisions/:revId` | Get a specific revision's content |
| POST | `/api/admin/pages/:id/revisions/:revId/restore` | Restore a revision |

## Example Use Cases

- **Content team** — editor makes a mistake, rolls back to the previous version in seconds.
- **A/B testing** — save variant A, modify to variant B, compare performance, restore whichever wins.
- **Compliance** — audit trail of all content changes with timestamps and authors.
"""),
    },
    {
        "slug": "roles",
        "title": "Role-Based Access",
        "headline": "Role-Based Access",
        "subheadline": "Admin, editor, author, and viewer roles with per-site permissions.",
        "meta": "Role-based access in Sigil CMS: admin/editor/author/viewer roles, per-site permissions, plan-based feature gating.",
        "text": textwrap.dedent("""\
## What It Does

Sigil implements role-based access control (RBAC) at the site level. Each user is assigned a role that determines what they can see and do in the admin panel. Roles cascade from most to least privileged: Admin > Editor > Author > Viewer.

Plan-based feature gating layers on top of RBAC — certain features (like custom domains or advanced analytics) are only available on higher-tier subscription plans.

## Role Definitions

| Role | Pages | Blocks | Media | Users | Settings | Plugins |
|------|-------|--------|-------|-------|----------|---------|
| **Admin** | Full CRUD | Full CRUD | Full CRUD | Manage | Full | Configure |
| **Editor** | Full CRUD | Full CRUD | Full CRUD | View | View | View |
| **Author** | Own pages only | Own blocks | Upload only | — | — | — |
| **Viewer** | Read only | Read only | Read only | — | — | — |

## How to Use It

1. Go to **Settings** > **Users** in the admin sidebar.
2. Click **Invite User** and enter their email.
3. Select the **Role** from the dropdown.
4. The user receives an email invitation and creates their account.
5. To change a role, click the user and select a new role from the dropdown.

## Configuration Options

| Setting | Location | Description |
|---------|----------|-------------|
| User roles | admin panel | Assign per user per site |
| Plan gating | subscription | Features locked behind plan tiers |
| API auth | JWT + role claim | Every API request validates role permissions |
| Middleware | `requireRole('editor')` | Express middleware for route protection |

## API Authentication

All admin API routes require a valid JWT with a `role` claim. The middleware chain:
1. `authenticate` — validates JWT signature and expiry.
2. `requireRole(minimumRole)` — checks the user's role meets the minimum.
3. `scopeToSite` — ensures the user has access to the requested site.

## Example Use Cases

- **Agency** — admins manage all client sites; clients get editor access to their own site only.
- **Blog team** — authors write drafts, editors review and publish, admins manage settings.
- **Enterprise** — department heads as editors, C-suite as viewers for read-only dashboards.
"""),
    },
    {
        "slug": "design-playground",
        "title": "Design Playground",
        "headline": "Design Playground",
        "subheadline": "70+ Google Fonts, custom uploads, button shapes, shadows, spacing, and live preview.",
        "meta": "Design Playground in Sigil CMS: 70+ Google Fonts, custom font upload, button shapes, shadows, spacing, live preview, CSS export.",
        "text": textwrap.dedent("""\
## What It Does

The Design Playground is an interactive visual editor for your site's design tokens. Instead of editing CSS by hand, you adjust fonts, colors, spacing, button shapes, and shadows through a GUI — and see the results in real time via a live preview panel.

Changes are saved as theme tokens and compiled into CSS variables that cascade through all blocks and pages. You can also export the generated CSS for use outside Sigil.

## How to Use It

1. Go to **Design** in the admin sidebar to open the Design Playground.
2. Sections available:
   - **Typography** — select heading and body fonts from 70+ Google Fonts, or upload your own `.woff2` / `.ttf` files. Set font sizes, weights, and line heights.
   - **Colors** — primary, secondary, accent, background, and text colors. Adjust via color picker or hex input.
   - **Buttons** — border radius (sharp, rounded, pill), padding, hover effects, shadow.
   - **Spacing** — base spacing unit, section padding, block gaps.
   - **Shadows** — shadow presets (none, subtle, medium, dramatic) or custom CSS shadow.
3. The **Live Preview** panel on the right updates as you make changes.
4. Click **Save Theme** to apply changes to the live site.
5. Optionally click **Export CSS** to download the generated CSS variables.

## Font Options

The font picker includes 70+ curated Google Fonts organized by category:
- **Sans-serif**: Inter, Open Sans, Roboto, Montserrat, Poppins, Nunito, Source Sans 3, Outfit, ...
- **Serif**: Playfair Display, Merriweather, Lora, EB Garamond, Cormorant Garamond, ...
- **Monospace**: JetBrains Mono, Fira Code, Source Code Pro, IBM Plex Mono, ...
- **Display**: Oswald, Bebas Neue, Archivo Black, Righteous, ...
- **Custom**: Upload your own `.woff2` or `.ttf` files.

## Theme Tokens

Tokens are stored as JSON in the `cms_themes` table and compiled to CSS variables:

```css
:root {
  --font-heading: 'Playfair Display', serif;
  --font-body: 'Inter', sans-serif;
  --color-primary: #90b9ab;
  --color-background: #0a0a1a;
  --radius-button: 8px;
  --shadow-card: 0 2px 8px rgba(0,0,0,0.15);
  /* ... 40+ more tokens */
}
```

## Example Use Cases

- **Brand consistency** — set your brand fonts and colors once, applied everywhere.
- **Client handoff** — non-technical clients adjust design without touching code.
- **A/B testing** — create two theme variants and compare conversion rates.
"""),
    },
    {
        "slug": "storage",
        "title": "Multi-Cloud Storage",
        "headline": "Multi-Cloud Storage",
        "subheadline": "GCS, Azure Blob, and S3 backends with auto-detection and AI curation.",
        "meta": "Multi-cloud storage in Sigil CMS: GCS, Azure Blob, S3 backends, auto-detection from env vars, photo curation with AI.",
        "text": textwrap.dedent("""\
## What It Does

Sigil's storage layer supports three cloud storage backends: Google Cloud Storage (GCS), Azure Blob Storage, and Amazon S3. The system auto-detects which backend to use based on environment variables — no code changes needed to switch providers. The Photos plugin builds on this to provide media management with AI-powered curation via Google Gemini.

## Backend Selection

The storage client checks for these environment variables in order:

| Priority | Provider | Environment Variable |
|----------|----------|---------------------|
| 1 | GCS | `GCS_BUCKET` or `GOOGLE_APPLICATION_CREDENTIALS` |
| 2 | Azure Blob | `AZURE_STORAGE_CONNECTION_STRING` |
| 3 | S3 | `AWS_S3_BUCKET` + `AWS_ACCESS_KEY_ID` |

If multiple are set, GCS takes priority. If none are set, the system falls back to local filesystem storage at `./uploads/`.

## How to Configure

### Google Cloud Storage
```bash
GCS_BUCKET=my-sigil-media
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Azure Blob Storage
```bash
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=..."
PHOTOS_CONTAINER=media
```

### Amazon S3
```bash
AWS_S3_BUCKET=my-sigil-media
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

## Media Upload API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/media/upload` | Upload a file (multipart/form-data) |
| GET | `/api/admin/media` | List media with pagination and filtering |
| DELETE | `/api/admin/media/:id` | Delete a media item |

Uploads are stored in the cloud backend and a metadata record is created in `cms_media` with the URL, dimensions, file size, and MIME type.

## Example Use Cases

- **GCS on GCP** — cheapest option if already using Google Cloud.
- **Azure for enterprise** — integrate with existing Azure infrastructure.
- **S3 for AWS shops** — use existing S3 buckets and IAM policies.
- **Migration** — switch providers by changing env vars, no data migration needed (new uploads go to new provider, existing URLs still work).
"""),
    },
    {
        "slug": "seo-tools",
        "title": "SEO",
        "headline": "SEO",
        "subheadline": "Meta tags, Open Graph, Twitter Cards, sitemaps, RSS, and structured data.",
        "meta": "SEO in Sigil CMS: meta tags, Open Graph, Twitter Cards, sitemap.xml, RSS feed, structured data, canonical URLs.",
        "text": textwrap.dedent("""\
## What It Does

Sigil provides comprehensive SEO tooling at both the page and site level. Every page has fields for meta title, meta description, and Open Graph image. The SEO plugin generates `sitemap.xml`, RSS feeds, and injects structured data (JSON-LD) into rendered pages.

## Page-Level SEO

Every page in the admin editor has an **SEO** tab with:

| Field | Max Length | Description |
|-------|-----------|-------------|
| `meta_title` | 60 chars | Title tag for search results |
| `meta_description` | 160 chars | Description snippet for search results |
| `og_image_url` | — | Open Graph / Twitter Card image |
| `full_path` | — | Canonical URL path |

The renderer generates:
```html
<title>Meta Title | Site Name</title>
<meta name="description" content="Meta description...">
<meta property="og:title" content="Meta Title">
<meta property="og:description" content="Meta description...">
<meta property="og:image" content="https://...">
<link rel="canonical" href="https://example.com/page-path">
```

## Site-Level SEO (SEO Plugin)

Enable the SEO plugin to get:

| Feature | Endpoint | Description |
|---------|----------|-------------|
| Sitemap | `/sitemap.xml` | Auto-generated XML sitemap of all published pages |
| RSS Feed | `/feed.xml` | RSS 2.0 feed of recent pages |
| Robots.txt | `/robots.txt` | Configurable robots.txt |
| Structured Data | embedded | JSON-LD on every page (WebPage, FAQPage, etc.) |

## How to Configure

1. **Page SEO**: Edit any page > SEO tab > fill in meta title and description.
2. **SEO Plugin**: Go to **Plugins** > enable **SEO** > configure site-level settings:
   - Site name (used in title template).
   - Default OG image.
   - Robots.txt rules.
3. Sitemaps and RSS feeds are generated on-demand and cached.

## Example Use Cases

- **Content marketing** — optimized meta tags for every blog post.
- **Local business** — structured data for LocalBusiness schema.
- **Portfolio** — Open Graph images so social shares show project screenshots.
"""),
    },
    {
        "slug": "migration",
        "title": "Migration",
        "headline": "Migration",
        "subheadline": "Import content from WordPress, Shopify, and Square Online.",
        "meta": "Migration in Sigil CMS: WordPress XML import, Shopify API import, Square Online import, progress tracking.",
        "text": textwrap.dedent("""\
## What It Does

The Migration feature lets you import existing content from other platforms into Sigil. Currently supported sources are WordPress (via WXR XML export), Shopify (via Admin API), and Square Online (via API). The import process maps external content types to Sigil pages and blocks, preserving as much structure as possible.

## Supported Sources

### WordPress
- **Format**: WXR (WordPress eXtended RSS) XML file.
- **What's imported**: Pages, posts, categories, tags, featured images, content blocks (parsed from Gutenberg or Classic Editor HTML).
- **How**: Export from WordPress (Tools > Export), then upload the XML file in Sigil.

### Shopify
- **Format**: Shopify Admin API.
- **What's imported**: Products (as pages with pricing blocks), collections, blog posts, pages.
- **How**: Enter your Shopify store URL and Admin API token in Sigil.

### Square Online
- **Format**: Square API.
- **What's imported**: Site pages, item catalog (as product pages), images.
- **How**: Connect via Square OAuth in Sigil settings.

## How to Use It

1. Go to **Settings** > **Migration** in the admin sidebar (requires the Migrate plugin).
2. Select the source platform.
3. Upload the export file (WordPress) or enter API credentials (Shopify/Square).
4. Click **Preview Import** to see what will be created.
5. Review the mapping and click **Start Import**.
6. A progress bar shows the import status. Large imports run in the background.
7. Review imported pages in the Pages list and adjust as needed.

## Configuration Options

| Setting | Description |
|---------|-------------|
| `importMedia` | Whether to download and re-host images (default: true) |
| `mapCategories` | Create parent pages from categories (default: true) |
| `importDrafts` | Include draft/unpublished content (default: false) |
| `conflictResolution` | `skip` or `overwrite` existing pages with same slug |

## Example Use Cases

- **WordPress to Sigil** — migrate a blog with hundreds of posts and preserve structure.
- **Shopify to Sigil** — move product catalog when switching to Stripe-based store.
- **Agency migration** — batch-import multiple client sites from various platforms.
"""),
    },
]

# =============================================================================
# PLUGIN DETAIL PAGES (22)
# =============================================================================

PLUGIN_PAGES = [
    {
        "slug": "seo",
        "title": "SEO Plugin",
        "headline": "SEO Plugin",
        "subheadline": "Sitemap.xml, RSS feeds, meta tag management, and structured data.",
        "meta": "SEO Plugin for Sigil CMS: sitemap.xml, RSS feed generation, meta tag management, and structured data injection.",
        "text": textwrap.dedent("""\
## Overview

The SEO plugin provides site-wide search engine optimization features that go beyond page-level meta tags. It generates dynamic sitemaps, RSS feeds, robots.txt, and injects structured data (JSON-LD) into every rendered page. Without this plugin, pages still have basic meta tags — the plugin adds the automated, site-wide tooling.

## Key Features

- **Dynamic Sitemap** (`/sitemap.xml`) — auto-generated from all published pages, updated on every publish/unpublish action.
- **RSS Feed** (`/feed.xml`) — RSS 2.0 feed of the most recent published pages, configurable item count.
- **Robots.txt** (`/robots.txt`) — configurable rules with Sitemap reference.
- **Structured Data** — JSON-LD injected per page (WebPage, FAQPage, Article schemas based on content).
- **Meta Tag Audit** — admin dashboard widget showing pages missing meta titles or descriptions.

## How to Enable

Set the following environment variable to enable the SEO plugin:

```bash
PLUGIN_SEO=true
```

No additional API keys are required.

## Admin Interface

Once enabled, the **SEO** section appears in the admin sidebar with:
- **Overview** — site-wide SEO health score, missing meta count.
- **Sitemap Settings** — exclude specific pages, set change frequency.
- **RSS Settings** — feed title, description, max items.
- **Robots.txt** — edit rules directly.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/sitemap.xml` | Public | XML sitemap |
| GET | `/feed.xml` | Public | RSS 2.0 feed |
| GET | `/robots.txt` | Public | Robots.txt |
| GET | `/api/admin/seo/audit` | Admin | SEO audit results |
| PUT | `/api/admin/seo/settings` | Admin | Update SEO settings |

## Use Cases

- **Content marketers** — ensure every page is discoverable with complete meta tags and sitemaps.
- **Developer documentation** — RSS feed for subscribers to get notified of new docs.
- **Agency clients** — automated SEO baseline without manual configuration.
"""),
        "grid": [
            {"icon": "map", "title": "Dynamic Sitemap", "description": "Auto-generated sitemap.xml updated on every publish action"},
            {"icon": "rss", "title": "RSS Feed", "description": "RSS 2.0 feed of recent pages with configurable item count"},
            {"icon": "file-text", "title": "Meta Tag Audit", "description": "Dashboard widget showing pages missing SEO metadata"},
            {"icon": "code", "title": "Structured Data", "description": "JSON-LD injection for WebPage, FAQPage, and Article schemas"},
        ],
    },
    {
        "slug": "artist",
        "title": "Artist Content",
        "headline": "Artist Content Plugin",
        "subheadline": "Releases, events, artist profiles, streaming embeds, and 6 block types.",
        "meta": "Artist Content plugin for Sigil CMS: releases CRUD, events CRUD, artist profiles, 6 block types, streaming embeds.",
        "text": textwrap.dedent("""\
## Overview

The Artist Content plugin transforms Sigil into a musician or creative professional's website platform. It adds dedicated CRUD interfaces for music releases, live events, and artist profiles — plus six specialized block types for embedding streaming content and displaying discographies.

## Key Features

- **Releases Management** — add albums, singles, EPs with artwork, tracklists, release dates, and streaming links (Spotify, Apple Music, YouTube Music, Bandcamp, SoundCloud).
- **Events Management** — create events with date, venue, city, ticket link, and status (upcoming, sold out, cancelled, past).
- **Artist Profiles** — bio, press photos, social links, booking contact.
- **6 Block Types**: `artist_bio`, `release_grid`, `release_detail`, `event_list`, `streaming_embed`, `artist_links`.
- **Streaming Embeds** — auto-generates embed iframes from Spotify, YouTube, Apple Music, and SoundCloud URLs.

## How to Enable

```bash
PLUGIN_ARTIST=true
```

## Admin Interface

Once enabled, the admin sidebar shows:
- **Releases** — CRUD list of all releases with cover art thumbnails.
- **Events** — CRUD list with date sorting and status badges.
- **Artist Profile** — single-page editor for bio and social links.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/public/sites/:siteId/releases` | Public | List all releases |
| GET | `/api/public/sites/:siteId/events` | Public | List upcoming events |
| POST | `/api/admin/releases` | Admin | Create a release |
| PUT | `/api/admin/releases/:id` | Admin | Update a release |
| DELETE | `/api/admin/releases/:id` | Admin | Delete a release |
| POST | `/api/admin/events` | Admin | Create an event |
| PUT | `/api/admin/events/:id` | Admin | Update an event |
| DELETE | `/api/admin/events/:id` | Admin | Delete an event |

## Block Types

| Block Type | Description |
|------------|-------------|
| `artist_bio` | Renders artist bio with photo and social links |
| `release_grid` | Grid of release covers linking to detail views |
| `release_detail` | Full release page with tracklist and streaming links |
| `event_list` | Upcoming events list with ticket buttons |
| `streaming_embed` | Embedded player from Spotify, YouTube, etc. |
| `artist_links` | Link-in-bio style page with all social/streaming links |

## Use Cases

- **Independent musicians** — full artist website with releases, tour dates, and streaming links.
- **Record labels** — roster of artists, each with their own profile and discography.
- **Event venues** — upcoming shows with ticket links and artist bios.
"""),
        "grid": [
            {"icon": "disc", "title": "Releases", "description": "Albums, singles, and EPs with artwork, tracklists, and streaming links"},
            {"icon": "calendar", "title": "Events", "description": "Live events with dates, venues, ticket links, and status tracking"},
            {"icon": "music", "title": "Streaming Embeds", "description": "Auto-generated embed players from Spotify, YouTube, and more"},
            {"icon": "link", "title": "Link in Bio", "description": "Artist links page with all social and streaming profiles"},
        ],
    },
    {
        "slug": "mailing-list",
        "title": "Mailing List",
        "headline": "Mailing List Plugin",
        "subheadline": "Email capture, broadcasts, and CAN-SPAM compliance.",
        "meta": "Mailing List plugin for Sigil CMS: subscribe/unsubscribe, broadcast, CAN-SPAM compliance, ACS integration.",
        "text": textwrap.dedent("""\
## Overview

The Mailing List plugin adds email list management to your Sigil site. Visitors can subscribe via embedded forms, you can send broadcast emails to your list, and the system handles unsubscribe links, double opt-in, and CAN-SPAM compliance automatically.

## Key Features

- **Subscribe Forms** — embeddable form block or standalone endpoint.
- **Double Opt-In** — confirmation email before adding to list.
- **Broadcast Emails** — compose and send to all subscribers or segments.
- **Unsubscribe** — one-click unsubscribe link in every email (CAN-SPAM required).
- **CSV Export** — download your subscriber list.
- **Azure Communication Services** — email delivery via ACS (or SMTP fallback).

## How to Enable

```bash
PLUGIN_MAILING_LIST=true
ACS_CONNECTION_STRING="endpoint=https://..."  # Azure Communication Services
ACS_SENDER_ADDRESS="noreply@yourdomain.com"
```

## Admin Interface

- **Subscribers** — list with search, filter by status (active, unsubscribed, bounced).
- **Broadcasts** — compose editor, send to all or filtered segment, delivery stats.
- **Settings** — sender name, reply-to address, double opt-in toggle.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/public/sites/:siteId/subscribe` | Public | Subscribe an email |
| GET | `/api/public/unsubscribe?token=...` | Public | One-click unsubscribe |
| GET | `/api/admin/mailing-list/subscribers` | Admin | List subscribers |
| POST | `/api/admin/mailing-list/broadcast` | Admin | Send a broadcast |
| GET | `/api/admin/mailing-list/export` | Admin | CSV export |

## Use Cases

- **Newsletter** — weekly updates to subscribers with new content.
- **Product launch** — capture interest and notify when product is live.
- **Event promotion** — broadcast event details to your subscriber base.
"""),
        "grid": [
            {"icon": "mail", "title": "Email Capture", "description": "Embeddable subscribe forms with double opt-in confirmation"},
            {"icon": "send", "title": "Broadcasts", "description": "Compose and send emails to all subscribers or segments"},
            {"icon": "shield", "title": "CAN-SPAM Compliance", "description": "Automatic unsubscribe links and physical address in every email"},
            {"icon": "download", "title": "CSV Export", "description": "Download your subscriber list for backup or external use"},
        ],
    },
    {
        "slug": "contact",
        "title": "Contact & Booking",
        "headline": "Contact & Booking Plugin",
        "subheadline": "Form submissions, booking metadata, email forwarding, and admin management.",
        "meta": "Contact and Booking plugin for Sigil CMS: form submission, booking metadata parsing, email forwarding, admin management.",
        "text": textwrap.dedent("""\
## Overview

The Contact plugin provides form submission handling, email notification forwarding, and an admin interface for managing inquiries. It supports both simple contact forms and booking-style forms with date/time/service metadata.

## Key Features

- **Form Submission API** — receives form data as JSON, stores in database, triggers email notification.
- **Booking Metadata** — parses date, time, service type, and party size from form fields.
- **Email Forwarding** — sends submitted form data to the site owner's email via ACS.
- **Admin Inbox** — view, reply, archive, and delete submissions.
- **Spam Protection** — honeypot field + rate limiting.

## How to Enable

```bash
PLUGIN_CONTACT=true
CONTACT_EMAIL="owner@example.com"  # Where to forward submissions
ACS_CONNECTION_STRING="..."         # For email delivery
```

## Admin Interface

- **Inbox** — all form submissions with status (new, read, replied, archived).
- **Submission Detail** — full form data, booking metadata, reply thread.
- **Settings** — forwarding email, notification preferences.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/public/sites/:siteId/contact` | Public | Submit a form |
| GET | `/api/admin/contact/submissions` | Admin | List submissions |
| GET | `/api/admin/contact/submissions/:id` | Admin | Get submission detail |
| PUT | `/api/admin/contact/submissions/:id` | Admin | Update status |
| DELETE | `/api/admin/contact/submissions/:id` | Admin | Delete submission |

## Block Types

The Contact Form block type (`contact_form`) is registered by this plugin. See the [CTA & Contact Forms](/features/cta-forms) feature page for block configuration details.

## Use Cases

- **Service businesses** — contact form with service type dropdown and preferred date.
- **Restaurants** — reservation request form with party size, date, and time.
- **Freelancers** — inquiry form with project budget and timeline fields.
"""),
        "grid": [
            {"icon": "inbox", "title": "Admin Inbox", "description": "View, reply, archive, and manage all form submissions"},
            {"icon": "calendar", "title": "Booking Metadata", "description": "Parse date, time, service, and party size from form fields"},
            {"icon": "mail", "title": "Email Forwarding", "description": "Automatic notification to site owner on every submission"},
            {"icon": "shield", "title": "Spam Protection", "description": "Honeypot fields and rate limiting to prevent abuse"},
        ],
    },
    {
        "slug": "photos",
        "title": "Photos",
        "headline": "Photos Plugin",
        "subheadline": "Multi-provider cloud storage with AI-powered curation via Gemini.",
        "meta": "Photos plugin for Sigil CMS: multi-provider storage (GCS/Azure/S3), AI curation via Gemini, bulk upload.",
        "text": textwrap.dedent("""\
## Overview

The Photos plugin provides a media management system with cloud storage backends and AI-powered curation. Upload photos individually or in bulk, organize into collections, and let Gemini AI suggest captions, tags, and featured selections.

## Key Features

- **Multi-Provider Storage** — GCS, Azure Blob, or S3 (see [Multi-Cloud Storage](/features/storage) for backend configuration).
- **Bulk Upload** — drag-and-drop multiple files, progress tracking per file.
- **AI Curation** — Gemini Vision analyzes uploaded photos to suggest captions, tags, alt text, and quality scores.
- **Collections** — organize photos into named collections (albums).
- **Image Processing** — automatic thumbnail generation, responsive srcsets, EXIF extraction.
- **Metadata** — dimensions, file size, MIME type, upload date, tags, caption stored in `cms_media`.

## How to Enable

```bash
PLUGIN_PHOTOS=true
GEMINI_API_KEY="..."           # For AI curation (optional)
# Plus one storage backend (see /features/storage)
```

## Admin Interface

- **Photos** — grid view of all uploaded media with search and filter.
- **Upload** — drag-and-drop zone with progress bars.
- **Collections** — create and manage photo albums.
- **AI Suggestions** — review and accept/reject AI-generated captions and tags.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/photos/upload` | Admin | Upload one or more photos |
| GET | `/api/admin/photos` | Admin | List photos with pagination |
| GET | `/api/admin/photos/:id` | Admin | Get photo metadata |
| PUT | `/api/admin/photos/:id` | Admin | Update caption, tags, collection |
| DELETE | `/api/admin/photos/:id` | Admin | Delete photo and cloud object |
| POST | `/api/admin/photos/:id/curate` | Admin | Trigger AI curation |
| GET | `/api/public/sites/:siteId/photos` | Public | Public photo listing |

## Use Cases

- **Photography portfolio** — upload project photos with AI-generated alt text for accessibility.
- **Real estate** — property photo galleries with bulk upload.
- **E-commerce** — product photography with automatic thumbnails and metadata.
"""),
        "grid": [
            {"icon": "upload-cloud", "title": "Bulk Upload", "description": "Drag-and-drop multiple files with per-file progress tracking"},
            {"icon": "cpu", "title": "AI Curation", "description": "Gemini Vision suggests captions, tags, alt text, and quality scores"},
            {"icon": "folder", "title": "Collections", "description": "Organize photos into named albums for easy management"},
            {"icon": "image", "title": "Image Processing", "description": "Automatic thumbnails, responsive srcsets, and EXIF extraction"},
        ],
    },
    {
        "slug": "advisor",
        "title": "AI Advisor",
        "headline": "AI Advisor Plugin",
        "subheadline": "Gemini-powered chat, pgvector RAG, document ingestion, and TTS.",
        "meta": "AI Advisor plugin for Sigil CMS: Gemini chat, pgvector RAG, document ingestion, TTS, streaming SSE responses.",
        "text": textwrap.dedent("""\
## Overview

The AI Advisor plugin adds an intelligent assistant to your Sigil site. It uses Google Gemini for chat responses, pgvector for retrieval-augmented generation (RAG), and can ingest your site's pages and uploaded documents as knowledge context. Visitors interact via a chat widget; responses stream in real-time via Server-Sent Events (SSE).

## Key Features

- **Gemini Chat** — conversational AI powered by Gemini Pro with configurable system prompts.
- **pgvector RAG** — document chunks are embedded and stored in PostgreSQL with pgvector. Relevant chunks are retrieved and injected as context for every chat response.
- **Document Ingestion** — upload PDFs, Markdown, or text files to the knowledge base. Site pages can be auto-ingested.
- **Text-to-Speech (TTS)** — responses can be read aloud via Google Cloud TTS.
- **Streaming SSE** — responses stream token-by-token to the chat widget for a responsive UX.
- **Chat Widget** — embeddable chat bubble for the public site.

## How to Enable

```bash
PLUGIN_ADVISOR=true
GEMINI_API_KEY="..."
# pgvector database (can be same as CMS DB if pgvector extension is installed)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sigil
DB_USER=postgres
DB_PASS=...
```

## Admin Interface

- **Knowledge Base** — upload and manage documents, view ingested chunks.
- **Chat Settings** — system prompt, temperature, max tokens, model selection.
- **Chat History** — view visitor conversations (anonymized).
- **Widget Config** — position, colors, welcome message, placeholder text.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/public/sites/:siteId/advisor/chat` | Public | Send a message (SSE stream) |
| POST | `/api/admin/advisor/ingest` | Admin | Ingest a document |
| DELETE | `/api/admin/advisor/documents/:id` | Admin | Remove a document |
| GET | `/api/admin/advisor/documents` | Admin | List ingested documents |
| PUT | `/api/admin/advisor/settings` | Admin | Update chat settings |

## Use Cases

- **Customer support** — AI answers questions about your products using your documentation as context.
- **Knowledge base search** — natural language search over ingested documents.
- **Interactive tutorials** — guided learning with AI that knows your documentation.
"""),
        "grid": [
            {"icon": "message-circle", "title": "Gemini Chat", "description": "Conversational AI with configurable system prompts and streaming responses"},
            {"icon": "database", "title": "pgvector RAG", "description": "Document embedding and retrieval for context-aware AI responses"},
            {"icon": "file-plus", "title": "Document Ingestion", "description": "Upload PDFs, Markdown, or auto-ingest site pages as knowledge"},
            {"icon": "volume-2", "title": "Text-to-Speech", "description": "Google Cloud TTS reads AI responses aloud for accessibility"},
        ],
    },
    {
        "slug": "store",
        "title": "Store (Stripe)",
        "headline": "Store Plugin (Stripe)",
        "subheadline": "Product catalog, Stripe checkout, order tracking, and webhook sync.",
        "meta": "Store plugin for Sigil CMS: product catalog, Stripe sync, checkout sessions, order tracking, webhooks.",
        "text": textwrap.dedent("""\
## Overview

The Store plugin adds e-commerce to your Sigil site using Stripe as the payment processor. It provides a product catalog, shopping cart, Stripe Checkout sessions, and order tracking. Products sync bidirectionally with Stripe — create in Sigil or import from your existing Stripe account.

## Key Features

- **Product Catalog** — products with name, description, images, price, variants, and inventory.
- **Stripe Sync** — products and prices sync with Stripe. Changes in either direction are reflected.
- **Checkout Sessions** — Stripe-hosted checkout with customizable success/cancel URLs.
- **Order Tracking** — orders created from successful payments with status tracking.
- **Webhooks** — Stripe webhooks update order status (paid, shipped, refunded).
- **Product Block** — display products on any page using the `product_grid` or `product_detail` block types.

## How to Enable

```bash
PLUGIN_STORE=true
STRIPE_SECRET_KEY="sk_..."
STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## Admin Interface

- **Products** — CRUD with images, variants, pricing, inventory.
- **Orders** — list with status, customer email, total, and fulfillment tracking.
- **Settings** — currency, tax settings, shipping zones, success/cancel URLs.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/public/sites/:siteId/products` | Public | List products |
| GET | `/api/public/sites/:siteId/products/:id` | Public | Product detail |
| POST | `/api/public/sites/:siteId/checkout` | Public | Create Stripe checkout session |
| POST | `/api/webhooks/stripe` | Stripe | Webhook handler |
| GET | `/api/admin/orders` | Admin | List orders |
| PUT | `/api/admin/orders/:id` | Admin | Update order status |
| POST | `/api/admin/products` | Admin | Create product |
| PUT | `/api/admin/products/:id` | Admin | Update product |

## Use Cases

- **Digital products** — sell ebooks, templates, or courses with instant delivery.
- **Physical merchandise** — sell branded goods with order tracking.
- **Service packages** — sell consulting packages or subscriptions.
"""),
        "grid": [
            {"icon": "shopping-cart", "title": "Product Catalog", "description": "Full product management with variants, images, and inventory"},
            {"icon": "credit-card", "title": "Stripe Checkout", "description": "Hosted checkout sessions with automatic order creation"},
            {"icon": "package", "title": "Order Tracking", "description": "Order lifecycle from payment to fulfillment with status updates"},
            {"icon": "zap", "title": "Webhook Sync", "description": "Real-time Stripe webhooks for payment and refund events"},
        ],
    },
    {
        "slug": "merch",
        "title": "Merch (Printful)",
        "headline": "Merch Plugin (Printful)",
        "subheadline": "Print-on-demand merchandise with zero inventory and automatic fulfillment.",
        "meta": "Merch plugin for Sigil CMS: Printful print-on-demand catalog sync, mockup images, retail pricing, zero inventory.",
        "text": textwrap.dedent("""\
## Overview

The Merch plugin connects your Sigil site to Printful for print-on-demand merchandise. Upload your designs, Printful handles printing, packaging, and shipping. You set retail prices, Printful charges you wholesale — the margin is your profit. Zero inventory, zero upfront cost.

## Key Features

- **Catalog Sync** — sync products from your Printful store to your Sigil product catalog.
- **Mockup Images** — Printful generates product mockups automatically (t-shirts, hoodies, mugs, etc.).
- **Retail Pricing** — set your own prices. Printful charges wholesale on each order.
- **Automatic Fulfillment** — orders placed via Stripe checkout are forwarded to Printful for printing and shipping.
- **Product Variants** — sizes, colors, and styles synced from Printful.

## How to Enable

```bash
PLUGIN_MERCH=true
PRINTFUL_API_KEY="..."
STRIPE_SECRET_KEY="sk_..."  # Store plugin must also be enabled
```

## Admin Interface

- **Merch** — view synced products, update retail prices, toggle visibility.
- **Sync** — manual sync button + automatic sync on webhook events.
- **Orders** — Printful order status (pending, in production, shipped, delivered).

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/merch/sync` | Admin | Trigger catalog sync from Printful |
| GET | `/api/admin/merch/products` | Admin | List merch products |
| PUT | `/api/admin/merch/products/:id` | Admin | Update retail price/visibility |
| POST | `/api/webhooks/printful` | Printful | Fulfillment status webhook |

## Use Cases

- **Musicians** — sell branded t-shirts, hoodies, and posters alongside music.
- **Podcasters** — merch store with zero inventory management.
- **Small businesses** — branded merchandise without warehouse or fulfillment overhead.
"""),
        "grid": [
            {"icon": "printer", "title": "Print-on-Demand", "description": "Printful prints, packages, and ships every order automatically"},
            {"icon": "image", "title": "Auto Mockups", "description": "Product mockup images generated from your designs by Printful"},
            {"icon": "dollar-sign", "title": "Retail Pricing", "description": "Set your own prices with automatic wholesale margin calculation"},
            {"icon": "package", "title": "Zero Inventory", "description": "No upfront cost, no warehouse — items printed on each order"},
        ],
    },
    {
        "slug": "paypal",
        "title": "PayPal",
        "headline": "PayPal Plugin",
        "subheadline": "PayPal Orders API v2, Smart Payment Buttons, and sandbox mode.",
        "meta": "PayPal plugin for Sigil CMS: Orders API v2, Smart Payment Buttons, capture flow, sandbox mode.",
        "text": textwrap.dedent("""\
## Overview

The PayPal plugin adds PayPal as a payment option alongside (or instead of) Stripe. It uses the PayPal Orders API v2 and renders Smart Payment Buttons that adapt to the buyer's PayPal account (showing PayPal, Venmo, Pay Later, and card options as appropriate).

## Key Features

- **Orders API v2** — create, authorize, and capture orders programmatically.
- **Smart Payment Buttons** — adaptive button stack showing PayPal, Venmo, Pay Later, and debit/credit card.
- **Capture Flow** — authorize first, capture later (or capture immediately).
- **Sandbox Mode** — full sandbox environment for testing without real money.
- **Order Records** — payments recorded in the same orders table as Stripe, with `paymentProvider: 'paypal'`.

## How to Enable

```bash
PLUGIN_PAYPAL=true
PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."
PAYPAL_MODE="sandbox"  # or "live"
```

## Admin Interface

- **PayPal Settings** — client ID, mode toggle, button style preferences.
- **Orders** — PayPal orders appear in the unified orders list with a PayPal badge.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/public/sites/:siteId/paypal/create-order` | Public | Create a PayPal order |
| POST | `/api/public/sites/:siteId/paypal/capture-order` | Public | Capture an approved order |
| GET | `/api/admin/paypal/settings` | Admin | Get PayPal configuration |
| PUT | `/api/admin/paypal/settings` | Admin | Update PayPal configuration |

## Client-Side Integration

The PayPal Smart Buttons render on any page with a `paypal_button` block or on the checkout page. The JavaScript SDK is loaded from `https://www.paypal.com/sdk/js` with your client ID.

## Use Cases

- **International sales** — PayPal is available in 200+ countries.
- **Buyer preference** — offer PayPal alongside Stripe so customers choose their preferred method.
- **Pay Later** — PayPal's "Pay in 4" installment option for higher-value items.
"""),
        "grid": [
            {"icon": "credit-card", "title": "Smart Buttons", "description": "Adaptive PayPal, Venmo, Pay Later, and card buttons"},
            {"icon": "shield", "title": "Orders API v2", "description": "Secure order creation and capture via PayPal's latest API"},
            {"icon": "toggle-left", "title": "Sandbox Mode", "description": "Full testing environment with sandbox credentials"},
            {"icon": "globe", "title": "200+ Countries", "description": "Accept payments from PayPal users worldwide"},
        ],
    },
    {
        "slug": "booking",
        "title": "Booking",
        "headline": "Booking Plugin",
        "subheadline": "Services, availability rules, Google Calendar sync, and email confirmations.",
        "meta": "Booking plugin for Sigil CMS: services, availability rules, Google Calendar sync, email confirmations, appointment management.",
        "text": textwrap.dedent("""\
## Overview

The Booking plugin adds appointment scheduling to your Sigil site. Define services with durations and prices, set availability rules (working hours, blocked dates), and let visitors book directly. Appointments sync to Google Calendar and trigger email confirmations.

## Key Features

- **Services** — define bookable services with name, duration, price, and description.
- **Availability Rules** — set working hours per day, block specific dates, set buffer time between appointments.
- **Google Calendar Sync** — two-way sync prevents double-booking.
- **Email Confirmations** — automatic confirmation email to both the customer and the business owner.
- **Booking Widget** — embeddable calendar view showing available time slots.
- **Appointment Management** — admin list with confirm, reschedule, and cancel actions.

## How to Enable

```bash
PLUGIN_BOOKING=true
GOOGLE_CALENDAR_CREDENTIALS="..."  # Optional, for Calendar sync
CONTACT_EMAIL="owner@example.com"  # For notifications
```

## Admin Interface

- **Services** — CRUD for bookable services.
- **Availability** — weekly schedule editor, holiday blocklist, buffer time settings.
- **Appointments** — list with status (pending, confirmed, cancelled, completed).
- **Settings** — timezone, advance booking window, cancellation policy.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/public/sites/:siteId/booking/services` | Public | List services |
| GET | `/api/public/sites/:siteId/booking/availability` | Public | Get available slots |
| POST | `/api/public/sites/:siteId/booking/appointments` | Public | Book an appointment |
| GET | `/api/admin/booking/appointments` | Admin | List appointments |
| PUT | `/api/admin/booking/appointments/:id` | Admin | Update appointment |
| DELETE | `/api/admin/booking/appointments/:id` | Admin | Cancel appointment |

## Use Cases

- **Salons and spas** — service menu with online booking and calendar sync.
- **Consultants** — book discovery calls or coaching sessions online.
- **Venues** — event space booking with availability calendar.
"""),
        "grid": [
            {"icon": "calendar", "title": "Availability Rules", "description": "Set working hours, blocked dates, and buffer times between appointments"},
            {"icon": "refresh-cw", "title": "Google Calendar Sync", "description": "Two-way sync prevents double-booking across calendars"},
            {"icon": "mail", "title": "Email Confirmations", "description": "Automatic emails to customers and business owners on booking"},
            {"icon": "clock", "title": "Booking Widget", "description": "Embeddable calendar showing available time slots for visitors"},
        ],
    },
    {
        "slug": "docs",
        "title": "Docs / Knowledge Base",
        "headline": "Docs / Knowledge Base Plugin",
        "subheadline": "Categories, articles, versioning, search, and table of contents.",
        "meta": "Docs plugin for Sigil CMS: categories, articles, versioning, search, table of contents, feedback system.",
        "text": textwrap.dedent("""\
## Overview

The Docs plugin turns your Sigil site into a documentation portal or knowledge base. It provides hierarchical categories, articles with Markdown content, version tagging, full-text search, auto-generated table of contents, and a reader feedback system.

## Key Features

- **Categories** — hierarchical category tree (up to 3 levels deep) for organizing articles.
- **Articles** — Markdown-based content with code blocks, images, and callout boxes.
- **Versioning** — tag articles with version numbers (v1.0, v2.0). Readers can switch versions.
- **Full-Text Search** — PostgreSQL `tsvector` powered search across all articles.
- **Table of Contents** — auto-generated from headings within each article.
- **Feedback** — "Was this helpful?" widget on each article with aggregated scores.

## How to Enable

```bash
PLUGIN_DOCS=true
```

## Admin Interface

- **Categories** — tree editor with drag-and-drop reordering.
- **Articles** — list with category filter, search, and status (draft/published).
- **Article Editor** — Markdown editor with live preview, image upload, and version selector.
- **Feedback** — dashboard showing articles sorted by helpfulness score.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/public/sites/:siteId/docs/categories` | Public | Category tree |
| GET | `/api/public/sites/:siteId/docs/articles` | Public | List articles |
| GET | `/api/public/sites/:siteId/docs/articles/:slug` | Public | Article content |
| GET | `/api/public/sites/:siteId/docs/search?q=...` | Public | Full-text search |
| POST | `/api/public/sites/:siteId/docs/feedback` | Public | Submit feedback |
| POST | `/api/admin/docs/categories` | Admin | Create category |
| POST | `/api/admin/docs/articles` | Admin | Create article |
| PUT | `/api/admin/docs/articles/:id` | Admin | Update article |

## Use Cases

- **Product documentation** — user guides, API reference, tutorials.
- **Internal knowledge base** — company processes, onboarding docs, SOPs.
- **Open source project** — contributor guides, architecture docs, changelog.
"""),
        "grid": [
            {"icon": "folder-tree", "title": "Categories", "description": "Hierarchical category tree up to 3 levels deep"},
            {"icon": "search", "title": "Full-Text Search", "description": "PostgreSQL tsvector search across all articles"},
            {"icon": "git-branch", "title": "Versioning", "description": "Tag articles with version numbers and let readers switch"},
            {"icon": "thumbs-up", "title": "Feedback", "description": "Was this helpful? widget with aggregated scores"},
        ],
    },
    {
        "slug": "resonance",
        "title": "Resonance Analytics",
        "headline": "Resonance Analytics Plugin",
        "subheadline": "Block-level engagement tracking, A/B testing, and AI suggestions.",
        "meta": "Resonance Analytics plugin for Sigil CMS: block-level tracking, engagement scoring, A/B testing, AI suggestions, privacy-first.",
        "text": textwrap.dedent("""\
## Overview

Resonance is Sigil's built-in analytics engine. Unlike traditional page-level analytics, Resonance tracks engagement at the block level — measuring which content blocks visitors actually interact with, how far they scroll, and what drives conversions. It includes A/B testing and AI-powered content suggestions, all without third-party cookies.

## Key Features

- **Block-Level Tracking** — every content block reports visibility time, scroll depth, and click events.
- **Engagement Scoring** — each block gets a 0-100 engagement score based on visibility, interaction, and conversion contribution.
- **A/B Testing** — create variants of any block and split traffic to measure performance.
- **AI Suggestions** — Gemini analyzes engagement data and suggests content improvements.
- **Privacy-First** — no cookies, no fingerprinting, no PII. Data stored per-site, aggregated only.
- **Dashboard** — visual heatmap of block engagement, top-performing content, and conversion funnels.

## How to Enable

```bash
PLUGIN_RESONANCE=true
GEMINI_API_KEY="..."  # Optional, for AI suggestions
```

## Admin Interface

- **Dashboard** — site-wide engagement overview with heatmap visualization.
- **Page Analytics** — per-page block engagement breakdown.
- **A/B Tests** — create, monitor, and conclude A/B tests.
- **AI Suggestions** — review and apply AI-generated improvement recommendations.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/public/sites/:siteId/resonance/track` | Public | Track a block interaction event |
| GET | `/api/admin/resonance/dashboard` | Admin | Site engagement overview |
| GET | `/api/admin/resonance/pages/:pageId` | Admin | Page block engagement |
| POST | `/api/admin/resonance/ab-test` | Admin | Create an A/B test |
| GET | `/api/admin/resonance/ab-test/:id` | Admin | A/B test results |
| GET | `/api/admin/resonance/suggestions` | Admin | AI content suggestions |

## Use Cases

- **Conversion optimization** — identify which blocks drive sign-ups and which are ignored.
- **Content strategy** — data-driven decisions about what content types perform best.
- **Landing page testing** — A/B test hero text, CTA buttons, and pricing layouts.
"""),
        "grid": [
            {"icon": "activity", "title": "Block-Level Tracking", "description": "Measure engagement per content block, not just per page"},
            {"icon": "bar-chart-2", "title": "Engagement Scoring", "description": "0-100 score per block based on visibility, interaction, and conversions"},
            {"icon": "git-merge", "title": "A/B Testing", "description": "Split traffic between block variants and measure performance"},
            {"icon": "cpu", "title": "AI Suggestions", "description": "Gemini-powered content improvement recommendations"},
        ],
    },
    {
        "slug": "community",
        "title": "Community Forum",
        "headline": "Community Forum Plugin",
        "subheadline": "Discussions, threads, reactions, reputation, and moderation.",
        "meta": "Community Forum plugin for Sigil CMS: discussions, threads, reactions, reputation, moderation, member management.",
        "text": textwrap.dedent("""\
## Overview

The Community plugin adds a discussion forum to your Sigil site. It provides categorized discussions, threaded replies, emoji reactions, user reputation scoring, and moderation tools. Members authenticate via the same user system as the rest of Sigil.

## Key Features

- **Categories** — organize discussions by topic (e.g., General, Support, Feature Requests).
- **Threads** — create discussion threads with Markdown content, images, and code blocks.
- **Replies** — threaded replies with quote support and @mentions.
- **Reactions** — emoji reactions on threads and replies.
- **Reputation** — users earn points for helpful replies (upvotes), accepted answers.
- **Moderation** — pin, lock, move, and delete threads. Ban users. Report system.
- **Member Profiles** — avatar, bio, join date, post count, reputation score.

## How to Enable

```bash
PLUGIN_COMMUNITY=true
```

## Admin Interface

- **Categories** — CRUD with ordering and descriptions.
- **Moderation Queue** — reported posts pending review.
- **Members** — user list with ban/unban and role management.
- **Settings** — posting rules, auto-moderation words, reputation thresholds.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/public/sites/:siteId/community/categories` | Public | List categories |
| GET | `/api/public/sites/:siteId/community/threads` | Public | List threads |
| GET | `/api/public/sites/:siteId/community/threads/:id` | Public | Thread with replies |
| POST | `/api/public/sites/:siteId/community/threads` | Member | Create thread |
| POST | `/api/public/sites/:siteId/community/threads/:id/reply` | Member | Reply to thread |
| POST | `/api/public/sites/:siteId/community/react` | Member | Add reaction |
| GET | `/api/admin/community/moderation` | Admin | Moderation queue |

## Use Cases

- **Product community** — feature requests, bug reports, and general discussion.
- **Course platform** — student discussion boards organized by course module.
- **Local business** — community board for customers to share experiences and ask questions.
"""),
        "grid": [
            {"icon": "message-square", "title": "Threaded Discussions", "description": "Categories, threads, and replies with Markdown and code blocks"},
            {"icon": "smile", "title": "Reactions & Reputation", "description": "Emoji reactions and reputation scores for helpful contributors"},
            {"icon": "shield", "title": "Moderation Tools", "description": "Pin, lock, move, delete threads, ban users, and review reports"},
            {"icon": "users", "title": "Member Profiles", "description": "Avatars, bios, post counts, and reputation scores per member"},
        ],
    },
    {
        "slug": "marketplace",
        "title": "Plugin Marketplace",
        "headline": "Plugin Marketplace",
        "subheadline": "Browse, install, and manage plugins from the Sigil ecosystem.",
        "meta": "Plugin Marketplace for Sigil CMS: browse/install plugins, version management, and categories.",
        "text": textwrap.dedent("""\
## Overview

The Plugin Marketplace provides a central hub for discovering and installing Sigil plugins. It lists both official plugins (maintained by the Sigil team) and community-contributed plugins. Each plugin has a detail page with description, screenshots, version history, and one-click install.

## Key Features

- **Browse & Search** — search plugins by name, category, or functionality.
- **Categories** — Content, Commerce, Analytics, Communication, Integration, Development.
- **Version Management** — view changelog per version, install specific versions, automatic update notifications.
- **One-Click Install** — enable a plugin with a single click (sets the environment variable and runs migrations).
- **Ratings & Reviews** — community ratings help identify quality plugins.
- **Dependency Checking** — marketplace warns if a plugin requires another plugin or a specific Sigil version.

## How to Enable

```bash
PLUGIN_MARKETPLACE=true
```

## Admin Interface

- **Browse** — grid view of available plugins with search and category filters.
- **Installed** — list of currently enabled plugins with version and status.
- **Updates** — plugins with available updates.
- **Plugin Detail** — description, screenshots, changelog, reviews, install button.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/marketplace/plugins` | Admin | Browse available plugins |
| GET | `/api/admin/marketplace/plugins/:slug` | Admin | Plugin detail |
| POST | `/api/admin/marketplace/install` | Admin | Install a plugin |
| POST | `/api/admin/marketplace/uninstall` | Admin | Uninstall a plugin |
| GET | `/api/admin/marketplace/updates` | Admin | Check for updates |

## Use Cases

- **Site administrators** — discover and enable plugins that extend their site's functionality.
- **Plugin developers** — publish custom plugins for the Sigil community.
- **Agencies** — install client-specific plugins per site from a curated selection.
"""),
        "grid": [
            {"icon": "search", "title": "Browse & Search", "description": "Find plugins by name, category, or functionality"},
            {"icon": "download", "title": "One-Click Install", "description": "Enable plugins with a single click, no manual configuration"},
            {"icon": "git-branch", "title": "Version Management", "description": "Changelogs, specific version installs, and update notifications"},
            {"icon": "star", "title": "Ratings & Reviews", "description": "Community ratings help identify the best plugins"},
        ],
    },
    {
        "slug": "kamera",
        "title": "KAMERA",
        "headline": "KAMERA Plugin",
        "subheadline": "3D scan management, detection display, report generation, and export.",
        "meta": "KAMERA plugin for Sigil CMS: 3D scan management, detection display, report generation, export formats.",
        "text": textwrap.dedent("""\
## Overview

The KAMERA plugin integrates with the KAMERA 3D scanning pipeline (a separate Netrun Systems product). It provides a web interface for viewing 3D scan results, browsing detected objects (MEP components, structural elements), generating reports, and exporting data in standard formats.

## Key Features

- **Scan Management** — list scans with status (processing, complete, failed), upload new scans.
- **Detection Display** — view detected objects overlaid on 3D point clouds or 2D floor plans.
- **Object Catalog** — browse detected objects by category (HVAC, electrical, plumbing, structural).
- **Report Generation** — PDF reports with scan summary, detection counts, and annotated images.
- **Export Formats** — export detections as CSV, JSON, or IFC (Industry Foundation Classes) for BIM software.

## How to Enable

```bash
PLUGIN_KAMERA=true
KAMERA_API_URL="https://kamera-api.example.com"  # KAMERA pipeline endpoint
KAMERA_API_KEY="..."
```

## Admin Interface

- **Scans** — list with status badges, upload button, processing progress.
- **Scan Detail** — 3D viewer with detection overlays, object list, export buttons.
- **Reports** — generated PDF reports with download links.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/kamera/scans` | Admin | List scans |
| POST | `/api/admin/kamera/scans` | Admin | Upload a new scan |
| GET | `/api/admin/kamera/scans/:id` | Admin | Scan detail with detections |
| GET | `/api/admin/kamera/scans/:id/report` | Admin | Generate PDF report |
| GET | `/api/admin/kamera/scans/:id/export` | Admin | Export detections (CSV/JSON/IFC) |

## Use Cases

- **Construction companies** — view 3D scan results and share reports with stakeholders.
- **Facility managers** — catalog existing MEP infrastructure from 3D scans.
- **Architects** — import detection data into BIM software via IFC export.
"""),
        "grid": [
            {"icon": "box", "title": "3D Scan Viewer", "description": "View scans with detection overlays on point clouds or floor plans"},
            {"icon": "search", "title": "Object Catalog", "description": "Browse detected objects by category: HVAC, electrical, plumbing"},
            {"icon": "file-text", "title": "PDF Reports", "description": "Generated reports with detection counts and annotated images"},
            {"icon": "download", "title": "Export Formats", "description": "CSV, JSON, or IFC export for BIM software integration"},
        ],
    },
    {
        "slug": "kog",
        "title": "KOG CRM",
        "headline": "KOG CRM Plugin",
        "subheadline": "Lead capture, contact search, activity feed, and pipeline tracking.",
        "meta": "KOG CRM plugin for Sigil CMS: lead capture, contact search, activity feed, pipeline tracking.",
        "text": textwrap.dedent("""\
## Overview

The KOG CRM plugin embeds lightweight CRM functionality from the KOG platform (Netrun Systems' CRM product) directly into your Sigil admin panel. It provides lead capture from site forms, contact management, activity tracking, and a visual sales pipeline.

## Key Features

- **Lead Capture** — form submissions from Contact and Booking plugins are automatically created as CRM leads.
- **Contacts** — searchable contact database with name, email, phone, company, tags, and notes.
- **Activity Feed** — log calls, emails, meetings, and notes against contacts.
- **Pipeline Tracking** — visual Kanban board for sales stages (Lead > Qualified > Proposal > Negotiation > Won/Lost).
- **Organization Management** — group contacts by organization with parent/child relationships.

## How to Enable

```bash
PLUGIN_KOG=true
```

The KOG plugin uses the shared `crm_contacts`, `crm_organizations`, `crm_opportunities`, and `crm_activities` tables from the platform database.

## Admin Interface

- **Contacts** — searchable list with filters (tag, organization, stage).
- **Contact Detail** — full profile with activity timeline, opportunities, and notes.
- **Pipeline** — Kanban board with drag-and-drop between stages.
- **Organizations** — company directory with associated contacts.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/crm/contacts` | Admin | List contacts |
| POST | `/api/admin/crm/contacts` | Admin | Create contact |
| GET | `/api/admin/crm/contacts/:id` | Admin | Contact detail |
| POST | `/api/admin/crm/activities` | Admin | Log activity |
| GET | `/api/admin/crm/pipeline` | Admin | Pipeline overview |
| PUT | `/api/admin/crm/opportunities/:id` | Admin | Update opportunity stage |

## Use Cases

- **Service businesses** — capture leads from your contact form and track them through the sales pipeline.
- **Agencies** — manage client contacts, log meetings, and track proposals.
- **Freelancers** — simple CRM for tracking prospects and project opportunities.
"""),
        "grid": [
            {"icon": "user-plus", "title": "Lead Capture", "description": "Automatic lead creation from contact and booking form submissions"},
            {"icon": "search", "title": "Contact Search", "description": "Full-text search across contacts with tag and organization filters"},
            {"icon": "activity", "title": "Activity Feed", "description": "Log calls, emails, meetings, and notes per contact"},
            {"icon": "trello", "title": "Pipeline Board", "description": "Visual Kanban board for sales stages with drag-and-drop"},
        ],
    },
    {
        "slug": "intirkast",
        "title": "Intirkast Broadcasting",
        "headline": "Intirkast Broadcasting Plugin",
        "subheadline": "Live stream status, podcast episodes, and broadcast schedule.",
        "meta": "Intirkast Broadcasting plugin for Sigil CMS: live stream status, podcast episodes, broadcast schedule.",
        "text": textwrap.dedent("""\
## Overview

The Intirkast plugin connects your Sigil site to the Intirkast broadcasting platform (a Netrun Systems streaming product). It displays live stream status, podcast episode listings, and upcoming broadcast schedules on your site.

## Key Features

- **Live Status Widget** — shows whether a stream is currently live, with viewer count and "Watch Now" link.
- **Podcast Episodes** — list and detail pages for podcast episodes with audio player, show notes, and timestamps.
- **Broadcast Schedule** — upcoming stream calendar with titles, descriptions, and countdown timers.
- **Block Types**: `live_status`, `episode_list`, `episode_detail`, `broadcast_schedule`.

## How to Enable

```bash
PLUGIN_INTIRKAST=true
INTIRKAST_API_URL="https://intirkast-api.example.com"
INTIRKAST_API_KEY="..."
```

## Admin Interface

- **Episodes** — manage podcast episodes (title, description, audio URL, published date).
- **Schedule** — create and edit upcoming broadcast entries.
- **Settings** — Intirkast API connection, stream URLs, default artwork.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/public/sites/:siteId/intirkast/status` | Public | Live stream status |
| GET | `/api/public/sites/:siteId/intirkast/episodes` | Public | Episode list |
| GET | `/api/public/sites/:siteId/intirkast/schedule` | Public | Broadcast schedule |
| POST | `/api/admin/intirkast/episodes` | Admin | Create episode |
| PUT | `/api/admin/intirkast/episodes/:id` | Admin | Update episode |

## Use Cases

- **Podcasters** — episode archive with audio player and show notes on your site.
- **Live streamers** — live/offline indicator with automatic redirect to stream.
- **Media companies** — broadcast schedule for upcoming shows and events.
"""),
        "grid": [
            {"icon": "radio", "title": "Live Status", "description": "Real-time live/offline indicator with viewer count"},
            {"icon": "headphones", "title": "Podcast Episodes", "description": "Episode listings with audio player and show notes"},
            {"icon": "calendar", "title": "Broadcast Schedule", "description": "Upcoming streams with countdown timers"},
            {"icon": "play", "title": "Block Types", "description": "Embeddable live status, episode list, and schedule blocks"},
        ],
    },
    {
        "slug": "charlotte",
        "title": "Charlotte AI",
        "headline": "Charlotte AI Plugin",
        "subheadline": "Knowledge base collections, page ingestion, and chat widget configuration.",
        "meta": "Charlotte AI plugin for Sigil CMS: knowledge base collections, page ingestion, chat widget config.",
        "text": textwrap.dedent("""\
## Overview

The Charlotte AI plugin connects your Sigil site to Charlotte (Netrun Systems' AI assistant platform). It provides a visitor-facing chat widget powered by Charlotte's knowledge base, with the ability to ingest your site's pages as knowledge context.

This is distinct from the AI Advisor plugin — Charlotte is a standalone AI platform with its own knowledge management, while the Advisor plugin uses Gemini directly with pgvector.

## Key Features

- **Chat Widget** — floating chat bubble on your site where visitors ask questions and get AI-powered answers.
- **Knowledge Collections** — organize knowledge into collections (e.g., "Product Docs", "FAQ", "Support").
- **Page Ingestion** — automatically ingest published Sigil pages into Charlotte's knowledge base.
- **Widget Config** — customize position, colors, welcome message, and suggested questions.
- **Conversation History** — view past conversations in the admin panel.

## How to Enable

```bash
PLUGIN_CHARLOTTE=true
CHARLOTTE_API_URL="https://charlotte-ingest-xxxxx.run.app"
CHARLOTTE_API_KEY="..."
```

## Admin Interface

- **Collections** — manage knowledge base collections.
- **Ingestion** — select pages to ingest, view ingestion status.
- **Widget** — configure chat widget appearance and behavior.
- **Conversations** — browse visitor conversations.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/charlotte/ingest` | Admin | Ingest pages into Charlotte |
| GET | `/api/admin/charlotte/collections` | Admin | List knowledge collections |
| PUT | `/api/admin/charlotte/widget` | Admin | Update widget config |
| GET | `/api/admin/charlotte/conversations` | Admin | List conversations |
| POST | `/api/public/sites/:siteId/charlotte/chat` | Public | Chat endpoint (proxied to Charlotte) |

## Use Cases

- **Customer support** — AI answers visitor questions using your site content.
- **Documentation search** — natural language search over your knowledge base.
- **Sales assistance** — AI helps visitors find the right product or service.
"""),
        "grid": [
            {"icon": "message-circle", "title": "Chat Widget", "description": "Floating chat bubble with AI-powered answers from your content"},
            {"icon": "database", "title": "Knowledge Collections", "description": "Organize knowledge into themed collections for targeted responses"},
            {"icon": "file-plus", "title": "Page Ingestion", "description": "Auto-ingest published pages into Charlotte's knowledge base"},
            {"icon": "settings", "title": "Widget Config", "description": "Customize position, colors, welcome message, and suggested questions"},
        ],
    },
    {
        "slug": "support",
        "title": "Support Panel",
        "headline": "Support Panel Plugin",
        "subheadline": "Announcements, configurable help widget, and feature toggles.",
        "meta": "Support Panel plugin for Sigil CMS: announcements, configurable help widget, feature toggles.",
        "text": textwrap.dedent("""\
## Overview

The Support Panel plugin adds a lightweight customer support layer to your Sigil site. It provides an announcements system for notifying visitors of updates, a configurable help widget with quick-access links, and feature toggles for controlling which support options are visible.

## Key Features

- **Announcements** — create banner announcements (info, warning, success types) displayed site-wide or on specific pages.
- **Help Widget** — floating help button with configurable links (FAQ, documentation, contact, chat).
- **Feature Toggles** — enable/disable support features per site (announcements, help widget, feedback form).
- **Announcement Scheduling** — set start and end dates for time-limited announcements.
- **Dismissible Banners** — visitors can dismiss announcements; preference stored in localStorage.

## How to Enable

```bash
PLUGIN_SUPPORT=true
```

## Admin Interface

- **Announcements** — CRUD with scheduling, page targeting, and type selection.
- **Help Widget** — configure links, position, icon, and visibility.
- **Feature Toggles** — toggle individual support features on/off.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/public/sites/:siteId/support/announcements` | Public | Active announcements |
| GET | `/api/public/sites/:siteId/support/widget` | Public | Help widget config |
| POST | `/api/admin/support/announcements` | Admin | Create announcement |
| PUT | `/api/admin/support/announcements/:id` | Admin | Update announcement |
| DELETE | `/api/admin/support/announcements/:id` | Admin | Delete announcement |
| PUT | `/api/admin/support/widget` | Admin | Update widget config |
| PUT | `/api/admin/support/toggles` | Admin | Update feature toggles |

## Use Cases

- **Product updates** — announce new features with a site-wide info banner.
- **Maintenance notices** — warn visitors of upcoming downtime with a warning banner.
- **Support hub** — help widget linking to docs, FAQ, and contact form.
"""),
        "grid": [
            {"icon": "bell", "title": "Announcements", "description": "Site-wide or page-specific banners with scheduling and dismissal"},
            {"icon": "help-circle", "title": "Help Widget", "description": "Floating help button with configurable quick-access links"},
            {"icon": "toggle-right", "title": "Feature Toggles", "description": "Enable or disable individual support features per site"},
            {"icon": "clock", "title": "Scheduling", "description": "Set start and end dates for time-limited announcements"},
        ],
    },
    {
        "slug": "migrate",
        "title": "Site Migration",
        "headline": "Site Migration Plugin",
        "subheadline": "WordPress, Shopify, and Square Online import with progress tracking.",
        "meta": "Site Migration plugin for Sigil CMS: WordPress/Shopify/Square import, progress tracking, validation.",
        "text": textwrap.dedent("""\
## Overview

The Site Migration plugin provides the admin interface and background processing for importing content from other platforms into Sigil. It works with the Migration feature to provide a guided import wizard with progress tracking and validation.

This plugin differs from the Migration feature page in that it focuses on the plugin mechanics — the admin interface, API endpoints, and configuration. See [Migration](/features/migration) for supported source platforms and import details.

## Key Features

- **Import Wizard** — step-by-step guided flow: select source > upload/connect > preview > import.
- **Progress Tracking** — real-time progress bar for large imports with item-by-item status.
- **Validation** — pre-import validation checks for slug conflicts, missing media, and unsupported content types.
- **Rollback** — undo an import and remove all imported content.
- **Import History** — log of past imports with item counts and status.

## How to Enable

```bash
PLUGIN_MIGRATE=true
```

## Admin Interface

- **Migration** — appears in admin sidebar under Settings.
- **Import Wizard** — multi-step form guiding through the import process.
- **History** — list of past imports with counts and status.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/migrate/preview` | Admin | Preview import (dry run) |
| POST | `/api/admin/migrate/start` | Admin | Start import |
| GET | `/api/admin/migrate/status/:jobId` | Admin | Import progress |
| POST | `/api/admin/migrate/rollback/:jobId` | Admin | Rollback an import |
| GET | `/api/admin/migrate/history` | Admin | Past import log |

## Use Cases

- **Platform switch** — migrate from WordPress to Sigil with guided wizard.
- **Agency onboarding** — import client's existing content during setup.
- **Consolidation** — merge content from multiple platforms into one Sigil site.
"""),
        "grid": [
            {"icon": "download", "title": "Import Wizard", "description": "Step-by-step guided flow for selecting source and importing content"},
            {"icon": "loader", "title": "Progress Tracking", "description": "Real-time progress bar with per-item status updates"},
            {"icon": "check-circle", "title": "Validation", "description": "Pre-import checks for slug conflicts and unsupported content"},
            {"icon": "rotate-ccw", "title": "Rollback", "description": "Undo an import and remove all imported content"},
        ],
    },
    {
        "slug": "webhooks",
        "title": "Webhooks",
        "headline": "Webhooks Plugin",
        "subheadline": "Endpoint management, event filtering, HMAC signing, and delivery log.",
        "meta": "Webhooks plugin for Sigil CMS: endpoint management, event filtering, HMAC signing, delivery log, retry.",
        "text": textwrap.dedent("""\
## Overview

The Webhooks plugin lets you push content events from your Sigil site to external services. When pages are published, forms are submitted, or orders are created, Sigil sends an HTTP POST to your configured endpoints. Events are signed with HMAC-SHA256 for security, and failed deliveries are retried automatically.

## Key Features

- **Endpoint Management** — register webhook URLs with descriptions and active/inactive toggle.
- **Event Filtering** — subscribe each endpoint to specific events (page.published, form.submitted, order.created, etc.).
- **HMAC Signing** — every payload is signed with a shared secret (`X-Sigil-Signature` header) so receivers can verify authenticity.
- **Delivery Log** — view delivery attempts per endpoint with status code, response time, and payload.
- **Automatic Retry** — failed deliveries (non-2xx) are retried 3 times with exponential backoff (2s, 8s, 32s).

## How to Enable

```bash
PLUGIN_WEBHOOKS=true
```

## Admin Interface

- **Endpoints** — CRUD list with URL, description, event subscriptions, and status.
- **Delivery Log** — per-endpoint log of delivery attempts with expandable payload/response.
- **Test** — send a test payload to verify endpoint connectivity.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/webhooks/endpoints` | Admin | List endpoints |
| POST | `/api/admin/webhooks/endpoints` | Admin | Create endpoint |
| PUT | `/api/admin/webhooks/endpoints/:id` | Admin | Update endpoint |
| DELETE | `/api/admin/webhooks/endpoints/:id` | Admin | Delete endpoint |
| GET | `/api/admin/webhooks/endpoints/:id/deliveries` | Admin | Delivery log |
| POST | `/api/admin/webhooks/endpoints/:id/test` | Admin | Send test payload |

## Event Types

| Event | Triggered When |
|-------|---------------|
| `page.published` | A page is published |
| `page.unpublished` | A page is unpublished |
| `page.deleted` | A page is deleted |
| `form.submitted` | A contact form is submitted |
| `order.created` | A new order is placed |
| `subscriber.added` | A new mailing list subscriber |

## Payload Format

```json
{
  "event": "page.published",
  "timestamp": "2026-03-26T10:00:00Z",
  "site_id": "...",
  "data": { /* event-specific payload */ }
}
```

## Use Cases

- **Slack notifications** — post to a Slack channel when new content is published.
- **CRM sync** — create contacts in an external CRM when forms are submitted.
- **CI/CD triggers** — trigger a build when content changes (static site generation).
"""),
        "grid": [
            {"icon": "link", "title": "Endpoint Management", "description": "Register webhook URLs with event subscriptions and active/inactive toggle"},
            {"icon": "filter", "title": "Event Filtering", "description": "Subscribe each endpoint to specific events like page.published"},
            {"icon": "lock", "title": "HMAC Signing", "description": "SHA-256 payload signatures for webhook authenticity verification"},
            {"icon": "repeat", "title": "Retry & Delivery Log", "description": "3x automatic retry with exponential backoff and full delivery history"},
        ],
    },
    {
        "slug": "pos",
        "title": "Poppies POS",
        "headline": "Poppies POS Plugin",
        "subheadline": "Point-of-sale register interface with product grid, cart, and payment processing.",
        "meta": "Poppies POS plugin for Sigil CMS: register interface, product grid, cart, card/cash payment, session management.",
        "text": textwrap.dedent("""\
## Overview

The Poppies POS plugin adds a point-of-sale register interface to your Sigil admin panel. It's designed for brick-and-mortar businesses that also have a website — manage your online content and in-store sales from the same platform. The POS includes a product grid, cart, card/cash payment processing, and session management.

## Key Features

- **Register Interface** — full-screen POS layout optimized for touch screens and tablets.
- **Product Grid** — quick-select grid of products with images, names, and prices.
- **Cart** — add items, adjust quantities, apply discounts, calculate totals with tax.
- **Payment Processing** — card payments via Stripe Terminal, or cash with change calculation.
- **Session Management** — open/close register sessions, track cash drawer balance, end-of-day reconciliation.
- **Receipts** — digital receipts via email, or print via receipt printer integration.

## How to Enable

```bash
PLUGIN_POS=true
STRIPE_SECRET_KEY="sk_..."          # For card payments
STRIPE_TERMINAL_LOCATION="tml_..."  # Stripe Terminal hardware location
```

## Admin Interface

- **POS** — dedicated route (`/admin/pos`) with full-screen register layout.
- **Sessions** — list of register sessions with open/close times and totals.
- **Reports** — daily sales summary, payment method breakdown, top products.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/pos/session/open` | Admin | Open a register session |
| POST | `/api/admin/pos/session/close` | Admin | Close session with reconciliation |
| POST | `/api/admin/pos/transaction` | Admin | Process a transaction |
| GET | `/api/admin/pos/session/current` | Admin | Current session info |
| GET | `/api/admin/pos/reports/daily` | Admin | Daily sales report |

## Use Cases

- **Retail stores** — in-store sales with the same product catalog as the online store.
- **Coffee shops** — quick-select product grid for fast order processing.
- **Pop-up events** — mobile POS on a tablet with Stripe Terminal reader.
"""),
        "grid": [
            {"icon": "monitor", "title": "Register Interface", "description": "Full-screen POS layout optimized for touch screens and tablets"},
            {"icon": "grid", "title": "Product Grid", "description": "Quick-select grid with images, names, and prices for fast checkout"},
            {"icon": "credit-card", "title": "Card & Cash", "description": "Stripe Terminal for card payments, cash mode with change calculation"},
            {"icon": "clipboard", "title": "Session Management", "description": "Open/close sessions, track cash drawer, end-of-day reconciliation"},
        ],
    },
]

# =============================================================================
# GENERATE SQL
# =============================================================================

def main():
    lines = []
    lines.append("-- Sigil CMS: 43 Detail Pages Seed")
    lines.append("-- Generated by seed-detail-pages.py")
    lines.append("BEGIN;\n")

    # Track page IDs for feature_grid link updates
    feature_page_ids = {}  # slug -> page_id
    plugin_page_ids = {}   # slug -> page_id

    # --- FEATURE PAGES ---
    lines.append("-- =============================================")
    lines.append("-- FEATURE DETAIL PAGES (21)")
    lines.append("-- =============================================\n")

    for i, feat in enumerate(FEATURE_PAGES):
        page_id, page_sql = emit_page(
            title=feat["title"],
            slug=feat["slug"],
            full_path=f'/features/{feat["slug"]}',
            parent_id=FEATURES_PAGE_ID,
            sort_order=i + 1,
            meta_desc=feat["meta"],
        )
        feature_page_ids[feat["slug"]] = page_id
        lines.append(f'-- Feature: {feat["title"]}')
        lines.append(page_sql)

        # Hero block
        hero_content = {
            "headline": feat["headline"],
            "subheadline": feat["subheadline"],
        }
        lines.append(emit_block(page_id, "hero", hero_content, 0))

        # Text block
        text_content = {"body": feat["text"], "format": "markdown"}
        lines.append(emit_block(page_id, "text", text_content, 1))

        # CTA block
        cta_content = {
            "headline": "Explore All Features",
            "description": "See the complete list of content blocks and platform capabilities.",
            "buttonText": "View Features",
            "buttonLink": "/features",
        }
        lines.append(emit_block(page_id, "cta", cta_content, 2))

    # --- PLUGIN PAGES ---
    lines.append("\n-- =============================================")
    lines.append("-- PLUGIN DETAIL PAGES (22)")
    lines.append("-- =============================================\n")

    for i, plug in enumerate(PLUGIN_PAGES):
        page_id, page_sql = emit_page(
            title=plug["title"],
            slug=plug["slug"],
            full_path=f'/plugins/{plug["slug"]}',
            parent_id=PLUGINS_PAGE_ID,
            sort_order=i + 1,
            meta_desc=plug["meta"],
        )
        plugin_page_ids[plug["slug"]] = page_id
        lines.append(f'-- Plugin: {plug["title"]}')
        lines.append(page_sql)

        # Hero block
        hero_content = {
            "headline": plug["headline"],
            "subheadline": plug["subheadline"],
        }
        lines.append(emit_block(page_id, "hero", hero_content, 0))

        # Text block
        text_content = {"body": plug["text"], "format": "markdown"}
        lines.append(emit_block(page_id, "text", text_content, 1))

        # Feature grid block (plugin capabilities)
        if "grid" in plug:
            grid_content = {
                "columns": 2,
                "headline": "Capabilities",
                "features": plug["grid"],
            }
            lines.append(emit_block(page_id, "feature_grid", grid_content, 2))

        # CTA block
        cta_content = {
            "headline": "Explore All Plugins",
            "description": "See the complete plugin ecosystem and find what you need.",
            "buttonText": "View Plugins",
            "buttonLink": "/plugins",
        }
        lines.append(emit_block(page_id, "cta", cta_content, 3))

    # --- UPDATE FEATURE_GRID BLOCKS ON FEATURES PAGE ---
    lines.append("\n-- =============================================")
    lines.append("-- UPDATE FEATURE_GRID LINKS ON /features PAGE")
    lines.append("-- =============================================\n")

    # Feature grid 1 (Content Blocks) - block b230266f
    feature_grid_1_slug_map = {
        "Hero": "hero-block",
        "Text & Rich Text": "text-blocks",
        "Feature Grid": "feature-grid",
        "Pricing Table": "pricing-table",
        "Gallery": "gallery",
        "CTA & Forms": "cta-forms",
        "FAQ": "faq",
        "Timeline": "timeline",
        "Stats Bar": "stats-bar",
        "Testimonial": "testimonials",
        "Bento Grid": "bento-grid",
        "Code Block": "code-block",
    }

    features_grid1 = [
        {"icon": "star", "image": "/static/screenshot-editor.png", "title": "Hero", "description": "Full-width hero sections with background images, CTAs, and alignment options", "link": "/features/hero-block"},
        {"icon": "type", "image": "/static/screenshot-editor.png", "title": "Text & Rich Text", "description": "Rich text with Markdown, HTML, or plain formatting. WYSIWYG for non-technical editors.", "link": "/features/text-blocks"},
        {"icon": "grid", "image": "/static/screenshot-dashboard.png", "title": "Feature Grid", "description": "Responsive card grids with icons, images, titles, and descriptions", "link": "/features/feature-grid"},
        {"icon": "dollar-sign", "image": "/static/screenshot-commerce.png", "title": "Pricing Table", "description": "Tiered pricing cards with feature lists and CTA buttons", "link": "/features/pricing-table"},
        {"icon": "image", "image": "/static/screenshot-design.png", "title": "Gallery", "description": "Image galleries with grid and masonry layouts", "link": "/features/gallery"},
        {"icon": "mouse-pointer", "image": "/static/screenshot-dashboard.png", "title": "CTA & Forms", "description": "Call-to-action sections and configurable contact forms with validation", "link": "/features/cta-forms"},
        {"icon": "help-circle", "image": "/static/screenshot-docs.png", "title": "FAQ", "description": "Accordion-style frequently asked questions", "link": "/features/faq"},
        {"icon": "clock", "image": "/static/screenshot-editor.png", "title": "Timeline", "description": "Chronological event timelines for milestones and history", "link": "/features/timeline"},
        {"icon": "bar-chart", "image": "/static/screenshot-analytics.png", "title": "Stats Bar", "description": "Horizontal stat counters for key metrics", "link": "/features/stats-bar"},
        {"icon": "message-circle", "image": "/static/screenshot-community.png", "title": "Testimonial", "description": "Customer quotes with avatars, names, and roles", "link": "/features/testimonials"},
        {"icon": "layout", "image": "/static/screenshot-editor.png", "title": "Bento Grid", "description": "Visual layout presets: 2-col, 3-col, featured-left, featured-right", "link": "/features/bento-grid"},
        {"icon": "code", "image": "/static/screenshot-editor.png", "title": "Code Block", "description": "Syntax-highlighted code snippets with language detection", "link": "/features/code-block"},
    ]
    grid1_json = sql_str(json.dumps({"columns": 3, "features": features_grid1, "headline": "Content Blocks"}, ensure_ascii=False))
    lines.append(f"UPDATE cms_content_blocks SET content = '{grid1_json}'::jsonb, updated_at = NOW()\n  WHERE id = 'b230266f-db46-4ff3-85f4-4ae4d6a14c3a';\n")

    # Feature grid 2 (Platform Features) - block 1b744fb7
    features_grid2 = [
        {"icon": "users", "image": "/static/screenshot-sites.png", "title": "Multi-Tenancy", "description": "Full tenant isolation with row-level security. One deployment, unlimited sites.", "link": "/features/multi-tenancy"},
        {"icon": "globe", "image": "/static/screenshot-editor.png", "title": "Internationalization", "description": "Multilingual content management with per-language page variants", "link": "/features/i18n"},
        {"icon": "link", "image": "/static/screenshot-sites.png", "title": "Custom Domains", "description": "Map any domain to any site with automatic SSL provisioning", "link": "/features/custom-domains"},
        {"icon": "git-branch", "image": "/static/screenshot-editor.png", "title": "Page Revisions", "description": "Version history for every page with one-click rollback", "link": "/features/revisions"},
        {"icon": "shield", "image": "/static/screenshot-dashboard.png", "title": "Role-Based Access", "description": "Admin, editor, and viewer roles with granular permissions", "link": "/features/roles"},
        {"icon": "palette", "image": "/static/screenshot-design.png", "title": "Design Playground", "description": "70+ Google Fonts, button shapes, spacing, shadows — all with live preview", "link": "/features/design-playground"},
        {"icon": "upload-cloud", "image": "/static/screenshot-platform.png", "title": "Multi-Cloud Storage", "description": "GCS, Azure Blob, and S3 storage backends with automatic optimization", "link": "/features/storage"},
        {"icon": "search", "image": "/static/screenshot-dashboard.png", "title": "SEO", "description": "Meta tags, Open Graph, structured data, and sitemap generation", "link": "/features/seo-tools"},
        {"icon": "download", "image": "/static/screenshot-platform.png", "title": "Migration", "description": "Import content from WordPress, Shopify, and Square Online", "link": "/features/migration"},
    ]
    grid2_json = sql_str(json.dumps({"columns": 3, "features": features_grid2, "headline": "Platform Features"}, ensure_ascii=False))
    lines.append(f"UPDATE cms_content_blocks SET content = '{grid2_json}'::jsonb, updated_at = NOW()\n  WHERE id = '1b744fb7-e50f-4409-9146-e4997c0f2ef3';\n")

    # --- UPDATE FEATURE_GRID BLOCKS ON /plugins PAGE ---
    lines.append("\n-- =============================================")
    lines.append("-- UPDATE FEATURE_GRID LINKS ON /plugins PAGE")
    lines.append("-- =============================================\n")

    # Plugin grid 1 (Universal Plugins) - block 64094bed
    plugins_grid1 = [
        {"icon": "search", "image": "/static/screenshot-dashboard.png", "title": "SEO", "description": "Meta tags, Open Graph, sitemaps, and structured data for every page", "link": "/plugins/seo"},
        {"icon": "music", "image": "/static/screenshot-editor.png", "title": "Artist Content", "description": "Releases, events, streaming links, and bio management for musicians", "link": "/plugins/artist"},
        {"icon": "mail", "image": "/static/screenshot-dashboard.png", "title": "Mailing List", "description": "Email capture forms with double opt-in and CSV export", "link": "/plugins/mailing-list"},
        {"icon": "phone", "image": "/static/screenshot-dashboard.png", "title": "Contact & Booking", "description": "Configurable contact forms with field validation and email notifications", "link": "/plugins/contact"},
        {"icon": "camera", "image": "/static/screenshot-design.png", "title": "Photos", "description": "Photo galleries with GCS, Azure Blob, or S3 storage backends", "link": "/plugins/photos"},
        {"icon": "cpu", "image": "/static/screenshot-platform.png", "title": "AI Advisor", "description": "AI-powered design suggestions and content recommendations via Gemini", "link": "/plugins/advisor"},
        {"icon": "shopping-cart", "image": "/static/screenshot-commerce.png", "title": "Store (Stripe)", "description": "Product catalog, checkout, and order management powered by Stripe", "link": "/plugins/store"},
        {"icon": "package", "image": "/static/screenshot-commerce.png", "title": "Merch (Printful)", "description": "Print-on-demand merchandise with automatic fulfillment via Printful", "link": "/plugins/merch"},
        {"icon": "credit-card", "image": "/static/screenshot-commerce.png", "title": "PayPal", "description": "PayPal Smart Payment Buttons and checkout integration", "link": "/plugins/paypal"},
        {"icon": "calendar", "image": "/static/screenshot-booking.png", "title": "Booking", "description": "Appointment scheduling with Google Calendar sync and availability management", "link": "/plugins/booking"},
        {"icon": "book-open", "image": "/static/screenshot-docs.png", "title": "Docs / Knowledge Base", "description": "Documentation portal with categories, search, versioning, and feedback", "link": "/plugins/docs"},
        {"icon": "activity", "image": "/static/screenshot-analytics.png", "title": "Resonance Analytics", "description": "Block-level content analytics — measures engagement per block, not per page", "link": "/plugins/resonance"},
    ]
    pgrid1_json = sql_str(json.dumps({"columns": 3, "features": plugins_grid1, "headline": "Universal Plugins"}, ensure_ascii=False))
    lines.append(f"UPDATE cms_content_blocks SET content = '{pgrid1_json}'::jsonb, updated_at = NOW()\n  WHERE id = '64094bed-c2fb-45f8-8c20-a11d14fdba37';\n")

    # Plugin grid 2 (Netrun Platform Plugins) - block a177ca8a
    plugins_grid2 = [
        {"icon": "message-square", "image": "/static/screenshot-community.png", "title": "Community Forum", "description": "Discussion boards with threads, reactions, and moderation tools", "link": "/plugins/community"},
        {"icon": "shopping-bag", "image": "/static/screenshot-marketplace.png", "title": "Plugin Marketplace", "description": "Browse and install community plugins from the marketplace", "link": "/plugins/marketplace"},
        {"icon": "box", "image": "/static/screenshot-platform.png", "title": "KAMERA 3D Scanning", "description": "3D site scanning and spatial data integration via KAMERA pipeline", "link": "/plugins/kamera"},
        {"icon": "briefcase", "image": "/static/screenshot-platform.png", "title": "KOG CRM", "description": "Customer relationship management with pipeline tracking and contacts", "link": "/plugins/kog"},
        {"icon": "radio", "image": "/static/screenshot-platform.png", "title": "Intirkast Broadcasting", "description": "Live streaming and broadcasting integration for events and shows", "link": "/plugins/intirkast"},
        {"icon": "bot", "image": "/static/screenshot-platform.png", "title": "Charlotte AI", "description": "AI assistant integration for visitor chat and content generation", "link": "/plugins/charlotte"},
        {"icon": "headphones", "image": "/static/screenshot-dashboard.png", "title": "Support Panel", "description": "Customer support with announcements and configurable help widget", "link": "/plugins/support"},
        {"icon": "download", "image": "/static/screenshot-sites.png", "title": "Site Migration", "description": "Import content from WordPress, Shopify, and Square Online", "link": "/plugins/migrate"},
        {"icon": "zap", "image": "/static/screenshot-dashboard.png", "title": "Webhooks", "description": "Push content events to external services with retry and delivery logs", "link": "/plugins/webhooks"},
        {"icon": "monitor", "image": "/static/screenshot-pos.png", "title": "Poppies POS", "description": "Point-of-sale register with Stripe Terminal integration", "link": "/plugins/pos"},
    ]
    pgrid2_json = sql_str(json.dumps({"columns": 3, "features": plugins_grid2, "headline": "Netrun Platform Plugins"}, ensure_ascii=False))
    lines.append(f"UPDATE cms_content_blocks SET content = '{pgrid2_json}'::jsonb, updated_at = NOW()\n  WHERE id = 'a177ca8a-687e-42e3-9fbe-e7958ad7109b';\n")

    lines.append("COMMIT;")
    print("\n".join(lines))


if __name__ == "__main__":
    main()

---
title: Content Blocks
description: The composable block system with 23 built-in types across 5 categories.
order: 3
---

## Block Architecture

Content blocks are the building units of pages. Each block has a `blockType`, `content` (JSON), `settings` (JSON), a `sortOrder`, and a visibility flag.

Blocks are scoped to pages: `/api/v1/sites/:siteId/pages/:pageId/blocks`.

## Block CRUD

### List blocks

```
GET /api/v1/sites/:siteId/pages/:pageId/blocks
```

Query params: `page`, `limit`, `blockType`, `isVisible`.

### Create a block

```
POST /api/v1/sites/:siteId/pages/:pageId/blocks
```

```json
{
  "blockType": "hero",
  "content": {
    "headline": "Welcome to Our Site",
    "subheadline": "A brief description.",
    "ctaText": "Get Started",
    "ctaLink": "/signup",
    "alignment": "center"
  },
  "sortOrder": 0,
  "isVisible": true
}
```

### Reorder blocks

```
PUT /api/v1/sites/:siteId/pages/:pageId/blocks/reorder
```

```json
{
  "blockIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

## Block Type Catalog

Fetch the full catalog of available block types:

```
GET /api/v1/blocks/types
GET /api/v1/blocks/types?category=content
```

### Layout Blocks

| Type | Label | Description |
|------|-------|-------------|
| `hero` | Hero | Full-width hero with headline, subheadline, CTA buttons |
| `cta` | Call to Action | Prominent CTA section with headline and button |
| `bento_grid` | Bento Grid | Asymmetric bento-style grid layout |

### Content Blocks

| Type | Label | Description |
|------|-------|-------------|
| `text` | Text | Plain or Markdown formatted text |
| `rich_text` | Rich Text | HTML rich text with formatting |
| `feature_grid` | Feature Grid | Grid of feature cards with icon, title, description |
| `pricing_table` | Pricing Table | Pricing tiers with features and CTA buttons |
| `testimonial` | Testimonials | Customer testimonials in grid or carousel |
| `faq` | FAQ | Accordion-style frequently asked questions |
| `stats_bar` | Stats Bar | Key statistics or metrics display |
| `timeline` | Timeline | Chronological events or milestones |
| `code_block` | Code Block | Syntax-highlighted code snippet |
| `custom` | Custom HTML | Raw HTML, CSS, and JavaScript |

### Media Blocks

| Type | Label | Description |
|------|-------|-------------|
| `image` | Image | Single image with alt text and caption |
| `video` | Video | Embedded YouTube or Vimeo video |
| `gallery` | Gallery | Image gallery in grid, masonry, or carousel layout |

### Interactive Blocks

| Type | Label | Description |
|------|-------|-------------|
| `contact_form` | Contact Form | Configurable form with custom fields |
| `newsletter` | Newsletter | Email signup block |

### Artist Blocks

| Type | Label | Description |
|------|-------|-------------|
| `embed_player` | Embed Player | Spotify, YouTube, SoundCloud embeds |
| `release_list` | Release List | Music releases (albums, EPs, singles) |
| `event_list` | Event List | Upcoming shows and events |
| `social_links` | Social Links | Social media links with icons |
| `link_tree` | Link Tree | Linktree-style page with avatar and links |
| `artist_bio` | Artist Bio | Biography with photo, genres, social links |

## Plugin Block Types

Plugins can register additional block types. The Docs plugin adds `doc_callout` and `doc_code`. The Support plugin adds `support_button`. The Resonance plugin adds analytics-enabled variants.

Fetch the complete list (including plugin blocks) from the manifest:

```
GET /api/v1/plugins/manifest
```

---
title: Migration from Other CMS
description: Import content from WordPress, Shopify, and Square Online into Sigil.
order: 6
---

## Overview

The **Migrate** plugin imports existing sites into Sigil from three platforms:

- **WordPress** -- WXR export + REST API
- **Shopify** -- Admin API + Storefront API
- **Square Online** -- Catalog API + web scraping

No required environment variables -- the plugin is always available.

## What Gets Imported

| Content Type | WordPress | Shopify | Square |
|-------------|-----------|---------|--------|
| Pages/Products | Yes | Yes | Yes |
| Blog posts | Yes | Blog articles | -- |
| Media/Images | Download + rewrite URLs | Product images | Catalog images |
| SEO metadata | Yoast, RankMath | Built-in meta | -- |
| Navigation menus | Yes | -- | -- |
| Theme tokens | Colors, fonts, spacing | -- | -- |

## Block Mapping

The migrator maps source content blocks to Sigil block types:

### WordPress

| WordPress Block | Sigil Block |
|----------------|-------------|
| Gutenberg paragraph | `text` |
| Gutenberg heading | `text` (with heading) |
| Gutenberg image | `image` |
| Gutenberg gallery | `gallery` |
| Gutenberg video | `video` |
| Elementor sections | `hero`, `cta`, `feature_grid` |

### Shopify

| Shopify Section | Sigil Block |
|----------------|-------------|
| Liquid hero | `hero` |
| Product grid | `feature_grid` |
| Rich text | `rich_text` |
| Image banner | `image` |

## Migration Process

1. **Extract** -- pull content from the source platform
2. **Map** -- convert source blocks to Sigil block types
3. **Download media** -- fetch images and rewrite URLs
4. **Preserve SEO** -- carry over meta titles, descriptions, OG images
5. **Import navigation** -- recreate menu structure as page hierarchy

Per-item error tracking with retry support ensures partial failures don't block the entire import.

## API

Migration endpoints are provided by the plugin when loaded. Consult the plugin source at `plugins/migrate/src/routes.ts` for the full API.

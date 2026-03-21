---
title: Docs Plugin
description: Knowledge base with categories, full-text search, versioning, and reader feedback.
order: 5
---

## Overview

The Docs plugin turns Sigil into a documentation portal. Articles link to CMS pages (using the block editor for content), and the plugin adds KB-specific metadata, categorization, revision tracking, and a "Was this helpful?" feedback system.

**Required env**: None.

## Features

- **Article categories** -- hierarchical categories with slug, icon, and sort order
- **Full-text search** -- search articles by title, excerpt, and tags
- **Version history** -- track revisions with change notes and version numbers
- **Reader feedback** -- "Was this helpful?" with optional comments
- **View tracking** -- count article views
- **Featured and pinned articles** -- highlight important content

## Database Tables

| Table | Purpose |
|-------|---------|
| `cms_doc_categories` | Hierarchical article categories per site |
| `cms_doc_articles` | Article metadata linked to CMS pages |
| `cms_doc_revisions` | Version history with content snapshots |
| `cms_doc_feedback` | Reader helpfulness feedback |

## Article Properties

| Field | Type | Description |
|-------|------|-------------|
| `page_id` | UUID | Link to CMS page (content via block editor) |
| `category_id` | UUID | Category assignment |
| `slug` | string | URL identifier |
| `title` | string | Article title |
| `excerpt` | text | Short summary for search results |
| `tags` | JSONB | Array of tag strings |
| `is_featured` | boolean | Featured article flag |
| `is_pinned` | boolean | Pinned to top |
| `view_count` | integer | Read count |
| `helpful_yes` / `helpful_no` | integer | Feedback counters |

## Block Types

- `doc_callout` -- styled callout box (info, warning, tip, danger)
- `doc_code` -- code block with syntax highlighting

## Routes

### Admin

- `/api/v1/sites/:siteId/docs` -- article and category management

### Public

- `/api/v1/public/docs/:siteSlug` -- search, browse, and read articles

## Admin Navigation

- **Articles** -- manage knowledge base articles
- **Categories** -- organize article hierarchy
- **Feedback** -- review reader feedback

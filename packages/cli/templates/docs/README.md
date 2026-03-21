# {{SITE_NAME}}

A documentation site built with [Sigil CMS](https://github.com/Netrun-Systems/netrun-cms) and the Docs plugin.

## Sections

- **Getting Started** — Introduction, Installation, Quick Start
- **API Reference** — Overview, Authentication, Endpoints

## Setup

```bash
npm install
cp .env.example .env   # configure database
sigil migrate
sigil seed
sigil dev
```

## Adding Documentation

Create JSON files in `content/getting-started/` or `content/api-reference/`, then update the sidebar in `sigil.config.ts`.

Each doc file follows this structure:

```json
{
  "_type": "doc",
  "_slug": "section/page-slug",
  "title": "Page Title",
  "section": "section-slug",
  "order": 1,
  "body": "Markdown content here..."
}
```

## Search

Full-text search is enabled by default. The search index is built automatically when the server starts.

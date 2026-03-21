# {{SITE_NAME}}

A creative portfolio built with [Sigil CMS](https://github.com/Netrun-Systems/netrun-cms) and the Artist plugin.

## Pages

- **Home** (`/`) — Hero image with featured gallery items
- **Portfolio** (`/portfolio`) — Filterable gallery of all work
- **About** (`/about`) — Bio, exhibitions, and artist statement
- **Contact** (`/contact`) — Inquiry form

## Setup

```bash
npm install
cp .env.example .env   # configure database
sigil migrate
sigil seed
sigil dev
```

## Adding Work

Add portfolio items via the admin panel at `/admin`, or create JSON files in `content/portfolio/`:

```json
{
  "_type": "portfolio-item",
  "_slug": "piece-title",
  "title": "Piece Title",
  "category": "Painting",
  "date": "2025-01-15",
  "image": { "src": "/uploads/piece.jpg", "alt": "Description" },
  "description": "Medium, dimensions, and context."
}
```

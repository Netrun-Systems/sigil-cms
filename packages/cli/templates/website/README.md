# {{SITE_NAME}}

A business website built with [Sigil CMS](https://github.com/Netrun-Systems/netrun-cms).

## Pages

- **Home** (`/`) — Hero section, features grid, call-to-action
- **About** (`/about`) — Company story with text and image blocks
- **Services** (`/services`) — Service offerings in a feature grid
- **Blog** (`/blog`) — Blog listing with card layout
- **Contact** (`/contact`) — Contact form with email delivery

## Setup

```bash
npm install
cp .env.example .env   # configure database + optional SMTP for contact form
sigil migrate
sigil seed
sigil dev
```

## Customization

Edit the JSON files in `content/` to change page content, or use the admin panel at `/admin` after starting the dev server.

Navigation links are configured in `sigil.config.ts` under the `navigation` key.

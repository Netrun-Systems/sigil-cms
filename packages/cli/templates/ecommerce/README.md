# {{SITE_NAME}}

An online store built with [Sigil CMS](https://github.com/Netrun-Systems/netrun-cms) and the Store plugin.

## Pages

- **Home** (`/`) — Hero with featured products grid
- **Products** (`/products`) — Filterable product catalog with pagination
- **Cart** (`/cart`) — Shopping cart with Stripe checkout

## Setup

```bash
npm install
cp .env.example .env   # configure database + Stripe keys
sigil migrate
sigil seed
sigil dev
```

## Stripe Configuration

1. Create a [Stripe account](https://stripe.com) and get your API keys
2. Set `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` in `.env`
3. For webhooks, run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Set `STRIPE_WEBHOOK_SECRET` from the CLI output

## Adding Products

Add products via the admin panel at `/admin`, or create JSON files in `content/products/`:

```json
{
  "_type": "product",
  "_slug": "product-name",
  "title": "Product Name",
  "price": 2999,
  "currency": "USD",
  "description": "Product description.",
  "image": { "src": "/uploads/product.jpg", "alt": "Product" },
  "featured": true,
  "stock": 50
}
```

Prices are in cents (2999 = $29.99).

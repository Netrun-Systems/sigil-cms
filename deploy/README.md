# Sigil CMS — Deployment Templates

Production-ready deployment templates for Sigil CMS across 5 platforms. Use these directly or via the CLI:

```bash
sigil create --template <platform>
```

## Platform Comparison

| Platform | Est. Cost | Setup Time | Best For |
|----------|-----------|-----------|----------|
| [Docker Compose](./docker-compose/) | $0 + hardware | 5 min | Local dev, small VPS |
| [Google Cloud Run](./gcp/) | ~$5-15/mo | 10 min | Scale-to-zero, lowest cost cloud |
| [AWS Fargate](./aws/) | ~$15-25/mo | 15 min | AWS shops, free tier eligible |
| [Azure Container Apps](./azure/) | ~$20-30/mo | 15 min | Azure shops, AD integration |
| [Ubuntu bare metal](./ubuntu/) | $0 + VPS ($5-10/mo) | 15 min | Full control, any VPS provider |

## Architecture

Every deployment runs 3 services + PostgreSQL:

```
                  ┌────────────────┐
                  │   PostgreSQL   │
                  │  (pgvector)    │
                  └───────┬────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
   ┌──────┴──────┐ ┌─────┴──────┐ ┌──────┴──────┐
   │  sigil-api  │ │sigil-admin │ │sigil-render │
   │  Express.js │ │ Vite SPA   │ │  SSR Pages  │
   │  :3001      │ │ :3000      │ │  :4000      │
   └─────────────┘ └────────────┘ └─────────────┘
```

- **sigil-api**: REST + GraphQL API, auth, content management, media uploads
- **sigil-admin**: React SPA admin panel for managing tenants, sites, pages, and blocks
- **sigil-renderer**: Server-side rendered public-facing pages
- **PostgreSQL**: Data store with pgvector extension for RAG/AI features

## Minimum Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 2 GB | 4 GB |
| CPU | 1 vCPU | 2 vCPU |
| Storage | 1 GB | 10 GB |
| Node.js | 20+ | 20 LTS |
| PostgreSQL | 15+ | 16 with pgvector |

## Quick Bootstrap

After deployment on any platform, create your first tenant:

```bash
curl -X POST http://<api-url>/api/v1/seed/bootstrap \
  -H "Content-Type: application/json" \
  -H "X-Seed-Key: <your-seed-key>" \
  -d '{
    "tenantName": "My Agency",
    "tenantSlug": "agency",
    "adminEmail": "admin@example.com",
    "adminPassword": "your-secure-password"
  }'
```

## Health Checks

All services expose health endpoints:

```bash
# API
curl http://<api-url>/health

# Renderer
curl http://<renderer-url>/health
```

## Environment Variables Reference

See each platform's `.env.example` for the complete list. Core variables shared across all platforms:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | 256-bit key for auth tokens |
| `SEED_API_KEY` | Yes | Bootstrap key (used once, then disable) |
| `NODE_ENV` | Yes | Always `production` for deployments |
| `STRIPE_SECRET_KEY` | No | Stripe billing integration |
| `VITE_UNSPLASH_KEY` | No | Unsplash stock image integration |
| `VITE_PEXELS_KEY` | No | Pexels stock image integration |
| `SITE_SLUG` | Renderer | Tenant slug for the renderer to serve |
| `SITE_NAME` | Renderer | Display name for the rendered site |

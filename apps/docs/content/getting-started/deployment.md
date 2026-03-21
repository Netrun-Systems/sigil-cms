---
title: Deployment
description: Deploy Sigil CMS to Docker, Cloud Run, Azure, or Vercel.
order: 3
---

## Docker Deployment

Sigil ships with a multi-stage Dockerfile at `apps/api/Dockerfile`. Build context must be the repo root:

```bash
docker build -f apps/api/Dockerfile -t sigil-api .
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/sigil \
  -e JWT_SECRET=your-secret-here \
  sigil-api
```

The image uses `node:20-alpine`, runs on port 3000, and bundles all `@netrun-cms/*` packages.

## Google Cloud Run

```bash
# Build and push
docker build -f apps/api/Dockerfile -t us-central1-docker.pkg.dev/PROJECT/repo/sigil-api:latest .
docker push us-central1-docker.pkg.dev/PROJECT/repo/sigil-api:latest

# Deploy
gcloud run deploy sigil-api \
  --image us-central1-docker.pkg.dev/PROJECT/repo/sigil-api:latest \
  --port 3000 \
  --set-env-vars DATABASE_URL=...,JWT_SECRET=... \
  --region us-central1 \
  --allow-unauthenticated
```

## Azure Container Apps

```bash
# Build and push to ACR
docker build -f apps/api/Dockerfile -t myregistry.azurecr.io/sigil-api:latest .
docker push myregistry.azurecr.io/sigil-api:latest

# Update Container App
az containerapp update \
  --name sigil-api \
  --resource-group my-rg \
  --image myregistry.azurecr.io/sigil-api:latest
```

Recommended Container App settings for development:
- **Min replicas**: 0 (scales to zero = no cost when idle)
- **Max replicas**: 1
- **CPU**: 0.25 vCPU
- **Memory**: 0.5 GB
- **Estimated cost**: ~$5/month

## Admin Panel (Static)

The admin is a Vite SPA that can be deployed to any static hosting:

```bash
# Build admin
pnpm --filter @netrun-cms/admin build

# Deploy to Azure Static Web Apps
npx @azure/static-web-apps-cli deploy apps/admin/dist \
  --deployment-token "YOUR_TOKEN"
```

Or deploy `apps/admin/dist/` to Vercel, Netlify, or Cloudflare Pages.

## Database Requirements

Sigil requires PostgreSQL. The production schema lives in `packages/@netrun-cms/db/src/schema.ts` with 7 core tables:

- `cms_tenants` -- multi-tenant isolation
- `cms_sites` -- individual websites
- `cms_pages` -- page content with hierarchy
- `cms_content_blocks` -- composable blocks
- `cms_media` -- file management
- `cms_themes` -- design tokens
- `cms_users` -- authentication

Plugins create additional tables (e.g., `cms_doc_categories`, `cms_store_products`) via their `register()` migration hooks.

## Required Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Token signing (generate with `openssl rand -base64 32`) |
| `CORS_ORIGIN` | Allowed frontend origins |
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | `production` for optimized builds |

# Sigil CMS — Docker Compose Deployment

Run Sigil CMS locally or on any Docker host with a single command.

## Prerequisites

- Docker Engine 24+ and Docker Compose v2
- 2 GB RAM minimum, 4 GB recommended
- Works on macOS, Linux, and Windows (Docker Desktop)

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/Netrun-Systems/sigil-cms.git
   cd sigil-cms/deploy/docker-compose
   ```

2. Configure your environment:
   ```bash
   cp .env.example .env
   # Edit .env — at minimum, change DB_PASSWORD and JWT_SECRET
   ```

3. Start all services:
   ```bash
   docker compose up -d
   ```

4. Verify services are healthy:
   ```bash
   docker compose ps
   curl http://localhost:3001/health
   ```

5. Bootstrap your first tenant:
   ```bash
   curl -X POST http://localhost:3001/api/v1/seed/bootstrap \
     -H "Content-Type: application/json" \
     -H "X-Seed-Key: your-bootstrap-key" \
     -d '{
       "tenantName": "My Agency",
       "tenantSlug": "agency",
       "adminEmail": "admin@example.com",
       "adminPassword": "your-secure-password"
     }'
   ```

6. Access your services:
   - **Admin panel**: http://localhost:3000
   - **API**: http://localhost:3001
   - **Renderer**: http://localhost:4000

## Custom Domain with Traefik (Optional)

To expose Sigil behind a reverse proxy with automatic HTTPS, add Traefik to the compose file or use an external nginx/Caddy instance pointing to the exposed ports.

## Updating

```bash
git pull
docker compose build
docker compose up -d
```

## Backup and Restore

**Backup:**
```bash
docker compose exec postgres pg_dump -U sigil sigil > backup-$(date +%Y%m%d).sql
```

**Restore:**
```bash
docker compose exec -T postgres psql -U sigil sigil < backup-20240101.sql
```

## Stopping and Cleanup

```bash
# Stop services (data preserved in volumes)
docker compose down

# Stop and remove all data (destructive)
docker compose down -v
```

## Resource Usage

| State | RAM | CPU | Storage |
|-------|-----|-----|---------|
| Idle | ~200 MB | Minimal | ~500 MB |
| Active | ~500 MB | 0.5 vCPU | ~500 MB + media |

## Troubleshooting

**API won't start:**
Check that PostgreSQL is healthy first:
```bash
docker compose logs postgres
docker compose exec postgres pg_isready -U sigil
```

**Port conflicts:**
Change the host ports in `.env` (e.g., `API_PORT=3002`).

**Rebuild from scratch:**
```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

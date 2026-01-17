# NetrunCMS Azure Deployment

## Development Environment

This deployment uses shared Netrun infrastructure for minimal cost.

### Resources Created

| Resource | Name | Type | Cost |
|----------|------|------|------|
| Database | `netrun_cms_dev` | PostgreSQL Flexible Server (shared) | $0/mo |
| API | `netrun-cms-api` | Container App (0.25 vCPU, 0.5GB) | ~$5/mo |
| Admin | `netrun-cms-admin` | Static Web App (Free tier) | $0/mo |

**Total Estimated Cost: ~$5/month** (scale to 0 when not in use = $0)

### URLs

- **Admin Panel**: https://polite-rock-07cbf6e0f.2.azurestaticapps.net
- **API Endpoint**: https://netrun-cms-api.orangesmoke-f0fb748a.eastus2.azurecontainerapps.io

### Database Configuration

The CMS uses the shared PostgreSQL Flexible Server:

- **Server**: `intirkast-staging-db.postgres.database.azure.com`
- **Database**: `netrun_cms_dev`
- **SSL**: Required

#### Configure Database Access

1. Get the database admin password from Key Vault:
   ```bash
   az keyvault secret show --vault-name kv-intirkast-final --name POSTGRES-PASSWORD --query value -o tsv
   ```

2. Update the Container App DATABASE_URL secret:
   ```bash
   az containerapp secret set \
     --name netrun-cms-api \
     --resource-group rg-intirkast-staging \
     --secrets "database-url=postgresql://intirkast_admin:PASSWORD@intirkast-staging-db.postgres.database.azure.com:5432/netrun_cms_dev?sslmode=require"

   az containerapp update \
     --name netrun-cms-api \
     --resource-group rg-intirkast-staging \
     --set-env-vars "DATABASE_URL=secretref:database-url"
   ```

3. Run database migrations:
   ```bash
   cd packages/@netrun-cms/db
   pnpm db:generate
   # Apply migrations to the deployed database
   ```

### JWT Secret Configuration

Generate and set a secure JWT secret:

```bash
JWT_SECRET=$(openssl rand -base64 32)
az containerapp secret set \
  --name netrun-cms-api \
  --resource-group rg-intirkast-staging \
  --secrets "jwt-secret=$JWT_SECRET"

az containerapp update \
  --name netrun-cms-api \
  --resource-group rg-intirkast-staging \
  --set-env-vars "JWT_SECRET=secretref:jwt-secret"
```

### Deployment Commands

#### Redeploy API

```bash
# Build and push new image
docker build -f apps/api/Dockerfile -t acrintirkaststaging.azurecr.io/netrun-cms-api:dev .
docker push acrintirkaststaging.azurecr.io/netrun-cms-api:dev

# Update Container App
az containerapp update \
  --name netrun-cms-api \
  --resource-group rg-intirkast-staging \
  --image acrintirkaststaging.azurecr.io/netrun-cms-api:dev
```

#### Redeploy Admin

```bash
# Build admin
pnpm --filter @netrun-cms/admin build

# Deploy
npx @azure/static-web-apps-cli deploy apps/admin/dist \
  --deployment-token "$(az staticwebapp secrets list --name netrun-cms-admin --resource-group rg-intirkast-staging --query 'properties.apiKey' -o tsv)"
```

### Scaling

The Container App is configured with:
- **Min replicas**: 0 (scales to zero when idle = no cost)
- **Max replicas**: 1 (for dev environment)
- **CPU**: 0.25 vCPU
- **Memory**: 0.5 GB

To scale for production:
```bash
az containerapp update \
  --name netrun-cms-api \
  --resource-group rg-intirkast-staging \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1.0Gi
```

### Cleanup

To remove all resources:

```bash
# Delete Container App
az containerapp delete --name netrun-cms-api --resource-group rg-intirkast-staging --yes

# Delete Static Web App
az staticwebapp delete --name netrun-cms-admin --resource-group rg-intirkast-staging --yes

# Delete database (optional - keeps data)
az postgres flexible-server db delete \
  --server-name intirkast-staging-db \
  --resource-group rg-intirkast-staging \
  --database-name netrun_cms_dev --yes
```

---

*Deployed: January 2026*
*Infrastructure: Shared Netrun Resources (rg-intirkast-staging)*

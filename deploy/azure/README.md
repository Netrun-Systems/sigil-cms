# Sigil CMS — Azure Container Apps Deployment

Deploy Sigil CMS to Azure Container Apps with PostgreSQL Flexible Server. Includes a Bicep IaC template for one-click deployment.

## Prerequisites

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) (`az`) authenticated
- [Docker](https://docs.docker.com/get-docker/) (for building images locally)
- An Azure subscription

## Quick Start

### Option A: Shell Script (recommended)

```bash
cd sigil-cms/deploy/azure
chmod +x deploy.sh
./deploy.sh sigil-rg eastus2
```

### Option B: Bicep IaC Template

```bash
# Create resource group
az group create --name sigil-rg --location eastus2

# Deploy all infrastructure
az deployment group create \
  --resource-group sigil-rg \
  --template-file deploy/azure/bicep/main.bicep \
  --parameters \
    dbPassword="$(openssl rand -base64 32 | tr -d '/@\"=+')" \
    jwtSecret="$(openssl rand -hex 32)"

# Get endpoints
az deployment group show --resource-group sigil-rg --name main --query 'properties.outputs'
```

The Bicep template deploys:
- Container Apps Environment with Log Analytics
- 3 Container Apps (API, Admin, Renderer) with auto-scaling
- PostgreSQL 16 Flexible Server (Burstable B1ms)
- Azure Container Registry (Basic)

## Cost Estimate

| Resource | Monthly Cost | Notes |
|----------|-------------|-------|
| Container Apps (3 apps) | ~$5-15 | Scale-to-zero when idle |
| PostgreSQL (B1ms) | ~$13 | Always on (smallest production tier) |
| Container Registry (Basic) | ~$5 | 10 GB included |
| Log Analytics | ~$1-2 | 5 GB free/month |
| **Total** | **~$20-30/mo** | |

## Custom Domain with HTTPS

```bash
# Add custom domain to the renderer
az containerapp hostname add \
  --name sigil-renderer \
  --resource-group sigil-rg \
  --hostname your-domain.com

# Bind a managed certificate (auto-renewed)
az containerapp hostname bind \
  --name sigil-renderer \
  --resource-group sigil-rg \
  --hostname your-domain.com \
  --environment sigil-env
```

## Azure AD Integration (SSO)

Azure Container Apps supports Easy Auth for Azure AD SSO:

```bash
az containerapp auth microsoft update \
  --name sigil-admin \
  --resource-group sigil-rg \
  --client-id <app-registration-client-id> \
  --client-secret <client-secret> \
  --issuer "https://login.microsoftonline.com/<tenant-id>/v2.0"
```

## Secrets Management

Secrets are stored in Azure Key Vault:
- `sigil-db-password` — PostgreSQL password
- `sigil-jwt-secret` — JWT signing key
- `sigil-seed-key` — Bootstrap API key

Retrieve a secret:
```bash
KV_NAME=$(az keyvault list --resource-group sigil-rg --query '[0].name' --output tsv)
az keyvault secret show --vault-name "$KV_NAME" --name sigil-seed-key --query value --output tsv
```

## Health Checks

```bash
API_URL=$(az containerapp show --name sigil-api --resource-group sigil-rg --query 'properties.configuration.ingress.fqdn' --output tsv)
curl "https://$API_URL/health"
```

## Monitoring and Logs

```bash
# Stream logs
az containerapp logs show --name sigil-api --resource-group sigil-rg --follow

# View replicas
az containerapp replica list --name sigil-api --resource-group sigil-rg

# View revision info
az containerapp revision list --name sigil-api --resource-group sigil-rg --output table
```

## Updating

Re-run the deploy script to build new images and update services:
```bash
./deploy.sh sigil-rg eastus2
```

Or update a single service:
```bash
az containerapp update \
  --name sigil-api \
  --resource-group sigil-rg \
  --image <acr>.azurecr.io/sigil-api:new-tag
```

## Backup

```bash
# PostgreSQL backup (automatic with 7-day retention)
# Manual export:
az postgres flexible-server backup create \
  --resource-group sigil-rg \
  --server-name sigil-pgserver \
  --backup-name "manual-$(date +%Y%m%d)"

# List backups
az postgres flexible-server backup list \
  --resource-group sigil-rg \
  --server-name sigil-pgserver \
  --output table
```

## Scaling

```bash
# Scale API for production
az containerapp update \
  --name sigil-api \
  --resource-group sigil-rg \
  --min-replicas 1 \
  --max-replicas 5 \
  --cpu 1.0 \
  --memory 2.0Gi
```

## Teardown

```bash
# Remove the entire resource group (destructive — deletes everything)
az group delete --name sigil-rg --yes --no-wait

# Or remove individual resources:
az containerapp delete --name sigil-api --resource-group sigil-rg --yes
az containerapp delete --name sigil-admin --resource-group sigil-rg --yes
az containerapp delete --name sigil-renderer --resource-group sigil-rg --yes
az postgres flexible-server delete --name sigil-pgserver --resource-group sigil-rg --yes
```

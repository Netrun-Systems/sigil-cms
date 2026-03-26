#!/bin/bash
set -euo pipefail

# =============================================================================
# Sigil CMS — Azure Container Apps Deployment
# Deploys API, Admin, and Renderer to Container Apps with PostgreSQL Flexible Server.
#
# Usage: ./deploy.sh [resource-group] [location]
# Idempotent: safe to run multiple times.
#
# Prerequisites:
#   - Azure CLI (az) authenticated
#   - Docker installed
# =============================================================================

RESOURCE_GROUP="${1:-sigil-rg}"
LOCATION="${2:-eastus2}"
PREFIX="sigil"
DB_NAME="sigil"
DB_USER="sigiladmin"
DB_SKU="Standard_B1ms"
ACR_NAME="${PREFIX}registry$(openssl rand -hex 4)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Verify prerequisites
if ! command -v az &>/dev/null; then
  echo "Error: Azure CLI (az) is required. Install from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
  exit 1
fi

# Check login
if ! az account show &>/dev/null; then
  echo "Error: Not logged in to Azure. Run: az login"
  exit 1
fi

SUBSCRIPTION=$(az account show --query name --output tsv)

echo "============================================="
echo "Deploying Sigil CMS to Azure Container Apps"
echo "  Subscription: $SUBSCRIPTION"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "============================================="

# ---- 1. Resource group -------------------------------------------------------
echo ""
echo "[1/7] Creating resource group..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none 2>/dev/null || true
echo "  Resource group: $RESOURCE_GROUP"

# ---- 2. Container Registry ---------------------------------------------------
echo ""
echo "[2/7] Setting up Container Registry..."
# Check if ACR already exists in the resource group
EXISTING_ACR=$(az acr list --resource-group "$RESOURCE_GROUP" --query '[0].name' --output tsv 2>/dev/null || echo "")
if [[ -n "$EXISTING_ACR" && "$EXISTING_ACR" != "None" ]]; then
  ACR_NAME="$EXISTING_ACR"
  echo "  Using existing ACR: $ACR_NAME"
else
  echo "  Creating ACR: $ACR_NAME"
  az acr create --resource-group "$RESOURCE_GROUP" --name "$ACR_NAME" --sku Basic --admin-enabled true --output none
fi

ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query loginServer --output tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query 'passwords[0].value' --output tsv)

# ---- 3. PostgreSQL Flexible Server -------------------------------------------
echo ""
echo "[3/7] Setting up PostgreSQL..."
DB_SERVER="${PREFIX}-pgserver"
DB_ENDPOINT=$(az postgres flexible-server show --name "$DB_SERVER" --resource-group "$RESOURCE_GROUP" --query fullyQualifiedDomainName --output tsv 2>/dev/null || echo "")

if [[ -z "$DB_ENDPOINT" ]]; then
  DB_PASSWORD=$(openssl rand -base64 32 | tr -d '/@"=+')

  echo "  Creating PostgreSQL Flexible Server (this takes 3-5 minutes)..."
  az postgres flexible-server create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DB_SERVER" \
    --location "$LOCATION" \
    --admin-user "$DB_USER" \
    --admin-password "$DB_PASSWORD" \
    --sku-name "$DB_SKU" \
    --tier Burstable \
    --storage-size 32 \
    --version 16 \
    --yes \
    --output none

  # Create database
  az postgres flexible-server db create \
    --resource-group "$RESOURCE_GROUP" \
    --server-name "$DB_SERVER" \
    --database-name "$DB_NAME" \
    --output none

  # Allow Azure services to connect
  az postgres flexible-server firewall-rule create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DB_SERVER" \
    --rule-name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0 \
    --output none

  DB_ENDPOINT=$(az postgres flexible-server show --name "$DB_SERVER" --resource-group "$RESOURCE_GROUP" --query fullyQualifiedDomainName --output tsv)

  # Store password in Key Vault (create if needed)
  KV_NAME="${PREFIX}-kv-$(openssl rand -hex 4)"
  EXISTING_KV=$(az keyvault list --resource-group "$RESOURCE_GROUP" --query '[0].name' --output tsv 2>/dev/null || echo "")
  if [[ -n "$EXISTING_KV" && "$EXISTING_KV" != "None" ]]; then
    KV_NAME="$EXISTING_KV"
  else
    az keyvault create --resource-group "$RESOURCE_GROUP" --name "$KV_NAME" --location "$LOCATION" --output none
  fi

  az keyvault secret set --vault-name "$KV_NAME" --name "sigil-db-password" --value "$DB_PASSWORD" --output none
  JWT_SECRET=$(openssl rand -hex 32)
  az keyvault secret set --vault-name "$KV_NAME" --name "sigil-jwt-secret" --value "$JWT_SECRET" --output none
  SEED_KEY=$(openssl rand -hex 16)
  az keyvault secret set --vault-name "$KV_NAME" --name "sigil-seed-key" --value "$SEED_KEY" --output none

  echo "  PostgreSQL created: $DB_ENDPOINT"
  echo "  Secrets stored in Key Vault: $KV_NAME"
else
  echo "  PostgreSQL already exists: $DB_ENDPOINT"
  KV_NAME=$(az keyvault list --resource-group "$RESOURCE_GROUP" --query '[0].name' --output tsv 2>/dev/null || echo "")
  DB_PASSWORD=$(az keyvault secret show --vault-name "$KV_NAME" --name "sigil-db-password" --query value --output tsv 2>/dev/null || echo "")
  JWT_SECRET=$(az keyvault secret show --vault-name "$KV_NAME" --name "sigil-jwt-secret" --query value --output tsv 2>/dev/null || echo "")
  SEED_KEY=$(az keyvault secret show --vault-name "$KV_NAME" --name "sigil-seed-key" --query value --output tsv 2>/dev/null || echo "")

  if [[ -z "$DB_PASSWORD" ]]; then
    echo "Error: Could not retrieve DB password from Key Vault."
    exit 1
  fi
fi

DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_ENDPOINT:5432/$DB_NAME?sslmode=require"

# ---- 4. Build and push images -----------------------------------------------
echo ""
echo "[4/7] Building and pushing images..."
az acr login --name "$ACR_NAME" --output none

cd "$REPO_ROOT"
VERSION=$(date +%Y%m%d-%H%M%S)

echo "  Building sigil-api..."
docker build -t "$ACR_LOGIN_SERVER/sigil-api:$VERSION" -t "$ACR_LOGIN_SERVER/sigil-api:latest" -f Dockerfile .
docker push "$ACR_LOGIN_SERVER/sigil-api:$VERSION"
docker push "$ACR_LOGIN_SERVER/sigil-api:latest"

echo "  Building sigil-admin..."
docker build -t "$ACR_LOGIN_SERVER/sigil-admin:$VERSION" -t "$ACR_LOGIN_SERVER/sigil-admin:latest" -f Dockerfile.admin .
docker push "$ACR_LOGIN_SERVER/sigil-admin:$VERSION"
docker push "$ACR_LOGIN_SERVER/sigil-admin:latest"

echo "  Building sigil-renderer..."
docker build -t "$ACR_LOGIN_SERVER/sigil-renderer:$VERSION" -t "$ACR_LOGIN_SERVER/sigil-renderer:latest" -f apps/renderer/Dockerfile apps/renderer/
docker push "$ACR_LOGIN_SERVER/sigil-renderer:$VERSION"
docker push "$ACR_LOGIN_SERVER/sigil-renderer:latest"

# ---- 5. Container Apps Environment ------------------------------------------
echo ""
echo "[5/7] Creating Container Apps environment..."
ENV_NAME="${PREFIX}-env"
az containerapp env show --name "$ENV_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null || \
  az containerapp env create \
    --name "$ENV_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none

# ---- 6. Deploy Container Apps ------------------------------------------------
echo ""
echo "[6/7] Deploying Container Apps..."

echo "  Deploying sigil-api..."
az containerapp create \
  --name "${PREFIX}-api" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$ENV_NAME" \
  --image "$ACR_LOGIN_SERVER/sigil-api:$VERSION" \
  --registry-server "$ACR_LOGIN_SERVER" \
  --registry-username "$ACR_NAME" \
  --registry-password "$ACR_PASSWORD" \
  --target-port 3000 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1.0Gi \
  --env-vars \
    "NODE_ENV=production" \
    "PORT=3000" \
    "DATABASE_URL=$DATABASE_URL" \
    "JWT_SECRET=$JWT_SECRET" \
    "SEED_API_KEY=$SEED_KEY" \
  --output none 2>/dev/null || \
  az containerapp update \
    --name "${PREFIX}-api" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$ACR_LOGIN_SERVER/sigil-api:$VERSION" \
    --output none

API_URL=$(az containerapp show --name "${PREFIX}-api" --resource-group "$RESOURCE_GROUP" --query 'properties.configuration.ingress.fqdn' --output tsv)
API_URL="https://$API_URL"

echo "  Deploying sigil-admin..."
az containerapp create \
  --name "${PREFIX}-admin" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$ENV_NAME" \
  --image "$ACR_LOGIN_SERVER/sigil-admin:$VERSION" \
  --registry-server "$ACR_LOGIN_SERVER" \
  --registry-username "$ACR_NAME" \
  --registry-password "$ACR_PASSWORD" \
  --target-port 8080 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 2 \
  --cpu 0.25 \
  --memory 0.5Gi \
  --env-vars "VITE_API_URL=$API_URL" \
  --output none 2>/dev/null || \
  az containerapp update \
    --name "${PREFIX}-admin" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$ACR_LOGIN_SERVER/sigil-admin:$VERSION" \
    --output none

ADMIN_URL=$(az containerapp show --name "${PREFIX}-admin" --resource-group "$RESOURCE_GROUP" --query 'properties.configuration.ingress.fqdn' --output tsv)
ADMIN_URL="https://$ADMIN_URL"

echo "  Deploying sigil-renderer..."
az containerapp create \
  --name "${PREFIX}-renderer" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$ENV_NAME" \
  --image "$ACR_LOGIN_SERVER/sigil-renderer:$VERSION" \
  --registry-server "$ACR_LOGIN_SERVER" \
  --registry-username "$ACR_NAME" \
  --registry-password "$ACR_PASSWORD" \
  --target-port 3000 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 2 \
  --cpu 0.25 \
  --memory 0.5Gi \
  --env-vars \
    "PORT=3000" \
    "API_URL=$API_URL/api/v1/public" \
    "SITE_SLUG=${SITE_SLUG:-default}" \
    "SITE_NAME=${SITE_NAME:-My Site}" \
  --output none 2>/dev/null || \
  az containerapp update \
    --name "${PREFIX}-renderer" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$ACR_LOGIN_SERVER/sigil-renderer:$VERSION" \
    --output none

RENDERER_URL=$(az containerapp show --name "${PREFIX}-renderer" --resource-group "$RESOURCE_GROUP" --query 'properties.configuration.ingress.fqdn' --output tsv)
RENDERER_URL="https://$RENDERER_URL"

# ---- 7. Health check ---------------------------------------------------------
echo ""
echo "[7/7] Running health checks..."
sleep 5

API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" 2>/dev/null || echo "000")
echo "  API health: $API_HEALTH"

if [[ "$API_HEALTH" != "200" ]]; then
  echo "  Warning: API may still be starting. Check logs:"
  echo "  az containerapp logs show --name ${PREFIX}-api --resource-group $RESOURCE_GROUP"
fi

# ---- Done --------------------------------------------------------------------
echo ""
echo "============================================="
echo "Sigil CMS deployed to Azure Container Apps!"
echo "============================================="
echo ""
echo "Services:"
echo "  API:      $API_URL"
echo "  Admin:    $ADMIN_URL"
echo "  Renderer: $RENDERER_URL"
echo ""
echo "Version: $VERSION"
echo "Estimated monthly cost: ~\$20-30/mo (scale-to-zero when idle)"
echo ""
echo "Next steps:"
echo "  1. Bootstrap your first site:"
echo "     curl -X POST $API_URL/api/v1/seed/bootstrap \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -H 'X-Seed-Key: $SEED_KEY' \\"
echo "       -d '{\"tenantName\":\"My Agency\",\"tenantSlug\":\"agency\",\"adminEmail\":\"admin@example.com\",\"adminPassword\":\"your-password\"}'"
echo ""
echo "  2. Map a custom domain:"
echo "     az containerapp hostname add --name ${PREFIX}-renderer --resource-group $RESOURCE_GROUP --hostname your-domain.com"
echo ""
echo "  3. View logs:"
echo "     az containerapp logs show --name ${PREFIX}-api --resource-group $RESOURCE_GROUP --follow"

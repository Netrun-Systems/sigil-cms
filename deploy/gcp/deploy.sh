#!/bin/bash
set -euo pipefail

# =============================================================================
# Sigil CMS — Google Cloud Run Deployment
# Deploys API, Admin, and Renderer to Cloud Run with Cloud SQL (PostgreSQL 16).
#
# Usage: ./deploy.sh [project-id] [region]
# Idempotent: safe to run multiple times.
# =============================================================================

PROJECT_ID="${1:-$(gcloud config get project 2>/dev/null)}"
REGION="${2:-us-central1}"
SERVICE_PREFIX="sigil"
DB_INSTANCE="${SERVICE_PREFIX}-db"
DB_NAME="sigil"
DB_USER="sigil"

if [[ -z "$PROJECT_ID" ]]; then
  echo "Error: No project ID provided and none set in gcloud config."
  echo "Usage: ./deploy.sh <project-id> [region]"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "============================================="
echo "Deploying Sigil CMS to Google Cloud Run"
echo "  Project: $PROJECT_ID"
echo "  Region:  $REGION"
echo "============================================="

# ---- 1. Enable required APIs ------------------------------------------------
echo ""
echo "[1/7] Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  --project "$PROJECT_ID" --quiet

# ---- 2. Create Artifact Registry --------------------------------------------
echo ""
echo "[2/7] Creating Artifact Registry (if needed)..."
gcloud artifacts repositories create "${SERVICE_PREFIX}-artifacts" \
  --repository-format=docker \
  --location="$REGION" \
  --project="$PROJECT_ID" 2>/dev/null || echo "  Registry already exists."

REGISTRY="$REGION-docker.pkg.dev/$PROJECT_ID/${SERVICE_PREFIX}-artifacts"

# ---- 3. Create Cloud SQL instance -------------------------------------------
echo ""
echo "[3/7] Setting up Cloud SQL..."
if ! gcloud sql instances describe "$DB_INSTANCE" --project="$PROJECT_ID" &>/dev/null; then
  echo "  Creating Cloud SQL instance (this takes 3-5 minutes)..."
  gcloud sql instances create "$DB_INSTANCE" \
    --database-version=POSTGRES_16 \
    --tier=db-f1-micro \
    --region="$REGION" \
    --storage-size=10GB \
    --storage-auto-increase \
    --project="$PROJECT_ID" \
    --quiet

  # Generate and store credentials
  DB_PASSWORD=$(openssl rand -base64 32)
  gcloud sql databases create "$DB_NAME" --instance="$DB_INSTANCE" --project="$PROJECT_ID" --quiet
  gcloud sql users create "$DB_USER" --instance="$DB_INSTANCE" --password="$DB_PASSWORD" --project="$PROJECT_ID" --quiet

  # Store password in Secret Manager
  echo -n "$DB_PASSWORD" | gcloud secrets create "${SERVICE_PREFIX}-db-password" \
    --data-file=- --project="$PROJECT_ID" 2>/dev/null || \
    echo -n "$DB_PASSWORD" | gcloud secrets versions add "${SERVICE_PREFIX}-db-password" \
    --data-file=- --project="$PROJECT_ID"
  echo "  Database password stored in Secret Manager: ${SERVICE_PREFIX}-db-password"

  # Store JWT secret
  JWT_SECRET=$(openssl rand -hex 32)
  echo -n "$JWT_SECRET" | gcloud secrets create "${SERVICE_PREFIX}-jwt-secret" \
    --data-file=- --project="$PROJECT_ID" 2>/dev/null || true

  # Store seed key
  SEED_KEY=$(openssl rand -hex 16)
  echo -n "$SEED_KEY" | gcloud secrets create "${SERVICE_PREFIX}-seed-key" \
    --data-file=- --project="$PROJECT_ID" 2>/dev/null || true
else
  echo "  Cloud SQL instance already exists."
  DB_PASSWORD=$(gcloud secrets versions access latest --secret="${SERVICE_PREFIX}-db-password" --project="$PROJECT_ID" 2>/dev/null || echo "")
  JWT_SECRET=$(gcloud secrets versions access latest --secret="${SERVICE_PREFIX}-jwt-secret" --project="$PROJECT_ID" 2>/dev/null || echo "")
  SEED_KEY=$(gcloud secrets versions access latest --secret="${SERVICE_PREFIX}-seed-key" --project="$PROJECT_ID" 2>/dev/null || echo "")

  if [[ -z "$DB_PASSWORD" ]]; then
    echo "Error: Could not retrieve DB password from Secret Manager."
    echo "Check secret '${SERVICE_PREFIX}-db-password' in project $PROJECT_ID."
    exit 1
  fi
fi

CONNECTION_NAME="$PROJECT_ID:$REGION:$DB_INSTANCE"
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$CONNECTION_NAME"

# ---- 4. Configure Docker for Artifact Registry ------------------------------
echo ""
echo "[4/7] Configuring Docker authentication..."
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet 2>/dev/null

# ---- 5. Build and push images -----------------------------------------------
echo ""
echo "[5/7] Building and pushing images..."
VERSION=$(date +%Y%m%d-%H%M%S)
cd "$REPO_ROOT"

echo "  Building sigil-api..."
docker build -t "$REGISTRY/sigil-api:$VERSION" -t "$REGISTRY/sigil-api:latest" -f Dockerfile .
docker push "$REGISTRY/sigil-api:$VERSION"
docker push "$REGISTRY/sigil-api:latest"

echo "  Building sigil-admin..."
docker build -t "$REGISTRY/sigil-admin:$VERSION" -t "$REGISTRY/sigil-admin:latest" -f Dockerfile.admin .
docker push "$REGISTRY/sigil-admin:$VERSION"
docker push "$REGISTRY/sigil-admin:latest"

echo "  Building sigil-renderer..."
docker build -t "$REGISTRY/sigil-renderer:$VERSION" -t "$REGISTRY/sigil-renderer:latest" -f apps/renderer/Dockerfile apps/renderer/
docker push "$REGISTRY/sigil-renderer:$VERSION"
docker push "$REGISTRY/sigil-renderer:latest"

# ---- 6. Deploy to Cloud Run -------------------------------------------------
echo ""
echo "[6/7] Deploying services to Cloud Run..."

echo "  Deploying sigil-api..."
gcloud run deploy sigil-api \
  --image "$REGISTRY/sigil-api:$VERSION" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --set-env-vars="NODE_ENV=production,DATABASE_URL=$DATABASE_URL,JWT_SECRET=$JWT_SECRET,SEED_API_KEY=$SEED_KEY" \
  --add-cloudsql-instances="$CONNECTION_NAME" \
  --min-instances=0 \
  --max-instances=3 \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --allow-unauthenticated \
  --quiet

API_URL=$(gcloud run services describe sigil-api --region "$REGION" --project "$PROJECT_ID" --format="value(status.url)")

echo "  Deploying sigil-admin..."
gcloud run deploy sigil-admin \
  --image "$REGISTRY/sigil-admin:$VERSION" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --set-env-vars="VITE_API_URL=$API_URL" \
  --min-instances=0 \
  --max-instances=2 \
  --memory=256Mi \
  --cpu=1 \
  --allow-unauthenticated \
  --quiet

ADMIN_URL=$(gcloud run services describe sigil-admin --region "$REGION" --project "$PROJECT_ID" --format="value(status.url)")

echo "  Deploying sigil-renderer..."
gcloud run deploy sigil-renderer \
  --image "$REGISTRY/sigil-renderer:$VERSION" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --set-env-vars="API_URL=$API_URL/api/v1/public,SITE_SLUG=${SITE_SLUG:-default},SITE_NAME=${SITE_NAME:-My Site}" \
  --min-instances=0 \
  --max-instances=2 \
  --memory=256Mi \
  --cpu=1 \
  --allow-unauthenticated \
  --quiet

RENDERER_URL=$(gcloud run services describe sigil-renderer --region "$REGION" --project "$PROJECT_ID" --format="value(status.url)")

# ---- 7. Health check ---------------------------------------------------------
echo ""
echo "[7/7] Running health checks..."
sleep 5

API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" 2>/dev/null || echo "000")
echo "  API health: $API_HEALTH"

if [[ "$API_HEALTH" != "200" ]]; then
  echo "  Warning: API health check returned $API_HEALTH. It may still be starting up."
  echo "  Check logs: gcloud run services logs read sigil-api --region $REGION --project $PROJECT_ID"
fi

# ---- Done --------------------------------------------------------------------
echo ""
echo "============================================="
echo "Sigil CMS deployed to Google Cloud Run!"
echo "============================================="
echo ""
echo "Services:"
echo "  API:      $API_URL"
echo "  Admin:    $ADMIN_URL"
echo "  Renderer: $RENDERER_URL"
echo ""
echo "Version: $VERSION"
echo "Estimated monthly cost: ~\$5-15/mo (scale-to-zero when idle)"
echo ""
echo "Next steps:"
echo "  1. Bootstrap your first site:"
echo "     curl -X POST $API_URL/api/v1/seed/bootstrap \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -H 'X-Seed-Key: $SEED_KEY' \\"
echo "       -d '{\"tenantName\":\"My Agency\",\"tenantSlug\":\"agency\",\"adminEmail\":\"admin@example.com\",\"adminPassword\":\"your-password\"}'"
echo ""
echo "  2. Map a custom domain:"
echo "     gcloud beta run domain-mappings create --service sigil-renderer --domain your-domain.com --region $REGION"
echo ""
echo "  3. View logs:"
echo "     gcloud run services logs read sigil-api --region $REGION --project $PROJECT_ID"

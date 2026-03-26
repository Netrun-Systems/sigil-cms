# Sigil CMS — Google Cloud Run Deployment

Deploy Sigil CMS to Google Cloud Run with Cloud SQL PostgreSQL. Scale-to-zero billing means you only pay for actual usage.

## Prerequisites

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud` CLI)
- [Docker](https://docs.docker.com/get-docker/) (for building images locally)
- A GCP project with billing enabled

## Quick Start

```bash
cd sigil-cms/deploy/gcp
chmod +x deploy.sh
./deploy.sh your-project-id us-central1
```

The script is idempotent and will:
1. Enable required GCP APIs
2. Create Artifact Registry for container images
3. Create Cloud SQL PostgreSQL 16 instance (db-f1-micro)
4. Auto-generate and store secrets in Secret Manager
5. Build and push all 3 Docker images
6. Deploy 3 Cloud Run services
7. Run a health check

## Automated CI/CD with Cloud Build

Set up automatic deploys on push to main:

```bash
gcloud builds triggers create github \
  --repo-name=sigil-cms \
  --repo-owner=Netrun-Systems \
  --branch-pattern="^main$" \
  --build-config=deploy/gcp/cloudbuild.yaml \
  --project=your-project-id
```

## Cost Estimate

| Resource | Idle | Active | Notes |
|----------|------|--------|-------|
| Cloud Run (3 services) | $0 | ~$3-10/mo | Scale-to-zero |
| Cloud SQL (db-f1-micro) | ~$7/mo | ~$7/mo | Always on (smallest tier) |
| Artifact Registry | ~$0.10/mo | ~$0.10/mo | Storage only |
| **Total** | **~$7/mo** | **~$10-17/mo** | |

To reduce costs further, stop the Cloud SQL instance when not in use:
```bash
gcloud sql instances patch sigil-db --activation-policy=NEVER --project=your-project-id
```

## Custom Domain

```bash
# Map domain to the renderer service
gcloud beta run domain-mappings create \
  --service sigil-renderer \
  --domain your-domain.com \
  --region us-central1

# Follow the DNS instructions printed by the command
```

## Secrets Management

Secrets are stored in GCP Secret Manager:
- `sigil-db-password` — PostgreSQL password
- `sigil-jwt-secret` — JWT signing key
- `sigil-seed-key` — Bootstrap API key

View secrets:
```bash
gcloud secrets list --project=your-project-id
gcloud secrets versions access latest --secret=sigil-seed-key --project=your-project-id
```

## Monitoring and Logs

```bash
# View API logs
gcloud run services logs read sigil-api --region us-central1 --project your-project-id

# Tail logs in real time
gcloud run services logs tail sigil-api --region us-central1 --project your-project-id

# View all services
gcloud run services list --region us-central1 --project your-project-id
```

## Health Checks

```bash
API_URL=$(gcloud run services describe sigil-api --region us-central1 --format="value(status.url)")
curl "$API_URL/health"
```

## Updating

Re-run the deploy script to build and deploy the latest code:
```bash
./deploy.sh your-project-id us-central1
```

Or push to main if Cloud Build is configured.

## Backup

```bash
# Export database
gcloud sql export sql sigil-db gs://your-bucket/backup-$(date +%Y%m%d).sql \
  --database=sigil --project=your-project-id

# Import database
gcloud sql import sql sigil-db gs://your-bucket/backup-20240101.sql \
  --database=sigil --project=your-project-id
```

## Teardown

```bash
# Remove Cloud Run services
gcloud run services delete sigil-api --region us-central1 --quiet
gcloud run services delete sigil-admin --region us-central1 --quiet
gcloud run services delete sigil-renderer --region us-central1 --quiet

# Remove Cloud SQL (destructive — deletes all data)
gcloud sql instances delete sigil-db --quiet

# Remove Artifact Registry
gcloud artifacts repositories delete sigil-artifacts --location us-central1 --quiet
```

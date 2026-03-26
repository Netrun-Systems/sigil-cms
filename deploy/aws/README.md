# Sigil CMS — AWS Fargate Deployment

Deploy Sigil CMS to AWS ECS Fargate with RDS PostgreSQL and an Application Load Balancer.

## Prerequisites

- [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) configured with credentials
- [Docker](https://docs.docker.com/get-docker/) (for building images locally)
- [jq](https://stedolan.github.io/jq/) (JSON processor)
- An AWS account (RDS db.t4g.micro is free tier eligible for 12 months)

## Quick Start

```bash
cd sigil-cms/deploy/aws
chmod +x deploy.sh
./deploy.sh us-east-1 sigil
```

The script is idempotent and will:
1. Create ECR repositories for container images
2. Create a VPC with public subnets in 2 AZs
3. Configure security groups (ALB, ECS, RDS)
4. Create RDS PostgreSQL 16 (db.t4g.micro)
5. Auto-generate and store secrets in AWS Secrets Manager
6. Build and push all 3 Docker images
7. Create ECS Fargate cluster and services
8. Create an ALB with path-based routing

## Architecture

```
Internet -> ALB (port 80/443)
              |
              ├── /api/*     -> sigil-api (Fargate, 0.5 vCPU, 1GB)
              ├── /site/*    -> sigil-renderer (Fargate, 0.25 vCPU, 512MB)
              └── /* (default)-> sigil-admin (Fargate, 0.25 vCPU, 512MB)

              sigil-api -> RDS PostgreSQL 16 (db.t4g.micro, private subnet)
```

## Cost Estimate

| Resource | Monthly Cost | Notes |
|----------|-------------|-------|
| ECS Fargate (3 tasks) | ~$10-15 | 1 vCPU + 2GB total |
| RDS (db.t4g.micro) | $0 (free tier) / ~$13 | Free for 12 months |
| ALB | ~$16 | Fixed + LCU charges |
| ECR | ~$0.10 | Storage only |
| **Total** | **~$15-25/mo** | Free tier: ~$10-15/mo |

## Custom Domain with HTTPS

1. Request an ACM certificate:
   ```bash
   aws acm request-certificate \
     --domain-name your-domain.com \
     --validation-method DNS \
     --region us-east-1
   ```

2. Validate the certificate via DNS (follow ACM instructions).

3. Add an HTTPS listener to the ALB:
   ```bash
   aws elbv2 create-listener \
     --load-balancer-arn <alb-arn> \
     --protocol HTTPS \
     --port 443 \
     --certificates CertificateArn=<cert-arn> \
     --default-actions Type=forward,TargetGroupArn=<admin-tg-arn>
   ```

4. Create a Route 53 CNAME record pointing to the ALB DNS name.

## Task Definition Reference

The `task-definition.json` file provides a standalone ECS task definition template for the API service. Replace placeholder values (`ACCOUNT_ID`, `REGION`) before use:

```bash
sed -e "s/ACCOUNT_ID/$(aws sts get-caller-identity --query Account --output text)/g" \
    -e "s/REGION/us-east-1/g" \
    task-definition.json > task-def-resolved.json

aws ecs register-task-definition --cli-input-json file://task-def-resolved.json
```

## Secrets Management

Secrets are stored in AWS Secrets Manager:
- `sigil/db-password` — PostgreSQL password
- `sigil/jwt-secret` — JWT signing key
- `sigil/seed-key` — Bootstrap API key

Retrieve a secret:
```bash
aws secretsmanager get-secret-value --secret-id sigil/seed-key --query SecretString --output text
```

## Health Checks

```bash
ALB_DNS=$(aws elbv2 describe-load-balancers --names sigil-alb --query 'LoadBalancers[0].DNSName' --output text)
curl "http://$ALB_DNS/api/health"
```

## Monitoring and Logs

```bash
# Tail API logs
aws logs tail /ecs/sigil-api --follow --region us-east-1

# View ECS service status
aws ecs describe-services --cluster sigil-cluster --services sigil-api --query 'services[0].{status:status,running:runningCount,desired:desiredCount}'
```

## Updating

Re-run the deploy script to build new images and update services:
```bash
./deploy.sh us-east-1 sigil
```

## Backup

```bash
# Create RDS snapshot
aws rds create-db-snapshot \
  --db-instance-identifier sigil-db \
  --db-snapshot-identifier sigil-backup-$(date +%Y%m%d)

# List snapshots
aws rds describe-db-snapshots --db-instance-identifier sigil-db --query 'DBSnapshots[*].{ID:DBSnapshotIdentifier,Created:SnapshotCreateTime,Status:Status}'
```

## Teardown

```bash
# Remove ECS services
aws ecs update-service --cluster sigil-cluster --service sigil-api --desired-count 0
aws ecs update-service --cluster sigil-cluster --service sigil-admin --desired-count 0
aws ecs update-service --cluster sigil-cluster --service sigil-renderer --desired-count 0
aws ecs delete-service --cluster sigil-cluster --service sigil-api --force
aws ecs delete-service --cluster sigil-cluster --service sigil-admin --force
aws ecs delete-service --cluster sigil-cluster --service sigil-renderer --force
aws ecs delete-cluster --cluster sigil-cluster

# Remove ALB
aws elbv2 delete-load-balancer --load-balancer-arn <alb-arn>

# Remove RDS (destructive)
aws rds delete-db-instance --db-instance-identifier sigil-db --skip-final-snapshot
```

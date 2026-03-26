#!/bin/bash
set -euo pipefail

# =============================================================================
# Sigil CMS — AWS Fargate (ECS) Deployment
# Deploys API, Admin, and Renderer to ECS Fargate with RDS PostgreSQL.
#
# Usage: ./deploy.sh [region] [stack-name]
# Idempotent: safe to run multiple times.
#
# Prerequisites:
#   - AWS CLI v2 configured with credentials
#   - Docker installed
#   - jq installed
# =============================================================================

REGION="${1:-us-east-1}"
STACK_NAME="${2:-sigil}"
DB_INSTANCE_CLASS="db.t4g.micro"
DB_NAME="sigil"
DB_USER="sigil"
CLUSTER_NAME="${STACK_NAME}-cluster"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Verify prerequisites
for cmd in aws docker jq; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "Error: $cmd is required but not installed."
    exit 1
  fi
done

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "============================================="
echo "Deploying Sigil CMS to AWS Fargate"
echo "  Account: $ACCOUNT_ID"
echo "  Region:  $REGION"
echo "  Stack:   $STACK_NAME"
echo "============================================="

# ---- 1. Create ECR repositories ---------------------------------------------
echo ""
echo "[1/8] Creating ECR repositories..."
for repo in sigil-api sigil-admin sigil-renderer; do
  aws ecr describe-repositories --repository-names "$repo" --region "$REGION" &>/dev/null || \
    aws ecr create-repository --repository-name "$repo" --region "$REGION" --query 'repository.repositoryUri' --output text
  echo "  $repo: OK"
done

ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

# ---- 2. Create VPC and networking (if needed) --------------------------------
echo ""
echo "[2/8] Setting up networking..."
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=${STACK_NAME}-vpc" --query 'Vpcs[0].VpcId' --output text --region "$REGION" 2>/dev/null || echo "None")

if [[ "$VPC_ID" == "None" || -z "$VPC_ID" ]]; then
  echo "  Creating VPC..."
  VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query 'Vpc.VpcId' --output text --region "$REGION")
  aws ec2 create-tags --resources "$VPC_ID" --tags "Key=Name,Value=${STACK_NAME}-vpc" --region "$REGION"
  aws ec2 modify-vpc-attribute --vpc-id "$VPC_ID" --enable-dns-hostnames --region "$REGION"

  # Create subnets in 2 AZs (required for RDS and ALB)
  AZ1="${REGION}a"
  AZ2="${REGION}b"
  SUBNET1=$(aws ec2 create-subnet --vpc-id "$VPC_ID" --cidr-block 10.0.1.0/24 --availability-zone "$AZ1" --query 'Subnet.SubnetId' --output text --region "$REGION")
  SUBNET2=$(aws ec2 create-subnet --vpc-id "$VPC_ID" --cidr-block 10.0.2.0/24 --availability-zone "$AZ2" --query 'Subnet.SubnetId' --output text --region "$REGION")
  aws ec2 create-tags --resources "$SUBNET1" --tags "Key=Name,Value=${STACK_NAME}-subnet-1" --region "$REGION"
  aws ec2 create-tags --resources "$SUBNET2" --tags "Key=Name,Value=${STACK_NAME}-subnet-2" --region "$REGION"

  # Internet gateway
  IGW_ID=$(aws ec2 create-internet-gateway --query 'InternetGateway.InternetGatewayId' --output text --region "$REGION")
  aws ec2 attach-internet-gateway --internet-gateway-id "$IGW_ID" --vpc-id "$VPC_ID" --region "$REGION"

  # Route table
  RTB_ID=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" --query 'RouteTables[0].RouteTableId' --output text --region "$REGION")
  aws ec2 create-route --route-table-id "$RTB_ID" --destination-cidr-block 0.0.0.0/0 --gateway-id "$IGW_ID" --region "$REGION" 2>/dev/null || true
  aws ec2 associate-route-table --route-table-id "$RTB_ID" --subnet-id "$SUBNET1" --region "$REGION" 2>/dev/null || true
  aws ec2 associate-route-table --route-table-id "$RTB_ID" --subnet-id "$SUBNET2" --region "$REGION" 2>/dev/null || true

  # Enable public IPs for subnets
  aws ec2 modify-subnet-attribute --subnet-id "$SUBNET1" --map-public-ip-on-launch --region "$REGION"
  aws ec2 modify-subnet-attribute --subnet-id "$SUBNET2" --map-public-ip-on-launch --region "$REGION"

  echo "  VPC created: $VPC_ID"
else
  echo "  VPC already exists: $VPC_ID"
  SUBNET1=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=${STACK_NAME}-subnet-1" --query 'Subnets[0].SubnetId' --output text --region "$REGION")
  SUBNET2=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=${STACK_NAME}-subnet-2" --query 'Subnets[0].SubnetId' --output text --region "$REGION")
fi

# ---- 3. Security groups -----------------------------------------------------
echo ""
echo "[3/8] Configuring security groups..."
SG_ALB=$(aws ec2 describe-security-groups --filters "Name=tag:Name,Values=${STACK_NAME}-alb-sg" "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[0].GroupId' --output text --region "$REGION" 2>/dev/null || echo "None")

if [[ "$SG_ALB" == "None" || -z "$SG_ALB" ]]; then
  SG_ALB=$(aws ec2 create-security-group --group-name "${STACK_NAME}-alb-sg" --description "ALB security group" --vpc-id "$VPC_ID" --query 'GroupId' --output text --region "$REGION")
  aws ec2 create-tags --resources "$SG_ALB" --tags "Key=Name,Value=${STACK_NAME}-alb-sg" --region "$REGION"
  aws ec2 authorize-security-group-ingress --group-id "$SG_ALB" --protocol tcp --port 80 --cidr 0.0.0.0/0 --region "$REGION" 2>/dev/null || true
  aws ec2 authorize-security-group-ingress --group-id "$SG_ALB" --protocol tcp --port 443 --cidr 0.0.0.0/0 --region "$REGION" 2>/dev/null || true
fi

SG_ECS=$(aws ec2 describe-security-groups --filters "Name=tag:Name,Values=${STACK_NAME}-ecs-sg" "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[0].GroupId' --output text --region "$REGION" 2>/dev/null || echo "None")

if [[ "$SG_ECS" == "None" || -z "$SG_ECS" ]]; then
  SG_ECS=$(aws ec2 create-security-group --group-name "${STACK_NAME}-ecs-sg" --description "ECS tasks security group" --vpc-id "$VPC_ID" --query 'GroupId' --output text --region "$REGION")
  aws ec2 create-tags --resources "$SG_ECS" --tags "Key=Name,Value=${STACK_NAME}-ecs-sg" --region "$REGION"
  aws ec2 authorize-security-group-ingress --group-id "$SG_ECS" --protocol tcp --port 0-65535 --source-group "$SG_ALB" --region "$REGION" 2>/dev/null || true
fi

SG_RDS=$(aws ec2 describe-security-groups --filters "Name=tag:Name,Values=${STACK_NAME}-rds-sg" "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[0].GroupId' --output text --region "$REGION" 2>/dev/null || echo "None")

if [[ "$SG_RDS" == "None" || -z "$SG_RDS" ]]; then
  SG_RDS=$(aws ec2 create-security-group --group-name "${STACK_NAME}-rds-sg" --description "RDS security group" --vpc-id "$VPC_ID" --query 'GroupId' --output text --region "$REGION")
  aws ec2 create-tags --resources "$SG_RDS" --tags "Key=Name,Value=${STACK_NAME}-rds-sg" --region "$REGION"
  aws ec2 authorize-security-group-ingress --group-id "$SG_RDS" --protocol tcp --port 5432 --source-group "$SG_ECS" --region "$REGION" 2>/dev/null || true
fi

echo "  Security groups: ALB=$SG_ALB ECS=$SG_ECS RDS=$SG_RDS"

# ---- 4. Create RDS PostgreSQL ------------------------------------------------
echo ""
echo "[4/8] Setting up RDS PostgreSQL..."
DB_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier "${STACK_NAME}-db" --query 'DBInstances[0].Endpoint.Address' --output text --region "$REGION" 2>/dev/null || echo "None")

if [[ "$DB_ENDPOINT" == "None" || -z "$DB_ENDPOINT" ]]; then
  DB_PASSWORD=$(openssl rand -base64 32 | tr -d '/@"=+')

  # Store password in Secrets Manager
  aws secretsmanager create-secret \
    --name "${STACK_NAME}/db-password" \
    --secret-string "$DB_PASSWORD" \
    --region "$REGION" 2>/dev/null || \
    aws secretsmanager put-secret-value \
    --secret-id "${STACK_NAME}/db-password" \
    --secret-string "$DB_PASSWORD" \
    --region "$REGION"

  # RDS subnet group
  aws rds create-db-subnet-group \
    --db-subnet-group-name "${STACK_NAME}-db-subnets" \
    --db-subnet-group-description "Sigil DB subnets" \
    --subnet-ids "$SUBNET1" "$SUBNET2" \
    --region "$REGION" 2>/dev/null || true

  echo "  Creating RDS instance (this takes 5-10 minutes)..."
  aws rds create-db-instance \
    --db-instance-identifier "${STACK_NAME}-db" \
    --db-instance-class "$DB_INSTANCE_CLASS" \
    --engine postgres \
    --engine-version "16" \
    --master-username "$DB_USER" \
    --master-user-password "$DB_PASSWORD" \
    --db-name "$DB_NAME" \
    --allocated-storage 20 \
    --vpc-security-group-ids "$SG_RDS" \
    --db-subnet-group-name "${STACK_NAME}-db-subnets" \
    --no-publicly-accessible \
    --storage-type gp3 \
    --backup-retention-period 7 \
    --region "$REGION"

  echo "  Waiting for RDS to become available..."
  aws rds wait db-instance-available --db-instance-identifier "${STACK_NAME}-db" --region "$REGION"
  DB_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier "${STACK_NAME}-db" --query 'DBInstances[0].Endpoint.Address' --output text --region "$REGION")
else
  echo "  RDS instance already exists: $DB_ENDPOINT"
  DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id "${STACK_NAME}/db-password" --query 'SecretString' --output text --region "$REGION" 2>/dev/null || echo "")
  if [[ -z "$DB_PASSWORD" ]]; then
    echo "Error: Could not retrieve DB password from Secrets Manager."
    exit 1
  fi
fi

DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_ENDPOINT:5432/$DB_NAME"

# Store JWT secret and seed key
JWT_SECRET=$(aws secretsmanager get-secret-value --secret-id "${STACK_NAME}/jwt-secret" --query 'SecretString' --output text --region "$REGION" 2>/dev/null || echo "")
if [[ -z "$JWT_SECRET" ]]; then
  JWT_SECRET=$(openssl rand -hex 32)
  aws secretsmanager create-secret --name "${STACK_NAME}/jwt-secret" --secret-string "$JWT_SECRET" --region "$REGION" 2>/dev/null || true
fi

SEED_KEY=$(aws secretsmanager get-secret-value --secret-id "${STACK_NAME}/seed-key" --query 'SecretString' --output text --region "$REGION" 2>/dev/null || echo "")
if [[ -z "$SEED_KEY" ]]; then
  SEED_KEY=$(openssl rand -hex 16)
  aws secretsmanager create-secret --name "${STACK_NAME}/seed-key" --secret-string "$SEED_KEY" --region "$REGION" 2>/dev/null || true
fi

echo "  Database: $DB_ENDPOINT"

# ---- 5. Build and push images -----------------------------------------------
echo ""
echo "[5/8] Building and pushing images..."
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ECR_URI"

cd "$REPO_ROOT"
VERSION=$(date +%Y%m%d-%H%M%S)

for svc in api admin renderer; do
  case "$svc" in
    api)      DOCKERFILE="Dockerfile"; CONTEXT=".";;
    admin)    DOCKERFILE="Dockerfile.admin"; CONTEXT=".";;
    renderer) DOCKERFILE="apps/renderer/Dockerfile"; CONTEXT="apps/renderer/";;
  esac
  echo "  Building sigil-$svc..."
  docker build -t "$ECR_URI/sigil-$svc:$VERSION" -t "$ECR_URI/sigil-$svc:latest" -f "$DOCKERFILE" "$CONTEXT"
  docker push "$ECR_URI/sigil-$svc:$VERSION"
  docker push "$ECR_URI/sigil-$svc:latest"
done

# ---- 6. Create ECS cluster --------------------------------------------------
echo ""
echo "[6/8] Creating ECS cluster..."
aws ecs describe-clusters --clusters "$CLUSTER_NAME" --region "$REGION" --query 'clusters[0].status' --output text 2>/dev/null | grep -q ACTIVE || \
  aws ecs create-cluster --cluster-name "$CLUSTER_NAME" --region "$REGION" --query 'cluster.clusterArn' --output text

# Create/verify IAM role for ECS task execution
ROLE_NAME="${STACK_NAME}-ecs-task-execution"
aws iam get-role --role-name "$ROLE_NAME" &>/dev/null || {
  aws iam create-role --role-name "$ROLE_NAME" \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
  aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}
EXECUTION_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

# ---- 7. Create ALB ----------------------------------------------------------
echo ""
echo "[7/8] Creating Application Load Balancer..."
ALB_ARN=$(aws elbv2 describe-load-balancers --names "${STACK_NAME}-alb" --query 'LoadBalancers[0].LoadBalancerArn' --output text --region "$REGION" 2>/dev/null || echo "None")

if [[ "$ALB_ARN" == "None" || -z "$ALB_ARN" ]]; then
  ALB_ARN=$(aws elbv2 create-load-balancer \
    --name "${STACK_NAME}-alb" \
    --subnets "$SUBNET1" "$SUBNET2" \
    --security-groups "$SG_ALB" \
    --scheme internet-facing \
    --type application \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text \
    --region "$REGION")
fi

ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns "$ALB_ARN" --query 'LoadBalancers[0].DNSName' --output text --region "$REGION")

# Create target groups
for svc_port in "api:3000" "admin:8080" "renderer:3000"; do
  SVC="${svc_port%%:*}"
  PORT="${svc_port##*:}"
  TG_ARN=$(aws elbv2 describe-target-groups --names "${STACK_NAME}-${SVC}-tg" --query 'TargetGroups[0].TargetGroupArn' --output text --region "$REGION" 2>/dev/null || echo "None")
  if [[ "$TG_ARN" == "None" || -z "$TG_ARN" ]]; then
    TG_ARN=$(aws elbv2 create-target-group \
      --name "${STACK_NAME}-${SVC}-tg" \
      --protocol HTTP \
      --port "$PORT" \
      --vpc-id "$VPC_ID" \
      --target-type ip \
      --health-check-path "/health" \
      --health-check-interval-seconds 30 \
      --query 'TargetGroups[0].TargetGroupArn' \
      --output text \
      --region "$REGION" 2>/dev/null || echo "")
  fi
  eval "TG_${SVC^^}=$TG_ARN"
done

# Create listener with path-based routing
LISTENER_ARN=$(aws elbv2 describe-listeners --load-balancer-arn "$ALB_ARN" --query 'Listeners[0].ListenerArn' --output text --region "$REGION" 2>/dev/null || echo "None")

if [[ "$LISTENER_ARN" == "None" || -z "$LISTENER_ARN" ]]; then
  LISTENER_ARN=$(aws elbv2 create-listener \
    --load-balancer-arn "$ALB_ARN" \
    --protocol HTTP \
    --port 80 \
    --default-actions "Type=forward,TargetGroupArn=$TG_ADMIN" \
    --query 'Listeners[0].ListenerArn' \
    --output text \
    --region "$REGION")

  # API path rule
  aws elbv2 create-rule \
    --listener-arn "$LISTENER_ARN" \
    --priority 10 \
    --conditions "Field=path-pattern,Values=/api/*" \
    --actions "Type=forward,TargetGroupArn=$TG_API" \
    --region "$REGION" 2>/dev/null || true

  # Renderer on separate port or path
  aws elbv2 create-rule \
    --listener-arn "$LISTENER_ARN" \
    --priority 20 \
    --conditions "Field=path-pattern,Values=/site/*" \
    --actions "Type=forward,TargetGroupArn=$TG_RENDERER" \
    --region "$REGION" 2>/dev/null || true
fi

# ---- 8. Register task definitions and create services ------------------------
echo ""
echo "[8/8] Deploying ECS services..."

# Generate and register task definitions for each service
for svc_config in "api:3000:512:1024:$TG_API" "admin:8080:256:512:$TG_ADMIN" "renderer:3000:256:512:$TG_RENDERER"; do
  IFS=':' read -r SVC PORT CPU MEMORY TG_ARN <<< "$svc_config"

  # Build environment array
  case "$SVC" in
    api)
      ENV_VARS='[{"name":"NODE_ENV","value":"production"},{"name":"PORT","value":"3000"},{"name":"DATABASE_URL","value":"'"$DATABASE_URL"'"},{"name":"JWT_SECRET","value":"'"$JWT_SECRET"'"},{"name":"SEED_API_KEY","value":"'"$SEED_KEY"'"}]'
      ;;
    admin)
      ENV_VARS='[{"name":"VITE_API_URL","value":"http://'"$ALB_DNS"'"}]'
      ;;
    renderer)
      ENV_VARS='[{"name":"PORT","value":"3000"},{"name":"API_URL","value":"http://'"$ALB_DNS"'/api/v1/public"},{"name":"SITE_SLUG","value":"'"${SITE_SLUG:-default}"'"},{"name":"SITE_NAME","value":"'"${SITE_NAME:-My Site}"'"}]'
      ;;
  esac

  TASK_DEF=$(cat <<EOF
{
  "family": "${STACK_NAME}-${SVC}",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "$CPU",
  "memory": "$MEMORY",
  "executionRoleArn": "$EXECUTION_ROLE_ARN",
  "containerDefinitions": [{
    "name": "${STACK_NAME}-${SVC}",
    "image": "$ECR_URI/sigil-${SVC}:$VERSION",
    "portMappings": [{"containerPort": $PORT, "protocol": "tcp"}],
    "environment": $ENV_VARS,
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/${STACK_NAME}-${SVC}",
        "awslogs-region": "$REGION",
        "awslogs-stream-prefix": "ecs",
        "awslogs-create-group": "true"
      }
    },
    "essential": true
  }]
}
EOF
)

  echo "  Registering task definition: ${STACK_NAME}-${SVC}"
  echo "$TASK_DEF" > "/tmp/${STACK_NAME}-${SVC}-task.json"
  aws ecs register-task-definition --cli-input-json "file:///tmp/${STACK_NAME}-${SVC}-task.json" --region "$REGION" --query 'taskDefinition.taskDefinitionArn' --output text

  # Create or update ECS service
  SERVICE_STATUS=$(aws ecs describe-services --cluster "$CLUSTER_NAME" --services "${STACK_NAME}-${SVC}" --query 'services[0].status' --output text --region "$REGION" 2>/dev/null || echo "MISSING")

  if [[ "$SERVICE_STATUS" == "ACTIVE" ]]; then
    echo "  Updating service: ${STACK_NAME}-${SVC}"
    aws ecs update-service \
      --cluster "$CLUSTER_NAME" \
      --service "${STACK_NAME}-${SVC}" \
      --task-definition "${STACK_NAME}-${SVC}" \
      --force-new-deployment \
      --region "$REGION" --query 'service.serviceName' --output text
  else
    echo "  Creating service: ${STACK_NAME}-${SVC}"
    aws ecs create-service \
      --cluster "$CLUSTER_NAME" \
      --service-name "${STACK_NAME}-${SVC}" \
      --task-definition "${STACK_NAME}-${SVC}" \
      --desired-count 1 \
      --launch-type FARGATE \
      --network-configuration "awsvpcConfiguration={subnets=[$SUBNET1,$SUBNET2],securityGroups=[$SG_ECS],assignPublicIp=ENABLED}" \
      --load-balancers "targetGroupArn=$TG_ARN,containerName=${STACK_NAME}-${SVC},containerPort=$PORT" \
      --region "$REGION" --query 'service.serviceName' --output text
  fi

  rm -f "/tmp/${STACK_NAME}-${SVC}-task.json"
done

# ---- Done --------------------------------------------------------------------
echo ""
echo "============================================="
echo "Sigil CMS deployed to AWS Fargate!"
echo "============================================="
echo ""
echo "Services:"
echo "  Admin:    http://$ALB_DNS"
echo "  API:      http://$ALB_DNS/api/"
echo "  Renderer: http://$ALB_DNS/site/"
echo ""
echo "Version: $VERSION"
echo "Estimated monthly cost: ~\$15-25/mo (free tier eligible for RDS)"
echo ""
echo "Next steps:"
echo "  1. Bootstrap your first site:"
echo "     curl -X POST http://$ALB_DNS/api/v1/seed/bootstrap \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -H 'X-Seed-Key: $SEED_KEY' \\"
echo "       -d '{\"tenantName\":\"My Agency\",\"tenantSlug\":\"agency\",\"adminEmail\":\"admin@example.com\",\"adminPassword\":\"your-password\"}'"
echo ""
echo "  2. Add HTTPS via ACM + ALB listener (recommended):"
echo "     aws acm request-certificate --domain-name your-domain.com --validation-method DNS"
echo ""
echo "  3. Map custom domain via Route 53:"
echo "     Create a CNAME record pointing to $ALB_DNS"
echo ""
echo "  4. View logs:"
echo "     aws logs tail /ecs/${STACK_NAME}-api --follow --region $REGION"

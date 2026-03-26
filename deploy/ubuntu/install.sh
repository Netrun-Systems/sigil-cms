#!/bin/bash
set -euo pipefail

# =============================================================================
# Sigil CMS — Ubuntu 22.04+ Installer
# One-line install: curl -fsSL https://raw.githubusercontent.com/Netrun-Systems/sigil-cms/main/deploy/ubuntu/install.sh | bash
#
# Installs: Node.js 20, PostgreSQL 16 + pgvector, nginx, Sigil CMS
# Idempotent: safe to run multiple times.
# =============================================================================

INSTALL_DIR="${SIGIL_INSTALL_DIR:-/opt/sigil}"
SIGIL_USER="${SIGIL_USER:-sigil}"
REPO_URL="${SIGIL_REPO:-https://github.com/Netrun-Systems/sigil-cms.git}"
BRANCH="${SIGIL_BRANCH:-main}"

echo "============================================="
echo "Sigil CMS — Ubuntu Installer"
echo "  Install directory: $INSTALL_DIR"
echo "  Service user: $SIGIL_USER"
echo "============================================="

# ---- Preflight checks -------------------------------------------------------

# Must run as root or with sudo
if [[ $EUID -ne 0 ]]; then
  echo "Error: This installer must be run as root or with sudo."
  echo "Usage: sudo bash install.sh"
  exit 1
fi

# Check Ubuntu
if ! grep -qi "ubuntu" /etc/os-release 2>/dev/null; then
  echo "Warning: This installer is designed for Ubuntu 22.04+. Proceeding anyway..."
fi

# ---- 1. System dependencies --------------------------------------------------
echo ""
echo "[1/7] Installing system dependencies..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git build-essential

# ---- 2. Node.js 20 ----------------------------------------------------------
echo ""
echo "[2/7] Installing Node.js 20..."
if command -v node &>/dev/null && node --version | grep -q "v20"; then
  echo "  Node.js $(node --version) already installed."
else
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
  echo "  Installed Node.js $(node --version)"
fi

# Install pnpm
if ! command -v pnpm &>/dev/null; then
  npm install -g pnpm
  echo "  Installed pnpm $(pnpm --version)"
fi

# ---- 3. PostgreSQL 16 + pgvector --------------------------------------------
echo ""
echo "[3/7] Installing PostgreSQL 16..."
if command -v psql &>/dev/null && psql --version | grep -q "16"; then
  echo "  PostgreSQL already installed."
else
  sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg 2>/dev/null || true
  apt-get update -qq
  apt-get install -y -qq postgresql-16 postgresql-16-pgvector
  echo "  Installed PostgreSQL 16 with pgvector."
fi

# Ensure PostgreSQL is running
systemctl enable postgresql
systemctl start postgresql

# ---- 4. nginx ----------------------------------------------------------------
echo ""
echo "[4/7] Installing nginx..."
apt-get install -y -qq nginx certbot python3-certbot-nginx
systemctl enable nginx

# ---- 5. Clone and build Sigil ------------------------------------------------
echo ""
echo "[5/7] Installing Sigil CMS..."

# Create service user
if ! id "$SIGIL_USER" &>/dev/null; then
  useradd --system --home-dir "$INSTALL_DIR" --shell /bin/false "$SIGIL_USER"
  echo "  Created system user: $SIGIL_USER"
fi

# Clone or update repo
if [[ -d "$INSTALL_DIR/.git" ]]; then
  echo "  Updating existing installation..."
  cd "$INSTALL_DIR"
  git fetch origin
  git reset --hard "origin/$BRANCH"
else
  echo "  Cloning repository..."
  mkdir -p "$INSTALL_DIR"
  git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# Install dependencies and build
echo "  Installing dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
echo "  Building..."
pnpm build

# Set ownership
chown -R "$SIGIL_USER:$SIGIL_USER" "$INSTALL_DIR"

# ---- 6. Configure database ---------------------------------------------------
echo ""
echo "[6/7] Configuring database..."

DB_PASSWORD=$(openssl rand -base64 32 | tr -d '/@"=+')
JWT_SECRET=$(openssl rand -hex 32)
SEED_KEY=$(openssl rand -hex 16)

# Create PostgreSQL user and database (idempotent)
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='sigil'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER sigil WITH PASSWORD '$DB_PASSWORD';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='sigil'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE sigil OWNER sigil;"

sudo -u postgres psql -d sigil -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null || true

# Update password (in case user already exists)
sudo -u postgres psql -c "ALTER USER sigil WITH PASSWORD '$DB_PASSWORD';"

# Create .env file
ENV_FILE="$INSTALL_DIR/.env"
cat > "$ENV_FILE" <<EOF
NODE_ENV=production
PORT=3001
HOST=127.0.0.1
DATABASE_URL=postgresql://sigil:$DB_PASSWORD@localhost:5432/sigil
JWT_SECRET=$JWT_SECRET
SEED_API_KEY=$SEED_KEY
EOF
chmod 600 "$ENV_FILE"
chown "$SIGIL_USER:$SIGIL_USER" "$ENV_FILE"

echo "  Database configured. Credentials in: $ENV_FILE"

# ---- 7. Install systemd service and nginx ------------------------------------
echo ""
echo "[7/7] Configuring services..."

# Copy systemd unit
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$INSTALL_DIR/deploy/ubuntu/sigil.service" ]]; then
  cp "$INSTALL_DIR/deploy/ubuntu/sigil.service" /etc/systemd/system/sigil.service
elif [[ -f "$SCRIPT_DIR/sigil.service" ]]; then
  cp "$SCRIPT_DIR/sigil.service" /etc/systemd/system/sigil.service
else
  # Generate inline if template not available
  cat > /etc/systemd/system/sigil.service <<UNIT
[Unit]
Description=Sigil CMS API Server
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$SIGIL_USER
Group=$SIGIL_USER
WorkingDirectory=$INSTALL_DIR
EnvironmentFile=$INSTALL_DIR/.env
ExecStart=/usr/bin/node $INSTALL_DIR/apps/api/dist/index.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=sigil

# Security hardening
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$INSTALL_DIR
PrivateTmp=yes

[Install]
WantedBy=multi-user.target
UNIT
fi

systemctl daemon-reload
systemctl enable sigil
systemctl restart sigil

# Copy nginx config
if [[ -f "$INSTALL_DIR/deploy/ubuntu/nginx.conf" ]]; then
  cp "$INSTALL_DIR/deploy/ubuntu/nginx.conf" /etc/nginx/sites-available/sigil
elif [[ -f "$SCRIPT_DIR/nginx.conf" ]]; then
  cp "$SCRIPT_DIR/nginx.conf" /etc/nginx/sites-available/sigil
else
  cat > /etc/nginx/sites-available/sigil <<'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Admin SPA (built files)
    location / {
        root /opt/sigil/apps/admin/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Static asset caching
    location /assets/ {
        root /opt/sigil/apps/admin/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Media uploads
    client_max_body_size 50M;
}
NGINX
fi

ln -sf /etc/nginx/sites-available/sigil /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx

# ---- Firewall (if ufw is available) -----------------------------------------
if command -v ufw &>/dev/null; then
  ufw allow 'Nginx Full' 2>/dev/null || true
  ufw allow OpenSSH 2>/dev/null || true
fi

# ---- Health check ------------------------------------------------------------
sleep 3
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/health 2>/dev/null || echo "000")

# ---- Done --------------------------------------------------------------------
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "============================================="
echo "Sigil CMS installed!"
echo "============================================="
echo ""
echo "Services:"
echo "  Admin:  http://$SERVER_IP"
echo "  API:    http://$SERVER_IP/api/"
echo "  Health: $HEALTH (200 = OK)"
echo ""
echo "Configuration: $ENV_FILE"
echo "Service logs:  journalctl -u sigil -f"
echo ""
echo "Next steps:"
echo "  1. Set up HTTPS with Let's Encrypt:"
echo "     sudo certbot --nginx -d your-domain.com"
echo ""
echo "  2. Bootstrap your first site:"
echo "     curl -X POST http://localhost:3001/api/v1/seed/bootstrap \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -H 'X-Seed-Key: $SEED_KEY' \\"
echo "       -d '{\"tenantName\":\"My Agency\",\"tenantSlug\":\"agency\",\"adminEmail\":\"admin@example.com\",\"adminPassword\":\"your-password\"}'"
echo ""
echo "  3. Configure automatic backups:"
echo "     echo '0 2 * * * sigil pg_dump -U sigil sigil | gzip > /opt/sigil/backups/sigil-\$(date +\\%Y\\%m\\%d).sql.gz' | sudo tee /etc/cron.d/sigil-backup"

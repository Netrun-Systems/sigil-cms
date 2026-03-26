# Sigil CMS — Ubuntu Bare Metal Deployment

Install Sigil CMS on any Ubuntu 22.04+ server (VPS, dedicated, local machine). Full control with the lowest possible cost.

## Prerequisites

- Ubuntu 22.04 or newer (minimal install is fine)
- Root or sudo access
- 2 GB RAM minimum, 4 GB recommended
- A domain name (for HTTPS — optional for testing)

## Quick Start

### One-Line Install

```bash
curl -fsSL https://raw.githubusercontent.com/Netrun-Systems/sigil-cms/main/deploy/ubuntu/install.sh | sudo bash
```

### Manual Install

```bash
git clone https://github.com/Netrun-Systems/sigil-cms.git
cd sigil-cms/deploy/ubuntu
sudo chmod +x install.sh
sudo ./install.sh
```

The installer is idempotent and will:
1. Install Node.js 20, PostgreSQL 16 + pgvector, nginx
2. Clone and build the Sigil CMS monorepo
3. Create a `sigil` system user and PostgreSQL database
4. Auto-generate all secrets (DB password, JWT, seed key)
5. Install a systemd service and nginx reverse proxy
6. Start all services

## What Gets Installed

| Component | Location | Notes |
|-----------|----------|-------|
| Sigil CMS | `/opt/sigil/` | Application code and builds |
| Config | `/opt/sigil/.env` | Environment variables (chmod 600) |
| systemd | `/etc/systemd/system/sigil.service` | API process manager |
| nginx | `/etc/nginx/sites-available/sigil` | Reverse proxy |
| PostgreSQL | localhost:5432, database `sigil` | Data in default PG data dir |

## Ports

| Service | Internal Port | External Port | Path |
|---------|--------------|---------------|------|
| API | 3001 | 80/443 | `/api/*` |
| Admin | Static files | 80/443 | `/*` |
| Renderer | 4000 | 80/443 | `/site/*` |

## Set Up HTTPS (Recommended)

After pointing your domain's DNS to the server:

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot will automatically:
- Obtain a Let's Encrypt certificate
- Configure nginx for HTTPS
- Set up automatic renewal

Verify renewal works:
```bash
sudo certbot renew --dry-run
```

## Firewall Configuration

```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

## Service Management

```bash
# View status
sudo systemctl status sigil

# View logs
journalctl -u sigil -f

# Restart
sudo systemctl restart sigil

# Stop
sudo systemctl stop sigil
```

## Health Check

```bash
# Local check
curl http://127.0.0.1:3001/health

# Through nginx
curl http://localhost/health
```

## Updating

```bash
cd /opt/sigil
sudo -u sigil git pull
sudo -u sigil pnpm install
sudo -u sigil pnpm build
sudo systemctl restart sigil
```

## Backup

### Manual Backup

```bash
# Database
sudo -u sigil pg_dump -U sigil sigil | gzip > /opt/sigil/backups/sigil-$(date +%Y%m%d).sql.gz

# Full backup (code + database + config)
tar czf sigil-full-$(date +%Y%m%d).tar.gz /opt/sigil/.env /opt/sigil/backups/
```

### Automatic Daily Backups

```bash
# Create backup directory
sudo mkdir -p /opt/sigil/backups
sudo chown sigil:sigil /opt/sigil/backups

# Add daily cron job (runs at 2 AM)
echo '0 2 * * * sigil pg_dump -U sigil sigil | gzip > /opt/sigil/backups/sigil-$(date +\%Y\%m\%d).sql.gz' | sudo tee /etc/cron.d/sigil-backup

# Clean backups older than 30 days
echo '0 3 * * 0 sigil find /opt/sigil/backups -name "*.sql.gz" -mtime +30 -delete' | sudo tee -a /etc/cron.d/sigil-backup
```

### Restore

```bash
gunzip -c /opt/sigil/backups/sigil-20240101.sql.gz | sudo -u sigil psql -U sigil sigil
```

## Customization

### Environment Variables

Edit `/opt/sigil/.env` and restart:
```bash
sudo nano /opt/sigil/.env
sudo systemctl restart sigil
```

### Change Install Directory

Set before running the installer:
```bash
export SIGIL_INSTALL_DIR=/srv/sigil
sudo -E bash install.sh
```

### Multiple Sites (Renderer)

To run the renderer as a separate service, create an additional systemd unit:

```bash
sudo tee /etc/systemd/system/sigil-renderer.service <<EOF
[Unit]
Description=Sigil CMS Renderer
After=sigil.service

[Service]
Type=simple
User=sigil
Group=sigil
WorkingDirectory=/opt/sigil/apps/renderer
Environment=PORT=4000
Environment=API_URL=http://127.0.0.1:3001/api/v1/public
Environment=SITE_SLUG=your-site
Environment=SITE_NAME=Your Site Name
ExecStart=/usr/bin/node /opt/sigil/apps/renderer/dist/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable sigil-renderer
sudo systemctl start sigil-renderer
```

## Cost Estimate

| VPS Provider | Plan | Monthly Cost |
|-------------|------|-------------|
| Hetzner | CX22 (2 vCPU, 4GB) | $4.50/mo |
| DigitalOcean | Basic (2 vCPU, 2GB) | $12/mo |
| Linode | Nanode (1 vCPU, 2GB) | $5/mo |
| Vultr | Cloud Compute (1 vCPU, 2GB) | $6/mo |
| AWS Lightsail | 2GB | $10/mo |

## Troubleshooting

**Service won't start:**
```bash
journalctl -u sigil -n 50 --no-pager
# Check .env file exists and has correct DATABASE_URL
cat /opt/sigil/.env
```

**Database connection refused:**
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT 1;"
```

**nginx 502 Bad Gateway:**
```bash
# Check if the API is actually running
curl http://127.0.0.1:3001/health
sudo systemctl restart sigil
```

**Permission errors:**
```bash
sudo chown -R sigil:sigil /opt/sigil
sudo chmod 600 /opt/sigil/.env
```

## Uninstall

```bash
sudo systemctl stop sigil
sudo systemctl disable sigil
sudo rm /etc/systemd/system/sigil.service
sudo rm /etc/nginx/sites-enabled/sigil
sudo rm /etc/nginx/sites-available/sigil
sudo nginx -t && sudo systemctl reload nginx
sudo -u postgres psql -c "DROP DATABASE IF EXISTS sigil;"
sudo -u postgres psql -c "DROP USER IF EXISTS sigil;"
sudo userdel sigil
sudo rm -rf /opt/sigil
```

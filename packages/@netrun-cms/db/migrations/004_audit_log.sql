-- Tenant Activity Audit Log
-- Records all write operations for compliance (SOC2, GDPR, security reviews).
-- Non-blocking — inserted after response is sent.

CREATE TABLE IF NOT EXISTS cms_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  user_email VARCHAR(320),
  user_role VARCHAR(50),
  action VARCHAR(20) NOT NULL, -- create, update, delete
  resource_type VARCHAR(50) NOT NULL, -- site, page, block, theme, media, tenant, user
  resource_id UUID,
  site_id UUID,
  request_method VARCHAR(10) NOT NULL,
  request_path VARCHAR(500) NOT NULL,
  status_code INTEGER,
  duration_ms INTEGER,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Primary query: "show me everything that happened in this tenant recently"
CREATE INDEX IF NOT EXISTS idx_cms_audit_tenant_time
  ON cms_audit_log(tenant_id, created_at DESC);

-- "Who edited this specific resource?"
CREATE INDEX IF NOT EXISTS idx_cms_audit_resource
  ON cms_audit_log(resource_type, resource_id, created_at DESC);

-- "What did this user do?"
CREATE INDEX IF NOT EXISTS idx_cms_audit_user
  ON cms_audit_log(tenant_id, user_id, created_at DESC);

-- "What happened on this site?"
CREATE INDEX IF NOT EXISTS idx_cms_audit_site
  ON cms_audit_log(site_id, created_at DESC);

-- Auto-prune old entries (keep 90 days by default, configurable per-tenant)
-- Run this as a cron: DELETE FROM cms_audit_log WHERE created_at < NOW() - INTERVAL '90 days';

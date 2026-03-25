-- Migration: Add cross-tenant block template sharing
--
-- Adds tenant_id and scope columns to cms_block_templates to support:
-- - 'site': template visible only in the owning site (default, preserves current behavior)
-- - 'tenant': template visible to all sites in the owning tenant
-- - 'global': template visible to all tenants (platform-wide presets)

-- Add tenant_id column (nullable — global templates have no tenant)
ALTER TABLE cms_block_templates
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES cms_tenants(id) ON DELETE CASCADE;

-- Add scope column with default 'site' to preserve existing behavior
ALTER TABLE cms_block_templates
  ADD COLUMN IF NOT EXISTS scope VARCHAR(10) NOT NULL DEFAULT 'site';

-- Constraint: scope must be one of the allowed values
ALTER TABLE cms_block_templates
  ADD CONSTRAINT cms_block_templates_scope_check
  CHECK (scope IN ('site', 'tenant', 'global'));

-- Backfill: set tenant_id from the site's tenant for existing templates
UPDATE cms_block_templates bt
SET tenant_id = s.tenant_id
FROM cms_sites s
WHERE bt.site_id = s.id AND bt.tenant_id IS NULL;

-- Backfill: mark existing is_global=true templates as scope='global'
UPDATE cms_block_templates
SET scope = 'global'
WHERE is_global = true;

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_cms_block_templates_tenant_id ON cms_block_templates (tenant_id);
CREATE INDEX IF NOT EXISTS idx_cms_block_templates_scope ON cms_block_templates (scope);

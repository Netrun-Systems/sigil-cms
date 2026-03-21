-- Migration: Drop CHECK constraints for plugin architecture
-- These constraints are replaced by API-level validation via the plugin registry.
-- Run once against existing databases.

ALTER TABLE cms_content_blocks DROP CONSTRAINT IF EXISTS cms_content_blocks_type_check;
ALTER TABLE cms_sites DROP CONSTRAINT IF EXISTS cms_sites_template_check;

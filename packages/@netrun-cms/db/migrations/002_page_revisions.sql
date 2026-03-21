CREATE TABLE IF NOT EXISTS cms_page_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  content_snapshot JSONB NOT NULL DEFAULT '[]',
  settings_snapshot JSONB DEFAULT '{}',
  changed_by VARCHAR(255),
  change_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cms_page_revisions_page ON cms_page_revisions (page_id, version);

/**
 * @netrun/documents -- Documents & Wiki Plugin
 *
 * Provides SharePoint-like wiki + document hub functionality:
 * - Native wiki with [[backlinks]], full-text search, revision history
 * - Microsoft 365 / OneDrive / SharePoint integration via Graph API
 * - Google Workspace / Google Drive integration via Drive API
 * - Unified search and activity feed across all sources
 *
 * Drive integrations are optional -- wiki works standalone.
 * Configure MICROSOFT_CLIENT_ID/SECRET/TENANT_ID for Microsoft.
 * Configure GOOGLE_CLIENT_ID/SECRET for Google.
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createRoutes } from './routes.js';

const DOCUMENTS_MIGRATION = `
  -- Wikis (top-level containers)
  CREATE TABLE IF NOT EXISTS docs_wikis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'book',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_docs_wikis_tenant_slug UNIQUE(tenant_id, slug)
  );

  CREATE INDEX IF NOT EXISTS idx_docs_wikis_tenant ON docs_wikis(tenant_id);

  -- Wiki Pages (nested hierarchy via parent_id)
  CREATE TABLE IF NOT EXISTS docs_wiki_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
    wiki_id UUID NOT NULL REFERENCES docs_wikis(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL,
    content TEXT DEFAULT '',
    parent_id UUID,
    "order" INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' NOT NULL,
    author_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_docs_wiki_pages_wiki_slug UNIQUE(wiki_id, slug)
  );

  CREATE INDEX IF NOT EXISTS idx_docs_wiki_pages_tenant ON docs_wiki_pages(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_docs_wiki_pages_wiki ON docs_wiki_pages(wiki_id);
  CREATE INDEX IF NOT EXISTS idx_docs_wiki_pages_parent ON docs_wiki_pages(parent_id);

  -- Wiki Links (backlink tracking)
  CREATE TABLE IF NOT EXISTS docs_wiki_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_page_id UUID NOT NULL REFERENCES docs_wiki_pages(id) ON DELETE CASCADE,
    target_page_id UUID NOT NULL REFERENCES docs_wiki_pages(id) ON DELETE CASCADE,
    link_text VARCHAR(500),
    CONSTRAINT uq_docs_wiki_links_pair UNIQUE(source_page_id, target_page_id)
  );

  CREATE INDEX IF NOT EXISTS idx_docs_wiki_links_source ON docs_wiki_links(source_page_id);
  CREATE INDEX IF NOT EXISTS idx_docs_wiki_links_target ON docs_wiki_links(target_page_id);

  -- Wiki Page Revisions (version history)
  CREATE TABLE IF NOT EXISTS docs_wiki_page_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES docs_wiki_pages(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT DEFAULT '',
    author_id UUID,
    revision_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_docs_wiki_page_revisions UNIQUE(page_id, revision_number)
  );

  CREATE INDEX IF NOT EXISTS idx_docs_wiki_page_revisions_page ON docs_wiki_page_revisions(page_id);

  -- Connected Drives (Microsoft 365 / Google Workspace)
  CREATE TABLE IF NOT EXISTS docs_connected_drives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL,
    account_email VARCHAR(320) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    drive_id VARCHAR(500),
    drive_name VARCHAR(255),
    connected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_sync_at TIMESTAMPTZ
  );

  CREATE INDEX IF NOT EXISTS idx_docs_connected_drives_tenant ON docs_connected_drives(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_docs_connected_drives_provider ON docs_connected_drives(tenant_id, provider);

  -- External Documents (cached metadata from drives)
  CREATE TABLE IF NOT EXISTS docs_external_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
    drive_id UUID NOT NULL REFERENCES docs_connected_drives(id) ON DELETE CASCADE,
    external_id VARCHAR(500) NOT NULL,
    name VARCHAR(500) NOT NULL,
    mime_type VARCHAR(200),
    web_url TEXT,
    preview_url TEXT,
    last_modified TIMESTAMPTZ,
    last_synced TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    size_bytes BIGINT DEFAULT 0,
    path TEXT,
    parent_folder_id VARCHAR(500),
    is_folder BOOLEAN DEFAULT false,
    CONSTRAINT uq_docs_external_documents_drive_ext UNIQUE(drive_id, external_id)
  );

  CREATE INDEX IF NOT EXISTS idx_docs_external_documents_tenant ON docs_external_documents(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_docs_external_documents_drive ON docs_external_documents(drive_id);
  CREATE INDEX IF NOT EXISTS idx_docs_external_documents_parent ON docs_external_documents(drive_id, parent_folder_id);

  -- Document Tags
  CREATE TABLE IF NOT EXISTS docs_document_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
    document_id UUID NOT NULL,
    document_type VARCHAR(20) NOT NULL,
    tag VARCHAR(100) NOT NULL,
    CONSTRAINT uq_docs_document_tags UNIQUE(document_id, tag)
  );

  CREATE INDEX IF NOT EXISTS idx_docs_document_tags_tenant ON docs_document_tags(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_docs_document_tags_document ON docs_document_tags(document_id);

  -- Activity Log
  CREATE TABLE IF NOT EXISTS docs_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
    document_id UUID,
    document_type VARCHAR(20),
    user_id UUID,
    action VARCHAR(30) NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_docs_activity_log_tenant ON docs_activity_log(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_docs_activity_log_document ON docs_activity_log(document_id);
  CREATE INDEX IF NOT EXISTS idx_docs_activity_log_user ON docs_activity_log(user_id);
  CREATE INDEX IF NOT EXISTS idx_docs_activity_log_created ON docs_activity_log(tenant_id, created_at);
`;

const documentsPlugin: CmsPlugin = {
  id: 'netrun-documents',
  name: 'Documents & Wiki',
  version: '1.0.0',

  async register(ctx) {
    // Run migrations
    await ctx.runMigration(DOCUMENTS_MIGRATION);

    // Create route handlers
    const { router } = createRoutes(ctx.db, ctx.logger);

    // Mount as global routes (not site-scoped -- documents are per-tenant)
    ctx.addGlobalRoutes('documents', router);

    // Register admin navigation
    ctx.addAdminNav({
      title: 'Documents',
      siteScoped: false,
      items: [
        { label: 'Wiki', icon: 'BookOpen', href: '/wiki' },
        { label: 'Documents', icon: 'FileText', href: '/documents' },
        { label: 'Connected Drives', icon: 'HardDrive', href: '/documents/drives' },
        { label: 'Activity', icon: 'Activity', href: '/documents/activity' },
      ],
    });

    // Register admin routes for React lazy loading
    ctx.addAdminRoutes([
      { path: 'wiki', component: '@netrun/documents/admin/WikiBrowserPage' },
      { path: 'wiki/:wikiId', component: '@netrun/documents/admin/WikiBrowserPage' },
      { path: 'wiki/:wikiId/pages/:pageId', component: '@netrun/documents/admin/WikiEditorPage' },
      { path: 'documents', component: '@netrun/documents/admin/DocumentHubPage' },
      { path: 'documents/drives', component: '@netrun/documents/admin/DrivesPage' },
      { path: 'documents/drives/:driveId', component: '@netrun/documents/admin/DriveBrowserPage' },
      { path: 'documents/activity', component: '@netrun/documents/admin/ActivityPage' },
      { path: 'documents/search', component: '@netrun/documents/admin/SearchPage' },
    ]);

    // Register block types for Sigil page builder
    ctx.addBlockTypes([
      { type: 'wiki_embed', label: 'Wiki Page Embed', category: 'documents' },
      { type: 'document_link', label: 'Document Link Card', category: 'documents' },
      { type: 'document_gallery', label: 'Document Gallery', category: 'documents' },
    ]);

    ctx.logger.info({}, 'Documents & Wiki plugin registered');
  },
};

export default documentsPlugin;
export { documentsPlugin };

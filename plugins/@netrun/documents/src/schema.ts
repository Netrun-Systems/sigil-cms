/**
 * @netrun/documents -- Database schema
 *
 * Wiki + Connected Drives + Unified Document Hub.
 * All tables are tenant-scoped via tenant_id for multi-tenant isolation.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  bigint,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';
import { tenants } from '@netrun-cms/db';

// ============================================================================
// WIKIS -- Top-level wiki containers per tenant
// ============================================================================

export const docsWikis = pgTable('docs_wikis', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }).default('book'),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_docs_wikis_tenant').on(table.tenantId),
  tenantSlugUnique: unique('uq_docs_wikis_tenant_slug').on(table.tenantId, table.slug),
}));

// ============================================================================
// WIKI PAGES -- Individual pages with nested hierarchy
// ============================================================================

export const docsWikiPages = pgTable('docs_wiki_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  wikiId: uuid('wiki_id').notNull().references(() => docsWikis.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull(),
  content: text('content').default(''),
  parentId: uuid('parent_id'),
  order: integer('order').default(0),
  status: varchar('status', { length: 20 }).default('draft').notNull(),
  authorId: uuid('author_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_docs_wiki_pages_tenant').on(table.tenantId),
  wikiIdx: index('idx_docs_wiki_pages_wiki').on(table.wikiId),
  parentIdx: index('idx_docs_wiki_pages_parent').on(table.parentId),
  wikiSlugUnique: unique('uq_docs_wiki_pages_wiki_slug').on(table.wikiId, table.slug),
}));

// ============================================================================
// WIKI LINKS -- Backlink tracking between pages
// ============================================================================

export const docsWikiLinks = pgTable('docs_wiki_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourcePageId: uuid('source_page_id').notNull().references(() => docsWikiPages.id, { onDelete: 'cascade' }),
  targetPageId: uuid('target_page_id').notNull().references(() => docsWikiPages.id, { onDelete: 'cascade' }),
  linkText: varchar('link_text', { length: 500 }),
}, (table) => ({
  sourceIdx: index('idx_docs_wiki_links_source').on(table.sourcePageId),
  targetIdx: index('idx_docs_wiki_links_target').on(table.targetPageId),
  uniqueLink: unique('uq_docs_wiki_links_pair').on(table.sourcePageId, table.targetPageId),
}));

// ============================================================================
// CONNECTED DRIVES -- Microsoft 365 / Google Workspace connections
// ============================================================================

export const docsConnectedDrives = pgTable('docs_connected_drives', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 20 }).notNull(), // 'microsoft' | 'google'
  accountEmail: varchar('account_email', { length: 320 }).notNull(),
  accessToken: text('access_token'), // encrypted at rest
  refreshToken: text('refresh_token'), // encrypted at rest
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  driveId: varchar('drive_id', { length: 500 }),
  driveName: varchar('drive_name', { length: 255 }),
  connectedAt: timestamp('connected_at', { withTimezone: true }).defaultNow().notNull(),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('idx_docs_connected_drives_tenant').on(table.tenantId),
  providerIdx: index('idx_docs_connected_drives_provider').on(table.tenantId, table.provider),
}));

// ============================================================================
// EXTERNAL DOCUMENTS -- Cached metadata from connected drives
// ============================================================================

export const docsExternalDocuments = pgTable('docs_external_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  driveId: uuid('drive_id').notNull().references(() => docsConnectedDrives.id, { onDelete: 'cascade' }),
  externalId: varchar('external_id', { length: 500 }).notNull(),
  name: varchar('name', { length: 500 }).notNull(),
  mimeType: varchar('mime_type', { length: 200 }),
  webUrl: text('web_url'),
  previewUrl: text('preview_url'),
  lastModified: timestamp('last_modified', { withTimezone: true }),
  lastSynced: timestamp('last_synced', { withTimezone: true }).defaultNow().notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }),
  path: text('path'),
  parentFolderId: varchar('parent_folder_id', { length: 500 }),
  isFolder: boolean('is_folder').default(false),
}, (table) => ({
  tenantIdx: index('idx_docs_external_documents_tenant').on(table.tenantId),
  driveIdx: index('idx_docs_external_documents_drive').on(table.driveId),
  externalIdUnique: unique('uq_docs_external_documents_drive_ext').on(table.driveId, table.externalId),
  parentFolderIdx: index('idx_docs_external_documents_parent').on(table.driveId, table.parentFolderId),
}));

// ============================================================================
// DOCUMENT TAGS -- Tags for wiki pages and external docs
// ============================================================================

export const docsDocumentTags = pgTable('docs_document_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  documentId: uuid('document_id').notNull(), // can be wiki page id or external doc id
  documentType: varchar('document_type', { length: 20 }).notNull(), // 'wiki_page' | 'external'
  tag: varchar('tag', { length: 100 }).notNull(),
}, (table) => ({
  tenantIdx: index('idx_docs_document_tags_tenant').on(table.tenantId),
  documentIdx: index('idx_docs_document_tags_document').on(table.documentId),
  uniqueTag: unique('uq_docs_document_tags').on(table.documentId, table.tag),
}));

// ============================================================================
// ACTIVITY LOG -- Audit trail for all document actions
// ============================================================================

export const docsActivityLog = pgTable('docs_activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  documentId: uuid('document_id'),
  documentType: varchar('document_type', { length: 20 }), // 'wiki_page' | 'external' | 'wiki' | 'drive'
  userId: uuid('user_id'),
  action: varchar('action', { length: 30 }).notNull(), // created, edited, viewed, shared, commented, synced
  details: jsonb('details').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_docs_activity_log_tenant').on(table.tenantId),
  documentIdx: index('idx_docs_activity_log_document').on(table.documentId),
  userIdx: index('idx_docs_activity_log_user').on(table.userId),
  createdIdx: index('idx_docs_activity_log_created').on(table.tenantId, table.createdAt),
}));

// ============================================================================
// WIKI PAGE REVISIONS -- Version history for wiki pages
// ============================================================================

export const docsWikiPageRevisions = pgTable('docs_wiki_page_revisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageId: uuid('page_id').notNull().references(() => docsWikiPages.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').default(''),
  authorId: uuid('author_id'),
  revisionNumber: integer('revision_number').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pageIdx: index('idx_docs_wiki_page_revisions_page').on(table.pageId),
  revisionUnique: unique('uq_docs_wiki_page_revisions').on(table.pageId, table.revisionNumber),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const docsWikisRelations = relations(docsWikis, ({ one, many }) => ({
  tenant: one(tenants, { fields: [docsWikis.tenantId], references: [tenants.id] }),
  pages: many(docsWikiPages),
}));

export const docsWikiPagesRelations = relations(docsWikiPages, ({ one, many }) => ({
  wiki: one(docsWikis, { fields: [docsWikiPages.wikiId], references: [docsWikis.id] }),
  parent: one(docsWikiPages, { fields: [docsWikiPages.parentId], references: [docsWikiPages.id], relationName: 'parentChild' }),
  children: many(docsWikiPages, { relationName: 'parentChild' }),
  outgoingLinks: many(docsWikiLinks, { relationName: 'sourceLinks' }),
  incomingLinks: many(docsWikiLinks, { relationName: 'targetLinks' }),
  revisions: many(docsWikiPageRevisions),
}));

export const docsWikiLinksRelations = relations(docsWikiLinks, ({ one }) => ({
  sourcePage: one(docsWikiPages, { fields: [docsWikiLinks.sourcePageId], references: [docsWikiPages.id], relationName: 'sourceLinks' }),
  targetPage: one(docsWikiPages, { fields: [docsWikiLinks.targetPageId], references: [docsWikiPages.id], relationName: 'targetLinks' }),
}));

export const docsConnectedDrivesRelations = relations(docsConnectedDrives, ({ one, many }) => ({
  tenant: one(tenants, { fields: [docsConnectedDrives.tenantId], references: [tenants.id] }),
  documents: many(docsExternalDocuments),
}));

export const docsExternalDocumentsRelations = relations(docsExternalDocuments, ({ one }) => ({
  drive: one(docsConnectedDrives, { fields: [docsExternalDocuments.driveId], references: [docsConnectedDrives.id] }),
}));

export const docsWikiPageRevisionsRelations = relations(docsWikiPageRevisions, ({ one }) => ({
  page: one(docsWikiPages, { fields: [docsWikiPageRevisions.pageId], references: [docsWikiPages.id] }),
}));

// ============================================================================
// PAGE STATUSES
// ============================================================================

export const PAGE_STATUSES = ['draft', 'published'] as const;
export type PageStatus = typeof PAGE_STATUSES[number];

export const DRIVE_PROVIDERS = ['microsoft', 'google'] as const;
export type DriveProvider = typeof DRIVE_PROVIDERS[number];

export const ACTIVITY_ACTIONS = ['created', 'edited', 'viewed', 'shared', 'commented', 'synced', 'reverted'] as const;
export type ActivityAction = typeof ACTIVITY_ACTIONS[number];

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const insertWikiSchema = createInsertSchema(docsWikis);
export const selectWikiSchema = createSelectSchema(docsWikis);
export type InsertWiki = z.infer<typeof insertWikiSchema>;
export type SelectWiki = z.infer<typeof selectWikiSchema>;

export const insertWikiPageSchema = createInsertSchema(docsWikiPages);
export const selectWikiPageSchema = createSelectSchema(docsWikiPages);
export type InsertWikiPage = z.infer<typeof insertWikiPageSchema>;
export type SelectWikiPage = z.infer<typeof selectWikiPageSchema>;

export const insertConnectedDriveSchema = createInsertSchema(docsConnectedDrives);
export const selectConnectedDriveSchema = createSelectSchema(docsConnectedDrives);
export type InsertConnectedDrive = z.infer<typeof insertConnectedDriveSchema>;
export type SelectConnectedDrive = z.infer<typeof selectConnectedDriveSchema>;

export const insertExternalDocumentSchema = createInsertSchema(docsExternalDocuments);
export const selectExternalDocumentSchema = createSelectSchema(docsExternalDocuments);
export type InsertExternalDocument = z.infer<typeof insertExternalDocumentSchema>;
export type SelectExternalDocument = z.infer<typeof selectExternalDocumentSchema>;

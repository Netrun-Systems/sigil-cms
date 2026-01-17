/**
 * NetrunCMS Database Schema
 *
 * Multi-tenant CMS with PostgreSQL Row-Level Security (RLS)
 * Using Drizzle ORM for type-safe database operations
 */

import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  uuid,
  jsonb,
  index,
  unique,
  check,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ============================================================================
// TENANTS TABLE - Multi-tenant support
// ============================================================================
export const tenants = pgTable('cms_tenants', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  plan: varchar('plan', { length: 20 }).notNull().default('free'),
  settings: jsonb('settings').$type<Record<string, unknown>>().default({}),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  slugIdx: index('idx_cms_tenants_slug').on(table.slug),
  planIdx: index('idx_cms_tenants_plan').on(table.plan),
  planCheck: check('cms_tenants_plan_check',
    sql`${table.plan} IN ('free', 'starter', 'pro', 'enterprise')`
  ),
}));

// ============================================================================
// SITES TABLE - Individual websites/projects
// ============================================================================
export const sites = pgTable('cms_sites', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  domain: varchar('domain', { length: 255 }),
  defaultLanguage: varchar('default_language', { length: 5 }).notNull().default('en'),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  settings: jsonb('settings').$type<{
    favicon?: string;
    logo?: string;
    logoDark?: string;
    socialLinks?: Record<string, string>;
    analytics?: Record<string, string>;
    seo?: Record<string, string>;
  }>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantSlugUnique: unique('cms_sites_tenant_slug_unique').on(table.tenantId, table.slug),
  tenantIdIdx: index('idx_cms_sites_tenant_id').on(table.tenantId),
  statusIdx: index('idx_cms_sites_status').on(table.status),
  domainIdx: index('idx_cms_sites_domain').on(table.domain),
  statusCheck: check('cms_sites_status_check',
    sql`${table.status} IN ('draft', 'published', 'archived')`
  ),
}));

// ============================================================================
// THEMES TABLE - Per-site theme customization
// ============================================================================
export const themes = pgTable('cms_themes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  isActive: boolean('is_active').notNull().default(false),
  baseTheme: varchar('base_theme', { length: 50 }).notNull().default('netrun-dark'),
  tokens: jsonb('tokens').$type<{
    colors: Record<string, string>;
    typography: Record<string, string | number>;
    spacing?: Record<string, string>;
    effects?: Record<string, string>;
  }>().notNull(),
  customCss: text('custom_css'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteIdIdx: index('idx_cms_themes_site_id').on(table.siteId),
  activeIdx: index('idx_cms_themes_active').on(table.siteId, table.isActive),
  baseThemeCheck: check('cms_themes_base_theme_check',
    sql`${table.baseTheme} IN ('netrun-dark', 'netrun-light', 'kog', 'intirkon', 'minimal', 'custom')`
  ),
}));

// ============================================================================
// PAGES TABLE - Content pages
// ============================================================================
export const pages = pgTable('cms_pages', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id').references((): AnyPgColumn => pages.id),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  fullPath: text('full_path'),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  publishedAt: timestamp('published_at'),
  language: varchar('language', { length: 5 }).notNull().default('en'),
  metaTitle: varchar('meta_title', { length: 60 }),
  metaDescription: text('meta_description'),
  ogImageUrl: text('og_image_url'),
  template: varchar('template', { length: 50 }).notNull().default('default'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteSlugLanguageUnique: unique('cms_pages_site_slug_language_unique').on(
    table.siteId, table.slug, table.language
  ),
  siteIdIdx: index('idx_cms_pages_site_id').on(table.siteId),
  parentIdIdx: index('idx_cms_pages_parent_id').on(table.parentId),
  statusIdx: index('idx_cms_pages_status').on(table.status),
  publishedAtIdx: index('idx_cms_pages_published_at').on(table.publishedAt),
  fullPathIdx: index('idx_cms_pages_full_path').on(table.fullPath),
  fullTextIdx: index('idx_cms_pages_fulltext').using('gin',
    sql`to_tsvector('english', ${table.title} || ' ' || COALESCE(${table.metaDescription}, ''))`
  ),
  statusCheck: check('cms_pages_status_check',
    sql`${table.status} IN ('draft', 'published', 'scheduled', 'archived')`
  ),
  templateCheck: check('cms_pages_template_check',
    sql`${table.template} IN ('default', 'landing', 'blog', 'product', 'contact')`
  ),
  slugFormatCheck: check('cms_pages_slug_format_check',
    sql`${table.slug} ~* '^[a-z0-9-]+$'`
  ),
  metaTitleLengthCheck: check('cms_pages_meta_title_length_check',
    sql`${table.metaTitle} IS NULL OR LENGTH(${table.metaTitle}) <= 60`
  ),
  metaDescriptionLengthCheck: check('cms_pages_meta_description_length_check',
    sql`${table.metaDescription} IS NULL OR LENGTH(${table.metaDescription}) <= 160`
  ),
}));

// ============================================================================
// CONTENT BLOCKS TABLE - Composable page content
// ============================================================================
export const contentBlocks = pgTable('cms_content_blocks', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  pageId: uuid('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  blockType: varchar('block_type', { length: 50 }).notNull(),
  content: jsonb('content').$type<Record<string, unknown>>().notNull().default({}),
  settings: jsonb('settings').$type<{
    padding?: string;
    margin?: string;
    background?: string;
    width?: string;
    animation?: string;
    customClass?: string;
  }>().default({}),
  sortOrder: integer('sort_order').notNull().default(0),
  isVisible: boolean('is_visible').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  pageIdIdx: index('idx_cms_content_blocks_page_id').on(table.pageId),
  blockTypeIdx: index('idx_cms_content_blocks_type').on(table.blockType),
  sortOrderIdx: index('idx_cms_content_blocks_sort').on(table.pageId, table.sortOrder),
  blockTypeCheck: check('cms_content_blocks_type_check',
    sql`${table.blockType} IN (
      'hero', 'text', 'rich_text', 'image', 'gallery', 'video', 'cta',
      'feature_grid', 'pricing_table', 'testimonial', 'faq', 'contact_form',
      'code_block', 'bento_grid', 'stats_bar', 'timeline', 'newsletter', 'custom'
    )`
  ),
}));

// ============================================================================
// BLOCK TEMPLATES TABLE - Reusable block templates
// ============================================================================
export const blockTemplates = pgTable('cms_block_templates', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').references(() => sites.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  blockType: varchar('block_type', { length: 50 }).notNull(),
  content: jsonb('content').$type<Record<string, unknown>>().notNull().default({}),
  settings: jsonb('settings').$type<Record<string, unknown>>().default({}),
  isGlobal: boolean('is_global').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteIdIdx: index('idx_cms_block_templates_site_id').on(table.siteId),
  blockTypeIdx: index('idx_cms_block_templates_type').on(table.blockType),
  globalIdx: index('idx_cms_block_templates_global').on(table.isGlobal),
}));

// ============================================================================
// MEDIA TABLE - Asset management
// ============================================================================
export const media = pgTable('cms_media', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  altText: varchar('alt_text', { length: 255 }),
  caption: text('caption'),
  folder: varchar('folder', { length: 255 }).notNull().default('/'),
  metadata: jsonb('metadata').$type<{
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
  }>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteIdIdx: index('idx_cms_media_site_id').on(table.siteId),
  folderIdx: index('idx_cms_media_folder').on(table.siteId, table.folder),
  mimeTypeIdx: index('idx_cms_media_mime_type').on(table.mimeType),
  createdAtIdx: index('idx_cms_media_created_at').on(table.createdAt),
  fileSizeCheck: check('cms_media_file_size_check',
    sql`${table.fileSize} > 0`
  ),
}));

// ============================================================================
// USERS TABLE - CMS users (extends base user concept)
// ============================================================================
export const users = pgTable('cms_users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  username: varchar('username', { length: 50 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('editor'),
  isActive: boolean('is_active').notNull().default(true),
  sitePermissions: jsonb('site_permissions').$type<Record<string, string[]>>().default({}),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantEmailUnique: unique('cms_users_tenant_email_unique').on(table.tenantId, table.email),
  tenantIdIdx: index('idx_cms_users_tenant_id').on(table.tenantId),
  emailIdx: index('idx_cms_users_email').on(table.email),
  roleIdx: index('idx_cms_users_role').on(table.role),
  roleCheck: check('cms_users_role_check',
    sql`${table.role} IN ('admin', 'editor', 'author', 'viewer')`
  ),
  emailFormatCheck: check('cms_users_email_format_check',
    sql`${table.email} ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'`
  ),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const tenantsRelations = relations(tenants, ({ many }) => ({
  sites: many(sites),
  users: many(users),
}));

export const sitesRelations = relations(sites, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [sites.tenantId],
    references: [tenants.id],
  }),
  themes: many(themes),
  pages: many(pages),
  media: many(media),
  blockTemplates: many(blockTemplates),
}));

export const themesRelations = relations(themes, ({ one }) => ({
  site: one(sites, {
    fields: [themes.siteId],
    references: [sites.id],
  }),
}));

export const pagesRelations = relations(pages, ({ one, many }) => ({
  site: one(sites, {
    fields: [pages.siteId],
    references: [sites.id],
  }),
  parent: one(pages, {
    fields: [pages.parentId],
    references: [pages.id],
  }),
  children: many(pages),
  blocks: many(contentBlocks),
}));

export const contentBlocksRelations = relations(contentBlocks, ({ one }) => ({
  page: one(pages, {
    fields: [contentBlocks.pageId],
    references: [pages.id],
  }),
}));

export const blockTemplatesRelations = relations(blockTemplates, ({ one }) => ({
  site: one(sites, {
    fields: [blockTemplates.siteId],
    references: [sites.id],
  }),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  site: one(sites, {
    fields: [media.siteId],
    references: [sites.id],
  }),
}));

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}));

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

// Tenant schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectTenantSchema = createSelectSchema(tenants);

// Site schemas
export const insertSiteSchema = createInsertSchema(sites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
});
export const selectSiteSchema = createSelectSchema(sites);

// Theme schemas
export const insertThemeSchema = createInsertSchema(themes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectThemeSchema = createSelectSchema(themes);

// Page schemas
export const insertPageSchema = createInsertSchema(pages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
});
export const selectPageSchema = createSelectSchema(pages);

// Content block schemas
export const insertContentBlockSchema = createInsertSchema(contentBlocks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectContentBlockSchema = createSelectSchema(contentBlocks);

// Media schemas
export const insertMediaSchema = createInsertSchema(media).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectMediaSchema = createSelectSchema(media);

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});
export const selectUserSchema = createSelectSchema(users);

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type Site = typeof sites.$inferSelect;
export type InsertSite = z.infer<typeof insertSiteSchema>;

export type Theme = typeof themes.$inferSelect;
export type InsertTheme = z.infer<typeof insertThemeSchema>;

export type Page = typeof pages.$inferSelect;
export type InsertPage = z.infer<typeof insertPageSchema>;

export type ContentBlock = typeof contentBlocks.$inferSelect;
export type InsertContentBlock = z.infer<typeof insertContentBlockSchema>;

export type BlockTemplate = typeof blockTemplates.$inferSelect;

export type Media = typeof media.$inferSelect;
export type InsertMedia = z.infer<typeof insertMediaSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Extended types
export type PageWithBlocks = Page & {
  blocks: ContentBlock[];
};

export type SiteWithTheme = Site & {
  activeTheme?: Theme;
};

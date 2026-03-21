/**
 * Documentation Plugin — Drizzle table definitions
 *
 * Tables: cms_doc_categories, cms_doc_articles, cms_doc_revisions, cms_doc_feedback
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { sites, pages } from '@netrun-cms/db';

// ---------------------------------------------------------------------------
// Doc Categories — hierarchical categories for organizing articles
// ---------------------------------------------------------------------------

export const docCategories = pgTable('cms_doc_categories', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteSlugUnique: unique('cms_doc_categories_site_slug_unique').on(table.siteId, table.slug),
  siteParentIdx: index('idx_cms_doc_categories_site_parent').on(table.siteId, table.parentId),
}));

// ---------------------------------------------------------------------------
// Doc Articles — knowledge base articles (links to cms_pages for content)
// ---------------------------------------------------------------------------

export const docArticles = pgTable('cms_doc_articles', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  pageId: uuid('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id'),
  slug: varchar('slug', { length: 255 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  excerpt: text('excerpt'),
  tags: jsonb('tags').$type<string[]>().default([]),
  isFeatured: boolean('is_featured').notNull().default(false),
  isPinned: boolean('is_pinned').notNull().default(false),
  viewCount: integer('view_count').notNull().default(0),
  helpfulYes: integer('helpful_yes').notNull().default(0),
  helpfulNo: integer('helpful_no').notNull().default(0),
  lastRevisedAt: timestamp('last_revised_at'),
  lastRevisedBy: varchar('last_revised_by', { length: 255 }),
  revisionNote: text('revision_note'),
  sortOrder: integer('sort_order').notNull().default(0),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteSlugUnique: unique('cms_doc_articles_site_slug_unique').on(table.siteId, table.slug),
  siteCategoryIdx: index('idx_cms_doc_articles_site_category').on(table.siteId, table.categoryId),
  siteFeaturedIdx: index('idx_cms_doc_articles_site_featured').on(table.siteId, table.isFeatured),
  tagsGinIdx: index('idx_cms_doc_articles_tags').using('gin', table.tags),
}));

// ---------------------------------------------------------------------------
// Doc Revisions — version history for articles
// ---------------------------------------------------------------------------

export const docRevisions = pgTable('cms_doc_revisions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  articleId: uuid('article_id').notNull().references(() => docArticles.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  excerpt: text('excerpt'),
  content: jsonb('content').$type<Record<string, unknown>[]>().notNull(),
  changedBy: varchar('changed_by', { length: 255 }),
  changeNote: text('change_note'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  articleVersionIdx: index('idx_cms_doc_revisions_article_version').on(table.articleId, table.version),
}));

// ---------------------------------------------------------------------------
// Doc Feedback — "Was this helpful?" responses
// ---------------------------------------------------------------------------

export const docFeedback = pgTable('cms_doc_feedback', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  articleId: uuid('article_id').notNull().references(() => docArticles.id, { onDelete: 'cascade' }),
  isHelpful: boolean('is_helpful').notNull(),
  comment: text('comment'),
  sessionId: varchar('session_id', { length: 100 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  articleIdx: index('idx_cms_doc_feedback_article').on(table.articleId),
}));

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

export const insertDocCategorySchema = createInsertSchema(docCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
});
export const selectDocCategorySchema = createSelectSchema(docCategories);

export const insertDocArticleSchema = createInsertSchema(docArticles).omit({
  id: true,
  viewCount: true,
  helpfulYes: true,
  helpfulNo: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(255),
  tags: z.array(z.string()).default([]),
});
export const selectDocArticleSchema = createSelectSchema(docArticles);

export const insertDocRevisionSchema = createInsertSchema(docRevisions).omit({
  id: true,
  createdAt: true,
}).extend({
  version: z.number().int().positive(),
  title: z.string().min(1).max(500),
});
export const selectDocRevisionSchema = createSelectSchema(docRevisions);

export const insertDocFeedbackSchema = createInsertSchema(docFeedback).omit({
  id: true,
  createdAt: true,
}).extend({
  isHelpful: z.boolean(),
});
export const selectDocFeedbackSchema = createSelectSchema(docFeedback);

// ---------------------------------------------------------------------------
// TypeScript Types
// ---------------------------------------------------------------------------

export type DocCategory = typeof docCategories.$inferSelect;
export type InsertDocCategory = z.infer<typeof insertDocCategorySchema>;

export type DocArticle = typeof docArticles.$inferSelect;
export type InsertDocArticle = z.infer<typeof insertDocArticleSchema>;

export type DocRevision = typeof docRevisions.$inferSelect;
export type InsertDocRevision = z.infer<typeof insertDocRevisionSchema>;

export type DocFeedback = typeof docFeedback.$inferSelect;
export type InsertDocFeedback = z.infer<typeof insertDocFeedbackSchema>;

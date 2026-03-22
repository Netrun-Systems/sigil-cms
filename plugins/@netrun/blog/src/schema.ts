/**
 * Blog Plugin — Drizzle ORM schema
 *
 * Multi-tenant blog with posts, categories, tags, authors, comments,
 * and revision history. All tables prefixed with cms_blog_ for namespace
 * isolation within the shared PostgreSQL database.
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
  primaryKey,
  check,
} from 'drizzle-orm/pg-core';

// ============================================================================
// BLOG AUTHORS
// ============================================================================

export const blogAuthors = pgTable('cms_blog_authors', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  userId: uuid('user_id'),
  displayName: varchar('display_name', { length: 200 }).notNull(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  socialLinks: jsonb('social_links').$type<{
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  }>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantUserUnique: unique('cms_blog_authors_tenant_user').on(table.tenantId, table.userId),
  tenantIdx: index('idx_cms_blog_authors_tenant').on(table.tenantId),
}));

// ============================================================================
// BLOG CATEGORIES
// ============================================================================

export const blogCategories = pgTable('cms_blog_categories', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  siteId: uuid('site_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  parentId: uuid('parent_id'),
  sortOrder: integer('sort_order').notNull().default(0),
  color: varchar('color', { length: 7 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteSlugUnique: unique('cms_blog_categories_site_slug').on(table.siteId, table.slug),
  siteIdx: index('idx_cms_blog_categories_site').on(table.siteId),
  parentIdx: index('idx_cms_blog_categories_parent').on(table.parentId),
}));

// ============================================================================
// BLOG TAGS
// ============================================================================

export const blogTags = pgTable('cms_blog_tags', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  siteId: uuid('site_id').notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  siteSlugUnique: unique('cms_blog_tags_site_slug').on(table.siteId, table.slug),
  siteIdx: index('idx_cms_blog_tags_site').on(table.siteId),
}));

// ============================================================================
// BLOG POSTS
// ============================================================================

export const blogPosts = pgTable('cms_blog_posts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  siteId: uuid('site_id').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  coverImage: text('cover_image'),
  authorId: uuid('author_id'),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  publishedAt: timestamp('published_at'),
  scheduledAt: timestamp('scheduled_at'),
  readingTimeMinutes: integer('reading_time_minutes'),
  featured: boolean('featured').notNull().default(false),
  allowComments: boolean('allow_comments').notNull().default(true),
  metaTitle: varchar('meta_title', { length: 70 }),
  metaDescription: text('meta_description'),
  ogImage: text('og_image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteSlugUnique: unique('cms_blog_posts_site_slug').on(table.siteId, table.slug),
  siteStatusIdx: index('idx_cms_blog_posts_site_status').on(table.siteId, table.status),
  sitePublishedAtIdx: index('idx_cms_blog_posts_site_published_at').on(table.siteId, table.publishedAt),
  siteFeaturedIdx: index('idx_cms_blog_posts_site_featured').on(table.siteId, table.featured),
  authorIdx: index('idx_cms_blog_posts_author').on(table.authorId),
  scheduledIdx: index('idx_cms_blog_posts_scheduled').on(table.status, table.scheduledAt),
  fullTextIdx: index('idx_cms_blog_posts_fulltext').using('gin',
    sql`to_tsvector('english', COALESCE(${table.title}, '') || ' ' || COALESCE(${table.excerpt}, '') || ' ' || COALESCE(${table.content}, ''))`
  ),
  statusCheck: check('cms_blog_posts_status_check',
    sql`${table.status} IN ('draft', 'published', 'scheduled', 'archived')`
  ),
}));

// ============================================================================
// JUNCTION TABLES
// ============================================================================

export const blogPostCategories = pgTable('cms_blog_post_categories', {
  postId: uuid('post_id').notNull(),
  categoryId: uuid('category_id').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.categoryId] }),
  postIdx: index('idx_cms_blog_post_categories_post').on(table.postId),
  categoryIdx: index('idx_cms_blog_post_categories_category').on(table.categoryId),
}));

export const blogPostTags = pgTable('cms_blog_post_tags', {
  postId: uuid('post_id').notNull(),
  tagId: uuid('tag_id').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.tagId] }),
  postIdx: index('idx_cms_blog_post_tags_post').on(table.postId),
  tagIdx: index('idx_cms_blog_post_tags_tag').on(table.tagId),
}));

// ============================================================================
// BLOG COMMENTS
// ============================================================================

export const blogComments = pgTable('cms_blog_comments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  postId: uuid('post_id').notNull(),
  authorName: varchar('author_name', { length: 200 }).notNull(),
  authorEmail: varchar('author_email', { length: 320 }).notNull(),
  content: text('content').notNull(),
  approved: boolean('approved').notNull().default(false),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  postApprovedIdx: index('idx_cms_blog_comments_post_approved').on(table.postId, table.approved),
  parentIdx: index('idx_cms_blog_comments_parent').on(table.parentId),
}));

// ============================================================================
// BLOG POST REVISIONS
// ============================================================================

export const blogPostRevisions = pgTable('cms_blog_post_revisions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  postId: uuid('post_id').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  revisionNumber: integer('revision_number').notNull(),
  authorId: uuid('author_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  postRevisionIdx: index('idx_cms_blog_revisions_post').on(table.postId, table.revisionNumber),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  author: one(blogAuthors, {
    fields: [blogPosts.authorId],
    references: [blogAuthors.id],
  }),
  categories: many(blogPostCategories),
  tags: many(blogPostTags),
  comments: many(blogComments),
  revisions: many(blogPostRevisions),
}));

export const blogAuthorsRelations = relations(blogAuthors, ({ many }) => ({
  posts: many(blogPosts),
}));

export const blogCategoriesRelations = relations(blogCategories, ({ one, many }) => ({
  parent: one(blogCategories, {
    fields: [blogCategories.parentId],
    references: [blogCategories.id],
  }),
  posts: many(blogPostCategories),
}));

export const blogPostCategoriesRelations = relations(blogPostCategories, ({ one }) => ({
  post: one(blogPosts, { fields: [blogPostCategories.postId], references: [blogPosts.id] }),
  category: one(blogCategories, { fields: [blogPostCategories.categoryId], references: [blogCategories.id] }),
}));

export const blogPostTagsRelations = relations(blogPostTags, ({ one }) => ({
  post: one(blogPosts, { fields: [blogPostTags.postId], references: [blogPosts.id] }),
  tag: one(blogTags, { fields: [blogPostTags.tagId], references: [blogTags.id] }),
}));

export const blogCommentsRelations = relations(blogComments, ({ one }) => ({
  post: one(blogPosts, { fields: [blogComments.postId], references: [blogPosts.id] }),
  parent: one(blogComments, { fields: [blogComments.parentId], references: [blogComments.id] }),
}));

export const blogPostRevisionsRelations = relations(blogPostRevisions, ({ one }) => ({
  post: one(blogPosts, { fields: [blogPostRevisions.postId], references: [blogPosts.id] }),
}));

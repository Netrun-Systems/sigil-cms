/**
 * Community Forum Plugin — Drizzle table definitions
 *
 * Tables:
 *   cms_community_members     — gated membership
 *   cms_community_categories  — forum categories/boards
 *   cms_community_posts       — threads and replies (tree structure)
 *   cms_community_votes       — up/down votes on posts
 *   cms_community_tags        — tags for categorization
 *   cms_community_post_tags   — many-to-many posts <-> tags
 *   cms_community_bookmarks   — members save posts for later
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
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { sites } from '@netrun-cms/db';

// ---------------------------------------------------------------------------
// Community Members — gated membership (prevents anonymous scraping)
// ---------------------------------------------------------------------------

export const communityMembers = pgTable('cms_community_members', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 320 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  reputation: integer('reputation').notNull().default(0),
  postCount: integer('post_count').notNull().default(0),
  isVerified: boolean('is_verified').notNull().default(false),
  isBanned: boolean('is_banned').notNull().default(false),
  verificationToken: uuid('verification_token').default(sql`gen_random_uuid()`),
  lastActiveAt: timestamp('last_active_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteEmailUniq: unique('uq_cms_community_members_site_email').on(table.siteId, table.email),
  siteRoleIdx: index('idx_cms_community_members_site_role').on(table.siteId, table.role),
  siteReputationIdx: index('idx_cms_community_members_site_reputation').on(table.siteId, table.reputation),
}));

// ---------------------------------------------------------------------------
// Community Categories — forum categories/boards
// ---------------------------------------------------------------------------

export const communityCategories = pgTable('cms_community_categories', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 7 }),
  sortOrder: integer('sort_order').notNull().default(0),
  isLocked: boolean('is_locked').notNull().default(false),
  postCount: integer('post_count').notNull().default(0),
  lastPostAt: timestamp('last_post_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteSlugUniq: unique('uq_cms_community_categories_site_slug').on(table.siteId, table.slug),
}));

// ---------------------------------------------------------------------------
// Community Posts — threads/topics AND replies (tree structure)
// ---------------------------------------------------------------------------

export const communityPosts = pgTable('cms_community_posts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => communityCategories.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'),
  authorId: uuid('author_id').notNull().references(() => communityMembers.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }),
  slug: varchar('slug', { length: 500 }),
  body: text('body').notNull(),
  bodyHtml: text('body_html'),
  type: varchar('type', { length: 20 }).notNull().default('discussion'),
  status: varchar('status', { length: 20 }).notNull().default('published'),
  isPinned: boolean('is_pinned').notNull().default(false),
  isLocked: boolean('is_locked').notNull().default(false),
  isSolved: boolean('is_solved').notNull().default(false),
  solvedAnswerId: uuid('solved_answer_id'),
  viewCount: integer('view_count').notNull().default(0),
  replyCount: integer('reply_count').notNull().default(0),
  voteScore: integer('vote_score').notNull().default(0),
  lastReplyAt: timestamp('last_reply_at'),
  editedAt: timestamp('edited_at'),
  editedBy: uuid('edited_by'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteCategoryStatusIdx: index('idx_cms_community_posts_site_cat_status').on(table.siteId, table.categoryId, table.status, table.createdAt),
  siteAuthorIdx: index('idx_cms_community_posts_site_author').on(table.siteId, table.authorId),
  siteTypeStatusIdx: index('idx_cms_community_posts_site_type_status').on(table.siteId, table.type, table.status),
  parentIdx: index('idx_cms_community_posts_parent').on(table.parentId),
}));

// ---------------------------------------------------------------------------
// Community Votes — up/down votes on posts
// ---------------------------------------------------------------------------

export const communityVotes = pgTable('cms_community_votes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  postId: uuid('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id').notNull().references(() => communityMembers.id, { onDelete: 'cascade' }),
  value: integer('value').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  postMemberUniq: unique('uq_cms_community_votes_post_member').on(table.postId, table.memberId),
}));

// ---------------------------------------------------------------------------
// Community Tags — tags for categorization and search
// ---------------------------------------------------------------------------

export const communityTags = pgTable('cms_community_tags', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 50 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull(),
  usageCount: integer('usage_count').notNull().default(0),
}, (table) => ({
  siteSlugUniq: unique('uq_cms_community_tags_site_slug').on(table.siteId, table.slug),
}));

// ---------------------------------------------------------------------------
// Community Post Tags — many-to-many posts <-> tags
// ---------------------------------------------------------------------------

export const communityPostTags = pgTable('cms_community_post_tags', {
  postId: uuid('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => communityTags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.tagId] }),
}));

// ---------------------------------------------------------------------------
// Community Bookmarks — members save posts for later
// ---------------------------------------------------------------------------

export const communityBookmarks = pgTable('cms_community_bookmarks', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  memberId: uuid('member_id').notNull().references(() => communityMembers.id, { onDelete: 'cascade' }),
  postId: uuid('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  memberPostUniq: unique('uq_cms_community_bookmarks_member_post').on(table.memberId, table.postId),
}));

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

export const insertCommunityMemberSchema = createInsertSchema(communityMembers);
export const selectCommunityMemberSchema = createSelectSchema(communityMembers);

export const insertCommunityCategorySchema = createInsertSchema(communityCategories);
export const selectCommunityCategorySchema = createSelectSchema(communityCategories);

export const insertCommunityPostSchema = createInsertSchema(communityPosts);
export const selectCommunityPostSchema = createSelectSchema(communityPosts);

export const insertCommunityVoteSchema = createInsertSchema(communityVotes);
export const selectCommunityVoteSchema = createSelectSchema(communityVotes);

export const insertCommunityTagSchema = createInsertSchema(communityTags);
export const selectCommunityTagSchema = createSelectSchema(communityTags);

export const insertCommunityPostTagSchema = createInsertSchema(communityPostTags);
export const selectCommunityPostTagSchema = createSelectSchema(communityPostTags);

export const insertCommunityBookmarkSchema = createInsertSchema(communityBookmarks);
export const selectCommunityBookmarkSchema = createSelectSchema(communityBookmarks);

// ---------------------------------------------------------------------------
// TypeScript Types
// ---------------------------------------------------------------------------

export type CommunityMember = typeof communityMembers.$inferSelect;
export type InsertCommunityMember = typeof communityMembers.$inferInsert;

export type CommunityCategory = typeof communityCategories.$inferSelect;
export type InsertCommunityCategory = typeof communityCategories.$inferInsert;

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = typeof communityPosts.$inferInsert;

export type CommunityVote = typeof communityVotes.$inferSelect;
export type InsertCommunityVote = typeof communityVotes.$inferInsert;

export type CommunityTag = typeof communityTags.$inferSelect;
export type InsertCommunityTag = typeof communityTags.$inferInsert;

export type CommunityPostTag = typeof communityPostTags.$inferSelect;
export type InsertCommunityPostTag = typeof communityPostTags.$inferInsert;

export type CommunityBookmark = typeof communityBookmarks.$inferSelect;
export type InsertCommunityBookmark = typeof communityBookmarks.$inferInsert;

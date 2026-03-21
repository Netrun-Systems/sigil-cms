/**
 * Support Plugin — Drizzle table definitions
 *
 * Tables: cms_support_announcements
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { sites } from '@netrun-cms/db';

// ---------------------------------------------------------------------------
// Support Announcements — status messages, maintenance notices, info banners
// ---------------------------------------------------------------------------

export const supportAnnouncements = pgTable('cms_support_announcements', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 20 }).notNull().default('info'),
  isActive: boolean('is_active').notNull().default(true),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteActiveIdx: index('idx_cms_support_announcements_site_active').on(table.siteId, table.isActive),
  siteTypeIdx: index('idx_cms_support_announcements_site_type').on(table.siteId, table.type),
}));

// ---------------------------------------------------------------------------
// TypeScript Types
// ---------------------------------------------------------------------------

export type SupportAnnouncement = typeof supportAnnouncements.$inferSelect;
export type InsertSupportAnnouncement = typeof supportAnnouncements.$inferInsert;

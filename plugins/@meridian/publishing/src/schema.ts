/**
 * Meridian Publishing Plugin — Drizzle table definitions
 *
 * Tables: meridian_publications, meridian_flipbooks, meridian_pages,
 *         meridian_reader_sessions, meridian_page_analytics
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  index,
  check,
  real,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Publications
// ---------------------------------------------------------------------------

export const meridianPublications = pgTable('meridian_publications', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull(),
  description: text('description'),
  coverImage: text('cover_image'),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_meridian_publications_tenant').on(table.tenantId),
  slugIdx: uniqueIndex('idx_meridian_publications_slug').on(table.tenantId, table.slug),
  statusIdx: index('idx_meridian_publications_status').on(table.tenantId, table.status),
  statusCheck: check('meridian_publications_status_check',
    sql`${table.status} IN ('draft', 'published', 'archived')`
  ),
}));

// ---------------------------------------------------------------------------
// Flipbooks
// ---------------------------------------------------------------------------

export interface FlipbookSettings {
  pageFlipAnimation: 'slide' | 'flip' | 'fade';
  backgroundColor: string;
  autoPlay: boolean;
  autoPlayInterval: number;
  shareEnabled: boolean;
  downloadEnabled: boolean;
  showToolbar: boolean;
  showPageCount: boolean;
}

const defaultFlipbookSettings: FlipbookSettings = {
  pageFlipAnimation: 'flip',
  backgroundColor: '#1a1a2e',
  autoPlay: false,
  autoPlayInterval: 5000,
  shareEnabled: true,
  downloadEnabled: false,
  showToolbar: true,
  showPageCount: true,
};

export const meridianFlipbooks = pgTable('meridian_flipbooks', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  publicationId: uuid('publication_id').notNull().references(() => meridianPublications.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull(),
  pdfUrl: text('pdf_url').notNull(),
  pageCount: integer('page_count').notNull().default(0),
  settings: jsonb('settings').$type<FlipbookSettings>().default(defaultFlipbookSettings),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  publicationIdx: index('idx_meridian_flipbooks_publication').on(table.publicationId),
  tenantIdx: index('idx_meridian_flipbooks_tenant').on(table.tenantId),
}));

// ---------------------------------------------------------------------------
// Pages (individual pages extracted from PDF)
// ---------------------------------------------------------------------------

export const meridianPages = pgTable('meridian_pages', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  flipbookId: uuid('flipbook_id').notNull().references(() => meridianFlipbooks.id, { onDelete: 'cascade' }),
  pageNumber: integer('page_number').notNull(),
  imageUrl: text('image_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  textContent: text('text_content'),
}, (table) => ({
  flipbookPageIdx: uniqueIndex('idx_meridian_pages_flipbook_page').on(table.flipbookId, table.pageNumber),
  flipbookIdx: index('idx_meridian_pages_flipbook').on(table.flipbookId),
}));

// ---------------------------------------------------------------------------
// Reader Sessions (per-visit tracking)
// ---------------------------------------------------------------------------

export const meridianReaderSessions = pgTable('meridian_reader_sessions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  flipbookId: uuid('flipbook_id').notNull().references(() => meridianFlipbooks.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull(),
  sessionId: varchar('session_id', { length: 128 }).notNull(),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  pagesViewed: integer('pages_viewed').notNull().default(0),
  timeSpent: integer('time_spent').notNull().default(0),
  lastPage: integer('last_page').notNull().default(1),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
}, (table) => ({
  flipbookIdx: index('idx_meridian_sessions_flipbook').on(table.flipbookId),
  tenantIdx: index('idx_meridian_sessions_tenant').on(table.tenantId),
  sessionIdx: index('idx_meridian_sessions_session').on(table.sessionId),
  startedIdx: index('idx_meridian_sessions_started').on(table.startedAt),
}));

// ---------------------------------------------------------------------------
// Page Analytics (aggregated per-page metrics, Resonance-style)
// ---------------------------------------------------------------------------

export const meridianPageAnalytics = pgTable('meridian_page_analytics', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  flipbookId: uuid('flipbook_id').notNull().references(() => meridianFlipbooks.id, { onDelete: 'cascade' }),
  pageNumber: integer('page_number').notNull(),
  views: integer('views').notNull().default(0),
  avgTimeSeconds: real('avg_time_seconds').notNull().default(0),
  bounceCount: integer('bounce_count').notNull().default(0),
}, (table) => ({
  flipbookPageIdx: uniqueIndex('idx_meridian_analytics_flipbook_page').on(table.flipbookId, table.pageNumber),
  flipbookIdx: index('idx_meridian_analytics_flipbook').on(table.flipbookId),
}));

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

export const insertPublicationSchema = createInsertSchema(meridianPublications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(500).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export const updatePublicationSchema = insertPublicationSchema.partial().omit({
  tenantId: true,
});

export const insertFlipbookSchema = createInsertSchema(meridianFlipbooks).omit({
  id: true,
  createdAt: true,
}).extend({
  pdfUrl: z.string().url(),
  pageCount: z.number().int().min(0).default(0),
  settings: z.object({
    pageFlipAnimation: z.enum(['slide', 'flip', 'fade']).default('flip'),
    backgroundColor: z.string().default('#1a1a2e'),
    autoPlay: z.boolean().default(false),
    autoPlayInterval: z.number().int().min(1000).default(5000),
    shareEnabled: z.boolean().default(true),
    downloadEnabled: z.boolean().default(false),
    showToolbar: z.boolean().default(true),
    showPageCount: z.boolean().default(true),
  }).optional(),
});

export const flipbookSettingsSchema = z.object({
  pageFlipAnimation: z.enum(['slide', 'flip', 'fade']).optional(),
  backgroundColor: z.string().optional(),
  autoPlay: z.boolean().optional(),
  autoPlayInterval: z.number().int().min(1000).optional(),
  shareEnabled: z.boolean().optional(),
  downloadEnabled: z.boolean().optional(),
  showToolbar: z.boolean().optional(),
  showPageCount: z.boolean().optional(),
});

export const analyticsBeaconSchema = z.object({
  sessionId: z.string().min(1).max(128),
  pageNumber: z.number().int().min(1),
  timeOnPage: z.number().min(0).max(3600),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
});

export const selectPublicationSchema = createSelectSchema(meridianPublications);
export const selectFlipbookSchema = createSelectSchema(meridianFlipbooks);

// ---------------------------------------------------------------------------
// TypeScript Types
// ---------------------------------------------------------------------------

export type Publication = typeof meridianPublications.$inferSelect;
export type InsertPublication = z.infer<typeof insertPublicationSchema>;

export type Flipbook = typeof meridianFlipbooks.$inferSelect;
export type InsertFlipbook = z.infer<typeof insertFlipbookSchema>;

export type FlipbookPage = typeof meridianPages.$inferSelect;
export type ReaderSession = typeof meridianReaderSessions.$inferSelect;
export type PageAnalytic = typeof meridianPageAnalytics.$inferSelect;

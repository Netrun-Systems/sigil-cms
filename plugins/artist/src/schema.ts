/**
 * Artist Plugin — Drizzle table definitions
 *
 * Tables: cms_releases, cms_events, cms_artist_profiles
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  date,
  jsonb,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { sites } from '@netrun-cms/db';

// ---------------------------------------------------------------------------
// Releases
// ---------------------------------------------------------------------------

export const releases = pgTable('cms_releases', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).notNull().default('single'),
  releaseDate: date('release_date').notNull(),
  coverUrl: text('cover_url'),
  streamLinks: jsonb('stream_links').$type<Record<string, string>>().default({}),
  embedUrl: text('embed_url'),
  embedPlatform: varchar('embed_platform', { length: 20 }),
  description: text('description'),
  isPublished: boolean('is_published').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteIdIdx: index('idx_cms_releases_site_id').on(table.siteId),
  releaseDateIdx: index('idx_cms_releases_date').on(table.releaseDate),
  publishedIdx: index('idx_cms_releases_published').on(table.siteId, table.isPublished),
  typeCheck: check('cms_releases_type_check',
    sql`${table.type} IN ('single', 'album', 'ep', 'mixtape')`
  ),
  platformCheck: check('cms_releases_platform_check',
    sql`${table.embedPlatform} IS NULL OR ${table.embedPlatform} IN (
      'spotify', 'youtube', 'apple_music', 'soundcloud', 'bandcamp'
    )`
  ),
}));

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const events = pgTable('cms_events', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  venue: varchar('venue', { length: 255 }).notNull(),
  city: varchar('city', { length: 255 }).notNull(),
  eventDate: timestamp('event_date').notNull(),
  eventType: varchar('event_type', { length: 20 }).notNull().default('show'),
  ticketUrl: text('ticket_url'),
  description: text('description'),
  imageUrl: text('image_url'),
  isPublished: boolean('is_published').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteIdIdx: index('idx_cms_events_site_id').on(table.siteId),
  eventDateIdx: index('idx_cms_events_date').on(table.eventDate),
  publishedIdx: index('idx_cms_events_published').on(table.siteId, table.isPublished),
  typeCheck: check('cms_events_type_check',
    sql`${table.eventType} IN ('show', 'festival', 'livestream')`
  ),
}));

// ---------------------------------------------------------------------------
// Artist Profiles
// ---------------------------------------------------------------------------

export const artistProfiles = pgTable('cms_artist_profiles', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }).unique(),
  artistName: varchar('artist_name', { length: 255 }).notNull(),
  bio: text('bio').notNull().default(''),
  photoUrl: text('photo_url'),
  genres: jsonb('genres').$type<string[]>().default([]),
  socialLinks: jsonb('social_links').$type<Record<string, string>>().default({}),
  bookingEmail: varchar('booking_email', { length: 255 }),
  managementEmail: varchar('management_email', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteIdIdx: index('idx_cms_artist_profiles_site_id').on(table.siteId),
}));

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

export const insertReleaseSchema = createInsertSchema(releases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(1).max(255),
  type: z.enum(['single', 'album', 'ep', 'mixtape']).default('single'),
});
export const selectReleaseSchema = createSelectSchema(releases);

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(1).max(255),
  venue: z.string().min(1).max(255),
  city: z.string().min(1).max(255),
  eventType: z.enum(['show', 'festival', 'livestream']).default('show'),
});
export const selectEventSchema = createSelectSchema(events);

export const insertArtistProfileSchema = createInsertSchema(artistProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  artistName: z.string().min(1).max(255),
});
export const selectArtistProfileSchema = createSelectSchema(artistProfiles);

// ---------------------------------------------------------------------------
// TypeScript Types
// ---------------------------------------------------------------------------

export type Release = typeof releases.$inferSelect;
export type InsertRelease = z.infer<typeof insertReleaseSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type ArtistProfile = typeof artistProfiles.$inferSelect;
export type InsertArtistProfile = z.infer<typeof insertArtistProfileSchema>;

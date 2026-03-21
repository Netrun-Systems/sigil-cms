import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';
import { sites } from '@netrun-cms/db';

// ============================================================================
// cms_migrations — tracks migration jobs
// ============================================================================
export const migrations = pgTable('cms_migrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  source: varchar('source', { length: 20 }).notNull(), // 'wordpress', 'shopify', 'square'
  status: varchar('status', { length: 20 }).default('pending'), // pending, running, completed, failed, partial
  sourceUrl: text('source_url'),
  totalItems: integer('total_items').default(0),
  importedItems: integer('imported_items').default(0),
  failedItems: integer('failed_items').default(0),
  log: jsonb('log').$type<Array<{ timestamp: string; level: string; message: string }>>().default([]),
  config: jsonb('config').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteStatusIdx: index('idx_cms_migrations_site_status').on(table.siteId, table.status),
}));

// ============================================================================
// cms_migration_items — individual items being migrated
// ============================================================================
export const migrationItems = pgTable('cms_migration_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  migrationId: uuid('migration_id').notNull().references(() => migrations.id, { onDelete: 'cascade' }),
  sourceType: varchar('source_type', { length: 30 }).notNull(), // 'page', 'post', 'product', 'media', 'menu', 'category', 'redirect'
  sourceId: varchar('source_id', { length: 255 }),
  sourceUrl: text('source_url'),
  targetType: varchar('target_type', { length: 30 }), // 'page', 'block', 'media', 'nav'
  targetId: uuid('target_id'),
  status: varchar('status', { length: 20 }).default('pending'), // pending, imported, skipped, failed
  title: varchar('title', { length: 500 }),
  data: jsonb('data').$type<Record<string, unknown>>().default({}),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  migrationStatusIdx: index('idx_cms_migration_items_status').on(table.migrationId, table.status),
  migrationTypeIdx: index('idx_cms_migration_items_type').on(table.migrationId, table.sourceType),
}));

// Zod schemas
export const insertMigrationSchema = createInsertSchema(migrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectMigrationSchema = createSelectSchema(migrations);

export const insertMigrationItemSchema = createInsertSchema(migrationItems).omit({
  id: true,
  createdAt: true,
});

export const selectMigrationItemSchema = createSelectSchema(migrationItems);

// Types
export type Migration = typeof migrations.$inferSelect;
export type NewMigration = typeof migrations.$inferInsert;
export type MigrationItem = typeof migrationItems.$inferSelect;
export type NewMigrationItem = typeof migrationItems.$inferInsert;

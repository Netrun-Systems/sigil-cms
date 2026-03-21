/**
 * Merch Products — Drizzle table definition for Printful merch integration
 *
 * Stores synchronized product data from Printful with site-owner-set retail pricing.
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
} from 'drizzle-orm/pg-core';

export const merchProducts = pgTable('cms_merch_products', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').notNull(),
  printfulSyncProductId: integer('printful_sync_product_id').notNull(),
  printfulVariantId: integer('printful_variant_id'),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  retailPrice: integer('retail_price').notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  printfulPrice: integer('printful_price'),
  isActive: boolean('is_active').default(true).notNull(),
  variants: jsonb('variants').default([]),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

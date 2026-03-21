import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';
import { sites } from '@netrun-cms/db';

/**
 * cms_products — site-scoped product catalog synced with Stripe
 */
export const products = pgTable('cms_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  productType: varchar('product_type', { length: 20 }).default('one_time'),
  unitPrice: integer('unit_price').notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  billingInterval: varchar('billing_interval', { length: 20 }),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true),
  stripeProductId: varchar('stripe_product_id', { length: 255 }),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  metadata: jsonb('metadata').default({}),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdIdx: index('idx_cms_products_site_id').on(table.siteId),
  stripeProductIdx: index('idx_cms_products_stripe_product_id').on(table.stripeProductId),
}));

/**
 * cms_orders — tracks completed Stripe checkouts
 */
export const orders = pgTable('cms_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').references(() => sites.id, { onDelete: 'cascade' }),
  stripeSessionId: varchar('stripe_session_id', { length: 255 }).unique(),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  customerEmail: varchar('customer_email', { length: 320 }),
  customerName: varchar('customer_name', { length: 200 }),
  status: varchar('status', { length: 20 }).default('pending'),
  totalAmount: integer('total_amount').notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  lineItems: jsonb('line_items').default([]),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdIdx: index('idx_cms_orders_site_id').on(table.siteId),
  statusIdx: index('idx_cms_orders_status').on(table.status),
  sessionIdx: index('idx_cms_orders_stripe_session_id').on(table.stripeSessionId),
}));

// Zod schemas
export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);
export const insertOrderSchema = createInsertSchema(orders);
export const selectOrderSchema = createSelectSchema(orders);

// Types
export type Product = z.infer<typeof selectProductSchema>;
export type NewProduct = z.infer<typeof insertProductSchema>;
export type Order = z.infer<typeof selectOrderSchema>;
export type NewOrder = z.infer<typeof insertOrderSchema>;

/**
 * PayPal Orders Schema — cms_paypal_orders table
 *
 * Tracks PayPal order lifecycle: created -> approved -> completed/cancelled.
 * Amounts stored in cents (integer) to avoid floating-point issues.
 */

import { pgTable, uuid, varchar, integer, jsonb, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { sites } from '@netrun-cms/db';
import type { InferSelectModel } from 'drizzle-orm';

export const paypalOrders = pgTable('cms_paypal_orders', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  paypalOrderId: varchar('paypal_order_id', { length: 255 }).unique(),
  status: varchar('status', { length: 20 }).notNull().default('created'),
  customerEmail: varchar('customer_email', { length: 320 }),
  totalAmount: integer('total_amount').notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  lineItems: jsonb('line_items').notNull().default([]),
  captureId: varchar('capture_id', { length: 255 }),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteIdIdx: index('idx_cms_paypal_orders_site_id').on(table.siteId),
  paypalOrderIdIdx: index('idx_cms_paypal_orders_paypal_order_id').on(table.paypalOrderId),
  statusIdx: index('idx_cms_paypal_orders_status').on(table.siteId, table.status),
  statusCheck: check('cms_paypal_orders_status_check',
    sql`${table.status} IN ('created', 'approved', 'completed', 'cancelled')`
  ),
}));

export const insertPaypalOrderSchema = createInsertSchema(paypalOrders);
export const selectPaypalOrderSchema = createSelectSchema(paypalOrders);
export type PaypalOrder = InferSelectModel<typeof paypalOrders>;

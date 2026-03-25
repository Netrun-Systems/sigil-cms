import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';
import { sites } from '@netrun-cms/db';

/**
 * pos_sessions — Register shifts (open/close with cash reconciliation)
 */
export const posSessions = pgTable('pos_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  cashierName: varchar('cashier_name', { length: 100 }).notNull(),
  openedAt: timestamp('opened_at', { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  openingCash: numeric('opening_cash', { precision: 10, scale: 2 }).default('0'),
  closingCash: numeric('closing_cash', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 20 }).default('open'),
  notes: text('notes'),
}, (table) => ({
  siteIdIdx: index('idx_pos_sessions_site_id').on(table.siteId),
  statusIdx: index('idx_pos_sessions_status').on(table.status),
}));

/**
 * pos_transactions — Individual sales, refunds, voids
 */
export const posTransactions = pgTable('pos_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => posSessions.id),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).default('sale'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).default('0'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 4 }).default('0.0775'),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 20 }).default('card'),
  cashAmount: numeric('cash_amount', { precision: 10, scale: 2 }).default('0'),
  cardAmount: numeric('card_amount', { precision: 10, scale: 2 }).default('0'),
  changeDue: numeric('change_due', { precision: 10, scale: 2 }).default('0'),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  stripeChargeId: varchar('stripe_charge_id', { length: 255 }),
  squareCheckoutId: varchar('square_checkout_id', { length: 255 }),
  squarePaymentId: varchar('square_payment_id', { length: 255 }),
  cardBrand: varchar('card_brand', { length: 20 }),
  cardLast4: varchar('card_last4', { length: 4 }),
  receiptNumber: varchar('receipt_number', { length: 20 }).notNull(),
  customerName: varchar('customer_name', { length: 200 }),
  customerEmail: varchar('customer_email', { length: 200 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index('idx_pos_transactions_session_id').on(table.sessionId),
  siteIdIdx: index('idx_pos_transactions_site_id').on(table.siteId),
  receiptIdx: index('idx_pos_transactions_receipt').on(table.receiptNumber),
  createdAtIdx: index('idx_pos_transactions_created_at').on(table.createdAt),
}));

/**
 * pos_line_items — Individual items in a transaction
 */
export const posLineItems = pgTable('pos_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id').notNull().references(() => posTransactions.id),
  productName: varchar('product_name', { length: 200 }).notNull(),
  artistId: uuid('artist_id'),
  artistName: varchar('artist_name', { length: 200 }),
  sku: varchar('sku', { length: 50 }),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  lineTotal: numeric('line_total', { precision: 10, scale: 2 }).notNull(),
  commissionRate: numeric('commission_rate', { precision: 5, scale: 4 }),
  commissionAmount: numeric('commission_amount', { precision: 10, scale: 2 }),
  storeAmount: numeric('store_amount', { precision: 10, scale: 2 }),
}, (table) => ({
  transactionIdIdx: index('idx_pos_line_items_transaction_id').on(table.transactionId),
  artistIdIdx: index('idx_pos_line_items_artist_id').on(table.artistId),
}));

/**
 * pos_products — Quick-add products for fast checkout
 */
export const posProducts = pgTable('pos_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  sku: varchar('sku', { length: 50 }),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  category: varchar('category', { length: 100 }),
  artistId: uuid('artist_id'),
  artistName: varchar('artist_name', { length: 200 }),
  commissionRate: numeric('commission_rate', { precision: 5, scale: 4 }).default('0.60'),
  imageUrl: text('image_url'),
  barcode: varchar('barcode', { length: 50 }),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdIdx: index('idx_pos_products_site_id').on(table.siteId),
  skuIdx: index('idx_pos_products_sku').on(table.sku),
  barcodeIdx: index('idx_pos_products_barcode').on(table.barcode),
  categoryIdx: index('idx_pos_products_category').on(table.category),
}));

// Zod schemas
export const insertPosSessionSchema = createInsertSchema(posSessions);
export const selectPosSessionSchema = createSelectSchema(posSessions);
export const insertPosTransactionSchema = createInsertSchema(posTransactions);
export const selectPosTransactionSchema = createSelectSchema(posTransactions);
export const insertPosLineItemSchema = createInsertSchema(posLineItems);
export const selectPosLineItemSchema = createSelectSchema(posLineItems);
export const insertPosProductSchema = createInsertSchema(posProducts);
export const selectPosProductSchema = createSelectSchema(posProducts);

// Types
export type PosSession = z.infer<typeof selectPosSessionSchema>;
export type NewPosSession = z.infer<typeof insertPosSessionSchema>;
export type PosTransaction = z.infer<typeof selectPosTransactionSchema>;
export type NewPosTransaction = z.infer<typeof insertPosTransactionSchema>;
export type PosLineItem = z.infer<typeof selectPosLineItemSchema>;
export type NewPosLineItem = z.infer<typeof insertPosLineItemSchema>;
export type PosProduct = z.infer<typeof selectPosProductSchema>;
export type NewPosProduct = z.infer<typeof insertPosProductSchema>;

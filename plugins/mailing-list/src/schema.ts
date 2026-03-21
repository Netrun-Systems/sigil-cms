/**
 * Mailing List Schema — cms_subscribers table
 *
 * Per-site subscriber management with CAN-SPAM / GDPR
 * one-click unsubscribe token support.
 */

import { pgTable, uuid, varchar, timestamp, unique, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { sites } from '@netrun-cms/db';
import type { InferSelectModel } from 'drizzle-orm';

export const subscribers = pgTable('cms_subscribers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 320 }).notNull(),
  name: varchar('name', { length: 200 }),
  unsubscribeToken: uuid('unsubscribe_token').notNull().default(sql`gen_random_uuid()`),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  subscribedAt: timestamp('subscribed_at').notNull().defaultNow(),
  unsubscribedAt: timestamp('unsubscribed_at'),
}, (table) => ({
  siteEmailUnique: unique('cms_subscribers_site_email_unique').on(table.siteId, table.email),
  siteIdIdx: index('idx_cms_subscribers_site_id').on(table.siteId),
  statusIdx: index('idx_cms_subscribers_status').on(table.siteId, table.status),
  tokenIdx: index('idx_cms_subscribers_token').on(table.unsubscribeToken),
  statusCheck: check('cms_subscribers_status_check',
    sql`${table.status} IN ('active', 'unsubscribed')`
  ),
}));

export const insertSubscriberSchema = createInsertSchema(subscribers);
export const selectSubscriberSchema = createSelectSchema(subscribers);
export type Subscriber = InferSelectModel<typeof subscribers>;

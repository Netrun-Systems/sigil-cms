/**
 * Webhook Plugin Schema
 *
 * Tables:
 *   cms_webhook_endpoints — registered webhook URLs per site
 *   cms_webhook_deliveries — delivery log with retry tracking
 */

import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  uuid,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { sites } from '@netrun-cms/db';

// ============================================================================
// WEBHOOK ENDPOINTS — registered webhook URLs per site
// ============================================================================
export const webhookEndpoints = pgTable('cms_webhook_endpoints', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  events: jsonb('events').$type<string[]>().default(['*']),
  secret: varchar('secret', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  lastDeliveryAt: timestamp('last_delivery_at'),
  lastDeliveryStatus: integer('last_delivery_status'),
  failCount: integer('fail_count').notNull().default(0),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteIdIdx: index('idx_cms_webhook_endpoints_site_id').on(table.siteId),
  isActiveIdx: index('idx_cms_webhook_endpoints_is_active').on(table.isActive),
}));

// ============================================================================
// WEBHOOK DELIVERIES — delivery log with retry tracking
// ============================================================================
export const webhookDeliveries = pgTable('cms_webhook_deliveries', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  endpointId: uuid('endpoint_id').notNull().references(() => webhookEndpoints.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  httpStatus: integer('http_status'),
  responseBody: text('response_body'),
  attemptCount: integer('attempt_count').notNull().default(0),
  nextRetryAt: timestamp('next_retry_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  endpointCreatedIdx: index('idx_cms_webhook_deliveries_endpoint_created').on(table.endpointId, table.createdAt),
  statusRetryIdx: index('idx_cms_webhook_deliveries_status_retry').on(table.status, table.nextRetryAt),
}));

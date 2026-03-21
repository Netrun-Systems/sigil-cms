/**
 * Resonance Analytics — Drizzle ORM schema
 *
 * Four tables for block-level engagement tracking, aggregated scoring,
 * A/B experiments, and AI-generated content suggestions.
 */

import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  uuid,
  jsonb,
  date,
  index,
  unique,
} from 'drizzle-orm/pg-core';

// ============================================================================
// RAW ENGAGEMENT EVENTS
// ============================================================================

export const resonanceEvents = pgTable('cms_resonance_events', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull(),
  pageId: uuid('page_id').notNull(),
  blockId: uuid('block_id').notNull(),
  blockType: varchar('block_type', { length: 50 }).notNull(),
  eventType: varchar('event_type', { length: 30 }).notNull(),
  value: integer('value').notNull(),
  sessionHash: varchar('session_hash', { length: 64 }).notNull(),
  referrer: text('referrer'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  sitePageBlockEventIdx: index('idx_res_events_site_page_block_event')
    .on(table.siteId, table.pageId, table.blockId, table.eventType),
  siteCreatedIdx: index('idx_res_events_site_created')
    .on(table.siteId, table.createdAt),
}));

// ============================================================================
// AGGREGATED RESONANCE SCORES
// ============================================================================

export const resonanceScores = pgTable('cms_resonance_scores', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull(),
  pageId: uuid('page_id').notNull(),
  blockId: uuid('block_id').notNull(),
  blockType: varchar('block_type', { length: 50 }).notNull(),
  impressions: integer('impressions').default(0),
  uniqueSessions: integer('unique_sessions').default(0),
  avgViewportTimeMs: integer('avg_viewport_time_ms').default(0),
  avgScrollDepth: integer('avg_scroll_depth').default(0),
  clickCount: integer('click_count').default(0),
  bouncePointCount: integer('bounce_point_count').default(0),
  resonanceScore: integer('resonance_score').default(0),
  period: varchar('period', { length: 10 }).notNull(),
  periodStart: date('period_start').notNull(),
  computedAt: timestamp('computed_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  siteBlockPeriodUnique: unique('uq_res_scores_site_block_period')
    .on(table.siteId, table.blockId, table.period, table.periodStart),
  sitePagePeriodIdx: index('idx_res_scores_site_page_period')
    .on(table.siteId, table.pageId, table.period),
  resonanceScoreIdx: index('idx_res_scores_resonance_score')
    .on(table.resonanceScore),
}));

// ============================================================================
// A/B EXPERIMENTS
// ============================================================================

export const resonanceExperiments = pgTable('cms_resonance_experiments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull(),
  pageId: uuid('page_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  originalBlockId: uuid('original_block_id').notNull(),
  variantBlockId: uuid('variant_block_id').notNull(),
  trafficSplit: integer('traffic_split').default(50),
  status: varchar('status', { length: 20 }).default('draft'),
  winnerBlockId: uuid('winner_block_id'),
  winnerLift: integer('winner_lift'),
  startedAt: timestamp('started_at'),
  concludedAt: timestamp('concluded_at'),
  minSessions: integer('min_sessions').default(100),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  sitePageStatusIdx: index('idx_res_experiments_site_page_status')
    .on(table.siteId, table.pageId, table.status),
}));

// ============================================================================
// AI-GENERATED SUGGESTIONS
// ============================================================================

export const resonanceSuggestions = pgTable('cms_resonance_suggestions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull(),
  pageId: uuid('page_id').notNull(),
  blockId: uuid('block_id').notNull(),
  suggestion: text('suggestion').notNull(),
  reason: text('reason').notNull(),
  category: varchar('category', { length: 50 }),
  priority: varchar('priority', { length: 10 }).default('medium'),
  status: varchar('status', { length: 20 }).default('pending'),
  resonanceScoreBefore: integer('resonance_score_before'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  siteBlockStatusIdx: index('idx_res_suggestions_site_block_status')
    .on(table.siteId, table.blockId, table.status),
}));

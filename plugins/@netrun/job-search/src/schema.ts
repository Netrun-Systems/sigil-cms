/**
 * @netrun/job-search — Database schema
 *
 * Unified schema combining the job-search-processor pipeline models
 * and the KOG CRM job search module into a single tenant-aware schema.
 *
 * All tables are tenant-scoped via tenant_id for multi-tenant isolation.
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
  date,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';
import { tenants } from '@netrun-cms/db';

// ============================================================================
// JOB SEARCH PROFILES — Candidate profile per tenant/user
// ============================================================================

export const jobSearchProfiles = pgTable('job_search_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 320 }).notNull(),
  phone: varchar('phone', { length: 30 }),
  linkedin: text('linkedin'),
  github: text('github'),
  website: text('website'),
  currentTitle: varchar('current_title', { length: 255 }),
  currentCompany: varchar('current_company', { length: 255 }),
  yearsExperience: integer('years_experience'),
  targetRoles: jsonb('target_roles').default([]),
  targetComp: varchar('target_comp', { length: 100 }),
  location: varchar('location', { length: 255 }),
  remotePreference: varchar('remote_preference', { length: 20 }).default('hybrid'),
  resumeUrl: text('resume_url'),
  skills: jsonb('skills').default([]),
  about: text('about'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_job_search_profiles_tenant').on(table.tenantId),
  tenantUserUnique: unique('uq_job_search_profiles_tenant_user').on(table.tenantId, table.userId),
}));

// ============================================================================
// JOB SEARCH TRACKER — Pipeline of target companies/roles
// ============================================================================

export const jobSearchTracker = pgTable('job_search_tracker', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  company: varchar('company', { length: 255 }).notNull(),
  role: varchar('role', { length: 255 }).notNull(),
  jobUrl: text('job_url'),
  careerPageUrl: text('career_page_url'),
  status: varchar('status', { length: 30 }).default('research').notNull(),
  priority: varchar('priority', { length: 10 }).default('MEDIUM').notNull(),
  atsPlatform: varchar('ats_platform', { length: 50 }),
  contactName: varchar('contact_name', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 320 }),
  contactTitle: varchar('contact_title', { length: 255 }),
  source: varchar('source', { length: 30 }).default('manual'),
  notes: text('notes'),
  nextAction: text('next_action'),
  nextActionDate: date('next_action_date'),
  isArchived: boolean('is_archived').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_job_search_tracker_tenant').on(table.tenantId),
  statusIdx: index('idx_job_search_tracker_status').on(table.tenantId, table.status),
  priorityIdx: index('idx_job_search_tracker_priority').on(table.tenantId, table.priority),
  nextActionIdx: index('idx_job_search_tracker_next_action').on(table.tenantId, table.nextActionDate),
}));

// ============================================================================
// JOB SEARCH APPLICATIONS — Generated materials per tracker entry
// ============================================================================

export const jobSearchApplications = pgTable('job_search_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  trackerId: uuid('tracker_id').notNull().references(() => jobSearchTracker.id, { onDelete: 'cascade' }),
  coverLetter: text('cover_letter'),
  outreachSubject: varchar('outreach_subject', { length: 500 }),
  outreachBody: text('outreach_body'),
  jdAnalysis: jsonb('jd_analysis').default({}),
  companyResearch: jsonb('company_research').default({}),
  resumeVariant: text('resume_variant'),
  gmailDraftId: varchar('gmail_draft_id', { length: 255 }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_job_search_applications_tenant').on(table.tenantId),
  trackerIdx: index('idx_job_search_applications_tracker').on(table.trackerId),
}));

// ============================================================================
// JOB SEARCH DISCOVERIES — Evening discovery run results
// ============================================================================

export const jobSearchDiscoveries = pgTable('job_search_discoveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  runDate: date('run_date').notNull(),
  searchTerm: varchar('search_term', { length: 500 }),
  company: varchar('company', { length: 255 }).notNull(),
  role: varchar('role', { length: 255 }).notNull(),
  url: text('url'),
  compensation: varchar('compensation', { length: 200 }),
  location: varchar('location', { length: 255 }),
  priority: varchar('priority', { length: 10 }).default('MEDIUM'),
  addedToTracker: boolean('added_to_tracker').default(false),
  trackerId: uuid('tracker_id').references(() => jobSearchTracker.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_job_search_discoveries_tenant').on(table.tenantId),
  runDateIdx: index('idx_job_search_discoveries_run_date').on(table.tenantId, table.runDate),
}));

// ============================================================================
// JOB SEARCH FOLLOWUPS — Automated follow-up emails
// ============================================================================

export const jobSearchFollowups = pgTable('job_search_followups', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  applicationId: uuid('application_id').references(() => jobSearchApplications.id, { onDelete: 'cascade' }),
  trackerId: uuid('tracker_id').notNull().references(() => jobSearchTracker.id, { onDelete: 'cascade' }),
  followupNumber: integer('followup_number').notNull().default(1),
  subject: varchar('subject', { length: 500 }),
  body: text('body'),
  gmailDraftId: varchar('gmail_draft_id', { length: 255 }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_job_search_followups_tenant').on(table.tenantId),
  trackerIdx: index('idx_job_search_followups_tracker').on(table.trackerId),
}));

// ============================================================================
// JOB SEARCH RUNS — Automation run log
// ============================================================================

export const jobSearchRuns = pgTable('job_search_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  runType: varchar('run_type', { length: 20 }).notNull(),
  runDate: date('run_date').notNull(),
  status: varchar('status', { length: 20 }).default('running').notNull(),
  targetsProcessed: integer('targets_processed').default(0),
  discoveriesCount: integer('discoveries_count').default(0),
  draftsCreated: integer('drafts_created').default(0),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('idx_job_search_runs_tenant').on(table.tenantId),
  runDateIdx: index('idx_job_search_runs_date').on(table.tenantId, table.runDate),
}));

// ============================================================================
// JOB SEARCH INTERVIEWS — Interview tracking and prep
// ============================================================================

export const jobSearchInterviews = pgTable('job_search_interviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  trackerId: uuid('tracker_id').notNull().references(() => jobSearchTracker.id, { onDelete: 'cascade' }),
  interviewType: varchar('interview_type', { length: 30 }).notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  interviewerName: varchar('interviewer_name', { length: 255 }),
  interviewerTitle: varchar('interviewer_title', { length: 255 }),
  prepNotes: jsonb('prep_notes').default({}),
  outcome: varchar('outcome', { length: 30 }),
  feedback: text('feedback'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_job_search_interviews_tenant').on(table.tenantId),
  trackerIdx: index('idx_job_search_interviews_tracker').on(table.trackerId),
  scheduledIdx: index('idx_job_search_interviews_scheduled').on(table.tenantId, table.scheduledAt),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const jobSearchTrackerRelations = relations(jobSearchTracker, ({ many }) => ({
  applications: many(jobSearchApplications),
  followups: many(jobSearchFollowups),
  interviews: many(jobSearchInterviews),
  discoveries: many(jobSearchDiscoveries),
}));

export const jobSearchApplicationsRelations = relations(jobSearchApplications, ({ one, many }) => ({
  tracker: one(jobSearchTracker, {
    fields: [jobSearchApplications.trackerId],
    references: [jobSearchTracker.id],
  }),
  followups: many(jobSearchFollowups),
}));

export const jobSearchFollowupsRelations = relations(jobSearchFollowups, ({ one }) => ({
  tracker: one(jobSearchTracker, {
    fields: [jobSearchFollowups.trackerId],
    references: [jobSearchTracker.id],
  }),
  application: one(jobSearchApplications, {
    fields: [jobSearchFollowups.applicationId],
    references: [jobSearchApplications.id],
  }),
}));

export const jobSearchInterviewsRelations = relations(jobSearchInterviews, ({ one }) => ({
  tracker: one(jobSearchTracker, {
    fields: [jobSearchInterviews.trackerId],
    references: [jobSearchTracker.id],
  }),
}));

export const jobSearchDiscoveriesRelations = relations(jobSearchDiscoveries, ({ one }) => ({
  tracker: one(jobSearchTracker, {
    fields: [jobSearchDiscoveries.trackerId],
    references: [jobSearchTracker.id],
  }),
}));

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const insertProfileSchema = createInsertSchema(jobSearchProfiles);
export const selectProfileSchema = createSelectSchema(jobSearchProfiles);
export const insertTrackerSchema = createInsertSchema(jobSearchTracker);
export const selectTrackerSchema = createSelectSchema(jobSearchTracker);
export const insertApplicationSchema = createInsertSchema(jobSearchApplications);
export const selectApplicationSchema = createSelectSchema(jobSearchApplications);
export const insertDiscoverySchema = createInsertSchema(jobSearchDiscoveries);
export const selectDiscoverySchema = createSelectSchema(jobSearchDiscoveries);
export const insertFollowupSchema = createInsertSchema(jobSearchFollowups);
export const selectFollowupSchema = createSelectSchema(jobSearchFollowups);
export const insertRunSchema = createInsertSchema(jobSearchRuns);
export const selectRunSchema = createSelectSchema(jobSearchRuns);
export const insertInterviewSchema = createInsertSchema(jobSearchInterviews);
export const selectInterviewSchema = createSelectSchema(jobSearchInterviews);

// ============================================================================
// TYPES
// ============================================================================

export type JobSearchProfile = z.infer<typeof selectProfileSchema>;
export type NewJobSearchProfile = z.infer<typeof insertProfileSchema>;
export type JobSearchTrackerEntry = z.infer<typeof selectTrackerSchema>;
export type NewJobSearchTrackerEntry = z.infer<typeof insertTrackerSchema>;
export type JobSearchApplication = z.infer<typeof selectApplicationSchema>;
export type NewJobSearchApplication = z.infer<typeof insertApplicationSchema>;
export type JobSearchDiscovery = z.infer<typeof selectDiscoverySchema>;
export type NewJobSearchDiscovery = z.infer<typeof insertDiscoverySchema>;
export type JobSearchFollowup = z.infer<typeof selectFollowupSchema>;
export type NewJobSearchFollowup = z.infer<typeof insertFollowupSchema>;
export type JobSearchRun = z.infer<typeof selectRunSchema>;
export type NewJobSearchRun = z.infer<typeof insertRunSchema>;
export type JobSearchInterview = z.infer<typeof selectInterviewSchema>;
export type NewJobSearchInterview = z.infer<typeof insertInterviewSchema>;

// Status and priority enums for use in routes/UI
export const TRACKER_STATUSES = [
  'research',
  'drafted',
  'applied',
  'phone_screen',
  'technical',
  'behavioral',
  'final',
  'offer',
  'accepted',
  'rejected',
  'withdrawn',
] as const;

export const TRACKER_PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'] as const;

export const INTERVIEW_TYPES = [
  'phone',
  'technical',
  'behavioral',
  'system_design',
  'culture_fit',
  'final',
] as const;

export const RUN_TYPES = ['morning', 'evening', 'followup'] as const;

export const INTERVIEW_OUTCOMES = [
  'pending',
  'passed',
  'failed',
  'cancelled',
  'rescheduled',
] as const;

export type TrackerStatus = typeof TRACKER_STATUSES[number];
export type TrackerPriority = typeof TRACKER_PRIORITIES[number];
export type InterviewType = typeof INTERVIEW_TYPES[number];
export type RunType = typeof RUN_TYPES[number];
export type InterviewOutcome = typeof INTERVIEW_OUTCOMES[number];

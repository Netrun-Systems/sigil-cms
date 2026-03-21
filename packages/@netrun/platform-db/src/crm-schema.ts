/**
 * CRM Base Schema — tables for KOG CRM and any CRM-flavored Netrun product
 *
 * All tables are tenant-scoped via FK to platform_tenants (cms_tenants in SQL).
 * These are base tables — CRM plugins can add more via runMigration().
 */

import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  uuid,
  jsonb,
  date,
  index,
  check,
  numeric,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { platformTenants } from './platform-schema.js';

// ============================================================================
// CRM CONTACTS
// ============================================================================
export const crmContacts = pgTable('crm_contacts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull().references(() => platformTenants.id, { onDelete: 'cascade' }),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 320 }),
  phone: varchar('phone', { length: 50 }),
  company: varchar('company', { length: 200 }),
  title: varchar('title', { length: 200 }),
  status: varchar('status', { length: 30 }).notNull().default('active'),
  leadScore: integer('lead_score').notNull().default(0),
  source: varchar('source', { length: 50 }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdIdx: index('idx_crm_contacts_tenant_id').on(table.tenantId),
  emailIdx: index('idx_crm_contacts_email').on(table.tenantId, table.email),
  statusIdx: index('idx_crm_contacts_status').on(table.tenantId, table.status),
  leadScoreIdx: index('idx_crm_contacts_lead_score').on(table.tenantId, table.leadScore),
  companyIdx: index('idx_crm_contacts_company').on(table.tenantId, table.company),
  statusCheck: check('crm_contacts_status_check',
    sql`${table.status} IN ('active', 'inactive', 'lead', 'prospect', 'customer', 'churned')`
  ),
}));

// ============================================================================
// CRM ORGANIZATIONS
// ============================================================================
export const crmOrganizations = pgTable('crm_organizations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull().references(() => platformTenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  domain: varchar('domain', { length: 255 }),
  industry: varchar('industry', { length: 100 }),
  size: varchar('size', { length: 50 }),
  status: varchar('status', { length: 30 }).notNull().default('active'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdIdx: index('idx_crm_organizations_tenant_id').on(table.tenantId),
  nameIdx: index('idx_crm_organizations_name').on(table.tenantId, table.name),
  domainIdx: index('idx_crm_organizations_domain').on(table.tenantId, table.domain),
  statusIdx: index('idx_crm_organizations_status').on(table.tenantId, table.status),
  statusCheck: check('crm_organizations_status_check',
    sql`${table.status} IN ('active', 'inactive', 'prospect', 'customer', 'churned')`
  ),
}));

// ============================================================================
// CRM OPPORTUNITIES
// ============================================================================
export const crmOpportunities = pgTable('crm_opportunities', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull().references(() => platformTenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  value: numeric('value', { precision: 12, scale: 2 }),
  stage: varchar('stage', { length: 50 }).notNull().default('prospecting'),
  probability: integer('probability').notNull().default(0),
  contactId: uuid('contact_id').references(() => crmContacts.id, { onDelete: 'set null' }),
  orgId: uuid('org_id').references(() => crmOrganizations.id, { onDelete: 'set null' }),
  closeDate: date('close_date'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdIdx: index('idx_crm_opportunities_tenant_id').on(table.tenantId),
  stageIdx: index('idx_crm_opportunities_stage').on(table.tenantId, table.stage),
  contactIdIdx: index('idx_crm_opportunities_contact_id').on(table.contactId),
  orgIdIdx: index('idx_crm_opportunities_org_id').on(table.orgId),
  closeDateIdx: index('idx_crm_opportunities_close_date').on(table.closeDate),
  stageCheck: check('crm_opportunities_stage_check',
    sql`${table.stage} IN ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')`
  ),
  probabilityCheck: check('crm_opportunities_probability_check',
    sql`${table.probability} >= 0 AND ${table.probability} <= 100`
  ),
}));

// ============================================================================
// CRM ACTIVITIES
// ============================================================================
export const crmActivities = pgTable('crm_activities', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull().references(() => platformTenants.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 30 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description'),
  contactId: uuid('contact_id').references(() => crmContacts.id, { onDelete: 'set null' }),
  orgId: uuid('org_id').references(() => crmOrganizations.id, { onDelete: 'set null' }),
  opportunityId: uuid('opportunity_id').references(() => crmOpportunities.id, { onDelete: 'set null' }),
  completed: boolean('completed').notNull().default(false),
  dueDate: timestamp('due_date'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdIdx: index('idx_crm_activities_tenant_id').on(table.tenantId),
  typeIdx: index('idx_crm_activities_type').on(table.tenantId, table.type),
  contactIdIdx: index('idx_crm_activities_contact_id').on(table.contactId),
  orgIdIdx: index('idx_crm_activities_org_id').on(table.orgId),
  opportunityIdIdx: index('idx_crm_activities_opportunity_id').on(table.opportunityId),
  dueDateIdx: index('idx_crm_activities_due_date').on(table.dueDate),
  completedIdx: index('idx_crm_activities_completed').on(table.tenantId, table.completed),
  typeCheck: check('crm_activities_type_check',
    sql`${table.type} IN ('call', 'email', 'meeting', 'task', 'note', 'demo')`
  ),
}));

// ============================================================================
// CRM RELATIONS
// ============================================================================

export const crmContactsRelations = relations(crmContacts, ({ one, many }) => ({
  tenant: one(platformTenants, {
    fields: [crmContacts.tenantId],
    references: [platformTenants.id],
  }),
  opportunities: many(crmOpportunities),
  activities: many(crmActivities),
}));

export const crmOrganizationsRelations = relations(crmOrganizations, ({ one, many }) => ({
  tenant: one(platformTenants, {
    fields: [crmOrganizations.tenantId],
    references: [platformTenants.id],
  }),
  opportunities: many(crmOpportunities),
  activities: many(crmActivities),
}));

export const crmOpportunitiesRelations = relations(crmOpportunities, ({ one, many }) => ({
  tenant: one(platformTenants, {
    fields: [crmOpportunities.tenantId],
    references: [platformTenants.id],
  }),
  contact: one(crmContacts, {
    fields: [crmOpportunities.contactId],
    references: [crmContacts.id],
  }),
  organization: one(crmOrganizations, {
    fields: [crmOpportunities.orgId],
    references: [crmOrganizations.id],
  }),
  activities: many(crmActivities),
}));

export const crmActivitiesRelations = relations(crmActivities, ({ one }) => ({
  tenant: one(platformTenants, {
    fields: [crmActivities.tenantId],
    references: [platformTenants.id],
  }),
  contact: one(crmContacts, {
    fields: [crmActivities.contactId],
    references: [crmContacts.id],
  }),
  organization: one(crmOrganizations, {
    fields: [crmActivities.orgId],
    references: [crmOrganizations.id],
  }),
  opportunity: one(crmOpportunities, {
    fields: [crmActivities.opportunityId],
    references: [crmOpportunities.id],
  }),
}));

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const insertCrmContactSchema = createInsertSchema(crmContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(320).optional(),
});
export const selectCrmContactSchema = createSelectSchema(crmContacts);

export const insertCrmOrganizationSchema = createInsertSchema(crmOrganizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1).max(200),
});
export const selectCrmOrganizationSchema = createSelectSchema(crmOrganizations);

export const insertCrmOpportunitySchema = createInsertSchema(crmOpportunities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1).max(255),
  probability: z.number().min(0).max(100).optional(),
});
export const selectCrmOpportunitySchema = createSelectSchema(crmOpportunities);

export const insertCrmActivitySchema = createInsertSchema(crmActivities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  subject: z.string().min(1).max(255),
  type: z.enum(['call', 'email', 'meeting', 'task', 'note', 'demo']),
});
export const selectCrmActivitySchema = createSelectSchema(crmActivities);

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

export type CrmContact = typeof crmContacts.$inferSelect;
export type InsertCrmContact = z.infer<typeof insertCrmContactSchema>;

export type CrmOrganization = typeof crmOrganizations.$inferSelect;
export type InsertCrmOrganization = z.infer<typeof insertCrmOrganizationSchema>;

export type CrmOpportunity = typeof crmOpportunities.$inferSelect;
export type InsertCrmOpportunity = z.infer<typeof insertCrmOpportunitySchema>;

export type CrmActivity = typeof crmActivities.$inferSelect;
export type InsertCrmActivity = z.infer<typeof insertCrmActivitySchema>;

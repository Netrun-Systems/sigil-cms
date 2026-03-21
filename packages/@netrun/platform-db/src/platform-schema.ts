/**
 * Platform Schema — shared multi-tenant tables
 *
 * These tables are used by BOTH Sigil CMS and KOG CRM (and any future Netrun product).
 * The SQL table names remain `cms_*` for backward compatibility with existing databases.
 * Only the TypeScript export names are generalized to `platform*`.
 */

import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  uuid,
  jsonb,
  index,
  unique,
  check,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ============================================================================
// PLATFORM TENANTS — multi-tenant root
// ============================================================================
export const platformTenants = pgTable('cms_tenants', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  plan: varchar('plan', { length: 20 }).notNull().default('free'),
  settings: jsonb('settings').$type<Record<string, unknown>>().default({}),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  slugIdx: index('idx_cms_tenants_slug').on(table.slug),
  planIdx: index('idx_cms_tenants_plan').on(table.plan),
  planCheck: check('cms_tenants_plan_check',
    sql`${table.plan} IN ('free', 'starter', 'pro', 'business', 'enterprise')`
  ),
}));

// ============================================================================
// PLATFORM USERS — authentication & authorization
// ============================================================================
export const platformUsers = pgTable('cms_users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull().references(() => platformTenants.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  username: varchar('username', { length: 50 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('editor'),
  isActive: boolean('is_active').notNull().default(true),
  sitePermissions: jsonb('site_permissions').$type<Record<string, string[]>>().default({}),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantEmailUnique: unique('cms_users_tenant_email_unique').on(table.tenantId, table.email),
  tenantIdIdx: index('idx_cms_users_tenant_id').on(table.tenantId),
  emailIdx: index('idx_cms_users_email').on(table.email),
  roleIdx: index('idx_cms_users_role').on(table.role),
  roleCheck: check('cms_users_role_check',
    sql`${table.role} IN ('admin', 'editor', 'author', 'viewer')`
  ),
  emailFormatCheck: check('cms_users_email_format_check',
    sql`${table.email} ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'`
  ),
}));

// ============================================================================
// PLATFORM SUBSCRIPTIONS — Stripe billing
// ============================================================================
export const platformSubscriptions = pgTable('cms_subscriptions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull().references(() => platformTenants.id, { onDelete: 'cascade' }).unique(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  plan: varchar('plan', { length: 20 }).notNull().default('free'),
  billingInterval: varchar('billing_interval', { length: 10 }).default('monthly'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  trialEnd: timestamp('trial_end'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdIdx: index('idx_cms_subscriptions_tenant_id').on(table.tenantId),
  stripeCustomerIdx: index('idx_cms_subscriptions_stripe_customer').on(table.stripeCustomerId),
  stripeSubIdx: index('idx_cms_subscriptions_stripe_sub').on(table.stripeSubscriptionId),
  statusIdx: index('idx_cms_subscriptions_status').on(table.status),
  planCheck: check('cms_subscriptions_plan_check',
    sql`${table.plan} IN ('free', 'starter', 'pro', 'business', 'enterprise')`
  ),
  statusCheck: check('cms_subscriptions_status_check',
    sql`${table.status} IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete')`
  ),
  intervalCheck: check('cms_subscriptions_interval_check',
    sql`${table.billingInterval} IN ('monthly', 'yearly')`
  ),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const platformTenantsRelations = relations(platformTenants, ({ many, one }) => ({
  users: many(platformUsers),
  subscription: one(platformSubscriptions),
}));

export const platformUsersRelations = relations(platformUsers, ({ one }) => ({
  tenant: one(platformTenants, {
    fields: [platformUsers.tenantId],
    references: [platformTenants.id],
  }),
}));

export const platformSubscriptionsRelations = relations(platformSubscriptions, ({ one }) => ({
  tenant: one(platformTenants, {
    fields: [platformSubscriptions.tenantId],
    references: [platformTenants.id],
  }),
}));

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const insertPlatformTenantSchema = createInsertSchema(platformTenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectPlatformTenantSchema = createSelectSchema(platformTenants);

export const insertPlatformUserSchema = createInsertSchema(platformUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});
export const selectPlatformUserSchema = createSelectSchema(platformUsers);

export const insertPlatformSubscriptionSchema = createInsertSchema(platformSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectPlatformSubscriptionSchema = createSelectSchema(platformSubscriptions);

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

export type PlatformTenant = typeof platformTenants.$inferSelect;
export type InsertPlatformTenant = z.infer<typeof insertPlatformTenantSchema>;

export type PlatformUser = typeof platformUsers.$inferSelect;
export type InsertPlatformUser = z.infer<typeof insertPlatformUserSchema>;

export type PlatformSubscription = typeof platformSubscriptions.$inferSelect;
export type InsertPlatformSubscription = z.infer<typeof insertPlatformSubscriptionSchema>;

// ============================================================================
// BACKWARD-COMPATIBLE ALIASES
// ============================================================================
// Existing CMS code uses these names — keep them working.

/** @deprecated Use platformTenants */
export const tenants = platformTenants;
/** @deprecated Use platformUsers */
export const users = platformUsers;
/** @deprecated Use platformSubscriptions */
export const subscriptions = platformSubscriptions;

/** @deprecated Use platformTenantsRelations */
export const tenantsRelations = platformTenantsRelations;
/** @deprecated Use platformUsersRelations */
export const usersRelations = platformUsersRelations;
/** @deprecated Use platformSubscriptionsRelations */
export const subscriptionsRelations = platformSubscriptionsRelations;

/** @deprecated Use insertPlatformTenantSchema */
export const insertTenantSchema = insertPlatformTenantSchema;
/** @deprecated Use selectPlatformTenantSchema */
export const selectTenantSchema = selectPlatformTenantSchema;

/** @deprecated Use insertPlatformUserSchema */
export const insertUserSchema = insertPlatformUserSchema;
/** @deprecated Use selectPlatformUserSchema */
export const selectUserSchema = selectPlatformUserSchema;

/** @deprecated Use insertPlatformSubscriptionSchema */
export const insertSubscriptionSchema = insertPlatformSubscriptionSchema;
/** @deprecated Use selectPlatformSubscriptionSchema */
export const selectSubscriptionSchema = selectPlatformSubscriptionSchema;

/** @deprecated Use PlatformTenant */
export type Tenant = PlatformTenant;
/** @deprecated Use InsertPlatformTenant */
export type InsertTenant = InsertPlatformTenant;

/** @deprecated Use PlatformUser */
export type User = PlatformUser;
/** @deprecated Use InsertPlatformUser */
export type InsertUser = InsertPlatformUser;

/** @deprecated Use PlatformSubscription */
export type Subscription = PlatformSubscription;
/** @deprecated Use InsertPlatformSubscription */
export type InsertSubscription = InsertPlatformSubscription;

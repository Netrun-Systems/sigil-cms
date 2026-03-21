/**
 * @netrun/platform-db
 *
 * Platform database layer for Netrun Systems.
 * Contains the shared multi-tenant tables (tenants, users, subscriptions)
 * and CRM base tables (contacts, organizations, opportunities, activities).
 *
 * This is the canonical source. @netrun-cms/db re-exports platform tables from here.
 */

// Platform tables (tenants, users, subscriptions)
export * from './platform-schema.js';

// CRM base tables (contacts, organizations, opportunities, activities)
export * from './crm-schema.js';

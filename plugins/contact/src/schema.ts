/**
 * Contact Submissions — Drizzle table definition
 *
 * Mirrors the cms_contact_submissions table from @netrun-cms/db schema.
 * Plugins re-export their own table references so they don't depend
 * on the monolithic schema barrel.
 */

export { contactSubmissions } from '@netrun-cms/db';

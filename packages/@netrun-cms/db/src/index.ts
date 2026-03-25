/**
 * @netrun-cms/db - Database layer for NetrunCMS
 *
 * Exports:
 * - Schema definitions (Drizzle ORM)
 * - Zod validation schemas
 * - TypeScript types
 * - Database client utilities
 */

// Schema exports
export * from './schema';

// Client utilities
export { createDbClient, setTenantContext, clearTenantContext, type DbClient } from './client';

// Migration utilities
export { runMigrations } from './migrate';

// Seed utilities
export { seedArtistTemplate } from './seeds/artist-template';
export { seedSigilLanding } from './seeds/sigil-landing';
export {
  seedSmallBusinessTemplate,
  seedEcommerceTemplate,
  seedRestaurantTemplate,
  seedAgencyTemplate,
  seedSaasTemplate,
  seedConsultantTemplate,
  seedCommunityTemplate,
  seedPublisherTemplate,
  seedCooperativeTemplate,
} from './seeds/vertical-templates';

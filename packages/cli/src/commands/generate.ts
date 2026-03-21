/**
 * Generate Command — Auto-generate TypeScript interfaces from Sigil CMS schema
 *
 * Usage:
 *   sigil generate:types                         — writes sigil-types.ts to cwd
 *   sigil generate:types --output ./src/cms.ts   — custom output path
 */

import { Command } from "commander";
import * as fs from "node:fs";
import * as path from "node:path";
import { banner, log, info, success, error, DIM, GREEN, RESET } from "../utils";

// ---------------------------------------------------------------------------
// Type definition for the generated output
// ---------------------------------------------------------------------------

interface FieldDef {
  name: string;
  type: string;
  optional: boolean;
  doc?: string;
}

interface InterfaceDef {
  name: string;
  doc?: string;
  fields: FieldDef[];
}

// ---------------------------------------------------------------------------
// Static schema knowledge — derived from packages/@netrun-cms/db/src/schema.ts
// and apps/api/src/routes/block-types.ts. We hard-code these rather than
// importing the schema at runtime so the CLI has zero heavy dependencies.
// ---------------------------------------------------------------------------

function buildInterfaces(): InterfaceDef[] {
  const interfaces: InterfaceDef[] = [];

  // ── Tenant ──────────────────────────────────────────────────────────────

  interfaces.push({
    name: "SigilTenant",
    doc: "Multi-tenant account (cms_tenants)",
    fields: [
      { name: "id", type: "string", optional: false },
      { name: "name", type: "string", optional: false },
      { name: "slug", type: "string", optional: false },
      { name: "plan", type: "'free' | 'starter' | 'pro' | 'enterprise'", optional: false },
      { name: "settings", type: "Record<string, unknown>", optional: false },
      { name: "isActive", type: "boolean", optional: false },
      { name: "createdAt", type: "string", optional: false, doc: "ISO 8601 timestamp" },
      { name: "updatedAt", type: "string", optional: false, doc: "ISO 8601 timestamp" },
    ],
  });

  // ── Site ─────────────────────────────────────────────────────────────────

  interfaces.push({
    name: "SigilSiteSettings",
    doc: "Per-site settings stored as JSONB",
    fields: [
      { name: "favicon", type: "string", optional: true },
      { name: "logo", type: "string", optional: true },
      { name: "logoDark", type: "string", optional: true },
      { name: "socialLinks", type: "Record<string, string>", optional: true },
      { name: "analytics", type: "Record<string, string>", optional: true },
      { name: "seo", type: "Record<string, string>", optional: true },
    ],
  });

  interfaces.push({
    name: "SigilSite",
    doc: "Individual website or project (cms_sites)",
    fields: [
      { name: "id", type: "string", optional: false },
      { name: "tenantId", type: "string", optional: false },
      { name: "name", type: "string", optional: false },
      { name: "slug", type: "string", optional: false },
      { name: "domain", type: "string | null", optional: false },
      { name: "defaultLanguage", type: "string", optional: false },
      { name: "status", type: "'draft' | 'published' | 'archived'", optional: false },
      { name: "template", type: "string | null", optional: false },
      { name: "settings", type: "SigilSiteSettings", optional: false },
      { name: "createdAt", type: "string", optional: false },
      { name: "updatedAt", type: "string", optional: false },
    ],
  });

  // ── Theme ────────────────────────────────────────────────────────────────

  interfaces.push({
    name: "SigilThemeTokens",
    doc: "Theme design tokens",
    fields: [
      { name: "colors", type: "Record<string, string>", optional: false },
      { name: "typography", type: "Record<string, string | number>", optional: false },
      { name: "spacing", type: "Record<string, string>", optional: true },
      { name: "effects", type: "Record<string, string>", optional: true },
    ],
  });

  interfaces.push({
    name: "SigilTheme",
    doc: "Per-site theme customization (cms_themes)",
    fields: [
      { name: "id", type: "string", optional: false },
      { name: "siteId", type: "string", optional: false },
      { name: "name", type: "string", optional: false },
      { name: "isActive", type: "boolean", optional: false },
      { name: "baseTheme", type: "'netrun-dark' | 'netrun-light' | 'kog' | 'intirkon' | 'minimal' | 'frost' | 'custom'", optional: false },
      { name: "tokens", type: "SigilThemeTokens", optional: false },
      { name: "customCss", type: "string | null", optional: false },
      { name: "createdAt", type: "string", optional: false },
      { name: "updatedAt", type: "string", optional: false },
    ],
  });

  // ── Page ─────────────────────────────────────────────────────────────────

  interfaces.push({
    name: "SigilPage",
    doc: "Content page (cms_pages)",
    fields: [
      { name: "id", type: "string", optional: false },
      { name: "siteId", type: "string", optional: false },
      { name: "parentId", type: "string | null", optional: false },
      { name: "title", type: "string", optional: false },
      { name: "slug", type: "string", optional: false },
      { name: "fullPath", type: "string | null", optional: false },
      { name: "status", type: "'draft' | 'published' | 'scheduled' | 'archived'", optional: false },
      { name: "publishedAt", type: "string | null", optional: false, doc: "ISO 8601 timestamp" },
      { name: "publishAt", type: "string | null", optional: false, doc: "Scheduled publish time" },
      { name: "unpublishAt", type: "string | null", optional: false, doc: "Scheduled unpublish time" },
      { name: "language", type: "string", optional: false },
      { name: "metaTitle", type: "string | null", optional: false, doc: "Max 60 characters" },
      { name: "metaDescription", type: "string | null", optional: false, doc: "Max 160 characters" },
      { name: "ogImageUrl", type: "string | null", optional: false },
      { name: "template", type: "'default' | 'landing' | 'blog' | 'product' | 'contact' | 'artist'", optional: false },
      { name: "sortOrder", type: "number", optional: false },
      { name: "createdAt", type: "string", optional: false },
      { name: "updatedAt", type: "string", optional: false },
    ],
  });

  // ── Page Revision ────────────────────────────────────────────────────────

  interfaces.push({
    name: "SigilPageRevision",
    doc: "Page revision history (cms_page_revisions)",
    fields: [
      { name: "id", type: "string", optional: false },
      { name: "pageId", type: "string", optional: false },
      { name: "version", type: "number", optional: false },
      { name: "title", type: "string", optional: false },
      { name: "slug", type: "string", optional: false },
      { name: "contentSnapshot", type: "Record<string, unknown>[]", optional: false },
      { name: "settingsSnapshot", type: "Record<string, unknown>", optional: false },
      { name: "changedBy", type: "string | null", optional: false },
      { name: "changeNote", type: "string | null", optional: false },
      { name: "createdAt", type: "string", optional: false },
    ],
  });

  // ── Content Block ────────────────────────────────────────────────────────

  interfaces.push({
    name: "SigilBlockSettings",
    doc: "Visual settings for a content block",
    fields: [
      { name: "padding", type: "string", optional: true },
      { name: "margin", type: "string", optional: true },
      { name: "background", type: "string", optional: true },
      { name: "width", type: "string", optional: true },
      { name: "animation", type: "string", optional: true },
      { name: "customClass", type: "string", optional: true },
    ],
  });

  interfaces.push({
    name: "SigilContentBlock",
    doc: "Composable page content block (cms_content_blocks)",
    fields: [
      { name: "id", type: "string", optional: false },
      { name: "pageId", type: "string", optional: false },
      { name: "blockType", type: "SigilBlockType", optional: false },
      { name: "content", type: "Record<string, unknown>", optional: false },
      { name: "settings", type: "SigilBlockSettings", optional: false },
      { name: "sortOrder", type: "number", optional: false },
      { name: "isVisible", type: "boolean", optional: false },
      { name: "createdAt", type: "string", optional: false },
      { name: "updatedAt", type: "string", optional: false },
    ],
  });

  // ── Block Template ───────────────────────────────────────────────────────

  interfaces.push({
    name: "SigilBlockTemplate",
    doc: "Reusable block template (cms_block_templates)",
    fields: [
      { name: "id", type: "string", optional: false },
      { name: "siteId", type: "string | null", optional: false },
      { name: "name", type: "string", optional: false },
      { name: "blockType", type: "SigilBlockType", optional: false },
      { name: "content", type: "Record<string, unknown>", optional: false },
      { name: "settings", type: "Record<string, unknown>", optional: false },
      { name: "isGlobal", type: "boolean", optional: false },
      { name: "createdAt", type: "string", optional: false },
      { name: "updatedAt", type: "string", optional: false },
    ],
  });

  // ── Media ────────────────────────────────────────────────────────────────

  interfaces.push({
    name: "SigilMediaMetadata",
    doc: "Media file metadata (dimensions, duration, format)",
    fields: [
      { name: "width", type: "number", optional: true },
      { name: "height", type: "number", optional: true },
      { name: "duration", type: "number", optional: true },
      { name: "format", type: "string", optional: true },
    ],
  });

  interfaces.push({
    name: "SigilMedia",
    doc: "Uploaded media asset (cms_media)",
    fields: [
      { name: "id", type: "string", optional: false },
      { name: "siteId", type: "string", optional: false },
      { name: "filename", type: "string", optional: false },
      { name: "originalFilename", type: "string", optional: false },
      { name: "mimeType", type: "string", optional: false },
      { name: "fileSize", type: "number", optional: false },
      { name: "url", type: "string", optional: false },
      { name: "thumbnailUrl", type: "string | null", optional: false },
      { name: "altText", type: "string | null", optional: false },
      { name: "caption", type: "string | null", optional: false },
      { name: "folder", type: "string", optional: false },
      { name: "metadata", type: "SigilMediaMetadata", optional: false },
      { name: "createdAt", type: "string", optional: false },
      { name: "updatedAt", type: "string", optional: false },
    ],
  });

  // ── User ─────────────────────────────────────────────────────────────────

  interfaces.push({
    name: "SigilUser",
    doc: "CMS user account (cms_users)",
    fields: [
      { name: "id", type: "string", optional: false },
      { name: "tenantId", type: "string", optional: false },
      { name: "email", type: "string", optional: false },
      { name: "username", type: "string", optional: false },
      { name: "role", type: "'admin' | 'editor' | 'author' | 'viewer'", optional: false },
      { name: "isActive", type: "boolean", optional: false },
      { name: "sitePermissions", type: "Record<string, string[]>", optional: false },
      { name: "lastLogin", type: "string | null", optional: false },
      { name: "createdAt", type: "string", optional: false },
      { name: "updatedAt", type: "string", optional: false },
    ],
  });

  // ── Artist Plugin: Release ───────────────────────────────────────────────

  interfaces.push({
    name: "SigilRelease",
    doc: "Music release — album, EP, or single (cms_releases)",
    fields: [
      { name: "id", type: "string", optional: false },
      { name: "siteId", type: "string", optional: false },
      { name: "title", type: "string", optional: false },
      { name: "type", type: "'single' | 'album' | 'ep' | 'mixtape'", optional: false },
      { name: "releaseDate", type: "string", optional: false, doc: "ISO 8601 date" },
      { name: "coverUrl", type: "string | null", optional: false },
      { name: "streamLinks", type: "Record<string, string>", optional: false },
      { name: "embedUrl", type: "string | null", optional: false },
      { name: "embedPlatform", type: "'spotify' | 'youtube' | 'apple_music' | 'soundcloud' | 'bandcamp' | null", optional: false },
      { name: "description", type: "string | null", optional: false },
      { name: "isPublished", type: "boolean", optional: false },
      { name: "sortOrder", type: "number", optional: false },
      { name: "createdAt", type: "string", optional: false },
      { name: "updatedAt", type: "string", optional: false },
    ],
  });

  // ── Artist Plugin: Event ─────────────────────────────────────────────────

  interfaces.push({
    name: "SigilEvent",
    doc: "Show, festival, or livestream event (cms_events)",
    fields: [
      { name: "id", type: "string", optional: false },
      { name: "siteId", type: "string", optional: false },
      { name: "title", type: "string", optional: false },
      { name: "venue", type: "string", optional: false },
      { name: "city", type: "string", optional: false },
      { name: "eventDate", type: "string", optional: false, doc: "ISO 8601 timestamp" },
      { name: "eventType", type: "'show' | 'festival' | 'livestream'", optional: false },
      { name: "ticketUrl", type: "string | null", optional: false },
      { name: "description", type: "string | null", optional: false },
      { name: "imageUrl", type: "string | null", optional: false },
      { name: "isPublished", type: "boolean", optional: false },
      { name: "sortOrder", type: "number", optional: false },
      { name: "createdAt", type: "string", optional: false },
      { name: "updatedAt", type: "string", optional: false },
    ],
  });

  // ── Artist Plugin: Profile ───────────────────────────────────────────────

  interfaces.push({
    name: "SigilArtistProfile",
    doc: "Artist or band profile (cms_artist_profiles)",
    fields: [
      { name: "id", type: "string", optional: false },
      { name: "siteId", type: "string", optional: false },
      { name: "artistName", type: "string", optional: false },
      { name: "bio", type: "string", optional: false },
      { name: "photoUrl", type: "string | null", optional: false },
      { name: "genres", type: "string[]", optional: false },
      { name: "socialLinks", type: "Record<string, string>", optional: false },
      { name: "bookingEmail", type: "string | null", optional: false },
      { name: "managementEmail", type: "string | null", optional: false },
      { name: "createdAt", type: "string", optional: false },
      { name: "updatedAt", type: "string", optional: false },
    ],
  });

  // ── Subscriber ───────────────────────────────────────────────────────────

  interfaces.push({
    name: "SigilSubscriber",
    doc: "Mailing list subscriber (cms_subscribers)",
    fields: [
      { name: "id", type: "string", optional: false },
      { name: "siteId", type: "string", optional: false },
      { name: "email", type: "string", optional: false },
      { name: "name", type: "string | null", optional: false },
      { name: "unsubscribeToken", type: "string", optional: false },
      { name: "status", type: "'active' | 'unsubscribed'", optional: false },
      { name: "subscribedAt", type: "string", optional: false },
      { name: "unsubscribedAt", type: "string | null", optional: false },
    ],
  });

  // ── Contact Submission ───────────────────────────────────────────────────

  interfaces.push({
    name: "SigilContactSubmission",
    doc: "Contact form submission (cms_contact_submissions)",
    fields: [
      { name: "id", type: "string", optional: false },
      { name: "siteId", type: "string", optional: false },
      { name: "name", type: "string", optional: false },
      { name: "email", type: "string", optional: false },
      { name: "subject", type: "string | null", optional: false },
      { name: "message", type: "string", optional: false },
      { name: "type", type: "'general' | 'booking' | 'press' | 'collaboration'", optional: false },
      { name: "status", type: "'new' | 'responded' | 'booked' | 'declined' | 'archived'", optional: false },
      { name: "notes", type: "string | null", optional: false },
      { name: "metadata", type: "Record<string, unknown>", optional: false },
      { name: "createdAt", type: "string", optional: false },
      { name: "updatedAt", type: "string", optional: false },
    ],
  });

  // ── Store Plugin: Product ────────────────────────────────────────────────

  interfaces.push({
    name: "SigilProduct",
    doc: "Store product (cms_products) — requires store plugin",
    fields: [
      { name: "id", type: "string", optional: false },
      { name: "siteId", type: "string", optional: false },
      { name: "name", type: "string", optional: false },
      { name: "description", type: "string | null", optional: false },
      { name: "productType", type: "'one_time' | 'recurring'", optional: false },
      { name: "unitPrice", type: "number", optional: false, doc: "Price in cents" },
      { name: "currency", type: "string", optional: false },
      { name: "billingInterval", type: "string | null", optional: false },
      { name: "imageUrl", type: "string | null", optional: false },
      { name: "isActive", type: "boolean", optional: false },
      { name: "stripeProductId", type: "string | null", optional: false },
      { name: "stripePriceId", type: "string | null", optional: false },
      { name: "metadata", type: "Record<string, unknown>", optional: false },
      { name: "sortOrder", type: "number", optional: false },
      { name: "createdAt", type: "string", optional: false },
      { name: "updatedAt", type: "string", optional: false },
    ],
  });

  // ── Store Plugin: Order ──────────────────────────────────────────────────

  interfaces.push({
    name: "SigilOrder",
    doc: "Store order (cms_orders) — requires store plugin",
    fields: [
      { name: "id", type: "string", optional: false },
      { name: "siteId", type: "string | null", optional: false },
      { name: "stripeSessionId", type: "string | null", optional: false },
      { name: "stripePaymentIntentId", type: "string | null", optional: false },
      { name: "customerEmail", type: "string | null", optional: false },
      { name: "customerName", type: "string | null", optional: false },
      { name: "status", type: "'pending' | 'paid' | 'shipped' | 'completed' | 'refunded' | 'cancelled'", optional: false },
      { name: "totalAmount", type: "number", optional: false, doc: "Amount in cents" },
      { name: "currency", type: "string", optional: false },
      { name: "lineItems", type: "Record<string, unknown>[]", optional: false },
      { name: "metadata", type: "Record<string, unknown>", optional: false },
      { name: "createdAt", type: "string", optional: false },
      { name: "updatedAt", type: "string", optional: false },
    ],
  });

  // ── Booking Plugin: Service ──────────────────────────────────────────────

  interfaces.push({
    name: "SigilBookingService",
    doc: "Bookable service definition (cms_booking_services) — requires booking plugin",
    fields: [
      { name: "id", type: "string", optional: false },
      { name: "siteId", type: "string", optional: false },
      { name: "name", type: "string", optional: false },
      { name: "description", type: "string | null", optional: false },
      { name: "durationMinutes", type: "number", optional: false },
      { name: "price", type: "number | null", optional: false, doc: "Price in cents" },
      { name: "currency", type: "string", optional: false },
      { name: "color", type: "string | null", optional: false },
      { name: "isActive", type: "boolean", optional: false },
      { name: "maxDailyBookings", type: "number | null", optional: false },
      { name: "bufferMinutes", type: "number", optional: false },
      { name: "advanceNoticeHours", type: "number", optional: false },
      { name: "maxAdvanceDays", type: "number", optional: false },
      { name: "sortOrder", type: "number", optional: false },
      { name: "metadata", type: "Record<string, unknown>", optional: false },
      { name: "createdAt", type: "string", optional: false },
      { name: "updatedAt", type: "string", optional: false },
    ],
  });

  // ── Booking Plugin: Appointment ──────────────────────────────────────────

  interfaces.push({
    name: "SigilAppointment",
    doc: "Booked appointment (cms_appointments) — requires booking plugin",
    fields: [
      { name: "id", type: "string", optional: false },
      { name: "siteId", type: "string", optional: false },
      { name: "serviceId", type: "string", optional: false },
      { name: "customerName", type: "string", optional: false },
      { name: "customerEmail", type: "string", optional: false },
      { name: "customerPhone", type: "string | null", optional: false },
      { name: "appointmentDate", type: "string", optional: false, doc: "ISO 8601 date" },
      { name: "startTime", type: "string", optional: false, doc: "HH:MM format" },
      { name: "endTime", type: "string", optional: false, doc: "HH:MM format" },
      { name: "timezone", type: "string", optional: false },
      { name: "status", type: "'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'", optional: false },
      { name: "notes", type: "string | null", optional: false },
      { name: "adminNotes", type: "string | null", optional: false },
      { name: "confirmationToken", type: "string", optional: false },
      { name: "cancellationToken", type: "string", optional: false },
      { name: "googleEventId", type: "string | null", optional: false },
      { name: "reminderSent", type: "boolean", optional: false },
      { name: "metadata", type: "Record<string, unknown>", optional: false },
      { name: "createdAt", type: "string", optional: false },
      { name: "updatedAt", type: "string", optional: false },
    ],
  });

  return interfaces;
}

// ---------------------------------------------------------------------------
// Code generation
// ---------------------------------------------------------------------------

function renderInterface(def: InterfaceDef): string {
  const lines: string[] = [];

  if (def.doc) {
    lines.push(`/** ${def.doc} */`);
  }

  lines.push(`export interface ${def.name} {`);

  for (const field of def.fields) {
    if (field.doc) {
      lines.push(`  /** ${field.doc} */`);
    }
    const opt = field.optional ? "?" : "";
    lines.push(`  ${field.name}${opt}: ${field.type};`);
  }

  lines.push("}");
  return lines.join("\n");
}

function generateTypesFile(): string {
  const lines: string[] = [];

  // Header
  lines.push("/**");
  lines.push(" * Sigil CMS — Auto-generated TypeScript Types");
  lines.push(` * Generated at ${new Date().toISOString()}`);
  lines.push(" *");
  lines.push(" * DO NOT EDIT — regenerate with: sigil generate:types");
  lines.push(" */");
  lines.push("");
  lines.push("/* eslint-disable @typescript-eslint/no-empty-interface */");
  lines.push("");

  // ── Block type union ────────────────────────────────────────────────────

  lines.push("// ============================================================================");
  lines.push("// Block Types");
  lines.push("// ============================================================================");
  lines.push("");

  const coreBlockTypes = [
    "hero", "text", "rich_text", "image", "gallery", "video",
    "cta", "feature_grid", "pricing_table", "testimonial", "faq",
    "contact_form", "code_block", "bento_grid", "stats_bar", "timeline",
    "newsletter", "custom",
    "embed_player", "release_list", "event_list", "social_links",
    "link_tree", "artist_bio",
  ];

  const pluginBlockTypes = [
    "product_grid", "buy_button",
    "booking_calendar", "service_list",
  ];

  const allBlockTypes = [...coreBlockTypes, ...pluginBlockTypes];

  lines.push("/** All built-in and plugin-provided block types */");
  lines.push("export type SigilBlockType =");
  for (let i = 0; i < allBlockTypes.length; i++) {
    const isLast = i === allBlockTypes.length - 1;
    lines.push(`  | '${allBlockTypes[i]}'${isLast ? ";" : ""}`);
  }

  lines.push("");
  lines.push("/** Block type category */");
  lines.push("export type SigilBlockCategory = 'layout' | 'content' | 'media' | 'interactive' | 'artist' | 'commerce';");
  lines.push("");

  // ── Embed platform union ────────────────────────────────────────────────

  lines.push("/** Supported embed platforms */");
  lines.push("export type SigilEmbedPlatform =");
  lines.push("  | 'spotify'");
  lines.push("  | 'youtube'");
  lines.push("  | 'apple_music'");
  lines.push("  | 'soundcloud'");
  lines.push("  | 'bandcamp'");
  lines.push("  | 'twitch'");
  lines.push("  | 'tiktok'");
  lines.push("  | 'instagram'");
  lines.push("  | 'twitter';");
  lines.push("");

  // ── Entity interfaces ───────────────────────────────────────────────────

  lines.push("// ============================================================================");
  lines.push("// Core Schema Interfaces");
  lines.push("// ============================================================================");
  lines.push("");

  const interfaces = buildInterfaces();
  for (const iface of interfaces) {
    lines.push(renderInterface(iface));
    lines.push("");
  }

  // ── Composite types ─────────────────────────────────────────────────────

  lines.push("// ============================================================================");
  lines.push("// Composite Types");
  lines.push("// ============================================================================");
  lines.push("");

  lines.push("/** Page with its content blocks loaded */");
  lines.push("export interface SigilPageWithBlocks extends SigilPage {");
  lines.push("  blocks: SigilContentBlock[];");
  lines.push("}");
  lines.push("");

  lines.push("/** Site with active theme resolved */");
  lines.push("export interface SigilSiteWithTheme extends SigilSite {");
  lines.push("  activeTheme?: SigilTheme;");
  lines.push("}");
  lines.push("");

  lines.push("/** Site with artist-specific data loaded */");
  lines.push("export interface SigilSiteWithArtist extends SigilSite {");
  lines.push("  artistProfile?: SigilArtistProfile;");
  lines.push("  releases?: SigilRelease[];");
  lines.push("  events?: SigilEvent[];");
  lines.push("}");
  lines.push("");

  // ── API response wrappers ───────────────────────────────────────────────

  lines.push("// ============================================================================");
  lines.push("// API Response Wrappers");
  lines.push("// ============================================================================");
  lines.push("");

  lines.push("/** Pagination metadata returned by list endpoints */");
  lines.push("export interface SigilPaginationMeta {");
  lines.push("  total: number;");
  lines.push("  page: number;");
  lines.push("  pageSize: number;");
  lines.push("  totalPages: number;");
  lines.push("}");
  lines.push("");

  lines.push("/** Standard API success response for a single item */");
  lines.push("export interface SigilApiResponse<T> {");
  lines.push("  success: true;");
  lines.push("  data: T;");
  lines.push("}");
  lines.push("");

  lines.push("/** Standard API success response for a paginated list */");
  lines.push("export interface SigilApiListResponse<T> {");
  lines.push("  success: true;");
  lines.push("  data: T[];");
  lines.push("  meta: SigilPaginationMeta;");
  lines.push("}");
  lines.push("");

  lines.push("/** Standard API error response */");
  lines.push("export interface SigilApiError {");
  lines.push("  success: false;");
  lines.push("  error: string;");
  lines.push("  code?: string;");
  lines.push("  details?: Record<string, unknown>;");
  lines.push("}");
  lines.push("");

  // ── Block type descriptor (from /api/v1/blocks/types) ───────────────────

  lines.push("/** Block type descriptor returned by GET /api/v1/blocks/types */");
  lines.push("export interface SigilBlockTypeDescriptor {");
  lines.push("  type: SigilBlockType;");
  lines.push("  label: string;");
  lines.push("  description: string;");
  lines.push("  category: SigilBlockCategory;");
  lines.push("  icon: string;");
  lines.push("  defaultContent: Record<string, unknown>;");
  lines.push("}");
  lines.push("");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export const generateTypesCommand = new Command("generate:types")
  .description("Generate TypeScript interfaces from Sigil CMS schema")
  .option("-o, --output <path>", "Output file path", "sigil-types.ts")
  .action((opts: { output: string }) => {
    banner();

    const outputPath = path.resolve(opts.output);
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      error(`Output directory does not exist: ${outputDir}`);
      process.exit(1);
    }

    info("Reading Sigil CMS schema...");

    const content = generateTypesFile();
    fs.writeFileSync(outputPath, content, "utf-8");

    log("");
    success(`Generated ${GREEN}${outputPath}${RESET}`);
    log("");

    // Count interfaces and types
    const interfaceCount = (content.match(/^export interface /gm) || []).length;
    const typeCount = (content.match(/^export type /gm) || []).length;
    const lineCount = content.split("\n").length;

    log(`${DIM}  ${interfaceCount} interfaces, ${typeCount} type aliases, ${lineCount} lines${RESET}`);
    log("");
  });

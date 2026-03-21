/**
 * Server-side Sigil client factory for Next.js.
 *
 * Reads SIGIL_URL and SIGIL_SITE_ID from process.env automatically
 * so you can create a client with zero configuration in server components.
 *
 * @example
 * ```ts
 * import { createSigilClient } from '@sigil-cms/next';
 *
 * const sigil = createSigilClient();
 * const page = await sigil.pages.getBySlug('about');
 * ```
 */

import { createClient } from '@sigil-cms/client';
import type { SigilConfig, SigilClient } from '@sigil-cms/client';

export interface SigilNextConfig {
  /** Override the Sigil CMS URL (default: process.env.SIGIL_URL) */
  url?: string;
  /** Override the site ID (default: process.env.SIGIL_SITE_ID) */
  siteId?: string;
  /** Override the site slug (default: process.env.SIGIL_SITE_SLUG) */
  siteSlug?: string;
  /** API key for authenticated operations (default: process.env.SIGIL_API_KEY) */
  apiKey?: string;
  /** Additional client config overrides */
  clientConfig?: Partial<SigilConfig>;
}

/**
 * Create a Sigil CMS client configured for Next.js server-side usage.
 *
 * Reads environment variables automatically:
 * - `SIGIL_URL` — Base URL of your Sigil CMS instance
 * - `SIGIL_SITE_ID` — Site UUID (for authenticated operations)
 * - `SIGIL_SITE_SLUG` — Site slug (for public content fetching)
 * - `SIGIL_API_KEY` — API key or JWT (optional, for admin operations)
 *
 * All values can be overridden via the config parameter.
 */
export function createSigilClient(config?: SigilNextConfig): SigilClient {
  const baseUrl = config?.url ?? process.env.SIGIL_URL;
  if (!baseUrl) {
    throw new Error(
      '@sigil-cms/next: No CMS URL configured. ' +
      'Set the SIGIL_URL environment variable or pass { url } to createSigilClient().',
    );
  }

  const siteId = config?.siteId ?? process.env.SIGIL_SITE_ID;
  const siteSlug = config?.siteSlug ?? process.env.SIGIL_SITE_SLUG;
  const apiKey = config?.apiKey ?? process.env.SIGIL_API_KEY;

  if (!siteId && !siteSlug) {
    throw new Error(
      '@sigil-cms/next: No site configured. ' +
      'Set SIGIL_SITE_SLUG (for public content) or SIGIL_SITE_ID (for admin) environment variable, ' +
      'or pass { siteSlug } or { siteId } to createSigilClient().',
    );
  }

  return createClient({
    baseUrl,
    siteId,
    siteSlug,
    apiKey,
    ...config?.clientConfig,
  });
}

// Module-level singleton (lazy-initialized).
// Useful for cases where you want a single shared client across server components.
let _defaultClient: SigilClient | null = null;

/**
 * Get the default Sigil client singleton (lazy-initialized from env vars).
 * Useful when you want to avoid calling createSigilClient() in every file.
 *
 * @example
 * ```ts
 * import { getSigilClient } from '@sigil-cms/next';
 *
 * const page = await getSigilClient().pages.getBySlug('about');
 * ```
 */
export function getSigilClient(): SigilClient {
  if (!_defaultClient) {
    _defaultClient = createSigilClient();
  }
  return _defaultClient;
}

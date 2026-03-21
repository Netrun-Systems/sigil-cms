/**
 * @sigil-cms/client — Main SigilClient
 *
 * Usage:
 *   import { createClient } from '@sigil-cms/client';
 *   const client = createClient({ baseUrl: '...', siteSlug: 'my-site' });
 *   const page = await client.pages.getBySlug('about');
 */

import { createFetcher } from './fetcher.js';
import { PagesResource } from './resources/pages.js';
import { MediaResource } from './resources/media.js';
import { SitesResource } from './resources/sites.js';
import { BlocksResource } from './resources/blocks.js';
import { ThemesResource } from './resources/themes.js';
import type { SigilConfig } from './types.js';

export class SigilClient {
  public readonly pages: PagesResource;
  public readonly media: MediaResource;
  public readonly sites: SitesResource;
  public readonly blocks: BlocksResource;
  public readonly themes: ThemesResource;

  private readonly fetcher: ReturnType<typeof createFetcher>;
  private readonly config: SigilConfig;

  constructor(config: SigilConfig) {
    if (!config.baseUrl) {
      throw new Error('@sigil-cms/client: baseUrl is required');
    }

    this.config = { ...config };
    this.fetcher = createFetcher(this.config);

    this.pages = new PagesResource(this.fetcher, this.config);
    this.media = new MediaResource(this.fetcher, this.config);
    this.sites = new SitesResource(this.fetcher, this.config);
    this.blocks = new BlocksResource(this.fetcher, this.config);
    this.themes = new ThemesResource(this.fetcher, this.config);
  }

  /**
   * Full-text search across the site (delegates to the public search endpoint).
   * Falls back to listing published pages filtered client-side if no search
   * endpoint is available.
   */
  async search(query: string): Promise<Array<{ id: string; title: string; slug: string; excerpt?: string }>> {
    if (!this.config.siteSlug) {
      throw new Error('@sigil-cms/client: siteSlug is required for search');
    }

    // Sigil does not yet have a dedicated search endpoint.
    // For now, fetch published pages and filter client-side.
    // This will be replaced with a server-side search endpoint in a future release.
    const pages = await this.pages.listPublished();
    const q = query.toLowerCase();
    return pages
      .filter((p) => {
        const haystack = `${p.title} ${p.slug} ${p.metaDescription ?? ''}`.toLowerCase();
        return haystack.includes(q);
      })
      .map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.metaDescription ?? undefined,
      }));
  }
}

/**
 * Create a new Sigil CMS client.
 *
 * @example
 * ```ts
 * // Public content fetching (no auth)
 * const client = createClient({
 *   baseUrl: 'https://cms.example.com',
 *   siteSlug: 'my-site',
 * });
 *
 * const page = await client.pages.getBySlug('about');
 *
 * // Authenticated admin operations
 * const admin = createClient({
 *   baseUrl: 'https://cms.example.com',
 *   siteId: '550e8400-e29b-41d4-a716-446655440000',
 *   apiKey: 'your-jwt-token',
 * });
 *
 * const pages = await admin.pages.list({ status: 'draft' });
 * ```
 */
export function createClient(config: SigilConfig): SigilClient {
  return new SigilClient(config);
}

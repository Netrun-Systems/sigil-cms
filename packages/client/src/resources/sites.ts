/**
 * Sites resource — site CRUD and domain operations
 */

import type { createFetcher } from '../fetcher.js';
import type {
  ApiResponse,
  ApiListResponse,
  Site,
  PublicSiteInfo,
  LanguagesResponse,
  Theme,
  PaginatedResponse,
  PaginationParams,
  SigilConfig,
  SiteStatus,
} from '../types.js';

export class SitesResource {
  constructor(
    private readonly fetcher: ReturnType<typeof createFetcher>,
    private readonly config: SigilConfig,
  ) {}

  // ---- Authenticated endpoints ----

  /** List all sites for the current tenant */
  async list(params: PaginationParams & { status?: SiteStatus } = {}): Promise<PaginatedResponse<Site>> {
    const res = await this.fetcher.request<ApiListResponse<Site>>(
      '/api/v1/sites',
      {
        params: {
          page: params.page,
          limit: params.limit,
          status: params.status,
        },
      },
    );

    const page = params.page ?? 1;
    const pageSize = res.meta?.limit ?? params.limit ?? 20;
    const total = res.meta?.total ?? res.data.length;
    return {
      data: res.data,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  /** Get a single site by ID */
  async get(id?: string): Promise<Site> {
    const siteId = id ?? this.config.siteId;
    if (!siteId) {
      throw new Error('@sigil-cms/client: siteId is required — pass as argument or set in config');
    }
    const res = await this.fetcher.request<ApiResponse<Site>>(
      `/api/v1/sites/${siteId}`,
    );
    return res.data;
  }

  /** Create a new site */
  async create(data: {
    name: string;
    slug: string;
    domain?: string;
    defaultLanguage?: string;
    status?: SiteStatus;
    settings?: Record<string, unknown>;
  }): Promise<Site> {
    const res = await this.fetcher.request<ApiResponse<Site>>(
      '/api/v1/sites',
      { method: 'POST', body: data },
    );
    return res.data;
  }

  /** Update an existing site */
  async update(id: string, data: Partial<{
    name: string;
    slug: string;
    domain: string;
    defaultLanguage: string;
    status: SiteStatus;
    settings: Record<string, unknown>;
  }>): Promise<Site> {
    const res = await this.fetcher.request<ApiResponse<Site>>(
      `/api/v1/sites/${id}`,
      { method: 'PUT', body: data },
    );
    return res.data;
  }

  /** Delete a site and all associated data */
  async delete(id: string): Promise<void> {
    await this.fetcher.request<void>(
      `/api/v1/sites/${id}`,
      { method: 'DELETE' },
    );
  }

  /** Set or update custom domain */
  async updateDomain(id: string, domain: string): Promise<Site> {
    const res = await this.fetcher.request<ApiResponse<Site>>(
      `/api/v1/sites/${id}/domain`,
      { method: 'PUT', body: { domain } },
    );
    return res.data;
  }

  /** Remove custom domain */
  async removeDomain(id: string): Promise<Site> {
    const res = await this.fetcher.request<ApiResponse<Site>>(
      `/api/v1/sites/${id}/domain`,
      { method: 'DELETE' },
    );
    return res.data;
  }

  /** Verify DNS configuration for custom domain */
  async verifyDomain(id: string): Promise<{ verified: boolean; details?: string }> {
    const res = await this.fetcher.request<ApiResponse<{ verified: boolean; details?: string }>>(
      `/api/v1/sites/${id}/domain/verify`,
    );
    return res.data;
  }

  // ---- Public endpoints ----

  /** Resolve a site by its custom domain (public, no auth) */
  async getByDomain(domain: string): Promise<PublicSiteInfo> {
    const res = await this.fetcher.request<ApiResponse<PublicSiteInfo>>(
      `/api/v1/public/sites/by-domain/${encodeURIComponent(domain)}`,
    );
    return res.data;
  }

  /** Get available languages for a site (public, no auth) */
  async getLanguages(siteSlug?: string): Promise<LanguagesResponse> {
    const slug = siteSlug ?? this.config.siteSlug;
    if (!slug) {
      throw new Error('@sigil-cms/client: siteSlug is required for language listing');
    }
    const res = await this.fetcher.request<ApiResponse<LanguagesResponse>>(
      `/api/v1/public/sites/${slug}/languages`,
    );
    return res.data;
  }

  /** Get active theme for a site (public, no auth) */
  async getPublicTheme(siteSlug?: string): Promise<Theme | null> {
    const slug = siteSlug ?? this.config.siteSlug;
    if (!slug) {
      throw new Error('@sigil-cms/client: siteSlug is required for public theme lookup');
    }
    const res = await this.fetcher.request<ApiResponse<Theme | null>>(
      `/api/v1/public/sites/${slug}/theme`,
    );
    return res.data;
  }
}

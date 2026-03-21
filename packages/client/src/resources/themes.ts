/**
 * Themes resource — theme CRUD and activation
 */

import type { createFetcher } from '../fetcher.js';
import type {
  ApiResponse,
  ApiListResponse,
  Theme,
  ThemeListParams,
  ThemeTokens,
  PaginatedResponse,
  SigilConfig,
} from '../types.js';

export class ThemesResource {
  constructor(
    private readonly fetcher: ReturnType<typeof createFetcher>,
    private readonly config: SigilConfig,
  ) {}

  /** List themes for the configured site */
  async list(params: ThemeListParams = {}): Promise<PaginatedResponse<Theme>> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiListResponse<Theme>>(
      `/api/v1/sites/${this.config.siteId}/themes`,
      {
        params: {
          page: params.page,
          limit: params.limit,
          baseTheme: params.baseTheme,
          isActive: params.isActive !== undefined ? String(params.isActive) : undefined,
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

  /** Get the currently active theme */
  async getActive(): Promise<Theme> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiResponse<Theme>>(
      `/api/v1/sites/${this.config.siteId}/themes/active`,
    );
    return res.data;
  }

  /** Get a single theme by ID */
  async get(id: string): Promise<Theme> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiResponse<Theme>>(
      `/api/v1/sites/${this.config.siteId}/themes/${id}`,
    );
    return res.data;
  }

  /** Create a new theme */
  async create(data: {
    name: string;
    baseTheme?: string;
    isActive?: boolean;
    tokens: ThemeTokens;
    customCss?: string;
  }): Promise<Theme> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiResponse<Theme>>(
      `/api/v1/sites/${this.config.siteId}/themes`,
      { method: 'POST', body: data },
    );
    return res.data;
  }

  /** Update an existing theme */
  async update(id: string, data: Partial<{
    name: string;
    baseTheme: string;
    isActive: boolean;
    tokens: ThemeTokens;
    customCss: string;
  }>): Promise<Theme> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiResponse<Theme>>(
      `/api/v1/sites/${this.config.siteId}/themes/${id}`,
      { method: 'PUT', body: data },
    );
    return res.data;
  }

  /** Activate a theme (deactivates all others) */
  async activate(id: string): Promise<Theme> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiResponse<Theme>>(
      `/api/v1/sites/${this.config.siteId}/themes/${id}/activate`,
      { method: 'POST' },
    );
    return res.data;
  }

  /** Duplicate a theme */
  async duplicate(id: string, name?: string): Promise<Theme> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiResponse<Theme>>(
      `/api/v1/sites/${this.config.siteId}/themes/${id}/duplicate`,
      { method: 'POST', body: name ? { name } : {} },
    );
    return res.data;
  }

  /** Delete a theme (cannot delete active theme) */
  async delete(id: string): Promise<void> {
    this.requireSiteId();
    await this.fetcher.request<void>(
      `/api/v1/sites/${this.config.siteId}/themes/${id}`,
      { method: 'DELETE' },
    );
  }

  private requireSiteId(): void {
    if (!this.config.siteId) {
      throw new Error('@sigil-cms/client: siteId is required for theme operations');
    }
  }
}

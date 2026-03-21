/**
 * Blocks resource — content block operations
 */

import type { createFetcher } from '../fetcher.js';
import type {
  ApiResponse,
  ApiListResponse,
  ContentBlock,
  BlockListParams,
  PaginatedResponse,
  SigilConfig,
  BlockType,
  BlockTypeDescriptor,
  BlockTypeListParams,
} from '../types.js';

export class BlocksResource {
  constructor(
    private readonly fetcher: ReturnType<typeof createFetcher>,
    private readonly config: SigilConfig,
  ) {}

  /** List blocks for a page */
  async list(pageId: string, params: BlockListParams = {}): Promise<PaginatedResponse<ContentBlock>> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiListResponse<ContentBlock>>(
      `/api/v1/sites/${this.config.siteId}/pages/${pageId}/blocks`,
      {
        params: {
          page: params.page,
          limit: params.limit,
          blockType: params.blockType,
          isVisible: params.isVisible !== undefined ? String(params.isVisible) : undefined,
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

  /** Get a single block by ID */
  async get(pageId: string, blockId: string): Promise<ContentBlock> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiResponse<ContentBlock>>(
      `/api/v1/sites/${this.config.siteId}/pages/${pageId}/blocks/${blockId}`,
    );
    return res.data;
  }

  /** Create a new content block */
  async create(pageId: string, data: {
    blockType: BlockType;
    content?: Record<string, unknown>;
    settings?: Record<string, unknown>;
    sortOrder?: number;
    isVisible?: boolean;
  }): Promise<ContentBlock> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiResponse<ContentBlock>>(
      `/api/v1/sites/${this.config.siteId}/pages/${pageId}/blocks`,
      { method: 'POST', body: data },
    );
    return res.data;
  }

  /** Update an existing block */
  async update(pageId: string, blockId: string, data: Partial<{
    blockType: BlockType;
    content: Record<string, unknown>;
    settings: Record<string, unknown>;
    sortOrder: number;
    isVisible: boolean;
  }>): Promise<ContentBlock> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiResponse<ContentBlock>>(
      `/api/v1/sites/${this.config.siteId}/pages/${pageId}/blocks/${blockId}`,
      { method: 'PUT', body: data },
    );
    return res.data;
  }

  /** Delete a block */
  async delete(pageId: string, blockId: string): Promise<void> {
    this.requireSiteId();
    await this.fetcher.request<void>(
      `/api/v1/sites/${this.config.siteId}/pages/${pageId}/blocks/${blockId}`,
      { method: 'DELETE' },
    );
  }

  /** Reorder blocks within a page */
  async reorder(pageId: string, blockIds: string[]): Promise<void> {
    this.requireSiteId();
    await this.fetcher.request<ApiResponse<void>>(
      `/api/v1/sites/${this.config.siteId}/pages/${pageId}/blocks/reorder`,
      { method: 'PUT', body: { blockIds } },
    );
  }

  /** Get the catalog of available block types */
  async listTypes(params: BlockTypeListParams = {}): Promise<BlockTypeDescriptor[]> {
    const res = await this.fetcher.request<ApiResponse<BlockTypeDescriptor[]> & { meta?: { total: number } }>(
      '/api/v1/blocks/types',
      { params: { category: params.category } },
    );
    return res.data;
  }

  private requireSiteId(): void {
    if (!this.config.siteId) {
      throw new Error('@sigil-cms/client: siteId is required for block operations');
    }
  }
}

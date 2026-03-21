/**
 * Media resource — media library operations
 */

import type { createFetcher } from '../fetcher.js';
import type {
  ApiResponse,
  ApiListResponse,
  MediaItem,
  MediaFolder,
  MediaListParams,
  PaginatedResponse,
  SigilConfig,
} from '../types.js';

export class MediaResource {
  constructor(
    private readonly fetcher: ReturnType<typeof createFetcher>,
    private readonly config: SigilConfig,
  ) {}

  /** List media items for the configured site */
  async list(params: MediaListParams = {}): Promise<PaginatedResponse<MediaItem>> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiListResponse<MediaItem>>(
      `/api/v1/sites/${this.config.siteId}/media`,
      {
        params: {
          page: params.page,
          limit: params.limit,
          folder: params.folder,
          mimeType: params.mimeType,
          search: params.search,
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

  /** Get a single media item by ID */
  async get(id: string): Promise<MediaItem> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiResponse<MediaItem>>(
      `/api/v1/sites/${this.config.siteId}/media/${id}`,
    );
    return res.data;
  }

  /** Create a media record (metadata only — no file upload) */
  async create(data: {
    filename: string;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
    url: string;
    thumbnailUrl?: string;
    altText?: string;
    caption?: string;
    folder?: string;
    metadata?: Record<string, unknown>;
  }): Promise<MediaItem> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiResponse<MediaItem>>(
      `/api/v1/sites/${this.config.siteId}/media`,
      { method: 'POST', body: data },
    );
    return res.data;
  }

  /** Update media metadata */
  async update(id: string, data: Partial<{
    altText: string;
    caption: string;
    folder: string;
    metadata: Record<string, unknown>;
  }>): Promise<MediaItem> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiResponse<MediaItem>>(
      `/api/v1/sites/${this.config.siteId}/media/${id}`,
      { method: 'PUT', body: data },
    );
    return res.data;
  }

  /** Delete a media item */
  async delete(id: string): Promise<void> {
    this.requireSiteId();
    await this.fetcher.request<void>(
      `/api/v1/sites/${this.config.siteId}/media/${id}`,
      { method: 'DELETE' },
    );
  }

  /** List all folders in the media library with file counts */
  async listFolders(): Promise<MediaFolder[]> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiResponse<MediaFolder[]>>(
      `/api/v1/sites/${this.config.siteId}/media/folders`,
    );
    return res.data;
  }

  private requireSiteId(): void {
    if (!this.config.siteId) {
      throw new Error('@sigil-cms/client: siteId is required for media operations');
    }
  }
}

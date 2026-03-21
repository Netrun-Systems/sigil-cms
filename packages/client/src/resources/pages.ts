/**
 * Pages resource — authenticated and public page operations
 */

import type { createFetcher } from '../fetcher.js';
import type {
  ApiResponse,
  ApiListResponse,
  Page,
  PageWithBlocks,
  PageListParams,
  PaginatedResponse,
  PublicPageInfo,
  PageTreeNode,
  NavigationItem,
  PageRevision,
  SigilConfig,
} from '../types.js';

export class PagesResource {
  constructor(
    private readonly fetcher: ReturnType<typeof createFetcher>,
    private readonly config: SigilConfig,
  ) {}

  // ---- Authenticated endpoints (require siteId + apiKey) ----

  /** List pages for the configured site (authenticated) */
  async list(params: PageListParams = {}): Promise<PaginatedResponse<Page>> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiListResponse<Page>>(
      `/api/v1/sites/${this.config.siteId}/pages`,
      {
        params: {
          page: params.page,
          limit: params.limit,
          status: params.status,
          language: params.language,
          parentId: params.parentId,
        },
      },
    );

    return toPaginated(res, params);
  }

  /** Get a single page by ID (authenticated) */
  async get(id: string, options?: { includeBlocks?: boolean }): Promise<Page | PageWithBlocks> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiResponse<Page | PageWithBlocks>>(
      `/api/v1/sites/${this.config.siteId}/pages/${id}`,
      {
        params: {
          includeBlocks: options?.includeBlocks ? 'true' : undefined,
        },
      },
    );
    return res.data;
  }

  /** Get a page by ID with all its content blocks (authenticated) */
  async getWithBlocks(id: string): Promise<PageWithBlocks> {
    return this.get(id, { includeBlocks: true }) as Promise<PageWithBlocks>;
  }

  /** Create a new page (authenticated) */
  async create(data: {
    title: string;
    slug: string;
    parentId?: string;
    status?: Page['status'];
    language?: string;
    metaTitle?: string;
    metaDescription?: string;
    ogImageUrl?: string;
    template?: Page['template'];
    sortOrder?: number;
  }): Promise<Page> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiResponse<Page>>(
      `/api/v1/sites/${this.config.siteId}/pages`,
      { method: 'POST', body: data },
    );
    return res.data;
  }

  /** Update an existing page (authenticated) */
  async update(id: string, data: Partial<{
    title: string;
    slug: string;
    parentId: string | null;
    status: Page['status'];
    language: string;
    metaTitle: string;
    metaDescription: string;
    ogImageUrl: string;
    template: Page['template'];
    sortOrder: number;
  }>): Promise<Page> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiResponse<Page>>(
      `/api/v1/sites/${this.config.siteId}/pages/${id}`,
      { method: 'PUT', body: data },
    );
    return res.data;
  }

  /** Delete a page (authenticated) */
  async delete(id: string): Promise<void> {
    this.requireSiteId();
    await this.fetcher.request<void>(
      `/api/v1/sites/${this.config.siteId}/pages/${id}`,
      { method: 'DELETE' },
    );
  }

  /** List translations for a page (authenticated) */
  async listTranslations(id: string): Promise<Page[]> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiResponse<Page[]>>(
      `/api/v1/sites/${this.config.siteId}/pages/${id}/translations`,
    );
    return res.data;
  }

  /** Create a translation of a page (authenticated) */
  async createTranslation(id: string, language: string): Promise<Page> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiResponse<Page>>(
      `/api/v1/sites/${this.config.siteId}/pages/${id}/translate`,
      { method: 'POST', body: { language } },
    );
    return res.data;
  }

  /** List revisions for a page (authenticated) */
  async listRevisions(pageId: string): Promise<PageRevision[]> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiResponse<PageRevision[]>>(
      `/api/v1/sites/${this.config.siteId}/pages/${pageId}/revisions`,
    );
    return res.data;
  }

  /** Get a specific revision (authenticated) */
  async getRevision(pageId: string, revisionId: string): Promise<PageRevision> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiResponse<PageRevision>>(
      `/api/v1/sites/${this.config.siteId}/pages/${pageId}/revisions/${revisionId}`,
    );
    return res.data;
  }

  /** Revert a page to a specific revision (authenticated) */
  async revertToRevision(pageId: string, revisionId: string): Promise<Page> {
    this.requireSiteId();
    const res = await this.fetcher.request<ApiResponse<Page>>(
      `/api/v1/sites/${this.config.siteId}/pages/${pageId}/revisions/${revisionId}/revert`,
      { method: 'POST' },
    );
    return res.data;
  }

  // ---- Public endpoints (require siteSlug, no auth) ----

  /**
   * Get a published page by slug (public, no auth required).
   * Uses the siteSlug from config.
   */
  async getBySlug(slug: string, options?: { lang?: string }): Promise<PageWithBlocks> {
    this.requireSiteSlug();
    const res = await this.fetcher.request<ApiResponse<PageWithBlocks>>(
      `/api/v1/public/sites/${this.config.siteSlug}/pages/${slug}`,
      { params: { lang: options?.lang } },
    );
    return res.data;
  }

  /**
   * List all published pages for navigation (public, no auth required).
   * Uses the siteSlug from config.
   */
  async listPublished(): Promise<PublicPageInfo[]> {
    this.requireSiteSlug();
    const res = await this.fetcher.request<ApiResponse<PublicPageInfo[]>>(
      `/api/v1/public/sites/${this.config.siteSlug}/pages`,
    );
    return res.data;
  }

  /**
   * Build a hierarchical page tree from published pages (public).
   * Organizes flat page list into parent-child relationships.
   */
  async getTree(): Promise<PageTreeNode[]> {
    const pages = await this.listPublished();
    return buildTree(pages);
  }

  /**
   * Get navigation items — same as getTree but with a slimmer interface.
   */
  async getNavigation(): Promise<NavigationItem[]> {
    const tree = await this.getTree();
    return tree.map(toNavItem);
  }

  // ---- Helpers ----

  private requireSiteId(): void {
    if (!this.config.siteId) {
      throw new Error('@sigil-cms/client: siteId is required for authenticated page operations');
    }
  }

  private requireSiteSlug(): void {
    if (!this.config.siteSlug) {
      throw new Error('@sigil-cms/client: siteSlug is required for public page operations');
    }
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function toPaginated<T>(res: ApiListResponse<T>, params: PageListParams): PaginatedResponse<T> {
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

function buildTree(pages: PublicPageInfo[]): PageTreeNode[] {
  // Public endpoint doesn't include parentId directly, but fullPath reveals hierarchy.
  // Root pages have fullPath like "/slug", children have "/parent/child".
  const nodeMap = new Map<string, PageTreeNode>();
  const roots: PageTreeNode[] = [];

  // Sort by sortOrder first
  const sorted = [...pages].sort((a, b) => a.sortOrder - b.sortOrder);

  for (const page of sorted) {
    const node: PageTreeNode = { ...page, children: [] };
    nodeMap.set(page.slug, node);
  }

  for (const page of sorted) {
    const path = page.fullPath ?? `/${page.slug}`;
    const segments = path.split('/').filter(Boolean);

    if (segments.length <= 1) {
      roots.push(nodeMap.get(page.slug)!);
    } else {
      const parentSlug = segments[segments.length - 2];
      const parent = nodeMap.get(parentSlug);
      if (parent) {
        parent.children.push(nodeMap.get(page.slug)!);
      } else {
        // Orphan — attach to root
        roots.push(nodeMap.get(page.slug)!);
      }
    }
  }

  return roots;
}

function toNavItem(node: PageTreeNode): NavigationItem {
  return {
    id: node.id,
    title: node.title,
    slug: node.slug,
    fullPath: node.fullPath,
    sortOrder: node.sortOrder,
    children: node.children.map(toNavItem),
  };
}

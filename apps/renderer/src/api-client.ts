/**
 * Sigil API Client
 *
 * Fetches content from the Sigil CMS API public endpoints.
 * All responses follow { success: boolean, data: T } shape.
 */

const API_BASE = process.env.API_URL || 'http://localhost:3001/api/v1/public';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

interface PageData {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  fullPath?: string;
  status: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  template: string;
  sortOrder: number;
  blocks: BlockData[];
}

interface BlockData {
  id: string;
  blockType: string;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  sortOrder: number;
  isVisible: boolean;
}

interface ThemeData {
  id: string;
  name: string;
  isActive: boolean;
  baseTheme: string;
  tokens: {
    colors: Record<string, string>;
    typography: Record<string, string | number>;
    spacing?: Record<string, string>;
    effects?: Record<string, string>;
  };
  customCss?: string;
}

export type { PageData, BlockData, ThemeData };

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      console.error(`API ${res.status}: ${url}`);
      return null;
    }

    const json = (await res.json()) as ApiResponse<T>;
    if (!json.success) {
      console.error(`API error: ${json.error?.message || 'Unknown'}`);
      return null;
    }

    return json.data;
  } catch (err) {
    console.error(`API fetch failed for ${path}:`, err);
    return null;
  }
}

/**
 * Fetch a single published page with its content blocks.
 */
export async function fetchPage(siteSlug: string, pageSlug: string): Promise<PageData | null> {
  return apiFetch<PageData>(`/sites/${siteSlug}/pages/${pageSlug}`);
}

/**
 * Fetch the active theme for a site.
 */
export async function fetchTheme(siteSlug: string): Promise<ThemeData | null> {
  return apiFetch<ThemeData>(`/sites/${siteSlug}/theme`);
}

/**
 * Fetch all published pages for navigation.
 * Falls back to an empty array if the endpoint is unavailable.
 */
export async function fetchSitePages(siteSlug: string): Promise<PageData[]> {
  const result = await apiFetch<PageData[]>(`/sites/${siteSlug}/pages`);
  return result || [];
}

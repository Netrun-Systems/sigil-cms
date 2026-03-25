/**
 * stock-image-api.ts
 *
 * API client functions for Unsplash, Pexels, and Pixabay.
 * Each function normalizes responses to the shared StockImage type.
 * Missing API keys are handled gracefully — functions return empty arrays
 * and log a console warning rather than throwing.
 */

export interface StockImage {
  /** Full-resolution URL */
  url: string;
  /** Thumbnail URL for grid display */
  thumbnailUrl: string;
  width: number;
  height: number;
  photographer: string;
  photographerUrl: string;
  source: 'unsplash' | 'pexels' | 'pixabay';
  alt: string;
  /** Link back to the original image on its platform */
  sourceUrl: string;
}

// ---------------------------------------------------------------------------
// Unsplash
// ---------------------------------------------------------------------------

interface UnsplashPhoto {
  id: string;
  description: string | null;
  alt_description: string | null;
  width: number;
  height: number;
  urls: {
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: { html: string };
  user: { name: string; links: { html: string } };
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
  total_pages: number;
}

export async function searchUnsplash(
  query: string,
  page: number,
  perPage: number
): Promise<StockImage[]> {
  const key = import.meta.env.VITE_UNSPLASH_KEY as string | undefined;

  if (!key) {
    // Fall back to the Unsplash Source CDN (no key required).
    // We synthesise a fixed-size result set so the UI has something to show.
    const count = Math.min(perPage, 12);
    return Array.from({ length: count }, (_, i) => {
      const seed = encodeURIComponent(query) + (page * count + i);
      const url = `https://source.unsplash.com/800x600?${encodeURIComponent(query)}&sig=${seed}`;
      return {
        url,
        thumbnailUrl: `https://source.unsplash.com/400x300?${encodeURIComponent(query)}&sig=${seed}`,
        width: 800,
        height: 600,
        photographer: 'Unsplash',
        photographerUrl: 'https://unsplash.com',
        source: 'unsplash' as const,
        alt: query,
        sourceUrl: 'https://unsplash.com',
      };
    });
  }

  try {
    const params = new URLSearchParams({
      query,
      page: String(page),
      per_page: String(perPage),
    });
    const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
      headers: { Authorization: `Client-ID ${key}` },
    });

    if (!res.ok) {
      console.warn('[StockImages] Unsplash API error', res.status);
      return [];
    }

    const data: UnsplashSearchResponse = await res.json();

    return data.results.map((photo) => ({
      url: photo.urls.full,
      thumbnailUrl: photo.urls.small,
      width: photo.width,
      height: photo.height,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      source: 'unsplash' as const,
      alt: photo.alt_description || photo.description || query,
      sourceUrl: photo.links.html,
    }));
  } catch (err) {
    console.warn('[StockImages] Unsplash fetch failed', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Pexels
// ---------------------------------------------------------------------------

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  alt: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    tiny: string;
  };
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[];
  total_results: number;
  next_page?: string;
}

export async function searchPexels(
  query: string,
  page: number,
  perPage: number
): Promise<StockImage[]> {
  const key = import.meta.env.VITE_PEXELS_KEY as string | undefined;
  if (!key) return [];

  try {
    const params = new URLSearchParams({
      query,
      page: String(page),
      per_page: String(perPage),
    });
    const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
      headers: { Authorization: key },
    });

    if (!res.ok) {
      console.warn('[StockImages] Pexels API error', res.status);
      return [];
    }

    const data: PexelsSearchResponse = await res.json();

    return data.photos.map((photo) => ({
      url: photo.src.original,
      thumbnailUrl: photo.src.medium,
      width: photo.width,
      height: photo.height,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      source: 'pexels' as const,
      alt: photo.alt || query,
      sourceUrl: photo.url,
    }));
  } catch (err) {
    console.warn('[StockImages] Pexels fetch failed', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Pixabay
// ---------------------------------------------------------------------------

interface PixabayHit {
  id: number;
  pageURL: string;
  webformatWidth: number;
  webformatHeight: number;
  webformatURL: string;
  largeImageURL: string;
  previewURL: string;
  user: string;
  userImageURL: string;
  tags: string;
}

interface PixabaySearchResponse {
  hits: PixabayHit[];
  totalHits: number;
}

export async function searchPixabay(
  query: string,
  page: number,
  perPage: number
): Promise<StockImage[]> {
  const key = import.meta.env.VITE_PIXABAY_KEY as string | undefined;
  if (!key) return [];

  try {
    const params = new URLSearchParams({
      key,
      q: query,
      page: String(page),
      per_page: String(perPage),
      image_type: 'photo',
      safesearch: 'true',
    });
    const res = await fetch(`https://api.pixabay.com/api/?${params}`);

    if (!res.ok) {
      console.warn('[StockImages] Pixabay API error', res.status);
      return [];
    }

    const data: PixabaySearchResponse = await res.json();

    return data.hits.map((hit) => ({
      url: hit.largeImageURL,
      thumbnailUrl: hit.webformatURL,
      width: hit.webformatWidth,
      height: hit.webformatHeight,
      photographer: hit.user,
      photographerUrl: `https://pixabay.com/users/${hit.user}/`,
      source: 'pixabay' as const,
      alt: hit.tags || query,
      sourceUrl: hit.pageURL,
    }));
  } catch (err) {
    console.warn('[StockImages] Pixabay fetch failed', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Vertical suggestions
// ---------------------------------------------------------------------------

export const verticalSuggestions: Record<string, string[]> = {
  restaurant: ['restaurant interior', 'food plating', 'chef cooking', 'wine glasses', 'cafe atmosphere'],
  agency: ['modern office', 'team collaboration', 'design workspace', 'whiteboard planning', 'laptop workspace'],
  saas: ['dashboard interface', 'cloud computing', 'data visualization', 'coding', 'server room'],
  ecommerce: ['shopping bags', 'product display', 'packaging', 'retail store', 'delivery'],
  artist: ['concert stage', 'music studio', 'vinyl records', 'guitar closeup', 'live performance'],
  community: ['people gathering', 'conference', 'workshop', 'hands together', 'discussion group'],
  consultant: ['business meeting', 'presentation', 'handshake', 'office view', 'strategy planning'],
  publisher: ['bookshelf', 'printing press', 'newspaper', 'reading corner', 'library'],
  cooperative: ['farmers market', 'artisan workshop', 'handmade crafts', 'local shop', 'community garden'],
  small_business: ['storefront', 'small shop', 'entrepreneur', 'customer service', 'local business'],
};

/** Returns true when an API key is configured for the given source. */
export function isSourceConfigured(source: 'unsplash' | 'pexels' | 'pixabay'): boolean {
  if (source === 'unsplash') return true; // CDN fallback always works
  if (source === 'pexels') return !!import.meta.env.VITE_PEXELS_KEY;
  if (source === 'pixabay') return !!import.meta.env.VITE_PIXABAY_KEY;
  return false;
}

/**
 * stock-image-api.ts
 *
 * API client functions for Unsplash, Pexels, and Pixabay.
 * Each function normalizes responses to the shared StockImage type.
 * Missing API keys are handled gracefully — functions return empty arrays
 * and log a console warning rather than throwing.
 */
export async function searchUnsplash(query, page, perPage) {
    const key = import.meta.env.VITE_UNSPLASH_KEY;
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
                source: 'unsplash',
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
        const data = await res.json();
        return data.results.map((photo) => ({
            url: photo.urls.full,
            thumbnailUrl: photo.urls.small,
            width: photo.width,
            height: photo.height,
            photographer: photo.user.name,
            photographerUrl: photo.user.links.html,
            source: 'unsplash',
            alt: photo.alt_description || photo.description || query,
            sourceUrl: photo.links.html,
        }));
    }
    catch (err) {
        console.warn('[StockImages] Unsplash fetch failed', err);
        return [];
    }
}
export async function searchPexels(query, page, perPage) {
    const key = import.meta.env.VITE_PEXELS_KEY;
    if (!key)
        return [];
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
        const data = await res.json();
        return data.photos.map((photo) => ({
            url: photo.src.original,
            thumbnailUrl: photo.src.medium,
            width: photo.width,
            height: photo.height,
            photographer: photo.photographer,
            photographerUrl: photo.photographer_url,
            source: 'pexels',
            alt: photo.alt || query,
            sourceUrl: photo.url,
        }));
    }
    catch (err) {
        console.warn('[StockImages] Pexels fetch failed', err);
        return [];
    }
}
export async function searchPixabay(query, page, perPage) {
    const key = import.meta.env.VITE_PIXABAY_KEY;
    if (!key)
        return [];
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
        const data = await res.json();
        return data.hits.map((hit) => ({
            url: hit.largeImageURL,
            thumbnailUrl: hit.webformatURL,
            width: hit.webformatWidth,
            height: hit.webformatHeight,
            photographer: hit.user,
            photographerUrl: `https://pixabay.com/users/${hit.user}/`,
            source: 'pixabay',
            alt: hit.tags || query,
            sourceUrl: hit.pageURL,
        }));
    }
    catch (err) {
        console.warn('[StockImages] Pixabay fetch failed', err);
        return [];
    }
}
// ---------------------------------------------------------------------------
// Vertical suggestions
// ---------------------------------------------------------------------------
export const verticalSuggestions = {
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
export function isSourceConfigured(source) {
    if (source === 'unsplash')
        return true; // CDN fallback always works
    if (source === 'pexels')
        return !!import.meta.env.VITE_PEXELS_KEY;
    if (source === 'pixabay')
        return !!import.meta.env.VITE_PIXABAY_KEY;
    return false;
}
//# sourceMappingURL=stock-image-api.js.map
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
export declare function searchUnsplash(query: string, page: number, perPage: number): Promise<StockImage[]>;
export declare function searchPexels(query: string, page: number, perPage: number): Promise<StockImage[]>;
export declare function searchPixabay(query: string, page: number, perPage: number): Promise<StockImage[]>;
export declare const verticalSuggestions: Record<string, string[]>;
/** Returns true when an API key is configured for the given source. */
export declare function isSourceConfigured(source: 'unsplash' | 'pexels' | 'pixabay'): boolean;
//# sourceMappingURL=stock-image-api.d.ts.map
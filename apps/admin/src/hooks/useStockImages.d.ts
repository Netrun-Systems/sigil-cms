/**
 * useStockImages — hook for searching stock images across Unsplash, Pexels,
 * and Pixabay.
 *
 * Mirrors the admin's existing data-fetching pattern: useState + useEffect,
 * no external query library required.
 *
 * Features:
 * - Debounced search (300 ms)
 * - Pagination via page number
 * - Results cached in memory keyed by (query, source, page) for the lifetime
 *   of the component so repeated "Load More" calls do not refetch.
 * - Graceful handling of unconfigured API keys
 */
import { type StockImage } from '../lib/stock-image-api';
export type StockImageSource = 'all' | 'unsplash' | 'pexels' | 'pixabay';
interface UseStockImagesResult {
    images: StockImage[];
    isLoading: boolean;
    error: string | null;
    hasMore: boolean;
    loadMore: () => void;
}
export declare function useStockImages(query: string, source: StockImageSource): UseStockImagesResult;
export {};
//# sourceMappingURL=useStockImages.d.ts.map
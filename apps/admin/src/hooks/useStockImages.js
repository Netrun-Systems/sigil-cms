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
import { useState, useEffect, useRef, useCallback } from 'react';
import { searchUnsplash, searchPexels, searchPixabay, } from '../lib/stock-image-api';
const PER_PAGE = 15;
const DEBOUNCE_MS = 300;
// Simple in-memory request cache keyed by `query|source|page`.
const cache = new Map();
async function fetchPage(query, source, page) {
    const cacheKey = `${query}|${source}|${page}`;
    if (cache.has(cacheKey))
        return cache.get(cacheKey);
    let results = [];
    if (source === 'all') {
        const [unsplash, pexels, pixabay] = await Promise.all([
            searchUnsplash(query, page, PER_PAGE),
            searchPexels(query, page, PER_PAGE),
            searchPixabay(query, page, PER_PAGE),
        ]);
        // Interleave results so the grid shows variety.
        const max = Math.max(unsplash.length, pexels.length, pixabay.length);
        for (let i = 0; i < max; i++) {
            if (unsplash[i])
                results.push(unsplash[i]);
            if (pexels[i])
                results.push(pexels[i]);
            if (pixabay[i])
                results.push(pixabay[i]);
        }
    }
    else if (source === 'unsplash') {
        results = await searchUnsplash(query, page, PER_PAGE);
    }
    else if (source === 'pexels') {
        results = await searchPexels(query, page, PER_PAGE);
    }
    else if (source === 'pixabay') {
        results = await searchPixabay(query, page, PER_PAGE);
    }
    cache.set(cacheKey, results);
    return results;
}
export function useStockImages(query, source) {
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    // Track the debounced query separately so page resets on query/source change.
    const [debouncedQuery, setDebouncedQuery] = useState(query);
    const debounceTimer = useRef(null);
    useEffect(() => {
        if (debounceTimer.current)
            clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setDebouncedQuery(query);
            setPage(1);
            setImages([]);
            setHasMore(true);
        }, DEBOUNCE_MS);
        return () => {
            if (debounceTimer.current)
                clearTimeout(debounceTimer.current);
        };
    }, [query]);
    // Also reset when source changes.
    useEffect(() => {
        setPage(1);
        setImages([]);
        setHasMore(true);
    }, [source]);
    // Fetch current page whenever debouncedQuery, source, or page changes.
    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setImages([]);
            setIsLoading(false);
            return;
        }
        let cancelled = false;
        setIsLoading(true);
        setError(null);
        fetchPage(debouncedQuery, source, page)
            .then((results) => {
            if (cancelled)
                return;
            setImages((prev) => (page === 1 ? results : [...prev, ...results]));
            setHasMore(results.length >= PER_PAGE);
        })
            .catch((err) => {
            if (cancelled)
                return;
            setError(err instanceof Error ? err.message : 'Search failed');
        })
            .finally(() => {
            if (!cancelled)
                setIsLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [debouncedQuery, source, page]);
    const loadMore = useCallback(() => {
        if (!isLoading && hasMore)
            setPage((p) => p + 1);
    }, [isLoading, hasMore]);
    return { images, isLoading, error, hasMore, loadMore };
}
//# sourceMappingURL=useStockImages.js.map
/**
 * API Response Cache
 *
 * In-memory LRU cache with TTL support, ETag generation, and
 * pattern-based invalidation. Used by public routes to avoid
 * redundant database queries for published content.
 *
 * Singleton instances are exported for different cache tiers:
 * - pageCache:  page content + blocks (2000 entries)
 * - themeCache: theme tokens (200 entries)
 * - navCache:   navigation lists (200 entries)
 * - siteCache:  site lookups by slug/domain (500 entries)
 */

import { createHash } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

export interface CacheEntry<T> {
  data: T;
  etag: string;
  expiresAt: number;
  createdAt: number;
}

export class ResponseCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private maxSize: number;
  private _hits = 0;
  private _misses = 0;

  constructor(maxSize = 5000) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.store.get(key);
    if (!entry) {
      this._misses++;
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this._misses++;
      return null;
    }
    this._hits++;
    return entry as CacheEntry<T>;
  }

  set<T>(key: string, data: T, ttlSeconds: number): CacheEntry<T> {
    // Add jitter to prevent cache stampede (up to 10% of TTL)
    const jitter = Math.random() * ttlSeconds * 0.1;
    const effectiveTtl = ttlSeconds + jitter;

    // LRU eviction — remove oldest entry when at capacity
    if (this.store.size >= this.maxSize) {
      const oldest = this.store.keys().next().value;
      if (oldest) this.store.delete(oldest);
    }

    const etag = createHash('sha1')
      .update(JSON.stringify(data))
      .digest('hex')
      .slice(0, 16);

    const entry: CacheEntry<T> = {
      data,
      etag,
      expiresAt: Date.now() + effectiveTtl * 1000,
      createdAt: Date.now(),
    };

    this.store.set(key, entry);
    return entry;
  }

  /**
   * Invalidate all keys matching a prefix pattern.
   * Returns the number of entries removed.
   */
  invalidate(pattern: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(pattern)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  purge(): void {
    this.store.clear();
    this._hits = 0;
    this._misses = 0;
  }

  stats(): { size: number; maxSize: number; hitRate: number } {
    const total = this._hits + this._misses;
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      hitRate: total > 0 ? this._hits / total : 0,
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton instances for different cache tiers
// ---------------------------------------------------------------------------

const PAGE_TTL = parseInt(process.env.CACHE_PAGE_TTL || '300', 10);     // 5 min
const THEME_TTL = parseInt(process.env.CACHE_THEME_TTL || '300', 10);   // 5 min
const NAV_TTL = parseInt(process.env.CACHE_NAV_TTL || '300', 10);       // 5 min
const SITE_TTL = parseInt(process.env.CACHE_SITE_TTL || '300', 10);     // 5 min

export const pageCache = new ResponseCache(2000);
export const themeCache = new ResponseCache(200);
export const navCache = new ResponseCache(200);
export const siteCache = new ResponseCache(500);

export { PAGE_TTL, THEME_TTL, NAV_TTL, SITE_TTL };

// ---------------------------------------------------------------------------
// Cache stats (aggregated)
// ---------------------------------------------------------------------------

export function cacheStats() {
  return {
    pages: pageCache.stats(),
    themes: themeCache.stats(),
    nav: navCache.stats(),
    sites: siteCache.stats(),
  };
}

// ---------------------------------------------------------------------------
// Cache purge handler — POST /api/v1/cache/purge (admin only)
// ---------------------------------------------------------------------------

export function cachePurgeHandler(req: Request, res: Response): void {
  const { scope } = req.body as { scope?: string };

  switch (scope) {
    case 'pages':
      pageCache.purge();
      break;
    case 'themes':
      themeCache.purge();
      break;
    case 'nav':
      navCache.purge();
      break;
    case 'sites':
      siteCache.purge();
      break;
    case 'all':
    default:
      pageCache.purge();
      themeCache.purge();
      navCache.purge();
      siteCache.purge();
      break;
  }

  res.json({ success: true, message: 'Cache purged', scope: scope || 'all' });
}

// ---------------------------------------------------------------------------
// Cache stats handler — GET /api/v1/cache/stats
// ---------------------------------------------------------------------------

export function cacheStatsHandler(_req: Request, res: Response): void {
  res.json({ success: true, data: cacheStats() });
}

// ---------------------------------------------------------------------------
// Cache invalidation middleware for mutation routes
//
// Attach AFTER the controller responds so the cache is cleared
// only on successful mutations (2xx status).
// ---------------------------------------------------------------------------

export function invalidatePageCache(req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);
  res.json = function (body: unknown) {
    // Invalidate after successful mutation
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const siteId = req.params.siteId;
      if (siteId) {
        pageCache.invalidate(`page:${siteId}:`);
        navCache.invalidate(`nav:${siteId}`);
      }
    }
    return originalJson(body);
  };
  next();
}

export function invalidateThemeCache(req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);
  res.json = function (body: unknown) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const siteId = req.params.siteId;
      if (siteId) {
        themeCache.invalidate(`theme:${siteId}`);
      }
    }
    return originalJson(body);
  };
  next();
}

/**
 * usePluginManifest — Fetches and caches the plugin manifest from the server.
 *
 * Endpoint: GET /api/v1/plugins/manifest
 * Returns the full plugin manifest describing nav items, routes, and block types.
 */

import { useState, useEffect, useRef } from 'react';
import type { PluginManifest } from '../types.js';

export interface UsePluginManifestOptions {
  apiBaseUrl?: string;
  token?: string | null;
}

export interface UsePluginManifestReturn {
  manifest: PluginManifest | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const cache = new Map<string, PluginManifest>();

export function usePluginManifest({
  apiBaseUrl = '',
  token,
}: UsePluginManifestOptions): UsePluginManifestReturn {
  const [manifest, setManifest] = useState<PluginManifest | null>(
    () => cache.get(apiBaseUrl) ?? null,
  );
  const [loading, setLoading] = useState(!cache.has(apiBaseUrl));
  const [error, setError] = useState<string | null>(null);
  const fetchId = useRef(0);

  function doFetch() {
    const id = ++fetchId.current;
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`${apiBaseUrl}/api/v1/plugins/manifest`, { headers })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Manifest fetch failed (${res.status})`);
        return res.json() as Promise<PluginManifest>;
      })
      .then((data) => {
        if (id !== fetchId.current) return; // stale
        cache.set(apiBaseUrl, data);
        setManifest(data);
        setLoading(false);
      })
      .catch((err) => {
        if (id !== fetchId.current) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
  }

  useEffect(() => {
    doFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseUrl, token]);

  return { manifest, loading, error, refetch: doFetch };
}

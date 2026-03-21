/**
 * usePluginManifest — Fetches the plugin manifest from the API
 *
 * The manifest describes which plugins are loaded, their nav sections,
 * routes, and block types. Used by Sidebar and PluginRoutes.
 */

import { useState, useEffect } from 'react';

export interface PluginManifestEntry {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  nav: Array<{
    title: string;
    siteScoped: boolean;
    items: Array<{ label: string; icon: string; href: string }>;
  }>;
  routes: Array<{ path: string; component: string }>;
  blockTypes: Array<{ type: string; label: string; category?: string }>;
}

export interface PluginManifest {
  plugins: PluginManifestEntry[];
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let cachedManifest: PluginManifest | null = null;
let fetchPromise: Promise<PluginManifest> | null = null;

async function fetchManifest(): Promise<PluginManifest> {
  if (cachedManifest) return cachedManifest;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch(`${API_BASE}/api/v1/plugins/manifest`)
    .then((res) => res.json())
    .then((data) => {
      cachedManifest = data.data as PluginManifest;
      return cachedManifest;
    })
    .catch(() => {
      // If manifest fetch fails, return empty — plugins just won't show
      cachedManifest = { plugins: [] };
      return cachedManifest;
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
}

export function usePluginManifest() {
  const [manifest, setManifest] = useState<PluginManifest | null>(cachedManifest);
  const [loading, setLoading] = useState(!cachedManifest);

  useEffect(() => {
    if (cachedManifest) {
      setManifest(cachedManifest);
      setLoading(false);
      return;
    }

    fetchManifest().then((m) => {
      setManifest(m);
      setLoading(false);
    });
  }, []);

  return { manifest, loading };
}

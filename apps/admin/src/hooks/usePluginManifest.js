/**
 * usePluginManifest — Fetches the plugin manifest from the API
 *
 * The manifest describes which plugins are loaded, their nav sections,
 * routes, and block types. Used by Sidebar and PluginRoutes.
 */
import { useState, useEffect } from 'react';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
let cachedManifest = null;
let fetchPromise = null;
async function fetchManifest() {
    if (cachedManifest)
        return cachedManifest;
    if (fetchPromise)
        return fetchPromise;
    fetchPromise = fetch(`${API_BASE}/api/v1/plugins/manifest`)
        .then((res) => res.json())
        .then((data) => {
        cachedManifest = data.data;
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
    const [manifest, setManifest] = useState(cachedManifest);
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
//# sourceMappingURL=usePluginManifest.js.map
/**
 * usePluginManifest — Fetches the plugin manifest from the API
 *
 * The manifest describes which plugins are loaded, their nav sections,
 * routes, and block types. Used by Sidebar and PluginRoutes.
 */
export interface PluginManifestEntry {
    id: string;
    name: string;
    version: string;
    enabled: boolean;
    nav: Array<{
        title: string;
        siteScoped: boolean;
        items: Array<{
            label: string;
            icon: string;
            href: string;
        }>;
    }>;
    routes: Array<{
        path: string;
        component: string;
    }>;
    blockTypes: Array<{
        type: string;
        label: string;
        category?: string;
    }>;
}
export interface PluginManifest {
    plugins: PluginManifestEntry[];
}
export declare function usePluginManifest(): {
    manifest: PluginManifest | null;
    loading: boolean;
};
//# sourceMappingURL=usePluginManifest.d.ts.map
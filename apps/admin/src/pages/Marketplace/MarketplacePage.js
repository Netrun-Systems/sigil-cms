import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * MarketplacePage — Plugin marketplace browser and installer
 *
 * Features:
 * - Grid of plugin cards (icon, name, description, category, rating, downloads)
 * - Category filter tabs: All, Content, Commerce, Analytics, Integration, Utility
 * - Search bar
 * - Featured plugins section
 * - Plugin detail view with README and install button
 * - Installed plugins tab with enable/disable toggle and uninstall
 */
import { useState, useEffect, useCallback } from 'react';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const CATEGORIES = [
    { value: 'all', label: 'All' },
    { value: 'content', label: 'Content' },
    { value: 'commerce', label: 'Commerce' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'integration', label: 'Integration' },
    { value: 'utility', label: 'Utility' },
];
const CATEGORY_COLORS = {
    content: 'bg-blue-100 text-blue-700',
    commerce: 'bg-green-100 text-green-700',
    analytics: 'bg-purple-100 text-purple-700',
    integration: 'bg-orange-100 text-orange-700',
    utility: 'bg-gray-200 text-gray-700',
};
// ── Star Rating Component ────────────────────────────────────────────────────
function StarRating({ rating }) {
    return (_jsx("span", { className: "inline-flex gap-0.5", title: `${rating}/5`, children: [1, 2, 3, 4, 5].map((star) => (_jsx("svg", { className: `w-3.5 h-3.5 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'}`, viewBox: "0 0 20 20", children: _jsx("path", { d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" }) }, star))) }));
}
// ── Plugin Card ──────────────────────────────────────────────────────────────
function PluginCard({ plugin, isInstalled, onInstall, onViewDetails, installing, }) {
    const categoryColor = CATEGORY_COLORS[plugin.category || ''] || CATEGORY_COLORS.utility;
    return (_jsxs("div", { className: "bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer flex flex-col", onClick: () => onViewDetails(plugin), children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-lg font-semibold", children: plugin.name.charAt(0) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-800 text-sm leading-tight", children: plugin.name }), plugin.author && (_jsx("p", { className: "text-xs text-gray-600 mt-0.5", children: plugin.author }))] })] }), plugin.is_verified && (_jsx("span", { className: "text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium", children: "Verified" }))] }), _jsx("p", { className: "text-sm text-gray-600 mb-3 flex-1 line-clamp-2", children: plugin.description || 'No description available.' }), _jsxs("div", { className: "flex items-center gap-2 mb-3 flex-wrap", children: [plugin.category && (_jsx("span", { className: `text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor}`, children: plugin.category })), plugin.is_featured && (_jsx("span", { className: "text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-medium", children: "Featured" }))] }), _jsxs("div", { className: "flex items-center justify-between pt-3 border-t border-gray-100", children: [_jsxs("div", { className: "flex items-center gap-3 text-xs text-gray-600", children: [_jsx(StarRating, { rating: plugin.rating }), _jsxs("span", { children: [plugin.downloads.toLocaleString(), " installs"] })] }), _jsx("button", { onClick: (e) => {
                            e.stopPropagation();
                            if (!isInstalled)
                                onInstall(plugin.plugin_id);
                        }, disabled: isInstalled || installing === plugin.plugin_id, className: `text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${isInstalled
                            ? 'bg-gray-100 text-gray-600 cursor-default'
                            : installing === plugin.plugin_id
                                ? 'bg-gray-200 text-gray-600 cursor-wait'
                                : 'bg-[#90b9ab] text-white hover:bg-[#7ea99b]'}`, children: isInstalled ? 'Installed' : installing === plugin.plugin_id ? 'Installing...' : 'Install' })] })] }));
}
// ── Installed Plugin Row ─────────────────────────────────────────────────────
function InstalledPluginRow({ plugin, onToggle, onUninstall, }) {
    const categoryColor = CATEGORY_COLORS[plugin.category || ''] || CATEGORY_COLORS.utility;
    return (_jsxs("div", { className: "bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-lg font-semibold shrink-0", children: plugin.name.charAt(0) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "font-semibold text-gray-800 text-sm", children: plugin.name }), _jsxs("span", { className: "text-xs text-gray-600", children: ["v", plugin.version] }), plugin.category && (_jsx("span", { className: `text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor}`, children: plugin.category })), plugin.is_verified && (_jsx("span", { className: "text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium", children: "Verified" }))] }), plugin.description && (_jsx("p", { className: "text-xs text-gray-600 mt-1 truncate", children: plugin.description })), _jsxs("p", { className: "text-xs text-gray-600 mt-1", children: ["Installed ", new Date(plugin.installed_at).toLocaleDateString(), " via ", plugin.source] })] }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [_jsx("button", { onClick: () => onToggle(plugin.id), className: `text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${plugin.is_enabled
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`, children: plugin.is_enabled ? 'Enabled' : 'Disabled' }), _jsx("button", { onClick: () => onUninstall(plugin.id), className: "text-xs px-3 py-1.5 rounded-md font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors", children: "Uninstall" })] })] }));
}
// ── Plugin Detail Modal ──────────────────────────────────────────────────────
function PluginDetailView({ plugin, isInstalled, onInstall, onClose, installing, }) {
    const categoryColor = CATEGORY_COLORS[plugin.category || ''] || CATEGORY_COLORS.utility;
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", onClick: onClose, children: _jsxs("div", { className: "bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "p-6 border-b border-gray-200", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 text-2xl font-semibold", children: plugin.name.charAt(0) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-gray-800", children: plugin.name }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [plugin.author && _jsx("span", { className: "text-sm text-gray-600", children: plugin.author }), _jsxs("span", { className: "text-sm text-gray-600", children: ["v", plugin.version] })] })] })] }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600 text-xl leading-none p-1", children: "x" })] }), _jsxs("div", { className: "flex items-center gap-2 mt-4 flex-wrap", children: [plugin.category && (_jsx("span", { className: `text-xs px-2.5 py-1 rounded-full font-medium ${categoryColor}`, children: plugin.category })), plugin.is_featured && (_jsx("span", { className: "text-xs bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full font-medium", children: "Featured" })), plugin.is_verified && (_jsx("span", { className: "text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium", children: "Verified" })), _jsxs("span", { className: "text-xs text-gray-600", children: [plugin.downloads.toLocaleString(), " installs"] }), _jsx(StarRating, { rating: plugin.rating })] }), _jsx("div", { className: "mt-4 flex gap-3", children: _jsx("button", { onClick: () => { if (!isInstalled)
                                    onInstall(plugin.plugin_id); }, disabled: isInstalled || installing === plugin.plugin_id, className: `px-5 py-2 rounded-lg font-medium text-sm transition-colors ${isInstalled
                                    ? 'bg-gray-100 text-gray-600 cursor-default'
                                    : installing === plugin.plugin_id
                                        ? 'bg-gray-200 text-gray-600 cursor-wait'
                                        : 'bg-[#90b9ab] text-white hover:bg-[#7ea99b]'}`, children: isInstalled ? 'Already Installed' : installing === plugin.plugin_id ? 'Installing...' : 'Install Plugin' }) })] }), _jsxs("div", { className: "p-6", children: [_jsx("p", { className: "text-gray-700 mb-4", children: plugin.description || 'No description available.' }), plugin.required_env && plugin.required_env.length > 0 && (_jsxs("div", { className: "mb-4", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-800 mb-2", children: "Required Environment Variables" }), _jsx("div", { className: "flex flex-wrap gap-2", children: plugin.required_env.map((env) => (_jsx("code", { className: "text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono", children: env }, env))) })] })), plugin.tags && plugin.tags.length > 0 && (_jsxs("div", { className: "mb-4", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-800 mb-2", children: "Tags" }), _jsx("div", { className: "flex flex-wrap gap-1.5", children: plugin.tags.map((tag) => (_jsx("span", { className: "text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full", children: tag }, tag))) })] })), plugin.readme && (_jsxs("div", { className: "mt-4 pt-4 border-t border-gray-200", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-800 mb-2", children: "README" }), _jsx("div", { className: "prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap", children: plugin.readme })] }))] })] }) }));
}
// ── Main Component ───────────────────────────────────────────────────────────
export function MarketplacePage() {
    const [tab, setTab] = useState('browse');
    const [category, setCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [plugins, setPlugins] = useState([]);
    const [installed, setInstalled] = useState([]);
    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState(null);
    const [selectedPlugin, setSelectedPlugin] = useState(null);
    const [error, setError] = useState(null);
    const installedIds = new Set(installed.map((p) => p.plugin_id));
    // Fetch registry plugins
    const fetchPlugins = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (category !== 'all')
                params.set('category', category);
            if (search)
                params.set('search', search);
            const res = await fetch(`${API_BASE}/api/v1/public/marketplace/browse?${params}`);
            const json = await res.json();
            if (json.success) {
                setPlugins(json.data || []);
            }
        }
        catch (err) {
            setError('Failed to load marketplace plugins');
        }
    }, [category, search]);
    // Fetch installed plugins
    const fetchInstalled = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/v1/marketplace/installed?tenantId=default`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const json = await res.json();
            if (json.success) {
                setInstalled(json.data || []);
            }
        }
        catch {
            // Installed plugins fetch can fail silently for public browsing
        }
    }, []);
    useEffect(() => {
        setLoading(true);
        Promise.all([fetchPlugins(), fetchInstalled()]).finally(() => setLoading(false));
    }, [fetchPlugins, fetchInstalled]);
    // Install a plugin
    const handleInstall = async (pluginId) => {
        setInstalling(pluginId);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/v1/marketplace/install`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ pluginId, source: 'registry', tenantId: 'default' }),
            });
            const json = await res.json();
            if (json.success) {
                await fetchInstalled();
            }
            else {
                setError(json.error || 'Install failed');
            }
        }
        catch {
            setError('Failed to install plugin');
        }
        finally {
            setInstalling(null);
        }
    };
    // Toggle plugin enabled/disabled
    const handleToggle = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE}/api/v1/marketplace/installed/${id}/toggle`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            await fetchInstalled();
        }
        catch {
            setError('Failed to toggle plugin');
        }
    };
    // Uninstall plugin
    const handleUninstall = async (id) => {
        if (!window.confirm('Are you sure you want to uninstall this plugin?'))
            return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE}/api/v1/marketplace/installed/${id}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            await fetchInstalled();
        }
        catch {
            setError('Failed to uninstall plugin');
        }
    };
    const featuredPlugins = plugins.filter((p) => p.is_featured);
    const regularPlugins = plugins.filter((p) => !p.is_featured);
    return (_jsxs("div", { className: "max-w-7xl mx-auto px-4 py-6", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "Plugin Marketplace" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Discover and install plugins to extend your CMS" })] }), error && (_jsxs("div", { className: "mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center justify-between", children: [_jsx("span", { children: error }), _jsx("button", { onClick: () => setError(null), className: "text-red-600 hover:text-red-800 ml-4", children: "x" })] })), _jsxs("div", { className: "flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit", children: [_jsx("button", { onClick: () => setTab('browse'), className: `px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'browse' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`, children: "Browse" }), _jsxs("button", { onClick: () => setTab('installed'), className: `px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'installed' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`, children: ["Installed (", installed.length, ")"] })] }), tab === 'browse' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex flex-col sm:flex-row gap-3 mb-6", children: [_jsxs("div", { className: "relative flex-1 max-w-md", children: [_jsx("input", { type: "text", placeholder: "Search plugins...", value: search, onChange: (e) => setSearch(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#90b9ab] focus:border-transparent" }), _jsx("svg", { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) })] }), _jsx("div", { className: "flex gap-1 flex-wrap", children: CATEGORIES.map((cat) => (_jsx("button", { onClick: () => setCategory(cat.value), className: `px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === cat.value
                                        ? 'bg-[#90b9ab] text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`, children: cat.label }, cat.value))) })] }), loading ? (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-[#90b9ab]" }) })) : (_jsxs(_Fragment, { children: [featuredPlugins.length > 0 && category === 'all' && !search && (_jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Featured Plugins" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: featuredPlugins.map((plugin) => (_jsx(PluginCard, { plugin: plugin, isInstalled: installedIds.has(plugin.plugin_id), onInstall: handleInstall, onViewDetails: setSelectedPlugin, installing: installing }, plugin.plugin_id))) })] })), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-gray-800 mb-4", children: category === 'all' && !search
                                            ? 'All Plugins'
                                            : search
                                                ? `Search results for "${search}"`
                                                : `${CATEGORIES.find((c) => c.value === category)?.label} Plugins` }), (category === 'all' && !search ? regularPlugins : plugins).length === 0 ? (_jsxs("div", { className: "text-center py-12 text-gray-600", children: [_jsx("p", { className: "text-lg", children: "No plugins found" }), _jsx("p", { className: "text-sm mt-1", children: "Try a different category or search term" })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: (category === 'all' && !search ? regularPlugins : plugins).map((plugin) => (_jsx(PluginCard, { plugin: plugin, isInstalled: installedIds.has(plugin.plugin_id), onInstall: handleInstall, onViewDetails: setSelectedPlugin, installing: installing }, plugin.plugin_id))) }))] })] }))] })), tab === 'installed' && (_jsx("div", { children: installed.length === 0 ? (_jsxs("div", { className: "text-center py-12 text-gray-600", children: [_jsx("p", { className: "text-lg", children: "No plugins installed" }), _jsx("p", { className: "text-sm mt-1", children: "Browse the marketplace to find plugins for your CMS" }), _jsx("button", { onClick: () => setTab('browse'), className: "mt-4 px-4 py-2 bg-[#90b9ab] text-white rounded-lg text-sm font-medium hover:bg-[#7ea99b] transition-colors", children: "Browse Marketplace" })] })) : (_jsx("div", { className: "space-y-3", children: installed.map((plugin) => (_jsx(InstalledPluginRow, { plugin: plugin, onToggle: handleToggle, onUninstall: handleUninstall }, plugin.id))) })) })), selectedPlugin && (_jsx(PluginDetailView, { plugin: selectedPlugin, isInstalled: installedIds.has(selectedPlugin.plugin_id), onInstall: handleInstall, onClose: () => setSelectedPlugin(null), installing: installing }))] }));
}
//# sourceMappingURL=MarketplacePage.js.map
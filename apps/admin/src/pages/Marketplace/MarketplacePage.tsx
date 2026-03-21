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

// ── Types ────────────────────────────────────────────────────────────────────

interface RegistryPlugin {
  id: string;
  plugin_id: string;
  name: string;
  description: string | null;
  author: string | null;
  version: string;
  category: string | null;
  icon_name: string | null;
  downloads: number;
  rating: number;
  is_featured: boolean;
  is_verified: boolean;
  source_type: string;
  source_url: string | null;
  readme: string | null;
  required_env: string[];
  tags: string[];
}

interface InstalledPlugin {
  id: string;
  tenant_id: string;
  plugin_id: string;
  name: string;
  version: string;
  source: string;
  is_enabled: boolean;
  config: Record<string, unknown>;
  installed_at: string;
  description?: string | null;
  category?: string | null;
  icon_name?: string | null;
  author?: string | null;
  is_verified?: boolean;
}

type Tab = 'browse' | 'installed';
type Category = 'all' | 'content' | 'commerce' | 'analytics' | 'integration' | 'utility';

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'content', label: 'Content' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'integration', label: 'Integration' },
  { value: 'utility', label: 'Utility' },
];

const CATEGORY_COLORS: Record<string, string> = {
  content: 'bg-blue-100 text-blue-700',
  commerce: 'bg-green-100 text-green-700',
  analytics: 'bg-purple-100 text-purple-700',
  integration: 'bg-orange-100 text-orange-700',
  utility: 'bg-gray-200 text-gray-700',
};

// ── Star Rating Component ────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" title={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

// ── Plugin Card ──────────────────────────────────────────────────────────────

function PluginCard({
  plugin,
  isInstalled,
  onInstall,
  onViewDetails,
  installing,
}: {
  plugin: RegistryPlugin;
  isInstalled: boolean;
  onInstall: (pluginId: string) => void;
  onViewDetails: (plugin: RegistryPlugin) => void;
  installing: string | null;
}) {
  const categoryColor = CATEGORY_COLORS[plugin.category || ''] || CATEGORY_COLORS.utility;

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer flex flex-col"
      onClick={() => onViewDetails(plugin)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-lg font-semibold">
            {plugin.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm leading-tight">{plugin.name}</h3>
            {plugin.author && (
              <p className="text-xs text-gray-600 mt-0.5">{plugin.author}</p>
            )}
          </div>
        </div>
        {plugin.is_verified && (
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
            Verified
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-3 flex-1 line-clamp-2">
        {plugin.description || 'No description available.'}
      </p>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {plugin.category && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor}`}>
            {plugin.category}
          </span>
        )}
        {plugin.is_featured && (
          <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
            Featured
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <StarRating rating={plugin.rating} />
          <span>{plugin.downloads.toLocaleString()} installs</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isInstalled) onInstall(plugin.plugin_id);
          }}
          disabled={isInstalled || installing === plugin.plugin_id}
          className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
            isInstalled
              ? 'bg-gray-100 text-gray-600 cursor-default'
              : installing === plugin.plugin_id
              ? 'bg-gray-200 text-gray-600 cursor-wait'
              : 'bg-[#90b9ab] text-white hover:bg-[#7ea99b]'
          }`}
        >
          {isInstalled ? 'Installed' : installing === plugin.plugin_id ? 'Installing...' : 'Install'}
        </button>
      </div>
    </div>
  );
}

// ── Installed Plugin Row ─────────────────────────────────────────────────────

function InstalledPluginRow({
  plugin,
  onToggle,
  onUninstall,
}: {
  plugin: InstalledPlugin;
  onToggle: (id: string) => void;
  onUninstall: (id: string) => void;
}) {
  const categoryColor = CATEGORY_COLORS[plugin.category || ''] || CATEGORY_COLORS.utility;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-lg font-semibold shrink-0">
        {plugin.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800 text-sm">{plugin.name}</h3>
          <span className="text-xs text-gray-600">v{plugin.version}</span>
          {plugin.category && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor}`}>
              {plugin.category}
            </span>
          )}
          {plugin.is_verified && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
              Verified
            </span>
          )}
        </div>
        {plugin.description && (
          <p className="text-xs text-gray-600 mt-1 truncate">{plugin.description}</p>
        )}
        <p className="text-xs text-gray-600 mt-1">
          Installed {new Date(plugin.installed_at).toLocaleDateString()} via {plugin.source}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onToggle(plugin.id)}
          className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
            plugin.is_enabled
              ? 'bg-green-50 text-green-700 hover:bg-green-100'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {plugin.is_enabled ? 'Enabled' : 'Disabled'}
        </button>
        <button
          onClick={() => onUninstall(plugin.id)}
          className="text-xs px-3 py-1.5 rounded-md font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
        >
          Uninstall
        </button>
      </div>
    </div>
  );
}

// ── Plugin Detail Modal ──────────────────────────────────────────────────────

function PluginDetailView({
  plugin,
  isInstalled,
  onInstall,
  onClose,
  installing,
}: {
  plugin: RegistryPlugin;
  isInstalled: boolean;
  onInstall: (pluginId: string) => void;
  onClose: () => void;
  installing: string | null;
}) {
  const categoryColor = CATEGORY_COLORS[plugin.category || ''] || CATEGORY_COLORS.utility;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 text-2xl font-semibold">
                {plugin.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{plugin.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {plugin.author && <span className="text-sm text-gray-600">{plugin.author}</span>}
                  <span className="text-sm text-gray-600">v{plugin.version}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1"
            >
              x
            </button>
          </div>

          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {plugin.category && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${categoryColor}`}>
                {plugin.category}
              </span>
            )}
            {plugin.is_featured && (
              <span className="text-xs bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full font-medium">
                Featured
              </span>
            )}
            {plugin.is_verified && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">
                Verified
              </span>
            )}
            <span className="text-xs text-gray-600">{plugin.downloads.toLocaleString()} installs</span>
            <StarRating rating={plugin.rating} />
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => { if (!isInstalled) onInstall(plugin.plugin_id); }}
              disabled={isInstalled || installing === plugin.plugin_id}
              className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${
                isInstalled
                  ? 'bg-gray-100 text-gray-600 cursor-default'
                  : installing === plugin.plugin_id
                  ? 'bg-gray-200 text-gray-600 cursor-wait'
                  : 'bg-[#90b9ab] text-white hover:bg-[#7ea99b]'
              }`}
            >
              {isInstalled ? 'Already Installed' : installing === plugin.plugin_id ? 'Installing...' : 'Install Plugin'}
            </button>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4">{plugin.description || 'No description available.'}</p>

          {plugin.required_env && plugin.required_env.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Required Environment Variables</h3>
              <div className="flex flex-wrap gap-2">
                {plugin.required_env.map((env) => (
                  <code key={env} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">
                    {env}
                  </code>
                ))}
              </div>
            </div>
          )}

          {plugin.tags && plugin.tags.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {plugin.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {plugin.readme && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">README</h3>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {plugin.readme}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function MarketplacePage() {
  const [tab, setTab] = useState<Tab>('browse');
  const [category, setCategory] = useState<Category>('all');
  const [search, setSearch] = useState('');
  const [plugins, setPlugins] = useState<RegistryPlugin[]>([]);
  const [installed, setInstalled] = useState<InstalledPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);
  const [selectedPlugin, setSelectedPlugin] = useState<RegistryPlugin | null>(null);
  const [error, setError] = useState<string | null>(null);

  const installedIds = new Set(installed.map((p) => p.plugin_id));

  // Fetch registry plugins
  const fetchPlugins = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (search) params.set('search', search);

      const res = await fetch(`${API_BASE}/api/v1/public/marketplace/browse?${params}`);
      const json = await res.json();
      if (json.success) {
        setPlugins(json.data || []);
      }
    } catch (err) {
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
    } catch {
      // Installed plugins fetch can fail silently for public browsing
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPlugins(), fetchInstalled()]).finally(() => setLoading(false));
  }, [fetchPlugins, fetchInstalled]);

  // Install a plugin
  const handleInstall = async (pluginId: string) => {
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
      } else {
        setError(json.error || 'Install failed');
      }
    } catch {
      setError('Failed to install plugin');
    } finally {
      setInstalling(null);
    }
  };

  // Toggle plugin enabled/disabled
  const handleToggle = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/api/v1/marketplace/installed/${id}/toggle`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await fetchInstalled();
    } catch {
      setError('Failed to toggle plugin');
    }
  };

  // Uninstall plugin
  const handleUninstall = async (id: string) => {
    if (!window.confirm('Are you sure you want to uninstall this plugin?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/api/v1/marketplace/installed/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await fetchInstalled();
    } catch {
      setError('Failed to uninstall plugin');
    }
  };

  const featuredPlugins = plugins.filter((p) => p.is_featured);
  const regularPlugins = plugins.filter((p) => !p.is_featured);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Plugin Marketplace</h1>
        <p className="text-gray-600 mt-1">Discover and install plugins to extend your CMS</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800 ml-4">
            x
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('browse')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'browse' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Browse
        </button>
        <button
          onClick={() => setTab('installed')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'installed' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Installed ({installed.length})
        </button>
      </div>

      {tab === 'browse' && (
        <>
          {/* Search + Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search plugins..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#90b9ab] focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex gap-1 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    category === cat.value
                      ? 'bg-[#90b9ab] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#90b9ab]" />
            </div>
          ) : (
            <>
              {/* Featured Section */}
              {featuredPlugins.length > 0 && category === 'all' && !search && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Featured Plugins</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featuredPlugins.map((plugin) => (
                      <PluginCard
                        key={plugin.plugin_id}
                        plugin={plugin}
                        isInstalled={installedIds.has(plugin.plugin_id)}
                        onInstall={handleInstall}
                        onViewDetails={setSelectedPlugin}
                        installing={installing}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Plugins */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {category === 'all' && !search
                    ? 'All Plugins'
                    : search
                    ? `Search results for "${search}"`
                    : `${CATEGORIES.find((c) => c.value === category)?.label} Plugins`}
                </h2>
                {(category === 'all' && !search ? regularPlugins : plugins).length === 0 ? (
                  <div className="text-center py-12 text-gray-600">
                    <p className="text-lg">No plugins found</p>
                    <p className="text-sm mt-1">Try a different category or search term</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(category === 'all' && !search ? regularPlugins : plugins).map((plugin) => (
                      <PluginCard
                        key={plugin.plugin_id}
                        plugin={plugin}
                        isInstalled={installedIds.has(plugin.plugin_id)}
                        onInstall={handleInstall}
                        onViewDetails={setSelectedPlugin}
                        installing={installing}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {tab === 'installed' && (
        <div>
          {installed.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <p className="text-lg">No plugins installed</p>
              <p className="text-sm mt-1">
                Browse the marketplace to find plugins for your CMS
              </p>
              <button
                onClick={() => setTab('browse')}
                className="mt-4 px-4 py-2 bg-[#90b9ab] text-white rounded-lg text-sm font-medium hover:bg-[#7ea99b] transition-colors"
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {installed.map((plugin) => (
                <InstalledPluginRow
                  key={plugin.id}
                  plugin={plugin}
                  onToggle={handleToggle}
                  onUninstall={handleUninstall}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Plugin Detail Modal */}
      {selectedPlugin && (
        <PluginDetailView
          plugin={selectedPlugin}
          isInstalled={installedIds.has(selectedPlugin.plugin_id)}
          onInstall={handleInstall}
          onClose={() => setSelectedPlugin(null)}
          installing={installing}
        />
      )}
    </div>
  );
}

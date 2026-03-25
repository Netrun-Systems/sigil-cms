import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2,
  Bot,
  Wifi,
  WifiOff,
  Database,
  Send,
  Save,
  MessageCircle,
  Settings,
} from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface HealthStatus {
  status: string;
  modelsAvailable: string[];
  lastChecked: string;
}

interface KnowledgeCollection {
  id: string;
  name: string;
  documentCount: number;
  lastUpdated: string | null;
}

interface Page {
  id: string;
  title: string;
}

interface WidgetConfig {
  position: 'bottom-right' | 'bottom-left';
  primaryColor: string;
  greeting: string;
  placeholder: string;
}

const defaultConfig: WidgetConfig = {
  position: 'bottom-right',
  primaryColor: '#90b9ab',
  greeting: 'Hi! How can I help you today?',
  placeholder: 'Type a message...',
};

export function CharlottePage() {
  const { siteId } = useParams<{ siteId: string }>();
  const basePath = `/sites/${siteId}`;

  const [connected, setConnected] = useState<boolean | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [collections, setCollections] = useState<KnowledgeCollection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [ingesting, setIngesting] = useState(false);
  const [config, setConfig] = useState<WidgetConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);

  const checkHealth = async () => {
    try {
      const res = await api.get<HealthStatus>(`${basePath}/charlotte/health`);
      setHealth(res);
      setConnected(true);
    } catch {
      setConnected(false);
    }
  };

  const loadCollections = async () => {
    setCollectionsLoading(true);
    try {
      const res = await api.get<{ data: KnowledgeCollection[] }>(
        `${basePath}/charlotte/knowledge`
      );
      setCollections(res.data ?? []);
    } catch {
      // empty state
    } finally {
      setCollectionsLoading(false);
    }
  };

  const loadPages = async () => {
    try {
      const res = await api.get<{ data: Page[] }>(`${basePath}/pages`);
      setPages(res.data ?? []);
    } catch {
      // empty state
    }
  };

  const loadConfig = async () => {
    try {
      const res = await api.get<WidgetConfig>(
        `${basePath}/charlotte/config`
      );
      setConfig({ ...defaultConfig, ...res });
    } catch {
      // use defaults
    }
  };

  useEffect(() => {
    checkHealth();
    loadCollections();
    loadPages();
    loadConfig();
  }, [siteId]);

  const handleIngest = async () => {
    if (!selectedPageId) return;
    setIngesting(true);
    try {
      await api.post(`${basePath}/charlotte/ingest`, {
        pageId: selectedPageId,
      });
      setSelectedPageId('');
      await loadCollections();
    } catch {
      // ingest error
    } finally {
      setIngesting(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await api.put(`${basePath}/charlotte/config`, config);
    } catch {
      // save error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Charlotte AI Assistant</h1>
          {connected !== null && (
            <span
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border',
                connected
                  ? 'border-green-500/50 bg-green-500/10 text-green-400'
                  : 'border-red-500/50 bg-red-500/10 text-red-400'
              )}
            >
              {connected ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Connection Card */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium">Connection Status</p>
              </div>
              {health ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium capitalize">
                      {health.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Models Available
                    </span>
                    <span className="font-medium">
                      {health.modelsAvailable.length > 0
                        ? health.modelsAvailable.join(', ')
                        : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Check</span>
                    <span className="font-medium text-xs">
                      {new Date(health.lastChecked).toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : connected === false ? (
                <p className="text-sm text-muted-foreground">
                  Unable to reach Charlotte API. Ensure it is configured and
                  running.
                </p>
              ) : (
                <div className="flex h-12 items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Knowledge Base */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium">Knowledge Base</p>
              </div>

              {collectionsLoading ? (
                <div className="flex h-16 items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : collections.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No knowledge collections yet. Ingest a page to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {collections.map((col) => (
                    <div
                      key={col.id}
                      className="flex items-center justify-between rounded-md border border-border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{col.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {col.documentCount} document
                          {col.documentCount !== 1 ? 's' : ''}
                          {col.lastUpdated &&
                            ` | Updated ${new Date(col.lastUpdated).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Ingest page */}
              <div className="border-t border-border pt-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Ingest Page
                </p>
                <div className="flex gap-2">
                  <select
                    value={selectedPageId}
                    onChange={(e) => setSelectedPageId(e.target.value)}
                    className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select a page...</option>
                    {pages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleIngest}
                    disabled={!selectedPageId || ingesting}
                    className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {ingesting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Ingest
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Widget Configuration */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm font-medium">Widget Configuration</p>
                </div>
                <button
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Save
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Position</label>
                  <select
                    value={config.position}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        position: e.target.value as WidgetConfig['position'],
                      })
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) =>
                        setConfig({ ...config, primaryColor: e.target.value })
                      }
                      className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-1"
                    />
                    <input
                      type="text"
                      value={config.primaryColor}
                      onChange={(e) =>
                        setConfig({ ...config, primaryColor: e.target.value })
                      }
                      className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Greeting Message</label>
                  <input
                    type="text"
                    value={config.greeting}
                    onChange={(e) =>
                      setConfig({ ...config, greeting: e.target.value })
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Placeholder Text</label>
                  <input
                    type="text"
                    value={config.placeholder}
                    onChange={(e) =>
                      setConfig({ ...config, placeholder: e.target.value })
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Widget Preview */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium">Widget Preview</p>
              </div>

              {/* Mock site area */}
              <div className="relative rounded-lg border border-border bg-muted/30 h-[480px] overflow-hidden">
                {/* Fake page content */}
                <div className="p-6 space-y-3">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-5/6 rounded bg-muted" />
                  <div className="h-3 w-2/3 rounded bg-muted" />
                  <div className="h-20 w-full rounded bg-muted mt-4" />
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-4/5 rounded bg-muted" />
                </div>

                {/* Chat widget mockup */}
                <div
                  className={cn(
                    'absolute bottom-4',
                    config.position === 'bottom-right' ? 'right-4' : 'left-4'
                  )}
                >
                  {/* Chat bubble */}
                  <div className="mb-3 w-72 rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                    {/* Widget header */}
                    <div
                      className="px-4 py-3 text-sm font-medium text-white"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      Charlotte AI
                    </div>

                    {/* Messages */}
                    <div className="p-3 space-y-2 h-40">
                      <div className="flex gap-2">
                        <div
                          className="rounded-lg px-3 py-2 text-xs text-white max-w-[200px]"
                          style={{ backgroundColor: config.primaryColor }}
                        >
                          {config.greeting}
                        </div>
                      </div>
                    </div>

                    {/* Input */}
                    <div className="border-t border-border p-2 flex gap-2">
                      <div className="flex-1 rounded-md border border-input bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
                        {config.placeholder}
                      </div>
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-md text-white"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        <Send className="h-3 w-3" />
                      </div>
                    </div>
                  </div>

                  {/* FAB */}
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg',
                      config.position === 'bottom-right' ? 'ml-auto' : ''
                    )}
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <MessageCircle className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

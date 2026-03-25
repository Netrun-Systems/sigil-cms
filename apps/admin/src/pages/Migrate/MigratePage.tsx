import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, ShoppingBag, Globe, Loader2, ChevronDown, ChevronUp, FileUp, ExternalLink } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface Migration {
  id: string;
  source: 'wordpress' | 'shopify' | 'square';
  status: 'pending' | 'running' | 'completed' | 'failed';
  items_imported: number;
  items_failed: number;
  created_at: string;
  details?: Record<string, unknown>;
}

type SourceType = 'wordpress' | 'shopify' | 'square' | null;

interface WordPressForm {
  mode: 'file' | 'api';
  file: File | null;
  apiUrl: string;
}

interface ShopifyForm {
  domain: string;
  adminToken: string;
  storefrontToken: string;
}

interface SquareForm {
  siteUrl: string;
  accessToken: string;
}

const sourceConfig = [
  {
    key: 'wordpress' as const,
    label: 'WordPress',
    icon: Upload,
    description: 'WXR XML export or REST API',
    buttonLabel: 'Import from WordPress',
  },
  {
    key: 'shopify' as const,
    label: 'Shopify',
    icon: ShoppingBag,
    description: 'Admin API + Storefront API',
    buttonLabel: 'Import from Shopify',
  },
  {
    key: 'square' as const,
    label: 'Square',
    icon: Globe,
    description: 'Catalog API + site scraping',
    buttonLabel: 'Import from Square',
  },
];

const inputClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

function statusColor(status: Migration['status']): string {
  switch (status) {
    case 'completed': return 'border-green-500/50 bg-green-500/10 text-green-500';
    case 'running': return 'border-blue-500/50 bg-blue-500/10 text-blue-500';
    case 'failed': return 'border-red-500/50 bg-red-500/10 text-red-500';
    default: return 'border-gray-500/50 bg-gray-500/10 text-gray-400';
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MigratePage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSource, setActiveSource] = useState<SourceType>(null);
  const [importing, setImporting] = useState(false);

  const [wpForm, setWpForm] = useState<WordPressForm>({ mode: 'file', file: null, apiUrl: '' });
  const [shopifyForm, setShopifyForm] = useState<ShopifyForm>({ domain: '', adminToken: '', storefrontToken: '' });
  const [squareForm, setSquareForm] = useState<SquareForm>({ siteUrl: '', accessToken: '' });

  const basePath = `/sites/${siteId}/migrate`;

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Migration[] }>(basePath);
      setMigrations(res.data ?? []);
    } catch { /* empty state */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [siteId]);

  const toggleSource = (source: SourceType) => {
    setActiveSource((prev) => (prev === source ? null : source));
  };

  const handleImport = async () => {
    if (!activeSource) return;
    setImporting(true);
    try {
      if (activeSource === 'wordpress') {
        if (wpForm.mode === 'file' && wpForm.file) {
          const formData = new FormData();
          formData.append('file', wpForm.file);
          await api.post(`${basePath}/wordpress`, formData);
        } else if (wpForm.mode === 'api' && wpForm.apiUrl) {
          await api.post(`${basePath}/wordpress`, { api_url: wpForm.apiUrl });
        }
      } else if (activeSource === 'shopify') {
        await api.post(`${basePath}/shopify`, {
          domain: shopifyForm.domain,
          admin_token: shopifyForm.adminToken,
          storefront_token: shopifyForm.storefrontToken || undefined,
        });
      } else if (activeSource === 'square') {
        await api.post(`${basePath}/square`, {
          site_url: squareForm.siteUrl,
          access_token: squareForm.accessToken || undefined,
        });
      }
      setActiveSource(null);
      await load();
    } catch { /* keep state */ } finally {
      setImporting(false);
    }
  };

  const canSubmit = (): boolean => {
    if (!activeSource) return false;
    if (activeSource === 'wordpress') {
      return wpForm.mode === 'file' ? !!wpForm.file : !!wpForm.apiUrl.trim();
    }
    if (activeSource === 'shopify') return !!shopifyForm.domain.trim() && !!shopifyForm.adminToken.trim();
    if (activeSource === 'square') return !!squareForm.siteUrl.trim();
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Import Site</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Migrate content from WordPress, Shopify, or Square Online
        </p>
      </div>

      {/* Source Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {sourceConfig.map((src) => {
          const Icon = src.icon;
          const isActive = activeSource === src.key;
          return (
            <Card
              key={src.key}
              className={cn('cursor-pointer transition-colors', isActive && 'ring-2 ring-primary')}
              onClick={() => toggleSource(src.key)}
            >
              <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-medium">{src.label}</h3>
                <p className="text-sm text-muted-foreground">{src.description}</p>
                <button
                  className={cn(
                    'mt-2 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-accent'
                  )}
                >
                  {src.buttonLabel}
                  {isActive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Inline Forms */}
      {activeSource === 'wordpress' && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-medium">WordPress Import</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setWpForm((f) => ({ ...f, mode: 'file' }))}
                className={cn('rounded-md px-3 py-1.5 text-sm transition-colors',
                  wpForm.mode === 'file' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                File Upload
              </button>
              <button
                onClick={() => setWpForm((f) => ({ ...f, mode: 'api' }))}
                className={cn('rounded-md px-3 py-1.5 text-sm transition-colors',
                  wpForm.mode === 'api' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                REST API
              </button>
            </div>
            {wpForm.mode === 'file' ? (
              <div>
                <label className="text-sm font-medium">WXR Export File (.xml)</label>
                <input
                  type="file"
                  accept=".xml"
                  onChange={(e) => setWpForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))}
                  className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium">REST API Base URL</label>
                <input
                  value={wpForm.apiUrl}
                  onChange={(e) => setWpForm((f) => ({ ...f, apiUrl: e.target.value }))}
                  placeholder="https://example.com/wp-json/wp/v2"
                  className={cn(inputClass, 'mt-1')}
                />
              </div>
            )}
            <button
              onClick={handleImport}
              disabled={importing || !canSubmit()}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {importing && <Loader2 className="h-4 w-4 animate-spin" />}
              Start Import
            </button>
          </CardContent>
        </Card>
      )}

      {activeSource === 'shopify' && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-medium">Shopify Import</h3>
            <div>
              <label className="text-sm font-medium">Store Domain</label>
              <input
                value={shopifyForm.domain}
                onChange={(e) => setShopifyForm((f) => ({ ...f, domain: e.target.value }))}
                placeholder="my-store.myshopify.com"
                className={cn(inputClass, 'mt-1')}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Admin API Token</label>
              <input
                type="password"
                value={shopifyForm.adminToken}
                onChange={(e) => setShopifyForm((f) => ({ ...f, adminToken: e.target.value }))}
                placeholder="shpat_..."
                className={cn(inputClass, 'mt-1')}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Storefront Token (optional)</label>
              <input
                value={shopifyForm.storefrontToken}
                onChange={(e) => setShopifyForm((f) => ({ ...f, storefrontToken: e.target.value }))}
                placeholder="Optional"
                className={cn(inputClass, 'mt-1')}
              />
            </div>
            <button
              onClick={handleImport}
              disabled={importing || !canSubmit()}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {importing && <Loader2 className="h-4 w-4 animate-spin" />}
              Start Import
            </button>
          </CardContent>
        </Card>
      )}

      {activeSource === 'square' && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-medium">Square Import</h3>
            <div>
              <label className="text-sm font-medium">Site URL</label>
              <input
                value={squareForm.siteUrl}
                onChange={(e) => setSquareForm((f) => ({ ...f, siteUrl: e.target.value }))}
                placeholder="https://my-store.square.site"
                className={cn(inputClass, 'mt-1')}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Access Token (optional)</label>
              <input
                type="password"
                value={squareForm.accessToken}
                onChange={(e) => setSquareForm((f) => ({ ...f, accessToken: e.target.value }))}
                placeholder="Optional — for Catalog API access"
                className={cn(inputClass, 'mt-1')}
              />
            </div>
            <button
              onClick={handleImport}
              disabled={importing || !canSubmit()}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {importing && <Loader2 className="h-4 w-4 animate-spin" />}
              Start Import
            </button>
          </CardContent>
        </Card>
      )}

      {/* Recent Migrations Table */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent Migrations</h2>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : migrations.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
            <FileUp className="h-8 w-8" />
            <p className="text-sm">No migrations yet</p>
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Source</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Imported</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Failed</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                    <th className="px-6 py-3 w-[100px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {migrations.map((m) => (
                    <tr key={m.id} className="group border-b border-border last:border-0 hover:bg-accent/50">
                      <td className="px-6 py-4 text-sm font-medium capitalize">{m.source}</td>
                      <td className="px-6 py-4">
                        <span className={cn('rounded-md border px-2 py-0.5 text-xs font-medium capitalize', statusColor(m.status))}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{m.items_imported}</td>
                      <td className="px-6 py-4 text-sm">
                        {m.items_failed > 0 ? (
                          <span className="text-red-500">{m.items_failed}</span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(m.created_at)}</td>
                      <td className="px-6 py-4">
                        <button className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                          <ExternalLink className="h-3 w-3" /> Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

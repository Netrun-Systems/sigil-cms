import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Loader2, Webhook, X, RefreshCw, Copy, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  last_delivery_status: 'delivered' | 'failed' | null;
  fail_count: number;
  created_at: string;
}

interface WebhookDelivery {
  id: string;
  endpoint_id: string;
  endpoint_url: string;
  event_type: string;
  status: 'delivered' | 'failed';
  http_code: number | null;
  created_at: string;
}

interface EndpointForm {
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
}

const EVENT_TYPES = [
  'page.created',
  'page.updated',
  'page.published',
  'page.deleted',
  'block.created',
  'block.updated',
  'block.deleted',
  'media.uploaded',
  'media.deleted',
  'order.created',
  'order.completed',
  'order.cancelled',
  'subscriber.added',
  'subscriber.removed',
  'contact.submitted',
];

const inputClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'whsec_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function truncateUrl(url: string, max = 50): string {
  if (url.length <= max) return url;
  return url.slice(0, max) + '...';
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

const defaultForm: EndpointForm = {
  url: '',
  events: [],
  secret: generateSecret(),
  is_active: true,
};

export function WebhooksPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EndpointForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const basePath = `/sites/${siteId}/webhooks`;

  const load = async () => {
    setLoading(true);
    try {
      const [epRes, dlRes] = await Promise.all([
        api.get<{ data: WebhookEndpoint[] }>(`${basePath}/endpoints`),
        api.get<{ data: WebhookDelivery[] }>(`${basePath}/deliveries`),
      ]);
      setEndpoints(epRes.data ?? []);
      setDeliveries(dlRes.data ?? []);
    } catch { /* empty state */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [siteId]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...defaultForm, secret: generateSecret() });
    setShowSecret(false);
    setDialogOpen(true);
  };

  const openEdit = (ep: WebhookEndpoint) => {
    setEditingId(ep.id);
    setForm({
      url: ep.url,
      events: [...ep.events],
      secret: ep.secret,
      is_active: ep.is_active,
    });
    setShowSecret(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        const res = await api.put<{ data: WebhookEndpoint }>(`${basePath}/endpoints/${editingId}`, form);
        setEndpoints((prev) => prev.map((ep) => ep.id === editingId ? (res.data ?? ep) : ep));
      } else {
        const res = await api.post<{ data: WebhookEndpoint }>(`${basePath}/endpoints`, form);
        if (res.data) setEndpoints((prev) => [...prev, res.data]);
      }
      setDialogOpen(false);
    } catch { /* */ } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this webhook endpoint?')) return;
    try {
      await api.delete(`${basePath}/endpoints/${id}`);
      setEndpoints((prev) => prev.filter((ep) => ep.id !== id));
    } catch { /* */ }
  };

  const handleToggleActive = async (ep: WebhookEndpoint) => {
    try {
      await api.patch(`${basePath}/endpoints/${ep.id}`, { is_active: !ep.is_active });
      setEndpoints((prev) => prev.map((e) => e.id === ep.id ? { ...e, is_active: !e.is_active } : e));
    } catch { /* */ }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      await api.post(`${basePath}/endpoints/${id}/test`, {});
      await load();
    } catch { /* */ } finally {
      setTesting(null);
    }
  };

  const handleRetry = async (deliveryId: string) => {
    setRetrying(deliveryId);
    try {
      await api.post(`${basePath}/deliveries/${deliveryId}/retry`, {});
      await load();
    } catch { /* */ } finally {
      setRetrying(null);
    }
  };

  const toggleEvent = (event: string) => {
    setForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const copySecret = () => {
    navigator.clipboard.writeText(form.secret).catch(() => {});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Webhooks</h1>
        <button
          onClick={openCreate}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Endpoint
        </button>
      </div>

      {/* Endpoint Cards */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : endpoints.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Webhook className="h-8 w-8" />
          <p className="text-sm">No webhook endpoints configured</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {endpoints.map((ep) => (
            <Card key={ep.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm font-medium" title={ep.url}>
                      {truncateUrl(ep.url)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ep.events.map((ev) => (
                        <span key={ev} className="rounded-md bg-muted px-2 py-0.5 text-xs">
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Last delivery status */}
                    {ep.last_delivery_status && (
                      <span
                        className={cn(
                          'h-2.5 w-2.5 rounded-full',
                          ep.last_delivery_status === 'delivered' ? 'bg-green-500' : 'bg-red-500'
                        )}
                        title={ep.last_delivery_status === 'delivered' ? 'Last delivery succeeded' : 'Last delivery failed'}
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Active toggle */}
                    <button
                      onClick={() => handleToggleActive(ep)}
                      className={cn(
                        'rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
                        ep.is_active
                          ? 'border-green-500/50 bg-green-500/10 text-green-500'
                          : 'border-gray-500/50 bg-gray-500/10 text-gray-400'
                      )}
                    >
                      {ep.is_active ? 'Active' : 'Inactive'}
                    </button>
                    {ep.fail_count > 0 && (
                      <span className="text-xs text-red-500">{ep.fail_count} failures</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTest(ep.id)}
                      disabled={testing === ep.id}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                    >
                      {testing === ep.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Test'}
                    </button>
                    <button
                      onClick={() => openEdit(ep)}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(ep.id)}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-destructive"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Deliveries Table */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent Deliveries</h2>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : deliveries.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Webhook className="h-8 w-8" />
            <p className="text-sm">No deliveries yet</p>
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Event</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Endpoint</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">HTTP Code</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                    <th className="px-6 py-3 w-[80px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((d) => (
                    <tr key={d.id} className="group border-b border-border last:border-0 hover:bg-accent/50">
                      <td className="px-6 py-4">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs">{d.event_type}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-muted-foreground" title={d.endpoint_url}>
                        {truncateUrl(d.endpoint_url, 35)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn('h-2 w-2 rounded-full', d.status === 'delivered' ? 'bg-green-500' : 'bg-red-500')} />
                          <span className="text-sm capitalize">{d.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono">
                        {d.http_code ?? '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDate(d.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        {d.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(d.id)}
                            disabled={retrying === d.id}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                          >
                            {retrying === d.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Add / Edit Endpoint Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDialogOpen(false)}>
          <div className="w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit Endpoint' : 'Add Endpoint'}</h2>
              <button onClick={() => setDialogOpen(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* URL */}
              <div>
                <label className="text-sm font-medium">Endpoint URL</label>
                <input
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://example.com/webhook"
                  className={cn(inputClass, 'mt-1')}
                />
              </div>

              {/* Secret */}
              <div>
                <label className="text-sm font-medium">Signing Secret</label>
                <div className="mt-1 flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={form.secret}
                      onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))}
                      className={inputClass}
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={copySecret}
                    className="rounded-md border border-input px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                    title="Copy secret"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, secret: generateSecret() }))}
                    className="rounded-md border border-input px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                    title="Regenerate secret"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Active</label>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    form.is_active ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 rounded-full bg-background transition-transform',
                      form.is_active ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Event types */}
              <div>
                <label className="text-sm font-medium">Event Types</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {EVENT_TYPES.map((ev) => (
                    <button
                      key={ev}
                      type="button"
                      onClick={() => toggleEvent(ev)}
                      className={cn(
                        'rounded-md border px-2 py-1 text-xs transition-colors',
                        form.events.includes(ev)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      )}
                    >
                      {ev}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDialogOpen(false)}
                className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.url.trim() || form.events.length === 0}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

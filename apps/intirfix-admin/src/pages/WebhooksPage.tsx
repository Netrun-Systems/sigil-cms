import { useState, useEffect } from 'react';
import { Webhook, Trash2 } from 'lucide-react';

interface WebhookEntry {
  id: string;
  platform: string;
  event: string;
  url: string;
  createdAt: string;
  lastTriggered?: string;
  status: 'active' | 'inactive' | 'error';
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/webhooks')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setWebhooks(Array.isArray(data) ? data : data?.items ?? []))
      .catch(() => setWebhooks([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="px-8 py-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Webhooks</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Inbound webhook receivers for platform events
        </p>
      </div>

      <div className="p-4 md:p-8">
        {loading ? (
          <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading webhooks...</p>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-12 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}>
            <Webhook size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              No webhooks configured. Webhooks are auto-created when you connect platforms.
            </p>
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}>
            <div className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
              {webhooks.map((wh) => (
                <div key={wh.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{wh.platform}</p>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                        {wh.event}
                      </span>
                    </div>
                    <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>{wh.url}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: wh.status === 'active' ? 'var(--success)' : 'var(--text-muted)' }}>
                      {wh.status}
                    </span>
                    <button className="p-1.5 rounded hover:opacity-80" style={{ color: 'var(--error)' }} title="Delete webhook">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

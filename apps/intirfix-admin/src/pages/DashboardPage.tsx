import { useState, useEffect } from 'react';
import { Plug, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface ConnectionSummary {
  platform: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
}

export default function DashboardPage() {
  const [connections, setConnections] = useState<ConnectionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/v1/connections')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setConnections(Array.isArray(data) ? data : data?.items ?? []))
      .catch(() => setConnections([]))
      .finally(() => setLoading(false));
  }, []);

  const connected = connections.filter((c) => c.status === 'connected').length;
  const errored = connections.filter((c) => c.status === 'error').length;

  return (
    <div>
      <div className="px-8 py-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Integration Hub
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Connected platforms, sync status, and webhook activity
        </p>
      </div>

      <div className="p-4 md:p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricTile label="Total Platforms" value={connections.length} icon={<Plug size={18} />} />
          <MetricTile label="Connected" value={connected} icon={<CheckCircle size={18} />} color="var(--success)" />
          <MetricTile label="Errors" value={errored} icon={<AlertCircle size={18} />} color="var(--error)" />
          <MetricTile label="Last Sync" value="--" icon={<RefreshCw size={18} />} isText />
        </div>

        {loading ? (
          <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>
            Loading integration status...
          </p>
        ) : connections.length === 0 ? (
          <div className="text-center py-12 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}>
            <Plug size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              No integrations connected yet. Go to Connections to add your first platform.
            </p>
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border-primary)' }}>
              <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Connected Platforms</h2>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
              {connections.map((conn) => (
                <div key={conn.platform} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{conn.platform}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {conn.lastSync ? `Last sync: ${conn.lastSync}` : 'Never synced'}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      background: conn.status === 'connected' ? 'rgba(52,211,153,0.15)' : conn.status === 'error' ? 'rgba(248,113,113,0.15)' : 'rgba(112,112,112,0.15)',
                      color: conn.status === 'connected' ? 'var(--success)' : conn.status === 'error' ? 'var(--error)' : 'var(--text-muted)',
                    }}
                  >
                    {conn.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricTile({ label, value, icon, color, isText }: {
  label: string; value: number | string; icon: React.ReactNode; color?: string; isText?: boolean;
}) {
  return (
    <div className="rounded-lg p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}>
      <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--text-muted)' }}>
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-semibold" style={{ color: color || 'var(--text-primary)' }}>
        {isText ? value : value}
      </p>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link2, Plus, TestTube, Trash2 } from 'lucide-react';

interface Connection {
  id: string;
  platform: string;
  status: 'connected' | 'disconnected' | 'error';
  connectedAt?: string;
  lastSync?: string;
}

const PLATFORM_CATEGORIES = [
  { label: 'Payments', platforms: ['Stripe', 'Square', 'PayPal', 'Clover', 'Plaid'] },
  { label: 'Accounting', platforms: ['QuickBooks', 'Xero', 'FreshBooks', 'Wave'] },
  { label: 'CRM', platforms: ['HubSpot', 'Salesforce', 'Zoho', 'Pipedrive'] },
  { label: 'Marketing', platforms: ['Mailchimp', 'SendGrid', 'Constant Contact', 'Google Analytics', 'Mixpanel'] },
  { label: 'E-commerce', platforms: ['Shopify', 'WooCommerce', 'Amazon', 'BigCommerce', 'Etsy', 'eBay'] },
  { label: 'Other', platforms: ['Slack', 'Microsoft Teams', 'Google Drive', 'Dropbox', 'WordPress'] },
];

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/connections')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setConnections(Array.isArray(data) ? data : data?.items ?? []))
      .catch(() => setConnections([]))
      .finally(() => setLoading(false));
  }, []);

  const connectedPlatforms = new Set(connections.filter(c => c.status === 'connected').map(c => c.platform.toLowerCase()));

  return (
    <div>
      <div className="px-8 py-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Connections</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Connect and manage your platform integrations
        </p>
      </div>

      <div className="p-4 md:p-8 space-y-8">
        {loading ? (
          <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading connections...</p>
        ) : (
          PLATFORM_CATEGORIES.map((cat) => (
            <div key={cat.label}>
              <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>{cat.label}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cat.platforms.map((platform) => {
                  const isConnected = connectedPlatforms.has(platform.toLowerCase());
                  return (
                    <div
                      key={platform}
                      className="flex items-center justify-between rounded-lg px-4 py-3"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded flex items-center justify-center text-xs font-medium"
                          style={{ background: isConnected ? 'rgba(45,212,191,0.15)' : 'var(--bg-hover)', color: isConnected ? 'var(--accent)' : 'var(--text-muted)' }}
                        >
                          {platform.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{platform}</p>
                          <p className="text-xs" style={{ color: isConnected ? 'var(--success)' : 'var(--text-muted)' }}>
                            {isConnected ? 'Connected' : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isConnected ? (
                          <>
                            <button className="p-1.5 rounded hover:opacity-80" style={{ color: 'var(--text-muted)' }} title="Test connection">
                              <TestTube size={14} />
                            </button>
                            <button className="p-1.5 rounded hover:opacity-80" style={{ color: 'var(--error)' }} title="Disconnect">
                              <Trash2 size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded"
                            style={{ background: 'rgba(45,212,191,0.15)', color: 'var(--accent)' }}
                          >
                            <Plus size={12} /> Connect
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

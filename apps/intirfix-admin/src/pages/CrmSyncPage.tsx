import { RefreshCw } from 'lucide-react';

const PLATFORMS = [
  { name: 'HubSpot', description: 'Contacts, deals, companies, and engagement sync' },
  { name: 'Salesforce', description: 'Leads, opportunities, accounts, and contacts sync' },
  { name: 'Zoho CRM', description: 'Contacts, deals, and accounts sync' },
  { name: 'Pipedrive', description: 'Contacts, deals, and activities sync' },
];

export default function CrmSyncPage() {
  return (
    <div>
      <div className="px-8 py-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>CRM Sync</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Bidirectional contact and deal sync with CRM platforms
        </p>
      </div>

      <div className="p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLATFORMS.map((p) => (
            <div key={p.name} className="rounded-lg p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-hover)' }}>
                  <RefreshCw size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.description}</p>
                </div>
              </div>
              <button
                className="w-full text-xs py-2 rounded"
                style={{ background: 'rgba(45,212,191,0.1)', color: 'var(--accent)', border: '1px solid rgba(45,212,191,0.2)' }}
              >
                Configure
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

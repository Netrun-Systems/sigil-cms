import { Calculator } from 'lucide-react';

const PLATFORMS = [
  { name: 'QuickBooks', description: 'Invoice sync, chart of accounts, GL mapping' },
  { name: 'Xero', description: 'Invoice sync, bank reconciliation, reporting' },
  { name: 'FreshBooks', description: 'Invoice sync, expense tracking' },
  { name: 'Wave', description: 'Invoice sync, basic bookkeeping' },
];

export default function AccountingPage() {
  return (
    <div>
      <div className="px-8 py-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Accounting</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Accounting platform integrations and invoice sync
        </p>
      </div>

      <div className="p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLATFORMS.map((p) => (
            <div key={p.name} className="rounded-lg p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-hover)' }}>
                  <Calculator size={18} style={{ color: 'var(--accent)' }} />
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

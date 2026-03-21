import { useState, useEffect } from 'react';
import { Receipt, Filter, Download } from 'lucide-react';

interface Transaction {
  id: string;
  platform: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  status: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/transactions')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setTransactions(Array.isArray(data) ? data : data?.items ?? []))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="px-8 py-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-primary)' }}>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Transactions</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Aggregated transaction data across all payment platforms
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>
            <Filter size={12} /> Filter
          </button>
          <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      <div className="p-4 md:p-8">
        {loading ? (
          <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}>
            <Receipt size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              No transactions yet. Connect a payment platform to start syncing.
            </p>
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border-primary)' }}>
                  <th className="text-left px-5 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Platform</th>
                  <th className="text-left px-5 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Description</th>
                  <th className="text-right px-5 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                {transactions.map((txn) => (
                  <tr key={txn.id}>
                    <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{txn.date}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-primary)' }}>{txn.platform}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-primary)' }}>{txn.description}</td>
                    <td className="px-5 py-3 text-right font-mono" style={{ color: 'var(--accent)' }}>
                      ${txn.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 rounded" style={{
                        background: txn.status === 'completed' ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
                        color: txn.status === 'completed' ? 'var(--success)' : 'var(--warning)',
                      }}>
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

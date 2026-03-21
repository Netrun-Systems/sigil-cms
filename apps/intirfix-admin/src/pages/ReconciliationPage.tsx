import { useState, useEffect } from 'react';
import { Scale, Play } from 'lucide-react';

interface ReconciliationRun {
  id: string;
  date: string;
  platforms: string[];
  matched: number;
  unmatched: number;
  status: 'complete' | 'running' | 'failed';
}

export default function ReconciliationPage() {
  const [runs, setRuns] = useState<ReconciliationRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/reconciliation')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setRuns(Array.isArray(data) ? data : data?.items ?? []))
      .catch(() => setRuns([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="px-8 py-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-primary)' }}>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Reconciliation</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Cross-platform transaction matching and discrepancy detection
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded"
          style={{ background: 'rgba(45,212,191,0.15)', color: 'var(--accent)' }}
        >
          <Play size={12} /> Run Reconciliation
        </button>
      </div>

      <div className="p-4 md:p-8">
        {loading ? (
          <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading reconciliation data...</p>
        ) : runs.length === 0 ? (
          <div className="text-center py-12 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}>
            <Scale size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              No reconciliation runs yet. Connect payment platforms and run your first reconciliation.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <div key={run.id} className="rounded-lg px-5 py-4 flex items-center justify-between" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{run.date}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {run.platforms.join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span style={{ color: 'var(--success)' }}>{run.matched} matched</span>
                  <span style={{ color: run.unmatched > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                    {run.unmatched} unmatched
                  </span>
                  <span className="px-2 py-0.5 rounded" style={{
                    background: run.status === 'complete' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                    color: run.status === 'complete' ? 'var(--success)' : 'var(--error)',
                  }}>
                    {run.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

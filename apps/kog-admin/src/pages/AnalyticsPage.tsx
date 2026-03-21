import { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import MetricCard from '../components/common/MetricCard';
import Panel from '../components/common/Panel';
import { getDashboardMetrics, getDeals } from '../services/api';

interface Metric { label: string; value: number; trend?: 'up' | 'down' | 'flat' }

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [pipelineBreakdown, setPipelineBreakdown] = useState<{ stage: string; count: number; value: number }[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        try {
          const data = await getDashboardMetrics();
          if (data?.metrics) { setMetrics(data.metrics as Metric[]); setLoading(false); return; }
        } catch { /* fall through */ }

        const dealsRes = await getDeals({ limit: '200' }).catch(() => []);
        const deals: any[] = (dealsRes as any)?.items ?? dealsRes ?? [];

        const closedWon = deals.filter((d: any) => d.stage === 'closed_won');
        const closedLost = deals.filter((d: any) => d.stage === 'closed_lost');
        const totalClosed = closedWon.length + closedLost.length;
        const winRate = totalClosed > 0 ? Math.round((closedWon.length / totalClosed) * 100) : 0;
        const activeDeals = deals.filter((d: any) => !['closed_won', 'closed_lost'].includes(d.stage));
        const avgDealSize = activeDeals.length > 0
          ? Math.round(activeDeals.reduce((s: number, d: any) => s + (d.value || 0), 0) / activeDeals.length) : 0;

        setMetrics([
          { label: 'Win Rate', value: winRate, trend: 'up' },
          { label: 'Avg Deal Size', value: avgDealSize, trend: 'up' },
          { label: 'Active Deals', value: activeDeals.length, trend: 'up' },
          { label: 'Total Deals', value: deals.length, trend: 'up' },
        ]);

        const groups: Record<string, { count: number; value: number }> = {};
        deals.forEach((d: any) => {
          const s = d.stage || 'unknown';
          if (!groups[s]) groups[s] = { count: 0, value: 0 };
          groups[s].count++;
          groups[s].value += d.value || 0;
        });
        setPipelineBreakdown(Object.entries(groups).map(([stage, data]) => ({ stage, ...data })));
      } catch (err) { console.error('Failed to load analytics:', err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div>
        <Header title="Analytics" subtitle="Sales performance metrics" />
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
          <p className="text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Analytics" subtitle="Sales performance metrics" />
      <div className="p-4 md:p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((m) => <MetricCard key={m.label} {...m} />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Panel title="Pipeline Breakdown">
            {pipelineBreakdown.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                <p className="text-sm">No deal data available yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pipelineBreakdown.map((item) => (
                  <div key={item.stage} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: 'var(--netrun-green)' }} />
                      <span className="text-sm capitalize" style={{ color: 'var(--text-primary)' }}>
                        {item.stage.replace('_', ' ')}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>{item.count}</span>
                    </div>
                    <span className="font-display text-sm" style={{ color: 'var(--netrun-green)' }}>
                      ${item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Revenue Summary">
            <div className="space-y-4">
              {metrics.map((m) => (
                <div key={m.label} className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{m.label}</span>
                  <span className="font-display text-sm" style={{ color: 'var(--text-primary)' }}>
                    {typeof m.value === 'number' && m.value > 1000
                      ? `$${m.value.toLocaleString()}`
                      : m.label === 'Win Rate' ? `${m.value}%` : m.value}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

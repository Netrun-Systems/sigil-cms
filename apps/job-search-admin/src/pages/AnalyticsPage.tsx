import { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import Header from '../components/common/Header';
import Panel from '../components/common/Panel';
import Badge from '../components/common/Badge';
import { getAnalyticsFunnel, getAnalyticsVelocity, getAnalyticsSources } from '../services/api';

const stageLabels: Record<string, string> = {
  research: 'Research', drafted: 'Drafted', applied: 'Applied',
  phone_screen: 'Phone Screen', technical: 'Technical', behavioral: 'Behavioral',
  final: 'Final', offer: 'Offer', accepted: 'Accepted',
  rejected: 'Rejected', withdrawn: 'Withdrawn',
};

export default function AnalyticsPage() {
  const [funnel, setFunnel] = useState<any[]>([]);
  const [velocity, setVelocity] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [funnelRes, velocityRes, sourcesRes] = await Promise.allSettled([
          getAnalyticsFunnel(),
          getAnalyticsVelocity(),
          getAnalyticsSources(),
        ]);
        if (funnelRes.status === 'fulfilled') setFunnel(funnelRes.value.data || []);
        if (velocityRes.status === 'fulfilled') setVelocity(velocityRes.value.data || []);
        if (sourcesRes.status === 'fulfilled') setSources(sourcesRes.value.data || []);
      } catch (err) { console.error('Failed to load analytics:', err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div>
        <Header title="Analytics" subtitle="Loading..." />
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  const maxFunnelCount = Math.max(...funnel.map(f => f.count), 1);

  return (
    <div>
      <Header title="Analytics" subtitle="Pipeline conversion and performance metrics" />

      <div className="p-4 md:p-8 space-y-6">
        {/* Funnel */}
        <Panel title="Conversion Funnel">
          {funnel.filter(f => f.count > 0).length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data yet</p>
          ) : (
            <div className="space-y-3">
              {funnel.filter(f => f.count > 0).map((stage: any) => (
                <div key={stage.stage} className="flex items-center gap-3">
                  <span className="text-xs w-24 text-right" style={{ color: 'var(--text-muted)' }}>
                    {stageLabels[stage.stage] || stage.stage}
                  </span>
                  <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: 'var(--bg-input)' }}>
                    <div className="h-full rounded-lg transition-all duration-500 flex items-center px-2"
                      style={{
                        width: `${Math.max((stage.count / maxFunnelCount) * 100, 8)}%`,
                        background: 'var(--accent)',
                      }}>
                      <span className="text-xs font-body text-white">{stage.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Velocity */}
          <Panel title="Stage Velocity (avg days)">
            {velocity.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data yet</p>
            ) : (
              <div className="space-y-2">
                {velocity.map((v: any) => (
                  <div key={v.status} className="flex items-center justify-between py-2"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {stageLabels[v.status] || v.status}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {v.count} entries
                      </span>
                      <span className="font-display text-sm" style={{ color: 'var(--accent)' }}>
                        {v.avgDaysInStage}d
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Sources */}
          <Panel title="Source Performance">
            {sources.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data yet</p>
            ) : (
              <div className="space-y-2">
                {sources.map((s: any) => (
                  <div key={s.source} className="flex items-center justify-between py-2"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <span className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
                      {s.source}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {s.total} total
                      </span>
                      <Badge
                        label={`${s.advanceRate}% advance`}
                        variant={s.advanceRate > 50 ? 'success' : s.advanceRate > 25 ? 'warning' : 'default'}
                      />
                      {s.offers > 0 && <Badge label={`${s.offers} offers`} variant="success" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import Header from '../components/common/Header';
import MetricCard from '../components/common/MetricCard';
import Panel from '../components/common/Panel';
import Badge from '../components/common/Badge';
import { getContacts, getDeals, getActivities, getDashboardMetrics } from '../services/api';

const stageColors: Record<string, string> = {
  discovery: 'info',
  qualification: 'default',
  proposal: 'warning',
  negotiation: 'sage',
  closed_won: 'success',
  closed_lost: 'error',
  lead: 'info',
  qualified: 'default',
};

interface Metric { label: string; value: number; trend?: 'up' | 'down' | 'flat' }
interface DealSummary { id: string; title: string; value: number; stage: string; contact_name: string }
interface ActivitySummary { id: string; type: string; subject: string; contact_name: string; created_at: string }

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [recentDeals, setRecentDeals] = useState<DealSummary[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivitySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [contactsRes, dealsRes, activitiesRes] = await Promise.allSettled([
          getContacts({ limit: '1' }),
          getDeals({ limit: '5' }),
          getActivities({ limit: '5' }),
        ]);

        const totalContacts = contactsRes.status === 'fulfilled'
          ? ((contactsRes.value as any)?.total ?? 0) : 0;
        const deals = dealsRes.status === 'fulfilled'
          ? ((dealsRes.value as any)?.items ?? dealsRes.value ?? []) : [];
        const activities = activitiesRes.status === 'fulfilled'
          ? ((activitiesRes.value as any)?.items ?? activitiesRes.value ?? []) : [];

        const pipelineValue = Array.isArray(deals)
          ? deals.reduce((sum: number, d: any) => sum + (d.value || 0), 0) : 0;

        setMetrics([
          { label: 'Total Contacts', value: totalContacts, trend: 'up' },
          { label: 'Active Deals', value: Array.isArray(deals) ? deals.length : 0, trend: 'up' },
          { label: 'Pipeline Value', value: pipelineValue, trend: 'up' },
          { label: 'Activities', value: Array.isArray(activities) ? activities.length : 0, trend: 'up' },
        ]);

        if (Array.isArray(deals)) {
          setRecentDeals(deals.slice(0, 3).map((d: any) => ({
            id: d.id, title: d.name || d.title || 'Untitled Deal',
            value: d.value || 0, stage: d.stage || 'lead',
            contact_name: d.contact_name || d.primary_contact_name || '',
          })));
        }
        if (Array.isArray(activities)) {
          setRecentActivities(activities.slice(0, 5).map((a: any) => ({
            id: a.id, type: a.type || 'note', subject: a.subject || 'Activity',
            contact_name: a.contact_name || '',
            created_at: a.created_at ? new Date(a.created_at).toLocaleDateString() : '',
          })));
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  useEffect(() => {
    getDashboardMetrics().then((data) => {
      if (data?.metrics) setMetrics(data.metrics as Metric[]);
    }).catch(() => {/* analytics endpoint may not exist yet */});
  }, []);

  if (loading) {
    return (
      <div>
        <Header title="Dashboard" subtitle="Sales pipeline overview" />
        <div className="p-8 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
          <p className="text-sm">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Dashboard" subtitle="Sales pipeline overview" />
      <div className="p-4 md:p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((m) => <MetricCard key={m.label} {...m} />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Panel title="Active Deals" noPadding>
            <div className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
              {recentDeals.length === 0 && (
                <p className="px-5 py-8 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                  No deals yet. Create your first opportunity.
                </p>
              )}
              {recentDeals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{deal.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{deal.contact_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge label={deal.stage} variant={stageColors[deal.stage] as any} />
                    <span className="font-display text-sm" style={{ color: 'var(--netrun-green)' }}>
                      ${(deal.value).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Recent Activity" noPadding>
            <div className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
              {recentActivities.length === 0 && (
                <p className="px-5 py-8 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                  No recent activity. Log your first interaction.
                </p>
              )}
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--bg-hover)' }}>
                      <Activity size={14} style={{ color: 'var(--netrun-green)' }} />
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{act.subject}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{act.contact_name}</p>
                    </div>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{act.created_at}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

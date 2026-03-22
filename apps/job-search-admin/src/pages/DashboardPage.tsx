import { useState, useEffect } from 'react';
import { Briefcase, Target, Send, Calendar, Search, Zap } from 'lucide-react';
import Header from '../components/common/Header';
import MetricCard from '../components/common/MetricCard';
import Panel from '../components/common/Panel';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import {
  getTrackerStats, getTracker, getInterviews, getAutomationRuns,
  getDiscoveries, runMorning, runEvening,
} from '../services/api';

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent'> = {
  research: 'default', drafted: 'info', applied: 'accent',
  phone_screen: 'warning', technical: 'warning', behavioral: 'warning',
  final: 'warning', offer: 'success', accepted: 'success',
  rejected: 'error', withdrawn: 'default',
};

const priorityVariant: Record<string, 'error' | 'warning' | 'success'> = {
  HIGH: 'error', MEDIUM: 'warning', LOW: 'success',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentTargets, setRecentTargets] = useState<any[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([]);
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [recentDiscoveries, setRecentDiscoveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [automationLoading, setAutomationLoading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [statsRes, trackerRes, interviewsRes, runsRes, discRes] = await Promise.allSettled([
          getTrackerStats(),
          getTracker({ limit: '5' } as any),
          getInterviews(),
          getAutomationRuns({ limit: '5' }),
          getDiscoveries({ limit: '5' }),
        ]);

        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (trackerRes.status === 'fulfilled') setRecentTargets(trackerRes.value.data.slice(0, 5));
        if (interviewsRes.status === 'fulfilled') {
          const now = new Date();
          setUpcomingInterviews(
            interviewsRes.value.data
              .filter((i: any) => i.scheduledAt && new Date(i.scheduledAt) >= now)
              .slice(0, 5)
          );
        }
        if (runsRes.status === 'fulfilled') setRecentRuns(runsRes.value.data.slice(0, 5));
        if (discRes.status === 'fulfilled') setRecentDiscoveries(discRes.value.data.slice(0, 5));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleRun(type: 'morning' | 'evening') {
    setAutomationLoading(type);
    try {
      if (type === 'morning') await runMorning();
      else await runEvening();
      // Refresh
      const runsRes = await getAutomationRuns({ limit: '5' });
      setRecentRuns(runsRes.data.slice(0, 5));
    } catch (err) {
      console.error(`${type} run failed:`, err);
    } finally {
      setAutomationLoading(null);
    }
  }

  if (loading) {
    return (
      <div>
        <Header title="Dashboard" subtitle="Loading..." />
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
          <p className="text-sm">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const total = stats?.total || 0;
  const applied = (stats?.byStatus?.applied || 0) + (stats?.byStatus?.phone_screen || 0) +
    (stats?.byStatus?.technical || 0) + (stats?.byStatus?.behavioral || 0) +
    (stats?.byStatus?.final || 0);
  const offers = (stats?.byStatus?.offer || 0) + (stats?.byStatus?.accepted || 0);
  const highPriority = stats?.byPriority?.HIGH || 0;

  return (
    <div>
      <Header
        title="Job Search Dashboard"
        subtitle="Pipeline overview and automation status"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" loading={automationLoading === 'morning'}
              onClick={() => handleRun('morning')}>
              <Zap size={14} /> Morning Run
            </Button>
            <Button size="sm" variant="secondary" loading={automationLoading === 'evening'}
              onClick={() => handleRun('evening')}>
              <Search size={14} /> Evening Discovery
            </Button>
          </div>
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Total Targets" value={total} icon={<Target size={16} />} />
          <MetricCard label="Active Applications" value={applied} icon={<Send size={16} />} />
          <MetricCard label="Offers" value={offers} icon={<Briefcase size={16} />} />
          <MetricCard label="High Priority" value={highPriority} icon={<Zap size={16} />} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Targets */}
          <Panel title="Recent Targets">
            {recentTargets.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No targets yet</p>
            ) : (
              <div className="space-y-3">
                {recentTargets.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between py-2"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <p className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>{t.role}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.company}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge label={t.priority} variant={priorityVariant[t.priority] || 'default'} />
                      <Badge label={t.status} variant={statusVariant[t.status] || 'default'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Upcoming Interviews */}
          <Panel title="Upcoming Interviews">
            {upcomingInterviews.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No upcoming interviews</p>
            ) : (
              <div className="space-y-3">
                {upcomingInterviews.map((i: any) => (
                  <div key={i.id} className="flex items-center justify-between py-2"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <p className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                        {i.company} - {i.role}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Calendar size={12} className="inline mr-1" />
                        {new Date(i.scheduledAt).toLocaleDateString()} at{' '}
                        {new Date(i.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Badge label={i.interviewType} variant="info" />
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Recent Discoveries */}
          <Panel title="Recent Discoveries">
            {recentDiscoveries.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Run evening discovery to find jobs</p>
            ) : (
              <div className="space-y-3">
                {recentDiscoveries.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between py-2"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <p className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>{d.role}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {d.company} {d.compensation ? `- ${d.compensation}` : ''}
                      </p>
                    </div>
                    <Badge
                      label={d.addedToTracker ? 'Added' : d.priority}
                      variant={d.addedToTracker ? 'success' : priorityVariant[d.priority] || 'default'}
                    />
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Automation Runs */}
          <Panel title="Recent Automation Runs">
            {recentRuns.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No runs yet</p>
            ) : (
              <div className="space-y-3">
                {recentRuns.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between py-2"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <p className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                        {r.runType} run
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {r.runDate} - {r.targetsProcessed || 0} processed, {r.discoveriesCount || 0} discovered
                      </p>
                    </div>
                    <Badge
                      label={r.status}
                      variant={r.status === 'completed' ? 'success' : r.status === 'running' ? 'warning' : 'error'}
                    />
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

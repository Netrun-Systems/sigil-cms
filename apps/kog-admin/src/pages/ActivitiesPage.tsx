import { useState, useEffect } from 'react';
import { Activity, Mail, Phone, Calendar, StickyNote } from 'lucide-react';
import Header from '../components/common/Header';
import { getActivities } from '../services/api';

const iconMap: Record<string, typeof Activity> = {
  call: Phone, email: Mail, meeting: Calendar,
  note: StickyNote, task: Activity, sms: Mail,
};

interface ActivityItem {
  id: string; type: string; subject: string; contact_name: string;
  description: string; created_at: string; completed: boolean;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data: any = await getActivities({ limit: '50' });
        const items = data?.items ?? data ?? [];
        setActivities(Array.isArray(items) ? items.map((a: any) => ({
          id: a.id, type: a.type || 'note', subject: a.subject || 'Activity',
          contact_name: a.contact_name || '', description: a.description || '',
          created_at: a.created_at ? new Date(a.created_at).toLocaleDateString() : '',
          completed: a.is_completed ?? a.completed ?? false,
        })) : []);
      } catch (err) { console.error('Failed to load activities:', err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <div>
      <Header title="Activities" subtitle={`${activities.length} interactions and tasks`} />
      <div className="p-4 md:p-8">
        {loading && <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Loading activities...</p>}
        {!loading && activities.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No activities yet.</p>
        )}
        <div className="space-y-3">
          {activities.map((act) => {
            const Icon = iconMap[act.type] || Activity;
            return (
              <div key={act.id} className="flex gap-4 px-6 py-4 rounded-xl transition-all"
                style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-primary)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--bg-hover)' }}>
                  <Icon size={18} style={{ color: 'var(--netrun-green)' }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>{act.subject}</span>
                    {act.completed && (
                      <span className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--success)' }}>Done</span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {act.contact_name}{act.description ? ` -- ${act.description}` : ''}
                  </p>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{act.created_at}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

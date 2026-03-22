import { useState, useEffect } from 'react';
import { Activity, BookOpen, HardDrive, FileText, Eye, Edit3, Plus, RefreshCw, RotateCcw } from 'lucide-react';
import Header from '../components/common/Header';
import Panel from '../components/common/Panel';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { getActivity } from '../services/api';

const actionIcons: Record<string, any> = {
  created: Plus,
  edited: Edit3,
  viewed: Eye,
  synced: RefreshCw,
  reverted: RotateCcw,
};

const actionVariants: Record<string, 'success' | 'info' | 'default' | 'warning' | 'accent'> = {
  created: 'success',
  edited: 'info',
  viewed: 'default',
  synced: 'accent',
  reverted: 'warning',
};

const typeIcons: Record<string, any> = {
  wiki_page: BookOpen,
  wiki: BookOpen,
  drive: HardDrive,
  external: FileText,
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 50;

  useEffect(() => {
    loadActivity();
  }, [page]);

  async function loadActivity() {
    setLoading(true);
    try {
      const res = await getActivity(limit, page * limit);
      setActivities(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load activity:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading && activities.length === 0) {
    return <div className="p-6"><p style={{ color: 'var(--text-secondary)' }}>Loading activity...</p></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Header
        title="Activity Feed"
        subtitle={`${total} total events`}
      />

      <Panel noPadding>
        {activities.length > 0 ? (
          <div>
            {activities.map((activity) => {
              const ActionIcon = actionIcons[activity.action] || Activity;
              const TypeIcon = typeIcons[activity.documentType] || FileText;
              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                >
                  <div className="p-1.5 rounded" style={{ background: 'var(--bg-input)' }}>
                    <ActionIcon size={14} style={{ color: 'var(--accent)' }} />
                  </div>
                  <TypeIcon size={14} style={{ color: 'var(--text-muted)' }} />
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      <Badge variant={actionVariants[activity.action] || 'default'}>
                        {activity.action}
                      </Badge>
                      {' '}
                      <span style={{ color: 'var(--text-muted)' }}>
                        {activity.documentType}
                      </span>
                      {activity.details?.name && (
                        <span> -- {activity.details.name}</span>
                      )}
                      {activity.details?.title && (
                        <span> -- {activity.details.title}</span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(activity.createdAt).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Activity size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No activity recorded yet.</p>
          </div>
        )}
      </Panel>

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-xs self-center" style={{ color: 'var(--text-muted)' }}>
            Page {page + 1} of {Math.ceil(total / limit)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={(page + 1) * limit >= total}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Plus, ExternalLink } from 'lucide-react';
import Header from '../components/common/Header';
import Panel from '../components/common/Panel';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { getTracker, createTrackerEntry } from '../services/api';

type ViewMode = 'kanban' | 'table';

const STAGES = [
  { key: 'research', label: 'Research', color: 'var(--text-muted)' },
  { key: 'drafted', label: 'Drafted', color: 'var(--info)' },
  { key: 'applied', label: 'Applied', color: 'var(--accent)' },
  { key: 'phone_screen', label: 'Phone', color: 'var(--warning)' },
  { key: 'technical', label: 'Technical', color: 'var(--warning)' },
  { key: 'final', label: 'Final', color: 'var(--netrun-green)' },
  { key: 'offer', label: 'Offer', color: 'var(--success)' },
];

const priorityVariant: Record<string, 'error' | 'warning' | 'success'> = {
  HIGH: 'error', MEDIUM: 'warning', LOW: 'success',
};

interface TrackerEntry {
  id: string; company: string; role: string; status: string;
  priority: string; jobUrl?: string; source?: string; updatedAt: string;
}

export default function TrackerPage() {
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ company: '', role: '', priority: 'MEDIUM', jobUrl: '' });

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    setLoading(true);
    try {
      const res = await getTracker();
      setEntries(res.data || []);
    } catch (err) { console.error('Failed to load tracker:', err); }
    finally { setLoading(false); }
  }

  async function handleAdd() {
    if (!newEntry.company || !newEntry.role) return;
    try {
      await createTrackerEntry(newEntry);
      setNewEntry({ company: '', role: '', priority: 'MEDIUM', jobUrl: '' });
      setShowAddForm(false);
      await loadEntries();
    } catch (err) { console.error('Failed to add entry:', err); }
  }

  if (loading) {
    return (
      <div>
        <Header title="Tracker" subtitle="Loading..." />
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Job Tracker"
        subtitle={`${entries.length} targets in pipeline`}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary"
              onClick={() => setViewMode(viewMode === 'kanban' ? 'table' : 'kanban')}>
              {viewMode === 'kanban' ? 'Table View' : 'Kanban View'}
            </Button>
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus size={14} /> Add Target
            </Button>
          </div>
        }
      />

      {/* Add Form */}
      {showAddForm && (
        <div className="p-4 md:px-8" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input placeholder="Company" value={newEntry.company}
              onChange={(e) => setNewEntry({ ...newEntry, company: e.target.value })}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
            <input placeholder="Role" value={newEntry.role}
              onChange={(e) => setNewEntry({ ...newEntry, role: e.target.value })}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
            <select value={newEntry.priority}
              onChange={(e) => setNewEntry({ ...newEntry, priority: e.target.value })}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 md:p-8">
        {viewMode === 'kanban' ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map(stage => {
              const stageEntries = entries.filter(e => e.status === stage.key);
              return (
                <div key={stage.key} className="min-w-[280px] flex-shrink-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                    <span className="text-xs font-display uppercase tracking-wider"
                      style={{ color: 'var(--text-secondary)' }}>
                      {stage.label}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {stageEntries.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {stageEntries.map(entry => (
                      <div key={entry.id} className="rounded-lg p-3 cursor-pointer transition-all"
                        style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-primary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-primary)'}>
                        <p className="text-sm font-body mb-1" style={{ color: 'var(--text-primary)' }}>
                          {entry.role}
                        </p>
                        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                          {entry.company}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge label={entry.priority} variant={priorityVariant[entry.priority] || 'default'} />
                          {entry.jobUrl && (
                            <a href={entry.jobUrl} target="_blank" rel="noopener noreferrer"
                              style={{ color: 'var(--accent)' }}>
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Panel noPadding>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  {['Company', 'Role', 'Status', 'Priority', 'Source', 'Updated'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id} className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{entry.company}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{entry.role}</td>
                    <td className="px-4 py-3"><Badge label={entry.status} variant="info" /></td>
                    <td className="px-4 py-3">
                      <Badge label={entry.priority} variant={priorityVariant[entry.priority] || 'default'} />
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{entry.source || '-'}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                      {new Date(entry.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}
      </div>
    </div>
  );
}

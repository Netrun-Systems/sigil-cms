import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Trash2, Inbox, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../lib/api';
import { cn } from '@netrun-cms/ui';

interface Submission {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  type: string;
  status: string;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const STATUS_OPTIONS = ['new', 'responded', 'booked', 'declined', 'archived'] as const;

const statusColors: Record<string, string> = {
  new: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
  responded: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
  booked: 'border-green-500/50 bg-green-500/10 text-green-400',
  declined: 'border-red-500/50 bg-red-500/10 text-red-400',
  archived: 'border-gray-500/50 bg-gray-500/10 text-gray-400',
};

export function ContactsList() {
  const { siteId } = useParams<{ siteId: string }>();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      const qs = params.toString() ? `?${params}` : '';
      const res = await api.get<{ data: Submission[] }>(`/sites/${siteId}/contacts${qs}`);
      setSubmissions(res.data ?? []);
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [siteId, statusFilter, typeFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/sites/${siteId}/contacts/${id}`, { status });
      setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
    } catch { /* */ }
  };

  const updateNotes = async (id: string, notes: string) => {
    try {
      await api.patch(`/sites/${siteId}/contacts/${id}`, { notes });
      setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, notes } : s));
    } catch { /* */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this submission?')) return;
    try {
      await api.delete(`/sites/${siteId}/contacts/${id}`);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch { /* */ }
  };

  const counts = submissions.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Contact Submissions</h1>

      {/* Status filter cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STATUS_OPTIONS.map((s) => (
          <button key={s} onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
            className={cn('rounded-lg border p-3 text-center transition-colors',
              statusFilter === s ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50')}>
            <p className="text-2xl font-bold">{counts[s] || 0}</p>
            <p className="text-xs text-muted-foreground capitalize">{s}</p>
          </button>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex gap-2">
        {['', 'general', 'booking', 'press', 'collaboration'].map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={cn('rounded-md px-3 py-1.5 text-sm capitalize transition-colors',
              typeFilter === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
            {t || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : submissions.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Inbox className="h-8 w-8" /><p className="text-sm">No submissions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <div key={sub.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <button onClick={() => setExpanded(expanded === sub.id ? null : sub.id)} className="flex-1 text-left">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium">{sub.name}</span>
                    <span className={cn('rounded-md px-2 py-0.5 text-xs capitalize border', statusColors[sub.status] || '')}>{sub.status}</span>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs capitalize">{sub.type}</span>
                    {expanded === sub.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                    <span>{sub.email}</span>
                    {sub.subject && <span>{sub.subject}</span>}
                    <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                  </div>
                </button>
                <button onClick={() => handleDelete(sub.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {expanded === sub.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  {/* Metadata (booking fields) */}
                  {sub.metadata && Object.keys(sub.metadata).length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      {Object.entries(sub.metadata).filter(([, v]) => v).map(([k, v]) => (
                        <div key={k}>
                          <p className="text-xs text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="font-medium">{String(v)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Message</p>
                    <p className="text-sm whitespace-pre-wrap">{sub.message}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                      <div className="flex gap-1">
                        {STATUS_OPTIONS.map((s) => (
                          <button key={s} onClick={() => updateStatus(sub.id, s)}
                            className={cn('rounded-md px-2.5 py-1 text-xs capitalize transition-colors',
                              sub.status === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                      <textarea rows={2} defaultValue={sub.notes || ''}
                        onBlur={(e) => { if (e.target.value !== (sub.notes || '')) updateNotes(sub.id, e.target.value); }}
                        className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-y"
                        placeholder="Internal notes..." />
                    </div>
                  </div>

                  <a href={`mailto:${sub.email}?subject=Re: ${sub.subject || 'Your Inquiry'}`}
                    className="inline-flex h-8 items-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                    Reply via Email
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

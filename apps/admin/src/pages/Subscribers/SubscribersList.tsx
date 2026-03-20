import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Mail, Send, Loader2, Trash2, Users } from 'lucide-react';
import { api } from '../../lib/api';
import { cn } from '@netrun-cms/ui';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  status: string;
  subscribed_at: string;
}

interface Stats {
  active: number;
  unsubscribed: number;
}

export function SubscribersList() {
  const { siteId } = useParams<{ siteId: string }>();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats>({ active: 0, unsubscribed: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'subscribers' | 'broadcast'>('subscribers');
  const [statusFilter, setStatusFilter] = useState('active');

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [subsRes, statsRes] = await Promise.all([
        api.get<{ data: Subscriber[] }>(`/sites/${siteId}/subscribers?status=${statusFilter}`),
        api.get<{ data: Stats }>(`/sites/${siteId}/subscribers/stats`),
      ]);
      setSubscribers(subsRes.data ?? []);
      setStats(statsRes.data ?? { active: 0, unsubscribed: 0 });
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [siteId, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this subscriber permanently?')) return;
    try {
      await api.delete(`/sites/${siteId}/subscribers/${id}`);
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      setStats((prev) => ({ ...prev, active: Math.max(0, prev.active - 1) }));
    } catch { /* */ }
  };

  const handleBroadcast = async (e: FormEvent) => {
    e.preventDefault();
    if (!confirm(`Send "${subject}" to ${stats.active} subscribers?`)) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await api.post<{ data: { sent: number; failed: number } }>(`/sites/${siteId}/subscribers/broadcast`, { subject, body });
      setSendResult(res.data);
      if (res.data.sent > 0) { setSubject(''); setBody(''); }
    } catch {
      setSendResult({ sent: 0, failed: -1 });
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mailing List</h1>
        <span className="rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
          {stats.active} active
        </span>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['subscribers', 'broadcast'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize',
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {t === 'subscribers' ? <><Users className="inline h-4 w-4 mr-1.5" />Subscribers</> : <><Send className="inline h-4 w-4 mr-1.5" />Send Broadcast</>}
          </button>
        ))}
      </div>

      {tab === 'subscribers' && (
        <>
          <div className="flex gap-2">
            {(['active', 'unsubscribed'] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn('rounded-md px-3 py-1.5 text-sm capitalize transition-colors',
                  statusFilter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
                {s} ({s === 'active' ? stats.active : stats.unsubscribed})
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : subscribers.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Mail className="h-8 w-8" /><p className="text-sm">No {statusFilter} subscribers</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Subscribed</th>
                  <th className="px-6 py-3 w-[60px]"></th>
                </tr></thead>
                <tbody>
                  {subscribers.map((sub) => (
                    <tr key={sub.id} className="group border-b border-border last:border-0 hover:bg-accent/50">
                      <td className="px-6 py-4 text-sm font-medium">{sub.email}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{sub.name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(sub.subscribed_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleDelete(sub.id)}
                          className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'broadcast' && (
        <div className="rounded-lg border border-border p-6">
          <form onSubmit={handleBroadcast} className="space-y-4 max-w-2xl">
            <p className="text-sm text-muted-foreground">
              Send an email to all {stats.active} active subscribers. Each email includes a personalized greeting and one-click unsubscribe link.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1.5">Subject *</label>
              <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                placeholder="e.g., New Release Out Now" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Message *</label>
              <textarea required rows={8} value={body} onChange={(e) => setBody(e.target.value)}
                className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-y"
                placeholder="Write your message..." />
            </div>

            {(subject || body) && (
              <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
                <p className="text-xs font-medium text-muted-foreground mb-2">Preview:</p>
                <p className="font-medium mb-1">Subject: {subject || '(empty)'}</p>
                <div className="text-muted-foreground whitespace-pre-wrap">
                  <p>Hey [name],</p><p className="mt-2">{body}</p>
                  <p className="mt-4 text-xs">---<br/>Unsubscribe link included automatically</p>
                </div>
              </div>
            )}

            <button type="submit" disabled={sending}
              className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? 'Sending...' : `Send to ${stats.active} subscribers`}
            </button>

            {sendResult && (
              <div className={cn('rounded-md p-3 text-sm',
                sendResult.failed === -1 ? 'bg-destructive/10 text-destructive' : sendResult.failed > 0 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500')}>
                {sendResult.failed === -1 ? 'Failed to send.' : `Sent: ${sendResult.sent} | Failed: ${sendResult.failed}`}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

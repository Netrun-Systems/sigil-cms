import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Loader2, Megaphone, X } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'maintenance' | 'resolved';
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

type AnnouncementForm = {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'maintenance' | 'resolved';
  is_active: boolean;
  starts_at: string;
  ends_at: string;
};

const defaultForm: AnnouncementForm = {
  title: '',
  message: '',
  type: 'info',
  is_active: true,
  starts_at: '',
  ends_at: '',
};

const typeBadgeColors: Record<string, string> = {
  info: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
  warning: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
  maintenance: 'border-orange-500/50 bg-orange-500/10 text-orange-400',
  resolved: 'border-green-500/50 bg-green-500/10 text-green-400',
};

export function AnnouncementsPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AnnouncementForm>(defaultForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Announcement[] }>(`/sites/${siteId}/support/announcements`);
      setAnnouncements(res.data ?? []);
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [siteId]);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (ann: Announcement) => {
    setEditingId(ann.id);
    setForm({
      title: ann.title,
      message: ann.message,
      type: ann.type,
      is_active: ann.is_active,
      starts_at: ann.starts_at ? ann.starts_at.slice(0, 16) : '',
      ends_at: ann.ends_at ? ann.ends_at.slice(0, 16) : '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      };
      if (editingId) {
        const res = await api.put<{ data: Announcement }>(`/sites/${siteId}/support/announcements/${editingId}`, payload);
        setAnnouncements((prev) => prev.map((a) => a.id === editingId ? (res.data ?? a) : a));
      } else {
        const res = await api.post<{ data: Announcement }>(`/sites/${siteId}/support/announcements`, payload);
        if (res.data) setAnnouncements((prev) => [...prev, res.data]);
      }
      setDialogOpen(false);
    } catch { /* */ } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/sites/${siteId}/support/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch { /* */ }
  };

  const toggleActive = async (ann: Announcement) => {
    try {
      await api.patch(`/sites/${siteId}/support/announcements/${ann.id}`, { is_active: !ann.is_active });
      setAnnouncements((prev) => prev.map((a) => a.id === ann.id ? { ...a, is_active: !a.is_active } : a));
    } catch { /* */ }
  };

  const updateField = <K extends keyof AnnouncementForm>(key: K, value: AnnouncementForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Support Announcements</h1>
        <button
          onClick={openCreate}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Announcement
        </button>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Megaphone className="h-8 w-8" />
          <p className="text-sm">No announcements yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {announcements.map((ann) => (
            <Card key={ann.id} className="relative overflow-hidden">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{ann.title}</h3>
                      <span className={cn('shrink-0 rounded-md px-2 py-0.5 text-xs capitalize border', typeBadgeColors[ann.type] || '')}>
                        {ann.type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{ann.message}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => openEdit(ann)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <button
                      onClick={() => toggleActive(ann)}
                      className={cn(
                        'mt-0.5 rounded-md px-2 py-0.5 text-xs font-medium border transition-colors',
                        ann.is_active
                          ? 'border-green-500/50 bg-green-500/10 text-green-500'
                          : 'border-gray-500/50 bg-gray-500/10 text-gray-400'
                      )}
                    >
                      {ann.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="font-medium">{new Date(ann.created_at).toLocaleDateString()}</p>
                  </div>
                  {ann.starts_at && (
                    <div>
                      <p className="text-xs text-muted-foreground">Starts</p>
                      <p className="font-medium">{new Date(ann.starts_at).toLocaleDateString()}</p>
                    </div>
                  )}
                  {ann.ends_at && (
                    <div>
                      <p className="text-xs text-muted-foreground">Ends</p>
                      <p className="font-medium">{new Date(ann.ends_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDialogOpen(false)}>
          <div className="w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit Announcement' : 'New Announcement'}</h2>
              <button onClick={() => setDialogOpen(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="e.g. Scheduled Maintenance"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Message</label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => updateField('message', e.target.value)}
                  className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                  placeholder="Announcement details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => updateField('type', e.target.value as AnnouncementForm['type'])}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => updateField('is_active', e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    Active
                  </label>
                </div>
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => updateField('starts_at', e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => updateField('ends_at', e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDialogOpen(false)}
                className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim()}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

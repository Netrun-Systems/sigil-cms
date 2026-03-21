import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Loader2, CalendarDays, X } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface BookingService {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  buffer_minutes: number;
  advance_notice_hours: number;
  max_daily_bookings: number;
  color: string;
  is_active: boolean;
  created_at: string;
}

type ServiceForm = {
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  buffer_minutes: number;
  advance_notice_hours: number;
  max_daily_bookings: number;
  color: string;
  is_active: boolean;
};

const defaultForm: ServiceForm = {
  name: '',
  description: '',
  duration_minutes: 60,
  price_cents: 0,
  buffer_minutes: 15,
  advance_notice_hours: 24,
  max_daily_bookings: 8,
  color: '#90b9ab',
  is_active: true,
};

function formatPrice(cents: number): string {
  if (cents === 0) return 'Free';
  return `$${(cents / 100).toFixed(2)}`;
}

export function ServicesList() {
  const { siteId } = useParams<{ siteId: string }>();
  const [services, setServices] = useState<BookingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(defaultForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: BookingService[] }>(`/sites/${siteId}/booking/services`);
      setServices(res.data ?? []);
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [siteId]);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (service: BookingService) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      price_cents: service.price_cents,
      buffer_minutes: service.buffer_minutes,
      advance_notice_hours: service.advance_notice_hours,
      max_daily_bookings: service.max_daily_bookings,
      color: service.color,
      is_active: service.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        const res = await api.put<{ data: BookingService }>(`/sites/${siteId}/booking/services/${editingId}`, form);
        setServices((prev) => prev.map((s) => s.id === editingId ? (res.data ?? s) : s));
      } else {
        const res = await api.post<{ data: BookingService }>(`/sites/${siteId}/booking/services`, form);
        if (res.data) setServices((prev) => [...prev, res.data]);
      }
      setDialogOpen(false);
    } catch { /* */ } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    try {
      await api.delete(`/sites/${siteId}/booking/services/${id}`);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch { /* */ }
  };

  const toggleActive = async (service: BookingService) => {
    const updated = { ...service, is_active: !service.is_active };
    try {
      await api.patch(`/sites/${siteId}/booking/services/${service.id}`, { is_active: updated.is_active });
      setServices((prev) => prev.map((s) => s.id === service.id ? { ...s, is_active: updated.is_active } : s));
    } catch { /* */ }
  };

  const updateField = <K extends keyof ServiceForm>(key: K, value: ServiceForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Booking Services</h1>
        <button
          onClick={openCreate}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Service
        </button>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : services.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
          <CalendarDays className="h-8 w-8" />
          <p className="text-sm">No services configured</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="relative overflow-hidden">
              <div className="h-1" style={{ backgroundColor: service.color }} />
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{service.name}</h3>
                    {service.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(service)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-medium">{service.duration_minutes} min</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-medium">{formatPrice(service.price_cents)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Buffer</p>
                    <p className="font-medium">{service.buffer_minutes} min</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Advance Notice</p>
                    <p className="font-medium">{service.advance_notice_hours}h</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Max Daily</p>
                    <p className="font-medium">{service.max_daily_bookings}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <button
                      onClick={() => toggleActive(service)}
                      className={cn(
                        'mt-0.5 rounded-md px-2 py-0.5 text-xs font-medium border transition-colors',
                        service.is_active
                          ? 'border-green-500/50 bg-green-500/10 text-green-500'
                          : 'border-gray-500/50 bg-gray-500/10 text-gray-400'
                      )}
                    >
                      {service.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
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
              <h2 className="text-lg font-semibold">{editingId ? 'Edit Service' : 'Add Service'}</h2>
              <button onClick={() => setDialogOpen(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="e.g. Initial Consultation"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                  placeholder="Brief description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Duration (min)</label>
                  <input
                    type="number"
                    min={5}
                    value={form.duration_minutes}
                    onChange={(e) => updateField('duration_minutes', parseInt(e.target.value) || 0)}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Price ($)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={(form.price_cents / 100).toFixed(2)}
                    onChange={(e) => updateField('price_cents', Math.round(parseFloat(e.target.value || '0') * 100))}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Buffer (min)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.buffer_minutes}
                    onChange={(e) => updateField('buffer_minutes', parseInt(e.target.value) || 0)}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Advance Notice (hrs)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.advance_notice_hours}
                    onChange={(e) => updateField('advance_notice_hours', parseInt(e.target.value) || 0)}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Daily Bookings</label>
                  <input
                    type="number"
                    min={1}
                    value={form.max_daily_bookings}
                    onChange={(e) => updateField('max_daily_bookings', parseInt(e.target.value) || 1)}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => updateField('color', e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-0.5"
                    />
                    <input
                      value={form.color}
                      onChange={(e) => updateField('color', e.target.value)}
                      className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
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
                disabled={saving || !form.name.trim()}
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

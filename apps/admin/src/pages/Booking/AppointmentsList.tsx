import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, CalendarCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface Appointment {
  id: string;
  service_id: string;
  service_name: string;
  customer_name: string;
  customer_email: string;
  customer_notes: string | null;
  admin_notes: string | null;
  status: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

interface BookingService {
  id: string;
  name: string;
}

const STATUS_OPTIONS = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'] as const;

const statusColors: Record<string, string> = {
  pending: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
  confirmed: 'border-green-500/50 bg-green-500/10 text-green-400',
  cancelled: 'border-red-500/50 bg-red-500/10 text-red-400',
  completed: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
  no_show: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

export function AppointmentsList() {
  const { siteId } = useParams<{ siteId: string }>();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadServices = async () => {
    try {
      const res = await api.get<{ data: BookingService[] }>(`/sites/${siteId}/booking/services`);
      setServices(res.data ?? []);
    } catch { /* */ }
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (serviceFilter) params.set('service_id', serviceFilter);
      if (dateFilter) params.set('date', dateFilter);
      const qs = params.toString() ? `?${params}` : '';
      const res = await api.get<{ data: Appointment[] }>(`/sites/${siteId}/booking/appointments${qs}`);
      setAppointments(res.data ?? []);
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { loadServices(); }, [siteId]);
  useEffect(() => { loadAppointments(); }, [siteId, statusFilter, serviceFilter, dateFilter]);

  const updateAppointment = async (id: string, patch: Partial<Appointment>) => {
    try {
      await api.patch(`/sites/${siteId}/booking/appointments/${id}`, patch);
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, ...patch } : a));
    } catch { /* */ }
  };

  const counts = appointments.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Appointments</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
            className={cn(
              'rounded-lg border p-3 text-center transition-colors',
              statusFilter === s ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            )}
          >
            <p className="text-2xl font-bold">{counts[s] || 0}</p>
            <p className="text-xs text-muted-foreground capitalize">{s.replace('_', ' ')}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Service</label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All Services</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            {(dateFilter || serviceFilter || statusFilter) && (
              <button
                onClick={() => { setDateFilter(''); setServiceFilter(''); setStatusFilter(''); }}
                className="mt-auto h-9 rounded-md px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appointment list */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
          <CalendarCheck className="h-8 w-8" />
          <p className="text-sm">No appointments</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <div key={appt.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <button
                  onClick={() => setExpanded(expanded === appt.id ? null : appt.id)}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium">{appt.customer_name}</span>
                    <span className={cn('rounded-md px-2 py-0.5 text-xs capitalize border', statusColors[appt.status] || '')}>
                      {appt.status.replace('_', ' ')}
                    </span>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs">{appt.service_name}</span>
                    {expanded === appt.id
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                    <span>{formatDate(appt.start_time)}</span>
                    <span>{formatTime(appt.start_time)} - {formatTime(appt.end_time)}</span>
                    <span>{appt.customer_email}</span>
                  </div>
                </button>
              </div>

              {expanded === appt.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  {appt.customer_notes && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Customer Notes</p>
                      <p className="text-sm whitespace-pre-wrap">{appt.customer_notes}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                      <div className="flex gap-1 flex-wrap">
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => updateAppointment(appt.id, { status: s })}
                            className={cn(
                              'rounded-md px-2.5 py-1 text-xs capitalize transition-colors',
                              appt.status === s
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )}
                          >
                            {s.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Admin Notes</p>
                      <textarea
                        rows={2}
                        defaultValue={appt.admin_notes || ''}
                        onBlur={(e) => {
                          if (e.target.value !== (appt.admin_notes || '')) {
                            updateAppointment(appt.id, { admin_notes: e.target.value });
                          }
                        }}
                        className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-y"
                        placeholder="Internal notes..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

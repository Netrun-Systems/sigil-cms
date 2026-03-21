import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Loader2, Clock, Save } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface TimeSlot {
  id?: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface AvailabilityRule {
  id?: string;
  day_of_week: number;
  service_id: string | null;
  slots: TimeSlot[];
}

interface BookingService {
  id: string;
  name: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const defaultSlot: TimeSlot = { start_time: '09:00', end_time: '17:00', is_active: true };

function createEmptyWeek(): AvailabilityRule[] {
  return DAYS.map((_, i) => ({
    day_of_week: i,
    service_id: null,
    slots: i >= 1 && i <= 5 ? [{ ...defaultSlot }] : [],
  }));
}

export function AvailabilityEditor() {
  const { siteId } = useParams<{ siteId: string }>();
  const [rules, setRules] = useState<AvailabilityRule[]>(createEmptyWeek());
  const [services, setServices] = useState<BookingService[]>([]);
  const [serviceFilter, setServiceFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const loadServices = async () => {
    try {
      const res = await api.get<{ data: BookingService[] }>(`/sites/${siteId}/booking/services`);
      setServices(res.data ?? []);
    } catch { /* */ }
  };

  const loadRules = async () => {
    setLoading(true);
    try {
      const qs = serviceFilter ? `?service_id=${serviceFilter}` : '';
      const res = await api.get<{ data: AvailabilityRule[] }>(`/sites/${siteId}/booking/availability${qs}`);
      const fetched = res.data ?? [];
      if (fetched.length > 0) {
        // Merge fetched into a full 7-day structure
        const week = createEmptyWeek();
        for (const rule of fetched) {
          const day = week[rule.day_of_week];
          if (day) {
            day.id = rule.id;
            day.service_id = rule.service_id;
            day.slots = rule.slots.length > 0 ? rule.slots : [];
          }
        }
        setRules(week);
      } else {
        setRules(createEmptyWeek());
      }
      setDirty(false);
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { loadServices(); }, [siteId]);
  useEffect(() => { loadRules(); }, [siteId, serviceFilter]);

  const updateSlot = (dayIndex: number, slotIndex: number, field: keyof TimeSlot, value: string | boolean) => {
    setRules((prev) => {
      const next = [...prev];
      const day = { ...next[dayIndex], slots: [...next[dayIndex].slots] };
      day.slots[slotIndex] = { ...day.slots[slotIndex], [field]: value };
      next[dayIndex] = day;
      return next;
    });
    setDirty(true);
  };

  const addSlot = (dayIndex: number) => {
    setRules((prev) => {
      const next = [...prev];
      const day = { ...next[dayIndex], slots: [...next[dayIndex].slots, { ...defaultSlot }] };
      next[dayIndex] = day;
      return next;
    });
    setDirty(true);
  };

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    setRules((prev) => {
      const next = [...prev];
      const day = { ...next[dayIndex], slots: next[dayIndex].slots.filter((_, i) => i !== slotIndex) };
      next[dayIndex] = day;
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = rules.map((r) => ({
        day_of_week: r.day_of_week,
        service_id: serviceFilter || null,
        slots: r.slots,
      }));
      await api.put(`/sites/${siteId}/booking/availability`, { rules: payload });
      setDirty(false);
    } catch { /* */ } finally { setSaving(false); }
  };

  // Calculate visual bar position (percentage of 24h)
  const timeToPercent = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return ((h * 60 + m) / 1440) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Availability Schedule</h1>
        <div className="flex items-center gap-3">
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All Services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Visual timeline */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {/* Hour markers */}
                <div className="flex items-center gap-2">
                  <div className="w-24 shrink-0" />
                  <div className="relative flex-1 h-4">
                    {[0, 6, 9, 12, 15, 18, 21].map((h) => (
                      <span
                        key={h}
                        className="absolute text-[10px] text-muted-foreground -translate-x-1/2"
                        style={{ left: `${(h / 24) * 100}%` }}
                      >
                        {h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}
                      </span>
                    ))}
                  </div>
                </div>

                {rules.map((day, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={cn(
                      'w-24 shrink-0 text-sm font-medium',
                      day.slots.length === 0 ? 'text-muted-foreground' : ''
                    )}>
                      {DAYS[i].slice(0, 3)}
                    </span>
                    <div className="relative flex-1 h-6 rounded-md bg-muted/50">
                      {day.slots.filter((s) => s.is_active).map((slot, si) => {
                        const left = timeToPercent(slot.start_time);
                        const width = timeToPercent(slot.end_time) - left;
                        return (
                          <div
                            key={si}
                            className="absolute top-0.5 bottom-0.5 rounded bg-primary/70"
                            style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
                            title={`${slot.start_time} - ${slot.end_time}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Day-by-day editor */}
          {rules.map((day, dayIndex) => (
            <Card key={dayIndex}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className={cn(
                    'font-medium',
                    day.slots.length === 0 ? 'text-muted-foreground' : ''
                  )}>
                    {DAYS[dayIndex]}
                    {day.slots.length === 0 && <span className="ml-2 text-xs text-muted-foreground">(closed)</span>}
                  </h3>
                  <button
                    onClick={() => addSlot(dayIndex)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Add Slot
                  </button>
                </div>

                {day.slots.length > 0 && (
                  <div className="space-y-2">
                    {day.slots.map((slot, slotIndex) => (
                      <div key={slotIndex} className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <input
                          type="time"
                          value={slot.start_time}
                          onChange={(e) => updateSlot(dayIndex, slotIndex, 'start_time', e.target.value)}
                          className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <span className="text-sm text-muted-foreground">to</span>
                        <input
                          type="time"
                          value={slot.end_time}
                          onChange={(e) => updateSlot(dayIndex, slotIndex, 'end_time', e.target.value)}
                          className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <button
                          onClick={() => updateSlot(dayIndex, slotIndex, 'is_active', !slot.is_active)}
                          className={cn(
                            'rounded-md px-2 py-1 text-xs font-medium border transition-colors',
                            slot.is_active
                              ? 'border-green-500/50 bg-green-500/10 text-green-500'
                              : 'border-gray-500/50 bg-gray-500/10 text-gray-400'
                          )}
                        >
                          {slot.is_active ? 'Active' : 'Off'}
                        </button>
                        <button
                          onClick={() => removeSlot(dayIndex, slotIndex)}
                          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Loader2, Clock, Save } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const defaultSlot = { start_time: '09:00', end_time: '17:00', is_active: true };
function createEmptyWeek() {
    return DAYS.map((_, i) => ({
        day_of_week: i,
        service_id: null,
        slots: i >= 1 && i <= 5 ? [{ ...defaultSlot }] : [],
    }));
}
export function AvailabilityEditor() {
    const { siteId } = useParams();
    const [rules, setRules] = useState(createEmptyWeek());
    const [services, setServices] = useState([]);
    const [serviceFilter, setServiceFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const loadServices = async () => {
        try {
            const res = await api.get(`/sites/${siteId}/booking/services`);
            setServices(res.data ?? []);
        }
        catch { /* */ }
    };
    const loadRules = async () => {
        setLoading(true);
        try {
            const qs = serviceFilter ? `?service_id=${serviceFilter}` : '';
            const res = await api.get(`/sites/${siteId}/booking/availability${qs}`);
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
            }
            else {
                setRules(createEmptyWeek());
            }
            setDirty(false);
        }
        catch { /* */ }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { loadServices(); }, [siteId]);
    useEffect(() => { loadRules(); }, [siteId, serviceFilter]);
    const updateSlot = (dayIndex, slotIndex, field, value) => {
        setRules((prev) => {
            const next = [...prev];
            const day = { ...next[dayIndex], slots: [...next[dayIndex].slots] };
            day.slots[slotIndex] = { ...day.slots[slotIndex], [field]: value };
            next[dayIndex] = day;
            return next;
        });
        setDirty(true);
    };
    const addSlot = (dayIndex) => {
        setRules((prev) => {
            const next = [...prev];
            const day = { ...next[dayIndex], slots: [...next[dayIndex].slots, { ...defaultSlot }] };
            next[dayIndex] = day;
            return next;
        });
        setDirty(true);
    };
    const removeSlot = (dayIndex, slotIndex) => {
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
        }
        catch { /* */ }
        finally {
            setSaving(false);
        }
    };
    // Calculate visual bar position (percentage of 24h)
    const timeToPercent = (time) => {
        const [h, m] = time.split(':').map(Number);
        return ((h * 60 + m) / 1440) * 100;
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Availability Schedule" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("select", { value: serviceFilter, onChange: (e) => setServiceFilter(e.target.value), className: "flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: [_jsx("option", { value: "", children: "All Services" }), services.map((s) => (_jsx("option", { value: s.id, children: s.name }, s.id)))] }), _jsxs("button", { onClick: handleSave, disabled: saving || !dirty, className: "flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50", children: [saving ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : _jsx(Save, { className: "h-4 w-4" }), "Save"] })] })] }), loading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : (_jsxs("div", { className: "space-y-4", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-24 shrink-0" }), _jsx("div", { className: "relative flex-1 h-4", children: [0, 6, 9, 12, 15, 18, 21].map((h) => (_jsx("span", { className: "absolute text-[10px] text-muted-foreground -translate-x-1/2", style: { left: `${(h / 24) * 100}%` }, children: h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p` }, h))) })] }), rules.map((day, i) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: cn('w-24 shrink-0 text-sm font-medium', day.slots.length === 0 ? 'text-muted-foreground' : ''), children: DAYS[i].slice(0, 3) }), _jsx("div", { className: "relative flex-1 h-6 rounded-md bg-muted/50", children: day.slots.filter((s) => s.is_active).map((slot, si) => {
                                                    const left = timeToPercent(slot.start_time);
                                                    const width = timeToPercent(slot.end_time) - left;
                                                    return (_jsx("div", { className: "absolute top-0.5 bottom-0.5 rounded bg-primary/70", style: { left: `${left}%`, width: `${Math.max(width, 1)}%` }, title: `${slot.start_time} - ${slot.end_time}` }, si));
                                                }) })] }, i)))] }) }) }), rules.map((day, dayIndex) => (_jsx(Card, { children: _jsxs(CardContent, { className: "pt-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("h3", { className: cn('font-medium', day.slots.length === 0 ? 'text-muted-foreground' : ''), children: [DAYS[dayIndex], day.slots.length === 0 && _jsx("span", { className: "ml-2 text-xs text-muted-foreground", children: "(closed)" })] }), _jsxs("button", { onClick: () => addSlot(dayIndex), className: "flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors", children: [_jsx(Plus, { className: "h-3 w-3" }), " Add Slot"] })] }), day.slots.length > 0 && (_jsx("div", { className: "space-y-2", children: day.slots.map((slot, slotIndex) => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Clock, { className: "h-4 w-4 text-muted-foreground shrink-0" }), _jsx("input", { type: "time", value: slot.start_time, onChange: (e) => updateSlot(dayIndex, slotIndex, 'start_time', e.target.value), className: "flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" }), _jsx("span", { className: "text-sm text-muted-foreground", children: "to" }), _jsx("input", { type: "time", value: slot.end_time, onChange: (e) => updateSlot(dayIndex, slotIndex, 'end_time', e.target.value), className: "flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" }), _jsx("button", { onClick: () => updateSlot(dayIndex, slotIndex, 'is_active', !slot.is_active), className: cn('rounded-md px-2 py-1 text-xs font-medium border transition-colors', slot.is_active
                                                    ? 'border-green-500/50 bg-green-500/10 text-green-500'
                                                    : 'border-gray-500/50 bg-gray-500/10 text-gray-400'), children: slot.is_active ? 'Active' : 'Off' }), _jsx("button", { onClick: () => removeSlot(dayIndex, slotIndex), className: "rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-destructive", children: _jsx(Trash2, { className: "h-4 w-4" }) })] }, slotIndex))) }))] }) }, dayIndex)))] }))] }));
}
//# sourceMappingURL=AvailabilityEditor.js.map
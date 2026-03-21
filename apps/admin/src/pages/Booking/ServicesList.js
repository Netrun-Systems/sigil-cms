import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Loader2, CalendarDays, X } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
const defaultForm = {
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
function formatPrice(cents) {
    if (cents === 0)
        return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
}
export function ServicesList() {
    const { siteId } = useParams();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/sites/${siteId}/booking/services`);
            setServices(res.data ?? []);
        }
        catch { /* */ }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [siteId]);
    const openCreate = () => {
        setEditingId(null);
        setForm(defaultForm);
        setDialogOpen(true);
    };
    const openEdit = (service) => {
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
                const res = await api.put(`/sites/${siteId}/booking/services/${editingId}`, form);
                setServices((prev) => prev.map((s) => s.id === editingId ? (res.data ?? s) : s));
            }
            else {
                const res = await api.post(`/sites/${siteId}/booking/services`, form);
                if (res.data)
                    setServices((prev) => [...prev, res.data]);
            }
            setDialogOpen(false);
        }
        catch { /* */ }
        finally {
            setSaving(false);
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('Delete this service?'))
            return;
        try {
            await api.delete(`/sites/${siteId}/booking/services/${id}`);
            setServices((prev) => prev.filter((s) => s.id !== id));
        }
        catch { /* */ }
    };
    const toggleActive = async (service) => {
        const updated = { ...service, is_active: !service.is_active };
        try {
            await api.patch(`/sites/${siteId}/booking/services/${service.id}`, { is_active: updated.is_active });
            setServices((prev) => prev.map((s) => s.id === service.id ? { ...s, is_active: updated.is_active } : s));
        }
        catch { /* */ }
    };
    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Booking Services" }), _jsxs("button", { onClick: openCreate, className: "flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90", children: [_jsx(Plus, { className: "h-4 w-4" }), " Add Service"] })] }), loading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : services.length === 0 ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(CalendarDays, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: "No services configured" })] })) : (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: services.map((service) => (_jsxs(Card, { className: "relative overflow-hidden", children: [_jsx("div", { className: "h-1", style: { backgroundColor: service.color } }), _jsxs(CardContent, { className: "pt-4 space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: service.name }), service.description && (_jsx("p", { className: "mt-1 text-sm text-muted-foreground line-clamp-2", children: service.description }))] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: () => openEdit(service), className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground", children: _jsx(Pencil, { className: "h-4 w-4" }) }), _jsx("button", { onClick: () => handleDelete(service.id), className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive", children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Duration" }), _jsxs("p", { className: "font-medium", children: [service.duration_minutes, " min"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Price" }), _jsx("p", { className: "font-medium", children: formatPrice(service.price_cents) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Buffer" }), _jsxs("p", { className: "font-medium", children: [service.buffer_minutes, " min"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Advance Notice" }), _jsxs("p", { className: "font-medium", children: [service.advance_notice_hours, "h"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Max Daily" }), _jsx("p", { className: "font-medium", children: service.max_daily_bookings })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Status" }), _jsx("button", { onClick: () => toggleActive(service), className: cn('mt-0.5 rounded-md px-2 py-0.5 text-xs font-medium border transition-colors', service.is_active
                                                        ? 'border-green-500/50 bg-green-500/10 text-green-500'
                                                        : 'border-gray-500/50 bg-gray-500/10 text-gray-400'), children: service.is_active ? 'Active' : 'Inactive' })] })] })] })] }, service.id))) })), dialogOpen && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", onClick: () => setDialogOpen(false), children: _jsxs("div", { className: "w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg space-y-4", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold", children: editingId ? 'Edit Service' : 'Add Service' }), _jsx("button", { onClick: () => setDialogOpen(false), className: "rounded-md p-1 text-muted-foreground hover:text-foreground", children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Name" }), _jsx("input", { value: form.name, onChange: (e) => updateField('name', e.target.value), className: "mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", placeholder: "e.g. Initial Consultation" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Description" }), _jsx("textarea", { rows: 2, value: form.description, onChange: (e) => updateField('description', e.target.value), className: "mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y", placeholder: "Brief description..." })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Duration (min)" }), _jsx("input", { type: "number", min: 5, value: form.duration_minutes, onChange: (e) => updateField('duration_minutes', parseInt(e.target.value) || 0), className: "mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Price ($)" }), _jsx("input", { type: "number", min: 0, step: 0.01, value: (form.price_cents / 100).toFixed(2), onChange: (e) => updateField('price_cents', Math.round(parseFloat(e.target.value || '0') * 100)), className: "mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Buffer (min)" }), _jsx("input", { type: "number", min: 0, value: form.buffer_minutes, onChange: (e) => updateField('buffer_minutes', parseInt(e.target.value) || 0), className: "mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Advance Notice (hrs)" }), _jsx("input", { type: "number", min: 0, value: form.advance_notice_hours, onChange: (e) => updateField('advance_notice_hours', parseInt(e.target.value) || 0), className: "mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Max Daily Bookings" }), _jsx("input", { type: "number", min: 1, value: form.max_daily_bookings, onChange: (e) => updateField('max_daily_bookings', parseInt(e.target.value) || 1), className: "mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Color" }), _jsxs("div", { className: "mt-1 flex items-center gap-2", children: [_jsx("input", { type: "color", value: form.color, onChange: (e) => updateField('color', e.target.value), className: "h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-0.5" }), _jsx("input", { value: form.color, onChange: (e) => updateField('color', e.target.value), className: "flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] })] })] })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx("button", { onClick: () => setDialogOpen(false), className: "rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors", children: "Cancel" }), _jsxs("button", { onClick: handleSave, disabled: saving || !form.name.trim(), className: "flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50", children: [saving && _jsx(Loader2, { className: "h-4 w-4 animate-spin" }), editingId ? 'Update' : 'Create'] })] })] }) }))] }));
}
//# sourceMappingURL=ServicesList.js.map
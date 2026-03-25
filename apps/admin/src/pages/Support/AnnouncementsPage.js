import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Loader2, Megaphone, X } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
const defaultForm = {
    title: '',
    message: '',
    type: 'info',
    is_active: true,
    starts_at: '',
    ends_at: '',
};
const typeBadgeColors = {
    info: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
    warning: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
    maintenance: 'border-orange-500/50 bg-orange-500/10 text-orange-400',
    resolved: 'border-green-500/50 bg-green-500/10 text-green-400',
};
export function AnnouncementsPage() {
    const { siteId } = useParams();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/sites/${siteId}/support/announcements`);
            setAnnouncements(res.data ?? []);
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
    const openEdit = (ann) => {
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
                const res = await api.put(`/sites/${siteId}/support/announcements/${editingId}`, payload);
                setAnnouncements((prev) => prev.map((a) => a.id === editingId ? (res.data ?? a) : a));
            }
            else {
                const res = await api.post(`/sites/${siteId}/support/announcements`, payload);
                if (res.data)
                    setAnnouncements((prev) => [...prev, res.data]);
            }
            setDialogOpen(false);
        }
        catch { /* */ }
        finally {
            setSaving(false);
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('Delete this announcement?'))
            return;
        try {
            await api.delete(`/sites/${siteId}/support/announcements/${id}`);
            setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        }
        catch { /* */ }
    };
    const toggleActive = async (ann) => {
        try {
            await api.patch(`/sites/${siteId}/support/announcements/${ann.id}`, { is_active: !ann.is_active });
            setAnnouncements((prev) => prev.map((a) => a.id === ann.id ? { ...a, is_active: !a.is_active } : a));
        }
        catch { /* */ }
    };
    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Support Announcements" }), _jsxs("button", { onClick: openCreate, className: "flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90", children: [_jsx(Plus, { className: "h-4 w-4" }), " New Announcement"] })] }), loading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : announcements.length === 0 ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(Megaphone, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: "No announcements yet" })] })) : (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: announcements.map((ann) => (_jsx(Card, { className: "relative overflow-hidden", children: _jsxs(CardContent, { className: "pt-4 space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("h3", { className: "font-medium truncate", children: ann.title }), _jsx("span", { className: cn('shrink-0 rounded-md px-2 py-0.5 text-xs capitalize border', typeBadgeColors[ann.type] || ''), children: ann.type })] }), _jsx("p", { className: "text-sm text-muted-foreground line-clamp-2", children: ann.message })] }), _jsxs("div", { className: "flex items-center gap-1 shrink-0 ml-2", children: [_jsx("button", { onClick: () => openEdit(ann), className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground", children: _jsx(Pencil, { className: "h-4 w-4" }) }), _jsx("button", { onClick: () => handleDelete(ann.id), className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive", children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Status" }), _jsx("button", { onClick: () => toggleActive(ann), className: cn('mt-0.5 rounded-md px-2 py-0.5 text-xs font-medium border transition-colors', ann.is_active
                                                    ? 'border-green-500/50 bg-green-500/10 text-green-500'
                                                    : 'border-gray-500/50 bg-gray-500/10 text-gray-400'), children: ann.is_active ? 'Active' : 'Inactive' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Created" }), _jsx("p", { className: "font-medium", children: new Date(ann.created_at).toLocaleDateString() })] }), ann.starts_at && (_jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Starts" }), _jsx("p", { className: "font-medium", children: new Date(ann.starts_at).toLocaleDateString() })] })), ann.ends_at && (_jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Ends" }), _jsx("p", { className: "font-medium", children: new Date(ann.ends_at).toLocaleDateString() })] }))] })] }) }, ann.id))) })), dialogOpen && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", onClick: () => setDialogOpen(false), children: _jsxs("div", { className: "w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg space-y-4", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold", children: editingId ? 'Edit Announcement' : 'New Announcement' }), _jsx("button", { onClick: () => setDialogOpen(false), className: "rounded-md p-1 text-muted-foreground hover:text-foreground", children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Title" }), _jsx("input", { value: form.title, onChange: (e) => updateField('title', e.target.value), className: "mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", placeholder: "e.g. Scheduled Maintenance" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Message" }), _jsx("textarea", { rows: 3, value: form.message, onChange: (e) => updateField('message', e.target.value), className: "mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y", placeholder: "Announcement details..." })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Type" }), _jsxs("select", { value: form.type, onChange: (e) => updateField('type', e.target.value), className: "mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: [_jsx("option", { value: "info", children: "Info" }), _jsx("option", { value: "warning", children: "Warning" }), _jsx("option", { value: "maintenance", children: "Maintenance" }), _jsx("option", { value: "resolved", children: "Resolved" })] })] }), _jsx("div", { className: "flex items-end", children: _jsxs("label", { className: "flex items-center gap-2 text-sm font-medium cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: form.is_active, onChange: (e) => updateField('is_active', e.target.checked), className: "h-4 w-4 rounded border-input" }), "Active"] }) }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Start Date" }), _jsx("input", { type: "datetime-local", value: form.starts_at, onChange: (e) => updateField('starts_at', e.target.value), className: "mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "End Date" }), _jsx("input", { type: "datetime-local", value: form.ends_at, onChange: (e) => updateField('ends_at', e.target.value), className: "mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] })] })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx("button", { onClick: () => setDialogOpen(false), className: "rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors", children: "Cancel" }), _jsxs("button", { onClick: handleSave, disabled: saving || !form.title.trim(), className: "flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50", children: [saving && _jsx(Loader2, { className: "h-4 w-4 animate-spin" }), editingId ? 'Update' : 'Create'] })] })] }) }))] }));
}
//# sourceMappingURL=AnnouncementsPage.js.map
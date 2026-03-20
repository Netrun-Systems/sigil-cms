import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Trash2, Inbox, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../lib/api';
import { cn } from '@netrun-cms/ui';
const STATUS_OPTIONS = ['new', 'responded', 'booked', 'declined', 'archived'];
const statusColors = {
    new: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
    responded: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
    booked: 'border-green-500/50 bg-green-500/10 text-green-400',
    declined: 'border-red-500/50 bg-red-500/10 text-red-400',
    archived: 'border-gray-500/50 bg-gray-500/10 text-gray-400',
};
export function ContactsList() {
    const { siteId } = useParams();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [expanded, setExpanded] = useState(null);
    const load = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter)
                params.set('status', statusFilter);
            if (typeFilter)
                params.set('type', typeFilter);
            const qs = params.toString() ? `?${params}` : '';
            const res = await api.get(`/sites/${siteId}/contacts${qs}`);
            setSubmissions(res.data ?? []);
        }
        catch { /* */ }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [siteId, statusFilter, typeFilter]);
    const updateStatus = async (id, status) => {
        try {
            await api.patch(`/sites/${siteId}/contacts/${id}`, { status });
            setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
        }
        catch { /* */ }
    };
    const updateNotes = async (id, notes) => {
        try {
            await api.patch(`/sites/${siteId}/contacts/${id}`, { notes });
            setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, notes } : s));
        }
        catch { /* */ }
    };
    const handleDelete = async (id) => {
        if (!confirm('Delete this submission?'))
            return;
        try {
            await api.delete(`/sites/${siteId}/contacts/${id}`);
            setSubmissions((prev) => prev.filter((s) => s.id !== id));
        }
        catch { /* */ }
    };
    const counts = submissions.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
    }, {});
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Contact Submissions" }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-5 gap-3", children: STATUS_OPTIONS.map((s) => (_jsxs("button", { onClick: () => setStatusFilter(statusFilter === s ? '' : s), className: cn('rounded-lg border p-3 text-center transition-colors', statusFilter === s ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'), children: [_jsx("p", { className: "text-2xl font-bold", children: counts[s] || 0 }), _jsx("p", { className: "text-xs text-muted-foreground capitalize", children: s })] }, s))) }), _jsx("div", { className: "flex gap-2", children: ['', 'general', 'booking', 'press', 'collaboration'].map((t) => (_jsx("button", { onClick: () => setTypeFilter(t), className: cn('rounded-md px-3 py-1.5 text-sm capitalize transition-colors', typeFilter === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'), children: t || 'All' }, t))) }), loading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : submissions.length === 0 ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(Inbox, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: "No submissions" })] })) : (_jsx("div", { className: "space-y-3", children: submissions.map((sub) => (_jsxs("div", { className: "rounded-lg border border-border p-4", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("button", { onClick: () => setExpanded(expanded === sub.id ? null : sub.id), className: "flex-1 text-left", children: [_jsxs("div", { className: "flex items-center gap-3 mb-1", children: [_jsx("span", { className: "font-medium", children: sub.name }), _jsx("span", { className: cn('rounded-md px-2 py-0.5 text-xs capitalize border', statusColors[sub.status] || ''), children: sub.status }), _jsx("span", { className: "rounded-md bg-muted px-2 py-0.5 text-xs capitalize", children: sub.type }), expanded === sub.id ? _jsx(ChevronUp, { className: "h-4 w-4 text-muted-foreground" }) : _jsx(ChevronDown, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs("div", { className: "flex flex-wrap gap-x-4 text-sm text-muted-foreground", children: [_jsx("span", { children: sub.email }), sub.subject && _jsx("span", { children: sub.subject }), _jsx("span", { children: new Date(sub.created_at).toLocaleDateString() })] })] }), _jsx("button", { onClick: () => handleDelete(sub.id), className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive", children: _jsx(Trash2, { className: "h-4 w-4" }) })] }), expanded === sub.id && (_jsxs("div", { className: "mt-4 pt-4 border-t border-border space-y-4", children: [sub.metadata && Object.keys(sub.metadata).length > 0 && (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm", children: Object.entries(sub.metadata).filter(([, v]) => v).map(([k, v]) => (_jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground capitalize", children: k.replace(/([A-Z])/g, ' $1') }), _jsx("p", { className: "font-medium", children: String(v) })] }, k))) })), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground mb-1", children: "Message" }), _jsx("p", { className: "text-sm whitespace-pre-wrap", children: sub.message })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground mb-1", children: "Status" }), _jsx("div", { className: "flex gap-1", children: STATUS_OPTIONS.map((s) => (_jsx("button", { onClick: () => updateStatus(sub.id, s), className: cn('rounded-md px-2.5 py-1 text-xs capitalize transition-colors', sub.status === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'), children: s }, s))) })] }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground mb-1", children: "Notes" }), _jsx("textarea", { rows: 2, defaultValue: sub.notes || '', onBlur: (e) => { if (e.target.value !== (sub.notes || ''))
                                                        updateNotes(sub.id, e.target.value); }, className: "flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-y", placeholder: "Internal notes..." })] })] }), _jsx("a", { href: `mailto:${sub.email}?subject=Re: ${sub.subject || 'Your Inquiry'}`, className: "inline-flex h-8 items-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90", children: "Reply via Email" })] }))] }, sub.id))) }))] }));
}
//# sourceMappingURL=ContactsList.js.map
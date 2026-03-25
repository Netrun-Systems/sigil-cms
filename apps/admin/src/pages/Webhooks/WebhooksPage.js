import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Loader2, Webhook, X, RefreshCw, Copy, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
const EVENT_TYPES = [
    'page.created',
    'page.updated',
    'page.published',
    'page.deleted',
    'block.created',
    'block.updated',
    'block.deleted',
    'media.uploaded',
    'media.deleted',
    'order.created',
    'order.completed',
    'order.cancelled',
    'subscriber.added',
    'subscriber.removed',
    'contact.submitted',
];
const inputClass = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
function generateSecret() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'whsec_';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
function truncateUrl(url, max = 50) {
    if (url.length <= max)
        return url;
    return url.slice(0, max) + '...';
}
function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
const defaultForm = {
    url: '',
    events: [],
    secret: generateSecret(),
    is_active: true,
};
export function WebhooksPage() {
    const { siteId } = useParams();
    const [endpoints, setEndpoints] = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(null);
    const [retrying, setRetrying] = useState(null);
    const [showSecret, setShowSecret] = useState(false);
    const basePath = `/sites/${siteId}/webhooks`;
    const load = async () => {
        setLoading(true);
        try {
            const [epRes, dlRes] = await Promise.all([
                api.get(`${basePath}/endpoints`),
                api.get(`${basePath}/deliveries`),
            ]);
            setEndpoints(epRes.data ?? []);
            setDeliveries(dlRes.data ?? []);
        }
        catch { /* empty state */ }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [siteId]);
    const openCreate = () => {
        setEditingId(null);
        setForm({ ...defaultForm, secret: generateSecret() });
        setShowSecret(false);
        setDialogOpen(true);
    };
    const openEdit = (ep) => {
        setEditingId(ep.id);
        setForm({
            url: ep.url,
            events: [...ep.events],
            secret: ep.secret,
            is_active: ep.is_active,
        });
        setShowSecret(false);
        setDialogOpen(true);
    };
    const handleSave = async () => {
        setSaving(true);
        try {
            if (editingId) {
                const res = await api.put(`${basePath}/endpoints/${editingId}`, form);
                setEndpoints((prev) => prev.map((ep) => ep.id === editingId ? (res.data ?? ep) : ep));
            }
            else {
                const res = await api.post(`${basePath}/endpoints`, form);
                if (res.data)
                    setEndpoints((prev) => [...prev, res.data]);
            }
            setDialogOpen(false);
        }
        catch { /* */ }
        finally {
            setSaving(false);
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('Delete this webhook endpoint?'))
            return;
        try {
            await api.delete(`${basePath}/endpoints/${id}`);
            setEndpoints((prev) => prev.filter((ep) => ep.id !== id));
        }
        catch { /* */ }
    };
    const handleToggleActive = async (ep) => {
        try {
            await api.patch(`${basePath}/endpoints/${ep.id}`, { is_active: !ep.is_active });
            setEndpoints((prev) => prev.map((e) => e.id === ep.id ? { ...e, is_active: !e.is_active } : e));
        }
        catch { /* */ }
    };
    const handleTest = async (id) => {
        setTesting(id);
        try {
            await api.post(`${basePath}/endpoints/${id}/test`, {});
            await load();
        }
        catch { /* */ }
        finally {
            setTesting(null);
        }
    };
    const handleRetry = async (deliveryId) => {
        setRetrying(deliveryId);
        try {
            await api.post(`${basePath}/deliveries/${deliveryId}/retry`, {});
            await load();
        }
        catch { /* */ }
        finally {
            setRetrying(null);
        }
    };
    const toggleEvent = (event) => {
        setForm((prev) => ({
            ...prev,
            events: prev.events.includes(event)
                ? prev.events.filter((e) => e !== event)
                : [...prev.events, event],
        }));
    };
    const copySecret = () => {
        navigator.clipboard.writeText(form.secret).catch(() => { });
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Webhooks" }), _jsxs("button", { onClick: openCreate, className: "flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90", children: [_jsx(Plus, { className: "h-4 w-4" }), " Add Endpoint"] })] }), loading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : endpoints.length === 0 ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(Webhook, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: "No webhook endpoints configured" })] })) : (_jsx("div", { className: "grid gap-4 sm:grid-cols-2", children: endpoints.map((ep) => (_jsx(Card, { children: _jsxs(CardContent, { className: "pt-4 space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "truncate font-mono text-sm font-medium", title: ep.url, children: truncateUrl(ep.url) }), _jsx("div", { className: "mt-2 flex flex-wrap gap-1", children: ep.events.map((ev) => (_jsx("span", { className: "rounded-md bg-muted px-2 py-0.5 text-xs", children: ev }, ev))) })] }), _jsx("div", { className: "flex items-center gap-2", children: ep.last_delivery_status && (_jsx("span", { className: cn('h-2.5 w-2.5 rounded-full', ep.last_delivery_status === 'delivered' ? 'bg-green-500' : 'bg-red-500'), title: ep.last_delivery_status === 'delivered' ? 'Last delivery succeeded' : 'Last delivery failed' })) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: () => handleToggleActive(ep), className: cn('rounded-md border px-2 py-0.5 text-xs font-medium transition-colors', ep.is_active
                                                    ? 'border-green-500/50 bg-green-500/10 text-green-500'
                                                    : 'border-gray-500/50 bg-gray-500/10 text-gray-400'), children: ep.is_active ? 'Active' : 'Inactive' }), ep.fail_count > 0 && (_jsxs("span", { className: "text-xs text-red-500", children: [ep.fail_count, " failures"] }))] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: () => handleTest(ep.id), disabled: testing === ep.id, className: "rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50", children: testing === ep.id ? _jsx(Loader2, { className: "h-3 w-3 animate-spin" }) : 'Test' }), _jsx("button", { onClick: () => openEdit(ep), className: "rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground", children: "Edit" }), _jsx("button", { onClick: () => handleDelete(ep.id), className: "rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-destructive", children: "Delete" })] })] })] }) }, ep.id))) })), _jsxs("div", { children: [_jsx("h2", { className: "mb-3 text-lg font-semibold", children: "Recent Deliveries" }), loading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : deliveries.length === 0 ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(Webhook, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: "No deliveries yet" })] })) : (_jsx(Card, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border", children: [_jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Event" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Endpoint" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "HTTP Code" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Date" }), _jsx("th", { className: "px-6 py-3 w-[80px]" })] }) }), _jsx("tbody", { children: deliveries.map((d) => (_jsxs("tr", { className: "group border-b border-border last:border-0 hover:bg-accent/50", children: [_jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: "rounded-md bg-muted px-2 py-0.5 text-xs", children: d.event_type }) }), _jsx("td", { className: "px-6 py-4 text-sm font-mono text-muted-foreground", title: d.endpoint_url, children: truncateUrl(d.endpoint_url, 35) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: cn('h-2 w-2 rounded-full', d.status === 'delivered' ? 'bg-green-500' : 'bg-red-500') }), _jsx("span", { className: "text-sm capitalize", children: d.status })] }) }), _jsx("td", { className: "px-6 py-4 text-sm font-mono", children: d.http_code ?? '-' }), _jsx("td", { className: "px-6 py-4 text-sm text-muted-foreground", children: formatDate(d.created_at) }), _jsx("td", { className: "px-6 py-4", children: d.status === 'failed' && (_jsxs("button", { onClick: () => handleRetry(d.id), disabled: retrying === d.id, className: "flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50", children: [retrying === d.id ? (_jsx(Loader2, { className: "h-3 w-3 animate-spin" })) : (_jsx(RefreshCw, { className: "h-3 w-3" })), "Retry"] })) })] }, d.id))) })] }) }) }))] }), dialogOpen && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", onClick: () => setDialogOpen(false), children: _jsxs("div", { className: "w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg space-y-4", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold", children: editingId ? 'Edit Endpoint' : 'Add Endpoint' }), _jsx("button", { onClick: () => setDialogOpen(false), className: "rounded-md p-1 text-muted-foreground hover:text-foreground", children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Endpoint URL" }), _jsx("input", { value: form.url, onChange: (e) => setForm((f) => ({ ...f, url: e.target.value })), placeholder: "https://example.com/webhook", className: cn(inputClass, 'mt-1') })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Signing Secret" }), _jsxs("div", { className: "mt-1 flex gap-2", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx("input", { type: showSecret ? 'text' : 'password', value: form.secret, onChange: (e) => setForm((f) => ({ ...f, secret: e.target.value })), className: inputClass, readOnly: true }), _jsx("button", { type: "button", onClick: () => setShowSecret((s) => !s), className: "absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground", children: showSecret ? _jsx(EyeOff, { className: "h-4 w-4" }) : _jsx(Eye, { className: "h-4 w-4" }) })] }), _jsx("button", { type: "button", onClick: copySecret, className: "rounded-md border border-input px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground", title: "Copy secret", children: _jsx(Copy, { className: "h-4 w-4" }) }), _jsx("button", { type: "button", onClick: () => setForm((f) => ({ ...f, secret: generateSecret() })), className: "rounded-md border border-input px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground", title: "Regenerate secret", children: _jsx(RefreshCw, { className: "h-4 w-4" }) })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("label", { className: "text-sm font-medium", children: "Active" }), _jsx("button", { type: "button", onClick: () => setForm((f) => ({ ...f, is_active: !f.is_active })), className: cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', form.is_active ? 'bg-primary' : 'bg-muted'), children: _jsx("span", { className: cn('inline-block h-4 w-4 rounded-full bg-background transition-transform', form.is_active ? 'translate-x-6' : 'translate-x-1') }) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Event Types" }), _jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: EVENT_TYPES.map((ev) => (_jsx("button", { type: "button", onClick: () => toggleEvent(ev), className: cn('rounded-md border px-2 py-1 text-xs transition-colors', form.events.includes(ev)
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'), children: ev }, ev))) })] })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx("button", { onClick: () => setDialogOpen(false), className: "rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors", children: "Cancel" }), _jsxs("button", { onClick: handleSave, disabled: saving || !form.url.trim() || form.events.length === 0, className: "flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50", children: [saving && _jsx(Loader2, { className: "h-4 w-4 animate-spin" }), editingId ? 'Update' : 'Create'] })] })] }) }))] }));
}
//# sourceMappingURL=WebhooksPage.js.map
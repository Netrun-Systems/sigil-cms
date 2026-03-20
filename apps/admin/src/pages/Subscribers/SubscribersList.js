import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Mail, Send, Loader2, Trash2, Users } from 'lucide-react';
import { api } from '../../lib/api';
import { cn } from '@netrun-cms/ui';
export function SubscribersList() {
    const { siteId } = useParams();
    const [subscribers, setSubscribers] = useState([]);
    const [stats, setStats] = useState({ active: 0, unsubscribed: 0 });
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('subscribers');
    const [statusFilter, setStatusFilter] = useState('active');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const [sendResult, setSendResult] = useState(null);
    const load = async () => {
        setLoading(true);
        try {
            const [subsRes, statsRes] = await Promise.all([
                api.get(`/sites/${siteId}/subscribers?status=${statusFilter}`),
                api.get(`/sites/${siteId}/subscribers/stats`),
            ]);
            setSubscribers(subsRes.data ?? []);
            setStats(statsRes.data ?? { active: 0, unsubscribed: 0 });
        }
        catch { /* */ }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [siteId, statusFilter]);
    const handleDelete = async (id) => {
        if (!confirm('Remove this subscriber permanently?'))
            return;
        try {
            await api.delete(`/sites/${siteId}/subscribers/${id}`);
            setSubscribers((prev) => prev.filter((s) => s.id !== id));
            setStats((prev) => ({ ...prev, active: Math.max(0, prev.active - 1) }));
        }
        catch { /* */ }
    };
    const handleBroadcast = async (e) => {
        e.preventDefault();
        if (!confirm(`Send "${subject}" to ${stats.active} subscribers?`))
            return;
        setSending(true);
        setSendResult(null);
        try {
            const res = await api.post(`/sites/${siteId}/subscribers/broadcast`, { subject, body });
            setSendResult(res.data);
            if (res.data.sent > 0) {
                setSubject('');
                setBody('');
            }
        }
        catch {
            setSendResult({ sent: 0, failed: -1 });
        }
        finally {
            setSending(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Mailing List" }), _jsxs("span", { className: "rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary", children: [stats.active, " active"] })] }), _jsx("div", { className: "flex gap-1 border-b border-border", children: ['subscribers', 'broadcast'].map((t) => (_jsx("button", { onClick: () => setTab(t), className: cn('px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize', tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'), children: t === 'subscribers' ? _jsxs(_Fragment, { children: [_jsx(Users, { className: "inline h-4 w-4 mr-1.5" }), "Subscribers"] }) : _jsxs(_Fragment, { children: [_jsx(Send, { className: "inline h-4 w-4 mr-1.5" }), "Send Broadcast"] }) }, t))) }), tab === 'subscribers' && (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex gap-2", children: ['active', 'unsubscribed'].map((s) => (_jsxs("button", { onClick: () => setStatusFilter(s), className: cn('rounded-md px-3 py-1.5 text-sm capitalize transition-colors', statusFilter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'), children: [s, " (", s === 'active' ? stats.active : stats.unsubscribed, ")"] }, s))) }), loading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : subscribers.length === 0 ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(Mail, { className: "h-8 w-8" }), _jsxs("p", { className: "text-sm", children: ["No ", statusFilter, " subscribers"] })] })) : (_jsx("div", { className: "rounded-lg border border-border overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border", children: [_jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Email" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Name" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Subscribed" }), _jsx("th", { className: "px-6 py-3 w-[60px]" })] }) }), _jsx("tbody", { children: subscribers.map((sub) => (_jsxs("tr", { className: "group border-b border-border last:border-0 hover:bg-accent/50", children: [_jsx("td", { className: "px-6 py-4 text-sm font-medium", children: sub.email }), _jsx("td", { className: "px-6 py-4 text-sm text-muted-foreground", children: sub.name || '—' }), _jsx("td", { className: "px-6 py-4 text-sm text-muted-foreground", children: new Date(sub.subscribed_at).toLocaleDateString() }), _jsx("td", { className: "px-6 py-4", children: _jsx("button", { onClick: () => handleDelete(sub.id), className: "rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent hover:text-destructive", children: _jsx(Trash2, { className: "h-4 w-4" }) }) })] }, sub.id))) })] }) }))] })), tab === 'broadcast' && (_jsx("div", { className: "rounded-lg border border-border p-6", children: _jsxs("form", { onSubmit: handleBroadcast, className: "space-y-4 max-w-2xl", children: [_jsxs("p", { className: "text-sm text-muted-foreground", children: ["Send an email to all ", stats.active, " active subscribers. Each email includes a personalized greeting and one-click unsubscribe link."] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Subject *" }), _jsx("input", { type: "text", required: true, value: subject, onChange: (e) => setSubject(e.target.value), className: "flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary", placeholder: "e.g., New Release Out Now" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Message *" }), _jsx("textarea", { required: true, rows: 8, value: body, onChange: (e) => setBody(e.target.value), className: "flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-y", placeholder: "Write your message..." })] }), (subject || body) && (_jsxs("div", { className: "rounded-md border border-border bg-muted/30 p-4 text-sm", children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground mb-2", children: "Preview:" }), _jsxs("p", { className: "font-medium mb-1", children: ["Subject: ", subject || '(empty)'] }), _jsxs("div", { className: "text-muted-foreground whitespace-pre-wrap", children: [_jsx("p", { children: "Hey [name]," }), _jsx("p", { className: "mt-2", children: body }), _jsxs("p", { className: "mt-4 text-xs", children: ["---", _jsx("br", {}), "Unsubscribe link included automatically"] })] })] })), _jsxs("button", { type: "submit", disabled: sending, className: "flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50", children: [sending ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : _jsx(Send, { className: "h-4 w-4" }), sending ? 'Sending...' : `Send to ${stats.active} subscribers`] }), sendResult && (_jsx("div", { className: cn('rounded-md p-3 text-sm', sendResult.failed === -1 ? 'bg-destructive/10 text-destructive' : sendResult.failed > 0 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'), children: sendResult.failed === -1 ? 'Failed to send.' : `Sent: ${sendResult.sent} | Failed: ${sendResult.failed}` }))] }) }))] }));
}
//# sourceMappingURL=SubscribersList.js.map
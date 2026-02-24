import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Loader2, CalendarDays } from 'lucide-react';
import { Card, CardContent } from '@netrun-cms/ui';
import { api } from '../../lib/api';
const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'show', label: 'Show' },
    { value: 'festival', label: 'Festival' },
    { value: 'livestream', label: 'Livestream' },
];
export function EventsList() {
    const { siteId } = useParams();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const basePath = siteId ? `/sites/${siteId}` : '';
    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get(`${basePath}/events`);
            setEvents(res.data ?? []);
        }
        catch {
            // empty state on error
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [siteId]);
    const handleDelete = async (id) => {
        if (!confirm('Delete this event?'))
            return;
        try {
            await api.delete(`${basePath}/events/${id}`);
            setEvents((prev) => prev.filter((e) => e.id !== id));
        }
        catch {
            // keep list as-is
        }
    };
    const filtered = events.filter((e) => {
        if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.venue.toLowerCase().includes(search.toLowerCase()))
            return false;
        if (typeFilter && e.eventType !== typeFilter)
            return false;
        return true;
    });
    const editBase = siteId ? `/sites/${siteId}/events` : '/events';
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Events" }), _jsxs(Link, { to: `${editBase}/new`, className: "flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90", children: [_jsx(Plus, { className: "h-4 w-4" }), " New Event"] })] }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center", children: [_jsxs("div", { className: "relative flex-1 max-w-md", children: [_jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), _jsx("input", { placeholder: "Search events...", value: search, onChange: (e) => setSearch(e.target.value), className: "flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsx("div", { className: "flex gap-2", children: typeOptions.map((opt) => (_jsx("button", { onClick: () => setTypeFilter(opt.value), className: `rounded-md px-3 py-1.5 text-sm transition-colors ${typeFilter === opt.value
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`, children: opt.label }, opt.value))) })] }) }) }), loading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : filtered.length === 0 ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(CalendarDays, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: events.length === 0 ? 'No events yet' : 'No matches' })] })) : (_jsx(Card, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border", children: [_jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Event" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Venue" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Date" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Type" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Status" }), _jsx("th", { className: "px-6 py-3 w-[100px]" })] }) }), _jsx("tbody", { children: filtered.map((event) => (_jsxs("tr", { className: "group border-b border-border last:border-0 hover:bg-accent/50", children: [_jsx("td", { className: "px-6 py-4", children: _jsx(Link, { to: `${editBase}/${event.id}`, className: "font-medium group-hover:text-primary", children: event.title }) }), _jsx("td", { className: "px-6 py-4 text-sm text-muted-foreground", children: event.venue }), _jsx("td", { className: "px-6 py-4 text-sm text-muted-foreground", children: new Date(event.eventDate).toLocaleDateString() }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: "rounded-md bg-muted px-2 py-0.5 text-xs capitalize", children: event.eventType }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `rounded-md px-2 py-0.5 text-xs capitalize ${event.isPublished
                                                    ? 'border border-green-500/50 bg-green-500/10 text-green-500'
                                                    : 'border border-yellow-500/50 bg-yellow-500/10 text-yellow-500'}`, children: event.isPublished ? 'Published' : 'Draft' }) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100", children: [_jsx(Link, { to: `${editBase}/${event.id}`, className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground", children: _jsx(Pencil, { className: "h-4 w-4" }) }), _jsx("button", { onClick: () => handleDelete(event.id), className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive", children: _jsx(Trash2, { className: "h-4 w-4" }) })] }) })] }, event.id))) })] }) }) }))] }));
}
//# sourceMappingURL=EventsList.js.map
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, CalendarCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
const STATUS_OPTIONS = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
const statusColors = {
    pending: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
    confirmed: 'border-green-500/50 bg-green-500/10 text-green-400',
    cancelled: 'border-red-500/50 bg-red-500/10 text-red-400',
    completed: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
    no_show: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
};
function formatTime(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function formatDate(iso) {
    return new Date(iso).toLocaleDateString();
}
export function AppointmentsList() {
    const { siteId } = useParams();
    const [appointments, setAppointments] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [serviceFilter, setServiceFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [expanded, setExpanded] = useState(null);
    const loadServices = async () => {
        try {
            const res = await api.get(`/sites/${siteId}/booking/services`);
            setServices(res.data ?? []);
        }
        catch { /* */ }
    };
    const loadAppointments = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter)
                params.set('status', statusFilter);
            if (serviceFilter)
                params.set('service_id', serviceFilter);
            if (dateFilter)
                params.set('date', dateFilter);
            const qs = params.toString() ? `?${params}` : '';
            const res = await api.get(`/sites/${siteId}/booking/appointments${qs}`);
            setAppointments(res.data ?? []);
        }
        catch { /* */ }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { loadServices(); }, [siteId]);
    useEffect(() => { loadAppointments(); }, [siteId, statusFilter, serviceFilter, dateFilter]);
    const updateAppointment = async (id, patch) => {
        try {
            await api.patch(`/sites/${siteId}/booking/appointments/${id}`, patch);
            setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, ...patch } : a));
        }
        catch { /* */ }
    };
    const counts = appointments.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
    }, {});
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Appointments" }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-5 gap-3", children: STATUS_OPTIONS.map((s) => (_jsxs("button", { onClick: () => setStatusFilter(statusFilter === s ? '' : s), className: cn('rounded-lg border p-3 text-center transition-colors', statusFilter === s ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'), children: [_jsx("p", { className: "text-2xl font-bold", children: counts[s] || 0 }), _jsx("p", { className: "text-xs text-muted-foreground capitalize", children: s.replace('_', ' ') })] }, s))) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "Date" }), _jsx("input", { type: "date", value: dateFilter, onChange: (e) => setDateFilter(e.target.value), className: "mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "Service" }), _jsxs("select", { value: serviceFilter, onChange: (e) => setServiceFilter(e.target.value), className: "mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: [_jsx("option", { value: "", children: "All Services" }), services.map((s) => (_jsx("option", { value: s.id, children: s.name }, s.id)))] })] }), (dateFilter || serviceFilter || statusFilter) && (_jsx("button", { onClick: () => { setDateFilter(''); setServiceFilter(''); setStatusFilter(''); }, className: "mt-auto h-9 rounded-md px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors", children: "Clear Filters" }))] }) }) }), loading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : appointments.length === 0 ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(CalendarCheck, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: "No appointments" })] })) : (_jsx("div", { className: "space-y-3", children: appointments.map((appt) => (_jsxs("div", { className: "rounded-lg border border-border p-4", children: [_jsx("div", { className: "flex items-start justify-between gap-4", children: _jsxs("button", { onClick: () => setExpanded(expanded === appt.id ? null : appt.id), className: "flex-1 text-left", children: [_jsxs("div", { className: "flex items-center gap-3 mb-1", children: [_jsx("span", { className: "font-medium", children: appt.customer_name }), _jsx("span", { className: cn('rounded-md px-2 py-0.5 text-xs capitalize border', statusColors[appt.status] || ''), children: appt.status.replace('_', ' ') }), _jsx("span", { className: "rounded-md bg-muted px-2 py-0.5 text-xs", children: appt.service_name }), expanded === appt.id
                                                ? _jsx(ChevronUp, { className: "h-4 w-4 text-muted-foreground" })
                                                : _jsx(ChevronDown, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs("div", { className: "flex flex-wrap gap-x-4 text-sm text-muted-foreground", children: [_jsx("span", { children: formatDate(appt.start_time) }), _jsxs("span", { children: [formatTime(appt.start_time), " - ", formatTime(appt.end_time)] }), _jsx("span", { children: appt.customer_email })] })] }) }), expanded === appt.id && (_jsxs("div", { className: "mt-4 pt-4 border-t border-border space-y-4", children: [appt.customer_notes && (_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground mb-1", children: "Customer Notes" }), _jsx("p", { className: "text-sm whitespace-pre-wrap", children: appt.customer_notes })] })), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground mb-1", children: "Status" }), _jsx("div", { className: "flex gap-1 flex-wrap", children: STATUS_OPTIONS.map((s) => (_jsx("button", { onClick: () => updateAppointment(appt.id, { status: s }), className: cn('rounded-md px-2.5 py-1 text-xs capitalize transition-colors', appt.status === s
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'), children: s.replace('_', ' ') }, s))) })] }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground mb-1", children: "Admin Notes" }), _jsx("textarea", { rows: 2, defaultValue: appt.admin_notes || '', onBlur: (e) => {
                                                        if (e.target.value !== (appt.admin_notes || '')) {
                                                            updateAppointment(appt.id, { admin_notes: e.target.value });
                                                        }
                                                    }, className: "flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-y", placeholder: "Internal notes..." })] })] })] }))] }, appt.id))) }))] }));
}
//# sourceMappingURL=AppointmentsList.js.map
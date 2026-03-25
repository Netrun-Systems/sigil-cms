import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Loader2, Users, Settings, RefreshCw, ChevronDown, ChevronRight, Phone, Mail, CheckCircle2, AlertCircle, TrendingUp, Calendar, } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
const statusColors = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    qualified: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    converted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    lost: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};
const activityIcons = {
    call: Phone,
    email: Mail,
    task: CheckCircle2,
};
export function LeadsPage() {
    const { siteId } = useParams();
    const basePath = `/sites/${siteId}`;
    const [leads, setLeads] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(null);
    const [lastSync, setLastSync] = useState(null);
    const [testing, setTesting] = useState(false);
    const [apiUrl, setApiUrl] = useState('');
    const [expandedLead, setExpandedLead] = useState(null);
    const [loadingActivities, setLoadingActivities] = useState(null);
    // Search
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [leadsRes, statsRes, configRes] = await Promise.all([
                api.get(`${basePath}/kog/leads`),
                api.get(`${basePath}/kog/stats`),
                api.get(`${basePath}/kog/config`),
            ]);
            setLeads(leadsRes.data ?? []);
            setStats(statsRes.data ?? null);
            if (configRes.data) {
                setConnected(configRes.data.connected);
                setLastSync(configRes.data.lastSync);
                setApiUrl(configRes.data.apiUrl ?? '');
            }
        }
        catch {
            // graceful empty state
        }
        finally {
            setLoading(false);
        }
    }, [basePath]);
    useEffect(() => { load(); }, [load]);
    const handleTestConnection = async () => {
        setTesting(true);
        try {
            const res = await api.post(`${basePath}/kog/test-connection`, {});
            setConnected(res.data?.connected ?? false);
        }
        catch {
            setConnected(false);
        }
        finally {
            setTesting(false);
        }
    };
    const handleExpandLead = async (leadId) => {
        if (expandedLead === leadId) {
            setExpandedLead(null);
            return;
        }
        setExpandedLead(leadId);
        const lead = leads.find((l) => l.id === leadId);
        if (lead?.activities)
            return;
        setLoadingActivities(leadId);
        try {
            const res = await api.get(`${basePath}/kog/leads/${leadId}/activities`);
            setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, activities: res.data ?? [] } : l)));
        }
        catch {
            // keep without activities
        }
        finally {
            setLoadingActivities(null);
        }
    };
    const handleSearch = async () => {
        if (!search.trim()) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const res = await api.get(`${basePath}/kog/contacts/search?q=${encodeURIComponent(search)}`);
            setSearchResults(res.data ?? []);
        }
        catch {
            setSearchResults([]);
        }
        finally {
            setSearching(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "CRM Leads" }), _jsxs("button", { onClick: load, className: "flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90", children: [_jsx(Settings, { className: "h-4 w-4" }), " Sync Settings"] })] }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: cn('h-3 w-3 rounded-full', connected === true ? 'bg-green-500' : connected === false ? 'bg-red-500' : 'bg-gray-400') }), _jsxs("div", { children: [_jsxs("p", { className: "text-sm font-medium", children: ["KOG API ", connected === true ? 'Connected' : connected === false ? 'Disconnected' : 'Unknown'] }), lastSync && (_jsxs("p", { className: "text-xs text-muted-foreground", children: ["Last sync: ", new Date(lastSync).toLocaleString()] }))] })] }), _jsxs("button", { onClick: handleTestConnection, disabled: testing, className: "flex h-8 items-center gap-2 rounded-md border border-input px-3 text-sm transition-colors hover:bg-accent disabled:opacity-50", children: [_jsx(RefreshCw, { className: cn('h-3.5 w-3.5', testing && 'animate-spin') }), "Test Connection"] })] }) }) }), stats && (_jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-3", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Users, { className: "h-5 w-5 text-primary" }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold", children: stats.totalLeads }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Total Leads Captured" })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Calendar, { className: "h-5 w-5 text-primary" }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold", children: stats.leadsThisMonth }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Leads This Month" })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(TrendingUp, { className: "h-5 w-5 text-primary" }), _jsxs("div", { children: [_jsxs("p", { className: "text-2xl font-bold", children: [stats.conversionRate.toFixed(1), "%"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Conversion Rate" })] })] }) }) })] })), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsx("p", { className: "mb-3 text-sm font-medium", children: "Search KOG Contacts" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "relative flex-1 max-w-md", children: [_jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), _jsx("input", { placeholder: "Search contacts by name or email...", value: search, onChange: (e) => setSearch(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleSearch(), className: "flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("button", { onClick: handleSearch, disabled: searching, className: "flex h-9 items-center gap-2 rounded-md border border-input px-4 text-sm transition-colors hover:bg-accent disabled:opacity-50", children: [searching ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : _jsx(Search, { className: "h-4 w-4" }), "Search"] })] }), searchResults.length > 0 && (_jsx("div", { className: "mt-3 divide-y divide-border rounded-md border border-border", children: searchResults.map((contact) => (_jsxs("div", { className: "flex items-center gap-3 px-4 py-2 text-sm", children: [_jsx(Users, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "font-medium", children: contact.name }), _jsx("span", { className: "text-muted-foreground", children: contact.email }), contact.company && (_jsxs("span", { className: "text-muted-foreground", children: ["\u2014 ", contact.company] }))] }, contact.id))) }))] }) }), leads.length === 0 ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(Users, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: "No leads captured yet" })] })) : (_jsx(Card, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border", children: [_jsx("th", { className: "w-8 px-3 py-3" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Name" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Email" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Company" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Source" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Date" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Status" })] }) }), _jsx("tbody", { children: leads.map((lead) => {
                                    const isExpanded = expandedLead === lead.id;
                                    return (_jsxs(Fragment, { children: [_jsxs("tr", { className: "group cursor-pointer border-b border-border last:border-0 hover:bg-accent/50", onClick: () => handleExpandLead(lead.id), children: [_jsx("td", { className: "px-3 py-4 text-muted-foreground", children: isExpanded ? (_jsx(ChevronDown, { className: "h-4 w-4" })) : (_jsx(ChevronRight, { className: "h-4 w-4" })) }), _jsx("td", { className: "px-6 py-4 text-sm font-medium", children: lead.name }), _jsx("td", { className: "px-6 py-4 text-sm text-muted-foreground", children: lead.email }), _jsx("td", { className: "px-6 py-4 text-sm text-muted-foreground", children: lead.company ?? '—' }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: "rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary", children: lead.source }) }), _jsx("td", { className: "px-6 py-4 text-sm text-muted-foreground", children: new Date(lead.capturedAt).toLocaleDateString() }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: cn('rounded-md px-2 py-0.5 text-xs font-medium capitalize', statusColors[lead.status]), children: lead.status }) })] }), isExpanded && (_jsx("tr", { className: "border-b border-border last:border-0", children: _jsx("td", { colSpan: 7, className: "bg-muted/30 px-10 py-4", children: loadingActivities === lead.id ? (_jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [_jsx(Loader2, { className: "h-4 w-4 animate-spin" }), " Loading activities..."] })) : !lead.activities || lead.activities.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground", children: "No activities recorded in KOG" })) : (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: "KOG Activities" }), lead.activities.map((activity) => {
                                                                const Icon = activityIcons[activity.type] ?? CheckCircle2;
                                                                return (_jsxs("div", { className: "flex items-start gap-3 text-sm", children: [_jsx(Icon, { className: "mt-0.5 h-4 w-4 text-muted-foreground" }), _jsxs("div", { children: [_jsx("span", { className: "font-medium", children: activity.subject }), _jsx("span", { className: "ml-2 text-muted-foreground", children: new Date(activity.date).toLocaleDateString() }), activity.notes && (_jsx("p", { className: "mt-0.5 text-muted-foreground", children: activity.notes }))] })] }, activity.id));
                                                            })] })) }) }))] }, lead.id));
                                }) })] }) }) })), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsx("p", { className: "mb-3 text-sm font-medium", children: "Configuration" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "mb-1 block text-xs text-muted-foreground", children: "KOG API URL (set via environment)" }), _jsx("div", { className: "flex h-9 items-center rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground", children: apiUrl || 'Not configured' })] }), _jsxs("button", { onClick: handleTestConnection, disabled: testing, className: "mt-4 flex h-9 items-center gap-2 rounded-md border border-input px-4 text-sm transition-colors hover:bg-accent disabled:opacity-50", children: [testing ? _jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" }) : _jsx(AlertCircle, { className: "h-3.5 w-3.5" }), "Test"] })] })] }) })] }));
}
//# sourceMappingURL=LeadsPage.js.map
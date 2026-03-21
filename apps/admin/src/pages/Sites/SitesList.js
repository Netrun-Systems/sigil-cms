import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Globe, Plus, Search, ExternalLink, FileText, Settings, Trash2, } from 'lucide-react';
import { Card, CardContent, Button, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, cn, } from '@netrun-cms/ui';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { usePermissions } from '../../hooks/usePermissions';
function StatusBadge({ status }) {
    return (_jsx(Badge, { variant: "outline", className: cn('capitalize', status === 'published' && 'border-green-500/50 bg-green-500/10 text-green-500', status === 'draft' && 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500', status === 'archived' && 'border-gray-500/50 bg-gray-500/10 text-gray-500'), children: status }));
}
function timeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60)
        return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7)
        return `${days}d ago`;
    return date.toLocaleDateString();
}
export function SitesList() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [sites, setSites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { canDelete } = usePermissions();
    useEffect(() => {
        setIsLoading(true);
        setError(null);
        const params = new URLSearchParams({ limit: '100' });
        if (selectedStatus)
            params.set('status', selectedStatus);
        api
            .get('/sites?' + params.toString())
            .then((res) => {
            setSites(res.data || []);
        })
            .catch((err) => {
            setError(err instanceof Error ? err.message : 'Failed to load sites');
        })
            .finally(() => setIsLoading(false));
    }, [selectedStatus]);
    const filteredSites = sites.filter((site) => {
        if (!searchQuery)
            return true;
        const q = searchQuery.toLowerCase();
        return (site.name.toLowerCase().includes(q) ||
            site.slug.toLowerCase().includes(q) ||
            site.domain?.toLowerCase().includes(q));
    });
    const handleDelete = async (siteId, siteName) => {
        if (!confirm(`Are you sure you want to delete "${siteName}"? This cannot be undone.`))
            return;
        try {
            await api.delete('/sites/' + siteId);
            setSites((prev) => prev.filter((s) => s.id !== siteId));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Delete failed');
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Sites" }), _jsx("p", { className: "text-muted-foreground", children: "Manage all your websites in one place." })] }), _jsx(Button, { asChild: true, children: _jsxs(Link, { to: "/sites/new", children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Create Site"] }) })] }), error && (_jsx("div", { className: "rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive", children: error })), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { className: "relative flex-1 max-w-md", children: [_jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), _jsx(Input, { placeholder: "Search sites...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-9" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: selectedStatus === null ? 'secondary' : 'ghost', size: "sm", onClick: () => setSelectedStatus(null), children: "All" }), _jsx(Button, { variant: selectedStatus === 'published' ? 'secondary' : 'ghost', size: "sm", onClick: () => setSelectedStatus('published'), children: "Published" }), _jsx(Button, { variant: selectedStatus === 'draft' ? 'secondary' : 'ghost', size: "sm", onClick: () => setSelectedStatus('draft'), children: "Draft" }), _jsx(Button, { variant: selectedStatus === 'archived' ? 'secondary' : 'ghost', size: "sm", onClick: () => setSelectedStatus('archived'), children: "Archived" })] })] }) }) }), isLoading && (_jsx(Card, { children: _jsx(CardContent, { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) }) })), !isLoading && filteredSites.length > 0 && (_jsx(Card, { children: _jsx(CardContent, { className: "p-0", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { className: "w-[300px]", children: "Site" }), _jsx(TableHead, { children: "Domain" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { className: "text-center", children: "Pages" }), _jsx(TableHead, { children: "Last Updated" }), _jsx(TableHead, { className: "w-[70px]" })] }) }), _jsx(TableBody, { children: filteredSites.map((site) => (_jsxs(TableRow, { className: "group", children: [_jsx(TableCell, { children: _jsxs(Link, { to: `/sites/${site.id}`, className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary", children: _jsx(Globe, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium group-hover:text-primary", children: site.name }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["/", site.slug] })] })] }) }), _jsx(TableCell, { children: site.domain ? (_jsxs("a", { href: `https://${site.domain}`, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-1 text-sm text-muted-foreground hover:text-primary", children: [site.domain, _jsx(ExternalLink, { className: "h-3 w-3" })] })) : (_jsx("span", { className: "text-sm text-muted-foreground", children: "Not set" })) }), _jsx(TableCell, { children: _jsx(StatusBadge, { status: site.status }) }), _jsx(TableCell, { className: "text-center", children: _jsxs(Link, { to: `/sites/${site.id}/pages`, className: "inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary", children: [_jsx(FileText, { className: "h-4 w-4" }), site.pageCount ?? '-'] }) }), _jsx(TableCell, { className: "text-sm text-muted-foreground", children: timeAgo(site.updatedAt) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", asChild: true, children: _jsx(Link, { to: `/sites/${site.id}`, children: _jsx(Settings, { className: "h-4 w-4" }) }) }), canDelete && (_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-destructive hover:text-destructive", onClick: () => handleDelete(site.id, site.name), children: _jsx(Trash2, { className: "h-4 w-4" }) }))] }) })] }, site.id))) })] }) }) })), !isLoading && filteredSites.length === 0 && (_jsx(Card, { children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-12", children: [_jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-full bg-muted", children: _jsx(Globe, { className: "h-8 w-8 text-muted-foreground" }) }), _jsx("h3", { className: "mt-4 text-lg font-semibold", children: "No sites found" }), _jsx("p", { className: "mt-2 text-center text-sm text-muted-foreground", children: searchQuery || selectedStatus
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Get started by creating your first site.' }), !searchQuery && !selectedStatus && (_jsx(Button, { className: "mt-4", asChild: true, children: _jsxs(Link, { to: "/sites/new", children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Create Site"] }) }))] }) }))] }));
}
//# sourceMappingURL=SitesList.js.map
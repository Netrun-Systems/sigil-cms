import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Globe, Plus, Search, ExternalLink, FileText, Settings, Trash2, CheckCircle2, AlertCircle, Clock, Copy, Eye, Archive, RefreshCw, Loader2, ShieldCheck, Palette, Image, } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Badge, cn, Separator, } from '@netrun-cms/ui';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { usePermissions } from '../../hooks/usePermissions';
function StatusBadge({ status }) {
    const config = {
        published: { icon: CheckCircle2, class: 'border-green-500/50 bg-green-500/10 text-green-500' },
        draft: { icon: Clock, class: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500' },
        archived: { icon: Archive, class: 'border-gray-500/50 bg-gray-500/10 text-gray-500' },
    };
    const { icon: Icon, class: cls } = config[status];
    return (_jsxs(Badge, { variant: "outline", className: cn('capitalize gap-1', cls), children: [_jsx(Icon, { className: "h-3 w-3" }), status] }));
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
function DomainCell({ site, domainStatus, onVerify }) {
    if (!site.domain) {
        return (_jsxs(Link, { to: `/sites/${site.id}`, className: "text-sm text-muted-foreground hover:text-primary flex items-center gap-1", children: [_jsx(Plus, { className: "h-3 w-3" }), "Add domain"] }));
    }
    return (_jsxs("div", { className: "space-y-1", children: [_jsxs("a", { href: `https://${site.domain}`, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-1.5 text-sm hover:text-primary transition-colors", children: [domainStatus?.checking ? (_jsx(Loader2, { className: "h-3 w-3 animate-spin text-muted-foreground" })) : domainStatus?.verified ? (_jsx(ShieldCheck, { className: "h-3 w-3 text-green-500" })) : (_jsx(AlertCircle, { className: "h-3 w-3 text-yellow-500" })), site.domain, _jsx(ExternalLink, { className: "h-3 w-3 text-muted-foreground" })] }), !domainStatus?.verified && !domainStatus?.checking && (_jsx("button", { onClick: () => onVerify(site.id), className: "text-[10px] text-muted-foreground hover:text-primary", children: "Verify SSL" }))] }));
}
export function SitesList() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [sites, setSites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [domainStatuses, setDomainStatuses] = useState(new Map());
    const [viewMode, setViewMode] = useState('grid');
    const { canDelete, canCreate } = usePermissions();
    useEffect(() => {
        loadSites();
    }, [selectedStatus]);
    const loadSites = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ limit: '100' });
            if (selectedStatus)
                params.set('status', selectedStatus);
            const res = await api.get('/sites?' + params.toString());
            setSites(res.data || []);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load sites');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleVerifyDomain = async (siteId) => {
        setDomainStatuses((prev) => {
            const next = new Map(prev);
            next.set(siteId, { siteId, verified: false, checking: true });
            return next;
        });
        try {
            const res = await api.get(`/sites/${siteId}/domain/verify`);
            setDomainStatuses((prev) => {
                const next = new Map(prev);
                next.set(siteId, { siteId, verified: res.data.verified, checking: false });
                return next;
            });
        }
        catch {
            setDomainStatuses((prev) => {
                const next = new Map(prev);
                next.set(siteId, { siteId, verified: false, checking: false });
                return next;
            });
        }
    };
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
    const handleDuplicate = async (site) => {
        try {
            const res = await api.post('/sites', {
                name: `${site.name} (Copy)`,
                slug: `${site.slug}-copy-${Date.now().toString(36)}`,
                template: site.template,
                defaultLanguage: site.defaultLanguage,
                settings: site.settings,
            });
            if (res.data)
                setSites((prev) => [res.data, ...prev]);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Duplicate failed');
        }
    };
    const handleStatusChange = async (siteId, newStatus) => {
        try {
            await api.put('/sites/' + siteId, { status: newStatus });
            setSites((prev) => prev.map((s) => s.id === siteId ? { ...s, status: newStatus } : s));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Status update failed');
        }
    };
    const filteredSites = sites.filter((site) => {
        if (!searchQuery)
            return true;
        const q = searchQuery.toLowerCase();
        return site.name.toLowerCase().includes(q) || site.slug.toLowerCase().includes(q) || site.domain?.toLowerCase().includes(q);
    });
    const stats = {
        total: sites.length,
        published: sites.filter((s) => s.status === 'published').length,
        draft: sites.filter((s) => s.status === 'draft').length,
        withDomain: sites.filter((s) => s.domain).length,
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Sites & Domains" }), _jsx("p", { className: "text-muted-foreground", children: "Manage all your websites, custom domains, and deployments." })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: loadSites, children: _jsx(RefreshCw, { className: "h-4 w-4" }) }), canCreate && (_jsx(Button, { asChild: true, children: _jsxs(Link, { to: "/sites/new", children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Create Site"] }) }))] })] }), error && (_jsx("div", { className: "rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive", children: error })), _jsxs("div", { className: "grid gap-4 sm:grid-cols-4", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-4 pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold", children: stats.total }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Total Sites" })] }), _jsx(Globe, { className: "h-8 w-8 text-muted-foreground/30" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-4 pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-green-500", children: stats.published }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Published" })] }), _jsx(CheckCircle2, { className: "h-8 w-8 text-green-500/20" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-4 pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-yellow-500", children: stats.draft }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Drafts" })] }), _jsx(Clock, { className: "h-8 w-8 text-yellow-500/20" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-4 pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-primary", children: stats.withDomain }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Custom Domains" })] }), _jsx(ShieldCheck, { className: "h-8 w-8 text-primary/20" })] }) }) })] }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { className: "relative flex-1 max-w-md", children: [_jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), _jsx(Input, { placeholder: "Search by name, slug, or domain...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-9" })] }), _jsx("div", { className: "flex gap-2", children: [null, 'published', 'draft', 'archived'].map((status) => (_jsx(Button, { variant: selectedStatus === status ? 'secondary' : 'ghost', size: "sm", onClick: () => setSelectedStatus(status), children: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All' }, status || 'all'))) })] }) }) }), isLoading && (_jsx(Card, { children: _jsx(CardContent, { className: "flex items-center justify-center py-12", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-muted-foreground" }) }) })), !isLoading && filteredSites.length > 0 && (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: filteredSites.map((site) => (_jsxs(Card, { className: "group relative overflow-hidden hover:border-primary/50 transition-colors", children: [_jsx("div", { className: cn('h-1', site.status === 'published' && 'bg-green-500', site.status === 'draft' && 'bg-yellow-500', site.status === 'archived' && 'bg-gray-500') }), _jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0", children: _jsx(Globe, { className: "h-5 w-5" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx(CardTitle, { className: "text-base truncate", children: _jsx(Link, { to: `/sites/${site.id}`, className: "hover:text-primary transition-colors", children: site.name }) }), _jsxs(CardDescription, { className: "text-xs", children: ["/", site.slug] })] })] }), _jsx(StatusBadge, { status: site.status })] }) }), _jsxs(CardContent, { className: "space-y-3 pt-0", children: [_jsx(DomainCell, { site: site, domainStatus: domainStatuses.get(site.id), onVerify: handleVerifyDomain }), _jsx(Separator, {}), _jsxs("div", { className: "flex items-center gap-4 text-xs text-muted-foreground", children: [_jsxs(Link, { to: `/sites/${site.id}/pages`, className: "flex items-center gap-1 hover:text-primary", children: [_jsx(FileText, { className: "h-3 w-3" }), site.pageCount ?? 0, " pages"] }), _jsxs(Link, { to: `/sites/${site.id}/themes`, className: "flex items-center gap-1 hover:text-primary", children: [_jsx(Palette, { className: "h-3 w-3" }), "Theme"] }), _jsxs(Link, { to: `/sites/${site.id}/media`, className: "flex items-center gap-1 hover:text-primary", children: [_jsx(Image, { className: "h-3 w-3" }), "Media"] })] }), _jsxs("div", { className: "flex items-center justify-between pt-1", children: [_jsx("span", { className: "text-[10px] text-muted-foreground", children: timeAgo(site.updatedAt) }), _jsxs("div", { className: "flex gap-1", children: [site.status === 'draft' && (_jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs", onClick: () => handleStatusChange(site.id, 'published'), children: [_jsx(Eye, { className: "h-3 w-3 mr-1" }), " Publish"] })), site.status === 'published' && (_jsx(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs", onClick: () => handleStatusChange(site.id, 'draft'), children: "Unpublish" })), _jsx(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs", onClick: () => handleDuplicate(site), children: _jsx(Copy, { className: "h-3 w-3" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", asChild: true, children: _jsx(Link, { to: `/sites/${site.id}`, children: _jsx(Settings, { className: "h-3.5 w-3.5" }) }) }), canDelete && (_jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-destructive hover:text-destructive", onClick: () => handleDelete(site.id, site.name), children: _jsx(Trash2, { className: "h-3.5 w-3.5" }) }))] })] })] })] }, site.id))) })), !isLoading && filteredSites.length === 0 && (_jsx(Card, { children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-16", children: [_jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-full bg-muted", children: _jsx(Globe, { className: "h-8 w-8 text-muted-foreground" }) }), _jsx("h3", { className: "mt-4 text-lg font-semibold", children: searchQuery || selectedStatus ? 'No matching sites' : 'No sites yet' }), _jsx("p", { className: "mt-2 text-center text-sm text-muted-foreground max-w-md", children: searchQuery || selectedStatus
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Create your first site to get started. Each site gets its own pages, theme, media library, and optional custom domain.' }), !searchQuery && !selectedStatus && canCreate && (_jsx(Button, { className: "mt-4", asChild: true, children: _jsxs(Link, { to: "/sites/new", children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Create Your First Site"] }) }))] }) }))] }));
}
//# sourceMappingURL=SitesList.js.map
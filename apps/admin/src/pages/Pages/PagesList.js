import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link, useParams } from 'react-router-dom';
import { FileText, Plus, Search, Edit, Trash2, ArrowLeft, FolderTree, List, } from 'lucide-react';
import { Card, CardContent, Button, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, cn, } from '@netrun-cms/ui';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { usePermissions } from '../../hooks/usePermissions';
function StatusBadge({ status }) {
    return (_jsx(Badge, { variant: "outline", className: cn('capitalize', status === 'published' && 'border-green-500/50 bg-green-500/10 text-green-500', status === 'draft' && 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500', status === 'scheduled' && 'border-blue-500/50 bg-blue-500/10 text-blue-500', status === 'archived' && 'border-gray-500/50 bg-gray-500/10 text-gray-500'), children: status }));
}
function TemplateBadge({ template }) {
    return (_jsx(Badge, { variant: "secondary", className: "capitalize text-xs", children: template }));
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
export function PagesList() {
    const { siteId } = useParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [pages, setPages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { canDelete } = usePermissions();
    useEffect(() => {
        if (!siteId)
            return;
        setIsLoading(true);
        setError(null);
        const params = new URLSearchParams({ limit: '100' });
        if (selectedStatus)
            params.set('status', selectedStatus);
        api
            .get('/sites/' + siteId + '/pages?' + params.toString())
            .then((res) => {
            setPages(res.data || []);
        })
            .catch((err) => {
            setError(err instanceof Error ? err.message : 'Failed to load pages');
        })
            .finally(() => setIsLoading(false));
    }, [siteId, selectedStatus]);
    const filteredPages = pages.filter((page) => {
        if (!searchQuery)
            return true;
        const q = searchQuery.toLowerCase();
        return (page.title.toLowerCase().includes(q) ||
            page.slug.toLowerCase().includes(q) ||
            page.fullPath?.toLowerCase().includes(q));
    });
    // Organize pages by hierarchy for tree view
    const rootPages = filteredPages.filter((p) => !p.parentId);
    const childPages = filteredPages.filter((p) => p.parentId);
    const handleDelete = async (pageId, title) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`))
            return;
        try {
            await api.delete('/sites/' + siteId + '/pages/' + pageId);
            setPages((prev) => prev.filter((p) => p.id !== pageId));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Delete failed');
        }
    };
    const pagePath = (page) => page.fullPath || '/' + page.slug;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Button, { variant: "ghost", size: "icon", asChild: true, children: _jsx(Link, { to: `/sites/${siteId}`, children: _jsx(ArrowLeft, { className: "h-5 w-5" }) }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Pages" }), _jsx("p", { className: "text-muted-foreground", children: "Manage pages for this site" })] })] }), _jsx(Button, { asChild: true, children: _jsxs(Link, { to: `/sites/${siteId}/pages/new`, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "New Page"] }) })] }), error && (_jsx("div", { className: "rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive", children: error })), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { className: "relative flex-1 max-w-md", children: [_jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), _jsx(Input, { placeholder: "Search pages...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-9" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "flex gap-1 border-r pr-4 mr-2", children: [_jsx(Button, { variant: viewMode === 'list' ? 'secondary' : 'ghost', size: "icon", onClick: () => setViewMode('list'), title: "List view", children: _jsx(List, { className: "h-4 w-4" }) }), _jsx(Button, { variant: viewMode === 'tree' ? 'secondary' : 'ghost', size: "icon", onClick: () => setViewMode('tree'), title: "Tree view", children: _jsx(FolderTree, { className: "h-4 w-4" }) })] }), _jsx(Button, { variant: selectedStatus === null ? 'secondary' : 'ghost', size: "sm", onClick: () => setSelectedStatus(null), children: "All" }), _jsx(Button, { variant: selectedStatus === 'published' ? 'secondary' : 'ghost', size: "sm", onClick: () => setSelectedStatus('published'), children: "Published" }), _jsx(Button, { variant: selectedStatus === 'draft' ? 'secondary' : 'ghost', size: "sm", onClick: () => setSelectedStatus('draft'), children: "Draft" })] })] }) }) }), isLoading && (_jsx(Card, { children: _jsx(CardContent, { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) }) })), !isLoading && filteredPages.length > 0 && (_jsx(Card, { children: _jsx(CardContent, { className: "p-0", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { className: "w-[350px]", children: "Page" }), _jsx(TableHead, { children: "Path" }), _jsx(TableHead, { children: "Template" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Last Updated" }), _jsx(TableHead, { className: "w-[100px]" })] }) }), _jsx(TableBody, { children: (viewMode === 'list' ? filteredPages : rootPages).map((page) => (_jsx(PageRow, { page: page, siteId: siteId, pagePath: pagePath(page), indent: false, canDelete: canDelete, onDelete: handleDelete, children: viewMode === 'tree' &&
                                        childPages
                                            .filter((child) => child.parentId === page.id)
                                            .map((child) => (_jsx(PageRow, { page: child, siteId: siteId, pagePath: pagePath(child), indent: true, canDelete: canDelete, onDelete: handleDelete }, child.id))) }, page.id))) })] }) }) })), !isLoading && filteredPages.length === 0 && (_jsx(Card, { children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-12", children: [_jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-full bg-muted", children: _jsx(FileText, { className: "h-8 w-8 text-muted-foreground" }) }), _jsx("h3", { className: "mt-4 text-lg font-semibold", children: "No pages found" }), _jsx("p", { className: "mt-2 text-center text-sm text-muted-foreground", children: searchQuery || selectedStatus
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Get started by creating your first page.' }), !searchQuery && !selectedStatus && (_jsx(Button, { className: "mt-4", asChild: true, children: _jsxs(Link, { to: `/sites/${siteId}/pages/new`, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Create Page"] }) }))] }) }))] }));
}
function PageRow({ page, siteId, pagePath, indent, canDelete, onDelete, children, }) {
    return (_jsxs(_Fragment, { children: [_jsxs(TableRow, { className: cn('group', indent && 'bg-muted/30'), children: [_jsx(TableCell, { children: _jsxs(Link, { to: `/sites/${siteId}/pages/${page.id}`, className: cn('flex items-center gap-3', indent && 'pl-8'), children: [_jsx("div", { className: cn('flex h-9 w-9 items-center justify-center rounded-lg', page.status === 'published'
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-muted text-muted-foreground'), children: _jsx(FileText, { className: "h-4 w-4" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium group-hover:text-primary", children: page.title }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["/", page.slug] })] })] }) }), _jsx(TableCell, { children: _jsx("code", { className: "rounded bg-muted px-1.5 py-0.5 text-sm", children: pagePath }) }), _jsx(TableCell, { children: _jsx(TemplateBadge, { template: page.template || 'default' }) }), _jsx(TableCell, { children: _jsx(StatusBadge, { status: page.status }) }), _jsx(TableCell, { className: "text-sm text-muted-foreground", children: timeAgo(page.updatedAt) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", asChild: true, title: "Edit", children: _jsx(Link, { to: `/sites/${siteId}/pages/${page.id}`, children: _jsx(Edit, { className: "h-4 w-4" }) }) }), canDelete && (_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-destructive hover:text-destructive", title: "Delete", onClick: () => onDelete(page.id, page.title), children: _jsx(Trash2, { className: "h-4 w-4" }) }))] }) })] }), children] }));
}
//# sourceMappingURL=PagesList.js.map
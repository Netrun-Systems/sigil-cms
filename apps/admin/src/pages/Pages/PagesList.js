import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link, useParams } from 'react-router-dom';
import { FileText, Plus, Search, Edit, Trash2, Eye, ArrowLeft, FolderTree, List, } from 'lucide-react';
import { Card, CardContent, Button, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, cn, } from '@netrun-cms/ui';
import { useState } from 'react';
const mockPages = [
    {
        id: '1',
        title: 'Home',
        slug: 'home',
        fullPath: '/',
        status: 'published',
        template: 'landing',
        parentId: null,
        lastUpdated: '2 hours ago',
        author: 'Daniel Garza',
    },
    {
        id: '2',
        title: 'About Us',
        slug: 'about',
        fullPath: '/about',
        status: 'published',
        template: 'default',
        parentId: null,
        lastUpdated: '1 day ago',
        author: 'Daniel Garza',
    },
    {
        id: '3',
        title: 'Services',
        slug: 'services',
        fullPath: '/services',
        status: 'published',
        template: 'default',
        parentId: null,
        lastUpdated: '3 days ago',
        author: 'Daniel Garza',
    },
    {
        id: '4',
        title: 'Cloud Infrastructure',
        slug: 'cloud-infrastructure',
        fullPath: '/services/cloud-infrastructure',
        status: 'published',
        template: 'product',
        parentId: '3',
        lastUpdated: '1 week ago',
        author: 'Daniel Garza',
    },
    {
        id: '5',
        title: 'DevSecOps',
        slug: 'devsecops',
        fullPath: '/services/devsecops',
        status: 'draft',
        template: 'product',
        parentId: '3',
        lastUpdated: 'Yesterday',
        author: 'Daniel Garza',
    },
    {
        id: '6',
        title: 'Contact',
        slug: 'contact',
        fullPath: '/contact',
        status: 'published',
        template: 'contact',
        parentId: null,
        lastUpdated: '5 days ago',
        author: 'Daniel Garza',
    },
    {
        id: '7',
        title: 'Blog',
        slug: 'blog',
        fullPath: '/blog',
        status: 'published',
        template: 'blog',
        parentId: null,
        lastUpdated: '2 hours ago',
        author: 'Daniel Garza',
    },
    {
        id: '8',
        title: 'Privacy Policy',
        slug: 'privacy',
        fullPath: '/privacy',
        status: 'scheduled',
        template: 'default',
        parentId: null,
        lastUpdated: '3 hours ago',
        author: 'Daniel Garza',
    },
];
function StatusBadge({ status }) {
    return (_jsx(Badge, { variant: "outline", className: cn('capitalize', status === 'published' && 'border-green-500/50 bg-green-500/10 text-green-500', status === 'draft' && 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500', status === 'scheduled' && 'border-blue-500/50 bg-blue-500/10 text-blue-500', status === 'archived' && 'border-gray-500/50 bg-gray-500/10 text-gray-500'), children: status }));
}
function TemplateBadge({ template }) {
    return (_jsx(Badge, { variant: "secondary", className: "capitalize text-xs", children: template }));
}
export function PagesList() {
    const { siteId } = useParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const filteredPages = mockPages.filter((page) => {
        const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            page.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
            page.fullPath.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !selectedStatus || page.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });
    // Organize pages by hierarchy for tree view
    const rootPages = filteredPages.filter((p) => !p.parentId);
    const childPages = filteredPages.filter((p) => p.parentId);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Button, { variant: "ghost", size: "icon", asChild: true, children: _jsx(Link, { to: `/sites/${siteId}`, children: _jsx(ArrowLeft, { className: "h-5 w-5" }) }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Pages" }), _jsx("p", { className: "text-muted-foreground", children: "Manage pages for Netrun Systems" })] })] }), _jsx(Button, { asChild: true, children: _jsxs(Link, { to: `/sites/${siteId}/pages/new`, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "New Page"] }) })] }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { className: "relative flex-1 max-w-md", children: [_jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), _jsx(Input, { placeholder: "Search pages...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-9" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "flex gap-1 border-r pr-4 mr-2", children: [_jsx(Button, { variant: viewMode === 'list' ? 'secondary' : 'ghost', size: "icon", onClick: () => setViewMode('list'), title: "List view", children: _jsx(List, { className: "h-4 w-4" }) }), _jsx(Button, { variant: viewMode === 'tree' ? 'secondary' : 'ghost', size: "icon", onClick: () => setViewMode('tree'), title: "Tree view", children: _jsx(FolderTree, { className: "h-4 w-4" }) })] }), _jsx(Button, { variant: selectedStatus === null ? 'secondary' : 'ghost', size: "sm", onClick: () => setSelectedStatus(null), children: "All" }), _jsx(Button, { variant: selectedStatus === 'published' ? 'secondary' : 'ghost', size: "sm", onClick: () => setSelectedStatus('published'), children: "Published" }), _jsx(Button, { variant: selectedStatus === 'draft' ? 'secondary' : 'ghost', size: "sm", onClick: () => setSelectedStatus('draft'), children: "Draft" })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-0", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { className: "w-[350px]", children: "Page" }), _jsx(TableHead, { children: "Path" }), _jsx(TableHead, { children: "Template" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Last Updated" }), _jsx(TableHead, { className: "w-[100px]" })] }) }), _jsx(TableBody, { children: (viewMode === 'list' ? filteredPages : rootPages).map((page) => (_jsxs(_Fragment, { children: [_jsxs(TableRow, { className: "group", children: [_jsx(TableCell, { children: _jsxs(Link, { to: `/sites/${siteId}/pages/${page.id}`, className: "flex items-center gap-3", children: [_jsx("div", { className: cn('flex h-9 w-9 items-center justify-center rounded-lg', page.status === 'published'
                                                                    ? 'bg-primary/10 text-primary'
                                                                    : 'bg-muted text-muted-foreground'), children: _jsx(FileText, { className: "h-4 w-4" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium group-hover:text-primary", children: page.title }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["by ", page.author] })] })] }) }), _jsx(TableCell, { children: _jsx("code", { className: "rounded bg-muted px-1.5 py-0.5 text-sm", children: page.fullPath }) }), _jsx(TableCell, { children: _jsx(TemplateBadge, { template: page.template }) }), _jsx(TableCell, { children: _jsx(StatusBadge, { status: page.status }) }), _jsx(TableCell, { className: "text-sm text-muted-foreground", children: page.lastUpdated }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", title: "Preview", children: _jsx(Eye, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", asChild: true, title: "Edit", children: _jsx(Link, { to: `/sites/${siteId}/pages/${page.id}`, children: _jsx(Edit, { className: "h-4 w-4" }) }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-destructive hover:text-destructive", title: "Delete", children: _jsx(Trash2, { className: "h-4 w-4" }) })] }) })] }, page.id), viewMode === 'tree' &&
                                            childPages
                                                .filter((child) => child.parentId === page.id)
                                                .map((child) => (_jsxs(TableRow, { className: "group bg-muted/30", children: [_jsx(TableCell, { children: _jsxs(Link, { to: `/sites/${siteId}/pages/${child.id}`, className: "flex items-center gap-3 pl-8", children: [_jsx("div", { className: cn('flex h-9 w-9 items-center justify-center rounded-lg', child.status === 'published'
                                                                        ? 'bg-primary/10 text-primary'
                                                                        : 'bg-muted text-muted-foreground'), children: _jsx(FileText, { className: "h-4 w-4" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium group-hover:text-primary", children: child.title }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["by ", child.author] })] })] }) }), _jsx(TableCell, { children: _jsx("code", { className: "rounded bg-muted px-1.5 py-0.5 text-sm", children: child.fullPath }) }), _jsx(TableCell, { children: _jsx(TemplateBadge, { template: child.template }) }), _jsx(TableCell, { children: _jsx(StatusBadge, { status: child.status }) }), _jsx(TableCell, { className: "text-sm text-muted-foreground", children: child.lastUpdated }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", title: "Preview", children: _jsx(Eye, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", asChild: true, title: "Edit", children: _jsx(Link, { to: `/sites/${siteId}/pages/${child.id}`, children: _jsx(Edit, { className: "h-4 w-4" }) }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-destructive hover:text-destructive", title: "Delete", children: _jsx(Trash2, { className: "h-4 w-4" }) })] }) })] }, child.id)))] }))) })] }) }) }), filteredPages.length === 0 && (_jsx(Card, { children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-12", children: [_jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-full bg-muted", children: _jsx(FileText, { className: "h-8 w-8 text-muted-foreground" }) }), _jsx("h3", { className: "mt-4 text-lg font-semibold", children: "No pages found" }), _jsx("p", { className: "mt-2 text-center text-sm text-muted-foreground", children: searchQuery || selectedStatus
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Get started by creating your first page.' }), !searchQuery && !selectedStatus && (_jsx(Button, { className: "mt-4", asChild: true, children: _jsxs(Link, { to: `/sites/${siteId}/pages/new`, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Create Page"] }) }))] }) }))] }));
}
//# sourceMappingURL=PagesList.js.map
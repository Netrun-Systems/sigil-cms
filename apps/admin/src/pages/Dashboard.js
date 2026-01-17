import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Globe, FileText, Image, Eye, TrendingUp, Clock, Plus, ArrowUpRight, } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, cn, } from '@netrun-cms/ui';
function StatCard({ title, value, description, icon: Icon, trend }) {
    return (_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: title }), _jsx(Icon, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: value }), _jsxs("div", { className: "flex items-center gap-2", children: [trend && (_jsxs("span", { className: cn('flex items-center text-xs', trend.isPositive ? 'text-green-500' : 'text-red-500'), children: [_jsx(TrendingUp, { className: cn('mr-1 h-3 w-3', !trend.isPositive && 'rotate-180') }), trend.value, "%"] })), _jsx("p", { className: "text-xs text-muted-foreground", children: description })] })] })] }));
}
const mockActivity = [
    {
        id: '1',
        type: 'page',
        action: 'published',
        title: 'About Us',
        site: 'Netrun Systems',
        timestamp: '2 hours ago',
    },
    {
        id: '2',
        type: 'media',
        action: 'created',
        title: 'hero-banner.png',
        site: 'Netrun Systems',
        timestamp: '4 hours ago',
    },
    {
        id: '3',
        type: 'page',
        action: 'updated',
        title: 'Services',
        site: 'Netrun Systems',
        timestamp: '6 hours ago',
    },
    {
        id: '4',
        type: 'site',
        action: 'created',
        title: 'Client Portal',
        site: 'Client Portal',
        timestamp: 'Yesterday',
    },
    {
        id: '5',
        type: 'page',
        action: 'published',
        title: 'Contact',
        site: 'Netrun Systems',
        timestamp: 'Yesterday',
    },
];
const quickActions = [
    {
        label: 'Create Site',
        href: '/sites/new',
        icon: Globe,
        description: 'Set up a new website',
    },
    {
        label: 'New Page',
        href: '/sites',
        icon: FileText,
        description: 'Add content to your site',
    },
    {
        label: 'Upload Media',
        href: '/media',
        icon: Image,
        description: 'Add images and files',
    },
];
export function Dashboard() {
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Dashboard" }), _jsx("p", { className: "text-muted-foreground", children: "Welcome back! Here's what's happening with your sites." })] }), _jsx(Button, { asChild: true, children: _jsxs(Link, { to: "/sites/new", children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "New Site"] }) })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [_jsx(StatCard, { title: "Total Sites", value: 3, description: "Active websites", icon: Globe }), _jsx(StatCard, { title: "Total Pages", value: 24, description: "Across all sites", icon: FileText, trend: { value: 12, isPositive: true } }), _jsx(StatCard, { title: "Media Files", value: 156, description: "Images, videos, docs", icon: Image }), _jsx(StatCard, { title: "Page Views", value: "12.4K", description: "Last 30 days", icon: Eye, trend: { value: 8, isPositive: true } })] }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [_jsxs(Card, { className: "lg:col-span-2", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: "Recent Activity" }), _jsx(CardDescription, { children: "Latest changes across your sites" })] }), _jsx(Button, { variant: "ghost", size: "sm", asChild: true, children: _jsxs(Link, { to: "/activity", children: ["View All", _jsx(ArrowUpRight, { className: "ml-1 h-4 w-4" })] }) })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: mockActivity.map((item) => (_jsxs("div", { className: "flex items-center gap-4 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50", children: [_jsxs("div", { className: cn('flex h-10 w-10 items-center justify-center rounded-lg', item.type === 'page' && 'bg-blue-500/10 text-blue-500', item.type === 'media' && 'bg-purple-500/10 text-purple-500', item.type === 'site' && 'bg-green-500/10 text-green-500'), children: [item.type === 'page' && _jsx(FileText, { className: "h-5 w-5" }), item.type === 'media' && _jsx(Image, { className: "h-5 w-5" }), item.type === 'site' && _jsx(Globe, { className: "h-5 w-5" })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "truncate font-medium", children: item.title }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [item.action.charAt(0).toUpperCase() + item.action.slice(1), " in", ' ', _jsx("span", { className: "text-foreground", children: item.site })] })] }), _jsxs("div", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [_jsx(Clock, { className: "h-3 w-3" }), item.timestamp] })] }, item.id))) }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Quick Actions" }), _jsx(CardDescription, { children: "Common tasks at your fingertips" })] }), _jsx(CardContent, { className: "space-y-3", children: quickActions.map((action) => (_jsxs(Link, { to: action.href, className: "flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary", children: _jsx(action.icon, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: action.label }), _jsx("p", { className: "text-sm text-muted-foreground", children: action.description })] })] }, action.label))) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: "Your Sites" }), _jsx(CardDescription, { children: "Manage your websites" })] }), _jsx(Button, { variant: "outline", size: "sm", asChild: true, children: _jsx(Link, { to: "/sites", children: "View All Sites" }) })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: [
                                {
                                    name: 'Netrun Systems',
                                    domain: 'netrunsystems.com',
                                    pages: 12,
                                    status: 'published',
                                },
                                {
                                    name: 'Client Portal',
                                    domain: 'portal.netrunsystems.com',
                                    pages: 8,
                                    status: 'draft',
                                },
                                {
                                    name: 'Documentation',
                                    domain: 'docs.netrunsystems.com',
                                    pages: 4,
                                    status: 'published',
                                },
                            ].map((site) => (_jsxs(Link, { to: `/sites/${site.name.toLowerCase().replace(/\s+/g, '-')}`, className: "group rounded-lg border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary", children: _jsx(Globe, { className: "h-5 w-5" }) }), _jsx("span", { className: cn('rounded-full px-2 py-0.5 text-xs font-medium', site.status === 'published'
                                                    ? 'bg-green-500/10 text-green-500'
                                                    : 'bg-yellow-500/10 text-yellow-500'), children: site.status })] }), _jsxs("div", { className: "mt-4", children: [_jsx("h3", { className: "font-semibold group-hover:text-primary", children: site.name }), _jsx("p", { className: "text-sm text-muted-foreground", children: site.domain }), _jsxs("p", { className: "mt-2 text-sm text-muted-foreground", children: [site.pages, " pages"] })] })] }, site.name))) }) })] })] }));
}
//# sourceMappingURL=Dashboard.js.map
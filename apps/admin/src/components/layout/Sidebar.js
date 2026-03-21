import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, useParams } from 'react-router-dom';
import { LayoutDashboard, Globe, FileText, Image, Palette, Settings, CreditCard, ChevronDown, } from 'lucide-react';
import { cn } from '@netrun-cms/ui';
import { useState } from 'react';
import { usePluginManifest } from '../../hooks/usePluginManifest';
import { usePermissions } from '../../hooks/usePermissions';
import { getIcon } from '../../lib/iconRegistry';
const mainNavItems = [
    {
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/dashboard',
    },
    {
        label: 'Sites',
        icon: Globe,
        href: '/sites',
    },
    {
        label: 'Media Library',
        icon: Image,
        href: '/media',
    },
    {
        label: 'Themes',
        icon: Palette,
        href: '/themes',
    },
];
function NavItemComponent({ item }) {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = item.children && item.children.length > 0;
    return (_jsxs("div", { children: [hasChildren ? (_jsxs("button", { onClick: () => setIsOpen(!isOpen), className: cn('flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'), children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(item.icon, { className: "h-5 w-5" }), _jsx("span", { children: item.label })] }), _jsx(ChevronDown, { className: cn('h-4 w-4 transition-transform', isOpen && 'rotate-180') })] })) : (_jsxs(NavLink, { to: item.href, className: ({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'), children: [_jsx(item.icon, { className: "h-5 w-5" }), _jsx("span", { children: item.label }), item.badge !== undefined && (_jsx("span", { className: "ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary", children: item.badge }))] })), hasChildren && isOpen && (_jsx("div", { className: "ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-4", children: item.children?.map((child) => (_jsxs(NavLink, { to: child.href, className: ({ isActive }) => cn('flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors', isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'), children: [_jsx(child.icon, { className: "h-4 w-4" }), _jsx("span", { children: child.label })] }, child.href))) }))] }));
}
export function Sidebar() {
    const { siteId } = useParams();
    const { manifest } = usePluginManifest();
    const { canManageSettings, canViewAnalytics } = usePermissions();
    // Collect global (non-site-scoped) plugin nav items for the main nav
    const globalPluginNav = [];
    // Collect site-scoped plugin nav sections
    const sitePluginSections = [];
    if (manifest) {
        // Plugin IDs that require canViewAnalytics permission
        const analyticsPluginIds = new Set(['advisor']);
        for (const plugin of manifest.plugins) {
            if (!plugin.enabled)
                continue;
            // Hide analytics-gated plugins (e.g. AI Advisor) for non-privileged roles
            if (analyticsPluginIds.has(plugin.id) && !canViewAnalytics)
                continue;
            for (const section of plugin.nav) {
                if (section.siteScoped) {
                    sitePluginSections.push({
                        title: section.title,
                        items: section.items.map((item) => ({
                            label: item.label,
                            icon: getIcon(item.icon),
                            href: siteId ? `/sites/${siteId}/${item.href}` : `/${item.href}`,
                        })),
                    });
                }
                else {
                    for (const item of section.items) {
                        globalPluginNav.push({
                            label: item.label,
                            icon: getIcon(item.icon),
                            href: item.href.startsWith('/') ? item.href : `/${item.href}`,
                        });
                    }
                }
            }
        }
    }
    const allMainNavItems = [...mainNavItems, ...globalPluginNav];
    return (_jsxs("aside", { className: "fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar", children: [_jsxs("div", { className: "flex h-16 items-center gap-3 border-b border-sidebar-border px-6", children: [_jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-primary", children: _jsx("span", { className: "text-lg font-bold text-primary-foreground", children: "N" }) }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "text-sm font-bold text-sidebar-foreground", children: "Sigil" }), _jsx("span", { className: "text-xs text-sidebar-foreground/60", children: "by Netrun" })] })] }), _jsxs("nav", { className: "flex-1 overflow-y-auto px-3 py-4", children: [_jsx("div", { className: "space-y-1", children: allMainNavItems.map((item) => (_jsx(NavItemComponent, { item: item }, item.href))) }), siteId && (_jsxs("div", { className: "mt-6", children: [_jsx("div", { className: "mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50", children: "Current Site" }), _jsxs("div", { className: "space-y-1", children: [_jsxs(NavLink, { to: `/sites/${siteId}/pages`, className: ({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', isActive
                                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'), children: [_jsx(FileText, { className: "h-5 w-5" }), _jsx("span", { children: "Pages" })] }), _jsxs(NavLink, { to: `/sites/${siteId}/media`, className: ({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', isActive
                                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'), children: [_jsx(Image, { className: "h-5 w-5" }), _jsx("span", { children: "Media" })] }), _jsxs(NavLink, { to: `/sites/${siteId}/themes`, className: ({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', isActive
                                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'), children: [_jsx(Palette, { className: "h-5 w-5" }), _jsx("span", { children: "Theme" })] })] }), sitePluginSections.map((section) => (_jsxs("div", { children: [_jsx("div", { className: "mb-2 mt-4 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50", children: section.title }), _jsx("div", { className: "space-y-1", children: section.items.map((item) => (_jsxs(NavLink, { to: item.href, className: ({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', isActive
                                                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'), children: [_jsx(item.icon, { className: "h-5 w-5" }), _jsx("span", { children: item.label })] }, item.href))) })] }, section.title)))] }))] }), canManageSettings && (_jsxs("div", { className: "border-t border-sidebar-border p-4 space-y-1", children: [_jsxs(NavLink, { to: "/billing", className: ({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors', isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'), children: [_jsx(CreditCard, { className: "h-5 w-5" }), _jsx("span", { children: "Billing" })] }), _jsxs(NavLink, { to: "/settings", className: ({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors', isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'), children: [_jsx(Settings, { className: "h-5 w-5" }), _jsx("span", { children: "Settings" })] })] }))] }));
}
//# sourceMappingURL=Sidebar.js.map
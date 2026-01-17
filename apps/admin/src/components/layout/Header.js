import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from 'react-router-dom';
import { Bell, Search, Moon, Sun, User, LogOut, Settings, HelpCircle, ChevronRight, } from 'lucide-react';
import { Button } from '@netrun-cms/ui';
import { useTheme } from '@netrun-cms/theme';
import { useState, useRef, useEffect } from 'react';
function getBreadcrumbs(pathname) {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Home', href: '/dashboard' }];
    let currentPath = '';
    for (const segment of segments) {
        currentPath += `/${segment}`;
        // Skip UUID-like segments but keep them in the path
        if (segment.match(/^[0-9a-f-]{36}$/i)) {
            continue;
        }
        const label = segment
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        breadcrumbs.push({ label, href: currentPath });
    }
    // Mark the last item as current (no href)
    if (breadcrumbs.length > 1) {
        const last = breadcrumbs[breadcrumbs.length - 1];
        last.href = undefined;
    }
    return breadcrumbs;
}
export function Header() {
    const { mode, toggleMode, isDark } = useTheme();
    const location = useLocation();
    const breadcrumbs = getBreadcrumbs(location.pathname);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const menuRef = useRef(null);
    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (_jsxs("header", { className: "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60", children: [_jsx("nav", { className: "flex items-center gap-1 text-sm", children: breadcrumbs.map((crumb, index) => (_jsxs("span", { className: "flex items-center gap-1", children: [index > 0 && (_jsx(ChevronRight, { className: "h-4 w-4 text-muted-foreground" })), crumb.href ? (_jsx(Link, { to: crumb.href, className: "text-muted-foreground transition-colors hover:text-foreground", children: crumb.label })) : (_jsx("span", { className: "font-medium text-foreground", children: crumb.label }))] }, index))) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-9 w-9 text-muted-foreground", "aria-label": "Search", children: _jsx(Search, { className: "h-5 w-5" }) }), _jsx(Button, { variant: "ghost", size: "icon", onClick: toggleMode, className: "h-9 w-9 text-muted-foreground", "aria-label": isDark ? 'Switch to light mode' : 'Switch to dark mode', children: isDark ? _jsx(Sun, { className: "h-5 w-5" }) : _jsx(Moon, { className: "h-5 w-5" }) }), _jsxs(Button, { variant: "ghost", size: "icon", className: "relative h-9 w-9 text-muted-foreground", "aria-label": "Notifications", children: [_jsx(Bell, { className: "h-5 w-5" }), _jsx("span", { className: "absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" })] }), _jsxs("div", { className: "relative", ref: menuRef, children: [_jsxs("button", { onClick: () => setUserMenuOpen(!userMenuOpen), className: "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent", children: [_jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary", children: "DG" }), _jsxs("div", { className: "hidden text-left md:block", children: [_jsx("p", { className: "text-sm font-medium", children: "Daniel Garza" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Admin" })] })] }), userMenuOpen && (_jsxs("div", { className: "absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-popover p-1 shadow-lg", children: [_jsxs("div", { className: "px-3 py-2", children: [_jsx("p", { className: "text-sm font-medium", children: "Daniel Garza" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "admin@netrunsystems.com" })] }), _jsx("div", { className: "my-1 h-px bg-border" }), _jsxs("button", { className: "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent", children: [_jsx(User, { className: "h-4 w-4" }), "Profile"] }), _jsxs("button", { className: "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent", children: [_jsx(Settings, { className: "h-4 w-4" }), "Settings"] }), _jsxs("button", { className: "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent", children: [_jsx(HelpCircle, { className: "h-4 w-4" }), "Help & Support"] }), _jsx("div", { className: "my-1 h-px bg-border" }), _jsxs("button", { className: "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10", children: [_jsx(LogOut, { className: "h-4 w-4" }), "Sign Out"] })] }))] })] })] }));
}
//# sourceMappingURL=Header.js.map
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { RequireAuth } from './lib/auth';
import { PluginRoutes } from './components/PluginRoutes';
// Eagerly loaded (always needed)
import { LoginPage } from './pages/LoginPage';
// Lazy-loaded core pages (code split)
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const SitesList = lazy(() => import('./pages/Sites/SitesList').then(m => ({ default: m.SitesList })));
const SiteEditor = lazy(() => import('./pages/Sites/SiteEditor').then(m => ({ default: m.SiteEditor })));
const PagesList = lazy(() => import('./pages/Pages/PagesList').then(m => ({ default: m.PagesList })));
const PageEditor = lazy(() => import('./pages/Pages/PageEditor').then(m => ({ default: m.PageEditor })));
const MediaLibrary = lazy(() => import('./pages/Media/MediaLibrary').then(m => ({ default: m.MediaLibrary })));
const ThemeEditor = lazy(() => import('./pages/Themes/ThemeEditor').then(m => ({ default: m.ThemeEditor })));
function PageLoader() {
    return (_jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) }));
}
function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsxs(Route, { path: "/", element: _jsx(RequireAuth, { children: _jsx(AdminLayout, {}) }), children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "/dashboard", replace: true }) }), _jsx(Route, { path: "dashboard", element: _jsx(Suspense, { fallback: _jsx(PageLoader, {}), children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "sites", element: _jsx(Suspense, { fallback: _jsx(PageLoader, {}), children: _jsx(SitesList, {}) }) }), _jsx(Route, { path: "sites/new", element: _jsx(Suspense, { fallback: _jsx(PageLoader, {}), children: _jsx(SiteEditor, {}) }) }), _jsx(Route, { path: "sites/:siteId", element: _jsx(Suspense, { fallback: _jsx(PageLoader, {}), children: _jsx(SiteEditor, {}) }) }), _jsx(Route, { path: "sites/:siteId/pages", element: _jsx(Suspense, { fallback: _jsx(PageLoader, {}), children: _jsx(PagesList, {}) }) }), _jsx(Route, { path: "sites/:siteId/pages/new", element: _jsx(Suspense, { fallback: _jsx(PageLoader, {}), children: _jsx(PageEditor, {}) }) }), _jsx(Route, { path: "sites/:siteId/pages/:pageId", element: _jsx(Suspense, { fallback: _jsx(PageLoader, {}), children: _jsx(PageEditor, {}) }) }), _jsx(Route, { path: "media", element: _jsx(Suspense, { fallback: _jsx(PageLoader, {}), children: _jsx(MediaLibrary, {}) }) }), _jsx(Route, { path: "sites/:siteId/media", element: _jsx(Suspense, { fallback: _jsx(PageLoader, {}), children: _jsx(MediaLibrary, {}) }) }), _jsx(Route, { path: "themes", element: _jsx(Suspense, { fallback: _jsx(PageLoader, {}), children: _jsx(ThemeEditor, {}) }) }), _jsx(Route, { path: "sites/:siteId/themes", element: _jsx(Suspense, { fallback: _jsx(PageLoader, {}), children: _jsx(ThemeEditor, {}) }) }), _jsx(PluginRoutes, {})] })] }));
}
export default App;
//# sourceMappingURL=App.js.map
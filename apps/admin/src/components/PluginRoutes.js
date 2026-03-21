import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * PluginRoutes — Dynamically renders Route elements for plugin admin pages
 *
 * Reads the plugin manifest and creates React.lazy routes for each
 * plugin's registered admin routes. Falls back gracefully if a
 * plugin component fails to load.
 */
import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import { usePluginManifest } from '../hooks/usePluginManifest';
function PluginPageLoader() {
    return (_jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) }));
}
/**
 * Plugin pages are statically imported based on known plugin IDs.
 * We use a lookup map rather than true dynamic imports because Vite
 * needs to know the import paths at build time.
 */
const pluginPageMap = {};
// Lazily register known plugin pages
const knownPluginPages = {
    // Artist plugin pages
    'sites/:siteId/releases': () => import('../pages/Releases/ReleasesList').then(m => ({ default: m.ReleasesList })),
    'sites/:siteId/releases/new': () => import('../pages/Releases/ReleaseEditor').then(m => ({ default: m.ReleaseEditor })),
    'sites/:siteId/releases/:id': () => import('../pages/Releases/ReleaseEditor').then(m => ({ default: m.ReleaseEditor })),
    'sites/:siteId/events': () => import('../pages/Events/EventsList').then(m => ({ default: m.EventsList })),
    'sites/:siteId/events/new': () => import('../pages/Events/EventEditor').then(m => ({ default: m.EventEditor })),
    'sites/:siteId/events/:id': () => import('../pages/Events/EventEditor').then(m => ({ default: m.EventEditor })),
    'sites/:siteId/profile': () => import('../pages/Profile/ProfilePage').then(m => ({ default: m.ProfilePage })),
    // Photos plugin
    'sites/:siteId/photos': () => import('../pages/Photos/PhotoCuratorPage').then(m => ({ default: m.PhotoCuratorPage })),
    // Mailing list plugin
    'sites/:siteId/subscribers': () => import('../pages/Subscribers/SubscribersList').then(m => ({ default: m.SubscribersList })),
    // Contact plugin
    'sites/:siteId/contacts': () => import('../pages/Contacts/ContactsList').then(m => ({ default: m.ContactsList })),
    // Advisor plugin
    'advisor': () => import('../pages/AdvisorPage').then(m => ({ default: m.AdvisorPage })),
    // Store plugin
    'sites/:siteId/store/products': () => import('../pages/Store/ProductsList').then(m => ({ default: m.ProductsList })),
    'sites/:siteId/store/orders': () => import('../pages/Store/OrdersList').then(m => ({ default: m.OrdersList })),
    // Merch plugin
    'sites/:siteId/merch': () => import('../pages/Merch/MerchList').then(m => ({ default: m.MerchList })),
    // Booking plugin
    'sites/:siteId/booking/services': () => import('../pages/Booking/ServicesList').then(m => ({ default: m.ServicesList })),
    'sites/:siteId/booking/appointments': () => import('../pages/Booking/AppointmentsList').then(m => ({ default: m.AppointmentsList })),
    'sites/:siteId/booking/availability': () => import('../pages/Booking/AvailabilityEditor').then(m => ({ default: m.AvailabilityEditor })),
    // Docs plugin
    'sites/:siteId/docs/articles': () => import('../pages/Docs/ArticlesList').then(m => ({ default: m.ArticlesList })),
    'sites/:siteId/docs/categories': () => import('../pages/Docs/CategoriesList').then(m => ({ default: m.CategoriesList })),
    'sites/:siteId/docs/feedback': () => import('../pages/Docs/FeedbackList').then(m => ({ default: m.FeedbackList })),
    // Resonance plugin
    'sites/:siteId/resonance': () => import('../pages/Resonance/ResonanceDashboard').then(m => ({ default: m.ResonanceDashboard })),
    'sites/:siteId/resonance/experiments': () => import('../pages/Resonance/ExperimentsList').then(m => ({ default: m.ExperimentsList })),
};
// Create lazy components for known pages
const lazyComponents = new Map();
function getLazyComponent(path) {
    if (lazyComponents.has(path))
        return lazyComponents.get(path);
    const loader = knownPluginPages[path];
    if (!loader)
        return null;
    const component = lazy(loader);
    lazyComponents.set(path, component);
    return component;
}
export function PluginRoutes() {
    const { manifest, loading } = usePluginManifest();
    if (loading || !manifest)
        return null;
    const routes = [];
    for (const plugin of manifest.plugins) {
        if (!plugin.enabled)
            continue;
        for (const route of plugin.routes) {
            const LazyComponent = getLazyComponent(route.path);
            if (!LazyComponent)
                continue;
            routes.push(_jsx(Route, { path: route.path, element: _jsx(Suspense, { fallback: _jsx(PluginPageLoader, {}), children: _jsx(LazyComponent, {}) }) }, `${plugin.id}-${route.path}`));
        }
    }
    return _jsx(_Fragment, { children: routes });
}
//# sourceMappingURL=PluginRoutes.js.map
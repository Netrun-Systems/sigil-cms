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
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

/**
 * Plugin pages are statically imported based on known plugin IDs.
 * We use a lookup map rather than true dynamic imports because Vite
 * needs to know the import paths at build time.
 */
const pluginPageMap: Record<string, React.ComponentType> = {};

// Lazily register known plugin pages
const knownPluginPages: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  // Artist plugin pages
  'sites/:siteId/releases': () => import('../pages/Releases/ReleasesList').then(m => ({ default: m.ReleasesList as React.ComponentType })),
  'sites/:siteId/releases/new': () => import('../pages/Releases/ReleaseEditor').then(m => ({ default: m.ReleaseEditor as React.ComponentType })),
  'sites/:siteId/releases/:id': () => import('../pages/Releases/ReleaseEditor').then(m => ({ default: m.ReleaseEditor as React.ComponentType })),
  'sites/:siteId/events': () => import('../pages/Events/EventsList').then(m => ({ default: m.EventsList as React.ComponentType })),
  'sites/:siteId/events/new': () => import('../pages/Events/EventEditor').then(m => ({ default: m.EventEditor as React.ComponentType })),
  'sites/:siteId/events/:id': () => import('../pages/Events/EventEditor').then(m => ({ default: m.EventEditor as React.ComponentType })),
  'sites/:siteId/profile': () => import('../pages/Profile/ProfilePage').then(m => ({ default: m.ProfilePage as React.ComponentType })),
  // Photos plugin
  'sites/:siteId/photos': () => import('../pages/Photos/PhotoCuratorPage').then(m => ({ default: m.PhotoCuratorPage as React.ComponentType })),
  // Mailing list plugin
  'sites/:siteId/subscribers': () => import('../pages/Subscribers/SubscribersList').then(m => ({ default: m.SubscribersList as React.ComponentType })),
  // Contact plugin
  'sites/:siteId/contacts': () => import('../pages/Contacts/ContactsList').then(m => ({ default: m.ContactsList as React.ComponentType })),
  // Advisor plugin
  'advisor': () => import('../pages/AdvisorPage').then(m => ({ default: m.AdvisorPage as React.ComponentType })),
  // Store plugin
  'sites/:siteId/store/products': () => import('../pages/Store/ProductsList').then(m => ({ default: m.ProductsList as React.ComponentType })),
  'sites/:siteId/store/orders': () => import('../pages/Store/OrdersList').then(m => ({ default: m.OrdersList as React.ComponentType })),
  // Merch plugin
  'sites/:siteId/merch': () => import('../pages/Merch/MerchList').then(m => ({ default: m.MerchList as React.ComponentType })),
  // Booking plugin
  'sites/:siteId/booking/services': () => import('../pages/Booking/ServicesList').then(m => ({ default: m.ServicesList as React.ComponentType })),
  'sites/:siteId/booking/appointments': () => import('../pages/Booking/AppointmentsList').then(m => ({ default: m.AppointmentsList as React.ComponentType })),
  'sites/:siteId/booking/availability': () => import('../pages/Booking/AvailabilityEditor').then(m => ({ default: m.AvailabilityEditor as React.ComponentType })),
  // Docs plugin
  'sites/:siteId/docs/articles': () => import('../pages/Docs/ArticlesList').then(m => ({ default: m.ArticlesList as React.ComponentType })),
  'sites/:siteId/docs/categories': () => import('../pages/Docs/CategoriesList').then(m => ({ default: m.CategoriesList as React.ComponentType })),
  'sites/:siteId/docs/feedback': () => import('../pages/Docs/FeedbackList').then(m => ({ default: m.FeedbackList as React.ComponentType })),
  // Resonance plugin
  'sites/:siteId/resonance': () => import('../pages/Resonance/ResonanceDashboard').then(m => ({ default: m.ResonanceDashboard as React.ComponentType })),
  'sites/:siteId/resonance/experiments': () => import('../pages/Resonance/ExperimentsList').then(m => ({ default: m.ExperimentsList as React.ComponentType })),
};

// Create lazy components for known pages
const lazyComponents = new Map<string, React.LazyExoticComponent<React.ComponentType>>();

function getLazyComponent(path: string): React.LazyExoticComponent<React.ComponentType> | null {
  if (lazyComponents.has(path)) return lazyComponents.get(path)!;

  const loader = knownPluginPages[path];
  if (!loader) return null;

  const component = lazy(loader);
  lazyComponents.set(path, component);
  return component;
}

export function PluginRoutes() {
  const { manifest, loading } = usePluginManifest();

  if (loading || !manifest) return null;

  const routes: React.ReactNode[] = [];

  for (const plugin of manifest.plugins) {
    if (!plugin.enabled) continue;

    for (const route of plugin.routes) {
      const LazyComponent = getLazyComponent(route.path);
      if (!LazyComponent) continue;

      routes.push(
        <Route
          key={`${plugin.id}-${route.path}`}
          path={route.path}
          element={
            <Suspense fallback={<PluginPageLoader />}>
              <LazyComponent />
            </Suspense>
          }
        />
      );
    }
  }

  return <>{routes}</>;
}

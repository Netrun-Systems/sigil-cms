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
const BillingPage = lazy(() => import('./pages/Billing/BillingPage').then(m => ({ default: m.BillingPage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />

        {/* Sites */}
        <Route path="sites" element={<Suspense fallback={<PageLoader />}><SitesList /></Suspense>} />
        <Route path="sites/new" element={<Suspense fallback={<PageLoader />}><SiteEditor /></Suspense>} />
        <Route path="sites/:siteId" element={<Suspense fallback={<PageLoader />}><SiteEditor /></Suspense>} />

        {/* Pages */}
        <Route path="sites/:siteId/pages" element={<Suspense fallback={<PageLoader />}><PagesList /></Suspense>} />
        <Route path="sites/:siteId/pages/new" element={<Suspense fallback={<PageLoader />}><PageEditor /></Suspense>} />
        <Route path="sites/:siteId/pages/:pageId" element={<Suspense fallback={<PageLoader />}><PageEditor /></Suspense>} />

        {/* Media */}
        <Route path="media" element={<Suspense fallback={<PageLoader />}><MediaLibrary /></Suspense>} />
        <Route path="sites/:siteId/media" element={<Suspense fallback={<PageLoader />}><MediaLibrary /></Suspense>} />

        {/* Themes */}
        <Route path="themes" element={<Suspense fallback={<PageLoader />}><ThemeEditor /></Suspense>} />
        <Route path="sites/:siteId/themes" element={<Suspense fallback={<PageLoader />}><ThemeEditor /></Suspense>} />

        {/* Billing */}
        <Route path="billing" element={<Suspense fallback={<PageLoader />}><BillingPage /></Suspense>} />

        {/* Plugin routes — dynamically rendered from manifest */}
        <PluginRoutes />
      </Route>
    </Routes>
  );
}

export default App;

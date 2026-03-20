import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { RequireAuth } from './lib/auth';

// Eagerly loaded (always needed)
import { LoginPage } from './pages/LoginPage';

// Lazy-loaded pages (code split)
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const SitesList = lazy(() => import('./pages/Sites/SitesList').then(m => ({ default: m.SitesList })));
const SiteEditor = lazy(() => import('./pages/Sites/SiteEditor').then(m => ({ default: m.SiteEditor })));
const PagesList = lazy(() => import('./pages/Pages/PagesList').then(m => ({ default: m.PagesList })));
const PageEditor = lazy(() => import('./pages/Pages/PageEditor').then(m => ({ default: m.PageEditor })));
const MediaLibrary = lazy(() => import('./pages/Media/MediaLibrary').then(m => ({ default: m.MediaLibrary })));
const ThemeEditor = lazy(() => import('./pages/Themes/ThemeEditor').then(m => ({ default: m.ThemeEditor })));
const ReleasesList = lazy(() => import('./pages/Releases/ReleasesList').then(m => ({ default: m.ReleasesList })));
const ReleaseEditor = lazy(() => import('./pages/Releases/ReleaseEditor').then(m => ({ default: m.ReleaseEditor })));
const EventsList = lazy(() => import('./pages/Events/EventsList').then(m => ({ default: m.EventsList })));
const EventEditor = lazy(() => import('./pages/Events/EventEditor').then(m => ({ default: m.EventEditor })));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage').then(m => ({ default: m.ProfilePage })));
const AdvisorPage = lazy(() => import('./pages/AdvisorPage').then(m => ({ default: m.AdvisorPage })));
const PhotoCuratorPage = lazy(() => import('./pages/Photos/PhotoCuratorPage').then(m => ({ default: m.PhotoCuratorPage })));
const SubscribersList = lazy(() => import('./pages/Subscribers/SubscribersList').then(m => ({ default: m.SubscribersList })));
const ContactsList = lazy(() => import('./pages/Contacts/ContactsList').then(m => ({ default: m.ContactsList })));

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

        {/* Artist content (site-scoped) */}
        <Route path="sites/:siteId/releases" element={<Suspense fallback={<PageLoader />}><ReleasesList /></Suspense>} />
        <Route path="sites/:siteId/releases/new" element={<Suspense fallback={<PageLoader />}><ReleaseEditor /></Suspense>} />
        <Route path="sites/:siteId/releases/:id" element={<Suspense fallback={<PageLoader />}><ReleaseEditor /></Suspense>} />
        <Route path="sites/:siteId/events" element={<Suspense fallback={<PageLoader />}><EventsList /></Suspense>} />
        <Route path="sites/:siteId/events/new" element={<Suspense fallback={<PageLoader />}><EventEditor /></Suspense>} />
        <Route path="sites/:siteId/events/:id" element={<Suspense fallback={<PageLoader />}><EventEditor /></Suspense>} />
        <Route path="sites/:siteId/profile" element={<Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>} />

        {/* Photos (site-scoped, Azure Blob + AI curation) */}
        <Route path="sites/:siteId/photos" element={<Suspense fallback={<PageLoader />}><PhotoCuratorPage /></Suspense>} />

        {/* Subscribers (site-scoped mailing list) */}
        <Route path="sites/:siteId/subscribers" element={<Suspense fallback={<PageLoader />}><SubscribersList /></Suspense>} />

        {/* Contact submissions (site-scoped inquiries/bookings) */}
        <Route path="sites/:siteId/contacts" element={<Suspense fallback={<PageLoader />}><ContactsList /></Suspense>} />

        {/* AI Advisor (global, not site-scoped) */}
        <Route path="advisor" element={<Suspense fallback={<PageLoader />}><AdvisorPage /></Suspense>} />
      </Route>
    </Routes>
  );
}

export default App;

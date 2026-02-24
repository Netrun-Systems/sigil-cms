import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { RequireAuth } from './lib/auth';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { SitesList } from './pages/Sites/SitesList';
import { SiteEditor } from './pages/Sites/SiteEditor';
import { PagesList } from './pages/Pages/PagesList';
import { PageEditor } from './pages/Pages/PageEditor';
import { MediaLibrary } from './pages/Media/MediaLibrary';
import { ThemeEditor } from './pages/Themes/ThemeEditor';
import { ReleasesList } from './pages/Releases/ReleasesList';
import { ReleaseEditor } from './pages/Releases/ReleaseEditor';
import { EventsList } from './pages/Events/EventsList';
import { EventEditor } from './pages/Events/EventEditor';
import { ProfilePage } from './pages/Profile/ProfilePage';

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
        <Route path="dashboard" element={<Dashboard />} />

        {/* Sites */}
        <Route path="sites" element={<SitesList />} />
        <Route path="sites/new" element={<SiteEditor />} />
        <Route path="sites/:siteId" element={<SiteEditor />} />

        {/* Pages */}
        <Route path="sites/:siteId/pages" element={<PagesList />} />
        <Route path="sites/:siteId/pages/new" element={<PageEditor />} />
        <Route path="sites/:siteId/pages/:pageId" element={<PageEditor />} />

        {/* Media */}
        <Route path="media" element={<MediaLibrary />} />
        <Route path="sites/:siteId/media" element={<MediaLibrary />} />

        {/* Themes */}
        <Route path="themes" element={<ThemeEditor />} />
        <Route path="sites/:siteId/themes" element={<ThemeEditor />} />

        {/* Artist content (site-scoped) */}
        <Route path="sites/:siteId/releases" element={<ReleasesList />} />
        <Route path="sites/:siteId/releases/new" element={<ReleaseEditor />} />
        <Route path="sites/:siteId/releases/:id" element={<ReleaseEditor />} />
        <Route path="sites/:siteId/events" element={<EventsList />} />
        <Route path="sites/:siteId/events/new" element={<EventEditor />} />
        <Route path="sites/:siteId/events/:id" element={<EventEditor />} />
        <Route path="sites/:siteId/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

export default App;

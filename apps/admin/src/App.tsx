import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { SitesList } from './pages/Sites/SitesList';
import { SiteEditor } from './pages/Sites/SiteEditor';
import { PagesList } from './pages/Pages/PagesList';
import { PageEditor } from './pages/Pages/PageEditor';
import { MediaLibrary } from './pages/Media/MediaLibrary';
import { ThemeEditor } from './pages/Themes/ThemeEditor';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
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
      </Route>
    </Routes>
  );
}

export default App;

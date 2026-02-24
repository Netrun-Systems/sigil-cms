import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsxs(Route, { path: "/", element: _jsx(RequireAuth, { children: _jsx(AdminLayout, {}) }), children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "/dashboard", replace: true }) }), _jsx(Route, { path: "dashboard", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "sites", element: _jsx(SitesList, {}) }), _jsx(Route, { path: "sites/new", element: _jsx(SiteEditor, {}) }), _jsx(Route, { path: "sites/:siteId", element: _jsx(SiteEditor, {}) }), _jsx(Route, { path: "sites/:siteId/pages", element: _jsx(PagesList, {}) }), _jsx(Route, { path: "sites/:siteId/pages/new", element: _jsx(PageEditor, {}) }), _jsx(Route, { path: "sites/:siteId/pages/:pageId", element: _jsx(PageEditor, {}) }), _jsx(Route, { path: "media", element: _jsx(MediaLibrary, {}) }), _jsx(Route, { path: "sites/:siteId/media", element: _jsx(MediaLibrary, {}) }), _jsx(Route, { path: "themes", element: _jsx(ThemeEditor, {}) }), _jsx(Route, { path: "sites/:siteId/themes", element: _jsx(ThemeEditor, {}) }), _jsx(Route, { path: "sites/:siteId/releases", element: _jsx(ReleasesList, {}) }), _jsx(Route, { path: "sites/:siteId/releases/new", element: _jsx(ReleaseEditor, {}) }), _jsx(Route, { path: "sites/:siteId/releases/:id", element: _jsx(ReleaseEditor, {}) }), _jsx(Route, { path: "sites/:siteId/events", element: _jsx(EventsList, {}) }), _jsx(Route, { path: "sites/:siteId/events/new", element: _jsx(EventEditor, {}) }), _jsx(Route, { path: "sites/:siteId/events/:id", element: _jsx(EventEditor, {}) }), _jsx(Route, { path: "sites/:siteId/profile", element: _jsx(ProfilePage, {}) })] })] }));
}
export default App;
//# sourceMappingURL=App.js.map
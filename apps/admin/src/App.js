import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsx(Routes, { children: _jsxs(Route, { path: "/", element: _jsx(AdminLayout, {}), children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "/dashboard", replace: true }) }), _jsx(Route, { path: "dashboard", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "sites", element: _jsx(SitesList, {}) }), _jsx(Route, { path: "sites/new", element: _jsx(SiteEditor, {}) }), _jsx(Route, { path: "sites/:siteId", element: _jsx(SiteEditor, {}) }), _jsx(Route, { path: "sites/:siteId/pages", element: _jsx(PagesList, {}) }), _jsx(Route, { path: "sites/:siteId/pages/new", element: _jsx(PageEditor, {}) }), _jsx(Route, { path: "sites/:siteId/pages/:pageId", element: _jsx(PageEditor, {}) }), _jsx(Route, { path: "media", element: _jsx(MediaLibrary, {}) }), _jsx(Route, { path: "sites/:siteId/media", element: _jsx(MediaLibrary, {}) }), _jsx(Route, { path: "themes", element: _jsx(ThemeEditor, {}) }), _jsx(Route, { path: "sites/:siteId/themes", element: _jsx(ThemeEditor, {}) })] }) }));
}
export default App;
//# sourceMappingURL=App.js.map
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
export function AdminLayout() {
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(Sidebar, {}), _jsxs("div", { className: "ml-64 flex min-h-screen flex-col", children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 bg-muted/30 p-6", children: _jsx(Outlet, {}) })] })] }));
}
//# sourceMappingURL=AdminLayout.js.map
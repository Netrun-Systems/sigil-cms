import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
function decodeJwtPayload(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3)
            return null;
        const payload = JSON.parse(atob(parts[1]));
        return {
            id: payload.sub || payload.id || '',
            email: payload.email || '',
            role: payload.role || 'viewer',
            tenantId: payload.tenantId || '',
        };
    }
    catch {
        return null;
    }
}
const AuthContext = createContext(null);
const TOKEN_KEY = 'netrun_cms_token';
export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
    const user = useMemo(() => (token ? decodeJwtPayload(token) : null), [token]);
    const login = (newToken) => {
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
    };
    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
    };
    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === TOKEN_KEY)
                setToken(e.newValue);
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);
    return (_jsx(AuthContext.Provider, { value: { token, user, isAuthenticated: !!token, login, logout }, children: children }));
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
export function RequireAuth({ children }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
//# sourceMappingURL=auth.js.map
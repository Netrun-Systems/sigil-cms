/**
 * createPlatformApp — Factory function that products call to create their admin SPA.
 *
 * Returns a React component tree with:
 * - BrowserRouter
 * - Auth management (login page, JWT storage, route guards)
 * - Plugin-driven sidebar navigation
 * - Dynamic route mapping from pageRegistry
 *
 * Usage:
 *   const App = createPlatformApp({
 *     productName: 'KOG CRM',
 *     productId: 'kog',
 *     pageRegistry: { '/contacts': ContactsPage, '/pipeline': PipelinePage },
 *   });
 *   ReactDOM.createRoot(root).render(<App />);
 */

import { useCallback, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout.js';
import { LoginPage } from './components/LoginPage.js';
import { RequireAuth } from './components/RequireAuth.js';
import { PluginRoutes } from './components/PluginRoutes.js';
import { useAuth } from './hooks/useAuth.js';
import type { PlatformAppConfig } from './types.js';

function AppShell(config: PlatformAppConfig) {
  const {
    productName,
    productId,
    pageRegistry,
    theme,
    logo,
    apiBaseUrl = '',
    defaultRoute,
  } = config;

  const auth = useAuth({ productId, apiBaseUrl });
  const navigate = useNavigate();
  const location = useLocation();
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = useCallback(
    async (username: string, password: string) => {
      setLoginError(null);
      try {
        await auth.login(username, password);
        // Redirect to the page they originally wanted, or defaultRoute
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
        navigate(from || defaultRoute || '/', { replace: true });
      } catch (err) {
        setLoginError(err instanceof Error ? err.message : 'Login failed');
        throw err;
      }
    },
    [auth, navigate, location.state, defaultRoute],
  );

  const handleLogout = useCallback(() => {
    auth.logout();
    navigate('/login', { replace: true });
  }, [auth, navigate]);

  return (
    <Routes>
      {/* Login route — always accessible */}
      <Route
        path="/login"
        element={
          <LoginPage
            productName={productName}
            logo={logo}
            isLoading={auth.isLoading}
            onLogin={handleLogin}
            error={loginError}
          />
        }
      />

      {/* All other routes — require auth */}
      <Route
        path="/*"
        element={
          <RequireAuth isAuthenticated={auth.isAuthenticated}>
            <AdminLayout
              productName={productName}
              user={auth.user}
              token={auth.token}
              logo={logo}
              theme={theme}
              apiBaseUrl={apiBaseUrl}
              onLogout={handleLogout}
            >
              <PluginRoutes
                pageRegistry={pageRegistry}
                defaultRoute={defaultRoute}
              />
            </AdminLayout>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

/**
 * Factory: creates a fully-configured React component for a platform admin app.
 */
export function createPlatformApp(config: PlatformAppConfig): React.FC {
  function PlatformApp() {
    return (
      <BrowserRouter>
        <AppShell {...config} />
      </BrowserRouter>
    );
  }
  PlatformApp.displayName = `PlatformApp(${config.productId})`;
  return PlatformApp;
}

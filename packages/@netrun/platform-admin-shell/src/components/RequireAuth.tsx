/**
 * RequireAuth — Auth guard wrapper.
 *
 * Renders children if authenticated, otherwise redirects to /login.
 */

import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

export interface RequireAuthProps {
  isAuthenticated: boolean;
  children: ReactNode;
  loginPath?: string;
}

export function RequireAuth({
  isAuthenticated,
  children,
  loginPath = '/login',
}: RequireAuthProps) {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

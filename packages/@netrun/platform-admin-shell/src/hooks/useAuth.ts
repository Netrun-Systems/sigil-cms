/**
 * useAuth — JWT token management, login, logout, current user.
 *
 * Stores tokens in localStorage under keys scoped by productId
 * to allow multiple platform apps on the same domain.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AuthUser, AuthState } from '../types.js';

function tokenKey(productId: string): string {
  return `${productId}_access_token`;
}

function refreshKey(productId: string): string {
  return `${productId}_refresh_token`;
}

function userKey(productId: string): string {
  return `${productId}_user`;
}

/** Decode a JWT payload without verifying the signature (client-side only). */
function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1];
    if (!base64) return null;
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodePayload(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  return Date.now() >= payload.exp * 1000;
}

export interface UseAuthOptions {
  productId: string;
  apiBaseUrl?: string;
}

export interface UseAuthReturn extends AuthState {
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  getToken: () => string | null;
}

export function useAuth({ productId, apiBaseUrl = '' }: UseAuthOptions): UseAuthReturn {
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem(tokenKey(productId));
    const savedUser = localStorage.getItem(userKey(productId));
    const user = savedUser ? (JSON.parse(savedUser) as AuthUser) : null;
    const isAuthenticated = !!token && !isTokenExpired(token);
    return { user, token, isAuthenticated, isLoading: false };
  });

  // Check token expiry on mount and when the tab becomes visible
  useEffect(() => {
    function checkToken() {
      const token = localStorage.getItem(tokenKey(productId));
      if (token && isTokenExpired(token)) {
        localStorage.removeItem(tokenKey(productId));
        localStorage.removeItem(refreshKey(productId));
        localStorage.removeItem(userKey(productId));
        setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    }
    checkToken();
    document.addEventListener('visibilitychange', checkToken);
    return () => document.removeEventListener('visibilitychange', checkToken);
  }, [productId]);

  const login = useCallback(
    async (username: string, password: string): Promise<AuthUser> => {
      setState((s) => ({ ...s, isLoading: true }));
      try {
        const res = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail || body.message || `Login failed (${res.status})`);
        }
        const data = await res.json();
        const { access_token, refresh_token, user } = data;
        localStorage.setItem(tokenKey(productId), access_token);
        if (refresh_token) localStorage.setItem(refreshKey(productId), refresh_token);
        localStorage.setItem(userKey(productId), JSON.stringify(user));
        setState({ user, token: access_token, isAuthenticated: true, isLoading: false });
        return user;
      } catch (err) {
        setState((s) => ({ ...s, isLoading: false }));
        throw err;
      }
    },
    [productId, apiBaseUrl],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(tokenKey(productId));
    localStorage.removeItem(refreshKey(productId));
    localStorage.removeItem(userKey(productId));
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  }, [productId]);

  const getToken = useCallback(() => {
    return localStorage.getItem(tokenKey(productId));
  }, [productId]);

  return useMemo(
    () => ({ ...state, login, logout, getToken }),
    [state, login, logout, getToken],
  );
}

/**
 * ThemeContext - Manages theme state for NetrunCMS
 *
 * Supports:
 * - Dark/light mode toggle
 * - Per-site theme customization
 * - CSS variable injection
 * - System preference detection
 * - localStorage persistence
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ThemeTokens } from '@netrun-cms/core';
import { defaultDarkThemeTokens, defaultLightThemeTokens, tokensToCssVariables } from '@netrun-cms/core';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface SiteTheme {
  siteId?: string;
  mode: ThemeMode;
  darkTokens: ThemeTokens;
  lightTokens: ThemeTokens;
  customCss?: string;
}

export interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: 'dark' | 'light';
  isDark: boolean;
  tokens: ThemeTokens;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setSiteTheme: (theme: Partial<SiteTheme>) => void;
  applyTokenOverrides: (overrides: Partial<ThemeTokens>) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getStorageKey(siteId?: string): string {
  return siteId ? `netrun-cms-theme-${siteId}` : 'netrun-cms-theme';
}

function getSystemPreference(): 'dark' | 'light' {
  if (typeof window !== 'undefined') {
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return 'dark';
}

function getInitialMode(siteId?: string): ThemeMode {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(getStorageKey(siteId));
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  }
  return 'dark';
}

function applyThemeToDOM(resolvedMode: 'dark' | 'light', tokens: ThemeTokens, customCss?: string) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Apply mode attribute
  if (resolvedMode === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    root.removeAttribute('data-theme');
  }

  // Inject CSS variables
  const cssVars = tokensToCssVariables(tokens);
  let styleEl = document.getElementById('netrun-cms-theme-vars');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'netrun-cms-theme-vars';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `:root {\n${cssVars}\n}`;

  // Inject custom CSS if provided
  if (customCss) {
    let customStyleEl = document.getElementById('netrun-cms-theme-custom');
    if (!customStyleEl) {
      customStyleEl = document.createElement('style');
      customStyleEl.id = 'netrun-cms-theme-custom';
      document.head.appendChild(customStyleEl);
    }
    customStyleEl.textContent = customCss;
  }
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  siteId?: string;
  initialTheme?: Partial<SiteTheme>;
}

export function ThemeProvider({ children, siteId, initialTheme }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(() => initialTheme?.mode ?? getInitialMode(siteId));
  const [darkTokens, setDarkTokens] = useState<ThemeTokens>(
    () => initialTheme?.darkTokens ?? defaultDarkThemeTokens
  );
  const [lightTokens, setLightTokens] = useState<ThemeTokens>(
    () => initialTheme?.lightTokens ?? defaultLightThemeTokens
  );
  const [customCss, setCustomCss] = useState<string | undefined>(initialTheme?.customCss);
  const [systemPreference, setSystemPreference] = useState<'dark' | 'light'>(getSystemPreference);

  const resolvedMode = useMemo(() => {
    return mode === 'system' ? systemPreference : mode;
  }, [mode, systemPreference]);

  const tokens = useMemo(() => {
    return resolvedMode === 'dark' ? darkTokens : lightTokens;
  }, [resolvedMode, darkTokens, lightTokens]);

  // Apply theme on mount and changes
  useEffect(() => {
    applyThemeToDOM(resolvedMode, tokens, customCss);
    localStorage.setItem(getStorageKey(siteId), mode);
  }, [resolvedMode, tokens, customCss, mode, siteId]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'light' : 'dark');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'dark';
      // If system, toggle to the opposite of current resolved
      return getSystemPreference() === 'dark' ? 'light' : 'dark';
    });
  }, []);

  const setSiteTheme = useCallback((theme: Partial<SiteTheme>) => {
    if (theme.mode) setModeState(theme.mode);
    if (theme.darkTokens) setDarkTokens(theme.darkTokens);
    if (theme.lightTokens) setLightTokens(theme.lightTokens);
    if (theme.customCss !== undefined) setCustomCss(theme.customCss);
  }, []);

  const applyTokenOverrides = useCallback((overrides: Partial<ThemeTokens>) => {
    if (resolvedMode === 'dark') {
      setDarkTokens(prev => deepMerge(prev, overrides));
    } else {
      setLightTokens(prev => deepMerge(prev, overrides));
    }
  }, [resolvedMode]);

  const value: ThemeContextValue = {
    mode,
    resolvedMode,
    isDark: resolvedMode === 'dark',
    tokens,
    setMode,
    toggleMode,
    setSiteTheme,
    applyTokenOverrides,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Deep merge utility for token overrides
function deepMerge(target: ThemeTokens, source: Partial<ThemeTokens>): ThemeTokens {
  const result = { ...target };

  if (source.colors) {
    result.colors = { ...target.colors, ...source.colors };
  }
  if (source.typography) {
    result.typography = { ...target.typography, ...source.typography };
  }
  if (source.spacing) {
    result.spacing = { ...target.spacing, ...source.spacing };
  }
  if (source.effects) {
    result.effects = { ...target.effects, ...source.effects };
  }

  return result;
}

export { ThemeContext };

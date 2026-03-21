/**
 * PluginRoutes — Generic router that maps plugin-registered routes to React components.
 *
 * Takes a pageRegistry prop — each product provides its own mapping of
 * route paths to React components. Routes not in the registry render a 404.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import type { ComponentType } from 'react';

export interface PluginRoutesProps {
  /** Map of route paths to page components. Key is the path (e.g. '/contacts') */
  pageRegistry: Record<string, ComponentType>;
  /** Fallback route when no match (defaults to first route in registry) */
  defaultRoute?: string;
}

function NotFoundPage() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text-primary, #fff)',
        }}
      >
        Page Not Found
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-muted, #666)' }}>
        This route is not registered by any plugin.
      </p>
    </div>
  );
}

export function PluginRoutes({ pageRegistry, defaultRoute }: PluginRoutesProps) {
  const entries = Object.entries(pageRegistry);
  const fallback = defaultRoute || (entries.length > 0 ? entries[0][0] : '/');

  return (
    <Routes>
      {entries.map(([path, Component]) => (
        <Route key={path} path={path} element={<Component />} />
      ))}
      {/* Catch-all: redirect root to default, or show 404 */}
      <Route path="/" element={<Navigate to={fallback} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

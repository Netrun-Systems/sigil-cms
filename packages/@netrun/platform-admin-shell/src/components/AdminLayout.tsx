/**
 * AdminLayout — Main layout with sidebar + header + content area.
 *
 * Reads plugin manifest to build sidebar navigation dynamically.
 * Products provide their page components via pageRegistry.
 */

import { useState, type ReactNode } from 'react';
import { DynamicSidebar } from './DynamicSidebar.js';
import { AdminHeader } from './AdminHeader.js';
import { usePluginManifest } from '../hooks/usePluginManifest.js';
import type { AuthUser, ThemeConfig } from '../types.js';

export interface AdminLayoutProps {
  children: ReactNode;
  productName: string;
  user: AuthUser | null;
  token: string | null;
  logo?: ReactNode;
  theme?: ThemeConfig;
  apiBaseUrl?: string;
  onLogout: () => void;
}

export function AdminLayout({
  children,
  productName,
  user,
  token,
  logo,
  theme,
  apiBaseUrl = '',
  onLogout,
}: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { manifest } = usePluginManifest({ apiBaseUrl, token });

  // Inject custom CSS variables from theme
  const cssVarStyle: Record<string, string> = {};
  if (theme?.accentColor) cssVarStyle['--netrun-green'] = theme.accentColor;
  if (theme?.panelBg) cssVarStyle['--bg-panel'] = theme.panelBg;
  if (theme?.baseBg) cssVarStyle['--bg-base'] = theme.baseBg;
  if (theme?.cssVars) Object.assign(cssVarStyle, theme.cssVars);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-base, #0a0a0a)',
        ...cssVarStyle,
      }}
    >
      <DynamicSidebar
        manifest={manifest}
        collapsed={sidebarCollapsed}
        logo={logo}
        productName={productName}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AdminHeader
          productName={productName}
          user={user}
          onLogout={onLogout}
        />

        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

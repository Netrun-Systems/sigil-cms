/**
 * DynamicSidebar — Renders nav items from the plugin manifest.
 *
 * Groups items by category, highlights the active route,
 * and supports collapsed/expanded states for responsive layouts.
 */

import { useMemo, type ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import type { PluginManifest, PluginManifestNavItem } from '../types.js';

export interface DynamicSidebarProps {
  manifest: PluginManifest | null;
  collapsed?: boolean;
  logo?: ReactNode;
  productName: string;
  onToggle?: () => void;
}

interface GroupedNav {
  category: string;
  items: (PluginManifestNavItem & { pluginId: string })[];
}

/**
 * Minimal icon resolver — maps icon name strings to lucide-style SVG.
 * Products can override this by wrapping DynamicSidebar with their own icon set.
 * For now, renders a simple text fallback with the first 2 chars.
 */
function IconPlaceholder({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        fontSize: size * 0.55,
        fontWeight: 600,
        textTransform: 'uppercase',
        color: 'inherit',
        opacity: 0.7,
      }}
    >
      {name.slice(0, 2)}
    </span>
  );
}

export function DynamicSidebar({
  manifest,
  collapsed = false,
  logo,
  productName,
  onToggle,
}: DynamicSidebarProps) {
  const location = useLocation();

  const groups = useMemo<GroupedNav[]>(() => {
    if (!manifest) return [];

    const allItems: (PluginManifestNavItem & { pluginId: string })[] = [];
    for (const plugin of manifest.plugins) {
      if (!plugin.enabled) continue;
      for (const nav of plugin.nav) {
        allItems.push({ ...nav, pluginId: plugin.id });
      }
    }

    // Sort by order
    allItems.sort((a, b) => a.order - b.order);

    // Group by category
    const grouped = new Map<string, typeof allItems>();
    for (const item of allItems) {
      const cat = item.category || 'General';
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(item);
    }

    return Array.from(grouped.entries()).map(([category, items]) => ({
      category,
      items,
    }));
  }, [manifest]);

  return (
    <aside
      style={{
        width: collapsed ? 64 : 240,
        minHeight: '100vh',
        background: 'var(--bg-panel, #111)',
        borderRight: '1px solid var(--border-primary, #222)',
        transition: 'width 200ms ease',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Logo / Product name */}
      <div
        style={{
          padding: collapsed ? '16px 12px' : '16px 20px',
          borderBottom: '1px solid var(--border-primary, #222)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          minHeight: 60,
          cursor: onToggle ? 'pointer' : 'default',
        }}
        onClick={onToggle}
      >
        {logo}
        {!collapsed && (
          <span
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: 'var(--text-primary, #fff)',
              whiteSpace: 'nowrap',
            }}
          >
            {productName}
          </span>
        )}
      </div>

      {/* Navigation groups */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {groups.map((group) => (
          <div key={group.category} style={{ marginBottom: 8 }}>
            {!collapsed && groups.length > 1 && (
              <div
                style={{
                  padding: '8px 20px 4px',
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted, #666)',
                }}
              >
                {group.category}
              </div>
            )}
            {group.items.map((item) => {
              const isActive =
                location.pathname === item.path ||
                location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={`${item.pluginId}-${item.path}`}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: collapsed ? '10px 0' : '10px 20px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    textDecoration: 'none',
                    fontSize: 14,
                    color: isActive
                      ? 'var(--netrun-green, #90b9ab)'
                      : 'var(--text-secondary, #aaa)',
                    background: isActive
                      ? 'rgba(144,185,171,0.08)'
                      : 'transparent',
                    borderLeft: isActive
                      ? '3px solid var(--netrun-green, #90b9ab)'
                      : '3px solid transparent',
                    transition: 'all 150ms ease',
                  }}
                >
                  <IconPlaceholder name={item.icon} />
                  {!collapsed && (
                    <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

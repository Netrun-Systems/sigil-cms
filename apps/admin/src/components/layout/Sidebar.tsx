import { NavLink, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe,
  FileText,
  Image,
  Palette,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@netrun-cms/ui';
import { useState } from 'react';
import { usePluginManifest } from '../../hooks/usePluginManifest';
import { getIcon } from '../../lib/iconRegistry';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  children?: NavItem[];
}

const mainNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    label: 'Sites',
    icon: Globe,
    href: '/sites',
  },
  {
    label: 'Media Library',
    icon: Image,
    href: '/media',
  },
  {
    label: 'Themes',
    icon: Palette,
    href: '/themes',
  },
];

function NavItemComponent({ item }: { item: NavItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      {hasChildren ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </div>
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
          />
        </button>
      ) : (
        <NavLink
          to={item.href}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )
          }
        >
          <item.icon className="h-5 w-5" />
          <span>{item.label}</span>
          {item.badge !== undefined && (
            <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
              {item.badge}
            </span>
          )}
        </NavLink>
      )}
      {hasChildren && isOpen && (
        <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-4">
          {item.children?.map((child) => (
            <NavLink
              key={child.href}
              to={child.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )
              }
            >
              <child.icon className="h-4 w-4" />
              <span>{child.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { siteId } = useParams();
  const { manifest } = usePluginManifest();

  // Collect global (non-site-scoped) plugin nav items for the main nav
  const globalPluginNav: NavItem[] = [];
  // Collect site-scoped plugin nav sections
  const sitePluginSections: Array<{ title: string; items: NavItem[] }> = [];

  if (manifest) {
    for (const plugin of manifest.plugins) {
      if (!plugin.enabled) continue;
      for (const section of plugin.nav) {
        if (section.siteScoped) {
          sitePluginSections.push({
            title: section.title,
            items: section.items.map((item) => ({
              label: item.label,
              icon: getIcon(item.icon),
              href: siteId ? `/sites/${siteId}/${item.href}` : `/${item.href}`,
            })),
          });
        } else {
          for (const item of section.items) {
            globalPluginNav.push({
              label: item.label,
              icon: getIcon(item.icon),
              href: item.href.startsWith('/') ? item.href : `/${item.href}`,
            });
          }
        }
      }
    }
  }

  const allMainNavItems = [...mainNavItems, ...globalPluginNav];

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <span className="text-lg font-bold text-primary-foreground">N</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-sidebar-foreground">NetrunCMS</span>
          <span className="text-xs text-sidebar-foreground/60">Admin Panel</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {allMainNavItems.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
        </div>

        {/* Site-specific navigation when a site is selected */}
        {siteId && (
          <div className="mt-6">
            <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Current Site
            </div>
            <div className="space-y-1">
              <NavLink
                to={`/sites/${siteId}/pages`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )
                }
              >
                <FileText className="h-5 w-5" />
                <span>Pages</span>
              </NavLink>
              <NavLink
                to={`/sites/${siteId}/media`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )
                }
              >
                <Image className="h-5 w-5" />
                <span>Media</span>
              </NavLink>
              <NavLink
                to={`/sites/${siteId}/themes`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )
                }
              >
                <Palette className="h-5 w-5" />
                <span>Theme</span>
              </NavLink>
            </div>

            {/* Plugin nav sections (site-scoped) */}
            {sitePluginSections.map((section) => (
              <div key={section.title}>
                <div className="mb-2 mt-4 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  {section.title}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        )
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}

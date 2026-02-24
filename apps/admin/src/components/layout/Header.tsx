import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { Button, cn } from '@netrun-cms/ui';
import { useTheme } from '@netrun-cms/theme';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../lib/auth';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/dashboard' }];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;

    // Skip UUID-like segments but keep them in the path
    if (segment.match(/^[0-9a-f-]{36}$/i)) {
      continue;
    }

    const label = segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    breadcrumbs.push({ label, href: currentPath });
  }

  // Mark the last item as current (no href)
  if (breadcrumbs.length > 1) {
    const last = breadcrumbs[breadcrumbs.length - 1];
    last.href = undefined;
  }

  return breadcrumbs;
}

export function Header() {
  const { mode, toggleMode, isDark } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = () => {
    setUserMenuOpen(false);
    logout();
    navigate('/login');
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            {crumb.href ? (
              <Link
                to={crumb.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMode}
          className="h-9 w-9 text-muted-foreground"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-muted-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
              DG
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium">Daniel Garza</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          </button>

          {/* Dropdown Menu */}
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-popover p-1 shadow-lg">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">Daniel Garza</p>
                <p className="text-xs text-muted-foreground">admin@netrunsystems.com</p>
              </div>
              <div className="my-1 h-px bg-border" />
              <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent">
                <User className="h-4 w-4" />
                Profile
              </button>
              <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent">
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent">
                <HelpCircle className="h-4 w-4" />
                Help & Support
              </button>
              <div className="my-1 h-px bg-border" />
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

import { Link } from 'react-router-dom';
import {
  Globe,
  FileText,
  Image,
  Eye,
  TrendingUp,
  Clock,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  cn,
} from '@netrun-cms/ui';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                'flex items-center text-xs',
                trend.isPositive ? 'text-green-500' : 'text-red-500'
              )}
            >
              <TrendingUp
                className={cn('mr-1 h-3 w-3', !trend.isPositive && 'rotate-180')}
              />
              {trend.value}%
            </span>
          )}
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface RecentActivityItem {
  id: string;
  type: 'page' | 'media' | 'site';
  action: 'created' | 'updated' | 'published';
  title: string;
  site: string;
  timestamp: string;
}

const mockActivity: RecentActivityItem[] = [
  {
    id: '1',
    type: 'page',
    action: 'published',
    title: 'About Us',
    site: 'Netrun Systems',
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    type: 'media',
    action: 'created',
    title: 'hero-banner.png',
    site: 'Netrun Systems',
    timestamp: '4 hours ago',
  },
  {
    id: '3',
    type: 'page',
    action: 'updated',
    title: 'Services',
    site: 'Netrun Systems',
    timestamp: '6 hours ago',
  },
  {
    id: '4',
    type: 'site',
    action: 'created',
    title: 'Client Portal',
    site: 'Client Portal',
    timestamp: 'Yesterday',
  },
  {
    id: '5',
    type: 'page',
    action: 'published',
    title: 'Contact',
    site: 'Netrun Systems',
    timestamp: 'Yesterday',
  },
];

interface QuickAction {
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
}

const quickActions: QuickAction[] = [
  {
    label: 'Create Site',
    href: '/sites/new',
    icon: Globe,
    description: 'Set up a new website',
  },
  {
    label: 'New Page',
    href: '/sites',
    icon: FileText,
    description: 'Add content to your site',
  },
  {
    label: 'Upload Media',
    href: '/media',
    icon: Image,
    description: 'Add images and files',
  },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your sites.
          </p>
        </div>
        <Button asChild>
          <Link to="/sites/new">
            <Plus className="mr-2 h-4 w-4" />
            New Site
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sites"
          value={3}
          description="Active websites"
          icon={Globe}
        />
        <StatCard
          title="Total Pages"
          value={24}
          description="Across all sites"
          icon={FileText}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Media Files"
          value={156}
          description="Images, videos, docs"
          icon={Image}
        />
        <StatCard
          title="Page Views"
          value="12.4K"
          description="Last 30 days"
          icon={Eye}
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest changes across your sites</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/activity">
                  View All
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50"
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      item.type === 'page' && 'bg-blue-500/10 text-blue-500',
                      item.type === 'media' && 'bg-purple-500/10 text-purple-500',
                      item.type === 'site' && 'bg-green-500/10 text-green-500'
                    )}
                  >
                    {item.type === 'page' && <FileText className="h-5 w-5" />}
                    {item.type === 'media' && <Image className="h-5 w-5" />}
                    {item.type === 'site' && <Globe className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.action.charAt(0).toUpperCase() + item.action.slice(1)} in{' '}
                      <span className="text-foreground">{item.site}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {item.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks at your fingertips</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.href}
                className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <action.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{action.label}</p>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Sites Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Sites</CardTitle>
              <CardDescription>Manage your websites</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/sites">View All Sites</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: 'Netrun Systems',
                domain: 'netrunsystems.com',
                pages: 12,
                status: 'published',
              },
              {
                name: 'Client Portal',
                domain: 'portal.netrunsystems.com',
                pages: 8,
                status: 'draft',
              },
              {
                name: 'Documentation',
                domain: 'docs.netrunsystems.com',
                pages: 4,
                status: 'published',
              },
            ].map((site) => (
              <Link
                key={site.name}
                to={`/sites/${site.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="group rounded-lg border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Globe className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      site.status === 'published'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-yellow-500/10 text-yellow-500'
                    )}
                  >
                    {site.status}
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold group-hover:text-primary">
                    {site.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{site.domain}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {site.pages} pages
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

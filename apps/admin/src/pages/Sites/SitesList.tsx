import { Link } from 'react-router-dom';
import {
  Globe,
  Plus,
  Search,
  ExternalLink,
  FileText,
  Settings,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  MoreHorizontal,
  Eye,
  Archive,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Palette,
  Image,
  Layers,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Badge,
  cn,
  Separator,
} from '@netrun-cms/ui';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { usePermissions } from '../../hooks/usePermissions';

interface Site {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  status: 'draft' | 'published' | 'archived';
  template: string | null;
  defaultLanguage: string;
  settings: Record<string, unknown>;
  pageCount?: number;
  updatedAt: string;
  createdAt: string;
}

interface DomainStatus {
  siteId: string;
  verified: boolean;
  checking: boolean;
}

function StatusBadge({ status }: { status: Site['status'] }) {
  const config = {
    published: { icon: CheckCircle2, class: 'border-green-500/50 bg-green-500/10 text-green-500' },
    draft: { icon: Clock, class: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500' },
    archived: { icon: Archive, class: 'border-gray-500/50 bg-gray-500/10 text-gray-500' },
  };
  const { icon: Icon, class: cls } = config[status];
  return (
    <Badge variant="outline" className={cn('capitalize gap-1', cls)}>
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function DomainCell({ site, domainStatus, onVerify }: { site: Site; domainStatus?: DomainStatus; onVerify: (siteId: string) => void }) {
  if (!site.domain) {
    return (
      <Link
        to={`/sites/${site.id}`}
        className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
      >
        <Plus className="h-3 w-3" />
        Add domain
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <a
        href={`https://${site.domain}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors"
      >
        {domainStatus?.checking ? (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        ) : domainStatus?.verified ? (
          <ShieldCheck className="h-3 w-3 text-green-500" />
        ) : (
          <AlertCircle className="h-3 w-3 text-yellow-500" />
        )}
        {site.domain}
        <ExternalLink className="h-3 w-3 text-muted-foreground" />
      </a>
      {!domainStatus?.verified && !domainStatus?.checking && (
        <button
          onClick={() => onVerify(site.id)}
          className="text-[10px] text-muted-foreground hover:text-primary"
        >
          Verify SSL
        </button>
      )}
    </div>
  );
}

export function SitesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [domainStatuses, setDomainStatuses] = useState<Map<string, DomainStatus>>(new Map());
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const { canDelete, canCreate } = usePermissions();

  useEffect(() => {
    loadSites();
  }, [selectedStatus]);

  const loadSites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (selectedStatus) params.set('status', selectedStatus);
      const res = await api.get<{ data: Site[] }>('/sites?' + params.toString());
      setSites(res.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sites');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDomain = async (siteId: string) => {
    setDomainStatuses((prev) => {
      const next = new Map(prev);
      next.set(siteId, { siteId, verified: false, checking: true });
      return next;
    });
    try {
      const res = await api.get<{ data: { verified: boolean } }>(`/sites/${siteId}/domain/verify`);
      setDomainStatuses((prev) => {
        const next = new Map(prev);
        next.set(siteId, { siteId, verified: res.data.verified, checking: false });
        return next;
      });
    } catch {
      setDomainStatuses((prev) => {
        const next = new Map(prev);
        next.set(siteId, { siteId, verified: false, checking: false });
        return next;
      });
    }
  };

  const handleDelete = async (siteId: string, siteName: string) => {
    if (!confirm(`Are you sure you want to delete "${siteName}"? This cannot be undone.`)) return;
    try {
      await api.delete('/sites/' + siteId);
      setSites((prev) => prev.filter((s) => s.id !== siteId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleDuplicate = async (site: Site) => {
    try {
      const res = await api.post<{ data: Site }>('/sites', {
        name: `${site.name} (Copy)`,
        slug: `${site.slug}-copy-${Date.now().toString(36)}`,
        template: site.template,
        defaultLanguage: site.defaultLanguage,
        settings: site.settings,
      });
      if (res.data) setSites((prev) => [res.data, ...prev]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Duplicate failed');
    }
  };

  const handleStatusChange = async (siteId: string, newStatus: string) => {
    try {
      await api.put('/sites/' + siteId, { status: newStatus });
      setSites((prev) => prev.map((s) => s.id === siteId ? { ...s, status: newStatus as Site['status'] } : s));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  const filteredSites = sites.filter((site) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return site.name.toLowerCase().includes(q) || site.slug.toLowerCase().includes(q) || site.domain?.toLowerCase().includes(q);
  });

  const stats = {
    total: sites.length,
    published: sites.filter((s) => s.status === 'published').length,
    draft: sites.filter((s) => s.status === 'draft').length,
    withDomain: sites.filter((s) => s.domain).length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sites & Domains</h1>
          <p className="text-muted-foreground">
            Manage all your websites, custom domains, and deployments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadSites}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {canCreate && (
            <Button asChild>
              <Link to="/sites/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Site
              </Link>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Sites</p>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-500">{stats.published}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-500">{stats.draft}</p>
                <p className="text-xs text-muted-foreground">Drafts</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">{stats.withDomain}</p>
                <p className="text-xs text-muted-foreground">Custom Domains</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, slug, or domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {[null, 'published', 'draft', 'archived'].map((status) => (
                <Button
                  key={status || 'all'}
                  variant={selectedStatus === status ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedStatus(status)}
                >
                  {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* Site Cards Grid */}
      {!isLoading && filteredSites.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSites.map((site) => (
            <Card key={site.id} className="group relative overflow-hidden hover:border-primary/50 transition-colors">
              {/* Color bar at top */}
              <div className={cn(
                'h-1',
                site.status === 'published' && 'bg-green-500',
                site.status === 'draft' && 'bg-yellow-500',
                site.status === 'archived' && 'bg-gray-500',
              )} />

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">
                        <Link to={`/sites/${site.id}`} className="hover:text-primary transition-colors">
                          {site.name}
                        </Link>
                      </CardTitle>
                      <CardDescription className="text-xs">/{site.slug}</CardDescription>
                    </div>
                  </div>
                  <StatusBadge status={site.status} />
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {/* Domain */}
                <DomainCell site={site} domainStatus={domainStatuses.get(site.id)} onVerify={handleVerifyDomain} />

                <Separator />

                {/* Quick stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <Link to={`/sites/${site.id}/pages`} className="flex items-center gap-1 hover:text-primary">
                    <FileText className="h-3 w-3" />
                    {site.pageCount ?? 0} pages
                  </Link>
                  <Link to={`/sites/${site.id}/themes`} className="flex items-center gap-1 hover:text-primary">
                    <Palette className="h-3 w-3" />
                    Theme
                  </Link>
                  <Link to={`/sites/${site.id}/media`} className="flex items-center gap-1 hover:text-primary">
                    <Image className="h-3 w-3" />
                    Media
                  </Link>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-muted-foreground">{timeAgo(site.updatedAt)}</span>
                  <div className="flex gap-1">
                    {site.status === 'draft' && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleStatusChange(site.id, 'published')}>
                        <Eye className="h-3 w-3 mr-1" /> Publish
                      </Button>
                    )}
                    {site.status === 'published' && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleStatusChange(site.id, 'draft')}>
                        Unpublish
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleDuplicate(site)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <Link to={`/sites/${site.id}`}>
                        <Settings className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(site.id, site.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredSites.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              {searchQuery || selectedStatus ? 'No matching sites' : 'No sites yet'}
            </h3>
            <p className="mt-2 text-center text-sm text-muted-foreground max-w-md">
              {searchQuery || selectedStatus
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first site to get started. Each site gets its own pages, theme, media library, and optional custom domain.'}
            </p>
            {!searchQuery && !selectedStatus && canCreate && (
              <Button className="mt-4" asChild>
                <Link to="/sites/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Site
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

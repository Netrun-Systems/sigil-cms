import { Link } from 'react-router-dom';
import {
  Globe,
  Plus,
  Search,
  ExternalLink,
  FileText,
  Settings,
  Trash2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  cn,
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
  pageCount?: number;
  updatedAt: string;
  createdAt: string;
}

function StatusBadge({ status }: { status: Site['status'] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'capitalize',
        status === 'published' && 'border-green-500/50 bg-green-500/10 text-green-500',
        status === 'draft' && 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500',
        status === 'archived' && 'border-gray-500/50 bg-gray-500/10 text-gray-500'
      )}
    >
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

export function SitesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { canDelete } = usePermissions();

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams({ limit: '100' });
    if (selectedStatus) params.set('status', selectedStatus);
    api
      .get<{ data: Site[] }>('/sites?' + params.toString())
      .then((res) => {
        setSites(res.data || []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load sites');
      })
      .finally(() => setIsLoading(false));
  }, [selectedStatus]);

  const filteredSites = sites.filter((site) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      site.name.toLowerCase().includes(q) ||
      site.slug.toLowerCase().includes(q) ||
      site.domain?.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (siteId: string, siteName: string) => {
    if (!confirm(`Are you sure you want to delete "${siteName}"? This cannot be undone.`)) return;
    try {
      await api.delete('/sites/' + siteId);
      setSites((prev) => prev.filter((s) => s.id !== siteId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sites</h1>
          <p className="text-muted-foreground">
            Manage all your websites in one place.
          </p>
        </div>
        <Button asChild>
          <Link to="/sites/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Site
          </Link>
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search sites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedStatus === null ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedStatus(null)}
              >
                All
              </Button>
              <Button
                variant={selectedStatus === 'published' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedStatus('published')}
              >
                Published
              </Button>
              <Button
                variant={selectedStatus === 'draft' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedStatus('draft')}
              >
                Draft
              </Button>
              <Button
                variant={selectedStatus === 'archived' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedStatus('archived')}
              >
                Archived
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </CardContent>
        </Card>
      )}

      {/* Sites Table */}
      {!isLoading && filteredSites.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Site</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Pages</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSites.map((site) => (
                  <TableRow key={site.id} className="group">
                    <TableCell>
                      <Link
                        to={`/sites/${site.id}`}
                        className="flex items-center gap-3"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Globe className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium group-hover:text-primary">
                            {site.name}
                          </p>
                          <p className="text-sm text-muted-foreground">/{site.slug}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {site.domain ? (
                        <a
                          href={`https://${site.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                        >
                          {site.domain}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={site.status} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Link
                        to={`/sites/${site.id}/pages`}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                      >
                        <FileText className="h-4 w-4" />
                        {site.pageCount ?? '-'}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {timeAgo(site.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link to={`/sites/${site.id}`}>
                            <Settings className="h-4 w-4" />
                          </Link>
                        </Button>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(site.id, site.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && filteredSites.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No sites found</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {searchQuery || selectedStatus
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first site.'}
            </p>
            {!searchQuery && !selectedStatus && (
              <Button className="mt-4" asChild>
                <Link to="/sites/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Site
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

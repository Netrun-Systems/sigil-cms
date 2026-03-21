import { Link, useParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  FolderTree,
  List,
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

interface Page {
  id: string;
  title: string;
  slug: string;
  fullPath?: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  template: string;
  parentId: string | null;
  language?: string;
  updatedAt: string;
  createdAt: string;
}

function StatusBadge({ status }: { status: Page['status'] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'capitalize',
        status === 'published' && 'border-green-500/50 bg-green-500/10 text-green-500',
        status === 'draft' && 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500',
        status === 'scheduled' && 'border-blue-500/50 bg-blue-500/10 text-blue-500',
        status === 'archived' && 'border-gray-500/50 bg-gray-500/10 text-gray-500'
      )}
    >
      {status}
    </Badge>
  );
}

function TemplateBadge({ template }: { template: string }) {
  return (
    <Badge variant="secondary" className="capitalize text-xs">
      {template}
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

export function PagesList() {
  const { siteId } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { canDelete } = usePermissions();

  useEffect(() => {
    if (!siteId) return;
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams({ limit: '100' });
    if (selectedStatus) params.set('status', selectedStatus);
    api
      .get<{ data: Page[] }>('/sites/' + siteId + '/pages?' + params.toString())
      .then((res) => {
        setPages(res.data || []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load pages');
      })
      .finally(() => setIsLoading(false));
  }, [siteId, selectedStatus]);

  const filteredPages = pages.filter((page) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      page.title.toLowerCase().includes(q) ||
      page.slug.toLowerCase().includes(q) ||
      page.fullPath?.toLowerCase().includes(q)
    );
  });

  // Organize pages by hierarchy for tree view
  const rootPages = filteredPages.filter((p) => !p.parentId);
  const childPages = filteredPages.filter((p) => p.parentId);

  const handleDelete = async (pageId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.delete('/sites/' + siteId + '/pages/' + pageId);
      setPages((prev) => prev.filter((p) => p.id !== pageId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const pagePath = (page: Page) => page.fullPath || '/' + page.slug;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/sites/${siteId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
            <p className="text-muted-foreground">
              Manage pages for this site
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to={`/sites/${siteId}/pages/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Page
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
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex gap-1 border-r pr-4 mr-2">
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('tree')}
                  title="Tree view"
                >
                  <FolderTree className="h-4 w-4" />
                </Button>
              </div>
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

      {/* Pages Table */}
      {!isLoading && filteredPages.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[350px]">Page</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(viewMode === 'list' ? filteredPages : rootPages).map((page) => (
                  <PageRow
                    key={page.id}
                    page={page}
                    siteId={siteId!}
                    pagePath={pagePath(page)}
                    indent={false}
                    canDelete={canDelete}
                    onDelete={handleDelete}
                  >
                    {/* Child pages in tree view */}
                    {viewMode === 'tree' &&
                      childPages
                        .filter((child) => child.parentId === page.id)
                        .map((child) => (
                          <PageRow
                            key={child.id}
                            page={child}
                            siteId={siteId!}
                            pagePath={pagePath(child)}
                            indent={true}
                            canDelete={canDelete}
                            onDelete={handleDelete}
                          />
                        ))}
                  </PageRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && filteredPages.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No pages found</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {searchQuery || selectedStatus
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first page.'}
            </p>
            {!searchQuery && !selectedStatus && (
              <Button className="mt-4" asChild>
                <Link to={`/sites/${siteId}/pages/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Page
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PageRow({
  page,
  siteId,
  pagePath,
  indent,
  canDelete,
  onDelete,
  children,
}: {
  page: Page;
  siteId: string;
  pagePath: string;
  indent: boolean;
  canDelete: boolean;
  onDelete: (id: string, title: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <>
      <TableRow className={cn('group', indent && 'bg-muted/30')}>
        <TableCell>
          <Link
            to={`/sites/${siteId}/pages/${page.id}`}
            className={cn('flex items-center gap-3', indent && 'pl-8')}
          >
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                page.status === 'published'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium group-hover:text-primary">
                {page.title}
              </p>
              <p className="text-sm text-muted-foreground">
                /{page.slug}
              </p>
            </div>
          </Link>
        </TableCell>
        <TableCell>
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            {pagePath}
          </code>
        </TableCell>
        <TableCell>
          <TemplateBadge template={page.template || 'default'} />
        </TableCell>
        <TableCell>
          <StatusBadge status={page.status} />
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {timeAgo(page.updatedAt)}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
              title="Edit"
            >
              <Link to={`/sites/${siteId}/pages/${page.id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                title="Delete"
                onClick={() => onDelete(page.id, page.title)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
      {children}
    </>
  );
}

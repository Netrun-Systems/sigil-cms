import { Link, useParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  MoreHorizontal,
  ExternalLink,
  Edit,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
  FolderTree,
  List,
  LayoutGrid,
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
import { useState } from 'react';

interface Page {
  id: string;
  title: string;
  slug: string;
  fullPath: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  template: string;
  parentId: string | null;
  lastUpdated: string;
  author: string;
}

const mockPages: Page[] = [
  {
    id: '1',
    title: 'Home',
    slug: 'home',
    fullPath: '/',
    status: 'published',
    template: 'landing',
    parentId: null,
    lastUpdated: '2 hours ago',
    author: 'Daniel Garza',
  },
  {
    id: '2',
    title: 'About Us',
    slug: 'about',
    fullPath: '/about',
    status: 'published',
    template: 'default',
    parentId: null,
    lastUpdated: '1 day ago',
    author: 'Daniel Garza',
  },
  {
    id: '3',
    title: 'Services',
    slug: 'services',
    fullPath: '/services',
    status: 'published',
    template: 'default',
    parentId: null,
    lastUpdated: '3 days ago',
    author: 'Daniel Garza',
  },
  {
    id: '4',
    title: 'Cloud Infrastructure',
    slug: 'cloud-infrastructure',
    fullPath: '/services/cloud-infrastructure',
    status: 'published',
    template: 'product',
    parentId: '3',
    lastUpdated: '1 week ago',
    author: 'Daniel Garza',
  },
  {
    id: '5',
    title: 'DevSecOps',
    slug: 'devsecops',
    fullPath: '/services/devsecops',
    status: 'draft',
    template: 'product',
    parentId: '3',
    lastUpdated: 'Yesterday',
    author: 'Daniel Garza',
  },
  {
    id: '6',
    title: 'Contact',
    slug: 'contact',
    fullPath: '/contact',
    status: 'published',
    template: 'contact',
    parentId: null,
    lastUpdated: '5 days ago',
    author: 'Daniel Garza',
  },
  {
    id: '7',
    title: 'Blog',
    slug: 'blog',
    fullPath: '/blog',
    status: 'published',
    template: 'blog',
    parentId: null,
    lastUpdated: '2 hours ago',
    author: 'Daniel Garza',
  },
  {
    id: '8',
    title: 'Privacy Policy',
    slug: 'privacy',
    fullPath: '/privacy',
    status: 'scheduled',
    template: 'default',
    parentId: null,
    lastUpdated: '3 hours ago',
    author: 'Daniel Garza',
  },
];

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

export function PagesList() {
  const { siteId } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

  const filteredPages = mockPages.filter((page) => {
    const matchesSearch =
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.fullPath.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !selectedStatus || page.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // Organize pages by hierarchy for tree view
  const rootPages = filteredPages.filter((p) => !p.parentId);
  const childPages = filteredPages.filter((p) => p.parentId);

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
              Manage pages for Netrun Systems
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

      {/* Pages Table */}
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
                <>
                  <TableRow key={page.id} className="group">
                    <TableCell>
                      <Link
                        to={`/sites/${siteId}/pages/${page.id}`}
                        className="flex items-center gap-3"
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
                            by {page.author}
                          </p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                        {page.fullPath}
                      </code>
                    </TableCell>
                    <TableCell>
                      <TemplateBadge template={page.template} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={page.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {page.lastUpdated}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {/* Child pages in tree view */}
                  {viewMode === 'tree' &&
                    childPages
                      .filter((child) => child.parentId === page.id)
                      .map((child) => (
                        <TableRow key={child.id} className="group bg-muted/30">
                          <TableCell>
                            <Link
                              to={`/sites/${siteId}/pages/${child.id}`}
                              className="flex items-center gap-3 pl-8"
                            >
                              <div
                                className={cn(
                                  'flex h-9 w-9 items-center justify-center rounded-lg',
                                  child.status === 'published'
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted text-muted-foreground'
                                )}
                              >
                                <FileText className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium group-hover:text-primary">
                                  {child.title}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  by {child.author}
                                </p>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                              {child.fullPath}
                            </code>
                          </TableCell>
                          <TableCell>
                            <TemplateBadge template={child.template} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={child.status} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {child.lastUpdated}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Preview"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                asChild
                                title="Edit"
                              >
                                <Link to={`/sites/${siteId}/pages/${child.id}`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                </>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredPages.length === 0 && (
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

import { Link } from 'react-router-dom';
import {
  Globe,
  Plus,
  Search,
  MoreHorizontal,
  ExternalLink,
  FileText,
  Settings,
  Trash2,
  Filter,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

interface Site {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  status: 'draft' | 'published' | 'archived';
  pageCount: number;
  lastUpdated: string;
  createdAt: string;
}

const mockSites: Site[] = [
  {
    id: '1',
    name: 'Netrun Systems',
    slug: 'netrun-systems',
    domain: 'netrunsystems.com',
    status: 'published',
    pageCount: 12,
    lastUpdated: '2 hours ago',
    createdAt: 'Jan 15, 2026',
  },
  {
    id: '2',
    name: 'Client Portal',
    slug: 'client-portal',
    domain: 'portal.netrunsystems.com',
    status: 'draft',
    pageCount: 8,
    lastUpdated: 'Yesterday',
    createdAt: 'Jan 10, 2026',
  },
  {
    id: '3',
    name: 'Documentation',
    slug: 'documentation',
    domain: 'docs.netrunsystems.com',
    status: 'published',
    pageCount: 24,
    lastUpdated: '3 days ago',
    createdAt: 'Dec 20, 2025',
  },
  {
    id: '4',
    name: 'Blog',
    slug: 'blog',
    domain: null,
    status: 'archived',
    pageCount: 45,
    lastUpdated: '1 week ago',
    createdAt: 'Nov 1, 2025',
  },
];

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

export function SitesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const filteredSites = mockSites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.domain?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !selectedStatus || site.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

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

      {/* Sites Table */}
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
                      {site.pageCount}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {site.lastUpdated}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link to={`/sites/${site.id}`}>
                          <Settings className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredSites.length === 0 && (
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

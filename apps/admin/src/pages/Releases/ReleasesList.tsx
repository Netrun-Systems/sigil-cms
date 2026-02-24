import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Loader2, Disc3 } from 'lucide-react';
import { Card, CardContent } from '@netrun-cms/ui';
import { api } from '../../lib/api';
import type { Release } from '@netrun-cms/core';

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'single', label: 'Single' },
  { value: 'album', label: 'Album' },
  { value: 'ep', label: 'EP' },
  { value: 'mixtape', label: 'Mixtape' },
];

export function ReleasesList() {
  const { siteId } = useParams();
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const basePath = siteId ? `/sites/${siteId}` : '';

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Release[] }>(`${basePath}/releases`);
      setReleases(res.data ?? []);
    } catch {
      // empty state on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [siteId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this release?')) return;
    try {
      await api.delete(`${basePath}/releases/${id}`);
      setReleases((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // keep list as-is
    }
  };

  const filtered = releases.filter((r) => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && r.type !== typeFilter) return false;
    return true;
  });

  const editBase = siteId ? `/sites/${siteId}/releases` : '/releases';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Releases</h1>
        <Link
          to={`${editBase}/new`}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Release
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search releases..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTypeFilter(opt.value)}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    typeFilter === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Disc3 className="h-8 w-8" />
          <p className="text-sm">{releases.length === 0 ? 'No releases yet' : 'No matches'}</p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 w-[100px]"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((release) => (
                  <tr key={release.id} className="group border-b border-border last:border-0 hover:bg-accent/50">
                    <td className="px-6 py-4">
                      <Link to={`${editBase}/${release.id}`} className="flex items-center gap-3">
                        {release.coverUrl ? (
                          <img src={release.coverUrl} alt="" className="h-10 w-10 rounded-md object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <Disc3 className="h-5 w-5" />
                          </div>
                        )}
                        <span className="font-medium group-hover:text-primary">{release.title}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs capitalize">{release.type}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(release.releaseDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-md px-2 py-0.5 text-xs capitalize ${
                        release.isPublished
                          ? 'border border-green-500/50 bg-green-500/10 text-green-500'
                          : 'border border-yellow-500/50 bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {release.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Link
                          to={`${editBase}/${release.id}`}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(release.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

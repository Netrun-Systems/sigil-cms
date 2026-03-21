import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Plus, Search, Pencil, Trash2, Loader2, FileText, Star, Pin,
  Eye, ThumbsUp, ThumbsDown, ArrowUpDown,
} from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  categoryId: string | null;
  categoryName: string | null;
  tags: string[];
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  isFeatured: boolean;
  isPinned: boolean;
  pageId: string | null;
  revisedAt: string | null;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
}

type SortField = 'date' | 'views' | 'resonance';

export function ArticlesList() {
  const { siteId } = useParams<{ siteId: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('date');

  const basePath = `/sites/${siteId}`;
  const editBase = `/sites/${siteId}/pages`;

  const load = async () => {
    setLoading(true);
    try {
      const [articlesRes, catsRes] = await Promise.all([
        api.get<{ data: Article[] }>(`${basePath}/docs/articles`),
        api.get<{ data: Category[] }>(`${basePath}/docs/categories`).catch(() => ({ data: [] })),
      ]);
      setArticles(articlesRes.data ?? []);
      setCategories(catsRes.data ?? []);
    } catch {
      // empty state on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [siteId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    try {
      await api.delete(`${basePath}/docs/articles/${id}`);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch { /* keep list */ }
  };

  const helpfulRatio = (a: Article) => {
    const total = a.helpfulCount + a.notHelpfulCount;
    return total > 0 ? a.helpfulCount / total : 0;
  };

  const filtered = articles
    .filter((a) => {
      if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter && a.categoryId !== categoryFilter) return false;
      if (featuredOnly && !a.isFeatured) return false;
      if (tagFilter && !a.tags.some((t) => t.toLowerCase().includes(tagFilter.toLowerCase()))) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'views') return b.viewCount - a.viewCount;
      if (sortBy === 'resonance') return helpfulRatio(b) - helpfulRatio(a);
      return new Date(b.revisedAt || b.createdAt).getTime() - new Date(a.revisedAt || a.createdAt).getTime();
    });

  const allTags = [...new Set(articles.flatMap((a) => a.tags))].sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Knowledge Base</h1>
        <Link
          to={`${editBase}/new`}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Article
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Search articles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {/* Category dropdown */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Tag filter */}
              {allTags.length > 0 && (
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">All Tags</option>
                  {allTags.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              )}

              {/* Featured toggle */}
              <button
                onClick={() => setFeaturedOnly(!featuredOnly)}
                className={cn(
                  'flex h-9 items-center gap-1.5 rounded-md px-3 text-sm transition-colors',
                  featuredOnly
                    ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/50'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Star className="h-3.5 w-3.5" /> Featured
              </button>
            </div>

            {/* Sort buttons */}
            <div className="flex items-center gap-1 text-sm">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground mr-1" />
              {(['date', 'views', 'resonance'] as SortField[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm capitalize transition-colors',
                    sortBy === s
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {s === 'resonance' ? 'Helpful Ratio' : s === 'date' ? 'Date' : 'Views'}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Article cards */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
          <FileText className="h-8 w-8" />
          <p className="text-sm">{articles.length === 0 ? 'No articles yet' : 'No matches'}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article) => {
            const total = article.helpfulCount + article.notHelpfulCount;
            const ratio = total > 0 ? Math.round((article.helpfulCount / total) * 100) : null;

            return (
              <Card key={article.id} className="group relative overflow-hidden">
                <CardContent className="pt-6">
                  {/* Icons top-right */}
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    {article.isFeatured && (
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    )}
                    {article.isPinned && (
                      <Pin className="h-4 w-4 text-blue-400" />
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-medium leading-snug pr-12 mb-1 group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>

                  {/* Excerpt */}
                  {article.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {article.excerpt}
                    </p>
                  )}

                  {/* Category badge */}
                  {article.categoryName && (
                    <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-xs capitalize mb-2">
                      {article.categoryName}
                    </span>
                  )}

                  {/* Tags */}
                  {article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-3 border-t border-border">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {article.viewCount}
                    </span>
                    {ratio !== null && (
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" /> {ratio}%
                        <span className="text-muted-foreground/60">
                          ({article.helpfulCount}<ThumbsUp className="inline h-2.5 w-2.5 mx-0.5" />{article.notHelpfulCount}<ThumbsDown className="inline h-2.5 w-2.5 mx-0.5" />)
                        </span>
                      </span>
                    )}
                    <span className="ml-auto">
                      {new Date(article.revisedAt || article.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 mt-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <Link
                      to={article.pageId ? `${editBase}/${article.pageId}` : `${editBase}/new`}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(article.id)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

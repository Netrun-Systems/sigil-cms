import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Save,
  Trash2,
  Loader2,
  ArrowLeft,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface Category {
  id: string;
  name: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  categoryId: string | null;
  tags: string[];
  isFeatured: boolean;
  isPinned: boolean;
  pageId: string | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function ArticleEditor() {
  const { siteId, id: articleId } = useParams<{ siteId: string; id: string }>();
  const navigate = useNavigate();
  const basePath = `/sites/${siteId}`;
  const isEditing = !!articleId;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [pageId, setPageId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const catsRes = await api.get<{ data: Category[] }>(
          `${basePath}/docs/categories`
        );
        setCategories(catsRes.data ?? []);
      } catch {
        // categories may not exist yet
      }

      if (isEditing) {
        setLoading(true);
        try {
          const article = await api.get<Article>(
            `${basePath}/docs/articles/${articleId}`
          );
          setTitle(article.title);
          setSlug(article.slug);
          setSlugManual(true);
          setExcerpt(article.excerpt ?? '');
          setCategoryId(article.categoryId ?? '');
          setTagsInput((article.tags ?? []).join(', '));
          setIsFeatured(article.isFeatured);
          setIsPinned(article.isPinned);
          setPageId(article.pageId ?? null);
        } catch {
          // article not found
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [siteId, articleId]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugManual) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugManual(true);
    setSlug(slugify(value));
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug || slugify(title),
        excerpt: excerpt.trim() || null,
        categoryId: categoryId || null,
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        isFeatured,
        isPinned,
      };

      if (isEditing) {
        await api.put(`${basePath}/docs/articles/${articleId}`, payload);
      } else {
        const res = await api.post<{ id: string }>(
          `${basePath}/docs/articles`,
          payload
        );
        navigate(`/sites/${siteId}/docs/articles/${res.id}`, { replace: true });
      }
    } catch {
      // save error
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this article? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`${basePath}/docs/articles/${articleId}`);
      navigate(`/sites/${siteId}/docs/articles`);
    } catch {
      // delete error
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/sites/${siteId}/docs/articles`}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold">
            {isEditing ? 'Edit Article' : 'New Article'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <Link
                to={`/sites/${siteId}/docs/articles/${articleId}/revisions`}
                className="flex h-9 items-center gap-2 rounded-md border border-input px-4 text-sm font-medium transition-colors hover:bg-accent"
              >
                <FileText className="h-4 w-4" />
                Revisions
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex h-9 items-center gap-2 rounded-md border border-destructive/50 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </button>
            </>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Article title"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="article-slug"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-generated from title. Edit to customize.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Excerpt</label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief summary of this article..."
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of tags.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Page content link */}
          {isEditing && pageId && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Page Content</p>
                    <p className="text-xs text-muted-foreground">
                      This article is linked to a CMS page. Edit the page to
                      change article content blocks.
                    </p>
                  </div>
                  <Link
                    to={`/sites/${siteId}/pages/${pageId}`}
                    className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Edit Page Content
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Featured</label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isFeatured}
                  onClick={() => setIsFeatured(!isFeatured)}
                  className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                    isFeatured ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg transition-transform',
                      isFeatured ? 'translate-x-4' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Pinned</label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isPinned}
                  onClick={() => setIsPinned(!isPinned)}
                  className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                    isPinned ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg transition-transform',
                      isPinned ? 'translate-x-4' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

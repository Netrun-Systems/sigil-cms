import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Loader2, MessageCircle, Users, TrendingUp, Pin, Lock, XCircle, X } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface ForumStats {
  total_members: number;
  total_posts: number;
  active_today: number;
  new_this_week: number;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  post_count: number;
  last_activity_at: string | null;
  sort_order: number;
}

interface Post {
  id: string;
  title: string;
  author_name: string;
  category_name: string;
  type: 'discussion' | 'question' | 'article';
  vote_score: number;
  reply_count: number;
  status: string;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
}

type CategoryForm = {
  name: string;
  description: string;
  sort_order: number;
};

const defaultCategoryForm: CategoryForm = {
  name: '',
  description: '',
  sort_order: 0,
};

const typeBadgeColors: Record<string, string> = {
  discussion: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
  question: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
  article: 'border-green-500/50 bg-green-500/10 text-green-400',
};

const statusColors: Record<string, string> = {
  open: 'border-green-500/50 bg-green-500/10 text-green-400',
  closed: 'border-gray-500/50 bg-gray-500/10 text-gray-400',
  resolved: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
  flagged: 'border-red-500/50 bg-red-500/10 text-red-400',
};

export function ForumPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [stats, setStats] = useState<ForumStats>({ total_members: 0, total_posts: 0, active_today: 0, new_this_week: 0 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(defaultCategoryForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [catRes, postRes] = await Promise.all([
        api.get<{ data: Category[]; stats: ForumStats }>(`/sites/${siteId}/community/categories`),
        api.get<{ data: Post[] }>(`/sites/${siteId}/community/posts`),
      ]);
      setCategories(catRes.data ?? []);
      if (catRes.stats) setStats(catRes.stats);
      setPosts(postRes.data ?? []);
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [siteId]);

  const openCreateCategory = () => {
    setEditingCategoryId(null);
    setCategoryForm(defaultCategoryForm);
    setCategoryDialogOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setCategoryForm({ name: cat.name, description: cat.description || '', sort_order: cat.sort_order });
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    setSaving(true);
    try {
      if (editingCategoryId) {
        const res = await api.put<{ data: Category }>(`/sites/${siteId}/community/categories/${editingCategoryId}`, categoryForm);
        setCategories((prev) => prev.map((c) => c.id === editingCategoryId ? (res.data ?? c) : c));
      } else {
        const res = await api.post<{ data: Category }>(`/sites/${siteId}/community/categories`, categoryForm);
        if (res.data) setCategories((prev) => [...prev, res.data]);
      }
      setCategoryDialogOpen(false);
    } catch { /* */ } finally { setSaving(false); }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Posts will be uncategorized.')) return;
    try {
      await api.delete(`/sites/${siteId}/community/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch { /* */ }
  };

  const handlePostAction = async (postId: string, action: 'pin' | 'lock' | 'close' | 'delete') => {
    if (action === 'delete') {
      if (!confirm('Delete this post?')) return;
      try {
        await api.delete(`/sites/${siteId}/community/posts/${postId}`);
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } catch { /* */ }
      return;
    }
    try {
      await api.patch(`/sites/${siteId}/community/posts/${postId}`, { action });
      setPosts((prev) => prev.map((p) => {
        if (p.id !== postId) return p;
        if (action === 'pin') return { ...p, is_pinned: !p.is_pinned };
        if (action === 'lock') return { ...p, is_locked: !p.is_locked };
        if (action === 'close') return { ...p, status: 'closed' };
        return p;
      }));
    } catch { /* */ }
  };

  const updateCategoryField = <K extends keyof CategoryForm>(key: K, value: CategoryForm[K]) => {
    setCategoryForm((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Community Forum</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: stats.total_members, icon: <Users className="h-4 w-4" /> },
          { label: 'Total Posts', value: stats.total_posts, icon: <MessageCircle className="h-4 w-4" /> },
          { label: 'Active Today', value: stats.active_today, icon: <TrendingUp className="h-4 w-4" /> },
          { label: 'New This Week', value: stats.new_this_week, icon: <Plus className="h-4 w-4" /> },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                {stat.icon}
                <p className="text-xs">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Categories</h2>
          <button
            onClick={openCreateCategory}
            className="flex h-8 items-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> Add Category
          </button>
        </div>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet</p>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">{cat.post_count} posts</span>
                  </div>
                  {cat.last_activity_at && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Last activity: {new Date(cat.last_activity_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditCategory(cat)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Posts */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Recent Posts</h2>
        {posts.length === 0 ? (
          <div className="flex h-24 flex-col items-center justify-center gap-2 text-muted-foreground">
            <MessageCircle className="h-8 w-8" />
            <p className="text-sm">No posts yet</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Title</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Author</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Type</th>
                  <th className="text-center px-4 py-2 font-medium text-muted-foreground">Votes</th>
                  <th className="text-center px-4 py-2 font-medium text-muted-foreground">Replies</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Date</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        {post.is_pinned && <Pin className="h-3 w-3 text-yellow-400 shrink-0" />}
                        {post.is_locked && <Lock className="h-3 w-3 text-gray-400 shrink-0" />}
                        <span className="truncate max-w-[200px]">{post.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{post.author_name}</td>
                    <td className="px-4 py-2">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs">{post.category_name}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={cn('rounded-md px-2 py-0.5 text-xs capitalize border', typeBadgeColors[post.type] || '')}>
                        {post.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center font-medium">{post.vote_score}</td>
                    <td className="px-4 py-2 text-center text-muted-foreground">{post.reply_count}</td>
                    <td className="px-4 py-2">
                      <span className={cn('rounded-md px-2 py-0.5 text-xs capitalize border', statusColors[post.status] || '')}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handlePostAction(post.id, 'pin')}
                          title={post.is_pinned ? 'Unpin' : 'Pin'}
                          className={cn('rounded-md p-1 hover:bg-accent', post.is_pinned ? 'text-yellow-400' : 'text-muted-foreground hover:text-foreground')}
                        >
                          <Pin className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handlePostAction(post.id, 'lock')}
                          title={post.is_locked ? 'Unlock' : 'Lock'}
                          className={cn('rounded-md p-1 hover:bg-accent', post.is_locked ? 'text-orange-400' : 'text-muted-foreground hover:text-foreground')}
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handlePostAction(post.id, 'close')}
                          title="Close"
                          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handlePostAction(post.id, 'delete')}
                          title="Delete"
                          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Dialog */}
      {categoryDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setCategoryDialogOpen(false)}>
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingCategoryId ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setCategoryDialogOpen(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input
                  value={categoryForm.name}
                  onChange={(e) => updateCategoryField('name', e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="e.g. General Discussion"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => updateCategoryField('description', e.target.value)}
                  className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                  placeholder="Category description..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Sort Order</label>
                <input
                  type="number"
                  min={0}
                  value={categoryForm.sort_order}
                  onChange={(e) => updateCategoryField('sort_order', parseInt(e.target.value) || 0)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCategoryDialogOpen(false)}
                className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={saving || !categoryForm.name.trim()}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingCategoryId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

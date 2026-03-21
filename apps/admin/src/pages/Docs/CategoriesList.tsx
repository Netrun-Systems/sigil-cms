import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Plus, Loader2, FolderTree, Pencil, Trash2, Check, X, GripVertical,
  ChevronRight, ChevronDown,
} from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
  articleCount: number;
  children?: Category[];
}

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  icon: string;
  parentId: string;
  sortOrder: number;
}

const ICON_OPTIONS = [
  '', 'book', 'file-text', 'folder', 'code', 'settings', 'shield', 'rocket',
  'lightbulb', 'help-circle', 'info', 'zap', 'database', 'globe', 'terminal',
  'layers', 'package', 'cpu', 'key', 'lock', 'users', 'wrench',
];

const emptyForm: CategoryForm = {
  name: '',
  slug: '',
  description: '',
  icon: '',
  parentId: '',
  sortOrder: 0,
};

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function CategoriesList() {
  const { siteId } = useParams<{ siteId: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const basePath = `/sites/${siteId}/docs/categories`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Category[] }>(basePath);
      setCategories(res.data ?? []);
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  }, [basePath]);

  useEffect(() => { load(); }, [load]);

  // Build a tree from flat list
  const buildTree = (items: Category[]): Category[] => {
    const map = new Map<string, Category>();
    const roots: Category[] = [];
    items.forEach((c) => map.set(c.id, { ...c, children: [] }));
    items.forEach((c) => {
      const node = map.get(c.id)!;
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });
    const sortChildren = (nodes: Category[]) => {
      nodes.sort((a, b) => a.sortOrder - b.sortOrder);
      nodes.forEach((n) => sortChildren(n.children || []));
    };
    sortChildren(roots);
    return roots;
  };

  const tree = buildTree(categories);

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setCreatingNew(false);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon: cat.icon || '',
      parentId: cat.parentId || '',
      sortOrder: cat.sortOrder,
    });
  };

  const startCreate = () => {
    setCreatingNew(true);
    setEditingId(null);
    setForm(emptyForm);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCreatingNew(false);
    setForm(emptyForm);
  };

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : slugify(name),
    }));
  };

  const handleSave = async () => {
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description || null,
      icon: form.icon || null,
      parentId: form.parentId || null,
      sortOrder: form.sortOrder,
    };

    try {
      if (creatingNew) {
        await api.post(basePath, payload);
      } else if (editingId) {
        await api.put(`${basePath}/${editingId}`, payload);
      }
      cancelEdit();
      await load();
    } catch { /* keep form open */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Articles in it will become uncategorized.')) return;
    try {
      await api.delete(`${basePath}/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch { /* */ }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const renderCategoryRow = (cat: Category, depth: number) => {
    const hasChildren = cat.children && cat.children.length > 0;
    const isExpanded = expanded.has(cat.id);
    const isEditing = editingId === cat.id;

    return (
      <div key={cat.id}>
        <div
          className={cn(
            'group flex items-center gap-2 border-b border-border px-4 py-3 hover:bg-accent/50',
            isEditing && 'bg-accent/30',
          )}
          style={{ paddingLeft: `${depth * 24 + 16}px` }}
        >
          {/* Drag handle */}
          <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50 cursor-grab" />

          {/* Expand/collapse */}
          {hasChildren ? (
            <button onClick={() => toggleExpand(cat.id)} className="shrink-0">
              {isExpanded
                ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                : <ChevronRight className="h-4 w-4 text-muted-foreground" />
              }
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          {/* Icon */}
          {cat.icon && (
            <span className="text-xs text-muted-foreground font-mono">{cat.icon}</span>
          )}

          {/* Name and info */}
          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm">{cat.name}</span>
            <span className="ml-2 text-xs text-muted-foreground">/{cat.slug}</span>
            {cat.description && (
              <p className="text-xs text-muted-foreground truncate">{cat.description}</p>
            )}
          </div>

          {/* Article count */}
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground shrink-0">
            {cat.articleCount} {cat.articleCount === 1 ? 'article' : 'articles'}
          </span>

          {/* Sort order */}
          <span className="text-xs text-muted-foreground/60 shrink-0 w-8 text-right">
            #{cat.sortOrder}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 shrink-0">
            <button
              onClick={() => startEdit(cat)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleDelete(cat.id)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Inline edit form */}
        {isEditing && renderForm()}

        {/* Children */}
        {hasChildren && isExpanded && cat.children!.map((child) => renderCategoryRow(child, depth + 1))}
      </div>
    );
  };

  const renderForm = () => (
    <div className="border-b border-border bg-accent/20 px-4 py-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
          <input
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Category name"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Slug</label>
          <input
            value={form.slug}
            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            placeholder="auto-generated"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Short description"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Icon</label>
          <select
            value={form.icon}
            onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {ICON_OPTIONS.map((i) => (
              <option key={i} value={i}>{i || '(none)'}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Parent Category</label>
          <select
            value={form.parentId}
            onChange={(e) => setForm((p) => ({ ...p, parentId: e.target.value }))}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">(Root level)</option>
            {categories
              .filter((c) => c.id !== editingId)
              .map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Sort Order</label>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={handleSave}
          disabled={!form.name.trim()}
          className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" /> Save
        </button>
        <button
          onClick={cancelEdit}
          className="flex h-8 items-center gap-1.5 rounded-md px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <button
          onClick={startCreate}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {/* New category form */}
      {creatingNew && (
        <Card>
          <CardContent className="pt-6">
            {renderForm()}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : categories.length === 0 && !creatingNew ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
          <FolderTree className="h-8 w-8" />
          <p className="text-sm">No categories</p>
        </div>
      ) : categories.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            {tree.map((cat) => renderCategoryRow(cat, 0))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Loader2, FolderTree, Pencil, Trash2, Check, X, GripVertical, ChevronRight, ChevronDown, } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
const ICON_OPTIONS = [
    '', 'book', 'file-text', 'folder', 'code', 'settings', 'shield', 'rocket',
    'lightbulb', 'help-circle', 'info', 'zap', 'database', 'globe', 'terminal',
    'layers', 'package', 'cpu', 'key', 'lock', 'users', 'wrench',
];
const emptyForm = {
    name: '',
    slug: '',
    description: '',
    icon: '',
    parentId: '',
    sortOrder: 0,
};
function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
export function CategoriesList() {
    const { siteId } = useParams();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [creatingNew, setCreatingNew] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [expanded, setExpanded] = useState(new Set());
    const basePath = `/sites/${siteId}/docs/categories`;
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(basePath);
            setCategories(res.data ?? []);
        }
        catch {
            // empty state
        }
        finally {
            setLoading(false);
        }
    }, [basePath]);
    useEffect(() => { load(); }, [load]);
    // Build a tree from flat list
    const buildTree = (items) => {
        const map = new Map();
        const roots = [];
        items.forEach((c) => map.set(c.id, { ...c, children: [] }));
        items.forEach((c) => {
            const node = map.get(c.id);
            if (c.parentId && map.has(c.parentId)) {
                map.get(c.parentId).children.push(node);
            }
            else {
                roots.push(node);
            }
        });
        const sortChildren = (nodes) => {
            nodes.sort((a, b) => a.sortOrder - b.sortOrder);
            nodes.forEach((n) => sortChildren(n.children || []));
        };
        sortChildren(roots);
        return roots;
    };
    const tree = buildTree(categories);
    const startEdit = (cat) => {
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
    const handleNameChange = (name) => {
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
            }
            else if (editingId) {
                await api.put(`${basePath}/${editingId}`, payload);
            }
            cancelEdit();
            await load();
        }
        catch { /* keep form open */ }
    };
    const handleDelete = async (id) => {
        if (!confirm('Delete this category? Articles in it will become uncategorized.'))
            return;
        try {
            await api.delete(`${basePath}/${id}`);
            setCategories((prev) => prev.filter((c) => c.id !== id));
        }
        catch { /* */ }
    };
    const toggleExpand = (id) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id))
                next.delete(id);
            else
                next.add(id);
            return next;
        });
    };
    const renderCategoryRow = (cat, depth) => {
        const hasChildren = cat.children && cat.children.length > 0;
        const isExpanded = expanded.has(cat.id);
        const isEditing = editingId === cat.id;
        return (_jsxs("div", { children: [_jsxs("div", { className: cn('group flex items-center gap-2 border-b border-border px-4 py-3 hover:bg-accent/50', isEditing && 'bg-accent/30'), style: { paddingLeft: `${depth * 24 + 16}px` }, children: [_jsx(GripVertical, { className: "h-4 w-4 shrink-0 text-muted-foreground/50 cursor-grab" }), hasChildren ? (_jsx("button", { onClick: () => toggleExpand(cat.id), className: "shrink-0", children: isExpanded
                                ? _jsx(ChevronDown, { className: "h-4 w-4 text-muted-foreground" })
                                : _jsx(ChevronRight, { className: "h-4 w-4 text-muted-foreground" }) })) : (_jsx("span", { className: "w-4 shrink-0" })), cat.icon && (_jsx("span", { className: "text-xs text-muted-foreground font-mono", children: cat.icon })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("span", { className: "font-medium text-sm", children: cat.name }), _jsxs("span", { className: "ml-2 text-xs text-muted-foreground", children: ["/", cat.slug] }), cat.description && (_jsx("p", { className: "text-xs text-muted-foreground truncate", children: cat.description }))] }), _jsxs("span", { className: "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground shrink-0", children: [cat.articleCount, " ", cat.articleCount === 1 ? 'article' : 'articles'] }), _jsxs("span", { className: "text-xs text-muted-foreground/60 shrink-0 w-8 text-right", children: ["#", cat.sortOrder] }), _jsxs("div", { className: "flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 shrink-0", children: [_jsx("button", { onClick: () => startEdit(cat), className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground", children: _jsx(Pencil, { className: "h-3.5 w-3.5" }) }), _jsx("button", { onClick: () => handleDelete(cat.id), className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive", children: _jsx(Trash2, { className: "h-3.5 w-3.5" }) })] })] }), isEditing && renderForm(), hasChildren && isExpanded && cat.children.map((child) => renderCategoryRow(child, depth + 1))] }, cat.id));
    };
    const renderForm = () => (_jsxs("div", { className: "border-b border-border bg-accent/20 px-4 py-4", children: [_jsxs("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: "Name" }), _jsx("input", { value: form.name, onChange: (e) => handleNameChange(e.target.value), placeholder: "Category name", className: "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: "Slug" }), _jsx("input", { value: form.slug, onChange: (e) => setForm((p) => ({ ...p, slug: e.target.value })), placeholder: "auto-generated", className: "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: "Description" }), _jsx("input", { value: form.description, onChange: (e) => setForm((p) => ({ ...p, description: e.target.value })), placeholder: "Short description", className: "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: "Icon" }), _jsx("select", { value: form.icon, onChange: (e) => setForm((p) => ({ ...p, icon: e.target.value })), className: "h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: ICON_OPTIONS.map((i) => (_jsx("option", { value: i, children: i || '(none)' }, i))) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: "Parent Category" }), _jsxs("select", { value: form.parentId, onChange: (e) => setForm((p) => ({ ...p, parentId: e.target.value })), className: "h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: [_jsx("option", { value: "", children: "(Root level)" }), categories
                                        .filter((c) => c.id !== editingId)
                                        .map((c) => (_jsx("option", { value: c.id, children: c.name }, c.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: "Sort Order" }), _jsx("input", { type: "number", value: form.sortOrder, onChange: (e) => setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 })), className: "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] })] }), _jsxs("div", { className: "flex items-center gap-2 mt-3", children: [_jsxs("button", { onClick: handleSave, disabled: !form.name.trim(), className: "flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50", children: [_jsx(Check, { className: "h-3.5 w-3.5" }), " Save"] }), _jsxs("button", { onClick: cancelEdit, className: "flex h-8 items-center gap-1.5 rounded-md px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors", children: [_jsx(X, { className: "h-3.5 w-3.5" }), " Cancel"] })] })] }));
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Categories" }), _jsxs("button", { onClick: startCreate, className: "flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90", children: [_jsx(Plus, { className: "h-4 w-4" }), " Add Category"] })] }), creatingNew && (_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: renderForm() }) })), loading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : categories.length === 0 && !creatingNew ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(FolderTree, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: "No categories" })] })) : categories.length > 0 ? (_jsx(Card, { children: _jsx("div", { className: "overflow-x-auto", children: tree.map((cat) => renderCategoryRow(cat, 0)) }) })) : null] }));
}
//# sourceMappingURL=CategoriesList.js.map
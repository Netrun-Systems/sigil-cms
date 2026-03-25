import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Loader2, MessageCircle, Users, TrendingUp, Pin, Lock, XCircle, X } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
const defaultCategoryForm = {
    name: '',
    description: '',
    sort_order: 0,
};
const typeBadgeColors = {
    discussion: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
    question: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
    article: 'border-green-500/50 bg-green-500/10 text-green-400',
};
const statusColors = {
    open: 'border-green-500/50 bg-green-500/10 text-green-400',
    closed: 'border-gray-500/50 bg-gray-500/10 text-gray-400',
    resolved: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
    flagged: 'border-red-500/50 bg-red-500/10 text-red-400',
};
export function ForumPage() {
    const { siteId } = useParams();
    const [stats, setStats] = useState({ total_members: 0, total_posts: 0, active_today: 0, new_this_week: 0 });
    const [categories, setCategories] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [categoryForm, setCategoryForm] = useState(defaultCategoryForm);
    const [saving, setSaving] = useState(false);
    const load = async () => {
        setLoading(true);
        try {
            const [catRes, postRes] = await Promise.all([
                api.get(`/sites/${siteId}/community/categories`),
                api.get(`/sites/${siteId}/community/posts`),
            ]);
            setCategories(catRes.data ?? []);
            if (catRes.stats)
                setStats(catRes.stats);
            setPosts(postRes.data ?? []);
        }
        catch { /* */ }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [siteId]);
    const openCreateCategory = () => {
        setEditingCategoryId(null);
        setCategoryForm(defaultCategoryForm);
        setCategoryDialogOpen(true);
    };
    const openEditCategory = (cat) => {
        setEditingCategoryId(cat.id);
        setCategoryForm({ name: cat.name, description: cat.description || '', sort_order: cat.sort_order });
        setCategoryDialogOpen(true);
    };
    const handleSaveCategory = async () => {
        setSaving(true);
        try {
            if (editingCategoryId) {
                const res = await api.put(`/sites/${siteId}/community/categories/${editingCategoryId}`, categoryForm);
                setCategories((prev) => prev.map((c) => c.id === editingCategoryId ? (res.data ?? c) : c));
            }
            else {
                const res = await api.post(`/sites/${siteId}/community/categories`, categoryForm);
                if (res.data)
                    setCategories((prev) => [...prev, res.data]);
            }
            setCategoryDialogOpen(false);
        }
        catch { /* */ }
        finally {
            setSaving(false);
        }
    };
    const handleDeleteCategory = async (id) => {
        if (!confirm('Delete this category? Posts will be uncategorized.'))
            return;
        try {
            await api.delete(`/sites/${siteId}/community/categories/${id}`);
            setCategories((prev) => prev.filter((c) => c.id !== id));
        }
        catch { /* */ }
    };
    const handlePostAction = async (postId, action) => {
        if (action === 'delete') {
            if (!confirm('Delete this post?'))
                return;
            try {
                await api.delete(`/sites/${siteId}/community/posts/${postId}`);
                setPosts((prev) => prev.filter((p) => p.id !== postId));
            }
            catch { /* */ }
            return;
        }
        try {
            await api.patch(`/sites/${siteId}/community/posts/${postId}`, { action });
            setPosts((prev) => prev.map((p) => {
                if (p.id !== postId)
                    return p;
                if (action === 'pin')
                    return { ...p, is_pinned: !p.is_pinned };
                if (action === 'lock')
                    return { ...p, is_locked: !p.is_locked };
                if (action === 'close')
                    return { ...p, status: 'closed' };
                return p;
            }));
        }
        catch { /* */ }
    };
    const updateCategoryField = (key, value) => {
        setCategoryForm((prev) => ({ ...prev, [key]: value }));
    };
    if (loading) {
        return (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Community Forum" }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4", children: [
                    { label: 'Total Members', value: stats.total_members, icon: _jsx(Users, { className: "h-4 w-4" }) },
                    { label: 'Total Posts', value: stats.total_posts, icon: _jsx(MessageCircle, { className: "h-4 w-4" }) },
                    { label: 'Active Today', value: stats.active_today, icon: _jsx(TrendingUp, { className: "h-4 w-4" }) },
                    { label: 'New This Week', value: stats.new_this_week, icon: _jsx(Plus, { className: "h-4 w-4" }) },
                ].map((stat) => (_jsx(Card, { children: _jsxs(CardContent, { className: "pt-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-muted-foreground mb-1", children: [stat.icon, _jsx("p", { className: "text-xs", children: stat.label })] }), _jsx("p", { className: "text-2xl font-bold", children: stat.value.toLocaleString() })] }) }, stat.label))) }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-medium", children: "Categories" }), _jsxs("button", { onClick: openCreateCategory, className: "flex h-8 items-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90", children: [_jsx(Plus, { className: "h-3.5 w-3.5" }), " Add Category"] })] }), categories.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground", children: "No categories yet" })) : (_jsx("div", { className: "space-y-2", children: categories.map((cat) => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border border-border px-4 py-3", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "font-medium text-sm", children: cat.name }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [cat.post_count, " posts"] })] }), cat.last_activity_at && (_jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: ["Last activity: ", new Date(cat.last_activity_at).toLocaleDateString()] }))] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: () => openEditCategory(cat), className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground", children: _jsx(Pencil, { className: "h-4 w-4" }) }), _jsx("button", { onClick: () => handleDeleteCategory(cat.id), className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive", children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] }, cat.id))) }))] }), _jsxs("div", { className: "space-y-3", children: [_jsx("h2", { className: "text-lg font-medium", children: "Recent Posts" }), posts.length === 0 ? (_jsxs("div", { className: "flex h-24 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(MessageCircle, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: "No posts yet" })] })) : (_jsx("div", { className: "rounded-lg border border-border overflow-hidden", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border bg-muted/30", children: [_jsx("th", { className: "text-left px-4 py-2 font-medium text-muted-foreground", children: "Title" }), _jsx("th", { className: "text-left px-4 py-2 font-medium text-muted-foreground", children: "Author" }), _jsx("th", { className: "text-left px-4 py-2 font-medium text-muted-foreground", children: "Category" }), _jsx("th", { className: "text-left px-4 py-2 font-medium text-muted-foreground", children: "Type" }), _jsx("th", { className: "text-center px-4 py-2 font-medium text-muted-foreground", children: "Votes" }), _jsx("th", { className: "text-center px-4 py-2 font-medium text-muted-foreground", children: "Replies" }), _jsx("th", { className: "text-left px-4 py-2 font-medium text-muted-foreground", children: "Status" }), _jsx("th", { className: "text-left px-4 py-2 font-medium text-muted-foreground", children: "Date" }), _jsx("th", { className: "text-right px-4 py-2 font-medium text-muted-foreground", children: "Actions" })] }) }), _jsx("tbody", { children: posts.map((post) => (_jsxs("tr", { className: "border-b border-border last:border-0 hover:bg-muted/20", children: [_jsx("td", { className: "px-4 py-2", children: _jsxs("div", { className: "flex items-center gap-2", children: [post.is_pinned && _jsx(Pin, { className: "h-3 w-3 text-yellow-400 shrink-0" }), post.is_locked && _jsx(Lock, { className: "h-3 w-3 text-gray-400 shrink-0" }), _jsx("span", { className: "truncate max-w-[200px]", children: post.title })] }) }), _jsx("td", { className: "px-4 py-2 text-muted-foreground", children: post.author_name }), _jsx("td", { className: "px-4 py-2", children: _jsx("span", { className: "rounded-md bg-muted px-2 py-0.5 text-xs", children: post.category_name }) }), _jsx("td", { className: "px-4 py-2", children: _jsx("span", { className: cn('rounded-md px-2 py-0.5 text-xs capitalize border', typeBadgeColors[post.type] || ''), children: post.type }) }), _jsx("td", { className: "px-4 py-2 text-center font-medium", children: post.vote_score }), _jsx("td", { className: "px-4 py-2 text-center text-muted-foreground", children: post.reply_count }), _jsx("td", { className: "px-4 py-2", children: _jsx("span", { className: cn('rounded-md px-2 py-0.5 text-xs capitalize border', statusColors[post.status] || ''), children: post.status }) }), _jsx("td", { className: "px-4 py-2 text-muted-foreground", children: new Date(post.created_at).toLocaleDateString() }), _jsx("td", { className: "px-4 py-2", children: _jsxs("div", { className: "flex items-center justify-end gap-1", children: [_jsx("button", { onClick: () => handlePostAction(post.id, 'pin'), title: post.is_pinned ? 'Unpin' : 'Pin', className: cn('rounded-md p-1 hover:bg-accent', post.is_pinned ? 'text-yellow-400' : 'text-muted-foreground hover:text-foreground'), children: _jsx(Pin, { className: "h-3.5 w-3.5" }) }), _jsx("button", { onClick: () => handlePostAction(post.id, 'lock'), title: post.is_locked ? 'Unlock' : 'Lock', className: cn('rounded-md p-1 hover:bg-accent', post.is_locked ? 'text-orange-400' : 'text-muted-foreground hover:text-foreground'), children: _jsx(Lock, { className: "h-3.5 w-3.5" }) }), _jsx("button", { onClick: () => handlePostAction(post.id, 'close'), title: "Close", className: "rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground", children: _jsx(XCircle, { className: "h-3.5 w-3.5" }) }), _jsx("button", { onClick: () => handlePostAction(post.id, 'delete'), title: "Delete", className: "rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-destructive", children: _jsx(Trash2, { className: "h-3.5 w-3.5" }) })] }) })] }, post.id))) })] }) }))] }), categoryDialogOpen && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", onClick: () => setCategoryDialogOpen(false), children: _jsxs("div", { className: "w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg space-y-4", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold", children: editingCategoryId ? 'Edit Category' : 'Add Category' }), _jsx("button", { onClick: () => setCategoryDialogOpen(false), className: "rounded-md p-1 text-muted-foreground hover:text-foreground", children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Name" }), _jsx("input", { value: categoryForm.name, onChange: (e) => updateCategoryField('name', e.target.value), className: "mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", placeholder: "e.g. General Discussion" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Description" }), _jsx("textarea", { rows: 2, value: categoryForm.description, onChange: (e) => updateCategoryField('description', e.target.value), className: "mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y", placeholder: "Category description..." })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Sort Order" }), _jsx("input", { type: "number", min: 0, value: categoryForm.sort_order, onChange: (e) => updateCategoryField('sort_order', parseInt(e.target.value) || 0), className: "mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx("button", { onClick: () => setCategoryDialogOpen(false), className: "rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors", children: "Cancel" }), _jsxs("button", { onClick: handleSaveCategory, disabled: saving || !categoryForm.name.trim(), className: "flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50", children: [saving && _jsx(Loader2, { className: "h-4 w-4 animate-spin" }), editingCategoryId ? 'Update' : 'Create'] })] })] }) }))] }));
}
//# sourceMappingURL=ForumPage.js.map
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, Trash2, Loader2, ArrowLeft, FileText, ExternalLink, } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
export function ArticleEditor() {
    const { siteId, id: articleId } = useParams();
    const navigate = useNavigate();
    const basePath = `/sites/${siteId}`;
    const isEditing = !!articleId;
    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [categories, setCategories] = useState([]);
    // Form state
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [slugManual, setSlugManual] = useState(false);
    const [excerpt, setExcerpt] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [pageId, setPageId] = useState(null);
    useEffect(() => {
        const loadData = async () => {
            try {
                const catsRes = await api.get(`${basePath}/docs/categories`);
                setCategories(catsRes.data ?? []);
            }
            catch {
                // categories may not exist yet
            }
            if (isEditing) {
                setLoading(true);
                try {
                    const article = await api.get(`${basePath}/docs/articles/${articleId}`);
                    setTitle(article.title);
                    setSlug(article.slug);
                    setSlugManual(true);
                    setExcerpt(article.excerpt ?? '');
                    setCategoryId(article.categoryId ?? '');
                    setTagsInput((article.tags ?? []).join(', '));
                    setIsFeatured(article.isFeatured);
                    setIsPinned(article.isPinned);
                    setPageId(article.pageId ?? null);
                }
                catch {
                    // article not found
                }
                finally {
                    setLoading(false);
                }
            }
        };
        loadData();
    }, [siteId, articleId]);
    const handleTitleChange = (value) => {
        setTitle(value);
        if (!slugManual) {
            setSlug(slugify(value));
        }
    };
    const handleSlugChange = (value) => {
        setSlugManual(true);
        setSlug(slugify(value));
    };
    const handleSave = async () => {
        if (!title.trim())
            return;
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
            }
            else {
                const res = await api.post(`${basePath}/docs/articles`, payload);
                navigate(`/sites/${siteId}/docs/articles/${res.id}`, { replace: true });
            }
        }
        catch {
            // save error
        }
        finally {
            setSaving(false);
        }
    };
    const handleDelete = async () => {
        if (!confirm('Delete this article? This cannot be undone.'))
            return;
        setDeleting(true);
        try {
            await api.delete(`${basePath}/docs/articles/${articleId}`);
            navigate(`/sites/${siteId}/docs/articles`);
        }
        catch {
            // delete error
        }
        finally {
            setDeleting(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex h-64 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Link, { to: `/sites/${siteId}/docs/articles`, className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors", children: _jsx(ArrowLeft, { className: "h-5 w-5" }) }), _jsx("h1", { className: "text-2xl font-semibold", children: isEditing ? 'Edit Article' : 'New Article' })] }), _jsxs("div", { className: "flex items-center gap-2", children: [isEditing && (_jsxs(_Fragment, { children: [_jsxs(Link, { to: `/sites/${siteId}/docs/articles/${articleId}/revisions`, className: "flex h-9 items-center gap-2 rounded-md border border-input px-4 text-sm font-medium transition-colors hover:bg-accent", children: [_jsx(FileText, { className: "h-4 w-4" }), "Revisions"] }), _jsxs("button", { onClick: handleDelete, disabled: deleting, className: "flex h-9 items-center gap-2 rounded-md border border-destructive/50 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50", children: [deleting ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(Trash2, { className: "h-4 w-4" })), "Delete"] })] })), _jsxs("button", { onClick: handleSave, disabled: saving || !title.trim(), className: "flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50", children: [saving ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(Save, { className: "h-4 w-4" })), "Save"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "pt-6 space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Title" }), _jsx("input", { type: "text", value: title, onChange: (e) => handleTitleChange(e.target.value), placeholder: "Article title", className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Slug" }), _jsx("input", { type: "text", value: slug, onChange: (e) => handleSlugChange(e.target.value), placeholder: "article-slug", className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Auto-generated from title. Edit to customize." })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Excerpt" }), _jsx("textarea", { value: excerpt, onChange: (e) => setExcerpt(e.target.value), placeholder: "Brief summary of this article...", rows: 3, className: "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Tags" }), _jsx("input", { type: "text", value: tagsInput, onChange: (e) => setTagsInput(e.target.value), placeholder: "tag1, tag2, tag3", className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Comma-separated list of tags." })] })] }) }), isEditing && pageId && (_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: "Page Content" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "This article is linked to a CMS page. Edit the page to change article content blocks." })] }), _jsxs(Link, { to: `/sites/${siteId}/pages/${pageId}`, className: "flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90", children: [_jsx(ExternalLink, { className: "h-4 w-4" }), "Edit Page Content"] })] }) }) }))] }), _jsx("div", { className: "space-y-6", children: _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6 space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Category" }), _jsxs("select", { value: categoryId, onChange: (e) => setCategoryId(e.target.value), className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: [_jsx("option", { value: "", children: "No category" }), categories.map((c) => (_jsx("option", { value: c.id, children: c.name }, c.id)))] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("label", { className: "text-sm font-medium", children: "Featured" }), _jsx("button", { type: "button", role: "switch", "aria-checked": isFeatured, onClick: () => setIsFeatured(!isFeatured), className: cn('relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors', isFeatured ? 'bg-primary' : 'bg-muted'), children: _jsx("span", { className: cn('pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg transition-transform', isFeatured ? 'translate-x-4' : 'translate-x-0') }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("label", { className: "text-sm font-medium", children: "Pinned" }), _jsx("button", { type: "button", role: "switch", "aria-checked": isPinned, onClick: () => setIsPinned(!isPinned), className: cn('relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors', isPinned ? 'bg-primary' : 'bg-muted'), children: _jsx("span", { className: cn('pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg transition-transform', isPinned ? 'translate-x-4' : 'translate-x-0') }) })] })] }) }) })] })] }));
}
//# sourceMappingURL=ArticleEditor.js.map
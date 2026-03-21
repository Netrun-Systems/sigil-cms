import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Loader2, FileText, Star, Pin, Eye, ThumbsUp, ThumbsDown, ArrowUpDown, } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
export function ArticlesList() {
    const { siteId } = useParams();
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [featuredOnly, setFeaturedOnly] = useState(false);
    const [tagFilter, setTagFilter] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const basePath = `/sites/${siteId}`;
    const editBase = `/sites/${siteId}/pages`;
    const load = async () => {
        setLoading(true);
        try {
            const [articlesRes, catsRes] = await Promise.all([
                api.get(`${basePath}/docs/articles`),
                api.get(`${basePath}/docs/categories`).catch(() => ({ data: [] })),
            ]);
            setArticles(articlesRes.data ?? []);
            setCategories(catsRes.data ?? []);
        }
        catch {
            // empty state on error
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [siteId]);
    const handleDelete = async (id) => {
        if (!confirm('Delete this article?'))
            return;
        try {
            await api.delete(`${basePath}/docs/articles/${id}`);
            setArticles((prev) => prev.filter((a) => a.id !== id));
        }
        catch { /* keep list */ }
    };
    const helpfulRatio = (a) => {
        const total = a.helpfulCount + a.notHelpfulCount;
        return total > 0 ? a.helpfulCount / total : 0;
    };
    const filtered = articles
        .filter((a) => {
        if (search && !a.title.toLowerCase().includes(search.toLowerCase()))
            return false;
        if (categoryFilter && a.categoryId !== categoryFilter)
            return false;
        if (featuredOnly && !a.isFeatured)
            return false;
        if (tagFilter && !a.tags.some((t) => t.toLowerCase().includes(tagFilter.toLowerCase())))
            return false;
        return true;
    })
        .sort((a, b) => {
        if (sortBy === 'views')
            return b.viewCount - a.viewCount;
        if (sortBy === 'resonance')
            return helpfulRatio(b) - helpfulRatio(a);
        return new Date(b.revisedAt || b.createdAt).getTime() - new Date(a.revisedAt || a.createdAt).getTime();
    });
    const allTags = [...new Set(articles.flatMap((a) => a.tags))].sort();
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Knowledge Base" }), _jsxs(Link, { to: `${editBase}/new`, className: "flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90", children: [_jsx(Plus, { className: "h-4 w-4" }), " New Article"] })] }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex flex-col gap-4", children: [_jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center", children: [_jsxs("div", { className: "relative flex-1 max-w-md", children: [_jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), _jsx("input", { placeholder: "Search articles...", value: search, onChange: (e) => setSearch(e.target.value), className: "flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("select", { value: categoryFilter, onChange: (e) => setCategoryFilter(e.target.value), className: "h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: [_jsx("option", { value: "", children: "All Categories" }), categories.map((c) => (_jsx("option", { value: c.id, children: c.name }, c.id)))] }), allTags.length > 0 && (_jsxs("select", { value: tagFilter, onChange: (e) => setTagFilter(e.target.value), className: "h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: [_jsx("option", { value: "", children: "All Tags" }), allTags.map((t) => (_jsx("option", { value: t, children: t }, t)))] })), _jsxs("button", { onClick: () => setFeaturedOnly(!featuredOnly), className: cn('flex h-9 items-center gap-1.5 rounded-md px-3 text-sm transition-colors', featuredOnly
                                            ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/50'
                                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'), children: [_jsx(Star, { className: "h-3.5 w-3.5" }), " Featured"] })] }), _jsxs("div", { className: "flex items-center gap-1 text-sm", children: [_jsx(ArrowUpDown, { className: "h-3.5 w-3.5 text-muted-foreground mr-1" }), ['date', 'views', 'resonance'].map((s) => (_jsx("button", { onClick: () => setSortBy(s), className: cn('rounded-md px-3 py-1.5 text-sm capitalize transition-colors', sortBy === s
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'), children: s === 'resonance' ? 'Helpful Ratio' : s === 'date' ? 'Date' : 'Views' }, s)))] })] }) }) }), loading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : filtered.length === 0 ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(FileText, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: articles.length === 0 ? 'No articles yet' : 'No matches' })] })) : (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: filtered.map((article) => {
                    const total = article.helpfulCount + article.notHelpfulCount;
                    const ratio = total > 0 ? Math.round((article.helpfulCount / total) * 100) : null;
                    return (_jsx(Card, { className: "group relative overflow-hidden", children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "absolute top-3 right-3 flex items-center gap-1", children: [article.isFeatured && (_jsx(Star, { className: "h-4 w-4 fill-yellow-500 text-yellow-500" })), article.isPinned && (_jsx(Pin, { className: "h-4 w-4 text-blue-400" }))] }), _jsx("h3", { className: "font-medium leading-snug pr-12 mb-1 group-hover:text-primary transition-colors", children: article.title }), article.excerpt && (_jsx("p", { className: "text-sm text-muted-foreground line-clamp-2 mb-3", children: article.excerpt })), article.categoryName && (_jsx("span", { className: "inline-block rounded-md bg-muted px-2 py-0.5 text-xs capitalize mb-2", children: article.categoryName })), article.tags.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-1 mb-3", children: article.tags.map((tag) => (_jsx("span", { className: "rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary", children: tag }, tag))) })), _jsxs("div", { className: "flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-3 border-t border-border", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Eye, { className: "h-3 w-3" }), " ", article.viewCount] }), ratio !== null && (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(ThumbsUp, { className: "h-3 w-3" }), " ", ratio, "%", _jsxs("span", { className: "text-muted-foreground/60", children: ["(", article.helpfulCount, _jsx(ThumbsUp, { className: "inline h-2.5 w-2.5 mx-0.5" }), article.notHelpfulCount, _jsx(ThumbsDown, { className: "inline h-2.5 w-2.5 mx-0.5" }), ")"] })] })), _jsx("span", { className: "ml-auto", children: new Date(article.revisedAt || article.createdAt).toLocaleDateString() })] }), _jsxs("div", { className: "flex items-center gap-1 mt-3 opacity-0 transition-opacity group-hover:opacity-100", children: [_jsx(Link, { to: article.pageId ? `${editBase}/${article.pageId}` : `${editBase}/new`, className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground", children: _jsx(Pencil, { className: "h-4 w-4" }) }), _jsx("button", { onClick: () => handleDelete(article.id), className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive", children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] }) }, article.id));
                }) }))] }));
}
//# sourceMappingURL=ArticlesList.js.map
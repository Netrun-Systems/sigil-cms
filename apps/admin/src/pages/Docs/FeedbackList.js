import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, MessageCircle, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, BarChart3, } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
export function FeedbackList() {
    const { siteId } = useParams();
    const [stats, setStats] = useState(null);
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [articleFilter, setArticleFilter] = useState('');
    const [expanded, setExpanded] = useState(null);
    const basePath = `/sites/${siteId}/docs/feedback`;
    const load = async () => {
        setLoading(true);
        try {
            const [feedbackRes, statsRes] = await Promise.all([
                api.get(basePath),
                api.get(`${basePath}/stats`),
            ]);
            setFeedback(feedbackRes.data ?? []);
            setStats(statsRes.data ?? null);
        }
        catch {
            // empty state
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [siteId]);
    const filtered = feedback.filter((f) => {
        if (articleFilter && f.articleId !== articleFilter)
            return false;
        if (filter === 'helpful' && f.helpfulCount === 0)
            return false;
        if (filter === 'not_helpful' && f.notHelpfulCount === 0)
            return false;
        return true;
    });
    const ratioBar = (helpful, notHelpful) => {
        const total = helpful + notHelpful;
        if (total === 0)
            return null;
        const pct = Math.round((helpful / total) * 100);
        return (_jsxs("div", { className: "flex items-center gap-2 w-full max-w-[200px]", children: [_jsx("div", { className: "flex-1 h-2 rounded-full bg-muted overflow-hidden", children: _jsx("div", { className: "h-full rounded-full bg-green-500 transition-all", style: { width: `${pct}%` } }) }), _jsxs("span", { className: "text-xs text-muted-foreground shrink-0 w-10 text-right", children: [pct, "%"] })] }));
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Feedback" }), stats && (_jsxs("span", { className: "text-sm text-muted-foreground", children: [stats.totalResponses, " total responses"] }))] }), stats && (_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10", children: _jsx(ThumbsUp, { className: "h-5 w-5 text-green-500" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold", children: stats.totalHelpful }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Total Helpful" })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10", children: _jsx(ThumbsDown, { className: "h-5 w-5 text-red-500" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold", children: stats.totalNotHelpful }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Total Not Helpful" })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10", children: _jsx(BarChart3, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold", children: stats.totalResponses > 0
                                                    ? `${Math.round((stats.totalHelpful / stats.totalResponses) * 100)}%`
                                                    : '--' }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Helpful Rate" })] })] }) }) })] })), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center", children: [_jsxs("select", { value: articleFilter, onChange: (e) => setArticleFilter(e.target.value), className: "h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: [_jsx("option", { value: "", children: "All Articles" }), feedback.map((f) => (_jsx("option", { value: f.articleId, children: f.articleTitle }, f.articleId)))] }), _jsx("div", { className: "flex gap-2", children: ['all', 'helpful', 'not_helpful'].map((f) => (_jsx("button", { onClick: () => setFilter(f), className: cn('rounded-md px-3 py-1.5 text-sm transition-colors', filter === f
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'), children: f === 'all' ? 'All' : f === 'helpful' ? 'Helpful' : 'Not Helpful' }, f))) })] }) }) }), loading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : filtered.length === 0 ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(MessageCircle, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: feedback.length === 0 ? 'No feedback yet' : 'No matches' })] })) : (_jsx(Card, { children: _jsxs("div", { className: "overflow-x-auto", children: [_jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border", children: [_jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Article" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground w-[80px]", children: _jsx(ThumbsUp, { className: "h-3.5 w-3.5 inline" }) }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground w-[80px]", children: _jsx(ThumbsDown, { className: "h-3.5 w-3.5 inline" }) }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Ratio" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Latest Comment" }), _jsx("th", { className: "px-6 py-3 w-[40px]" })] }) }), _jsx("tbody", { children: filtered.map((item) => {
                                        const isExpanded = expanded === item.articleId;
                                        return (_jsxs("tr", { className: "group", children: [_jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: "font-medium text-sm", children: item.articleTitle }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: "text-sm text-green-500 font-medium", children: item.helpfulCount }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: "text-sm text-red-500 font-medium", children: item.notHelpfulCount }) }), _jsx("td", { className: "px-6 py-4", children: ratioBar(item.helpfulCount, item.notHelpfulCount) }), _jsx("td", { className: "px-6 py-4", children: item.latestComment ? (_jsx("p", { className: "text-sm text-muted-foreground line-clamp-1 max-w-[200px]", children: item.latestComment })) : (_jsx("span", { className: "text-xs text-muted-foreground/60", children: "--" })) }), _jsx("td", { className: "px-6 py-4", children: item.comments && item.comments.length > 0 && (_jsx("button", { onClick: () => setExpanded(isExpanded ? null : item.articleId), className: "rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground", children: isExpanded
                                                            ? _jsx(ChevronUp, { className: "h-4 w-4" })
                                                            : _jsx(ChevronDown, { className: "h-4 w-4" }) })) })] }, item.articleId));
                                    }) })] }), expanded && (() => {
                            const item = filtered.find((f) => f.articleId === expanded);
                            if (!item || !item.comments || item.comments.length === 0)
                                return null;
                            return (_jsxs("div", { className: "border-t border-border bg-accent/20 px-6 py-4", children: [_jsxs("p", { className: "text-xs font-medium text-muted-foreground mb-3", children: ["Comments for \"", item.articleTitle, "\""] }), _jsx("div", { className: "space-y-3", children: item.comments.map((c) => (_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full', c.helpful ? 'bg-green-500/10' : 'bg-red-500/10'), children: c.helpful
                                                        ? _jsx(ThumbsUp, { className: "h-3 w-3 text-green-500" })
                                                        : _jsx(ThumbsDown, { className: "h-3 w-3 text-red-500" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [c.comment ? (_jsx("p", { className: "text-sm", children: c.comment })) : (_jsx("p", { className: "text-sm text-muted-foreground italic", children: "No comment" })), _jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: new Date(c.createdAt).toLocaleString() })] })] }, c.id))) })] }));
                        })()] }) }))] }));
}
//# sourceMappingURL=FeedbackList.js.map
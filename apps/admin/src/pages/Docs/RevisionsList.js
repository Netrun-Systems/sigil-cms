import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, History, ChevronDown, ChevronUp, RotateCcw, } from 'lucide-react';
import { Card, CardContent } from '@netrun-cms/ui';
import { api } from '../../lib/api';
function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
function summarizeBlock(block) {
    const text = block.content.title ||
        block.content.heading ||
        block.content.text ||
        '';
    if (text.length > 80)
        return text.slice(0, 80) + '...';
    return text || '(no text content)';
}
export function RevisionsList() {
    const { siteId, id: articleId } = useParams();
    const basePath = `/sites/${siteId}`;
    const [article, setArticle] = useState(null);
    const [revisions, setRevisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [reverting, setReverting] = useState(null);
    const load = async () => {
        setLoading(true);
        try {
            const [articleRes, revisionsRes] = await Promise.all([
                api.get(`${basePath}/docs/articles/${articleId}`),
                api.get(`${basePath}/docs/articles/${articleId}/revisions`),
            ]);
            setArticle(articleRes);
            setRevisions(revisionsRes.data ?? []);
        }
        catch {
            // error loading
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        load();
    }, [siteId, articleId]);
    const handleRevert = async (revisionId) => {
        if (!confirm('Revert to this revision? The current content will be saved as a new revision.')) {
            return;
        }
        setReverting(revisionId);
        try {
            await api.post(`${basePath}/docs/articles/${articleId}/revisions/${revisionId}/revert`, {});
            await load();
        }
        catch {
            // revert error
        }
        finally {
            setReverting(null);
        }
    };
    const toggleExpanded = (id) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };
    if (loading) {
        return (_jsx("div", { className: "flex h-64 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Link, { to: `/sites/${siteId}/docs/articles/${articleId}`, className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors", children: _jsx(ArrowLeft, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Revision History" }), article && (_jsx("p", { className: "text-sm text-muted-foreground", children: article.title }))] })] }), revisions.length === 0 ? (_jsxs("div", { className: "flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(History, { className: "h-10 w-10" }), _jsx("p", { className: "text-sm", children: "No revisions found for this article." })] })) : (_jsx("div", { className: "space-y-3", children: revisions.map((rev) => {
                    const isExpanded = expandedId === rev.id;
                    const isReverting = reverting === rev.id;
                    return (_jsx(Card, { children: _jsxs(CardContent, { className: "pt-4 pb-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("button", { onClick: () => toggleExpanded(rev.id), className: "flex flex-1 items-center gap-3 text-left", children: [isExpanded ? (_jsx(ChevronUp, { className: "h-4 w-4 text-muted-foreground shrink-0" })) : (_jsx(ChevronDown, { className: "h-4 w-4 text-muted-foreground shrink-0" })), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("span", { className: "rounded-md bg-muted px-2 py-0.5 text-xs font-mono", children: ["v", rev.version] }), _jsx("span", { className: "text-sm text-muted-foreground", children: formatDate(rev.createdAt) }), rev.changedBy && (_jsxs("span", { className: "text-sm text-muted-foreground", children: ["by ", rev.changedBy] }))] })] }), _jsxs("button", { onClick: () => handleRevert(rev.id), disabled: isReverting, className: "flex h-8 items-center gap-1.5 rounded-md border border-input px-3 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50", children: [isReverting ? (_jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" })) : (_jsx(RotateCcw, { className: "h-3.5 w-3.5" })), "Revert"] })] }), rev.changeNote && (_jsx("p", { className: "mt-2 ml-7 text-sm text-muted-foreground", children: rev.changeNote })), isExpanded && rev.snapshot?.blocks && (_jsxs("div", { className: "mt-4 ml-7 space-y-2 border-t border-border pt-3", children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: "Content Snapshot" }), rev.snapshot.blocks.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground", children: "No content blocks in this revision." })) : (_jsx("div", { className: "space-y-1.5", children: rev.snapshot.blocks.map((block, i) => (_jsxs("div", { className: "flex items-start gap-2 rounded-md border border-border p-2", children: [_jsx("span", { className: "rounded bg-muted px-1.5 py-0.5 text-[10px] capitalize font-mono shrink-0", children: block.type }), _jsx("span", { className: "text-xs text-muted-foreground", children: summarizeBlock(block) })] }, i))) }))] }))] }) }, rev.id));
                }) }))] }));
}
//# sourceMappingURL=RevisionsList.js.map
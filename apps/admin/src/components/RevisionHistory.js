import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Clock, RotateCcw, Eye, ChevronDown, ChevronUp, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Separator, cn, } from '@netrun-cms/ui';
import { api } from '../lib/api';
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
export function RevisionHistory({ siteId, pageId, onReverted }) {
    const [revisions, setRevisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [reverting, setReverting] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(true);
    const fetchRevisions = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/sites/${siteId}/pages/${pageId}/revisions`);
            setRevisions(res.data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load revisions');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (pageId) {
            fetchRevisions();
        }
    }, [siteId, pageId]);
    const handleRevert = async (revisionId, version) => {
        if (!confirm(`Revert this page to version ${version}? The current state will be saved as a new revision before reverting.`)) {
            return;
        }
        setReverting(revisionId);
        try {
            await api.post(`/sites/${siteId}/pages/${pageId}/revisions/${revisionId}/revert`, {});
            await fetchRevisions();
            onReverted?.();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Revert failed');
        }
        finally {
            setReverting(null);
        }
    };
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "cursor-pointer", onClick: () => setIsCollapsed(!isCollapsed), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "h-5 w-5 text-muted-foreground" }), _jsx(CardTitle, { className: "text-base", children: "Revision History" }), revisions.length > 0 && (_jsx(Badge, { variant: "secondary", children: revisions.length }))] }), isCollapsed ? (_jsx(ChevronDown, { className: "h-4 w-4 text-muted-foreground" })) : (_jsx(ChevronUp, { className: "h-4 w-4 text-muted-foreground" }))] }) }), !isCollapsed && (_jsxs(CardContent, { children: [loading && (_jsx("p", { className: "text-sm text-muted-foreground", children: "Loading revisions..." })), error && (_jsx("p", { className: "text-sm text-destructive", children: error })), !loading && !error && revisions.length === 0 && (_jsx("p", { className: "text-sm text-muted-foreground", children: "No revisions yet. Revisions are created automatically when you save changes." })), !loading && revisions.length > 0 && (_jsx("div", { className: "space-y-3", children: revisions.map((rev) => (_jsxs("div", { className: "rounded-lg border", children: [_jsxs("div", { className: "flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50", onClick: () => setExpandedId(expandedId === rev.id ? null : rev.id), children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Badge, { variant: "outline", children: ["v", rev.version] }), _jsx("span", { className: "text-sm font-medium", children: rev.title })] }), _jsxs("div", { className: "mt-1 flex items-center gap-3 text-xs text-muted-foreground", children: [_jsx("span", { children: formatDate(rev.createdAt) }), rev.changedBy && (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(User, { className: "h-3 w-3" }), rev.changedBy] }))] }), rev.changeNote && (_jsx("p", { className: "mt-1 text-xs text-muted-foreground italic", children: rev.changeNote }))] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: (e) => {
                                                        e.stopPropagation();
                                                        setExpandedId(expandedId === rev.id ? null : rev.id);
                                                    }, children: [_jsx(Eye, { className: "mr-1 h-3 w-3" }), "Preview"] }), _jsxs(Button, { variant: "ghost", size: "sm", disabled: reverting === rev.id, onClick: (e) => {
                                                        e.stopPropagation();
                                                        handleRevert(rev.id, rev.version);
                                                    }, children: [_jsx(RotateCcw, { className: cn('mr-1 h-3 w-3', reverting === rev.id && 'animate-spin') }), reverting === rev.id ? 'Reverting...' : 'Revert'] })] })] }), expandedId === rev.id && (_jsx("div", { className: "border-t p-3 bg-muted/30", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "text-sm", children: [_jsx("span", { className: "font-medium", children: "Slug:" }), ' ', _jsxs("span", { className: "text-muted-foreground", children: ["/", rev.slug] })] }), _jsx(Separator, {}), _jsxs("div", { className: "text-sm font-medium", children: ["Content Blocks (", rev.contentSnapshot.length, ")"] }), rev.contentSnapshot.length === 0 ? (_jsx("p", { className: "text-xs text-muted-foreground", children: "No blocks in this revision" })) : (_jsx("div", { className: "space-y-1", children: rev.contentSnapshot.map((block, idx) => (_jsxs("div", { className: "flex items-center gap-2 rounded border bg-background px-3 py-2 text-sm", children: [_jsx(Badge, { variant: "secondary", className: "text-xs", children: block.blockType || 'unknown' }), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["Order: ", block.sortOrder ?? idx] }), block.isVisible === false && (_jsx(Badge, { variant: "outline", className: "text-xs", children: "Hidden" }))] }, idx))) })), rev.settingsSnapshot && Object.keys(rev.settingsSnapshot).length > 0 && (_jsxs(_Fragment, { children: [_jsx(Separator, {}), _jsx("div", { className: "text-sm font-medium", children: "Settings" }), _jsx("div", { className: "space-y-1 text-xs text-muted-foreground", children: Object.entries(rev.settingsSnapshot).map(([key, value]) => (value != null && (_jsxs("div", { children: [_jsxs("span", { className: "font-medium", children: [key, ":"] }), " ", String(value)] }, key)))) })] }))] }) }))] }, rev.id))) }))] }))] }));
}
//# sourceMappingURL=RevisionHistory.js.map
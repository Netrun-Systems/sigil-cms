import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Activity, BarChart3, Blocks, FlaskConical, Sparkles, RefreshCw, Check, X, } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
const priorityColors = {
    low: 'border-gray-500/50 bg-gray-500/10 text-gray-400',
    medium: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
    high: 'border-red-500/50 bg-red-500/10 text-red-400',
};
function scoreColor(score) {
    if (score <= 30)
        return 'bg-red-500';
    if (score <= 60)
        return 'bg-yellow-500';
    return 'bg-green-500';
}
function scoreTextColor(score) {
    if (score <= 30)
        return 'text-red-500';
    if (score <= 60)
        return 'text-yellow-500';
    return 'text-green-500';
}
function formatSeconds(s) {
    if (s < 60)
        return `${s.toFixed(1)}s`;
    return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}
export function ResonanceDashboard() {
    const { siteId } = useParams();
    const basePath = `/sites/${siteId}`;
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [computing, setComputing] = useState(false);
    // Heatmap state
    const [pages, setPages] = useState([]);
    const [selectedPageId, setSelectedPageId] = useState('');
    const [heatmap, setHeatmap] = useState([]);
    const [heatmapLoading, setHeatmapLoading] = useState(false);
    // Suggestions state
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const loadDashboard = async () => {
        setLoading(true);
        try {
            const res = await api.get(`${basePath}/resonance/dashboard`);
            setStats(res);
        }
        catch {
            // empty state
        }
        finally {
            setLoading(false);
        }
    };
    const loadPages = async () => {
        try {
            const res = await api.get(`${basePath}/pages`);
            setPages(res.data ?? []);
        }
        catch {
            // empty state
        }
    };
    const loadHeatmap = async (pageId) => {
        if (!pageId) {
            setHeatmap([]);
            return;
        }
        setHeatmapLoading(true);
        try {
            const res = await api.get(`${basePath}/resonance/scores/heatmap?pageId=${pageId}`);
            setHeatmap(res.data ?? []);
        }
        catch {
            setHeatmap([]);
        }
        finally {
            setHeatmapLoading(false);
        }
    };
    const loadSuggestions = async () => {
        setSuggestionsLoading(true);
        try {
            const res = await api.get(`${basePath}/resonance/suggestions?status=pending`);
            setSuggestions(res.data ?? []);
        }
        catch {
            // empty state
        }
        finally {
            setSuggestionsLoading(false);
        }
    };
    const computeScores = async () => {
        setComputing(true);
        try {
            await api.post(`${basePath}/resonance/scores/compute`, {});
            await loadDashboard();
            if (selectedPageId)
                await loadHeatmap(selectedPageId);
        }
        catch {
            // error handled silently
        }
        finally {
            setComputing(false);
        }
    };
    const generateSuggestions = async () => {
        setGenerating(true);
        try {
            await api.post(`${basePath}/resonance/suggestions/generate`, {});
            await loadSuggestions();
        }
        catch {
            // error handled silently
        }
        finally {
            setGenerating(false);
        }
    };
    const updateSuggestion = async (id, status) => {
        try {
            await api.patch(`${basePath}/resonance/suggestions/${id}`, { status });
            setSuggestions((prev) => prev.filter((s) => s.id !== id));
        }
        catch {
            // keep list as-is
        }
    };
    useEffect(() => {
        loadDashboard();
        loadPages();
        loadSuggestions();
    }, [siteId]);
    useEffect(() => {
        loadHeatmap(selectedPageId);
    }, [selectedPageId]);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Resonance Analytics" }), _jsxs("button", { onClick: computeScores, disabled: computing, className: "flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50", children: [computing ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(RefreshCw, { className: "h-4 w-4" })), "Compute Scores"] })] }), loading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : stats ? (_jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-md bg-blue-500/10 text-blue-500", children: _jsx(Activity, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Total Events" }), _jsx("p", { className: "text-2xl font-bold", children: stats.totalEvents.toLocaleString() })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: cn('flex h-10 w-10 items-center justify-center rounded-md', stats.avgResonanceScore <= 30
                                            ? 'bg-red-500/10 text-red-500'
                                            : stats.avgResonanceScore <= 60
                                                ? 'bg-yellow-500/10 text-yellow-500'
                                                : 'bg-green-500/10 text-green-500'), children: _jsx(BarChart3, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Avg Resonance Score" }), _jsx("p", { className: cn('text-2xl font-bold', scoreTextColor(stats.avgResonanceScore)), children: stats.avgResonanceScore })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-md bg-purple-500/10 text-purple-500", children: _jsx(Blocks, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Top Block Type" }), _jsx("p", { className: "text-lg font-bold capitalize", children: stats.topBlockType || 'N/A' })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-md bg-orange-500/10 text-orange-500", children: _jsx(FlaskConical, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Active Experiments" }), _jsx("p", { className: "text-2xl font-bold", children: stats.activeExperiments })] })] }) }) })] })) : null, _jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Block Heatmap" }), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6 space-y-4", children: [_jsxs("select", { value: selectedPageId, onChange: (e) => setSelectedPageId(e.target.value), className: "flex h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: [_jsx("option", { value: "", children: "Select a page..." }), pages.map((p) => (_jsx("option", { value: p.id, children: p.title }, p.id)))] }), heatmapLoading ? (_jsx("div", { className: "flex h-24 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : !selectedPageId ? (_jsx("p", { className: "text-sm text-muted-foreground py-4", children: "Select a page to view block resonance scores." })) : heatmap.length === 0 ? (_jsxs("div", { className: "flex h-24 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(BarChart3, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: "No heatmap data for this page" })] })) : (_jsx("div", { className: "space-y-2", children: heatmap.map((block) => (_jsxs("div", { className: "flex items-center gap-4 rounded-lg border border-border p-3", children: [_jsx("span", { className: "rounded-md bg-muted px-2 py-0.5 text-xs capitalize min-w-[80px] text-center", children: block.blockType }), _jsxs("div", { className: "flex-1 flex items-center gap-3", children: [_jsx("div", { className: "flex-1 h-4 rounded-full bg-muted overflow-hidden", children: _jsx("div", { className: cn('h-full rounded-full transition-all', scoreColor(block.resonanceScore)), style: { width: `${block.resonanceScore}%` } }) }), _jsx("span", { className: cn('text-sm font-bold min-w-[36px] text-right', scoreTextColor(block.resonanceScore)), children: block.resonanceScore })] }), _jsxs("div", { className: "flex gap-4 text-xs text-muted-foreground", children: [_jsxs("span", { title: "Impressions", children: [block.impressions.toLocaleString(), " imp"] }), _jsx("span", { title: "Avg viewport time", children: formatSeconds(block.avgViewportTime) }), _jsxs("span", { title: "Clicks", children: [block.clicks.toLocaleString(), " clicks"] })] })] }, block.blockId))) }))] }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold", children: "AI Suggestions" }), _jsxs("button", { onClick: generateSuggestions, disabled: generating, className: "flex h-8 items-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50", children: [generating ? (_jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" })) : (_jsx(Sparkles, { className: "h-3.5 w-3.5" })), "Generate Suggestions"] })] }), suggestionsLoading ? (_jsx("div", { className: "flex h-24 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : suggestions.length === 0 ? (_jsxs("div", { className: "flex h-24 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(Sparkles, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: "No pending suggestions" })] })) : (_jsx("div", { className: "space-y-3", children: suggestions.map((s) => (_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex-1 space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "rounded-md bg-muted px-2 py-0.5 text-xs capitalize", children: s.blockType }), _jsx("span", { className: cn('rounded-md px-2 py-0.5 text-xs capitalize border', priorityColors[s.priority] || ''), children: s.priority }), _jsx("span", { className: "rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground", children: s.category })] }), _jsx("p", { className: "text-sm", children: s.suggestion }), _jsx("p", { className: "text-xs text-muted-foreground", children: s.reason })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: () => updateSuggestion(s.id, 'applied'), title: "Applied", className: "rounded-md p-1.5 text-muted-foreground hover:bg-green-500/10 hover:text-green-500 transition-colors", children: _jsx(Check, { className: "h-4 w-4" }) }), _jsx("button", { onClick: () => updateSuggestion(s.id, 'dismissed'), title: "Dismiss", className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive transition-colors", children: _jsx(X, { className: "h-4 w-4" }) })] })] }) }) }, s.id))) }))] })] }));
}
//# sourceMappingURL=ResonanceDashboard.js.map
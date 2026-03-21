import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, FlaskConical, Plus, Play, Square, Eye, Trophy, X, } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
const statusColors = {
    draft: 'border-gray-500/50 bg-gray-500/10 text-gray-400',
    running: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
    concluded: 'border-green-500/50 bg-green-500/10 text-green-400',
};
export function ExperimentsList() {
    const { siteId } = useParams();
    const basePath = `/sites/${siteId}`;
    const [experiments, setExperiments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [resultsView, setResultsView] = useState(null);
    const [results, setResults] = useState(null);
    const [resultsLoading, setResultsLoading] = useState(false);
    // Create form state
    const [pages, setPages] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [formName, setFormName] = useState('');
    const [formPageId, setFormPageId] = useState('');
    const [formBlockId, setFormBlockId] = useState('');
    const [formTrafficSplit, setFormTrafficSplit] = useState(50);
    const [creating, setCreating] = useState(false);
    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get(`${basePath}/resonance/experiments`);
            setExperiments(res.data ?? []);
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
    const loadBlocks = async (pageId) => {
        if (!pageId) {
            setBlocks([]);
            return;
        }
        try {
            const res = await api.get(`${basePath}/pages/${pageId}/blocks`);
            setBlocks(res.data ?? []);
        }
        catch {
            setBlocks([]);
        }
    };
    const loadResults = async (experimentId) => {
        setResultsView(experimentId);
        setResultsLoading(true);
        try {
            const res = await api.get(`${basePath}/resonance/experiments/${experimentId}/results`);
            setResults(res);
        }
        catch {
            setResults(null);
        }
        finally {
            setResultsLoading(false);
        }
    };
    const handleCreate = async () => {
        if (!formName || !formBlockId)
            return;
        setCreating(true);
        try {
            await api.post(`${basePath}/resonance/experiments`, {
                name: formName,
                blockId: formBlockId,
                trafficSplit: formTrafficSplit,
            });
            setShowCreate(false);
            setFormName('');
            setFormPageId('');
            setFormBlockId('');
            setFormTrafficSplit(50);
            await load();
        }
        catch {
            // keep dialog open
        }
        finally {
            setCreating(false);
        }
    };
    const startExperiment = async (id) => {
        try {
            await api.post(`${basePath}/resonance/experiments/${id}/start`, {});
            setExperiments((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'running', startedAt: new Date().toISOString() } : e)));
        }
        catch {
            // keep state
        }
    };
    const concludeExperiment = async (id) => {
        try {
            await api.post(`${basePath}/resonance/experiments/${id}/conclude`, {});
            await load();
        }
        catch {
            // keep state
        }
    };
    useEffect(() => { load(); }, [siteId]);
    useEffect(() => {
        if (showCreate)
            loadPages();
    }, [showCreate]);
    useEffect(() => {
        loadBlocks(formPageId);
    }, [formPageId]);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Experiments" }), _jsxs("button", { onClick: () => setShowCreate(true), className: "flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90", children: [_jsx(Plus, { className: "h-4 w-4" }), " New Experiment"] })] }), showCreate && (_jsx(Card, { children: _jsxs(CardContent, { className: "pt-6 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-semibold", children: "Create Experiment" }), _jsx("button", { onClick: () => setShowCreate(false), className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground", children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "Name" }), _jsx("input", { value: formName, onChange: (e) => setFormName(e.target.value), placeholder: "Experiment name...", className: "mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "Page" }), _jsxs("select", { value: formPageId, onChange: (e) => setFormPageId(e.target.value), className: "mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: [_jsx("option", { value: "", children: "Select a page..." }), pages.map((p) => (_jsx("option", { value: p.id, children: p.title }, p.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "Block" }), _jsxs("select", { value: formBlockId, onChange: (e) => setFormBlockId(e.target.value), disabled: !formPageId, className: "mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50", children: [_jsx("option", { value: "", children: "Select a block..." }), blocks.map((b) => (_jsxs("option", { value: b.id, children: ["#", b.position, " - ", b.blockType] }, b.id)))] })] }), _jsxs("div", { children: [_jsxs("label", { className: "text-xs font-medium text-muted-foreground", children: ["Traffic Split: ", formTrafficSplit, "% variant / ", 100 - formTrafficSplit, "% original"] }), _jsx("input", { type: "range", min: 10, max: 90, step: 5, value: formTrafficSplit, onChange: (e) => setFormTrafficSplit(Number(e.target.value)), className: "mt-1 w-full" })] })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx("button", { onClick: () => setShowCreate(false), className: "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors", children: "Cancel" }), _jsxs("button", { onClick: handleCreate, disabled: creating || !formName || !formBlockId, className: "flex h-8 items-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50", children: [creating && _jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" }), "Create"] })] })] }) })), loading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : experiments.length === 0 ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(FlaskConical, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: "No experiments yet" })] })) : (_jsx("div", { className: "space-y-3", children: experiments.map((exp) => (_jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex-1 space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "font-medium", children: exp.name }), _jsx("span", { className: cn('rounded-md px-2 py-0.5 text-xs capitalize border', statusColors[exp.status] || ''), children: exp.status }), exp.status === 'concluded' && exp.winner && (_jsxs("span", { className: "flex items-center gap-1 rounded-md border border-green-500/50 bg-green-500/10 px-2 py-0.5 text-xs text-green-400", children: [_jsx(Trophy, { className: "h-3 w-3" }), exp.winner, " wins", exp.liftPercent != null && ` (+${exp.liftPercent.toFixed(1)}%)`] }))] }), _jsxs("div", { className: "flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground", children: [_jsxs("span", { children: ["Original: ", exp.originalBlockId.slice(0, 8), "..."] }), _jsxs("span", { children: ["Variant: ", exp.variantBlockId.slice(0, 8), "..."] }), _jsxs("span", { children: ["Split: ", exp.trafficSplit, "% / ", 100 - exp.trafficSplit, "%"] }), exp.startedAt && (_jsxs("span", { children: ["Started: ", new Date(exp.startedAt).toLocaleDateString()] })), exp.concludedAt && (_jsxs("span", { children: ["Concluded: ", new Date(exp.concludedAt).toLocaleDateString()] }))] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [exp.status === 'draft' && (_jsx("button", { onClick: () => startExperiment(exp.id), title: "Start experiment", className: "rounded-md p-1.5 text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500 transition-colors", children: _jsx(Play, { className: "h-4 w-4" }) })), exp.status === 'running' && (_jsx("button", { onClick: () => concludeExperiment(exp.id), title: "Conclude experiment", className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors", children: _jsx(Square, { className: "h-4 w-4" }) })), _jsx("button", { onClick: () => loadResults(exp.id), title: "View results", className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors", children: _jsx(Eye, { className: "h-4 w-4" }) })] })] }), resultsView === exp.id && (_jsx("div", { className: "mt-4 pt-4 border-t border-border", children: resultsLoading ? (_jsx("div", { className: "flex h-16 items-center justify-center", children: _jsx(Loader2, { className: "h-4 w-4 animate-spin text-muted-foreground" }) })) : results ? (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: cn('rounded-lg border p-3 space-y-2', results.winner === 'original' ? 'border-green-500/50 bg-green-500/5' : 'border-border'), children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("p", { className: "text-sm font-semibold", children: "Original" }), results.winner === 'original' && (_jsx(Trophy, { className: "h-3.5 w-3.5 text-green-500" }))] }), _jsxs("div", { className: "grid grid-cols-3 gap-2 text-center", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Impressions" }), _jsx("p", { className: "text-sm font-bold", children: results.original.impressions.toLocaleString() })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Resonance" }), _jsx("p", { className: "text-sm font-bold", children: results.original.resonanceScore })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Clicks" }), _jsx("p", { className: "text-sm font-bold", children: results.original.clicks.toLocaleString() })] })] })] }), _jsxs("div", { className: cn('rounded-lg border p-3 space-y-2', results.winner === 'variant' ? 'border-green-500/50 bg-green-500/5' : 'border-border'), children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("p", { className: "text-sm font-semibold", children: "Variant" }), results.winner === 'variant' && (_jsx(Trophy, { className: "h-3.5 w-3.5 text-green-500" }))] }), _jsxs("div", { className: "grid grid-cols-3 gap-2 text-center", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Impressions" }), _jsx("p", { className: "text-sm font-bold", children: results.variant.impressions.toLocaleString() })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Resonance" }), _jsx("p", { className: "text-sm font-bold", children: results.variant.resonanceScore })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Clicks" }), _jsx("p", { className: "text-sm font-bold", children: results.variant.clicks.toLocaleString() })] })] })] })] }), _jsxs("div", { className: "flex items-center gap-3 text-xs text-muted-foreground", children: [_jsx("span", { className: cn('rounded-md px-2 py-0.5 border', results.significant
                                                        ? 'border-green-500/50 bg-green-500/10 text-green-400'
                                                        : 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'), children: results.significant ? 'Statistically significant' : 'Not yet significant' }), results.liftPercent != null && (_jsxs("span", { children: ["Lift: ", results.liftPercent > 0 ? '+' : '', results.liftPercent.toFixed(1), "%"] }))] })] })) : (_jsx("p", { className: "text-sm text-muted-foreground", children: "No results available" })) }))] }) }, exp.id))) }))] }));
}
//# sourceMappingURL=ExperimentsList.js.map
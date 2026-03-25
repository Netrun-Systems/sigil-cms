import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Bot, Wifi, WifiOff, Database, Send, Save, MessageCircle, Settings, } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
const defaultConfig = {
    position: 'bottom-right',
    primaryColor: '#90b9ab',
    greeting: 'Hi! How can I help you today?',
    placeholder: 'Type a message...',
};
export function CharlottePage() {
    const { siteId } = useParams();
    const basePath = `/sites/${siteId}`;
    const [connected, setConnected] = useState(null);
    const [health, setHealth] = useState(null);
    const [collections, setCollections] = useState([]);
    const [collectionsLoading, setCollectionsLoading] = useState(true);
    const [pages, setPages] = useState([]);
    const [selectedPageId, setSelectedPageId] = useState('');
    const [ingesting, setIngesting] = useState(false);
    const [config, setConfig] = useState(defaultConfig);
    const [saving, setSaving] = useState(false);
    const checkHealth = async () => {
        try {
            const res = await api.get(`${basePath}/charlotte/health`);
            setHealth(res);
            setConnected(true);
        }
        catch {
            setConnected(false);
        }
    };
    const loadCollections = async () => {
        setCollectionsLoading(true);
        try {
            const res = await api.get(`${basePath}/charlotte/knowledge`);
            setCollections(res.data ?? []);
        }
        catch {
            // empty state
        }
        finally {
            setCollectionsLoading(false);
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
    const loadConfig = async () => {
        try {
            const res = await api.get(`${basePath}/charlotte/config`);
            setConfig({ ...defaultConfig, ...res });
        }
        catch {
            // use defaults
        }
    };
    useEffect(() => {
        checkHealth();
        loadCollections();
        loadPages();
        loadConfig();
    }, [siteId]);
    const handleIngest = async () => {
        if (!selectedPageId)
            return;
        setIngesting(true);
        try {
            await api.post(`${basePath}/charlotte/ingest`, {
                pageId: selectedPageId,
            });
            setSelectedPageId('');
            await loadCollections();
        }
        catch {
            // ingest error
        }
        finally {
            setIngesting(false);
        }
    };
    const handleSaveConfig = async () => {
        setSaving(true);
        try {
            await api.put(`${basePath}/charlotte/config`, config);
        }
        catch {
            // save error
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Charlotte AI Assistant" }), connected !== null && (_jsxs("span", { className: cn('flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border', connected
                                ? 'border-green-500/50 bg-green-500/10 text-green-400'
                                : 'border-red-500/50 bg-red-500/10 text-red-400'), children: [connected ? (_jsx(Wifi, { className: "h-3 w-3" })) : (_jsx(WifiOff, { className: "h-3 w-3" })), connected ? 'Connected' : 'Disconnected'] }))] }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-6", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "pt-6 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Bot, { className: "h-5 w-5 text-muted-foreground" }), _jsx("p", { className: "text-sm font-medium", children: "Connection Status" })] }), health ? (_jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: "Status" }), _jsx("span", { className: "font-medium capitalize", children: health.status })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: "Models Available" }), _jsx("span", { className: "font-medium", children: health.modelsAvailable.length > 0
                                                                ? health.modelsAvailable.join(', ')
                                                                : 'None' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: "Last Check" }), _jsx("span", { className: "font-medium text-xs", children: new Date(health.lastChecked).toLocaleString() })] })] })) : connected === false ? (_jsx("p", { className: "text-sm text-muted-foreground", children: "Unable to reach Charlotte API. Ensure it is configured and running." })) : (_jsx("div", { className: "flex h-12 items-center justify-center", children: _jsx(Loader2, { className: "h-4 w-4 animate-spin text-muted-foreground" }) }))] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6 space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Database, { className: "h-5 w-5 text-muted-foreground" }), _jsx("p", { className: "text-sm font-medium", children: "Knowledge Base" })] }), collectionsLoading ? (_jsx("div", { className: "flex h-16 items-center justify-center", children: _jsx(Loader2, { className: "h-4 w-4 animate-spin text-muted-foreground" }) })) : collections.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground", children: "No knowledge collections yet. Ingest a page to get started." })) : (_jsx("div", { className: "space-y-2", children: collections.map((col) => (_jsx("div", { className: "flex items-center justify-between rounded-md border border-border p-3", children: _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: col.name }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [col.documentCount, " document", col.documentCount !== 1 ? 's' : '', col.lastUpdated &&
                                                                    ` | Updated ${new Date(col.lastUpdated).toLocaleDateString()}`] })] }) }, col.id))) })), _jsxs("div", { className: "border-t border-border pt-4 space-y-2", children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: "Ingest Page" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("select", { value: selectedPageId, onChange: (e) => setSelectedPageId(e.target.value), className: "flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: [_jsx("option", { value: "", children: "Select a page..." }), pages.map((p) => (_jsx("option", { value: p.id, children: p.title }, p.id)))] }), _jsxs("button", { onClick: handleIngest, disabled: !selectedPageId || ingesting, className: "flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50", children: [ingesting ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(Send, { className: "h-4 w-4" })), "Ingest"] })] })] })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Settings, { className: "h-5 w-5 text-muted-foreground" }), _jsx("p", { className: "text-sm font-medium", children: "Widget Configuration" })] }), _jsxs("button", { onClick: handleSaveConfig, disabled: saving, className: "flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50", children: [saving ? (_jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" })) : (_jsx(Save, { className: "h-3.5 w-3.5" })), "Save"] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Position" }), _jsxs("select", { value: config.position, onChange: (e) => setConfig({
                                                                ...config,
                                                                position: e.target.value,
                                                            }), className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: [_jsx("option", { value: "bottom-right", children: "Bottom Right" }), _jsx("option", { value: "bottom-left", children: "Bottom Left" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Primary Color" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "color", value: config.primaryColor, onChange: (e) => setConfig({ ...config, primaryColor: e.target.value }), className: "h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-1" }), _jsx("input", { type: "text", value: config.primaryColor, onChange: (e) => setConfig({ ...config, primaryColor: e.target.value }), className: "flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Greeting Message" }), _jsx("input", { type: "text", value: config.greeting, onChange: (e) => setConfig({ ...config, greeting: e.target.value }), className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Placeholder Text" }), _jsx("input", { type: "text", value: config.placeholder, onChange: (e) => setConfig({ ...config, placeholder: e.target.value }), className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] })] })] }) })] }), _jsx("div", { className: "space-y-6", children: _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(MessageCircle, { className: "h-5 w-5 text-muted-foreground" }), _jsx("p", { className: "text-sm font-medium", children: "Widget Preview" })] }), _jsxs("div", { className: "relative rounded-lg border border-border bg-muted/30 h-[480px] overflow-hidden", children: [_jsxs("div", { className: "p-6 space-y-3", children: [_jsx("div", { className: "h-4 w-3/4 rounded bg-muted" }), _jsx("div", { className: "h-3 w-full rounded bg-muted" }), _jsx("div", { className: "h-3 w-5/6 rounded bg-muted" }), _jsx("div", { className: "h-3 w-2/3 rounded bg-muted" }), _jsx("div", { className: "h-20 w-full rounded bg-muted mt-4" }), _jsx("div", { className: "h-3 w-full rounded bg-muted" }), _jsx("div", { className: "h-3 w-4/5 rounded bg-muted" })] }), _jsxs("div", { className: cn('absolute bottom-4', config.position === 'bottom-right' ? 'right-4' : 'left-4'), children: [_jsxs("div", { className: "mb-3 w-72 rounded-lg border border-border bg-background shadow-lg overflow-hidden", children: [_jsx("div", { className: "px-4 py-3 text-sm font-medium text-white", style: { backgroundColor: config.primaryColor }, children: "Charlotte AI" }), _jsx("div", { className: "p-3 space-y-2 h-40", children: _jsx("div", { className: "flex gap-2", children: _jsx("div", { className: "rounded-lg px-3 py-2 text-xs text-white max-w-[200px]", style: { backgroundColor: config.primaryColor }, children: config.greeting }) }) }), _jsxs("div", { className: "border-t border-border p-2 flex gap-2", children: [_jsx("div", { className: "flex-1 rounded-md border border-input bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground", children: config.placeholder }), _jsx("div", { className: "flex h-7 w-7 items-center justify-center rounded-md text-white", style: { backgroundColor: config.primaryColor }, children: _jsx(Send, { className: "h-3 w-3" }) })] })] }), _jsx("div", { className: cn('flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg', config.position === 'bottom-right' ? 'ml-auto' : ''), style: { backgroundColor: config.primaryColor }, children: _jsx(MessageCircle, { className: "h-6 w-6" }) })] })] })] }) }) })] })] }));
}
//# sourceMappingURL=CharlottePage.js.map
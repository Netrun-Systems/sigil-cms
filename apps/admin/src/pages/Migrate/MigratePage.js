import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, ShoppingBag, Globe, Loader2, ChevronDown, ChevronUp, FileUp, ExternalLink } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
const sourceConfig = [
    {
        key: 'wordpress',
        label: 'WordPress',
        icon: Upload,
        description: 'WXR XML export or REST API',
        buttonLabel: 'Import from WordPress',
    },
    {
        key: 'shopify',
        label: 'Shopify',
        icon: ShoppingBag,
        description: 'Admin API + Storefront API',
        buttonLabel: 'Import from Shopify',
    },
    {
        key: 'square',
        label: 'Square',
        icon: Globe,
        description: 'Catalog API + site scraping',
        buttonLabel: 'Import from Square',
    },
];
const inputClass = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
function statusColor(status) {
    switch (status) {
        case 'completed': return 'border-green-500/50 bg-green-500/10 text-green-500';
        case 'running': return 'border-blue-500/50 bg-blue-500/10 text-blue-500';
        case 'failed': return 'border-red-500/50 bg-red-500/10 text-red-500';
        default: return 'border-gray-500/50 bg-gray-500/10 text-gray-400';
    }
}
function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
export function MigratePage() {
    const { siteId } = useParams();
    const [migrations, setMigrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSource, setActiveSource] = useState(null);
    const [importing, setImporting] = useState(false);
    const [wpForm, setWpForm] = useState({ mode: 'file', file: null, apiUrl: '' });
    const [shopifyForm, setShopifyForm] = useState({ domain: '', adminToken: '', storefrontToken: '' });
    const [squareForm, setSquareForm] = useState({ siteUrl: '', accessToken: '' });
    const basePath = `/sites/${siteId}/migrate`;
    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get(basePath);
            setMigrations(res.data ?? []);
        }
        catch { /* empty state */ }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [siteId]);
    const toggleSource = (source) => {
        setActiveSource((prev) => (prev === source ? null : source));
    };
    const handleImport = async () => {
        if (!activeSource)
            return;
        setImporting(true);
        try {
            if (activeSource === 'wordpress') {
                if (wpForm.mode === 'file' && wpForm.file) {
                    const formData = new FormData();
                    formData.append('file', wpForm.file);
                    await api.post(`${basePath}/wordpress`, formData);
                }
                else if (wpForm.mode === 'api' && wpForm.apiUrl) {
                    await api.post(`${basePath}/wordpress`, { api_url: wpForm.apiUrl });
                }
            }
            else if (activeSource === 'shopify') {
                await api.post(`${basePath}/shopify`, {
                    domain: shopifyForm.domain,
                    admin_token: shopifyForm.adminToken,
                    storefront_token: shopifyForm.storefrontToken || undefined,
                });
            }
            else if (activeSource === 'square') {
                await api.post(`${basePath}/square`, {
                    site_url: squareForm.siteUrl,
                    access_token: squareForm.accessToken || undefined,
                });
            }
            setActiveSource(null);
            await load();
        }
        catch { /* keep state */ }
        finally {
            setImporting(false);
        }
    };
    const canSubmit = () => {
        if (!activeSource)
            return false;
        if (activeSource === 'wordpress') {
            return wpForm.mode === 'file' ? !!wpForm.file : !!wpForm.apiUrl.trim();
        }
        if (activeSource === 'shopify')
            return !!shopifyForm.domain.trim() && !!shopifyForm.adminToken.trim();
        if (activeSource === 'square')
            return !!squareForm.siteUrl.trim();
        return false;
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Import Site" }), _jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Migrate content from WordPress, Shopify, or Square Online" })] }), _jsx("div", { className: "grid gap-4 sm:grid-cols-3", children: sourceConfig.map((src) => {
                    const Icon = src.icon;
                    const isActive = activeSource === src.key;
                    return (_jsx(Card, { className: cn('cursor-pointer transition-colors', isActive && 'ring-2 ring-primary'), onClick: () => toggleSource(src.key), children: _jsxs(CardContent, { className: "flex flex-col items-center gap-3 pt-6 text-center", children: [_jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary", children: _jsx(Icon, { className: "h-6 w-6" }) }), _jsx("h3", { className: "font-medium", children: src.label }), _jsx("p", { className: "text-sm text-muted-foreground", children: src.description }), _jsxs("button", { className: cn('mt-2 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors', isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-foreground hover:bg-accent'), children: [src.buttonLabel, isActive ? _jsx(ChevronUp, { className: "h-4 w-4" }) : _jsx(ChevronDown, { className: "h-4 w-4" })] })] }) }, src.key));
                }) }), activeSource === 'wordpress' && (_jsx(Card, { children: _jsxs(CardContent, { className: "pt-6 space-y-4", children: [_jsx("h3", { className: "font-medium", children: "WordPress Import" }), _jsxs("div", { className: "flex gap-4", children: [_jsx("button", { onClick: () => setWpForm((f) => ({ ...f, mode: 'file' })), className: cn('rounded-md px-3 py-1.5 text-sm transition-colors', wpForm.mode === 'file' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'), children: "File Upload" }), _jsx("button", { onClick: () => setWpForm((f) => ({ ...f, mode: 'api' })), className: cn('rounded-md px-3 py-1.5 text-sm transition-colors', wpForm.mode === 'api' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'), children: "REST API" })] }), wpForm.mode === 'file' ? (_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "WXR Export File (.xml)" }), _jsx("input", { type: "file", accept: ".xml", onChange: (e) => setWpForm((f) => ({ ...f, file: e.target.files?.[0] ?? null })), className: "mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90" })] })) : (_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "REST API Base URL" }), _jsx("input", { value: wpForm.apiUrl, onChange: (e) => setWpForm((f) => ({ ...f, apiUrl: e.target.value })), placeholder: "https://example.com/wp-json/wp/v2", className: cn(inputClass, 'mt-1') })] })), _jsxs("button", { onClick: handleImport, disabled: importing || !canSubmit(), className: "flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50", children: [importing && _jsx(Loader2, { className: "h-4 w-4 animate-spin" }), "Start Import"] })] }) })), activeSource === 'shopify' && (_jsx(Card, { children: _jsxs(CardContent, { className: "pt-6 space-y-4", children: [_jsx("h3", { className: "font-medium", children: "Shopify Import" }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Store Domain" }), _jsx("input", { value: shopifyForm.domain, onChange: (e) => setShopifyForm((f) => ({ ...f, domain: e.target.value })), placeholder: "my-store.myshopify.com", className: cn(inputClass, 'mt-1') })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Admin API Token" }), _jsx("input", { type: "password", value: shopifyForm.adminToken, onChange: (e) => setShopifyForm((f) => ({ ...f, adminToken: e.target.value })), placeholder: "shpat_...", className: cn(inputClass, 'mt-1') })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Storefront Token (optional)" }), _jsx("input", { value: shopifyForm.storefrontToken, onChange: (e) => setShopifyForm((f) => ({ ...f, storefrontToken: e.target.value })), placeholder: "Optional", className: cn(inputClass, 'mt-1') })] }), _jsxs("button", { onClick: handleImport, disabled: importing || !canSubmit(), className: "flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50", children: [importing && _jsx(Loader2, { className: "h-4 w-4 animate-spin" }), "Start Import"] })] }) })), activeSource === 'square' && (_jsx(Card, { children: _jsxs(CardContent, { className: "pt-6 space-y-4", children: [_jsx("h3", { className: "font-medium", children: "Square Import" }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Site URL" }), _jsx("input", { value: squareForm.siteUrl, onChange: (e) => setSquareForm((f) => ({ ...f, siteUrl: e.target.value })), placeholder: "https://my-store.square.site", className: cn(inputClass, 'mt-1') })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Access Token (optional)" }), _jsx("input", { type: "password", value: squareForm.accessToken, onChange: (e) => setSquareForm((f) => ({ ...f, accessToken: e.target.value })), placeholder: "Optional \u2014 for Catalog API access", className: cn(inputClass, 'mt-1') })] }), _jsxs("button", { onClick: handleImport, disabled: importing || !canSubmit(), className: "flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50", children: [importing && _jsx(Loader2, { className: "h-4 w-4 animate-spin" }), "Start Import"] })] }) })), _jsxs("div", { children: [_jsx("h2", { className: "mb-3 text-lg font-semibold", children: "Recent Migrations" }), loading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : migrations.length === 0 ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(FileUp, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: "No migrations yet" })] })) : (_jsx(Card, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border", children: [_jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Source" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Imported" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Failed" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Date" }), _jsx("th", { className: "px-6 py-3 w-[100px]" })] }) }), _jsx("tbody", { children: migrations.map((m) => (_jsxs("tr", { className: "group border-b border-border last:border-0 hover:bg-accent/50", children: [_jsx("td", { className: "px-6 py-4 text-sm font-medium capitalize", children: m.source }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: cn('rounded-md border px-2 py-0.5 text-xs font-medium capitalize', statusColor(m.status)), children: m.status }) }), _jsx("td", { className: "px-6 py-4 text-sm", children: m.items_imported }), _jsx("td", { className: "px-6 py-4 text-sm", children: m.items_failed > 0 ? (_jsx("span", { className: "text-red-500", children: m.items_failed })) : ('0') }), _jsx("td", { className: "px-6 py-4 text-sm text-muted-foreground", children: formatDate(m.created_at) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("button", { className: "flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground", children: [_jsx(ExternalLink, { className: "h-3 w-3" }), " Details"] }) })] }, m.id))) })] }) }) }))] })] }));
}
//# sourceMappingURL=MigratePage.js.map
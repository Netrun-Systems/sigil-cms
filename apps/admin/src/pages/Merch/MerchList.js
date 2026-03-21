import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Shirt, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
export function MerchList() {
    const { siteId } = useParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState({ lastSyncedAt: null });
    const [expanded, setExpanded] = useState(null);
    const [editingPrice, setEditingPrice] = useState(null);
    const priceInputRef = useRef(null);
    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/sites/${siteId}/merch/products`);
            setProducts(res.data ?? []);
            if (res.syncStatus)
                setSyncStatus(res.syncStatus);
        }
        catch {
            // empty state on error
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [siteId]);
    const handleSync = async () => {
        setSyncing(true);
        try {
            await api.post(`/sites/${siteId}/merch/sync`, {});
            await load();
        }
        catch {
            // keep existing state
        }
        finally {
            setSyncing(false);
        }
    };
    const handleToggleActive = async (id, active) => {
        try {
            await api.put(`/sites/${siteId}/merch/products/${id}`, { active: !active });
            setProducts((prev) => prev.map((p) => p.id === id ? { ...p, active: !active } : p));
        }
        catch { /* */ }
    };
    const handlePriceSave = async (id, value) => {
        const price = parseFloat(value);
        if (isNaN(price) || price < 0) {
            setEditingPrice(null);
            return;
        }
        try {
            await api.put(`/sites/${siteId}/merch/products/${id}`, { retailPrice: price });
            setProducts((prev) => prev.map((p) => p.id === id ? { ...p, retailPrice: price } : p));
        }
        catch { /* */ }
        setEditingPrice(null);
    };
    const formatPrice = (n) => `$${n.toFixed(2)}`;
    const margin = (retail, base) => {
        if (retail <= 0)
            return '0%';
        return `${(((retail - base) / retail) * 100).toFixed(0)}%`;
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Merchandise" }), _jsxs("button", { onClick: handleSync, disabled: syncing, className: "flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50", children: [_jsx(RefreshCw, { className: cn('h-4 w-4', syncing && 'animate-spin') }), syncing ? 'Syncing...' : 'Sync from Printful'] })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: syncStatus.lastSyncedAt
                    ? `Last synced: ${new Date(syncStatus.lastSyncedAt).toLocaleString()}`
                    : 'Never synced' }), loading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : syncing ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(RefreshCw, { className: "h-8 w-8 animate-spin" }), _jsx("p", { className: "text-sm", children: "Syncing products from Printful..." })] })) : products.length === 0 ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(Shirt, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: "No products \u2014 click Sync to import from Printful" })] })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: products.map((product) => (_jsx(Card, { className: cn(!product.active && 'opacity-60'), children: _jsxs(CardContent, { className: "p-4 space-y-3", children: [product.thumbnailUrl ? (_jsx("img", { src: product.thumbnailUrl, alt: product.name, className: "w-full aspect-square rounded-md object-cover bg-muted" })) : (_jsx("div", { className: "w-full aspect-square rounded-md bg-muted flex items-center justify-center", children: _jsx(Shirt, { className: "h-12 w-12 text-muted-foreground/40" }) })), _jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsx("h3", { className: "font-medium text-sm leading-tight", children: product.name }), _jsx("button", { onClick: () => handleToggleActive(product.id, product.active), className: cn('relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors', product.active ? 'bg-green-500' : 'bg-muted-foreground/30'), children: _jsx("span", { className: cn('pointer-events-none inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform', product.active ? 'translate-x-4' : 'translate-x-0.5') }) })] }), _jsxs("div", { className: "grid grid-cols-3 gap-2 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Retail" }), editingPrice === product.id ? (_jsx("input", { ref: priceInputRef, type: "number", step: "0.01", min: "0", defaultValue: product.retailPrice.toFixed(2), onBlur: (e) => handlePriceSave(product.id, e.target.value), onKeyDown: (e) => {
                                                    if (e.key === 'Enter')
                                                        e.target.blur();
                                                    if (e.key === 'Escape')
                                                        setEditingPrice(null);
                                                }, autoFocus: true, className: "w-full rounded border border-input bg-background px-1.5 py-0.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })) : (_jsx("button", { onClick: () => setEditingPrice(product.id), className: "font-medium text-primary hover:underline cursor-pointer", title: "Click to edit", children: formatPrice(product.retailPrice) }))] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Base Cost" }), _jsx("p", { className: "font-medium", children: formatPrice(product.baseCost) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Margin" }), _jsx("p", { className: cn('font-medium', product.retailPrice - product.baseCost > 0 ? 'text-green-500' : 'text-red-500'), children: margin(product.retailPrice, product.baseCost) })] })] }), _jsxs("button", { onClick: () => setExpanded(expanded === product.id ? null : product.id), className: "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors", children: [_jsxs("span", { children: [product.variants.length, " variant", product.variants.length !== 1 ? 's' : ''] }), expanded === product.id
                                        ? _jsx(ChevronUp, { className: "h-3.5 w-3.5" })
                                        : _jsx(ChevronDown, { className: "h-3.5 w-3.5" })] }), expanded === product.id && (_jsx("div", { className: "border-t border-border pt-2 space-y-1.5", children: product.variants.map((v) => (_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsxs("span", { className: "text-muted-foreground", children: [v.size, v.color ? ` / ${v.color}` : ''] }), _jsx("span", { className: cn('rounded-md px-1.5 py-0.5 border text-xs', v.inStock
                                                ? 'border-green-500/50 bg-green-500/10 text-green-500'
                                                : 'border-red-500/50 bg-red-500/10 text-red-500'), children: v.inStock ? 'In Stock' : 'Out of Stock' })] }, v.id))) }))] }) }, product.id))) }))] }));
}
//# sourceMappingURL=MerchList.js.map
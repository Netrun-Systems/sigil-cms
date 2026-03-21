import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Receipt, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
const STATUS_OPTIONS = ['pending', 'completed', 'failed', 'refunded'];
const statusColors = {
    pending: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
    completed: 'border-green-500/50 bg-green-500/10 text-green-400',
    failed: 'border-red-500/50 bg-red-500/10 text-red-400',
    refunded: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
};
function formatPrice(cents, currency = 'usd') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(cents / 100);
}
export function OrdersList() {
    const { siteId } = useParams();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [expanded, setExpanded] = useState(null);
    const basePath = `/sites/${siteId}`;
    const load = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter)
                params.set('status', statusFilter);
            const qs = params.toString() ? `?${params}` : '';
            const res = await api.get(`${basePath}/store/orders${qs}`);
            setOrders(res.data ?? []);
        }
        catch {
            // empty state on error
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [siteId, statusFilter]);
    const counts = orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
    }, {});
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Orders" }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3", children: STATUS_OPTIONS.map((s) => (_jsxs("button", { onClick: () => setStatusFilter(statusFilter === s ? '' : s), className: cn('rounded-lg border p-3 text-center transition-colors', statusFilter === s ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'), children: [_jsx("p", { className: "text-2xl font-bold", children: counts[s] || 0 }), _jsx("p", { className: "text-xs text-muted-foreground capitalize", children: s })] }, s))) }), loading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : orders.length === 0 ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(Receipt, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: "No orders yet" })] })) : (_jsx(Card, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border", children: [_jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Date" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Customer" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Total" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Session" }), _jsx("th", { className: "px-6 py-3 w-[50px]" })] }) }), _jsx("tbody", { children: orders.map((order) => (_jsxs(_Fragment, { children: [_jsxs("tr", { className: "group border-b border-border last:border-0 hover:bg-accent/50", children: [_jsx("td", { className: "px-6 py-4 text-sm text-muted-foreground", children: new Date(order.created_at).toLocaleDateString() }), _jsx("td", { className: "px-6 py-4 text-sm font-medium", children: order.customerEmail }), _jsx("td", { className: "px-6 py-4 text-sm font-medium", children: formatPrice(order.totalInCents, order.currency) }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: cn('rounded-md px-2 py-0.5 text-xs capitalize border', statusColors[order.status] || ''), children: order.status }) }), _jsx("td", { className: "px-6 py-4 text-xs text-muted-foreground font-mono", children: order.stripeSessionId
                                                        ? `${order.stripeSessionId.slice(0, 20)}...`
                                                        : '-' }), _jsx("td", { className: "px-6 py-4", children: order.lineItems && order.lineItems.length > 0 && (_jsx("button", { onClick: () => setExpanded(expanded === order.id ? null : order.id), className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground", children: expanded === order.id
                                                            ? _jsx(ChevronUp, { className: "h-4 w-4" })
                                                            : _jsx(ChevronDown, { className: "h-4 w-4" }) })) })] }, order.id), expanded === order.id && order.lineItems && order.lineItems.length > 0 && (_jsx("tr", { className: "border-b border-border last:border-0", children: _jsx("td", { colSpan: 6, className: "px-6 py-4 bg-muted/30", children: _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground mb-2", children: "Line Items" }), order.lineItems.map((item, idx) => (_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "font-medium", children: item.productName }), _jsxs("span", { className: "text-muted-foreground", children: ["x", item.quantity] })] }), _jsxs("div", { className: "flex items-center gap-4 text-muted-foreground", children: [_jsxs("span", { children: [formatPrice(item.unitPriceInCents, order.currency), " each"] }), _jsx("span", { className: "font-medium text-foreground", children: formatPrice(item.totalInCents, order.currency) })] })] }, item.id || idx)))] }) }) }, `${order.id}-details`))] }))) })] }) }) }))] }));
}
//# sourceMappingURL=OrdersList.js.map
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * POSSessions — Session history and summaries
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
export function POSSessions() {
    const { siteId } = useParams();
    const basePath = `/sites/${siteId}`;
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSession, setExpandedSession] = useState(null);
    const [sessionSummary, setSessionSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    useEffect(() => {
        setLoading(true);
        api.get(`${basePath}/pos/transactions?limit=200`)
            .then((res) => setTransactions(res.data ?? []))
            .catch(() => setTransactions([]))
            .finally(() => setLoading(false));
    }, [basePath]);
    // Group transactions by session
    const sessionGroups = transactions.reduce((acc, tx) => {
        // Derive a session key from date + cashier (approximate grouping for display)
        const date = new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const key = `${date}-${tx.cashier_name}`;
        if (!acc[key]) {
            acc[key] = { cashier: tx.cashier_name, date, transactions: [] };
        }
        acc[key].transactions.push(tx);
        return acc;
    }, {});
    const toggleSession = (key) => {
        setExpandedSession(expandedSession === key ? null : key);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Session History" }), loading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : Object.keys(sessionGroups).length === 0 ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(Clock, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: "No transactions yet" })] })) : (_jsx("div", { className: "space-y-3", children: Object.entries(sessionGroups).map(([key, group]) => {
                    const isExpanded = expandedSession === key;
                    const totalSales = group.transactions
                        .filter((t) => t.type === 'sale')
                        .reduce((s, t) => s + Number(t.total), 0);
                    const txCount = group.transactions.length;
                    return (_jsxs(Card, { children: [_jsxs("button", { onClick: () => toggleSession(key), className: "flex w-full items-center justify-between px-6 py-4 text-left hover:bg-accent/50", children: [_jsxs("div", { className: "flex items-center gap-3", children: [isExpanded ? (_jsx(ChevronDown, { className: "h-4 w-4 text-muted-foreground" })) : (_jsx(ChevronRight, { className: "h-4 w-4 text-muted-foreground" })), _jsxs("div", { children: [_jsx("span", { className: "text-sm font-medium", children: group.date }), _jsx("span", { className: "mx-2 text-muted-foreground", children: "|" }), _jsx("span", { className: "text-sm text-muted-foreground", children: group.cashier })] })] }), _jsxs("div", { className: "flex items-center gap-4 text-sm", children: [_jsxs("span", { className: "text-muted-foreground", children: [txCount, " transactions"] }), _jsxs("span", { className: "font-medium", children: ["$", totalSales.toFixed(2)] })] })] }), isExpanded && (_jsx("div", { className: "border-t border-border", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border bg-muted/30", children: [_jsx("th", { className: "px-6 py-2 text-left text-xs font-medium text-muted-foreground", children: "Receipt" }), _jsx("th", { className: "px-6 py-2 text-left text-xs font-medium text-muted-foreground", children: "Type" }), _jsx("th", { className: "px-6 py-2 text-left text-xs font-medium text-muted-foreground", children: "Payment" }), _jsx("th", { className: "px-6 py-2 text-right text-xs font-medium text-muted-foreground", children: "Total" }), _jsx("th", { className: "px-6 py-2 text-right text-xs font-medium text-muted-foreground", children: "Time" })] }) }), _jsx("tbody", { children: group.transactions.map((tx) => (_jsxs("tr", { className: "border-b border-border last:border-0 hover:bg-accent/30", children: [_jsx("td", { className: "px-6 py-2 font-mono text-xs", children: tx.receipt_number }), _jsx("td", { className: "px-6 py-2", children: _jsx("span", { className: cn('rounded px-1.5 py-0.5 text-xs font-medium', tx.type === 'sale' && 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400', tx.type === 'refund' && 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400', tx.type === 'void' && 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'), children: tx.type }) }), _jsx("td", { className: "px-6 py-2 text-sm text-muted-foreground capitalize", children: tx.payment_method }), _jsxs("td", { className: cn('px-6 py-2 text-right text-sm font-medium', tx.type === 'refund' && 'text-red-600'), children: [tx.type === 'refund' ? '-' : '', "$", Number(tx.total).toFixed(2)] }), _jsx("td", { className: "px-6 py-2 text-right text-xs text-muted-foreground", children: new Date(tx.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) })] }, tx.id))) })] }) }))] }, key));
                }) }))] }));
}
export default POSSessions;
//# sourceMappingURL=POSSessions.js.map
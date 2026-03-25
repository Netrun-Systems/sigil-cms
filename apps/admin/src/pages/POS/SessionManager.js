import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SessionManager — Open/close register sessions with cash reconciliation
 */
import { useState, useEffect } from 'react';
import { Loader2, LogIn, LogOut, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@netrun-cms/ui';
import { api } from '../../lib/api';
export function SessionManager({ basePath, session, onSessionOpened, onSessionClosed, onCancel }) {
    const [cashierName, setCashierName] = useState('');
    const [openingCash, setOpeningCash] = useState('');
    const [closingCash, setClosingCash] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    // Load session summary if session is open
    useEffect(() => {
        if (session) {
            setSummaryLoading(true);
            api.get(`${basePath}/pos/sessions/${session.id}/summary`)
                .then((res) => setSummary(res.data))
                .catch(() => setSummary(null))
                .finally(() => setSummaryLoading(false));
        }
    }, [basePath, session]);
    const handleOpen = async () => {
        if (!cashierName.trim())
            return;
        setLoading(true);
        try {
            const res = await api.post(`${basePath}/pos/sessions/open`, {
                cashierName: cashierName.trim(),
                openingCash: Number(openingCash) || 0,
            });
            if (res.data)
                onSessionOpened(res.data);
        }
        catch {
            // error shown via API
        }
        finally {
            setLoading(false);
        }
    };
    const handleClose = async () => {
        setLoading(true);
        try {
            await api.post(`${basePath}/pos/sessions/close`, {
                closingCash: Number(closingCash) || null,
                notes: notes.trim() || null,
            });
            onSessionClosed();
        }
        catch {
            // error
        }
        finally {
            setLoading(false);
        }
    };
    // Open session form
    if (!session) {
        return (_jsx("div", { className: "flex h-[80vh] items-center justify-center", children: _jsx(Card, { className: "w-full max-w-md", children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "mb-6 flex items-center gap-3", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary", children: _jsx(LogIn, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold", children: "Open Register" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Start a new shift" })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium", children: "Cashier Name" }), _jsx("input", { value: cashierName, onChange: (e) => setCashierName(e.target.value), placeholder: "e.g. Allie", autoFocus: true, className: "flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", onKeyDown: (e) => { if (e.key === 'Enter')
                                                handleOpen(); } })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium", children: "Opening Cash" }), _jsx("input", { type: "number", step: "0.01", min: "0", value: openingCash, onChange: (e) => setOpeningCash(e.target.value), placeholder: "0.00", className: "flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("button", { onClick: handleOpen, disabled: !cashierName.trim() || loading, className: "flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50", children: [loading ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : _jsx(LogIn, { className: "h-4 w-4" }), "Open Register"] })] })] }) }) }));
    }
    // Close session form with summary
    return (_jsx("div", { className: "flex h-[80vh] items-center justify-center", children: _jsx(Card, { className: "w-full max-w-lg", children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "mb-6 flex items-center gap-3", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400", children: _jsx(LogOut, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold", children: "Close Register" }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["End shift for ", session.cashier_name] })] })] }), summaryLoading ? (_jsx("div", { className: "mb-6 flex h-24 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : summary && (_jsxs("div", { className: "mb-6 rounded-lg bg-muted/50 p-4", children: [_jsxs("h3", { className: "mb-3 flex items-center gap-2 text-sm font-medium", children: [_jsx(Clock, { className: "h-4 w-4" }), " Session Summary"] }), _jsxs("div", { className: "grid grid-cols-2 gap-y-2 text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Transactions" }), _jsx("span", { className: "text-right font-medium", children: summary.transaction_count }), _jsx("span", { className: "text-muted-foreground", children: "Total Sales" }), _jsxs("span", { className: "text-right font-medium", children: ["$", Number(summary.total_sales || 0).toFixed(2)] }), _jsx("span", { className: "text-muted-foreground", children: "Card Payments" }), _jsxs("span", { className: "text-right", children: ["$", Number(summary.total_card || 0).toFixed(2)] }), _jsx("span", { className: "text-muted-foreground", children: "Cash Payments" }), _jsxs("span", { className: "text-right", children: ["$", Number(summary.total_cash || 0).toFixed(2)] }), _jsx("span", { className: "text-muted-foreground", children: "Tax Collected" }), _jsxs("span", { className: "text-right", children: ["$", Number(summary.total_tax || 0).toFixed(2)] }), _jsx("span", { className: "text-muted-foreground", children: "Refunds" }), _jsxs("span", { className: "text-right text-red-600", children: ["$", Number(summary.total_refunds || 0).toFixed(2)] }), _jsx("div", { className: "col-span-2 my-1 border-t border-border" }), _jsx("span", { className: "text-muted-foreground", children: "Opening Cash" }), _jsxs("span", { className: "text-right", children: ["$", Number(summary.opening_cash || 0).toFixed(2)] }), _jsx("span", { className: "font-medium", children: "Expected Cash" }), _jsxs("span", { className: "text-right font-medium", children: ["$", Number(summary.expected_cash || 0).toFixed(2)] })] })] })), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium", children: "Closing Cash Count" }), _jsxs("div", { className: "relative", children: [_jsx(DollarSign, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), _jsx("input", { type: "number", step: "0.01", min: "0", value: closingCash, onChange: (e) => setClosingCash(e.target.value), placeholder: "0.00", autoFocus: true, className: "flex h-11 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] })] }), closingCash && summary && ((() => {
                                const variance = Number(closingCash) - Number(summary.expected_cash);
                                if (Math.abs(variance) >= 0.01) {
                                    return (_jsxs("div", { className: `flex items-center gap-2 rounded-md p-3 text-sm ${Math.abs(variance) > 5
                                            ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                                            : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'}`, children: [_jsx(AlertTriangle, { className: "h-4 w-4 flex-shrink-0" }), "Variance: ", variance > 0 ? '+' : '', variance.toFixed(2), Math.abs(variance) > 5 ? ' — significant' : ' — minor'] }));
                                }
                                return null;
                            })()), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium", children: "Notes (optional)" }), _jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), placeholder: "Any notes about this shift...", rows: 2, className: "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: onCancel, className: "flex-1 h-11 rounded-lg border border-border text-sm font-medium hover:bg-accent", children: "Back to Register" }), _jsxs("button", { onClick: handleClose, disabled: loading, className: "flex flex-1 h-11 items-center justify-center gap-2 rounded-lg bg-orange-600 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50", children: [loading ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : _jsx(LogOut, { className: "h-4 w-4" }), "Close Register"] })] })] })] }) }) }));
}
//# sourceMappingURL=SessionManager.js.map
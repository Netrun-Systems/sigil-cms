import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * CashTenderModal — Cash payment entry with quick-select denominations
 */
import { useState } from 'react';
import { X, Banknote } from 'lucide-react';
const QUICK_AMOUNTS = [1, 5, 10, 20, 50, 100];
export function CashTenderModal({ total, onConfirm, onClose }) {
    const [amount, setAmount] = useState('');
    const cashAmount = Number(amount) || 0;
    const changeDue = Math.max(0, Math.round((cashAmount - total) * 100) / 100);
    const isValid = cashAmount >= total;
    const handleQuickAmount = (value) => {
        setAmount(value.toFixed(2));
    };
    const handleExact = () => {
        setAmount(total.toFixed(2));
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", onClick: onClose, children: _jsxs("div", { className: "w-full max-w-md rounded-xl bg-card p-6 shadow-xl", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Banknote, { className: "h-5 w-5 text-green-600" }), _jsx("h2", { className: "text-lg font-semibold", children: "Cash Payment" })] }), _jsx("button", { onClick: onClose, className: "rounded-md p-1 hover:bg-accent", children: _jsx(X, { className: "h-5 w-5" }) })] }), _jsxs("div", { className: "mb-6 rounded-lg bg-muted p-4 text-center", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Total Due" }), _jsxs("p", { className: "text-3xl font-bold", children: ["$", total.toFixed(2)] })] }), _jsx("div", { className: "mb-4 grid grid-cols-3 gap-2", children: QUICK_AMOUNTS.map((value) => (_jsxs("button", { onClick: () => handleQuickAmount(value), className: "flex h-12 items-center justify-center rounded-lg border border-border text-sm font-medium hover:bg-accent hover:border-primary active:scale-[0.98]", children: ["$", value] }, value))) }), _jsxs("button", { onClick: handleExact, className: "mb-4 flex h-12 w-full items-center justify-center rounded-lg border border-border text-sm font-medium hover:bg-accent hover:border-primary", children: ["Exact ($", total.toFixed(2), ")"] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "mb-1 block text-sm text-muted-foreground", children: "Cash tendered" }), _jsx("input", { type: "number", step: "0.01", min: "0", value: amount, onChange: (e) => setAmount(e.target.value), placeholder: "0.00", autoFocus: true, className: "flex h-12 w-full rounded-md border border-input bg-background px-4 text-lg font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", onKeyDown: (e) => {
                                if (e.key === 'Enter' && isValid)
                                    onConfirm(cashAmount);
                            } })] }), cashAmount > 0 && (_jsxs("div", { className: `mb-4 rounded-lg p-4 text-center ${isValid ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`, children: [_jsx("p", { className: "text-sm text-muted-foreground", children: isValid ? 'Change Due' : 'Insufficient' }), _jsxs("p", { className: `text-2xl font-bold ${isValid ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`, children: ["$", changeDue.toFixed(2)] })] })), _jsx("button", { onClick: () => onConfirm(cashAmount), disabled: !isValid, className: "flex h-14 w-full items-center justify-center rounded-lg bg-green-600 text-lg font-semibold text-white hover:bg-green-700 disabled:opacity-50", children: "Confirm Payment" })] }) }));
}
//# sourceMappingURL=CashTenderModal.js.map
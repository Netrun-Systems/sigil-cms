/**
 * CashTenderModal — Cash payment entry with quick-select denominations
 */

import { useState } from 'react';
import { X, Banknote } from 'lucide-react';

interface CashTenderModalProps {
  total: number;
  onConfirm: (cashAmount: number) => void;
  onClose: () => void;
}

const QUICK_AMOUNTS = [1, 5, 10, 20, 50, 100];

export function CashTenderModal({ total, onConfirm, onClose }: CashTenderModalProps) {
  const [amount, setAmount] = useState('');

  const cashAmount = Number(amount) || 0;
  const changeDue = Math.max(0, Math.round((cashAmount - total) * 100) / 100);
  const isValid = cashAmount >= total;

  const handleQuickAmount = (value: number) => {
    setAmount(value.toFixed(2));
  };

  const handleExact = () => {
    setAmount(total.toFixed(2));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold">Cash Payment</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Total due */}
        <div className="mb-6 rounded-lg bg-muted p-4 text-center">
          <p className="text-sm text-muted-foreground">Total Due</p>
          <p className="text-3xl font-bold">${total.toFixed(2)}</p>
        </div>

        {/* Quick amounts */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              onClick={() => handleQuickAmount(value)}
              className="flex h-12 items-center justify-center rounded-lg border border-border text-sm font-medium hover:bg-accent hover:border-primary active:scale-[0.98]"
            >
              ${value}
            </button>
          ))}
        </div>

        {/* Exact button */}
        <button
          onClick={handleExact}
          className="mb-4 flex h-12 w-full items-center justify-center rounded-lg border border-border text-sm font-medium hover:bg-accent hover:border-primary"
        >
          Exact (${total.toFixed(2)})
        </button>

        {/* Manual entry */}
        <div className="mb-4">
          <label className="mb-1 block text-sm text-muted-foreground">Cash tendered</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            autoFocus
            className="flex h-12 w-full rounded-md border border-input bg-background px-4 text-lg font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isValid) onConfirm(cashAmount);
            }}
          />
        </div>

        {/* Change due */}
        {cashAmount > 0 && (
          <div className={`mb-4 rounded-lg p-4 text-center ${isValid ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
            <p className="text-sm text-muted-foreground">
              {isValid ? 'Change Due' : 'Insufficient'}
            </p>
            <p className={`text-2xl font-bold ${isValid ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              ${changeDue.toFixed(2)}
            </p>
          </div>
        )}

        {/* Confirm */}
        <button
          onClick={() => onConfirm(cashAmount)}
          disabled={!isValid}
          className="flex h-14 w-full items-center justify-center rounded-lg bg-green-600 text-lg font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          Confirm Payment
        </button>
      </div>
    </div>
  );
}

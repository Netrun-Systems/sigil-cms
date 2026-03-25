/**
 * ReceiptModal — Display receipt after a transaction with print/email options
 */

import { useState } from 'react';
import { X, Printer, Mail, ShoppingCart } from 'lucide-react';

interface ReceiptModalProps {
  receipt: Record<string, unknown>;
  basePath: string;
  onClose: () => void;
}

export function ReceiptModal({ receipt, onClose }: ReceiptModalProps) {
  const [emailAddress, setEmailAddress] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const r = receipt as {
    storeName: string;
    storeAddress: string;
    storePhone: string;
    receiptNumber: string;
    date: string;
    cashier: string;
    items: Array<{
      name: string;
      artist?: string;
      qty: number;
      unitPrice: string;
      lineTotal: string;
    }>;
    subtotal: string;
    taxRate: string;
    taxAmount: string;
    discount?: string;
    total: string;
    paymentMethod: string;
    cashTendered?: string;
    changeDue?: string;
    footer: string;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmailReceipt = async () => {
    if (!emailAddress) return;
    setSendingEmail(true);
    // In production this would call the API to send the receipt email
    // For now we just show it was "sent"
    setTimeout(() => {
      setSendingEmail(false);
      setEmailAddress('');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="flex justify-end p-2">
          <button onClick={onClose} className="rounded-md p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Receipt content (printable) */}
        <div className="px-6 pb-4 print:p-0" id="pos-receipt">
          {/* Store header */}
          <div className="mb-4 text-center">
            <h2 className="text-lg font-bold">{r.storeName}</h2>
            <p className="text-xs text-muted-foreground">{r.storeAddress}</p>
            <p className="text-xs text-muted-foreground">{r.storePhone}</p>
          </div>

          <div className="mb-3 border-t border-dashed border-border" />

          {/* Receipt info */}
          <div className="mb-3 flex justify-between text-xs text-muted-foreground">
            <span>{r.receiptNumber}</span>
            <span>{r.date}</span>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">Cashier: {r.cashier}</p>

          <div className="mb-3 border-t border-dashed border-border" />

          {/* Line items */}
          <div className="mb-3 space-y-1.5">
            {r.items.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm">
                  <span className="flex-1">
                    {item.qty > 1 ? `${item.qty}x ` : ''}{item.name}
                  </span>
                  <span className="ml-2 font-medium">{item.lineTotal}</span>
                </div>
                {item.artist && (
                  <p className="text-xs text-muted-foreground ml-2">by {item.artist}</p>
                )}
                {item.qty > 1 && (
                  <p className="text-xs text-muted-foreground ml-2">@ {item.unitPrice} each</p>
                )}
              </div>
            ))}
          </div>

          <div className="mb-3 border-t border-dashed border-border" />

          {/* Totals */}
          <div className="mb-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{r.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({r.taxRate})</span>
              <span>{r.taxAmount}</span>
            </div>
            {r.discount && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{r.discount}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{r.total}</span>
            </div>
          </div>

          <div className="mb-3 border-t border-dashed border-border" />

          {/* Payment method */}
          <div className="mb-1 text-sm">
            <span className="text-muted-foreground">Paid by: </span>
            <span className="font-medium">{r.paymentMethod}</span>
          </div>
          {r.cashTendered && (
            <div className="text-sm">
              <span className="text-muted-foreground">Cash tendered: </span>
              <span>{r.cashTendered}</span>
            </div>
          )}
          {r.changeDue && (
            <div className="text-sm">
              <span className="text-muted-foreground">Change: </span>
              <span className="font-medium">{r.changeDue}</span>
            </div>
          )}

          <div className="my-4 border-t border-dashed border-border" />

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground italic">{r.footer}</p>
        </div>

        {/* Actions (hidden in print) */}
        <div className="flex flex-col gap-2 border-t border-border p-4 print:hidden">
          <button
            onClick={handlePrint}
            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium hover:bg-accent"
          >
            <Printer className="h-4 w-4" /> Print Receipt
          </button>

          {/* Email receipt */}
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="customer@email.com"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              className="flex-1 h-11 rounded-md border border-input bg-background px-3 text-sm"
            />
            <button
              onClick={handleEmailReceipt}
              disabled={!emailAddress || sendingEmail}
              className="flex h-11 items-center gap-2 rounded-md border border-border px-4 text-sm hover:bg-accent disabled:opacity-50"
            >
              <Mail className="h-4 w-4" />
              {sendingEmail ? 'Sending...' : 'Email'}
            </button>
          </div>

          <button
            onClick={onClose}
            className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <ShoppingCart className="h-4 w-4" /> New Sale
          </button>
        </div>
      </div>
    </div>
  );
}

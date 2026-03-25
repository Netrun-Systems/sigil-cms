/**
 * SessionManager — Open/close register sessions with cash reconciliation
 */

import { useState, useEffect } from 'react';
import { Loader2, LogIn, LogOut, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface Session {
  id: string;
  cashier_name: string;
  opened_at: string;
  status: string;
}

interface SessionSummary {
  id: string;
  cashier_name: string;
  opened_at: string;
  closed_at: string | null;
  opening_cash: string;
  closing_cash: string | null;
  status: string;
  transaction_count: number;
  total_sales: string;
  total_card: string;
  total_cash: string;
  total_tax: string;
  total_refunds: string;
  expected_cash: string;
  variance: string | null;
}

interface SessionManagerProps {
  basePath: string;
  session: Session | null;
  onSessionOpened: (session: Session) => void;
  onSessionClosed: () => void;
  onCancel: () => void;
}

export function SessionManager({ basePath, session, onSessionOpened, onSessionClosed, onCancel }: SessionManagerProps) {
  const [cashierName, setCashierName] = useState('');
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Load session summary if session is open
  useEffect(() => {
    if (session) {
      setSummaryLoading(true);
      api.get<{ data: SessionSummary }>(`${basePath}/pos/sessions/${session.id}/summary`)
        .then((res) => setSummary(res.data))
        .catch(() => setSummary(null))
        .finally(() => setSummaryLoading(false));
    }
  }, [basePath, session]);

  const handleOpen = async () => {
    if (!cashierName.trim()) return;
    setLoading(true);
    try {
      const res = await api.post<{ data: Session }>(`${basePath}/pos/sessions/open`, {
        cashierName: cashierName.trim(),
        openingCash: Number(openingCash) || 0,
      });
      if (res.data) onSessionOpened(res.data);
    } catch {
      // error shown via API
    } finally {
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
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  // Open session form
  if (!session) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <LogIn className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Open Register</h2>
                <p className="text-sm text-muted-foreground">Start a new shift</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Cashier Name</label>
                <input
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  placeholder="e.g. Allie"
                  autoFocus
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleOpen(); }}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Opening Cash</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  placeholder="0.00"
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <button
                onClick={handleOpen}
                disabled={!cashierName.trim() || loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Open Register
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Close session form with summary
  return (
    <div className="flex h-[80vh] items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardContent className="pt-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Close Register</h2>
              <p className="text-sm text-muted-foreground">
                End shift for {session.cashier_name}
              </p>
            </div>
          </div>

          {/* Session summary */}
          {summaryLoading ? (
            <div className="mb-6 flex h-24 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : summary && (
            <div className="mb-6 rounded-lg bg-muted/50 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" /> Session Summary
              </h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-muted-foreground">Transactions</span>
                <span className="text-right font-medium">{summary.transaction_count}</span>
                <span className="text-muted-foreground">Total Sales</span>
                <span className="text-right font-medium">${Number(summary.total_sales || 0).toFixed(2)}</span>
                <span className="text-muted-foreground">Card Payments</span>
                <span className="text-right">${Number(summary.total_card || 0).toFixed(2)}</span>
                <span className="text-muted-foreground">Cash Payments</span>
                <span className="text-right">${Number(summary.total_cash || 0).toFixed(2)}</span>
                <span className="text-muted-foreground">Tax Collected</span>
                <span className="text-right">${Number(summary.total_tax || 0).toFixed(2)}</span>
                <span className="text-muted-foreground">Refunds</span>
                <span className="text-right text-red-600">${Number(summary.total_refunds || 0).toFixed(2)}</span>
                <div className="col-span-2 my-1 border-t border-border" />
                <span className="text-muted-foreground">Opening Cash</span>
                <span className="text-right">${Number(summary.opening_cash || 0).toFixed(2)}</span>
                <span className="font-medium">Expected Cash</span>
                <span className="text-right font-medium">${Number(summary.expected_cash || 0).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Closing Cash Count</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  className="flex h-11 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>

            {/* Variance warning */}
            {closingCash && summary && (
              (() => {
                const variance = Number(closingCash) - Number(summary.expected_cash);
                if (Math.abs(variance) >= 0.01) {
                  return (
                    <div className={`flex items-center gap-2 rounded-md p-3 text-sm ${
                      Math.abs(variance) > 5
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                        : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
                    }`}>
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      Variance: {variance > 0 ? '+' : ''}{variance.toFixed(2)}
                      {Math.abs(variance) > 5 ? ' — significant' : ' — minor'}
                    </div>
                  );
                }
                return null;
              })()
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this shift..."
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="flex-1 h-11 rounded-lg border border-border text-sm font-medium hover:bg-accent"
              >
                Back to Register
              </button>
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex flex-1 h-11 items-center justify-center gap-2 rounded-lg bg-orange-600 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Close Register
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * POSSessions — Session history and summaries
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface Transaction {
  id: string;
  receipt_number: string;
  type: string;
  total: string;
  payment_method: string;
  created_at: string;
  cashier_name: string;
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

export function POSSessions() {
  const { siteId } = useParams<{ siteId: string }>();
  const basePath = `/sites/${siteId}`;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get<{ data: Transaction[] }>(`${basePath}/pos/transactions?limit=200`)
      .then((res) => setTransactions(res.data ?? []))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, [basePath]);

  // Group transactions by session
  const sessionGroups = transactions.reduce<Record<string, { cashier: string; date: string; transactions: Transaction[] }>>((acc, tx) => {
    // Derive a session key from date + cashier (approximate grouping for display)
    const date = new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const key = `${date}-${tx.cashier_name}`;
    if (!acc[key]) {
      acc[key] = { cashier: tx.cashier_name, date, transactions: [] };
    }
    acc[key].transactions.push(tx);
    return acc;
  }, {});

  const toggleSession = (key: string) => {
    setExpandedSession(expandedSession === key ? null : key);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Session History</h1>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : Object.keys(sessionGroups).length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Clock className="h-8 w-8" />
          <p className="text-sm">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(sessionGroups).map(([key, group]) => {
            const isExpanded = expandedSession === key;
            const totalSales = group.transactions
              .filter((t) => t.type === 'sale')
              .reduce((s, t) => s + Number(t.total), 0);
            const txCount = group.transactions.length;

            return (
              <Card key={key}>
                <button
                  onClick={() => toggleSession(key)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <span className="text-sm font-medium">{group.date}</span>
                      <span className="mx-2 text-muted-foreground">|</span>
                      <span className="text-sm text-muted-foreground">{group.cashier}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{txCount} transactions</span>
                    <span className="font-medium">${totalSales.toFixed(2)}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-6 py-2 text-left text-xs font-medium text-muted-foreground">Receipt</th>
                          <th className="px-6 py-2 text-left text-xs font-medium text-muted-foreground">Type</th>
                          <th className="px-6 py-2 text-left text-xs font-medium text-muted-foreground">Payment</th>
                          <th className="px-6 py-2 text-right text-xs font-medium text-muted-foreground">Total</th>
                          <th className="px-6 py-2 text-right text-xs font-medium text-muted-foreground">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.transactions.map((tx) => (
                          <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                            <td className="px-6 py-2 font-mono text-xs">{tx.receipt_number}</td>
                            <td className="px-6 py-2">
                              <span className={cn(
                                'rounded px-1.5 py-0.5 text-xs font-medium',
                                tx.type === 'sale' && 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
                                tx.type === 'refund' && 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
                                tx.type === 'void' && 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
                              )}>
                                {tx.type}
                              </span>
                            </td>
                            <td className="px-6 py-2 text-sm text-muted-foreground capitalize">{tx.payment_method}</td>
                            <td className={cn(
                              'px-6 py-2 text-right text-sm font-medium',
                              tx.type === 'refund' && 'text-red-600',
                            )}>
                              {tx.type === 'refund' ? '-' : ''}${Number(tx.total).toFixed(2)}
                            </td>
                            <td className="px-6 py-2 text-right text-xs text-muted-foreground">
                              {new Date(tx.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default POSSessions;

/**
 * POSReports — Daily sales, per-artist commission, and settlement reports
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart3, Users, FileText, Loader2, Download, Calendar } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface DailySummary {
  sale_date: string;
  sale_count: number;
  refund_count: number;
  total_sales: string;
  total_refunds: string;
  total_tax: string;
  card_total: string;
  cash_total: string;
}

interface ArtistReport {
  artist_id: string;
  artist_name: string;
  transaction_count: number;
  items_sold: number;
  total_sales: string;
  total_commission: string;
  total_store_share: string;
  avg_commission_rate: string;
}

interface SettlementReport {
  artist_id: string;
  artist_name: string;
  line_items: Array<Record<string, unknown>>;
  total_sales: string;
  total_owed: string;
  total_store_share: string;
  item_count: number;
}

type TabKey = 'daily' | 'artist' | 'settlement';

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function getDefaultDateRange(): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split('T')[0];
  const from = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
  return { from, to };
}

export function POSReports() {
  const { siteId } = useParams<{ siteId: string }>();
  const basePath = `/sites/${siteId}`;

  const [tab, setTab] = useState<TabKey>('daily');
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [loading, setLoading] = useState(false);

  const [dailyData, setDailyData] = useState<DailySummary[]>([]);
  const [artistData, setArtistData] = useState<ArtistReport[]>([]);
  const [settlementData, setSettlementData] = useState<SettlementReport[]>([]);

  const loadReport = async () => {
    setLoading(true);
    try {
      if (tab === 'daily') {
        const res = await api.get<{ data: DailySummary[] }>(
          `${basePath}/pos/reports/daily?from=${dateRange.from}&to=${dateRange.to}`
        );
        setDailyData(res.data ?? []);
      } else if (tab === 'artist') {
        const res = await api.get<{ data: ArtistReport[] }>(
          `${basePath}/pos/reports/artist?from=${dateRange.from}&to=${dateRange.to}`
        );
        setArtistData(res.data ?? []);
      } else {
        const res = await api.get<{ data: SettlementReport[] }>(
          `${basePath}/pos/reports/settlement?from=${dateRange.from}&to=${dateRange.to}`
        );
        setSettlementData(res.data ?? []);
      }
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReport(); }, [tab, dateRange.from, dateRange.to]);

  // CSV export
  const exportCSV = () => {
    let csvContent = '';

    if (tab === 'daily') {
      csvContent = 'Date,Sales,Refunds,Total Sales,Total Refunds,Tax,Card,Cash\n';
      dailyData.forEach((d) => {
        csvContent += `${d.sale_date},${d.sale_count},${d.refund_count},${d.total_sales},${d.total_refunds},${d.total_tax},${d.card_total},${d.cash_total}\n`;
      });
    } else if (tab === 'artist') {
      csvContent = 'Artist,Transactions,Items Sold,Total Sales,Commission,Store Share,Avg Rate\n';
      artistData.forEach((a) => {
        csvContent += `"${a.artist_name}",${a.transaction_count},${a.items_sold},${a.total_sales},${a.total_commission},${a.total_store_share},${Number(a.avg_commission_rate).toFixed(2)}\n`;
      });
    } else {
      csvContent = 'Artist,Items,Total Sales,Amount Owed,Store Share\n';
      settlementData.forEach((s) => {
        csvContent += `"${s.artist_name}",${s.item_count},${s.total_sales},${s.total_owed},${s.total_store_share}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pos-${tab}-report-${dateRange.from}-to-${dateRange.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: Array<{ key: TabKey; label: string; icon: typeof BarChart3 }> = [
    { key: 'daily', label: 'Daily Sales', icon: BarChart3 },
    { key: 'artist', label: 'Artist Sales', icon: Users },
    { key: 'settlement', label: 'Settlement', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">POS Reports</h1>
        <button
          onClick={exportCSV}
          className="flex h-9 items-center gap-2 rounded-md border border-input px-4 text-sm font-medium hover:bg-accent"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Date range picker */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Date Range:</span>
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
              <span className="flex items-center text-sm text-muted-foreground">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>

            {/* Tabs */}
            <div className="ml-auto flex gap-1">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                    tab === key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report content */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : tab === 'daily' ? (
        /* Daily Sales Table */
        dailyData.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No sales data for this period
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Sales</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Total</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Card</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Cash</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Tax</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Refunds</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData.map((day) => (
                    <tr key={day.sale_date} className="border-b border-border last:border-0 hover:bg-accent/50">
                      <td className="px-6 py-3 text-sm font-medium">{formatDate(day.sale_date)}</td>
                      <td className="px-6 py-3 text-right text-sm">{day.sale_count}</td>
                      <td className="px-6 py-3 text-right text-sm font-medium">${Number(day.total_sales).toFixed(2)}</td>
                      <td className="px-6 py-3 text-right text-sm">${Number(day.card_total).toFixed(2)}</td>
                      <td className="px-6 py-3 text-right text-sm">${Number(day.cash_total).toFixed(2)}</td>
                      <td className="px-6 py-3 text-right text-sm text-muted-foreground">${Number(day.total_tax).toFixed(2)}</td>
                      <td className="px-6 py-3 text-right text-sm text-red-600">
                        {Number(day.total_refunds) > 0 ? `-$${Number(day.total_refunds).toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 font-medium">
                    <td className="px-6 py-3 text-sm">Total</td>
                    <td className="px-6 py-3 text-right text-sm">{dailyData.reduce((s, d) => s + d.sale_count, 0)}</td>
                    <td className="px-6 py-3 text-right text-sm">${dailyData.reduce((s, d) => s + Number(d.total_sales), 0).toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-sm">${dailyData.reduce((s, d) => s + Number(d.card_total), 0).toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-sm">${dailyData.reduce((s, d) => s + Number(d.cash_total), 0).toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-sm">${dailyData.reduce((s, d) => s + Number(d.total_tax), 0).toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-sm text-red-600">
                      -${dailyData.reduce((s, d) => s + Number(d.total_refunds), 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )
      ) : tab === 'artist' ? (
        /* Artist Sales Table */
        artistData.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No artist sales data for this period
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Artist</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Transactions</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Items</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Sales</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Commission</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Store Share</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {artistData.map((artist) => (
                    <tr key={artist.artist_id} className="border-b border-border last:border-0 hover:bg-accent/50">
                      <td className="px-6 py-3 text-sm font-medium">{artist.artist_name}</td>
                      <td className="px-6 py-3 text-right text-sm">{artist.transaction_count}</td>
                      <td className="px-6 py-3 text-right text-sm">{artist.items_sold}</td>
                      <td className="px-6 py-3 text-right text-sm font-medium">${Number(artist.total_sales).toFixed(2)}</td>
                      <td className="px-6 py-3 text-right text-sm text-green-700 dark:text-green-400">
                        ${Number(artist.total_commission).toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-right text-sm">${Number(artist.total_store_share).toFixed(2)}</td>
                      <td className="px-6 py-3 text-right text-sm text-muted-foreground">
                        {(Number(artist.avg_commission_rate) * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 font-medium">
                    <td className="px-6 py-3 text-sm">Total</td>
                    <td className="px-6 py-3 text-right text-sm">{artistData.reduce((s, a) => s + a.transaction_count, 0)}</td>
                    <td className="px-6 py-3 text-right text-sm">{artistData.reduce((s, a) => s + a.items_sold, 0)}</td>
                    <td className="px-6 py-3 text-right text-sm">${artistData.reduce((s, a) => s + Number(a.total_sales), 0).toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-sm text-green-700 dark:text-green-400">
                      ${artistData.reduce((s, a) => s + Number(a.total_commission), 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right text-sm">${artistData.reduce((s, a) => s + Number(a.total_store_share), 0).toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-sm">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )
      ) : (
        /* Settlement Report */
        settlementData.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No settlement data for this period
          </div>
        ) : (
          <div className="space-y-4">
            {settlementData.map((artist) => (
              <Card key={artist.artist_id}>
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{artist.artist_name}</h3>
                      <p className="text-sm text-muted-foreground">{artist.item_count} items sold</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Amount Owed</p>
                      <p className="text-xl font-bold text-green-700 dark:text-green-400">
                        ${Number(artist.total_owed).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">Receipt</th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">Product</th>
                          <th className="px-3 py-2 text-right font-medium text-muted-foreground">Qty</th>
                          <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                          <th className="px-3 py-2 text-right font-medium text-muted-foreground">Commission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {artist.line_items.map((item: any, i: number) => (
                          <tr key={i} className="border-b border-border last:border-0">
                            <td className="px-3 py-2 text-muted-foreground">
                              {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">{item.receipt}</td>
                            <td className="px-3 py-2">{item.product}</td>
                            <td className="px-3 py-2 text-right">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">${Number(item.line_total).toFixed(2)}</td>
                            <td className="px-3 py-2 text-right text-green-700 dark:text-green-400">
                              ${Number(item.commission_amount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm">
                    <span className="text-muted-foreground">
                      Total Sales: ${Number(artist.total_sales).toFixed(2)} |
                      Store Share: ${Number(artist.total_store_share).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default POSReports;

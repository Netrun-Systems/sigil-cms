import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Receipt, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface LineItem {
  id: string;
  productName: string;
  quantity: number;
  unitPriceInCents: number;
  totalInCents: number;
}

interface Order {
  id: string;
  customerEmail: string;
  totalInCents: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripeSessionId: string | null;
  lineItems: LineItem[];
  created_at: string;
}

const STATUS_OPTIONS = ['pending', 'completed', 'failed', 'refunded'] as const;

const statusColors: Record<string, string> = {
  pending: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
  completed: 'border-green-500/50 bg-green-500/10 text-green-400',
  failed: 'border-red-500/50 bg-red-500/10 text-red-400',
  refunded: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
};

function formatPrice(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function OrdersList() {
  const { siteId } = useParams<{ siteId: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const basePath = `/sites/${siteId}`;

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const qs = params.toString() ? `?${params}` : '';
      const res = await api.get<{ data: Order[] }>(`${basePath}/store/orders${qs}`);
      setOrders(res.data ?? []);
    } catch {
      // empty state on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [siteId, statusFilter]);

  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Orders</h1>

      {/* Status filter cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUS_OPTIONS.map((s) => (
          <button key={s} onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
            className={cn('rounded-lg border p-3 text-center transition-colors',
              statusFilter === s ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50')}>
            <p className="text-2xl font-bold">{counts[s] || 0}</p>
            <p className="text-xs text-muted-foreground capitalize">{s}</p>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Receipt className="h-8 w-8" />
          <p className="text-sm">No orders yet</p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Total</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Session</th>
                  <th className="px-6 py-3 w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <>
                    <tr key={order.id} className="group border-b border-border last:border-0 hover:bg-accent/50">
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {order.customerEmail}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {formatPrice(order.totalInCents, order.currency)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('rounded-md px-2 py-0.5 text-xs capitalize border', statusColors[order.status] || '')}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                        {order.stripeSessionId
                          ? `${order.stripeSessionId.slice(0, 20)}...`
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {order.lineItems && order.lineItems.length > 0 && (
                          <button
                            onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                          >
                            {expanded === order.id
                              ? <ChevronUp className="h-4 w-4" />
                              : <ChevronDown className="h-4 w-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded === order.id && order.lineItems && order.lineItems.length > 0 && (
                      <tr key={`${order.id}-details`} className="border-b border-border last:border-0">
                        <td colSpan={6} className="px-6 py-4 bg-muted/30">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Line Items</p>
                            {order.lineItems.map((item, idx) => (
                              <div key={item.id || idx} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium">{item.productName}</span>
                                  <span className="text-muted-foreground">x{item.quantity}</span>
                                </div>
                                <div className="flex items-center gap-4 text-muted-foreground">
                                  <span>{formatPrice(item.unitPriceInCents, order.currency)} each</span>
                                  <span className="font-medium text-foreground">
                                    {formatPrice(item.totalInCents, order.currency)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

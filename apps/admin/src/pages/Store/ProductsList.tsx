import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Loader2, ShoppingBag, RefreshCw } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface Product {
  id: string;
  name: string;
  description: string | null;
  priceInCents: number;
  currency: string;
  type: 'one_time' | 'recurring';
  stripeProductId: string | null;
  stripePriceId: string | null;
  isActive: boolean;
  imageUrl: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'one_time', label: 'One-time' },
  { value: 'recurring', label: 'Recurring' },
];

function formatPrice(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function ProductsList() {
  const { siteId } = useParams<{ siteId: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [syncing, setSyncing] = useState<string | null>(null);

  const basePath = `/sites/${siteId}`;

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Product[] }>(`${basePath}/store/products`);
      setProducts(res.data ?? []);
    } catch {
      // empty state on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [siteId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`${basePath}/store/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // keep list as-is
    }
  };

  const handleSync = async (id: string) => {
    setSyncing(id);
    try {
      const res = await api.post<{ data: Product }>(`${basePath}/store/products/${id}/sync`, {});
      if (res.data) {
        setProducts((prev) => prev.map((p) => p.id === id ? { ...p, ...res.data } : p));
      }
    } catch {
      // keep as-is
    } finally {
      setSyncing(null);
    }
  };

  const filtered = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && p.type !== typeFilter) return false;
    return true;
  });

  const editBase = `/sites/${siteId}/store/products`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link
          to={`${editBase}/new`}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTypeFilter(opt.value)}
                  className={cn('rounded-md px-3 py-1.5 text-sm transition-colors',
                    typeFilter === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
          <ShoppingBag className="h-8 w-8" />
          <p className="text-sm">{products.length === 0 ? 'No products yet' : 'No matches'}</p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Product</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Stripe</th>
                  <th className="px-6 py-3 w-[140px]"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id} className="group border-b border-border last:border-0 hover:bg-accent/50">
                    <td className="px-6 py-4">
                      <Link to={`${editBase}/${product.id}`} className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt="" className="h-10 w-10 rounded-md object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                        )}
                        <span className="font-medium group-hover:text-primary">{product.name}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {formatPrice(product.priceInCents, product.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs capitalize">
                        {product.type === 'one_time' ? 'One-time' : 'Recurring'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn('h-2 w-2 rounded-full',
                          product.stripeProductId ? 'bg-green-500' : 'bg-gray-400'
                        )} />
                        <span className="text-xs text-muted-foreground">
                          {product.stripeProductId ? 'Synced' : 'Not synced'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Link
                          to={`${editBase}/${product.id}`}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleSync(product.id)}
                          disabled={syncing === product.id}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                        >
                          <RefreshCw className={cn('h-4 w-4', syncing === product.id && 'animate-spin')} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

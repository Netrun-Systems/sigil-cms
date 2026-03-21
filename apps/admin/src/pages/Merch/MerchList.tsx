import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Shirt, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

interface MerchVariant {
  id: string;
  size: string;
  color: string;
  inStock: boolean;
}

interface MerchProduct {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  retailPrice: number;
  baseCost: number;
  active: boolean;
  variants: MerchVariant[];
}

interface SyncStatus {
  lastSyncedAt: string | null;
}

export function MerchList() {
  const { siteId } = useParams<{ siteId: string }>();
  const [products, setProducts] = useState<MerchProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ lastSyncedAt: null });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: MerchProduct[]; syncStatus?: SyncStatus }>(
        `/sites/${siteId}/merch/products`
      );
      setProducts(res.data ?? []);
      if (res.syncStatus) setSyncStatus(res.syncStatus);
    } catch {
      // empty state on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [siteId]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.post(`/sites/${siteId}/merch/sync`, {});
      await load();
    } catch {
      // keep existing state
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await api.put(`/sites/${siteId}/merch/products/${id}`, { active: !active });
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, active: !active } : p));
    } catch { /* */ }
  };

  const handlePriceSave = async (id: string, value: string) => {
    const price = parseFloat(value);
    if (isNaN(price) || price < 0) {
      setEditingPrice(null);
      return;
    }
    try {
      await api.put(`/sites/${siteId}/merch/products/${id}`, { retailPrice: price });
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, retailPrice: price } : p));
    } catch { /* */ }
    setEditingPrice(null);
  };

  const formatPrice = (n: number) => `$${n.toFixed(2)}`;

  const margin = (retail: number, base: number) => {
    if (retail <= 0) return '0%';
    return `${(((retail - base) / retail) * 100).toFixed(0)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Merchandise</h1>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
          {syncing ? 'Syncing...' : 'Sync from Printful'}
        </button>
      </div>

      {/* Sync status */}
      <p className="text-sm text-muted-foreground">
        {syncStatus.lastSyncedAt
          ? `Last synced: ${new Date(syncStatus.lastSyncedAt).toLocaleString()}`
          : 'Never synced'}
      </p>

      {/* Content */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : syncing ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <p className="text-sm">Syncing products from Printful...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Shirt className="h-8 w-8" />
          <p className="text-sm">No products — click Sync to import from Printful</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className={cn(!product.active && 'opacity-60')}>
              <CardContent className="p-4 space-y-3">
                {/* Thumbnail */}
                {product.thumbnailUrl ? (
                  <img
                    src={product.thumbnailUrl}
                    alt={product.name}
                    className="w-full aspect-square rounded-md object-cover bg-muted"
                  />
                ) : (
                  <div className="w-full aspect-square rounded-md bg-muted flex items-center justify-center">
                    <Shirt className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                )}

                {/* Name + active toggle */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm leading-tight">{product.name}</h3>
                  <button
                    onClick={() => handleToggleActive(product.id, product.active)}
                    className={cn(
                      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors',
                      product.active ? 'bg-green-500' : 'bg-muted-foreground/30'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform',
                        product.active ? 'translate-x-4' : 'translate-x-0.5'
                      )}
                    />
                  </button>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Retail</p>
                    {editingPrice === product.id ? (
                      <input
                        ref={priceInputRef}
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={product.retailPrice.toFixed(2)}
                        onBlur={(e) => handlePriceSave(product.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                          if (e.key === 'Escape') setEditingPrice(null);
                        }}
                        autoFocus
                        className="w-full rounded border border-input bg-background px-1.5 py-0.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingPrice(product.id)}
                        className="font-medium text-primary hover:underline cursor-pointer"
                        title="Click to edit"
                      >
                        {formatPrice(product.retailPrice)}
                      </button>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Base Cost</p>
                    <p className="font-medium">{formatPrice(product.baseCost)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Margin</p>
                    <p className={cn(
                      'font-medium',
                      product.retailPrice - product.baseCost > 0 ? 'text-green-500' : 'text-red-500'
                    )}>
                      {margin(product.retailPrice, product.baseCost)}
                    </p>
                  </div>
                </div>

                {/* Variants toggle */}
                <button
                  onClick={() => setExpanded(expanded === product.id ? null : product.id)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <span>{product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}</span>
                  {expanded === product.id
                    ? <ChevronUp className="h-3.5 w-3.5" />
                    : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                {/* Expanded variants */}
                {expanded === product.id && (
                  <div className="border-t border-border pt-2 space-y-1.5">
                    {product.variants.map((v) => (
                      <div key={v.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {v.size}{v.color ? ` / ${v.color}` : ''}
                        </span>
                        <span className={cn(
                          'rounded-md px-1.5 py-0.5 border text-xs',
                          v.inStock
                            ? 'border-green-500/50 bg-green-500/10 text-green-500'
                            : 'border-red-500/50 bg-red-500/10 text-red-500'
                        )}>
                          {v.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

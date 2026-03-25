/**
 * POSRegister — Main point-of-sale register interface
 *
 * Tablet-optimized layout with product grid, cart, and payment.
 * Designed for touch-friendly operation at Poppies Art & Gifts.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Search, Plus, Minus, X, CreditCard, Banknote, SplitSquareVertical,
  Monitor, Loader2, ShoppingCart, Package, ScanBarcode,
} from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
import { CashTenderModal } from './CashTenderModal';
import { ReceiptModal } from './ReceiptModal';
import { SessionManager } from './SessionManager';

interface PosProduct {
  id: string;
  name: string;
  sku: string | null;
  price: string;
  category: string | null;
  artist_id: string | null;
  artist_name: string | null;
  commission_rate: string | null;
  image_url: string | null;
  barcode: string | null;
}

interface CartItem {
  productId?: string;
  productName: string;
  artistId?: string;
  artistName?: string;
  sku?: string;
  unitPrice: number;
  quantity: number;
  commissionRate?: number;
  isCustom?: boolean;
}

interface Session {
  id: string;
  cashier_name: string;
  opened_at: string;
  status: string;
}

interface TransactionResult {
  transaction: Record<string, unknown>;
  lineItems: unknown[];
  receipt: Record<string, unknown>;
}

interface LastSale {
  receiptNumber: string;
  total: string;
  paymentMethod: string;
}

const TAX_RATE = 0.0775;

const CATEGORIES = ['All', 'Ceramics', 'Paintings', 'Jewelry', 'Textiles', 'Cards', 'Sculptures', 'Other'];

export function POSRegister() {
  const { siteId } = useParams<{ siteId: string }>();
  const basePath = `/sites/${siteId}`;

  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [processing, setProcessing] = useState(false);
  const [lastSale, setLastSale] = useState<LastSale | null>(null);

  // Modals
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [sessionManagerOpen, setSessionManagerOpen] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<Record<string, unknown> | null>(null);
  const [customItemOpen, setCustomItemOpen] = useState(false);

  // Custom item form
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [customCommission, setCustomCommission] = useState('0.60');

  const scanInputRef = useRef<HTMLInputElement>(null);

  // Load session on mount
  const loadSession = useCallback(async () => {
    setSessionLoading(true);
    try {
      const res = await api.get<{ data: Session | null }>(`${basePath}/pos/sessions/current`);
      setSession(res.data);
    } catch {
      setSession(null);
    } finally {
      setSessionLoading(false);
    }
  }, [basePath]);

  // Load products
  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await api.get<{ data: PosProduct[] }>(`${basePath}/pos/products`);
      setProducts(res.data ?? []);
    } catch {
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [basePath]);

  useEffect(() => { loadSession(); loadProducts(); }, [loadSession, loadProducts]);

  // Cart operations
  const addToCart = (product: PosProduct) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) => i.productId === product.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        artistId: product.artist_id ?? undefined,
        artistName: product.artist_name ?? undefined,
        sku: product.sku ?? undefined,
        unitPrice: Number(product.price),
        quantity: 1,
        commissionRate: product.commission_rate ? Number(product.commission_rate) : undefined,
      }];
    });
  };

  const addCustomItem = () => {
    if (!customName || !customPrice) return;
    const price = Number(customPrice);
    if (isNaN(price) || price <= 0) return;

    setCart((prev) => [...prev, {
      productName: customName,
      artistName: customArtist || undefined,
      unitPrice: price,
      quantity: 1,
      commissionRate: customCommission ? Number(customCommission) : undefined,
      isCustom: true,
    }]);

    setCustomName('');
    setCustomPrice('');
    setCustomArtist('');
    setCustomItemOpen(false);
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: Math.max(1, next[index].quantity + delta) };
      return next;
    });
  };

  const removeItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => setCart([]);

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  // Barcode scan handler
  const handleScan = async (code: string) => {
    if (!code.trim()) return;
    try {
      const res = await api.post<{ data: PosProduct }>(`${basePath}/pos/products/scan`, { code: code.trim() });
      if (res.data) addToCart(res.data);
    } catch {
      // product not found — ignore
    }
  };

  // Payment handlers
  const processPayment = async (method: 'card' | 'cash' | 'split', cashAmount?: number) => {
    if (cart.length === 0 || processing) return;
    setProcessing(true);

    try {
      const res = await api.post<{ data: TransactionResult }>(`${basePath}/pos/transactions`, {
        lineItems: cart.map((item) => ({
          productName: item.productName,
          artistId: item.artistId,
          artistName: item.artistName,
          sku: item.sku,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          commissionRate: item.commissionRate,
        })),
        paymentMethod: method,
        cashAmount,
      });

      if (res.data) {
        setLastReceipt(res.data.receipt);
        setReceiptModalOpen(true);
        setLastSale({
          receiptNumber: (res.data.receipt as Record<string, string>).receiptNumber,
          total: (res.data.receipt as Record<string, string>).total,
          paymentMethod: (res.data.receipt as Record<string, string>).paymentMethod,
        });
        clearCart();
      }
    } catch {
      // error already shown via API
    } finally {
      setProcessing(false);
    }
  };

  const handleCardPayment = () => processPayment('card');
  const handleCashPayment = (cashAmount: number) => {
    setCashModalOpen(false);
    processPayment('cash', cashAmount);
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (category !== 'All' && p.category?.toLowerCase() !== category.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.artist_name?.toLowerCase().includes(q)) ||
        (p.sku?.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // If no session, show session manager
  if (sessionLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session || sessionManagerOpen) {
    return (
      <SessionManager
        basePath={basePath}
        session={session}
        onSessionOpened={(s) => { setSession(s); setSessionManagerOpen(false); }}
        onSessionClosed={() => { setSession(null); setSessionManagerOpen(false); }}
        onCancel={() => setSessionManagerOpen(false)}
      />
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-3">
          <Monitor className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">Poppies POS</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Cashier: <strong className="text-foreground">{session.cashier_name}</strong>
          </span>
          <button
            onClick={() => setSessionManagerOpen(true)}
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            End Shift
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Product grid */}
        <div className="flex flex-1 flex-col overflow-hidden border-r border-border">
          {/* Search and scan */}
          <div className="flex gap-2 border-b border-border p-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search products, artists, SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="relative">
              <input
                ref={scanInputRef}
                placeholder="Scan barcode..."
                className="h-10 w-40 rounded-md border border-input bg-background px-3 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleScan((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <ScanBarcode className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors',
                  category === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {productsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
                <Package className="h-8 w-8" />
                <p className="text-sm">{products.length === 0 ? 'No products yet' : 'No matches'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="flex flex-col rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-accent/50 active:scale-[0.98]"
                    style={{ minHeight: '120px' }}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="mb-2 h-16 w-full rounded-md object-cover"
                      />
                    ) : (
                      <div className="mb-2 flex h-16 w-full items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                    <span className="text-sm font-medium leading-tight line-clamp-2">{product.name}</span>
                    {product.artist_name && (
                      <span className="mt-0.5 text-xs text-muted-foreground truncate">by {product.artist_name}</span>
                    )}
                    <span className="mt-auto pt-1 text-sm font-semibold text-primary">
                      ${Number(product.price).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom item button */}
          <div className="border-t border-border p-3">
            {customItemOpen ? (
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Item name"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="col-span-2 h-10 rounded-md border border-input bg-background px-3 text-sm"
                    />
                    <input
                      placeholder="Price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    />
                    <input
                      placeholder="Artist (optional)"
                      value={customArtist}
                      onChange={(e) => setCustomArtist(e.target.value)}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    />
                    <div className="col-span-2 flex gap-2">
                      <button
                        onClick={addCustomItem}
                        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground"
                      >
                        <Plus className="h-4 w-4" /> Add to Cart
                      </button>
                      <button
                        onClick={() => setCustomItemOpen(false)}
                        className="h-10 rounded-md border border-input px-4 text-sm text-muted-foreground hover:bg-accent"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <button
                onClick={() => setCustomItemOpen(true)}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-foreground"
              >
                <Plus className="h-4 w-4" /> Custom Item
              </button>
            )}
          </div>
        </div>

        {/* Right: Cart panel */}
        <div className="flex w-[360px] flex-col bg-card lg:w-[400px]">
          {/* Cart header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Cart ({cart.length})</span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Clear
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {cart.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Tap a product to add it
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-md border border-border p-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">{item.productName}</p>
                      {item.artistName && (
                        <p className="text-xs text-muted-foreground">by {item.artistName}</p>
                      )}
                      <p className="text-xs text-muted-foreground">${item.unitPrice.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(index, -1)}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-accent"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(index, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-accent"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-medium">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(index)}
                        className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="border-t border-border px-4 py-3">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (7.75%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="my-2 border-t border-border" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment buttons */}
          <div className="grid grid-cols-2 gap-2 border-t border-border p-4">
            <button
              onClick={handleCardPayment}
              disabled={cart.length === 0 || processing}
              className="flex h-14 items-center justify-center gap-2 rounded-lg bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {processing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Card
                </>
              )}
            </button>
            <button
              onClick={() => setCashModalOpen(true)}
              disabled={cart.length === 0 || processing}
              className="flex h-14 items-center justify-center gap-2 rounded-lg bg-green-600 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              <Banknote className="h-5 w-5" />
              Cash
            </button>
            <button
              onClick={() => {
                // For split, open cash modal — remainder goes to card
                setCashModalOpen(true);
              }}
              disabled={cart.length === 0 || processing}
              className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-lg border border-border font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              <SplitSquareVertical className="h-5 w-5" />
              Split Payment
            </button>
          </div>
        </div>
      </div>

      {/* Last sale ticker */}
      {lastSale && (
        <div className="flex items-center justify-center gap-3 border-t border-border bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground">
          Last sale: <strong>{lastSale.receiptNumber}</strong> | {lastSale.total} | {lastSale.paymentMethod}
        </div>
      )}

      {/* Modals */}
      {cashModalOpen && (
        <CashTenderModal
          total={total}
          onConfirm={handleCashPayment}
          onClose={() => setCashModalOpen(false)}
        />
      )}

      {receiptModalOpen && lastReceipt && (
        <ReceiptModal
          receipt={lastReceipt}
          basePath={basePath}
          onClose={() => setReceiptModalOpen(false)}
        />
      )}
    </div>
  );
}

export default POSRegister;

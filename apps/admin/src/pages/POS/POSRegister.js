import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * POSRegister — Main point-of-sale register interface
 *
 * Tablet-optimized layout with product grid, cart, and payment.
 * Designed for touch-friendly operation at Poppies Art & Gifts.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Plus, Minus, X, CreditCard, Banknote, SplitSquareVertical, Monitor, Loader2, ShoppingCart, Package, ScanBarcode, } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
import { CashTenderModal } from './CashTenderModal';
import { ReceiptModal } from './ReceiptModal';
import { SessionManager } from './SessionManager';
const TAX_RATE = 0.0775;
const CATEGORIES = ['All', 'Ceramics', 'Paintings', 'Jewelry', 'Textiles', 'Cards', 'Sculptures', 'Other'];
export function POSRegister() {
    const { siteId } = useParams();
    const basePath = `/sites/${siteId}`;
    const [session, setSession] = useState(null);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [processing, setProcessing] = useState(false);
    const [lastSale, setLastSale] = useState(null);
    // Modals
    const [cashModalOpen, setCashModalOpen] = useState(false);
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [sessionManagerOpen, setSessionManagerOpen] = useState(false);
    const [lastReceipt, setLastReceipt] = useState(null);
    const [customItemOpen, setCustomItemOpen] = useState(false);
    // Custom item form
    const [customName, setCustomName] = useState('');
    const [customPrice, setCustomPrice] = useState('');
    const [customArtist, setCustomArtist] = useState('');
    const [customCommission, setCustomCommission] = useState('0.60');
    const scanInputRef = useRef(null);
    // Load session on mount
    const loadSession = useCallback(async () => {
        setSessionLoading(true);
        try {
            const res = await api.get(`${basePath}/pos/sessions/current`);
            setSession(res.data);
        }
        catch {
            setSession(null);
        }
        finally {
            setSessionLoading(false);
        }
    }, [basePath]);
    // Load products
    const loadProducts = useCallback(async () => {
        setProductsLoading(true);
        try {
            const res = await api.get(`${basePath}/pos/products`);
            setProducts(res.data ?? []);
        }
        catch {
            setProducts([]);
        }
        finally {
            setProductsLoading(false);
        }
    }, [basePath]);
    useEffect(() => { loadSession(); loadProducts(); }, [loadSession, loadProducts]);
    // Cart operations
    const addToCart = (product) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.productId === product.id);
            if (existing) {
                return prev.map((i) => i.productId === product.id
                    ? { ...i, quantity: i.quantity + 1 }
                    : i);
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
        if (!customName || !customPrice)
            return;
        const price = Number(customPrice);
        if (isNaN(price) || price <= 0)
            return;
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
    const updateQuantity = (index, delta) => {
        setCart((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], quantity: Math.max(1, next[index].quantity + delta) };
            return next;
        });
    };
    const removeItem = (index) => {
        setCart((prev) => prev.filter((_, i) => i !== index));
    };
    const clearCart = () => setCart([]);
    // Calculations
    const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;
    // Barcode scan handler
    const handleScan = async (code) => {
        if (!code.trim())
            return;
        try {
            const res = await api.post(`${basePath}/pos/products/scan`, { code: code.trim() });
            if (res.data)
                addToCart(res.data);
        }
        catch {
            // product not found — ignore
        }
    };
    // Payment handlers
    const processPayment = async (method, cashAmount) => {
        if (cart.length === 0 || processing)
            return;
        setProcessing(true);
        try {
            const res = await api.post(`${basePath}/pos/transactions`, {
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
                    receiptNumber: res.data.receipt.receiptNumber,
                    total: res.data.receipt.total,
                    paymentMethod: res.data.receipt.paymentMethod,
                });
                clearCart();
            }
        }
        catch {
            // error already shown via API
        }
        finally {
            setProcessing(false);
        }
    };
    const handleCardPayment = () => processPayment('card');
    const handleCashPayment = (cashAmount) => {
        setCashModalOpen(false);
        processPayment('cash', cashAmount);
    };
    // Filter products
    const filteredProducts = products.filter((p) => {
        if (category !== 'All' && p.category?.toLowerCase() !== category.toLowerCase())
            return false;
        if (search) {
            const q = search.toLowerCase();
            return (p.name.toLowerCase().includes(q) ||
                (p.artist_name?.toLowerCase().includes(q)) ||
                (p.sku?.toLowerCase().includes(q)));
        }
        return true;
    });
    // If no session, show session manager
    if (sessionLoading) {
        return (_jsx("div", { className: "flex h-[80vh] items-center justify-center", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-muted-foreground" }) }));
    }
    if (!session || sessionManagerOpen) {
        return (_jsx(SessionManager, { basePath: basePath, session: session, onSessionOpened: (s) => { setSession(s); setSessionManagerOpen(false); }, onSessionClosed: () => { setSession(null); setSessionManagerOpen(false); }, onCancel: () => setSessionManagerOpen(false) }));
    }
    return (_jsxs("div", { className: "flex h-[calc(100vh-4rem)] flex-col", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-border px-4 py-2", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Monitor, { className: "h-5 w-5 text-primary" }), _jsx("span", { className: "text-lg font-semibold", children: "Poppies POS" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("span", { className: "text-sm text-muted-foreground", children: ["Cashier: ", _jsx("strong", { className: "text-foreground", children: session.cashier_name })] }), _jsx("button", { onClick: () => setSessionManagerOpen(true), className: "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground", children: "End Shift" })] })] }), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsxs("div", { className: "flex flex-1 flex-col overflow-hidden border-r border-border", children: [_jsxs("div", { className: "flex gap-2 border-b border-border p-3", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), _jsx("input", { placeholder: "Search products, artists, SKU...", value: search, onChange: (e) => setSearch(e.target.value), className: "flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" })] }), _jsxs("div", { className: "relative", children: [_jsx("input", { ref: scanInputRef, placeholder: "Scan barcode...", className: "h-10 w-40 rounded-md border border-input bg-background px-3 text-sm", onKeyDown: (e) => {
                                                    if (e.key === 'Enter') {
                                                        handleScan(e.target.value);
                                                        e.target.value = '';
                                                    }
                                                } }), _jsx(ScanBarcode, { className: "absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" })] })] }), _jsx("div", { className: "flex gap-1 overflow-x-auto border-b border-border px-3 py-2", children: CATEGORIES.map((cat) => (_jsx("button", { onClick: () => setCategory(cat), className: cn('whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors', category === cat
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'), children: cat }, cat))) }), _jsx("div", { className: "flex-1 overflow-y-auto p-3", children: productsLoading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : filteredProducts.length === 0 ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(Package, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: products.length === 0 ? 'No products yet' : 'No matches' })] })) : (_jsx("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5", children: filteredProducts.map((product) => (_jsxs("button", { onClick: () => addToCart(product), className: "flex flex-col rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-accent/50 active:scale-[0.98]", style: { minHeight: '120px' }, children: [product.image_url ? (_jsx("img", { src: product.image_url, alt: product.name, className: "mb-2 h-16 w-full rounded-md object-cover" })) : (_jsx("div", { className: "mb-2 flex h-16 w-full items-center justify-center rounded-md bg-primary/10 text-primary", children: _jsx(Package, { className: "h-6 w-6" }) })), _jsx("span", { className: "text-sm font-medium leading-tight line-clamp-2", children: product.name }), product.artist_name && (_jsxs("span", { className: "mt-0.5 text-xs text-muted-foreground truncate", children: ["by ", product.artist_name] })), _jsxs("span", { className: "mt-auto pt-1 text-sm font-semibold text-primary", children: ["$", Number(product.price).toFixed(2)] })] }, product.id))) })) }), _jsx("div", { className: "border-t border-border p-3", children: customItemOpen ? (_jsx(Card, { children: _jsx(CardContent, { className: "pt-4", children: _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx("input", { placeholder: "Item name", value: customName, onChange: (e) => setCustomName(e.target.value), className: "col-span-2 h-10 rounded-md border border-input bg-background px-3 text-sm" }), _jsx("input", { placeholder: "Price", type: "number", step: "0.01", min: "0", value: customPrice, onChange: (e) => setCustomPrice(e.target.value), className: "h-10 rounded-md border border-input bg-background px-3 text-sm" }), _jsx("input", { placeholder: "Artist (optional)", value: customArtist, onChange: (e) => setCustomArtist(e.target.value), className: "h-10 rounded-md border border-input bg-background px-3 text-sm" }), _jsxs("div", { className: "col-span-2 flex gap-2", children: [_jsxs("button", { onClick: addCustomItem, className: "flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground", children: [_jsx(Plus, { className: "h-4 w-4" }), " Add to Cart"] }), _jsx("button", { onClick: () => setCustomItemOpen(false), className: "h-10 rounded-md border border-input px-4 text-sm text-muted-foreground hover:bg-accent", children: "Cancel" })] })] }) }) })) : (_jsxs("button", { onClick: () => setCustomItemOpen(true), className: "flex h-10 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-foreground", children: [_jsx(Plus, { className: "h-4 w-4" }), " Custom Item"] })) })] }), _jsxs("div", { className: "flex w-[360px] flex-col bg-card lg:w-[400px]", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-border px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ShoppingCart, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("span", { className: "text-sm font-medium", children: ["Cart (", cart.length, ")"] })] }), cart.length > 0 && (_jsx("button", { onClick: clearCart, className: "text-xs text-muted-foreground hover:text-destructive", children: "Clear" }))] }), _jsx("div", { className: "flex-1 overflow-y-auto px-4 py-2", children: cart.length === 0 ? (_jsx("div", { className: "flex h-full items-center justify-center text-sm text-muted-foreground", children: "Tap a product to add it" })) : (_jsx("div", { className: "space-y-2", children: cart.map((item, index) => (_jsxs("div", { className: "flex items-start gap-3 rounded-md border border-border p-2", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium leading-tight truncate", children: item.productName }), item.artistName && (_jsxs("p", { className: "text-xs text-muted-foreground", children: ["by ", item.artistName] })), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["$", item.unitPrice.toFixed(2), " each"] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: () => updateQuantity(index, -1), className: "flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-accent", children: _jsx(Minus, { className: "h-3 w-3" }) }), _jsx("span", { className: "w-8 text-center text-sm font-medium", children: item.quantity }), _jsx("button", { onClick: () => updateQuantity(index, 1), className: "flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-accent", children: _jsx(Plus, { className: "h-3 w-3" }) })] }), _jsxs("div", { className: "flex flex-col items-end gap-1", children: [_jsxs("span", { className: "text-sm font-medium", children: ["$", (item.unitPrice * item.quantity).toFixed(2)] }), _jsx("button", { onClick: () => removeItem(index), className: "rounded p-0.5 text-muted-foreground hover:text-destructive", children: _jsx(X, { className: "h-3.5 w-3.5" }) })] })] }, index))) })) }), _jsx("div", { className: "border-t border-border px-4 py-3", children: _jsxs("div", { className: "space-y-1 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: "Subtotal" }), _jsxs("span", { children: ["$", subtotal.toFixed(2)] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: "Tax (7.75%)" }), _jsxs("span", { children: ["$", taxAmount.toFixed(2)] })] }), _jsx("div", { className: "my-2 border-t border-border" }), _jsxs("div", { className: "flex justify-between text-lg font-bold", children: [_jsx("span", { children: "Total" }), _jsxs("span", { children: ["$", total.toFixed(2)] })] })] }) }), _jsxs("div", { className: "grid grid-cols-2 gap-2 border-t border-border p-4", children: [_jsx("button", { onClick: handleCardPayment, disabled: cart.length === 0 || processing, className: "flex h-14 items-center justify-center gap-2 rounded-lg bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50", children: processing ? (_jsx(Loader2, { className: "h-5 w-5 animate-spin" })) : (_jsxs(_Fragment, { children: [_jsx(CreditCard, { className: "h-5 w-5" }), "Card"] })) }), _jsxs("button", { onClick: () => setCashModalOpen(true), disabled: cart.length === 0 || processing, className: "flex h-14 items-center justify-center gap-2 rounded-lg bg-green-600 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50", children: [_jsx(Banknote, { className: "h-5 w-5" }), "Cash"] }), _jsxs("button", { onClick: () => {
                                            // For split, open cash modal — remainder goes to card
                                            setCashModalOpen(true);
                                        }, disabled: cart.length === 0 || processing, className: "col-span-2 flex h-12 items-center justify-center gap-2 rounded-lg border border-border font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50", children: [_jsx(SplitSquareVertical, { className: "h-5 w-5" }), "Split Payment"] })] })] })] }), lastSale && (_jsxs("div", { className: "flex items-center justify-center gap-3 border-t border-border bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground", children: ["Last sale: ", _jsx("strong", { children: lastSale.receiptNumber }), " | ", lastSale.total, " | ", lastSale.paymentMethod] })), cashModalOpen && (_jsx(CashTenderModal, { total: total, onConfirm: handleCashPayment, onClose: () => setCashModalOpen(false) })), receiptModalOpen && lastReceipt && (_jsx(ReceiptModal, { receipt: lastReceipt, basePath: basePath, onClose: () => setReceiptModalOpen(false) }))] }));
}
export default POSRegister;
//# sourceMappingURL=POSRegister.js.map
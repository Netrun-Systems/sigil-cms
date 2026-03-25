import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * POSProducts — Manage quick-add product catalog for POS
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Loader2, Package, Save, X } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
const CATEGORIES = ['Ceramics', 'Paintings', 'Jewelry', 'Textiles', 'Cards', 'Sculptures', 'Other'];
export function POSProducts() {
    const { siteId } = useParams();
    const basePath = `/sites/${siteId}`;
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    // Form state
    const [form, setForm] = useState({
        name: '', sku: '', price: '', category: '', artistName: '',
        commissionRate: '0.60', barcode: '', imageUrl: '',
    });
    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get(`${basePath}/pos/products?active=all`);
            setProducts(res.data ?? []);
        }
        catch {
            // empty
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [siteId]);
    const resetForm = () => {
        setForm({ name: '', sku: '', price: '', category: '', artistName: '', commissionRate: '0.60', barcode: '', imageUrl: '' });
        setEditingId(null);
        setShowForm(false);
    };
    const startEdit = (p) => {
        setForm({
            name: p.name,
            sku: p.sku || '',
            price: p.price,
            category: p.category || '',
            artistName: p.artist_name || '',
            commissionRate: p.commission_rate || '0.60',
            barcode: p.barcode || '',
            imageUrl: p.image_url || '',
        });
        setEditingId(p.id);
        setShowForm(true);
    };
    const handleSave = async () => {
        if (!form.name || !form.price)
            return;
        setSaving(true);
        try {
            if (editingId) {
                await api.put(`${basePath}/pos/products/${editingId}`, {
                    name: form.name,
                    sku: form.sku || null,
                    price: Number(form.price),
                    category: form.category || null,
                    artistName: form.artistName || null,
                    commissionRate: form.commissionRate ? Number(form.commissionRate) : null,
                    barcode: form.barcode || null,
                    imageUrl: form.imageUrl || null,
                });
            }
            else {
                await api.post(`${basePath}/pos/products`, {
                    name: form.name,
                    sku: form.sku || null,
                    price: Number(form.price),
                    category: form.category || null,
                    artistName: form.artistName || null,
                    commissionRate: form.commissionRate ? Number(form.commissionRate) : null,
                    barcode: form.barcode || null,
                    imageUrl: form.imageUrl || null,
                });
            }
            resetForm();
            load();
        }
        catch {
            // error
        }
        finally {
            setSaving(false);
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('Remove this product from POS?'))
            return;
        try {
            await api.delete(`${basePath}/pos/products/${id}`);
            setProducts((prev) => prev.filter((p) => p.id !== id));
        }
        catch {
            // keep
        }
    };
    const filtered = products.filter((p) => {
        if (!search)
            return true;
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.artist_name?.toLowerCase().includes(q)) || (p.sku?.toLowerCase().includes(q));
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "POS Products" }), _jsxs("button", { onClick: () => { resetForm(); setShowForm(true); }, className: "flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90", children: [_jsx(Plus, { className: "h-4 w-4" }), " Add Product"] })] }), showForm && (_jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsx("h3", { className: "mb-4 text-sm font-medium", children: editingId ? 'Edit Product' : 'New Product' }), _jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm text-muted-foreground", children: "Name *" }), _jsx("input", { value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), className: "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm", placeholder: "Ceramic Vase" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm text-muted-foreground", children: "Price *" }), _jsx("input", { type: "number", step: "0.01", min: "0", value: form.price, onChange: (e) => setForm({ ...form, price: e.target.value }), className: "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm", placeholder: "45.00" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm text-muted-foreground", children: "Category" }), _jsxs("select", { value: form.category, onChange: (e) => setForm({ ...form, category: e.target.value }), className: "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm", children: [_jsx("option", { value: "", children: "Select..." }), CATEGORIES.map((c) => _jsx("option", { value: c, children: c }, c))] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm text-muted-foreground", children: "Artist Name" }), _jsx("input", { value: form.artistName, onChange: (e) => setForm({ ...form, artistName: e.target.value }), className: "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm", placeholder: "Maria L." })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm text-muted-foreground", children: "Commission Rate" }), _jsx("input", { type: "number", step: "0.01", min: "0", max: "1", value: form.commissionRate, onChange: (e) => setForm({ ...form, commissionRate: e.target.value }), className: "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm", placeholder: "0.60" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm text-muted-foreground", children: "SKU" }), _jsx("input", { value: form.sku, onChange: (e) => setForm({ ...form, sku: e.target.value }), className: "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm", placeholder: "POP-CER-001" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm text-muted-foreground", children: "Barcode" }), _jsx("input", { value: form.barcode, onChange: (e) => setForm({ ...form, barcode: e.target.value }), className: "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm", placeholder: "Optional barcode" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm text-muted-foreground", children: "Image URL" }), _jsx("input", { value: form.imageUrl, onChange: (e) => setForm({ ...form, imageUrl: e.target.value }), className: "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm", placeholder: "https://..." })] })] }), _jsxs("div", { className: "mt-4 flex gap-2", children: [_jsxs("button", { onClick: handleSave, disabled: !form.name || !form.price || saving, className: "flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50", children: [saving ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : _jsx(Save, { className: "h-4 w-4" }), editingId ? 'Update' : 'Create'] }), _jsxs("button", { onClick: resetForm, className: "flex h-9 items-center gap-2 rounded-md border border-input px-4 text-sm hover:bg-accent", children: [_jsx(X, { className: "h-4 w-4" }), " Cancel"] })] })] }) })), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "relative max-w-md", children: [_jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), _jsx("input", { placeholder: "Search products...", value: search, onChange: (e) => setSearch(e.target.value), className: "flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm" })] }) }) }), loading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : filtered.length === 0 ? (_jsxs("div", { className: "flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground", children: [_jsx(Package, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm", children: products.length === 0 ? 'No products yet' : 'No matches' })] })) : (_jsx(Card, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border", children: [_jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Product" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Price" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Category" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Artist" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Commission" }), _jsx("th", { className: "px-6 py-3 w-[100px]" })] }) }), _jsx("tbody", { children: filtered.map((product) => (_jsxs("tr", { className: cn('group border-b border-border last:border-0 hover:bg-accent/50', !product.is_active && 'opacity-50'), children: [_jsx("td", { className: "px-6 py-3", children: _jsxs("div", { className: "flex items-center gap-3", children: [product.image_url ? (_jsx("img", { src: product.image_url, alt: "", className: "h-8 w-8 rounded object-cover" })) : (_jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary", children: _jsx(Package, { className: "h-4 w-4" }) })), _jsxs("div", { children: [_jsx("span", { className: "text-sm font-medium", children: product.name }), product.sku && _jsx("p", { className: "text-xs text-muted-foreground", children: product.sku })] })] }) }), _jsxs("td", { className: "px-6 py-3 text-sm font-medium", children: ["$", Number(product.price).toFixed(2)] }), _jsx("td", { className: "px-6 py-3 text-sm text-muted-foreground", children: product.category || '-' }), _jsx("td", { className: "px-6 py-3 text-sm text-muted-foreground", children: product.artist_name || '-' }), _jsx("td", { className: "px-6 py-3 text-sm text-muted-foreground", children: product.commission_rate ? `${(Number(product.commission_rate) * 100).toFixed(0)}%` : '-' }), _jsx("td", { className: "px-6 py-3", children: _jsxs("div", { className: "flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100", children: [_jsx("button", { onClick: () => startEdit(product), className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground", children: _jsx(Pencil, { className: "h-4 w-4" }) }), _jsx("button", { onClick: () => handleDelete(product.id), className: "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive", children: _jsx(Trash2, { className: "h-4 w-4" }) })] }) })] }, product.id))) })] }) }) }))] }));
}
export default POSProducts;
//# sourceMappingURL=POSProducts.js.map
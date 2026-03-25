/**
 * POSProducts — Manage quick-add product catalog for POS
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Loader2, Package, Save, X } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';

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
  is_active: boolean;
  sort_order: number;
}

const CATEGORIES = ['Ceramics', 'Paintings', 'Jewelry', 'Textiles', 'Cards', 'Sculptures', 'Other'];

export function POSProducts() {
  const { siteId } = useParams<{ siteId: string }>();
  const basePath = `/sites/${siteId}`;

  const [products, setProducts] = useState<PosProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
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
      const res = await api.get<{ data: PosProduct[] }>(`${basePath}/pos/products?active=all`);
      setProducts(res.data ?? []);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [siteId]);

  const resetForm = () => {
    setForm({ name: '', sku: '', price: '', category: '', artistName: '', commissionRate: '0.60', barcode: '', imageUrl: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (p: PosProduct) => {
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
    if (!form.name || !form.price) return;
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
      } else {
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
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this product from POS?')) return;
    try {
      await api.delete(`${basePath}/pos/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // keep
    }
  };

  const filtered = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.artist_name?.toLowerCase().includes(q)) || (p.sku?.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">POS Products</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Product form */}
      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-4 text-sm font-medium">{editingId ? 'Edit Product' : 'New Product'}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  placeholder="Ceramic Vase"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  placeholder="45.00"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select...</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Artist Name</label>
                <input
                  value={form.artistName}
                  onChange={(e) => setForm({ ...form, artistName: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  placeholder="Maria L."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Commission Rate</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={form.commissionRate}
                  onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  placeholder="0.60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">SKU</label>
                <input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  placeholder="POP-CER-001"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Barcode</label>
                <input
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  placeholder="Optional barcode"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Image URL</label>
                <input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleSave}
                disabled={!form.name || !form.price || saving}
                className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                onClick={resetForm}
                className="flex h-9 items-center gap-2 rounded-md border border-input px-4 text-sm hover:bg-accent"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products table */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Package className="h-8 w-8" />
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
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Artist</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Commission</th>
                  <th className="px-6 py-3 w-[100px]"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id} className={cn(
                    'group border-b border-border last:border-0 hover:bg-accent/50',
                    !product.is_active && 'opacity-50'
                  )}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary">
                            <Package className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <span className="text-sm font-medium">{product.name}</span>
                          {product.sku && <p className="text-xs text-muted-foreground">{product.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm font-medium">${Number(product.price).toFixed(2)}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{product.category || '-'}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{product.artist_name || '-'}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {product.commission_rate ? `${(Number(product.commission_rate) * 100).toFixed(0)}%` : '-'}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => startEdit(product)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
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

export default POSProducts;

'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Pencil, Trash2, X, Save, Loader2 } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    price_2: number;
    stock: number;
    image_url: string;
    category_id: string | null;
    weight: number;
    length: number;
    width: number;
    height: number;
    created_at: string;
}

interface Category {
    id: string;
    name: string;
    parent_id: string | null;
}

const emptyProduct = {
    name: '', description: '', price: 0, price_2: 0, stock: 0, image_url: '',
    category_id: '' as string, weight: 1, length: 20, width: 20, height: 20,
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState(emptyProduct);
    const [saving, setSaving] = useState(false);
    const [filterCategory, setFilterCategory] = useState('');

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/admin/products');
        if (res.ok) {
            const data = await res.json();
            setProducts(data.products || []);
        }
        setLoading(false);
    }, []);

    const fetchCategories = useCallback(async () => {
        const res = await fetch('/api/admin/categories');
        if (res.ok) {
            const data = await res.json();
            setCategories(data.categories || []);
        }
    }, []);

    useEffect(() => { fetchProducts(); fetchCategories(); }, [fetchProducts, fetchCategories]);

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

    const getCategoryName = (categoryId: string | null) => {
        if (!categoryId) return '—';
        const cat = categories.find(c => c.id === categoryId);
        if (!cat) return '—';
        if (cat.parent_id) {
            const parent = categories.find(c => c.id === cat.parent_id);
            return parent ? `${parent.name} → ${cat.name}` : cat.name;
        }
        return cat.name;
    };

    const parentCategories = categories.filter(c => !c.parent_id);
    const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

    const openNew = () => {
        setEditingId(null);
        setFormData(emptyProduct);
        setShowForm(true);
    };

    const openEdit = (p: Product) => {
        setEditingId(p.id);
        setFormData({
            name: p.name, description: p.description || '', price: p.price, price_2: p.price_2 || 0, stock: p.stock,
            image_url: p.image_url || '', category_id: p.category_id || '', weight: p.weight, length: p.length, width: p.width, height: p.height,
        });
        setShowForm(true);
    };

    const handleSave = async () => {
        setSaving(true);
        const method = editingId ? 'PUT' : 'POST';
        const body = editingId ? { ...formData, id: editingId } : formData;

        const res = await fetch('/api/admin/products', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (res.ok) {
            setShowForm(false);
            fetchProducts();
        } else {
            const err = await res.json();
            alert('Erro: ' + err.error);
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deletar esse produto?')) return;
        const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
        if (res.ok) fetchProducts();
    };

    const filteredProducts = filterCategory
        ? products.filter(p => p.category_id === filterCategory)
        : products;

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-urbanist text-foreground">Produtos</h1>
                    <p className="text-muted-foreground">Gerencie o catálogo da sua loja.</p>
                </div>
                <button onClick={openNew} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm">
                    <Plus size={18} /> Novo Produto
                </button>
            </div>

            {/* Filter by category */}
            {categories.length > 0 && (
                <div className="mb-6">
                    <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="rounded-lg border border-input bg-card px-4 py-2.5 text-sm shadow-sm"
                    >
                        <option value="">Todas as categorias</option>
                        {parentCategories.map(cat => (
                            <optgroup key={cat.id} label={cat.name}>
                                <option value={cat.id}>{cat.name} (todas)</option>
                                {getSubcategories(cat.id).map(sub => (
                                    <option key={sub.id} value={sub.id}>↳ {sub.name}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>
            )}

            {/* Product Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
                    <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h2 className="font-urbanist font-bold text-xl">{editingId ? 'Editar Produto' : 'Novo Produto'}</h2>
                            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Nome do Produto</label>
                                <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm" placeholder="Ex: Camiseta Five Store" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Descrição</label>
                                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm resize-none" placeholder="Descrição longa do produto..." />
                            </div>

                            {/* Category Selector */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Categoria</label>
                                <select
                                    value={formData.category_id}
                                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm"
                                >
                                    <option value="">Sem categoria</option>
                                    {parentCategories.map(cat => (
                                        <optgroup key={cat.id} label={cat.name}>
                                            <option value={cat.id}>{cat.name}</option>
                                            {getSubcategories(cat.id).map(sub => (
                                                <option key={sub.id} value={sub.id}>↳ {sub.name}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>

                            {/* Price Tables */}
                            <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 space-y-3">
                                <p className="text-sm font-semibold text-primary">Tabelas de Preço</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Tabela 1 (R$)</label>
                                        <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Tabela 2 (R$)</label>
                                        <input type="number" step="0.01" value={formData.price_2} onChange={e => setFormData({ ...formData, price_2: Number(e.target.value) })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Estoque</label>
                                <input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">URL da Imagem</label>
                                <input value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm" placeholder="https://..." />
                            </div>

                            <div className="border-t border-border pt-4">
                                <p className="text-sm font-medium text-muted-foreground mb-3">Dimensões para Frete</p>
                                <div className="grid grid-cols-4 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Peso (kg)</label>
                                        <input type="number" step="0.01" value={formData.weight} onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })} className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Comp. (cm)</label>
                                        <input type="number" value={formData.length} onChange={e => setFormData({ ...formData, length: Number(e.target.value) })} className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Larg. (cm)</label>
                                        <input type="number" value={formData.width} onChange={e => setFormData({ ...formData, width: Number(e.target.value) })} className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Alt. (cm)</label>
                                        <input type="number" value={formData.height} onChange={e => setFormData({ ...formData, height: Number(e.target.value) })} className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button onClick={handleSave} disabled={saving || !formData.name || !formData.price} className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                            {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : <><Save size={16} /> {editingId ? 'Salvar Alterações' : 'Criar Produto'}</>}
                        </button>
                    </div>
                </div>
            )}

            {/* Products Table */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20">
                    <Package size={48} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-urbanist font-bold text-xl mb-2">Nenhum produto encontrado</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                        {filterCategory ? 'Nenhum produto nesta categoria.' : 'Comece adicionando seu primeiro produto ao catálogo.'}
                    </p>
                    <button onClick={openNew} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold text-sm">
                        <Plus size={16} className="inline mr-2" /> Adicionar Produto
                    </button>
                </div>
            ) : (
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Produto</th>
                                    <th className="px-6 py-4 font-medium">Categoria</th>
                                    <th className="px-6 py-4 font-medium text-right">Tabela 1</th>
                                    <th className="px-6 py-4 font-medium text-right">Tabela 2</th>
                                    <th className="px-6 py-4 font-medium text-center">Estoque</th>
                                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((p) => (
                                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-muted rounded-md overflow-hidden flex-shrink-0">
                                                    {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{p.name}</p>
                                                    <p className="text-xs text-muted-foreground line-clamp-1">{p.description || 'Sem descrição'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-medium text-muted-foreground">{getCategoryName(p.category_id)}</span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-right">{formatPrice(p.price)}</td>
                                        <td className="px-6 py-4 font-semibold text-right text-muted-foreground">{formatPrice(p.price_2 || 0)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {p.stock > 0 ? p.stock : 'Esgotado'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEdit(p)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Pencil size={16} /></button>
                                                <button onClick={() => handleDelete(p.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

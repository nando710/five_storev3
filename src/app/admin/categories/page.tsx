'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { useState, useEffect, useCallback } from 'react';
import { FolderTree, Plus, Pencil, Trash2, X, Save, Loader2, ChevronRight } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    parent_id: string | null;
    custom_id: string | null;
    tax_percentage: number;
    tax_name: string | null;
    created_at: string;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formName, setFormName] = useState('');
    const [formParentId, setFormParentId] = useState<string | null>(null);
    const [formCustomId, setFormCustomId] = useState('');
    const [formTax, setFormTax] = useState(0);
    const [formTaxName, setFormTaxName] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/admin/categories');
        if (res.ok) {
            const data = await res.json();
            setCategories(data.categories || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    const parentCategories = categories.filter(c => !c.parent_id);
    const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

    const openNew = (parentId: string | null = null) => {
        setEditingId(null);
        setFormName('');
        setFormCustomId('');
        setFormParentId(parentId);
        setFormTax(0);
        setFormTaxName('');
        setShowForm(true);
    };

    const openEdit = (cat: Category) => {
        setEditingId(cat.id);
        setFormName(cat.name);
        setFormCustomId(cat.custom_id || '');
        setFormParentId(cat.parent_id);
        setFormTax(cat.tax_percentage || 0);
        setFormTaxName(cat.tax_name || '');
        setShowForm(true);
    };

    const handleSave = async () => {
        setSaving(true);
        const method = editingId ? 'PUT' : 'POST';
        const body = editingId
            ? { id: editingId, name: formName, custom_id: formCustomId, parent_id: formParentId, tax_percentage: formTax, tax_name: formTaxName }
            : { name: formName, custom_id: formCustomId, parent_id: formParentId, tax_percentage: formTax, tax_name: formTaxName };

        const res = await fetch('/api/admin/categories', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (res.ok) {
            setShowForm(false);
            fetchCategories();
        } else {
            const err = await res.json();
            alert('Erro: ' + err.error);
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        const subs = getSubcategories(id);
        if (subs.length > 0) {
            alert('Não é possível excluir uma categoria que possui subcategorias. Exclua as subcategorias primeiro.');
            return;
        }
        if (!confirm('Excluir essa categoria?')) return;
        const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
        if (res.ok) fetchCategories();
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-urbanist text-foreground">Categorias</h1>
                    <p className="text-muted-foreground">Organize seus produtos em categorias e subcategorias.</p>
                </div>
                <button onClick={() => openNew(null)} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm">
                    <Plus size={18} /> Nova Categoria
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
                    <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h2 className="font-urbanist font-bold text-xl">
                                {editingId ? 'Editar' : formParentId ? 'Nova Subcategoria' : 'Nova Categoria'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Nome da Categoria</label>
                                    <input value={formName} onChange={e => setFormName(e.target.value)} className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm" placeholder="Ex: Roupas" autoFocus />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium border-b border-primary/20 pb-1 flex w-fit">ID Personalizado (Opcional)</label>
                                    <input value={formCustomId} onChange={e => setFormCustomId(e.target.value)} className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm" placeholder="Ex: T-SHIRT-MASC" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Categoria Pai (opcional)</label>
                                    <select
                                        value={formParentId || ''}
                                        onChange={e => setFormParentId(e.target.value || null)}
                                        className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm"
                                    >
                                        <option value="">— Nenhuma (raiz)</option>
                                        {parentCategories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4">
                                <h3 className="text-sm font-semibold flex items-center gap-2">Configuração de Taxa <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Opcional</span></h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-muted-foreground">Nome da Taxa (Ex: ISS)</label>
                                        <input type="text" value={formTaxName} onChange={e => setFormTaxName(e.target.value)} className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm" placeholder="Taxa de Serviço" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-muted-foreground">Valor (%)</label>
                                        <input type="number" step="0.01" min="0" value={formTax} onChange={e => setFormTax(parseFloat(e.target.value) || 0)} className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm" placeholder="0.00" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button onClick={handleSave} disabled={saving || !formName.trim()} className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                            {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : <><Save size={16} /> {editingId ? 'Salvar' : 'Criar'}</>}
                        </button>
                    </div>
                </div>
            )}

            {/* Categories List */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
            ) : parentCategories.length === 0 ? (
                <div className="text-center py-20">
                    <FolderTree size={48} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-urbanist font-bold text-xl mb-2">Nenhuma categoria criada</h3>
                    <p className="text-muted-foreground text-sm mb-6">Crie categorias para organizar seus produtos.</p>
                    <button onClick={() => openNew(null)} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold text-sm">
                        <Plus size={16} className="inline mr-2" /> Criar Categoria
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {parentCategories.map(cat => {
                        const subs = getSubcategories(cat.id);
                        return (
                            <div key={cat.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                                {/* Parent Category */}
                                <div className="flex items-center justify-between px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <FolderTree size={16} className="text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold flex items-center gap-2">
                                                {cat.name}
                                                {cat.custom_id && (
                                                    <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-md font-mono border border-primary/30">
                                                        {cat.custom_id}
                                                    </span>
                                                )}
                                                {cat.tax_percentage > 0 && <span className="bg-destructive/10 text-destructive text-[10px] px-2 py-0.5 rounded-full font-bold">+{cat.tax_percentage}% {cat.tax_name || 'Taxa'}</span>}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{subs.length} subcategoria(s)</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openNew(cat.id)} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary/5 text-primary border border-primary/20 hover:bg-primary/10 transition-colors" title="Adicionar subcategoria">
                                            <Plus size={14} className="inline mr-1" /> Sub
                                        </button>
                                        <button onClick={() => openEdit(cat)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Pencil size={16} /></button>
                                        <button onClick={() => handleDelete(cat.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>

                                {/* Subcategories */}
                                {subs.length > 0 && (
                                    <div className="border-t border-border bg-muted/30">
                                        {subs.map(sub => (
                                            <div key={sub.id} className="flex items-center justify-between px-6 py-3 pl-14 border-b border-border/50 last:border-0">
                                                <div className="flex items-center gap-2">
                                                    <ChevronRight size={14} className="text-muted-foreground" />
                                                    <span className="text-sm">{sub.name}</span>
                                                    {sub.custom_id && (
                                                        <span className="bg-muted text-foreground text-[10px] px-1.5 py-0.5 rounded-md font-mono hidden sm:inline-block border border-border">
                                                            {sub.custom_id}
                                                        </span>
                                                    )}
                                                    {sub.tax_percentage > 0 && <span className="bg-destructive/10 text-destructive text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 hidden sm:inline-block">+{sub.tax_percentage}% {sub.tax_name || 'Taxa'}</span>}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => openEdit(sub)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Pencil size={14} /></button>
                                                    <button onClick={() => handleDelete(sub.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </AdminLayout>
    );
}

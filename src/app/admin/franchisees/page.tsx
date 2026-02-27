'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { useState, useEffect, useCallback } from 'react';
import { Users, Loader2, CheckCircle, XCircle, Clock, ChevronDown } from 'lucide-react';

interface Franchisee {
    id: string;
    name: string;
    email: string;
    document: string;
    phone: string;
    status: string;
    price_table: number;
    created_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    approved: { label: 'Aprovado', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    rejected: { label: 'Recusado', color: 'bg-red-100 text-red-800 border-red-200' },
};

export default function FranchiseesPage() {
    const [franchisees, setFranchisees] = useState<Franchisee[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFranchisees = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/admin/franchisees');
        if (res.ok) {
            const data = await res.json();
            setFranchisees(data.franchisees || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchFranchisees(); }, [fetchFranchisees]);

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

    const handleUpdate = async (id: string, updates: Record<string, any>) => {
        const res = await fetch('/api/admin/franchisees', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...updates }),
        });
        if (res.ok) fetchFranchisees();
    };

    const pendingCount = franchisees.filter(f => (f.status || 'pending') === 'pending').length;

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-urbanist text-foreground">Franqueados</h1>
                <p className="text-muted-foreground">Gerencie os cadastros, aprovações e tabelas de preço dos franqueados.</p>
                {pendingCount > 0 && (
                    <div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 text-yellow-800 border border-yellow-200 px-4 py-2 rounded-lg text-sm font-medium">
                        <Clock size={16} />
                        {pendingCount} cadastro(s) aguardando aprovação
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
            ) : franchisees.length === 0 ? (
                <div className="text-center py-20">
                    <Users size={48} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-urbanist font-bold text-xl mb-2">Nenhum franqueado cadastrado</h3>
                    <p className="text-muted-foreground text-sm">Quando um franqueado se registrar, ele aparecerá aqui.</p>
                </div>
            ) : (
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Nome</th>
                                    <th className="px-6 py-4 font-medium">Contato</th>
                                    <th className="px-6 py-4 font-medium">Documento</th>
                                    <th className="px-6 py-4 font-medium text-center">Tabela de Preço</th>
                                    <th className="px-6 py-4 font-medium text-center">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {franchisees.map((f) => {
                                    const status = f.status || 'pending';
                                    const priceTable = f.price_table || 1;
                                    return (
                                        <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-medium">{f.name}</p>
                                                <p className="text-xs text-muted-foreground">{formatDate(f.created_at)}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm">{f.email}</p>
                                                <p className="text-xs text-muted-foreground">{f.phone || '-'}</p>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">{f.document}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="relative inline-block">
                                                    <select
                                                        value={priceTable}
                                                        onChange={(e) => handleUpdate(f.id, { price_table: Number(e.target.value) })}
                                                        className="appearance-none text-xs font-semibold px-3 py-1.5 pr-7 rounded-full border border-primary/30 bg-primary/5 text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                    >
                                                        <option value={1}>Tabela 1</option>
                                                        <option value={2}>Tabela 2</option>
                                                    </select>
                                                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-primary" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_MAP[status]?.color || 'bg-gray-100 text-gray-800'}`}>
                                                    {STATUS_MAP[status]?.label || status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {status !== 'approved' && (
                                                        <button
                                                            onClick={() => handleUpdate(f.id, { status: 'approved' })}
                                                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                                                        >
                                                            Aprovar
                                                        </button>
                                                    )}
                                                    {status !== 'rejected' && (
                                                        <button
                                                            onClick={() => handleUpdate(f.id, { status: 'rejected' })}
                                                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                                                        >
                                                            Recusar
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

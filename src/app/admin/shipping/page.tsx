'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';
import { Truck, Store, Loader2, Save, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ShippingConfig {
    id: string;
    name: string;
    active: boolean;
    price: number;
    delivery_time: number;
}

export default function ShippingAdmin() {
    const [configs, setConfigs] = useState<ShippingConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncCep, setSyncCep] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const res = await fetch('/api/admin/shipping');
            if (res.status === 401) {
                router.push('/auth');
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setConfigs(data.configs || []);
            }
        } catch (error) {
            console.error('Failed to fetch shipping configs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const body = syncCep ? JSON.stringify({ cep: syncCep }) : undefined;
            const res = await fetch('/api/admin/shipping', {
                method: 'POST',
                headers: body ? { 'Content-Type': 'application/json' } : undefined,
                body
            });
            if (res.status === 401) {
                router.push('/auth');
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setConfigs(data.configs || []);
                alert('Sincronização concluída com sucesso!');
            } else {
                alert('Erro ao sincronizar com a Frenet.');
            }
        } catch (error) {
            console.error('Sync error:', error);
            alert('Falha ao sincronizar. Tente novamente mais tarde.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSave = async (config: ShippingConfig) => {
        setSavingId(config.id);
        try {
            const res = await fetch('/api/admin/shipping', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: config.id,
                    active: config.active,
                    price: parseFloat(config.price.toString()),
                    deliveryTime: parseInt(config.delivery_time.toString(), 10)
                })
            });

            if (res.ok) {
                // Show success briefly
            } else {
                alert('Erro ao salvar configuração.');
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Erro ao salvar configuração.');
        } finally {
            setSavingId(null);
            fetchConfigs(); // Refresh in case of DB triggers or normal refresh
        }
    };

    const handleChange = (id: string, field: keyof ShippingConfig, value: any) => {
        setConfigs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-urbanist text-foreground flex items-center gap-3">
                        <Truck className="text-primary" size={32} />
                        Configurações de Frete
                    </h1>
                    <p className="text-muted-foreground mt-2">Ative ou desative as opções de entrega disponíveis para os franqueados no checkout. Para buscar transportadoras específicas de uma região, digite um CEP destino abaixo.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 md:mt-0">
                    <input
                        type="text"
                        placeholder="CEP Destino..."
                        value={syncCep}
                        onChange={e => setSyncCep(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-input bg-transparent text-sm w-full sm:w-40"
                        maxLength={9}
                    />
                    <button
                        onClick={handleSync}
                        disabled={isSyncing || loading}
                        className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-secondary/80 transition-colors shrink-0 disabled:opacity-70 justify-center shadow-sm"
                    >
                        <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing ? 'Buscando Transportadoras...' : 'Sincronizar com a Frenet'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {configs.map((config) => (
                    <div key={config.id} className={`bg-card border rounded-xl p-6 transition-all ${config.active ? 'border-primary/50 shadow-sm ring-1 ring-primary/10' : 'border-border opacity-75'}`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${config.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                    {config.id === 'pickup' ? <Store size={24} /> : <Truck size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold font-urbanist">{config.name}</h3>
                                    <p className="text-sm text-muted-foreground">ID Interno: {config.id}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-end gap-4 flex-1 md:justify-end">

                                {config.id === 'pickup' && (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">Taxa Fixa (R$)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={config.price}
                                                onChange={(e) => handleChange(config.id, 'price', e.target.value)}
                                                className="w-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">Prazo (Dias)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={config.delivery_time}
                                                onChange={(e) => handleChange(config.id, 'delivery_time', e.target.value)}
                                                className="w-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground block text-center">Status</label>
                                    <button
                                        onClick={() => handleChange(config.id, 'active', !config.active)}
                                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${config.active ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                    >
                                        {config.active ? 'Ativo' : 'Inativo'}
                                    </button>
                                </div>

                                <button
                                    onClick={() => handleSave(config)}
                                    disabled={savingId === config.id}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 h-9 min-w-[100px] justify-center"
                                >
                                    {savingId === config.id ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <>
                                            <Save size={16} /> Salvar
                                        </>
                                    )}
                                </button>
                            </div>

                        </div>
                    </div>
                ))}

                {configs.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl border-border">
                        Nenhuma configuração de frete encontrada no banco de dados.
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Settings as SettingsIcon, Store, Save, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
    const [saving, setSaving] = useState(false);

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-urbanist text-foreground">Configurações</h1>
                <p className="text-muted-foreground">Gerencie as configurações da sua loja.</p>
            </div>

            <div className="space-y-6 max-w-2xl">
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary"><Store size={20} /></div>
                        <h2 className="font-urbanist font-bold text-lg">Dados da Loja</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Nome da Loja</label>
                            <input defaultValue="Five Store" className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">CEP de Origem (Remetente)</label>
                            <input defaultValue="01001000" className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="CEP do armazém/loja para cálculo de frete" />
                        </div>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary"><SettingsIcon size={20} /></div>
                        <h2 className="font-urbanist font-bold text-lg">Preferências</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                            <div>
                                <p className="text-sm font-medium">Notificações por Email</p>
                                <p className="text-xs text-muted-foreground">Receba alertas de novos pedidos no seu email.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                            <div>
                                <p className="text-sm font-medium">Loja Ativa</p>
                                <p className="text-xs text-muted-foreground">Sua loja é visível para os franqueados.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <button disabled={saving} className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-70">
                    {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : <><Save size={16} /> Salvar Configurações</>}
                </button>
            </div>
        </AdminLayout>
    );
}

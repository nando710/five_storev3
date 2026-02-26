import { DollarSign, ShoppingBag, Package, TrendingUp } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminOverview() {
    const stats = [
        { label: 'Vendas Totais', value: 'R$ 14.500,00', icon: DollarSign, trend: '+12% este mês' },
        { label: 'Pedidos Realizados', value: '142', icon: ShoppingBag, trend: '+5% este mês' },
        { label: 'Visitas na Loja', value: '3,420', icon: TrendingUp, trend: '+18% este mês' },
        { label: 'Produtos Ativos', value: '45', icon: Package, trend: 'Estável' },
    ];

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-urbanist text-foreground">Visão Geral</h1>
                <p className="text-muted-foreground">Acompanhe o desempenho da sua franquia Five Store.</p>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {stats.map((stat, i) => (
                    <div key={i} className="p-6 bg-card rounded-xl border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-sm text-muted-foreground">{stat.label}</h3>
                            <div className="p-2 bg-primary/10 rounded-md text-primary">
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-2xl font-bold font-urbanist">{stat.value}</span>
                            <span className="text-xs text-green-600 font-medium">{stat.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recentes */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h2 className="font-bold font-urbanist text-lg">Últimos Pedidos</h2>
                    <button className="text-sm text-primary font-medium hover:underline">Ver todos</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                            <tr>
                                <th className="px-6 py-4 font-medium">Pedido</th>
                                <th className="px-6 py-4 font-medium">Cliente</th>
                                <th className="px-6 py-4 font-medium">Data</th>
                                <th className="px-6 py-4 font-medium text-right">Valor</th>
                                <th className="px-6 py-4 font-medium text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5].map((item) => (
                                <tr key={item} className="bg-card border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                                    <td className="px-6 py-4 font-medium text-primary">#ORD-90{item}2</td>
                                    <td className="px-6 py-4">João Silva</td>
                                    <td className="px-6 py-4 text-muted-foreground">26 Out 2026</td>
                                    <td className="px-6 py-4 font-medium text-right">R$ 254,90</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-green-200">
                                            Pago
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}

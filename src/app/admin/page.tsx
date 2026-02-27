'use client';

import { DollarSign, ShoppingBag, Package, TrendingUp, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Stats {
    totalSales: number;
    totalOrders: number;
    paidOrders: number;
    productCount: number;
}

export default function AdminOverview() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, ordersRes] = await Promise.all([
                    fetch('/api/admin/stats'),
                    fetch('/api/admin/orders'),
                ]);

                if (statsRes.status === 401 || ordersRes.status === 401) {
                    router.push('/auth');
                    return;
                }

                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData.stats);
                }

                if (ordersRes.ok) {
                    const ordersData = await ordersRes.json();
                    setOrders((ordersData.orders || []).slice(0, 5));
                }
            } catch (error) {
                console.error('Error fetching admin data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

    const STATUS_MAP: Record<string, { label: string; color: string }> = {
        PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        PAID: { label: 'Pago', color: 'bg-green-100 text-green-800 border-green-200' },
        SHIPPED: { label: 'Enviado', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        DELIVERED: { label: 'Entregue', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
        CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200' },
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
            </AdminLayout>
        );
    }

    const statCards = [
        { label: 'Vendas Totais', value: formatPrice(stats?.totalSales || 0), icon: DollarSign },
        { label: 'Pedidos Realizados', value: String(stats?.totalOrders || 0), icon: ShoppingBag },
        { label: 'Pedidos Pagos', value: String(stats?.paidOrders || 0), icon: TrendingUp },
        { label: 'Produtos Ativos', value: String(stats?.productCount || 0), icon: Package },
    ];

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-urbanist text-foreground">Painel da Franqueadora 👋</h1>
                <p className="text-muted-foreground">Acompanhe as vendas e gerencie sua loja Five Store.</p>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {statCards.map((stat, i) => (
                    <div key={i} className="p-6 bg-card rounded-xl border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-sm text-muted-foreground">{stat.label}</h3>
                            <div className="p-2 bg-primary/10 rounded-md text-primary">
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <span className="text-2xl font-bold font-urbanist">{stat.value}</span>
                    </div>
                ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h2 className="font-bold font-urbanist text-lg">Últimos Pedidos</h2>
                    <button onClick={() => router.push('/admin/orders')} className="text-sm text-primary font-medium hover:underline">Ver todos</button>
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
                            {orders.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Nenhum pedido recebido ainda.</td></tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="bg-card border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => router.push('/admin/orders')}>
                                        <td className="px-6 py-4 font-medium text-primary">#{order.id.slice(0, 8)}</td>
                                        <td className="px-6 py-4">{order.customer_name}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{formatDate(order.created_at)}</td>
                                        <td className="px-6 py-4 font-medium text-right">{formatPrice(order.total_amount)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_MAP[order.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                                                {STATUS_MAP[order.status]?.label || order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}

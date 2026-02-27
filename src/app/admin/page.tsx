'use client';

import { DollarSign, ShoppingBag, Package, TrendingUp, Loader2, AlertTriangle, Trophy } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    PieChart,
    Pie,
    Legend,
    Cell,
    BarChart,
    Bar,
    BarProps
} from 'recharts';

interface Stats {
    totalSales: number;
    totalOrders: number;
    paidOrders: number;
    productCount: number;
    averageTicket: number;
    averageShippingCost: number;
    cancellationRate: number;
    recentSales: any[];
    salesForecast: any[];
    salesByState: any[];
    salesByCategory: any[];
    topProducts: any[];
    topCustomers: any[];
    topFranchisees: any[];
    lowStock: any[];
    outOfStock: any[];
    statusDistribution: any[];
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
        PAID: { label: 'Pago', color: 'bg-purple-100 text-purple-800 border-purple-200' },
        SHIPPED: { label: 'Enviado', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        DELIVERED: { label: 'Entregue', color: 'bg-violet-100 text-violet-800 border-violet-200' },
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
        { label: 'Faturamento Total', value: formatPrice(stats?.totalSales || 0), icon: DollarSign },
        { label: 'Total de Pedidos', value: String(stats?.totalOrders || 0), icon: ShoppingBag },
        { label: 'Ticket Médio', value: formatPrice(stats?.averageTicket || 0), icon: TrendingUp },
        { label: 'Produtos Ativos', value: String(stats?.productCount || 0), icon: Package },
    ];

    // Combine recent sales and forecast for the chart
    const chartData = [
        ...(stats?.recentSales || []).map(s => ({ ...s, type: 'history' })),
        ...(stats?.salesForecast || []).map(s => ({ ...s, isForecast: s.revenue, type: 'forecast' }))
    ];

    return (
        <AdminLayout>
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold font-rubik text-foreground">Painel Administrativo</h1>
                    <p className="text-muted-foreground mt-1">Acompanhe as vendas e métricas em tempo real.</p>
                </div>
                <div className="flex gap-2">
                    {/* Placeholder for future date filters */}
                    <button className="px-4 py-2 bg-card border border-border/50 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">7 dias</button>
                    <button className="px-4 py-2 bg-primary/20 border border-primary/30 rounded-lg text-sm text-primary font-medium">14 dias</button>
                    <button className="px-4 py-2 bg-card border border-border/50 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">30 dias</button>
                </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {statCards.map((stat, i) => (
                    <div key={i} className="p-6 bg-card/80 backdrop-blur-md rounded-xl border border-white/20 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:border-primary/20 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-sm text-muted-foreground">{stat.label}</h3>
                            <div className="p-2 bg-primary/20 rounded-md text-primary shadow-sm" style={{ backgroundColor: i === 0 ? 'rgba(59,130,246,0.1)' : i === 1 ? 'rgba(139,92,246,0.1)' : i === 2 ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', color: i === 0 ? '#3b82f6' : i === 1 ? '#8b5cf6' : i === 2 ? '#10b981' : '#6366f1' }}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <span className="text-3xl font-bold font-rubik">{stat.value}</span>
                    </div>
                ))}
            </div>

            {/* Main Area Chart - Vendas por Período */}
            <div className="bg-card/80 backdrop-blur-md rounded-xl border border-white/20 shadow-sm overflow-hidden mb-8 p-6">
                <div className="mb-6">
                    <h2 className="font-bold font-rubik text-lg">Vendas por Período</h2>
                    <p className="text-sm text-muted-foreground">Faturamento diário e taxa de conversão</p>
                </div>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `R$ ${value}`} dx={-10} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#10b981' }} tickFormatter={(value) => `${value}%`} dx={10} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(30,41,59,0.9)', backdropFilter: 'blur(8px)', color: '#fff' }}
                                itemStyle={{ color: '#e2e8f0' }}
                                formatter={(value: any, name: any) => {
                                    if (name === "conversionRate") return [`${value}%`, 'Conversão'];
                                    return [formatPrice(Number(value) || 0), 'Faturamento'];
                                }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            <Area type="monotone" dataKey="revenue" name="Receita" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" connectNulls />
                            <Area type="monotone" dataKey="isForecast" name="Projeção" stroke="#94a3b8" strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorForecast)" connectNulls />
                            <Area yAxisId="right" type="monotone" dataKey="conversionRate" name="Conversão" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" fillOpacity={0} connectNulls />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Split Row 1: Status & Categories */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-8">
                {/* Pedidos por Status */}
                <div className="bg-card/80 backdrop-blur-md rounded-xl border border-white/20 shadow-sm overflow-hidden p-6">
                    <div className="mb-2">
                        <h2 className="font-bold font-rubik text-lg">Pedidos por Status</h2>
                        <p className="text-sm text-muted-foreground">Distribuição de tickets nos últimos 14 dias</p>
                    </div>
                    <div className="h-[280px] w-full flex justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.statusDistribution || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={75}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(stats?.statusDistribution || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'rgba(30,41,59,0.9)', backdropFilter: 'blur(8px)', color: '#fff' }}
                                    formatter={(value: any, name: any) => [value, STATUS_MAP[name]?.label || name]}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    layout="horizontal"
                                    formatter={(value: any) => <span className="text-sm text-muted-foreground ml-1">{STATUS_MAP[value]?.label || value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Vendas por Categoria */}
                <div className="bg-card/80 backdrop-blur-md rounded-xl border border-white/20 shadow-sm overflow-hidden p-6">
                    <div className="mb-2">
                        <h2 className="font-bold font-rubik text-lg">Vendas por Categoria</h2>
                        <p className="text-sm text-muted-foreground">Faturamento agregado por categoria base</p>
                    </div>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.salesByCategory?.slice(0, 6) || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#cbd5e1' }} width={110} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'rgba(30,41,59,0.9)', backdropFilter: 'blur(8px)', color: '#fff' }}
                                    formatter={(value: any) => [formatPrice(Number(value) || 0), 'Faturamento']}
                                />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Top 10 Products Row */}
            <div className="bg-card/80 backdrop-blur-md rounded-xl border border-white/20 shadow-sm overflow-hidden mb-8 p-6">
                <div className="mb-6">
                    <h2 className="font-bold font-rubik text-lg">Top 10 Produtos Mais Vendidos</h2>
                    <p className="text-sm text-muted-foreground">Ranking de vendas por volume monetário</p>
                </div>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.topProducts || []} margin={{ top: 10, right: 30, left: 20, bottom: 0 }} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v / 1000}k`} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#cbd5e1' }} width={150} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'rgba(30,41,59,0.9)', backdropFilter: 'blur(8px)', color: '#fff' }}
                                formatter={(value: any, name: any, props: any) => {
                                    return [
                                        `${formatPrice(Number(value))} (${props.payload.volume} un.)`,
                                        'Vendas'
                                    ];
                                }}
                            />
                            <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Secondary Metric Cards & Area Stats */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-8">
                {/* Taxa Cancelamento */}
                <div className="bg-card/80 backdrop-blur-md rounded-xl border border-white/20 shadow-sm overflow-hidden p-6 flex flex-col justify-center items-center text-center">
                    <h3 className="font-medium text-sm text-muted-foreground mb-4">Taxa de Cancelamento</h3>
                    <span className="text-4xl font-bold font-rubik text-foreground">
                        {stats?.cancellationRate?.toFixed(1) || '0.0'}%
                    </span>
                    <p className="text-xs text-muted-foreground mt-2">de pedidos não concluídos</p>
                </div>

                {/* Custo Médio Frete */}
                <div className="bg-card/80 backdrop-blur-md rounded-xl border border-white/20 shadow-sm overflow-hidden p-6 flex flex-col justify-center items-center text-center">
                    <h3 className="font-medium text-sm text-muted-foreground mb-4">Custo Médio de Frete</h3>
                    <span className="text-4xl font-bold font-rubik text-foreground">
                        {formatPrice(stats?.averageShippingCost || 0)}
                    </span>
                    <p className="text-xs text-muted-foreground mt-2">por pedido realizado</p>
                </div>

                {/* Vendas por Estado */}
                <div className="bg-card/80 backdrop-blur-md rounded-xl border border-white/20 shadow-sm overflow-hidden p-6">
                    <div className="mb-4 text-center">
                        <h3 className="font-medium text-sm text-muted-foreground">Vendas por Estado (UF)</h3>
                    </div>
                    <div className="h-[120px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.salesByState?.slice(0, 4) || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} dy={5} />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'rgba(30,41,59,0.9)', backdropFilter: 'blur(8px)', color: '#fff' }}
                                    formatter={(value: any) => [formatPrice(Number(value) || 0), 'Vendas']}
                                />
                                <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={36} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Data Grids */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-8">
                {/* Clientes Mais Ativos */}
                <div className="bg-card/80 backdrop-blur-md rounded-xl border border-white/20 shadow-sm overflow-hidden p-6 flex flex-col">
                    <h2 className="font-bold font-rubik text-lg mb-6 text-foreground text-center">Clientes Mais Ativos</h2>
                    <div className="flex-1 overflow-x-auto text-sm text-left">
                        <table className="w-full relative border-collapse">
                            <thead>
                                <tr className="border-b border-border/50 text-muted-foreground">
                                    <th className="font-medium px-4 py-3">Cliente</th>
                                    <th className="font-medium px-4 py-3 text-center">Pedidos</th>
                                    <th className="font-medium px-4 py-3 text-right">Faturamento</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(stats?.topCustomers && stats.topCustomers.length > 0) ? stats.topCustomers.map((c, i) => (
                                    <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">{c.name}</td>
                                        <td className="px-4 py-3 text-center text-primary font-medium">{c.orderCount}</td>
                                        <td className="px-4 py-3 text-right">{formatPrice(c.revenue)}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={3} className="text-center py-6 text-muted-foreground">Sem dados suficientes</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Estoque Overview Row Split */}
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    {/* Sem Estoque */}
                    <div className="bg-card/80 backdrop-blur-md rounded-xl border border-red-500/20 shadow-sm overflow-hidden p-6">
                        <div className="flex items-center gap-2 mb-6 text-red-500">
                            <AlertTriangle size={18} />
                            <h2 className="font-bold font-rubik text-sm text-foreground">Sem Estoque (0)</h2>
                        </div>
                        <div className="space-y-4">
                            {(!stats?.outOfStock || stats.outOfStock.length === 0) ? (
                                <p className="text-xs text-muted-foreground">Nenhum produto zerado.</p>
                            ) : (
                                stats.outOfStock.map((p) => (
                                    <div key={p.id} className="flex justify-between items-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {p.image_url ? (
                                                <img src={p.image_url} alt={p.name} className="w-8 h-8 object-cover rounded shadow-sm" />
                                            ) : (
                                                <div className="w-8 h-8 bg-black/20 rounded flex items-center justify-center shrink-0">
                                                    <Package size={14} className="text-red-400" />
                                                </div>
                                            )}
                                            <span className="text-xs font-semibold text-red-300 truncate pr-2">{p.name}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Estoque Baixo */}
                    <div className="bg-card/80 backdrop-blur-md rounded-xl border border-yellow-500/20 shadow-sm overflow-hidden p-6">
                        <div className="flex items-center gap-2 mb-6 text-yellow-500">
                            <AlertTriangle size={18} />
                            <h2 className="font-bold font-rubik text-sm text-foreground">Estoque Crítico</h2>
                        </div>
                        <div className="space-y-4">
                            {(!stats?.lowStock || stats.lowStock.length === 0) ? (
                                <p className="text-xs text-muted-foreground">Estoque saudável.</p>
                            ) : (
                                stats.lowStock.map((p) => (
                                    <div key={p.id} className="flex justify-between items-center bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
                                        <div className="flex items-center gap-3 overflow-hidden text-xs">
                                            <span className="font-semibold text-yellow-500 truncate">{p.name}</span>
                                        </div>
                                        <span className="text-yellow-600 font-bold shrink-0">{p.stock} un.</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-card/80 backdrop-blur-md rounded-xl border border-white/20 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border/50 flex justify-between items-center">
                    <h2 className="font-bold font-rubik text-lg">Últimos Pedidos</h2>
                    <button onClick={() => router.push('/admin/orders')} className="text-sm text-primary font-medium hover:underline transition-all">Ver todos</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-white/20">
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
                                    <tr key={order.id} className="bg-transparent border-b border-white/10 last:border-0 hover:bg-muted/50 transition-colors cursor-pointer duration-300" onClick={() => router.push('/admin/orders')}>
                                        <td className="px-6 py-4 font-medium text-primary shadow-none">#{order.id.slice(0, 8)}</td>
                                        <td className="px-6 py-4">{order.customer_name}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{formatDate(order.created_at)}</td>
                                        <td className="px-6 py-4 font-medium text-right">{formatPrice(order.total_amount)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shadow-sm ${STATUS_MAP[order.status]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
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

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, Loader2, ShoppingBag, Clock, CheckCircle2, Truck, XCircle, ArrowLeft, Receipt, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Product {
    name: string;
    image_url: string;
}

interface OrderItem {
    id: string;
    product_id: string;
    quantity: number;
    price_at_purchase: number;
    product?: Product;
}

interface Order {
    id: string;
    customer_name: string;
    customer_email: string;
    total_amount: number;
    shipping_fee: number;
    status: string;
    asaas_payment_id: string;
    asaas_invoice_url?: string;
    created_at: string;
    order_items: OrderItem[];
}

const statusMap: Record<string, { label: string; color: string; icon: any; step: number }> = {
    PENDING: { label: 'Aguardando Pagamento', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, step: 0 },
    PAID: { label: 'Pagamento Confirmado', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle2, step: 1 },
    CONFIRMED: { label: 'Pagamento Confirmado', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle2, step: 1 },
    SHIPPED: { label: 'Em Transporte', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Truck, step: 2 },
    DELIVERED: { label: 'Entregue', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Package, step: 3 },
    CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, step: -1 },
};

const timelineSteps = [
    { label: 'Pedido Realizado' },
    { label: 'Pagamento' },
    { label: 'Em Transporte' },
    { label: 'Entregue' }
];

export default function MyOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/my-orders');
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
            } else {
                const err = await res.json();
                setError(err.error || 'Erro ao carregar pedidos');
            }
        } catch {
            setError('Erro de conexão');
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

    const formatDate = (date: string) =>
        new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date));

    return (
        <div className="container px-4 md:px-8 mx-auto xl:max-w-5xl py-10">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/" className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold font-urbanist text-foreground">Meus Pedidos</h1>
                    <p className="text-muted-foreground text-sm">Acompanhe o status e detalhes das suas compras.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : error ? (
                <div className="text-center py-20">
                    <XCircle size={48} className="mx-auto text-destructive mb-4" />
                    <h3 className="font-urbanist font-bold text-xl mb-2">Erro ao carregar pedidos</h3>
                    <p className="text-muted-foreground text-sm mb-4">{error}</p>
                    <button onClick={fetchOrders} className="text-primary font-medium text-sm hover:underline">Tentar novamente</button>
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-20">
                    <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-urbanist font-bold text-xl mb-2">Nenhum pedido ainda</h3>
                    <p className="text-muted-foreground text-sm mb-6">Seus pedidos aparecerão aqui após sua primeira compra.</p>
                    <Link href="/" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors">
                        Ir às compras
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => {
                        const statusInfo = statusMap[order.status] || statusMap.PENDING;
                        const StatusIcon = statusInfo.icon;
                        const currentStep = statusInfo.step;

                        return (
                            <div key={order.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                                {/* Header */}
                                <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/20 gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${statusInfo.color}`}>
                                            <StatusIcon size={20} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-foreground">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
                                            <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {order.asaas_invoice_url && (
                                            <a
                                                href={order.asaas_invoice_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors border border-border"
                                            >
                                                <Receipt size={14} />
                                                Nota Fiscal
                                                <ExternalLink size={12} className="opacity-70" />
                                            </a>
                                        )}
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-full border ${statusInfo.color}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Timeline Progress Bar */}
                                {currentStep >= 0 && (
                                    <div className="px-6 py-6 border-b border-border/50 bg-muted/5 z-0">
                                        <div className="max-w-3xl mx-auto">
                                            <div className="relative flex justify-between">
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border rounded-full" />
                                                <div
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full transition-all duration-500"
                                                    style={{ width: `${(currentStep / (timelineSteps.length - 1)) * 100}%` }}
                                                />

                                                {timelineSteps.map((step, index) => {
                                                    const isCompleted = currentStep >= index;
                                                    const isCurrent = currentStep === index;

                                                    return (
                                                        <div key={index} className="relative flex flex-col items-center justify-center z-10 w-8">
                                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center bg-card transition-colors ${isCompleted ? 'border-primary' : 'border-border'} ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                                                                {isCompleted && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                                            </div>
                                                            <span className={`absolute top-8 text-xs font-medium whitespace-nowrap ${isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                                {step.label}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Cancelled State Notice */}
                                {currentStep === -1 && (
                                    <div className="px-6 py-4 bg-red-50/50 border-b border-red-100 text-center">
                                        <p className="text-sm font-medium text-red-800">Este pedido foi cancelado e não será enviado.</p>
                                    </div>
                                )}

                                {/* Products List */}
                                <div className="px-6 py-4 flex-1">
                                    <h4 className="text-sm font-semibold text-foreground mb-4">Itens do Pedido</h4>
                                    <div className="space-y-4">
                                        {order.order_items?.map((item) => (
                                            <div key={item.id} className="flex items-center gap-4 py-2">
                                                <div className="w-16 h-16 rounded-md bg-muted flex-shrink-0 border border-border overflow-hidden">
                                                    {item.product?.image_url ? (
                                                        <img
                                                            src={item.product.image_url}
                                                            alt={item.product?.name || 'Produto'}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                            <Package size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">
                                                        {item.product?.name || 'Produto indisponível'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Qtd: {item.quantity} × {formatPrice(item.price_at_purchase)}
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-sm font-bold text-foreground">
                                                        {formatPrice(item.price_at_purchase * item.quantity)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer (Totals) */}
                                <div className="px-6 py-4 border-t border-border/50 bg-muted/10 grid grid-cols-2 sm:flex sm:justify-end gap-x-8 gap-y-2">
                                    <div className="flex flex-col sm:items-end">
                                        <span className="text-xs text-muted-foreground mb-1">Subtotal Itens</span>
                                        <span className="text-sm font-medium">{formatPrice(order.total_amount - order.shipping_fee)}</span>
                                    </div>
                                    <div className="flex flex-col sm:items-end">
                                        <span className="text-xs text-muted-foreground mb-1">Valor do Frete</span>
                                        <span className="text-sm font-medium">{order.shipping_fee === 0 ? 'Grátis' : formatPrice(order.shipping_fee)}</span>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1 pt-2 sm:pt-0 mt-2 sm:mt-0 border-t sm:border-0 border-border/50 flex flex-col sm:items-end">
                                        <span className="text-xs text-muted-foreground mb-1">Total do Pedido</span>
                                        <span className="text-lg font-urbanist font-bold text-primary">{formatPrice(order.total_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

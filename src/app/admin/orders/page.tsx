'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Loader2, Eye, X, ChevronDown, Package, Link as LinkIcon, Truck } from 'lucide-react';

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
    customer_document: string;
    customer_phone: string;
    shipping_address: any;
    total_amount: number;
    shipping_fee: number;
    status: string;
    asaas_payment_id: string;
    asaas_invoice_url?: string;
    created_at: string;
    order_items: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Aguardando Pagamento', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    PAID: { label: 'Pagamento Confirmado', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    SHIPPED: { label: 'Em Transporte', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    DELIVERED: { label: 'Entregue', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200' },
};

const STATUS_OPTIONS = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function ExpedicaoPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [invoiceUrlInput, setInvoiceUrlInput] = useState('');

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/admin/orders');
        if (res.ok) {
            const data = await res.json();
            setOrders(data.orders || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // Setup input state when modal opens
    useEffect(() => {
        if (selectedOrder) {
            setInvoiceUrlInput(selectedOrder.asaas_invoice_url || '');
        } else {
            setInvoiceUrlInput('');
        }
    }, [selectedOrder?.id]);

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const handleUpdateOrder = async (orderId: string, updates: { status?: string, asaas_invoice_url?: string }) => {
        setUpdatingStatus(true);
        const res = await fetch('/api/admin/orders', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: orderId, ...updates }),
        });

        if (res.ok) {
            fetchOrders();
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder({ ...selectedOrder, ...updates });
            }
        } else {
            alert('Falha ao atualizar o pedido.');
        }
        setUpdatingStatus(false);
    };

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-urbanist text-foreground">Expedição</h1>
                <p className="text-muted-foreground">Gestão detalhada de pedidos, produtos vendidos e emissão de notas fiscais.</p>
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 transition-opacity" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="flex justify-between items-start border-b border-border pb-4">
                            <div>
                                <h2 className="font-urbanist font-bold text-2xl">Pedido #{selectedOrder.id.slice(0, 8).toUpperCase()}</h2>
                                <p className="text-sm text-muted-foreground mt-1">Realizado em {formatDate(selectedOrder.created_at)}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"><X size={20} /></button>
                        </div>

                        {/* Customer Info */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Cliente</p>
                                <p className="font-medium text-sm truncate" title={selectedOrder.customer_name}>{selectedOrder.customer_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Telefone</p>
                                <p className="font-medium text-sm">{selectedOrder.customer_phone || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">CPF/CNPJ</p>
                                <p className="font-medium text-sm">{selectedOrder.customer_document}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Email</p>
                                <p className="font-medium text-sm truncate" title={selectedOrder.customer_email}>{selectedOrder.customer_email}</p>
                            </div>
                        </div>

                        {/* Shipping */}
                        <div className="bg-muted/30 p-4 rounded-lg border border-border">
                            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Truck size={16} /> Endereço de Entrega</h3>
                            {selectedOrder.shipping_address ? (
                                <p className="text-sm text-muted-foreground">
                                    {selectedOrder.shipping_address.street}, {selectedOrder.shipping_address.number}
                                    {selectedOrder.shipping_address.complement ? ` - ${selectedOrder.shipping_address.complement}` : ''}
                                    <br />{selectedOrder.shipping_address.neighborhood} - {selectedOrder.shipping_address.city}/{selectedOrder.shipping_address.state}
                                    <br />CEP: {selectedOrder.shipping_address.zipCode}
                                </p>
                            ) : <p className="text-sm text-muted-foreground">Endereço não informado.</p>}
                        </div>

                        {/* Products */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3">Itens do Pedido</h3>
                            <div className="space-y-3">
                                {selectedOrder.order_items?.map(item => (
                                    <div key={item.id} className="flex items-center gap-4 py-2 border-b border-border last:border-0">
                                        <div className="w-12 h-12 rounded bg-muted border border-border overflow-hidden flex-shrink-0">
                                            {item.product?.image_url ? (
                                                <img src={item.product.image_url} alt="Produto" className="w-full h-full object-cover" />
                                            ) : <Package className="w-full h-full p-2 text-muted-foreground opacity-50" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{item.product?.name || 'Produto desconhecido'}</p>
                                            <p className="text-xs text-muted-foreground">Qtd: {item.quantity} × {formatPrice(item.price_at_purchase)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold">{formatPrice(item.quantity * item.price_at_purchase)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-between items-center bg-primary/5 p-4 rounded-lg border border-primary/10">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Frete</p>
                                <p className="text-sm font-medium">{formatPrice(selectedOrder.shipping_fee)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground mb-1">Total Confirmado</p>
                                <p className="text-xl font-urbanist font-bold text-primary">{formatPrice(selectedOrder.total_amount)}</p>
                            </div>
                        </div>

                        {/* Actions: Invoice + Status */}
                        <div className="grid sm:grid-cols-2 gap-6 pt-2 border-t border-border">
                            {/* Invoice Link */}
                            <div className="space-y-2">
                                <p className="text-sm font-semibold">Nota Fiscal (URL)</p>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="url"
                                            placeholder="https://link-da-nota.pdf"
                                            value={invoiceUrlInput}
                                            onChange={(e) => setInvoiceUrlInput(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleUpdateOrder(selectedOrder.id, { asaas_invoice_url: invoiceUrlInput })}
                                        disabled={updatingStatus || invoiceUrlInput === (selectedOrder.asaas_invoice_url || '')}
                                        className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-md hover:bg-secondary/80 disabled:opacity-50 transition-colors"
                                    >
                                        Salvar
                                    </button>
                                </div>
                                {selectedOrder.asaas_invoice_url && (
                                    <a href={selectedOrder.asaas_invoice_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-block mt-1">
                                        Abrir Nota Fiscal Atual →
                                    </a>
                                )}
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <p className="text-sm font-semibold">Status de Expedição</p>
                                <div className="flex flex-wrap gap-2">
                                    {STATUS_OPTIONS.map(status => (
                                        <button
                                            key={status}
                                            onClick={() => handleUpdateOrder(selectedOrder.id, { status })}
                                            disabled={updatingStatus || selectedOrder.status === status}
                                            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all disabled:opacity-50 ${selectedOrder.status === status ? STATUS_MAP[status]?.color + ' ring-2 ring-primary/20' : 'border-border text-muted-foreground hover:bg-muted'}`}
                                        >
                                            {STATUS_MAP[status]?.label || status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Orders Table */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
            ) : orders.length === 0 ? (
                <div className="text-center py-20">
                    <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-urbanist font-bold text-xl mb-2">Nenhum pedido recebido</h3>
                    <p className="text-muted-foreground text-sm">Quando um cliente fizer uma compra, o pedido aparecerá aqui.</p>
                </div>
            ) : (
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border whitespace-nowrap">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Pedido</th>
                                    <th className="px-6 py-4 font-medium">Cliente</th>
                                    <th className="px-6 py-4 font-medium">Data</th>
                                    <th className="px-6 py-4 font-medium text-right">Valor</th>
                                    <th className="px-6 py-4 font-medium text-center">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors whitespace-nowrap">
                                        <td className="px-6 py-4 font-medium text-primary">#{order.id.slice(0, 8)}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium">{order.customer_name}</p>
                                            <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground text-xs">{formatDate(order.created_at)}</td>
                                        <td className="px-6 py-4 font-semibold text-right">{formatPrice(order.total_amount)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="relative inline-block w-40 text-left">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleUpdateOrder(order.id, { status: e.target.value })}
                                                    className={`appearance-none w-full text-xs font-semibold px-3 py-1.5 pr-7 rounded-full border cursor-pointer focus:outline-none ${STATUS_MAP[order.status]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}
                                                >
                                                    {STATUS_OPTIONS.map(s => (
                                                        <option key={s} value={s}>{STATUS_MAP[s]?.label || s}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => setSelectedOrder(order)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors inline-flex items-center gap-2 text-xs font-medium border border-primary/20">
                                                <Eye size={14} /> Detalhes
                                            </button>
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

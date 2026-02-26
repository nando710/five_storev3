'use client';

import { useCartStore } from '@/store/cart';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { FrenetShippingService } from '@/types/frenet';

export default function CartPage() {
    const { items, removeItem, updateQuantity, getCartTotal } = useCartStore();
    const [cep, setCep] = useState('');
    const [shippingOptions, setShippingOptions] = useState<FrenetShippingService[] | null>(null);
    const [isLoadingShipping, setIsLoadingShipping] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    const handleCalculateShipping = async () => {
        if (cep.length < 8) return;
        setIsLoadingShipping(true);
        // In a real scenario, this would call our Next.js API Route which then calls the Frenet API
        // DUMMY DELAY FOR UI TESTING
        setTimeout(() => {
            setShippingOptions([
                {
                    ServiceCode: 'PAC',
                    ServiceDescription: 'Correios PAC',
                    Carrier: 'Correios',
                    CarrierCode: '1',
                    ShippingPrice: '25.50',
                    DeliveryTime: '5',
                    Error: false,
                    OriginalDeliveryTime: '5',
                    OriginalShippingPrice: '25.50',
                },
                {
                    ServiceCode: 'SEDEX',
                    ServiceDescription: 'Correios SEDEX',
                    Carrier: 'Correios',
                    CarrierCode: '2',
                    ShippingPrice: '45.90',
                    DeliveryTime: '2',
                    Error: false,
                    OriginalDeliveryTime: '2',
                    OriginalShippingPrice: '45.90',
                }
            ]);
            setIsLoadingShipping(false);
        }, 1000);
    };

    if (items.length === 0) {
        return (
            <div className="container px-4 md:px-8 mx-auto xl:max-w-7xl py-20 flex flex-col items-center justify-center text-center">
                <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-6 text-muted-foreground">
                    <Trash2 size={48} />
                </div>
                <h2 className="text-2xl font-urbanist font-bold mb-2">Seu carrinho está vazio</h2>
                <p className="text-muted-foreground mb-8">Parece que você ainda não adicionou nenhum produto.</p>
                <Link href="/" className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
                    Voltar às Compras
                </Link>
            </div>
        );
    }

    return (
        <div className="container px-4 md:px-8 mx-auto xl:max-w-7xl py-12">
            <h1 className="text-3xl font-bold font-urbanist mb-8">Seu Carrinho</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <div key={item.id} className="flex gap-4 bg-card p-4 rounded-xl border border-border/50 shadow-sm relative">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 relative rounded-md overflow-hidden bg-muted flex-shrink-0">
                                {item.imageUrl && (
                                    <Image src={item.imageUrl} alt={item.name} fill unoptimized className="object-cover" />
                                )}
                            </div>
                            <div className="flex flex-col flex-1 py-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-urbanist font-semibold text-lg line-clamp-2 pr-6">
                                        {item.name}
                                    </h3>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors p-1"
                                        title="Remover produto"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>

                                <div className="mt-auto flex items-center justify-between">
                                    <div className="flex items-center border border-border rounded-md">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="p-2 text-foreground hover:bg-muted transition-colors rounded-l-md"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="w-10 text-center font-medium bg-transparent">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="p-2 text-foreground hover:bg-muted transition-colors rounded-r-md"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <span className="font-bold text-lg text-primary">
                                        {formatPrice(item.price * item.quantity)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm h-fit sticky top-24">
                    <h3 className="font-urbanist font-bold text-xl mb-6">Resumo do Pedido</h3>

                    <div className="space-y-3 text-sm mb-6">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal ({items.reduce((a, b) => a + b.quantity, 0)} itens)</span>
                            <span>{formatPrice(getCartTotal())}</span>
                        </div>
                    </div>

                    <div className="border-t border-border pt-6 mb-6">
                        <h4 className="font-semibold text-sm mb-3 text-foreground/80">Calcular Frete</h4>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="00000-000"
                                value={cep}
                                onChange={(e) => setCep(e.target.value)}
                                className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                maxLength={9}
                            />
                            <button
                                onClick={handleCalculateShipping}
                                disabled={cep.length < 8 || isLoadingShipping}
                                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-50"
                            >
                                {isLoadingShipping ? 'Calculando...' : 'Calcular'}
                            </button>
                        </div>

                        {shippingOptions && (
                            <div className="mt-4 space-y-2">
                                {shippingOptions.map((opt) => (
                                    <label key={opt.ServiceCode} className="flex items-center justify-between p-3 border border-border rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <input type="radio" name="shipping" className="text-primary focus:ring-primary h-4 w-4" />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{opt.ServiceDescription}</span>
                                                <span className="text-xs text-muted-foreground">Até {opt.DeliveryTime} dias úteis</span>
                                            </div>
                                        </div>
                                        <span className="font-semibold text-sm">{formatPrice(Number(opt.ShippingPrice))}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-border pt-4 mb-6">
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>Total</span>
                            <span className="text-primary">{formatPrice(getCartTotal())} <span className="text-sm text-muted-foreground font-normal">+ Frete</span></span>
                        </div>
                        <p className="text-xs text-muted-foreground text-right mt-1">Em até 12x no cartão de crédito</p>
                    </div>

                    <Link href="/checkout" className="w-full bg-primary text-primary-foreground py-4 rounded-md font-bold text-center hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group shadow-sm hover:shadow-md">
                        Finalizar Compra
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

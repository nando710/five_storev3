'use client';

import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function CartDrawer() {
    const { items, isOpen, closeCart, removeItem, updateQuantity, getCartTotal } = useCartStore();
    const router = useRouter();

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeCart();
        };
        if (isOpen) document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, closeCart]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const goToCheckout = () => {
        closeCart();
        router.push('/checkout');
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={closeCart}
            />

            {/* Drawer */}
            <aside
                className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-card border-l border-border shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
                    <div className="flex items-center gap-3">
                        <ShoppingBag size={20} className="text-primary" />
                        <h2 className="font-urbanist font-bold text-lg">Carrinho</h2>
                        {totalItems > 0 && (
                            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                                {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={closeCart}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Items */}
                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                            <ShoppingBag size={32} className="text-muted-foreground" />
                        </div>
                        <h3 className="font-urbanist font-bold text-lg mb-2">Carrinho vazio</h3>
                        <p className="text-muted-foreground text-sm">
                            Adicione produtos ao carrinho para começar sua compra.
                        </p>
                        <button
                            onClick={closeCart}
                            className="mt-6 text-primary font-medium text-sm hover:underline"
                        >
                            Continuar comprando
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex gap-4 p-3 bg-muted/40 rounded-xl border border-border/50 group"
                                >
                                    {/* Image */}
                                    <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden shrink-0">
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                <ShoppingBag size={20} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm line-clamp-2 mb-1">{item.name}</p>
                                        <p className="text-primary font-bold text-sm">{formatPrice(item.price)}</p>

                                        <div className="flex items-center justify-between mt-2">
                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-1 bg-background border border-border rounded-lg">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                    className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="text-sm font-semibold w-8 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>

                                            {/* Remove */}
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Line Total */}
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-sm">{formatPrice(item.price * item.quantity)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-border px-6 py-5 bg-card space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground font-medium">Subtotal</span>
                                <span className="font-urbanist font-bold text-xl text-foreground">{formatPrice(getCartTotal())}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Frete calculado no checkout.</p>
                            <button
                                onClick={goToCheckout}
                                className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                            >
                                Finalizar Compra
                                <ArrowRight size={16} />
                            </button>
                            <button
                                onClick={closeCart}
                                className="w-full text-center text-sm text-muted-foreground font-medium hover:text-foreground transition-colors py-1"
                            >
                                Continuar comprando
                            </button>
                        </div>
                    </>
                )}
            </aside>
        </>
    );
}

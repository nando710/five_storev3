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
                className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white/95 dark:bg-card/95 backdrop-blur-2xl border-l border-border/40 shadow-2xl z-50 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 bg-muted/10">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-xl">
                            <ShoppingBag size={20} className="text-primary" />
                        </div>
                        <h2 className="font-urbanist font-extrabold text-xl tracking-tight">Carrinho</h2>
                        {totalItems > 0 && (
                            <span className="bg-primary text-primary-foreground text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                                {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={closeCart}
                        className="p-2.5 rounded-xl text-muted-foreground/70 hover:text-foreground hover:bg-muted/70 transition-all duration-300"
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
                        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 custom-scrollbar">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex gap-4 p-3 bg-white dark:bg-card/50 rounded-2xl border border-border/40 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] group hover:shadow-[0_8px_20px_-8px_rgba(168,85,247,0.15)] transition-all duration-300"
                                >
                                    {/* Image */}
                                    <div className="w-24 h-24 rounded-xl bg-muted/30 overflow-hidden shrink-0 relative">
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-2 mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                                <ShoppingBag size={24} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0 pr-2 flex flex-col justify-center">
                                        <p className="font-urbanist font-bold text-base line-clamp-2 mb-1 group-hover:text-primary transition-colors">{item.name}</p>
                                        <p className="text-muted-foreground text-sm font-semibold mb-3">{formatPrice(item.price)}</p>

                                        <div className="flex items-center justify-between mt-auto">
                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-background rounded-md disabled:opacity-30 transition-all duration-200 shadow-sm disabled:shadow-none"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-all duration-200 shadow-sm"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>

                                            {/* Remove */}
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="p-2 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-200"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-border/40 px-6 py-6 bg-muted/10 space-y-4">
                            <div className="flex items-end justify-between">
                                <span className="text-muted-foreground font-semibold">Subtotal</span>
                                <span className="font-urbanist font-black text-2xl text-primary">{formatPrice(getCartTotal())}</span>
                            </div>
                            <p className="text-xs text-muted-foreground/80 font-medium">Frete e possíveis impostos serão calculados na próxima etapa do checkout.</p>
                            <button
                                onClick={goToCheckout}
                                className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-base hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Finalizar Pedido
                                <ArrowRight size={18} />
                            </button>
                            <button
                                onClick={closeCart}
                                className="w-full text-center text-sm text-muted-foreground/70 font-bold hover:text-foreground transition-colors py-2 rounded-xl hover:bg-muted/50"
                            >
                                Voltar para vitrine
                            </button>
                        </div>
                    </>
                )}
            </aside>
        </>
    );
}

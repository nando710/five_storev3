'use client';

import Link from 'next/link';
import { ShoppingCart, Menu, Store, User, LogOut, ClipboardList } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export function Navbar() {
    const [isMounted, setIsMounted] = useState(false);
    const [user, setUser] = useState<any>(null);
    const cartItemsCount = useCartStore((state) => state.items.reduce((acc, item) => acc + item.quantity, 0));
    const toggleCart = useCartStore((state) => state.toggleCart);
    const supabase = createClient();

    useEffect(() => {
        setIsMounted(true);
        const checkUser = async () => {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (data.authenticated) {
                setUser(data);
            }
        };
        checkUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        window.location.href = '/';
    };

    return (
        <nav className="sticky top-4 z-50 mx-4 md:mx-8 xl:mx-auto max-w-7xl border border-white/20 dark:border-white/10 rounded-2xl bg-white/75 dark:bg-slate-950/75 backdrop-blur-3xl shadow-xl shadow-black/5 transition-all duration-300">
            <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-2 group">
                    <Link href="/" className="flex items-center gap-2 transition-transform duration-300 hover:scale-105">
                        <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors duration-300">
                            <Store className="h-6 w-6 text-primary group-hover:text-purple-600 transition-colors duration-300" />
                        </div>
                        <span className="font-heading font-extrabold text-xl hidden sm:inline-block tracking-tight text-foreground">
                            Five Store
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    {isMounted && user ? (
                        <>
                            <span className="text-sm text-muted-foreground hidden md:inline">
                                Olá, <strong className="text-foreground">{user.name || user.email}</strong>
                            </span>
                            <Link href="/perfil" className="p-2.5 rounded-xl text-foreground/80 hover:text-primary hover:bg-primary/10 transition-all duration-300" title="Meu Perfil">
                                <User className="h-5 w-5" />
                            </Link>
                            <Link href="/meus-pedidos" className="p-2.5 rounded-xl text-foreground/80 hover:text-primary hover:bg-primary/10 transition-all duration-300" title="Meus Pedidos">
                                <ClipboardList className="h-5 w-5" />
                            </Link>
                            <button onClick={toggleCart} className="relative group p-2.5 rounded-xl hover:bg-primary/10 transition-all duration-300">
                                <ShoppingCart className="h-5 w-5 text-foreground/80 group-hover:text-primary transition-colors" />
                                {cartItemsCount > 0 && (
                                    <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-md animate-in zoom-in duration-300">
                                        {cartItemsCount}
                                    </span>
                                )}
                            </button>
                            <button onClick={handleLogout} className="p-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300" title="Sair">
                                <LogOut className="h-5 w-5" />
                            </button>
                        </>
                    ) : isMounted ? (
                        <>
                            <Link href="/login" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-xl hover:bg-muted/50">
                                Entrar
                            </Link>
                            <Link href="/cadastro" className="text-sm font-bold bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:shadow-primary/30 hover:bg-primary/90 px-5 py-2.5 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95">
                                Cadastre-se
                            </Link>
                        </>
                    ) : null}
                </div>
            </div>
        </nav>
    );
}

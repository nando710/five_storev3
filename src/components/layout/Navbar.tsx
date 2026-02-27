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
        <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4 md:px-8 mx-auto xl:max-w-7xl">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                        <Store className="h-6 w-6 text-primary" />
                        <span className="font-bold text-lg hidden sm:inline-block">Five Store</span>
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    {isMounted && user ? (
                        <>
                            <span className="text-sm text-muted-foreground hidden md:inline">
                                Olá, <strong className="text-foreground">{user.name || user.email}</strong>
                            </span>
                            <Link href="/meus-pedidos" className="p-2 text-foreground/80 hover:text-primary transition-colors" title="Meus Pedidos">
                                <ClipboardList className="h-5 w-5" />
                            </Link>
                            <button onClick={toggleCart} className="relative group p-2">
                                <ShoppingCart className="h-5 w-5 text-foreground/80 group-hover:text-primary transition-colors" />
                                {cartItemsCount > 0 && (
                                    <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
                                        {cartItemsCount}
                                    </span>
                                )}
                            </button>
                            <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Sair">
                                <LogOut className="h-5 w-5" />
                            </button>
                        </>
                    ) : isMounted ? (
                        <>
                            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Entrar
                            </Link>
                            <Link href="/cadastro" className="text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                                Cadastre-se
                            </Link>
                        </>
                    ) : null}
                </div>
            </div>
        </nav>
    );
}

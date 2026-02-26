'use client';

import Link from 'next/link';
import { ShoppingCart, Menu, Store } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useState, useEffect } from 'react';

export function Navbar() {
    const [isMounted, setIsMounted] = useState(false);
    const cartItemsCount = useCartStore((state) => state.items.reduce((acc, item) => acc + item.quantity, 0));

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4 md:px-8 mx-auto xl:max-w-7xl">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                        <Store className="h-6 w-6 text-primary" />
                        <span className="font-bold text-lg hidden sm:inline-block">Five Store</span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/cart" className="relative group p-2">
                        <ShoppingCart className="h-6 w-6 text-foreground/80 group-hover:text-primary transition-colors" />
                        {isMounted && cartItemsCount > 0 && (
                            <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
                                {cartItemsCount}
                            </span>
                        )}
                    </Link>
                    <button className="md:hidden p-2 text-foreground/80 hover:text-primary transition-colors">
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
            </div>
        </nav>
    );
}

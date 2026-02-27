'use client';

import { Store, LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Users, FolderTree, Truck } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';

const navItems = [
    { icon: LayoutDashboard, label: 'Visão Geral', href: '/admin' },
    { icon: Users, label: 'Franqueados', href: '/admin/franchisees' },
    { icon: ShoppingBag, label: 'Expedição', href: '/admin/orders' },
    { icon: FolderTree, label: 'Categorias', href: '/admin/categories' },
    { icon: Package, label: 'Produtos', href: '/admin/products' },
    { icon: Truck, label: 'Fretes', href: '/admin/shipping' },
    { icon: Settings, label: 'Configurações', href: '/admin/settings' },
];

export function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex-1 flex flex-col w-full h-[calc(100vh-2rem)] overflow-y-auto">
            <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
                {children}
            </main>
        </div>
    );
}

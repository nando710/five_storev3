import { Store, LayoutDashboard, Package, ShoppingBag, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

const navItems = [
    { icon: LayoutDashboard, label: 'Visão Geral', href: '/admin' },
    { icon: ShoppingBag, label: 'Pedidos', href: '/admin/orders' },
    { icon: Package, label: 'Produtos', href: '/admin/products' },
    { icon: Settings, label: 'Configurações', href: '/admin/settings' },
];

export function AdminSidebar() {
    return (
        <aside className="w-64 bg-card border-r border-border h-full flex flex-col hidden lg:flex fixed left-0 top-0">
            <div className="h-16 flex items-center px-6 border-b border-border text-primary">
                <Store className="h-6 w-6 mr-2" />
                <span className="font-bold font-urbanist text-xl">Five Store</span>
                <span className="text-xs ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Lojista</span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium text-sm"
                    >
                        <item.icon size={18} />
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-border">
                <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors font-medium text-sm w-full">
                    <LogOut size={18} />
                    Sair da Conta
                </button>
            </div>
        </aside>
    );
}

export function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-muted/20 flex">
            <AdminSidebar />
            <div className="flex-1 lg:pl-64 flex flex-col">
                {/* Mobile Header would go here */}
                <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}

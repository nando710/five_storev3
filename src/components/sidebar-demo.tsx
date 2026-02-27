"use client";
import React, { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Store, LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Users, FolderTree, Truck, UserCircle, ChevronRight, Tag } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface Category {
    id: string;
    name: string;
}

export default function SidebarDemo({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>("Store User");
    const [categories, setCategories] = useState<Category[]>([]);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.authenticated) {
                        setRole(data.role);
                        setUserName(data.name || data.email || "Store User");
                    }
                }
            } catch (error) {
                console.error("Error fetching user role:", error);
            }
        };

        const fetchCategories = async () => {
            const { data, error } = await supabase
                .from('categories')
                .select('id, name')
                .is('parent_id', null)
                .order('name');
            if (data && !error) {
                setCategories(data);
            }
        };

        fetchUserData();
        fetchCategories();
    }, [supabase]);

    const adminLinks = [
        {
            label: "Vitrine (Loja)",
            href: "/",
            icon: <Store className="h-5 w-5 shrink-0 text-primary" />,
        },
        {
            label: "Visão Geral",
            href: "/admin",
            icon: <LayoutDashboard className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />,
        },
        {
            label: "Pedidos / Expedição",
            href: "/admin/orders",
            icon: <ShoppingBag className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />,
        },
        {
            label: "Produtos",
            href: "/admin/products",
            icon: <Package className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />,
        },
        {
            label: "Categorias",
            href: "/admin/categories",
            icon: <FolderTree className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />,
        },
        {
            label: "Franqueados",
            href: "/admin/franchisees",
            icon: <Users className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />,
        },
        {
            label: "Frete",
            href: "/admin/shipping",
            icon: <Truck className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />,
        },
        {
            label: "Configurações",
            href: "/admin/settings",
            icon: <Settings className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />,
        },
    ];

    const franchiseeLinks = [
        {
            label: "Vitrine (Loja)",
            href: "/",
            icon: <Store className="h-5 w-5 shrink-0 text-primary" />,
        },
        {
            label: "Meus Pedidos",
            href: "/meus-pedidos",
            icon: <ShoppingBag className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />,
        },
        {
            label: "Meu Perfil",
            href: "/perfil",
            icon: <UserCircle className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />,
        },
    ];

    const handleLogout = async (e: React.MouseEvent) => {
        e.preventDefault();
        await supabase.auth.signOut();
        router.push('/auth');
    };

    const activeLinks = role === 'admin' ? adminLinks : role === 'franchisee' ? franchiseeLinks : [];
    return (
        <div
            className={cn(
                "flex w-full flex-col overflow-hidden bg-gray-100 md:flex-row dark:bg-neutral-800",
                "h-screen"
            )}
        >
            <Sidebar open={open} setOpen={setOpen}>
                <SidebarBody className="justify-between gap-10">
                    <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
                        {open ? <Logo /> : <LogoIcon />}
                        <div className="mt-8 flex flex-col gap-2">
                            {activeLinks.map((link, idx) => (
                                <SidebarLink key={idx} link={link} className="hover:bg-primary/5 rounded-xl px-2 transition-colors" />
                            ))}

                            {/* Franchisee Categories */}
                            {role === 'franchisee' && categories.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border/50">
                                    <p className={`px-4 text-xs font-semibold text-muted-foreground mb-2 flex items-center transition-all ${open ? 'opacity-100' : 'opacity-0 h-0 hidden'}`}>CATEGORIAS</p>
                                    {categories.map((cat) => (
                                        <SidebarLink
                                            key={cat.id}
                                            link={{
                                                label: cat.name,
                                                href: `/?category=${cat.id}`,
                                                icon: <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                                            }}
                                            className="hover:bg-primary/5 rounded-xl px-2 transition-colors"
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Global Logout Base */}
                            <div className="mt-auto pt-4 border-t border-border/50">
                                <SidebarLink
                                    link={{
                                        label: "Sair Integrado",
                                        href: "#",
                                        icon: <LogOut className="h-5 w-5 shrink-0 text-destructive group-hover:text-destructive/80 transition-colors" />,
                                        onClick: handleLogout
                                    }}
                                    className="hover:bg-destructive/5 rounded-xl px-2 transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <SidebarLink
                            link={{
                                label: userName,
                                href: role === 'admin' ? "/admin/settings" : "/perfil",
                                icon: (
                                    <div className="h-7 w-7 shrink-0 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold uppercase">
                                        {userName.charAt(0)}
                                    </div>
                                ),
                            }}
                        />
                    </div>
                </SidebarBody>
            </Sidebar>
            <div className="flex flex-1 overflow-hidden m-2 md:m-4 rounded-2xl border border-border shadow-xl bg-white dark:bg-card">
                <div className="flex flex-col h-full w-full overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}

export const Logo = () => {
    return (
        <Link
            href="/"
            className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-primary"
        >
            <div className="p-2 rounded-xl bg-primary/10">
                <Store className="h-5 w-5 text-primary" />
            </div>
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-heading font-extrabold text-xl whitespace-pre text-foreground"
            >
                Five Store
            </motion.span>
        </Link>
    );
};

export const LogoIcon = () => {
    return (
        <Link
            href="/"
            className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-primary"
        >
            <div className="p-2 rounded-xl bg-primary/10">
                <Store className="h-5 w-5 text-primary" />
            </div>
        </Link>
    );
};



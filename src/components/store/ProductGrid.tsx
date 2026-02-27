'use client';

import Image from 'next/image';
import { ShoppingCart, Lock, Loader2, PackageX } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    price_2: number;
    stock: number;
    image_url: string;
    active_t1: boolean;
    active_t2: boolean;
    category_id: string | null;
    weight: number;
    length: number;
    width: number;
    height: number;
}

interface Category {
    id: string;
    name: string;
    parent_id: string | null;
}

interface ProductGridProps {
    activeCategory: string | null;
}

export function ProductGrid({ activeCategory }: ProductGridProps) {
    const addItem = useCartStore((state) => state.addItem);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isApproved, setIsApproved] = useState(false);
    const [priceTable, setPriceTable] = useState(1);
    const [authChecked, setAuthChecked] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        const fetchProducts = async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });
            if (!error && data) setProducts(data);
            setLoadingProducts(false);
        };

        const fetchCategories = async () => {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name', { ascending: true });
            if (!error && data) setCategories(data);
        };

        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me');
                const data = await res.json();
                if (data.authenticated && (data.role === 'admin' || (data.role === 'franchisee' && data.status === 'approved'))) {
                    setIsApproved(true);
                    setPriceTable(data.price_table || 1);
                }
            } catch { /* not logged in */ }
            setAuthChecked(true);
        };

        fetchProducts();
        fetchCategories();
        checkAuth();
    }, []);

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

    const getPrice = (product: Product) =>
        priceTable === 2 ? (product.price_2 || product.price) : product.price;

    const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

    // Filter products by active category and availability for the user's price table
    const getFilteredProducts = () => {
        let visibleProducts = products;

        // Apply price table availability filter
        if (priceTable === 2) {
            visibleProducts = visibleProducts.filter(p => p.active_t2 !== false);
        } else {
            // Default to table 1
            visibleProducts = visibleProducts.filter(p => p.active_t1 !== false);
        }

        if (!activeCategory) return visibleProducts;

        const cat = categories.find(c => c.id === activeCategory);
        if (!cat) return visibleProducts;

        if (!cat.parent_id) {
            const subIds = getSubcategories(cat.id).map(s => s.id);
            const allIds = [cat.id, ...subIds];
            return visibleProducts.filter(p => p.category_id && allIds.includes(p.category_id));
        }

        return visibleProducts.filter(p => p.category_id === activeCategory);
    };

    const filteredProducts = getFilteredProducts();

    if (loadingProducts) {
        return (
            <div className="flex justify-center py-20 w-full">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="text-center py-20 w-full">
                <PackageX size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="font-heading font-bold text-xl mb-2">Nenhum produto disponível</h3>
                <p className="text-muted-foreground text-sm">Novos produtos serão adicionados em breve.</p>
            </div>
        );
    }

    if (filteredProducts.length === 0) {
        return (
            <div className="text-center py-16 w-full">
                <PackageX size={40} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhum produto nesta categoria.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
            {filteredProducts.map((product) => (
                <div
                    key={product.id}
                    className="group relative flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-card shadow-sm border border-border/40 transition-all duration-300 ease-out hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-primary focus-within:outline-none"
                >
                    <div className="relative aspect-square overflow-hidden bg-muted/30 p-4">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 mix-blend-multiply group-hover:opacity-100 transition-opacity duration-500 z-10" />
                        {product.image_url ? (
                            <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                unoptimized
                                className="object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-105 drop-shadow-sm"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                <PackageX size={64} strokeWidth={1} />
                            </div>
                        )}

                        {/* Interactive overlay on hover */}
                        <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10" />

                        {isApproved && (
                            <button
                                onClick={() => addItem({
                                    id: product.id,
                                    name: product.name,
                                    price: getPrice(product),
                                    imageUrl: product.image_url,
                                    weight: product.weight,
                                    length: product.length,
                                    width: product.width,
                                    height: product.height,
                                    quantity: 1,
                                    franchiseeId: '',
                                    categoryId: product.category_id || undefined,
                                })}
                                className="absolute bottom-4 right-4 translate-y-8 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary hover:scale-105 active:scale-95 focus:ring-2 focus:ring-primary focus:outline-none focus:ring-offset-2 z-20 backdrop-blur-md"
                                aria-label="Adicionar ao carrinho"
                            >
                                <ShoppingCart className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-1 flex-col p-6 z-20 bg-white/95 dark:bg-card/95 backdrop-blur-md transition-colors duration-300">
                        <div className="mb-2">
                            <h3 className="font-heading font-semibold text-lg line-clamp-1 mb-1 group-hover:text-primary transition-colors duration-300" title={product.name}>
                                {product.name}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                {product.description}
                            </p>
                        </div>
                        <div className="flex items-end justify-between mt-auto pt-4 border-t border-border/40">
                            {authChecked && isApproved ? (
                                <span className="font-black text-2xl text-primary drop-shadow-sm flex items-center gap-1">
                                    <span className="text-sm font-bold text-muted-foreground/70">R$</span>
                                    {getPrice(product).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            ) : authChecked ? (
                                <Link href="/login" className="flex flex-1 items-center justify-center gap-2 py-2 px-3 bg-muted/50 rounded-xl text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all w-full text-center">
                                    <Lock size={14} className="opacity-70" />
                                    <span className="font-semibold">Login p/ Preços</span>
                                </Link>
                            ) : (
                                <div className="h-8 w-24 bg-muted animate-pulse rounded-lg" />
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

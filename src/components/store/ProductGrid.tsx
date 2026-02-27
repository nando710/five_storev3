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

    // Filter products by active category (including subcategories of a parent)
    const getFilteredProducts = () => {
        if (!activeCategory) return products;
        const cat = categories.find(c => c.id === activeCategory);
        if (!cat) return products;
        if (!cat.parent_id) {
            const subIds = getSubcategories(cat.id).map(s => s.id);
            const allIds = [cat.id, ...subIds];
            return products.filter(p => p.category_id && allIds.includes(p.category_id));
        }
        return products.filter(p => p.category_id === activeCategory);
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
                <h3 className="font-urbanist font-bold text-xl mb-2">Nenhum produto disponível</h3>
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
                    className="group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm border border-border/50 transition-all hover:shadow-lg hover:-translate-y-1"
                >
                    <div className="relative aspect-square overflow-hidden bg-muted">
                        {product.image_url ? (
                            <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                unoptimized
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <PackageX size={48} />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100" />

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
                                })}
                                className="absolute bottom-4 right-4 translate-y-8 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:scale-105 active:scale-95"
                                aria-label="Adicionar ao carrinho"
                            >
                                <ShoppingCart className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                        <h3 className="font-urbanist font-semibold text-lg line-clamp-1 mb-1" title={product.name}>
                            {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                            {product.description}
                        </p>
                        <div className="flex items-end justify-between mt-auto">
                            {authChecked && isApproved ? (
                                <span className="font-bold text-xl text-primary">
                                    {formatPrice(getPrice(product))}
                                </span>
                            ) : authChecked ? (
                                <Link href="/login" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                                    <Lock size={14} />
                                    <span className="font-medium">Faça login para ver o preço</span>
                                </Link>
                            ) : (
                                <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

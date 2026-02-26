'use client';

import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cart';

// Temporary Mock Data strictly for aesthetic testing until Supabase DB works
const DUMMY_PRODUCTS = [
    {
        id: 'prod-1',
        franchiseeId: 'fran-1',
        name: 'Camiseta Básica Five - Preto',
        description: 'Camiseta 100% algodão, confortável e com caimento perfeito.',
        price: 89.90,
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800&h=800', // Unsplash T-shirt
        weight: 0.3, length: 25, width: 20, height: 5,
    },
    {
        id: 'prod-2',
        franchiseeId: 'fran-1',
        name: 'Caneca Térmica Exclusiva',
        description: 'Mantenha seu café quente por até 4 horas com design elegante.',
        price: 129.90,
        imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800&h=800', // Unsplash Mug
        weight: 0.5, length: 15, width: 10, height: 10,
    },
    {
        id: 'prod-3',
        franchiseeId: 'fran-1',
        name: 'Ecobag Five Store',
        description: 'Sustentável, resistente e ideal para o dia a dia.',
        price: 49.90,
        imageUrl: 'https://images.unsplash.com/photo-1597348989645-46b190ce4918?auto=format&fit=crop&q=80&w=800&h=800', // Unsplash Tote bag
        weight: 0.2, length: 35, width: 35, height: 2,
    },
    {
        id: 'prod-4',
        franchiseeId: 'fran-2',
        name: 'Moletom Premium - Cinza',
        description: 'Para os dias frios, o máximo de conforto.',
        price: 249.90,
        imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800&h=800', // Unsplash Hoodie
        weight: 0.8, length: 30, width: 25, height: 10,
    }
];

export function ProductGrid() {
    const addItem = useCartStore((state) => state.addItem);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DUMMY_PRODUCTS.map((product) => (
                <div
                    key={product.id}
                    className="group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm border border-border/50 transition-all hover:shadow-lg hover:-translate-y-1"
                >
                    <div className="relative aspect-square overflow-hidden bg-muted">
                        {/* Using Next Image with unoptimized for external Unsplash URLs without configuring domains in next.config */}
                        <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100" />

                        <button
                            onClick={() => addItem({ ...product, quantity: 1, franchiseeId: product.franchiseeId })}
                            className="absolute bottom-4 right-4 translate-y-8 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:scale-105 active:scale-95"
                            aria-label="Adicionar ao carrinho"
                        >
                            <ShoppingCart className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                        <h3 className="font-urbanist font-semibold text-lg line-clamp-1 mb-1" title={product.name}>
                            {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                            {product.description}
                        </p>
                        <div className="flex items-end justify-between mt-auto">
                            <span className="font-bold text-xl text-primary">
                                {formatPrice(product.price)}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

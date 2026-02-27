'use client';

import { useSearchParams } from 'next/navigation';
import { ProductGrid } from '@/components/store/ProductGrid';
import { HeroBanner } from './HeroBanner';

export function HomeStore() {
    const searchParams = useSearchParams();
    const activeCategory = searchParams.get('category');

    return (
        <>
            <HeroBanner />

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 min-w-0">
                    <ProductGrid activeCategory={activeCategory} />
                </div>
            </div>
        </>
    );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductGrid } from '@/components/store/ProductGrid';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const banners = [
  {
    id: 1,
    title: 'Nova Coleção 2026',
    subtitle: 'Peças exclusivas para franqueados Five Store',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600&h=500',
    bg: 'bg-primary/60',
  },
  {
    id: 2,
    title: 'Frete Grátis',
    subtitle: 'Em pedidos acima de R$ 299 para todo o Brasil',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1600&h=500',
    bg: 'bg-purple-700/60',
  },
  {
    id: 3,
    title: 'Desconto no PIX',
    subtitle: '5% de desconto em todas as compras via PIX',
    image: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&q=80&w=1600&h=500',
    bg: 'bg-violet-700/60',
  },
];

function HeroBanner() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent(c => (c + 1) % banners.length), [banners.length]);
  const prev = () => setCurrent(c => (c - 1 + banners.length) % banners.length);

  // Auto-advance every 6 seconds
  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const banner = banners[current];

  return (
    <div className="relative w-full h-[280px] md:h-[360px] rounded-2xl overflow-hidden mb-10 group">
      {/* Background Image & Liquid Glass Overlay */}
      <div className="absolute inset-0 transition-all duration-1000 ease-in-out">
        <img
          src={banner.image}
          alt={banner.title}
          className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-1000"
        />
        {/* Deep blur overlay + gradient */}
        <div className={`absolute inset-0 ${banner.bg} backdrop-blur-md dark:backdrop-blur-xl mix-blend-multiply opacity-80`} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center h-full px-8 md:px-14 max-w-xl">
        <h2 className="font-heading font-semibold text-3xl md:text-5xl text-white mb-3 drop-shadow-xl leading-tight tracking-tight">
          {banner.title}
        </h2>
        <p className="text-white/90 text-base md:text-lg drop-shadow-md">
          {banner.subtitle}
        </p>
      </div>

      {/* Navigation Arrows (min 44x44px touch targets) */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-2xl border border-white/30 shadow-xl text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/40 hover:scale-110 focus:ring-2 focus:ring-white focus:outline-none"
        aria-label="Previous banner"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-2xl border border-white/30 shadow-xl text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/40 hover:scale-110 focus:ring-2 focus:ring-white focus:outline-none"
        aria-label="Next banner"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots (larger touch area) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-10">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="p-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full"
          >
            <div className={`h-2 rounded-full transition-all duration-500 ease-out ${i === current ? 'w-8 bg-white shadow-lg' : 'w-2 bg-white/50 hover:bg-white/80'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category');

  return (
    <div className="container px-4 md:px-8 mx-auto xl:max-w-7xl py-8">
      <HeroBanner />

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <ProductGrid activeCategory={activeCategory} />
        </div>
      </div>
    </div>
  );
}

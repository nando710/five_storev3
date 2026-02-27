'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProductGrid } from '@/components/store/ProductGrid';
import { CategorySidebar } from '@/components/store/CategorySidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const banners = [
  {
    id: 1,
    title: 'Nova Coleção 2026',
    subtitle: 'Peças exclusivas para franqueados Five Store',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600&h=500',
    bg: 'from-primary/80 to-primary/40',
  },
  {
    id: 2,
    title: 'Frete Grátis',
    subtitle: 'Em pedidos acima de R$ 299 para todo o Brasil',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1600&h=500',
    bg: 'from-emerald-700/80 to-emerald-500/40',
  },
  {
    id: 3,
    title: 'Desconto no PIX',
    subtitle: '5% de desconto em todas as compras via PIX',
    image: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&q=80&w=1600&h=500',
    bg: 'from-violet-700/80 to-violet-500/40',
  },
];

function HeroBanner() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent(c => (c + 1) % banners.length), []);
  const prev = () => setCurrent(c => (c - 1 + banners.length) % banners.length);

  // Auto-advance every 6 seconds
  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const banner = banners[current];

  return (
    <div className="relative w-full h-[280px] md:h-[360px] rounded-2xl overflow-hidden mb-10 group">
      {/* Background Image */}
      <div className="absolute inset-0 transition-all duration-700">
        <img
          src={banner.image}
          alt={banner.title}
          className="w-full h-full object-cover"
        />
        <div className={`absolute inset-0 bg-gradient-to-r ${banner.bg}`} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center h-full px-8 md:px-14 max-w-xl">
        <h2 className="font-urbanist font-extrabold text-3xl md:text-5xl text-white mb-3 drop-shadow-lg leading-tight">
          {banner.title}
        </h2>
        <p className="text-white/90 text-base md:text-lg drop-shadow-md">
          {banner.subtitle}
        </p>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/30"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/30"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <div className="container px-4 md:px-8 mx-auto xl:max-w-7xl py-8">
      <HeroBanner />

      <div className="flex flex-col lg:flex-row gap-8">
        <CategorySidebar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
        <div className="flex-1 min-w-0">
          <ProductGrid activeCategory={activeCategory} />
        </div>
      </div>
    </div>
  );
}

import { Suspense } from 'react';
import { HomeStore } from '@/components/store/HomeStore';

export default function Home() {
  return (
    <div className="container px-4 md:px-8 mx-auto xl:max-w-7xl py-8">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando loja...</div>}>
        <HomeStore />
      </Suspense>
    </div>
  );
}

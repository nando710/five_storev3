import { ProductGrid } from '@/components/store/ProductGrid';

export default function Home() {
  return (
    <div className="container px-4 md:px-8 mx-auto xl:max-w-7xl py-12">
      <div className="flex flex-col items-start gap-4 mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl font-urbanist text-foreground">
          Lançamentos exclusivos
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Descubra os produtos da nossa marca, disponíveis através das nossas franquias pelo Brasil.
        </p>
      </div>

      <ProductGrid />
    </div>
  );
}

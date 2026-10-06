'use client';
import Link from 'next/link';
import { useProducts } from './ProductsProvider';
import ProductGrid, { GridSkeleton } from './ProductGrid';

export default function FeaturedProducts() {
  const { products, status } = useProducts();
  const list = products.filter((p) => p.inStock).slice(0, 8);
  return (
    <section id="new" className="mx-auto max-w-6xl px-4 pt-16">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="font-display text-3xl font-bold tracking-tight">New arrivals</h2>
        <Link href="/products" className="text-sm font-medium underline underline-offset-4">View all</Link>
      </div>
      {status === 'loading' ? <GridSkeleton /> : list.length ? <ProductGrid products={list} /> :
        <p className="rounded bg-sand/60 p-6">{status === 'error' ? 'We couldn’t load products. Refresh the page to try again.' : 'New products are coming soon.'}</p>}
    </section>
  );
}

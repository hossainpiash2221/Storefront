'use client';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { SITE } from '@/lib/site';

export default function Header() {
  const { count, ready } = useCart();
  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-display text-xl font-bold tracking-tight">{SITE.name}</Link>
        <nav aria-label="Main" className="flex items-center gap-6 text-sm font-medium">
          <Link href="/products" className="hover:underline">Shop</Link>
          <Link href="/cart" className="relative inline-flex items-center gap-2 rounded bg-ink px-3 py-2 text-white hover:bg-peacock-dark">
            Cart
            <span className="min-w-5 rounded-full bg-white px-1.5 text-center text-xs font-semibold text-ink" aria-label={`${ready ? count : 0} items in cart`}>{ready ? count : 0}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

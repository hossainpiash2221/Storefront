import Link from 'next/link';
import { SITE } from '@/lib/site';
export default function Footer() {
  return (
    <footer className="mt-24 border-t border-ink/10 bg-sand/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-lg font-bold">{SITE.name}</p>
        <p className="max-w-sm text-ink/70">Delivered across Bangladesh. Pay in cash when your order arrives.</p>
        <nav aria-label="Footer" className="flex gap-5"><Link href="/products" className="hover:underline">Shop</Link><Link href="/cart" className="hover:underline">Cart</Link></nav>
      </div>
    </footer>
  );
}

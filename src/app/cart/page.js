import { useEffect } from 'react';

'use client';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import QuantityStepper from '@/components/QuantityStepper';
import Img from '@/components/Img';
import { taka } from '@/lib/format';
import { useStoreConfig, deliveryFor } from '@/lib/store-config';

export default function CartPage() {
  const { items, ready, subtotal, setQty, remove } = useCart();
  const cfg = useStoreConfig();

  
  useEffect(() => {
  if (!ready || !items.length) return;
  fetch('/api/quote', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, quantity: i.qty, color: i.color || '', size: i.size || '' })) }),
  }).catch(() => {});
}, [ready]); // eslint-disable-line react-hooks/exhaustive-deps


  if (!ready) return <div className="mx-auto max-w-4xl px-4 py-16" aria-busy="true"><div className="h-40 animate-pulse rounded bg-mist" /></div>;
  if (!items.length) return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-bold">Your cart is empty</h1>
      <p className="mt-3 text-ink/70">Add a product and it will wait for you here, even if you close the page.</p>
      <Link href="/products" className="mt-8 inline-block rounded bg-peacock px-6 py-3 font-semibold text-white hover:bg-peacock-dark">Browse products</Link>
    </div>
  );
  const delivery = deliveryFor(cfg, subtotal);
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold tracking-tight">Your cart</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {items.map((i) => (
            <li key={i.key} className="flex gap-4 py-5">
              <Link href={`/products/${i.slug}`} className="h-28 w-24 shrink-0 overflow-hidden rounded bg-mist"><Img src={i.image} alt={i.name} className="h-full w-full object-cover" /></Link>
              <div className="flex-1">
                <Link href={`/products/${i.slug}`} className="font-medium hover:underline">{i.name}</Link>
                {(i.color || i.size) && <p className="text-sm text-ink/60">{[i.color, i.size].filter(Boolean).join(' · ')}</p>}
                <p className="mt-1 text-sm">{taka(i.price)}</p>
                <div className="mt-3 flex items-center gap-4">
                  <QuantityStepper value={i.qty} max={i.max || 99} onChange={(q) => setQty(i.key, q)} label={`Quantity for ${i.name}`} />
                  <button className="text-sm underline underline-offset-2 hover:text-madder" onClick={() => remove(i.key)}>Remove</button>
                </div>
              </div>
              <p className="font-semibold">{taka(i.price * i.qty)}</p>
            </li>
          ))}
        </ul>
        <aside className="h-fit rounded bg-sand/60 p-5" aria-label="Order summary">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{taka(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd>{cfg.loaded ? (delivery ? taka(delivery) : 'Free') : '…'}</dd></div>
            <div className="flex justify-between border-t border-ink/15 pt-3 text-lg font-bold"><dt>Total</dt><dd>{taka(subtotal + (cfg.loaded ? delivery : 0))}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-ink/60">Final prices and stock are confirmed when you place the order.</p>
          <Link href="/checkout" className="mt-5 block rounded bg-peacock px-6 py-3 text-center font-semibold text-white hover:bg-peacock-dark">Checkout</Link>
        </aside>
      </div>
    </div>
  );
}

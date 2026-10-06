'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from './CartProvider';
import QuantityStepper from './QuantityStepper';

function Options({ label, values, value, onChange }) {
  if (!values.length) return null;
  return (
    <fieldset className="mt-6">
      <legend className="mb-2 text-sm font-semibold">{label}{value ? `: ${value}` : ''}</legend>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <button type="button" key={v} aria-pressed={value === v} onClick={() => onChange(v)}
            className={`min-w-12 rounded border px-4 py-2 text-sm font-medium ${value === v ? 'border-peacock bg-peacock text-white' : 'border-ink/25 bg-white hover:border-ink/60'}`}>{v}</button>
        ))}
      </div>
    </fieldset>
  );
}

export default function ProductBuy({ p }) {
  const { add } = useCart();
  const router = useRouter();
  const [color, setColor] = useState(p.colors.length === 1 ? p.colors[0] : '');
  const [size, setSize] = useState(p.sizes.length === 1 ? p.sizes[0] : '');
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState('');
  const [added, setAdded] = useState(false);
  const max = Math.max(1, Math.min(p.stock, 20));

  function build() {
    if (p.colors.length && !color) { setErr('Choose a colour first.'); return null; }
    if (p.sizes.length && !size) { setErr('Choose a size first.'); return null; }
    setErr('');
    return { productId: p.id, slug: p.slug, name: p.productName, image: p.images[0] || '', price: p.price, color, size, qty, max: p.stock };
  }

  if (!p.inStock) return <p className="mt-8 rounded bg-sand p-4 font-medium">This product is sold out right now.</p>;
  return (
    <div>
      <Options label="Colour" values={p.colors} value={color} onChange={setColor} />
      <Options label="Size" values={p.sizes} value={size} onChange={setSize} />
      <div className="mt-6"><QuantityStepper value={qty} onChange={setQty} max={max} /></div>
      {p.stock <= 5 && <p className="mt-3 text-sm font-medium text-madder">Only {p.stock} left</p>}
      {err && <p role="alert" className="mt-3 text-sm font-medium text-madder">{err}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="rounded bg-peacock px-6 py-3 font-semibold text-white hover:bg-peacock-dark" onClick={() => { const i = build(); if (i) { add(i); setAdded(true); } }}>Add to cart</button>
        <button className="rounded border border-ink px-6 py-3 font-semibold hover:bg-ink hover:text-white" onClick={() => { const i = build(); if (i) { add(i); router.push('/checkout'); } }}>Buy now</button>
      </div>
      {added && <p role="status" className="mt-4 text-sm">Added to your cart. <Link href="/cart" className="font-semibold underline">View cart</Link></p>}
    </div>
  );
}

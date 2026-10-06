'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/components/CartProvider';
import Img from '@/components/Img';
import { taka, PHONE_RE, cleanPhone } from '@/lib/format';
import { useStoreConfig, deliveryFor } from '@/lib/store-config';

const RID_KEY = 'checkout.rid';

// One request ID per cart contents. A double click, a retry after a dropped connection, or a page
// reload re-sends the SAME id, and Apps Script returns the original order instead of creating another.
function requestId(sig) {
  try { const s = JSON.parse(sessionStorage.getItem(RID_KEY) || 'null'); if (s && s.sig === sig) return s.rid; } catch {}
  const rid = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}-0000000000`;
  try { sessionStorage.setItem(RID_KEY, JSON.stringify({ sig, rid })); } catch {}
  return rid;
}

function validate(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Enter your name.';
  if (!PHONE_RE.test(cleanPhone(f.phone))) e.phone = 'Enter an 11-digit mobile number, like 01712345678.';
  if (f.address.trim().length < 5) e.address = 'Enter your full address (house, road, area).';
  if (!f.city.trim()) e.city = 'Enter your city or area.';
  if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'This email address looks incomplete.';
  return e;
}

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink/60">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-sm font-medium text-madder">{error}</p>}
    </div>
  );
}
const input = 'w-full rounded border border-ink/25 bg-white px-3 py-2.5';

export default function CheckoutPage() {
  const { items, ready, subtotal, sync, remove, clear } = useCart();
  const cfg = useStoreConfig();
  const router = useRouter();
  const [quote, setQuote] = useState(null);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', city: '', note: '', website: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [submitErr, setSubmitErr] = useState('');
  const lock = useRef(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const payloadItems = () => items.map((i) => ({ productId: i.productId, quantity: i.qty, color: i.color || '', size: i.size || '' }));
  const sig = items.map((i) => `${i.productId}:${i.qty}:${i.color || ''}:${i.size || ''}`).join('|');

  // Re-check every line with the server: product exists, is active, variant valid, current price, stock.
  useEffect(() => {
    if (!ready || !items.length) return;
    let dead = false;
    setQuote(null);
    fetch('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: payloadItems() }) })
      .then((r) => r.json())
      .then((j) => {
        if (dead) return;
        if (!j.success) throw new Error(j.error);
        const changed = j.data.lines.filter((l, i) => l.ok && Number(l.price) !== Number(items[i]?.price)).map((l) => l.name);
        if (changed.length) setNotice(`Price updated for: ${changed.join(', ')}.`);
        setQuote(j.data);
        sync(j.data.lines.map((l, i) => ({ key: items[i].key, patch: l.ok ? { price: l.price, max: l.stock, name: l.name, image: l.image || items[i].image, productId: l.productId } : {} })));
      })
      .catch((e) => { if (!dead) setSubmitErr(e.message || 'We couldn’t check your cart. Refresh and try again.'); });
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, sig]);

  async function submit(ev) {
    ev.preventDefault();
    if (lock.current) return;                                   // blocks double clicks instantly, before React re-renders
    const errs = validate(form); setErrors(errs);
    if (Object.keys(errs).length) { document.getElementById(`f-${Object.keys(errs)[0]}`)?.focus(); return; }
    if (!quote?.allOk) { setSubmitErr('Some items need your attention. See the notes next to them.'); return; }
    lock.current = true; setBusy(true); setSubmitErr('');
    try {
      const res = await fetch('/api/order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: requestId(sig), customerName: form.name, phone: form.phone, email: form.email, address: form.address, city: form.city, note: form.note, website: form.website, items: payloadItems() }),
      });
      const j = await res.json().catch(() => null);
      if (!j) throw new Error('network');
      if (!j.success) { setSubmitErr(j.error || 'We couldn’t place your order.'); lock.current = false; setBusy(false); return; }
      try { sessionStorage.removeItem(RID_KEY); } catch {}
      clear();
      router.replace(`/order-success?id=${encodeURIComponent(j.data.orderId)}`);
    } catch {
      setSubmitErr('We couldn’t confirm your order because the connection dropped. Press Place order again. It is safe: the same request is reused, so you won’t be charged or ordered twice.');
      lock.current = false; setBusy(false);
    }
  }

  if (!ready) return <div className="mx-auto max-w-5xl px-4 py-16" aria-busy="true"><div className="h-64 animate-pulse rounded bg-mist" /></div>;
  if (!items.length) return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-bold">Nothing to check out</h1>
      <Link href="/products" className="mt-8 inline-block rounded bg-peacock px-6 py-3 font-semibold text-white hover:bg-peacock-dark">Browse products</Link>
    </div>
  );

  const sub = quote ? quote.subtotal : subtotal;
  const delivery = quote ? quote.deliveryCharge : deliveryFor(cfg, subtotal);
  const total = quote ? quote.total : subtotal + (cfg.loaded ? delivery : 0);
  const ok = !!quote?.allOk;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold tracking-tight">Checkout</h1>
      <form onSubmit={submit} noValidate className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          <h2 className="font-display text-xl font-bold">Delivery details</h2>
          <Field id="f-name" label="Full name" error={errors.name}><input id="f-name" autoComplete="name" className={input} value={form.name} onChange={set('name')} aria-describedby={errors.name ? 'f-name-err' : undefined} /></Field>
          <Field id="f-phone" label="Mobile number" error={errors.phone} hint="The courier will call this number."><input id="f-phone" type="tel" inputMode="numeric" autoComplete="tel" className={input} value={form.phone} onChange={set('phone')} placeholder="01712345678" /></Field>
          <Field id="f-address" label="Full address" error={errors.address}><input id="f-address" autoComplete="street-address" className={input} value={form.address} onChange={set('address')} placeholder="House, road, area" /></Field>
          <Field id="f-city" label="City / area" error={errors.city}><input id="f-city" autoComplete="address-level2" className={input} value={form.city} onChange={set('city')} placeholder="e.g. Dhaka, Mirpur" /></Field>
          <Field id="f-email" label="Email (optional)" error={errors.email}><input id="f-email" type="email" autoComplete="email" className={input} value={form.email} onChange={set('email')} /></Field>
          <Field id="f-note" label="Delivery note (optional)"><textarea id="f-note" rows={2} maxLength={300} className={input} value={form.note} onChange={set('note')} /></Field>
          {/* honeypot: hidden from people, bots fill it */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} /></label></div>
          <p className="rounded bg-sand/60 p-3 text-sm">Payment: <strong>Cash on delivery</strong>. You pay when the order arrives.</p>
        </div>

        <aside className="h-fit rounded bg-sand/60 p-5" aria-label="Order summary">
          <h2 className="font-display text-xl font-bold">Your order</h2>
          {notice && <p role="status" className="mt-3 rounded bg-white p-2 text-sm">{notice}</p>}
          <ul className="mt-4 space-y-4">
            {items.map((i, n) => {
              const l = quote?.lines?.[n];
              return (
                <li key={i.key} className="flex gap-3 text-sm">
                  <div className="h-16 w-14 shrink-0 overflow-hidden rounded bg-mist"><Img src={i.image} alt="" className="h-full w-full object-cover" /></div>
                  <div className="flex-1">
                    <p className="font-medium">{i.name}</p>
                    <p className="text-ink/60">{[i.color, i.size].filter(Boolean).join(' · ')}{(i.color || i.size) ? ' · ' : ''}Qty {i.qty}</p>
                    {l && !l.ok && <p role="alert" className="mt-1 font-medium text-madder">{l.error} <button type="button" className="underline" onClick={() => remove(i.key)}>Remove</button></p>}
                  </div>
                  <p className="font-semibold">{taka(i.price * i.qty)}</p>
                </li>
              );
            })}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-ink/15 pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{taka(sub)}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd>{quote || cfg.loaded ? (delivery ? taka(delivery) : 'Free') : '…'}</dd></div>
            <div className="flex justify-between text-lg font-bold"><dt>Total to pay</dt><dd>{taka(total)}</dd></div>
          </dl>
          {submitErr && <p role="alert" className="mt-4 text-sm font-medium text-madder">{submitErr}</p>}
          <button type="submit" disabled={busy || !ok} className="mt-5 w-full rounded bg-peacock px-6 py-3.5 font-semibold text-white hover:bg-peacock-dark disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? 'Placing your order…' : quote ? 'Place order' : 'Checking your cart…'}
          </button>
          <p className="mt-3 text-xs text-ink/60">Prices, stock and delivery are confirmed by our server when you place the order.</p>
        </aside>
      </form>
    </div>
  );
}

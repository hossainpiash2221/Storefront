import Link from 'next/link';
export const metadata = { title: 'Order placed', robots: { index: false, follow: false } };

export default async function OrderSuccess({ searchParams }) {
  const { id } = await searchParams;
  const orderId = /^ORD-\d{8}-\d{3,}$/.test(String(id || '')) ? id : null;
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-bold">Thank you, your order is placed</h1>
      {orderId && <p className="mt-4 text-lg">Order number <strong className="font-mono">{orderId}</strong></p>}
      <p className="mt-3 text-ink/70">Keep this number. We will confirm your order and deliver it to your address. Pay in cash when it arrives.</p>
      <Link href="/products" className="mt-8 inline-block rounded bg-peacock px-6 py-3 font-semibold text-white hover:bg-peacock-dark">Continue shopping</Link>
    </div>
  );
}

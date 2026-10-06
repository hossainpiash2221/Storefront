import Link from 'next/link';
export const metadata = { title: 'Page not found', robots: { index: false } };
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-bold">We couldn’t find that page</h1>
      <p className="mt-3 text-ink/70">The product may have been removed or the link is wrong.</p>
      <Link href="/products" className="mt-8 inline-block rounded bg-peacock px-6 py-3 font-semibold text-white hover:bg-peacock-dark">Browse all products</Link>
    </div>
  );
}

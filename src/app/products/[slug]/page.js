import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE } from '@/lib/site';
import { taka } from '@/lib/format';
import { getProducts, getProductBySlug } from '@/lib/products';
import Gallery from '@/components/Gallery';
import ProductBuy from '@/components/ProductBuy';

export const revalidate = 120;

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: 'Product not found', robots: { index: false } };
  const desc = (p.description || `${p.productName} for ${p.price} BDT. Cash on delivery across Bangladesh.`).replace(/\s+/g, ' ').slice(0, 155);
  return {
    title: p.productName,
    description: desc,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { type: 'website', title: p.productName, description: desc, url: `${SITE.url}/products/${p.slug}`, images: p.images.slice(0, 1).map((url) => ({ url })) },
    twitter: { card: 'summary_large_image', title: p.productName, description: desc, images: p.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const off = p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const url = `${SITE.url}/products/${p.slug}`;
  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'Product', name: p.productName, sku: p.id, category: p.category,
      description: p.description || p.productName, image: p.images, url,
      offers: { '@type': 'Offer', url, priceCurrency: SITE.currency, price: String(p.price), availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', itemCondition: 'https://schema.org/NewCondition' },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
        { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE.url}/products` },
        { '@type': 'ListItem', position: 3, name: p.productName, item: url },
      ],
    },
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink/70">
        <Link href="/" className="hover:underline">Home</Link> / <Link href="/products" className="hover:underline">Shop</Link> / <span aria-current="page">{p.productName}</span>
      </nav>
      <div className="grid gap-10 md:grid-cols-2">
        <Gallery images={p.images} alt={p.productName} />
        <article>
          <p className="text-sm text-ink/60">{p.gender} · {p.category}</p>
          <h1 className="mt-1 font-display text-4xl font-bold leading-tight tracking-tight">{p.productName}</h1>
          <p className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold">{taka(p.price)}</span>
            {off > 0 && <><s className="text-lg text-ink/50">{taka(p.oldPrice)}</s><span className="rounded bg-madder px-2 py-0.5 text-sm font-semibold text-white">{off}% off</span></>}
          </p>
          <ProductBuy p={p} />
          {p.description && (
            <section className="mt-10 border-t border-ink/10 pt-6" aria-labelledby="desc">
              <h2 id="desc" className="font-display text-xl font-bold">About this product</h2>
              <p className="mt-2 max-w-prose whitespace-pre-line leading-relaxed text-ink/80">{p.description}</p>
            </section>
          )}
        </article>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
    </div>
  );
}

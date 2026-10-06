import { SITE } from '@/lib/site';
import { getProducts } from '@/lib/products';

export const revalidate = 3600;

export default async function sitemap() {
  const now = new Date();
  const products = await getProducts();
  return [
    { url: SITE.url, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE.url}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    ...products.map((p) => ({ url: `${SITE.url}/products/${p.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 })),
  ];
}

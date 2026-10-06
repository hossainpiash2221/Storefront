import { scriptGet } from './apps-script';

export function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

/** Clean URLs from the product name. Collisions (or non-Latin names) fall back to the product ID. */
export function withSlugs(list) {
  const seen = new Set();
  return list.map((p) => {
    let slug = slugify(p.productName) || String(p.id).toLowerCase();
    if (seen.has(slug)) slug = `${slug}-${String(p.id).toLowerCase()}`;
    seen.add(slug);
    return { ...p, colors: p.colors || [], sizes: p.sizes || [], images: p.images || [], slug };
  });
}

export async function getProducts() {
  try { return withSlugs(await scriptGet({ action: 'products' }, 120)); }
  catch (e) { console.error('getProducts failed:', e.message); return []; }
}

export async function getProductBySlug(slug) {
  return (await getProducts()).find((p) => p.slug === slug) || null;
}

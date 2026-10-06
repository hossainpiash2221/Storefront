'use client';
import { useMemo, useState } from 'react';
import { useProducts } from './ProductsProvider';
import ProductGrid, { GridSkeleton } from './ProductGrid';

const chip = (on) => `rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${on ? 'border-peacock bg-peacock text-white' : 'border-ink/20 hover:border-ink/50'}`;

export default function ProductExplorer() {
  const { products, status } = useProducts();
  const [gender, setGender] = useState('All');
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('new');

  const genders = useMemo(() => ['All', ...new Set(products.map((p) => p.gender).filter(Boolean))], [products]);
  const cats = useMemo(() => ['All', ...new Set(products.filter((p) => gender === 'All' || p.gender === gender).map((p) => p.category).filter(Boolean))], [products, gender]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    let l = products.filter((p) => (gender === 'All' || p.gender === gender) && (cat === 'All' || p.category === cat) && (!s || p.productName.toLowerCase().includes(s)));
    if (sort === 'low') l = [...l].sort((a, b) => a.price - b.price);
    if (sort === 'high') l = [...l].sort((a, b) => b.price - a.price);
    return [...l.filter((p) => p.inStock), ...l.filter((p) => !p.inStock)];
  }, [products, gender, cat, q, sort]);

  if (status === 'loading') return <GridSkeleton />;
  return (
    <>
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by gender">
          {genders.map((g) => <button key={g} aria-pressed={gender === g} className={chip(gender === g)} onClick={() => { setGender(g); setCat('All'); }}>{g}</button>)}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {cats.map((c) => <button key={c} aria-pressed={cat === c} className={chip(cat === c)} onClick={() => setCat(c)}>{c}</button>)}
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="sr-only" htmlFor="q">Search products</label>
          <input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="w-full max-w-xs rounded border border-ink/20 bg-white px-3 py-2 sm:w-auto" />
          <label className="sr-only" htmlFor="sort">Sort</label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)} className="rounded border border-ink/20 bg-white px-3 py-2">
            <option value="new">Newest first</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option>
          </select>
        </div>
      </div>
      {list.length ? <ProductGrid products={list} /> :
        <p className="rounded bg-sand/60 p-6">{status === 'error' ? 'We couldn’t load products. Refresh the page to try again.' : 'No products match. Try clearing a filter.'}</p>}
    </>
  );
}

import ProductExplorer from '@/components/ProductExplorer';

export const metadata = {
  title: 'Shop all products',
  description: 'Browse three-piece, shirts, T-shirts and more. Filter by category, order online, pay on delivery anywhere in Bangladesh.',
  alternates: { canonical: '/products' },
};

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 font-display text-4xl font-bold tracking-tight">Shop</h1>
      <ProductExplorer />
    </div>
  );
}

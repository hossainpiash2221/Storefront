import Link from 'next/link';
import Img from './Img';
import { taka } from '@/lib/format';

export default function ProductCard({ p, priority = false }) {
  const off = p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <li>
      <Link href={`/products/${p.slug}`} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden rounded bg-mist">
          <Img src={p.images[0]} alt={p.productName} priority={priority}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${p.inStock ? '' : 'opacity-60'}`} />
          {!p.inStock && <span className="absolute left-2 top-2 rounded bg-ink px-2 py-1 text-xs font-medium text-white">Sold out</span>}
          {p.inStock && off > 0 && <span className="absolute left-2 top-2 rounded bg-madder px-2 py-1 text-xs font-semibold text-white">{off}% off</span>}
        </div>
        <h3 className="mt-3 font-medium leading-snug group-hover:underline">{p.productName}</h3>
        <p className="mt-1 flex items-baseline gap-2 text-sm">
          <span className="font-semibold">{taka(p.price)}</span>
          {off > 0 && <s className="text-ink/50">{taka(p.oldPrice)}</s>}
        </p>
      </Link>
    </li>
  );
}

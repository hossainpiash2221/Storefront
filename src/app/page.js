import Hero from '@/components/Hero';
import FeaturedProducts from '@/components/FeaturedProducts';

export const metadata = { alternates: { canonical: '/' } };

const steps = [
  ['Choose', 'Pick a product, colour and size.'],
  ['Order', 'Enter your name, phone and address. No account needed.'],
  ['Pay on delivery', 'We deliver to your door. You pay in cash when it arrives.'],
];

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedProducts />
      <section className="mx-auto max-w-6xl px-4 pt-20" aria-labelledby="how">
        <h2 id="how" className="font-display text-3xl font-bold tracking-tight">How ordering works</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map(([t, d], i) => (
            <li key={t} className="border-t-2 border-peacock pt-4">
              <p className="font-display text-sm font-bold text-peacock">Step {i + 1}</p>
              <p className="mt-1 text-lg font-semibold">{t}</p>
              <p className="mt-1 text-ink/75">{d}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

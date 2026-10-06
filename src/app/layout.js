import './globals.css';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import { SITE } from '@/lib/site';
import { getProducts } from '@/lib/products';
import ProductsProvider from '@/components/ProductsProvider';
import CartProvider from '@/components/CartProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SpeedInsights } from "@vercel/speed-insights/next"

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Figtree({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const revalidate = 120;

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} | Three-piece & fashion, delivered across Bangladesh`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  openGraph: { type: 'website', siteName: SITE.name, title: SITE.name, description: SITE.description, url: SITE.url, locale: 'en_BD' },
  twitter: { card: 'summary_large_image', title: SITE.name, description: SITE.description },
};
export const viewport = { themeColor: '#0F5C6B' };

export default async function RootLayout({ children }) {
  // Served from Next's 2-minute cache, so this normally costs nothing. Only the first request after a cold start waits on Apps Script.
  const products = await getProducts();
  const ld = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'Organization', name: SITE.name, url: SITE.url },
      { '@type': 'WebSite', name: SITE.name, url: SITE.url },
    ],
  };
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
        <ProductsProvider initial={products}>
          <CartProvider>
            <Header />
            <main id="main">{children}</main>
            <Footer />
          </CartProvider>
        </ProductsProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
         <SpeedInsights />
      </body>
    </html>
  );
}

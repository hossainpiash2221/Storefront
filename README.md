# Storefront (Next.js 15 + React 19 + Tailwind 3)

Customer → Next.js (server) → Apps Script → Google Sheet → your existing Order Manager → Steadfast.
The browser only ever talks to this site's `/api/*`. The Apps Script URL, `API_SECRET`, Sheet and Steadfast keys stay on the server.

## Setup
1. **Apps Script**: replace section 8 of `Code.gs` with `apps-script/Section8-API-replacement.gs`, add Script properties `API_SECRET` and a NEW `ADMIN_TOKEN`, delete the old `ADMIN_TOKEN` constant, then Deploy > Manage deployments > New version.
2. `cp .env.example .env.local` and fill in `APPS_SCRIPT_URL`, `API_SECRET`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_STORE_NAME`.
3. `npm install && npm run dev` (open http://localhost:3000), later `npm run build && npm start`.
4. Deploy on Vercel (add the same 4 env vars). Optional: put a short muted clip at `public/hero.mp4`.

## Colours and sizes (no sheet changes)
Add lines to a product's Description in the sheet:
```
Colors: Black, Navy, Maroon
Sizes: M, L, XL
```
They become options on the product page, are validated by Apps Script, and the customer's choice is written to the order's Delivery Note.

## How the requirements are met
- **Fast products page**: the server caches the product list for 2 min (Next data cache, on top of Apps Script's own 2 min cache). It is already in the first HTML, held in React state for the whole visit, mirrored to sessionStorage, and refreshed in the background after 5 min. If the server copy is ever empty, the browser fetches it right after the hero paints.
- **Prices are never trusted**: `/api/quote` and `/api/order` accept only productId, quantity, colour, size. Apps Script re-reads price, status, stock, variant and delivery charge from the sheet and calculates the total.
- **Duplicate orders**: the checkout sends one `requestId` per cart. Apps Script keeps it for 6 h, so double clicks and retries return the original order. A second guard blocks the same phone + same items within 2 min.
- **Abuse**: shared secret (fail closed), honeypot field, per-IP limit on the Next server, per-phone (5/hour) and global (60/min) limits in Apps Script.
- **SEO**: server-rendered pages, per-page titles/descriptions/canonicals, Open Graph, Product + Breadcrumb JSON-LD, `/sitemap.xml`, `/robots.txt`, clean URLs like `/products/three-piece-black` (slug from the product name).

## Known limits
- Apps Script rate limits use CacheService, so they are good against casual abuse, not a determined attacker.
- Per-IP limiting on the Next server is per serverless instance. Add Vercel Firewall rate limiting for `/api/order`.
- Stock is per product, not per colour, because the sheet has no per-colour stock.
- Product images are Google Drive thumbnails (plain `<img>`). If Drive throttles them on a busy day, move images to a CDN.

export const SITE = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || 'My Store',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  description: 'Ready-made three-piece and fashion essentials, delivered across Bangladesh with cash on delivery.',
  currency: 'BDT',
};

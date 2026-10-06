const nf = new Intl.NumberFormat('en-BD', { maximumFractionDigits: 2 });
export const taka = (n) => '৳' + nf.format(Number(n) || 0);
// Same rule as Apps Script createOrder_
export const PHONE_RE = /^(?:\+?88)?01[3-9]\d{8}$/;
export const cleanPhone = (p) => String(p || '').trim().replace(/[\s-]/g, '');

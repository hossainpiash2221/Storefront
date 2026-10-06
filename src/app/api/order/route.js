import { NextResponse } from 'next/server';
import { scriptPost } from '@/lib/apps-script';
import { allow, clientIp } from '@/lib/rate-limit';
import { PHONE_RE, cleanPhone } from '@/lib/format';
import { cleanItems } from '@/lib/order-input';

export const dynamic = 'force-dynamic';
const fail = (error, status = 400) => NextResponse.json({ success: false, error }, { status });

export async function POST(req) {
  if (!allow('order:' + clientIp(req), 6, 10 * 60_000)) return fail('Too many attempts. Please wait a few minutes and try again.', 429);
  let b; try { b = await req.json(); } catch { return fail('Invalid request.'); }

  const requestId = String(b?.requestId || '');
  if (!/^[A-Za-z0-9-]{16,64}$/.test(requestId)) return fail('Invalid request.');
  if (b.website) return fail('Request rejected.');                       // honeypot field, humans leave it empty

  const name = String(b.customerName || '').trim(), phone = cleanPhone(b.phone);
  const address = String(b.address || '').trim(), city = String(b.city || '').trim();
  if (name.length < 2 || name.length > 100) return fail('Please enter your name.');
  if (!PHONE_RE.test(phone)) return fail('Enter a valid 11-digit mobile number, like 01712345678.');
  if (address.length < 5 || address.length > 250) return fail('Please enter your full address.');
  if (!city || city.length > 100) return fail('Please enter your city or area.');
  const items = cleanItems(b.items);
  if (!items) return fail('Your cart is empty.');

  try {
    // Whitelisted fields only. Prices, totals and delivery are computed inside Apps Script from the sheet.
    const data = await scriptPost({
      action: 'placeOrder', requestId, customerName: name, phone, address, city,
      email: String(b.email || '').trim().slice(0, 100), note: String(b.note || '').trim().slice(0, 300), items,
    });
    return NextResponse.json({ success: true, data });
  } catch (e) { return fail(e.message, 422); }
}

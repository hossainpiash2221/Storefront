import { NextResponse } from 'next/server';
import { scriptPost } from '@/lib/apps-script';
import { allow, clientIp } from '@/lib/rate-limit';
import { cleanItems } from '@/lib/order-input';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!allow('quote:' + clientIp(req), 40, 60_000)) return NextResponse.json({ success: false, error: 'Too many requests.' }, { status: 429 });
  let body; try { body = await req.json(); } catch { body = null; }
  const items = cleanItems(body?.items);
  if (!items) return NextResponse.json({ success: false, error: 'Your cart is empty.' }, { status: 400 });
  try { return NextResponse.json({ success: true, data: await scriptPost({ action: 'quote', items }) }); }
  catch (e) { return NextResponse.json({ success: false, error: e.message }, { status: 502 }); }
}

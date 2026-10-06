import { NextResponse } from 'next/server';
import { scriptGet } from '@/lib/apps-script';

export const revalidate = 300;

export async function GET() {
  try {
    const data = await scriptGet({ action: 'config' }, 300);
    return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Config unavailable.' }, { status: 502 });
  }
}

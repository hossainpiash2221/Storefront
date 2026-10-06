// Best-effort per-instance limiter. Apps Script enforces the real limits (per phone, global).
const buckets = new Map();
export function allow(key, max, windowMs) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) { buckets.set(key, hits); return false; }
  hits.push(now); buckets.set(key, hits);
  if (buckets.size > 5000) for (const [k, v] of buckets) if (!v.length || now - v[v.length - 1] > windowMs) buckets.delete(k);
  return true;
}
export const clientIp = (req) => (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';

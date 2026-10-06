// SERVER ONLY. The Apps Script URL and secret never reach the browser.
export class ApiError extends Error {}

function config() {
  const url = process.env.APPS_SCRIPT_URL, secret = process.env.API_SECRET;
  if (!url || !secret) throw new ApiError('Store is not configured.');
  return { url, secret };
}

async function unwrap(res) {
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new ApiError('Store service returned an unexpected response.'); }
  if (!json.success) throw new ApiError(String(json.error || 'Request failed').slice(0, 200));
  return json.data;
}

/** revalidate: seconds for Next's data cache. Omit for no caching. */
export async function scriptGet(params, revalidate) {
  const { url, secret } = config();
  const u = new URL(url);
  Object.entries({ ...params, secret }).forEach(([k, v]) => u.searchParams.set(k, v));
  const res = await fetch(u, revalidate ? { next: { revalidate } } : { cache: 'no-store' });
  return unwrap(res);
}

export async function scriptPost(body) {
  const { url, secret } = config();
  // text/plain avoids a CORS preflight, which Apps Script cannot answer
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...body, secret }),
    cache: 'no-store',
    redirect: 'follow',
  });
  return unwrap(res);
}

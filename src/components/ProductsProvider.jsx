'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const Ctx = createContext({ products: [], status: 'loading', refresh: () => {} });
export const useProducts = () => useContext(Ctx);
const KEY = 'products.v1', TTL = 5 * 60 * 1000;

/**
 * Product data lives here for the whole visit, so navigating Home -> Products never refetches.
 * - `initial` comes from the server's cached (ISR) copy, so it is already in the first HTML.
 * - If that was empty (cache miss / API hiccup) we fetch in the background on mount,
 *   after painting the hero, and keep a copy in sessionStorage.
 * - After 5 minutes, the next tab focus quietly refreshes it.
 */
export default function ProductsProvider({ initial = [], children }) {
  const [products, setProducts] = useState(initial);
  const [status, setStatus] = useState(initial.length ? 'ready' : 'loading');
  const last = useRef(initial.length ? Date.now() : 0);
  const inflight = useRef(null);

  const refresh = useCallback(() => {
    if (inflight.current) return inflight.current;
    inflight.current = fetch('/api/products')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => {
        if (!Array.isArray(j.data)) return;
        setProducts(j.data); setStatus('ready'); last.current = Date.now();
        try { sessionStorage.setItem(KEY, JSON.stringify({ t: last.current, data: j.data })); } catch {}
      })
      .catch(() => setStatus((s) => (s === 'loading' ? 'error' : s)))
      .finally(() => { inflight.current = null; });
    return inflight.current;
  }, []);

  useEffect(() => {
    if (!initial.length) {
      try {
        const c = JSON.parse(sessionStorage.getItem(KEY) || 'null');
        if (c && Array.isArray(c.data) && c.data.length) { setProducts(c.data); setStatus('ready'); last.current = c.t; }
      } catch {}
    }
    if (Date.now() - last.current > TTL) refresh();
    const onVisible = () => { if (document.visibilityState === 'visible' && Date.now() - last.current > TTL) refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Ctx.Provider value={{ products, status, refresh }}>{children}</Ctx.Provider>;
}

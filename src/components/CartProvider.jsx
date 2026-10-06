'use client';
import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';

const KEY = 'cart.v1';
const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);
export const lineKey = (i) => `${i.productId}|${i.color || ''}|${i.size || ''}`;

function reducer(state, a) {
  switch (a.type) {
    case 'load': return a.items;
    case 'add': {
      const i = state.findIndex((x) => x.key === a.item.key);
      if (i < 0) return [...state, a.item];
      const next = [...state];
      next[i] = { ...next[i], ...a.item, qty: Math.min(next[i].qty + a.item.qty, a.item.max || 99) };
      return next;
    }
    case 'qty': return state.map((x) => x.key === a.key ? { ...x, qty: Math.max(1, Math.min(a.qty, x.max || 99)) } : x);
    case 'remove': return state.filter((x) => x.key !== a.key);
    case 'sync': { // server-confirmed data wins over what the browser remembered
      const patches = new Map(a.updates.map((u) => [u.key, u.patch]));
      return state.map((x) => patches.has(x.key) ? { ...x, ...patches.get(x.key) } : x);
    }
    case 'clear': return [];
    default: return state;
  }
}

function sanitize(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((i) => i && typeof i.productId === 'string' && Number.isInteger(i.qty) && i.qty > 0 && Number(i.price) >= 0)
    .slice(0, 30).map((i) => ({ ...i, key: i.key || lineKey(i) }));
}

export default function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, []);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { dispatch({ type: 'load', items: sanitize(JSON.parse(localStorage.getItem(KEY) || '[]')) }); } catch {}
    setReady(true);
    const onStorage = (e) => { if (e.key === KEY) try { dispatch({ type: 'load', items: sanitize(JSON.parse(e.newValue || '[]')) }); } catch {} };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => { if (ready) try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {} }, [items, ready]);

  const value = useMemo(() => ({
    items, ready,
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.qty * i.price, 0),   // display only; never sent to the server
    add: (item) => dispatch({ type: 'add', item: { ...item, key: lineKey(item) } }),
    setQty: (key, qty) => dispatch({ type: 'qty', key, qty }),
    remove: (key) => dispatch({ type: 'remove', key }),
    sync: (updates) => dispatch({ type: 'sync', updates }),
    clear: () => dispatch({ type: 'clear' }),
  }), [items, ready]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

'use client';
import { useEffect, useState } from 'react';
let cache = null;
export function useStoreConfig() {
  const [c, setC] = useState(cache || { deliveryCharge: 0, freeDeliveryAbove: 0, loaded: false });
  useEffect(() => {
    if (cache) return;
    fetch('/api/config').then((r) => r.json()).then((j) => {
      if (j.data) { cache = { ...j.data, loaded: true }; setC(cache); }
    }).catch(() => {});
  }, []);
  return c;
}
// Display only. The server recalculates the real delivery charge.
export const deliveryFor = (cfg, subtotal) =>
  cfg.freeDeliveryAbove > 0 && subtotal >= cfg.freeDeliveryAbove ? 0 : cfg.deliveryCharge;

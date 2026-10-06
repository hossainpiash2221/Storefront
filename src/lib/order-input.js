export function cleanItems(items) {
  if (!Array.isArray(items) || !items.length || items.length > 30) return null;
  const out = [];
  for (const it of items) {
    const quantity = Number(it?.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) return null;
    out.push({
      productId: String(it.productId || '').slice(0, 40),
      quantity,
      color: String(it.color || '').slice(0, 40),
      size: String(it.size || '').slice(0, 40),
    }); // price is deliberately never accepted or forwarded
  }
  return out;
}

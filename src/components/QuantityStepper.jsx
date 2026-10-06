'use client';
export default function QuantityStepper({ value, onChange, max = 99, label = 'Quantity' }) {
  const btn = 'h-10 w-10 text-lg font-medium disabled:opacity-30 hover:bg-mist';
  return (
    <div className="inline-flex items-center rounded border border-ink/25 bg-white" role="group" aria-label={label}>
      <button type="button" className={btn} aria-label="Decrease quantity" disabled={value <= 1} onClick={() => onChange(value - 1)}>−</button>
      <span className="w-10 text-center tabular-nums" aria-live="polite">{value}</span>
      <button type="button" className={btn} aria-label="Increase quantity" disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

'use client';
import { useState } from 'react';
import Img from './Img';

export default function Gallery({ images, alt }) {
  const [i, setI] = useState(0);
  return (
    <div>
      <div className="aspect-[4/5] overflow-hidden rounded bg-mist"><Img src={images[i]} alt={alt} priority className="h-full w-full object-cover" /></div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2">
          {images.map((src, n) => (
            <button key={src} onClick={() => setI(n)} aria-label={`Show image ${n + 1}`} aria-pressed={n === i}
              className={`h-20 w-16 overflow-hidden rounded border-2 ${n === i ? 'border-peacock' : 'border-transparent'}`}>
              <Img src={src} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

/** Put your clip at public/hero.mp4 (short, muted, under ~3 MB). Without it the woven-stripe background shows. */
export default function Hero() {
  const ref = useRef(null);
  const [video, setVideo] = useState(true);
  useEffect(() => { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) ref.current?.pause(); }, []);
  return (
    <section className="relative isolate overflow-hidden bg-peacock-dark text-white">
      {video && (
        <video ref={ref} className="absolute inset-0 -z-20 h-full w-full object-cover opacity-70" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
          <source src="/hero.mp4" type="video/mp4" onError={() => setVideo(false)} />
        </video>
      )}
      <div className="hero-weave absolute inset-0 -z-10" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-peacock-dark/90 via-peacock-dark/55 to-transparent" aria-hidden="true" />
      <div className="mx-auto flex min-h-[78svh] max-w-6xl flex-col justify-center px-4 py-20">
        <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
          <span className="rise block">Ready-made</span>
          <span className="rise block" style={{ animationDelay: '.12s' }}>three-piece,</span>
          <span className="rise block" style={{ animationDelay: '.24s' }}>at your door.</span>
        </h1>
        <p className="rise mt-6 max-w-md text-lg text-white/85" style={{ animationDelay: '.4s' }}>
          Choose your colour, order in a minute, and pay in cash when it arrives.
        </p>
        <div className="rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: '.52s' }}>
          <Link href="/products" className="rounded bg-white px-6 py-3 font-semibold text-peacock-dark hover:bg-sand">Shop now</Link>
          <a href="#new" className="rounded border border-white/60 px-6 py-3 font-semibold hover:bg-white/10">See what’s new</a>
        </div>
      </div>
    </section>
  );
}

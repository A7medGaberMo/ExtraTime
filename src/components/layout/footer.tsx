'use client';

import Image from 'next/image';

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-slate-950/40 backdrop-blur-md py-4 pb-20 md:pb-6">
      <div className="container mx-auto px-4 flex items-center justify-center gap-2.5">
        <div className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-lg bg-slate-950 ring-1 ring-lime/30 shadow-sm">
          <Image
            src="/ETIcon.png"
            alt="ExtraTime Logo"
            fill
            className="object-contain p-0.5"
            sizes="24px"
          />
        </div>
        <span
          className="text-sm font-extrabold tracking-wider text-steel/90"
          style={{ fontFamily: 'var(--font-rajdhani), sans-serif' }}
        >
          Extra<span className="text-lime/90">Time</span>
        </span>
      </div>
    </footer>
  );
}

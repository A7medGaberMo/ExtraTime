'use client';

import Image from 'next/image';

export function Footer() {
  return (
    <footer className="w-full border-t border-border/80 bg-slate-950/60 backdrop-blur-md py-4 pb-20 md:pb-6">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-lg shadow-sm">
            <Image
              src="/ExtraTimeLogo.png"
              alt="ExtraTime Logo"
              fill
              className="object-cover"
              sizes="24px"
            />
          </div>
          <span
            className="text-base font-black tracking-tight text-white uppercase"
            style={{ fontFamily: 'var(--font-anton), var(--font-bebas), sans-serif' }}
          >
            Extra<span className="text-lime">Time</span>
          </span>
        </div>

        {/* Default Copyright */}
        <p className="text-xs text-steel/80 font-medium">
          &copy; {new Date().getFullYear()} ExtraTime. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

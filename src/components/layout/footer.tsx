'use client';

import Image from 'next/image';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Users } from 'lucide-react';

export function Footer() {
  const dbStats = useQuery(api.players.queries.getStats);

  return (
    <footer className="w-full border-t border-border/40 bg-slate-950/40 backdrop-blur-md py-4 pb-20 md:pb-6">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-6 text-center">
        <div className="flex items-center gap-2.5">
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

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-white/10 text-xs text-steel font-medium shadow-inner">
          <Users className="w-3.5 h-3.5 text-lime" />
          <span>Database:</span>
          <span className="text-white font-black font-stats">
            {dbStats?.totalPlayers ? dbStats.totalPlayers.toLocaleString() : '3,126'} Players
          </span>
        </div>
      </div>
    </footer>
  );
}

'use client';

import Image from 'next/image';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Users } from 'lucide-react';

export function Footer() {
  const dbStats = useQuery(api.players.queries.getStats);
  const playerCount = dbStats === undefined ? '...' : dbStats.totalPlayers.toLocaleString();

  return (
    <footer className="border-border/40 w-full border-t bg-slate-950/40 py-4 pb-20 backdrop-blur-md md:pb-6">
      <div className="container mx-auto flex flex-col items-center justify-center gap-3 px-4 text-center sm:flex-row md:gap-6">
        <div className="flex items-center gap-2.5">
          <div className="ring-lime/30 relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-lg bg-slate-950 shadow-sm ring-1">
            <Image
              src="/ETIcon.png"
              alt="ExtraTime Logo"
              fill
              className="object-contain p-0.5"
              sizes="24px"
            />
          </div>
          <span
            className="text-steel/90 text-sm font-extrabold tracking-wider"
            style={{ fontFamily: 'var(--font-rajdhani), sans-serif' }}
          >
            Extra<span className="text-lime/90">Time</span>
          </span>
        </div>

        <div className="text-steel inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1 text-xs font-medium shadow-inner">
          <Users className="text-lime h-3.5 w-3.5" />
          <span>Database:</span>
          <span className="font-stats font-black text-white">{playerCount} Players</span>
        </div>
      </div>
    </footer>
  );
}

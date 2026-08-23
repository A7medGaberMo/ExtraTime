'use client';

import React from 'react';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Database } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { useIsGameplay } from '@/hooks/use-is-gameplay';
import { useI18n } from '@/lib/i18n';

export function Footer() {
  const isGameplay = useIsGameplay();
  const { t } = useI18n();
  const dbStats = useQuery(api.players.queries.getStats);
  const playerCount = dbStats === undefined ? '...' : dbStats.totalPlayers.toLocaleString();

  // Hide footer during active gameplay to maximize vertical real estate
  if (isGameplay) {
    return null;
  }

  return (
    <footer className="border-border/40 w-full border-t bg-slate-950/40 py-4 pb-24 backdrop-blur-md lg:pb-6">
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
          <span className="text-steel text-sm font-semibold tracking-wider font-stats">
            Extra<span className="text-lime font-bold">Time</span>
          </span>
        </div>

        <div className="text-steel inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3.5 py-1 text-xs font-medium shadow-inner">
          <AppIcon icon={Database} size={14} weight="bold" className="text-lime" />
          <span>{t('home.databaseStat.title')}:</span>
          <span className="font-stats font-bold text-white">{playerCount}</span>
        </div>
      </div>
    </footer>
  );
}


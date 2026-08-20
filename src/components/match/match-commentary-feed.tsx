'use client';

import type { MatchSimulationResult } from '@/core/simulation/simulation.interface';
import {
  Flag,
  CircleDot,
  Shield,
  Target,
  AlertTriangle,
  Octagon,
  Pause,
  Crosshair,
  CheckCircle2,
} from 'lucide-react';

export interface MatchCommentaryFeedProps {
  simulation: Pick<MatchSimulationResult, 'timeline'>;
  hostName: string;
  guestName: string;
  /** Index up to which the feed is revealed (else full feed). */
  revealedCount?: number;
}

const EVENT_META: Record<string, { icon: typeof CircleDot; className: string }> = {
  KICKOFF: { icon: Flag, className: 'text-lime' },
  GOAL: { icon: CircleDot, className: 'text-lime' },
  SAVE: { icon: Shield, className: 'text-sky-400' },
  CROSSBAR: { icon: Target, className: 'text-amber-300' },
  YELLOW_CARD: { icon: AlertTriangle, className: 'text-amber-400' },
  RED_CARD: { icon: Octagon, className: 'text-rose-500' },
  HALF_TIME: { icon: Pause, className: 'text-steel' },
  FULL_TIME: { icon: CheckCircle2, className: 'text-steel' },
  PENALTY_SHOOTOUT: { icon: Crosshair, className: 'text-amber-300' },
};

export function MatchCommentaryFeed({
  simulation,
  hostName,
  guestName,
  revealedCount = Infinity,
}: MatchCommentaryFeedProps) {
  const events = simulation.timeline.slice(0, revealedCount);
  const teamLabel = (team: 'host' | 'guest') => (team === 'host' ? hostName : guestName);

  return (
    <div className="bg-card/95 rounded-2xl border border-white/10 p-4 shadow-xl backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-steel text-[10px] font-black tracking-widest uppercase">
          Commentary Ticker
        </span>
        <span className="text-steel/50 text-[9px] font-bold tracking-widest uppercase">
          {simulation.timeline.length} events
        </span>
      </div>

      <div className="relative max-h-[340px] space-y-1 overflow-y-auto pr-1">
        {events.map((event) => {
          const meta = EVENT_META[event.type] ?? { icon: CircleDot, className: 'text-steel' };
          const Icon = meta.icon;
          const isGoal = event.type === 'GOAL';
          return (
            <div
              key={event.id}
              className={`flex items-start gap-2.5 rounded-xl px-2.5 py-1.5 text-xs transition-all duration-500 ${
                isGoal
                  ? event.team === 'host'
                    ? 'bg-lime/5'
                    : 'bg-rose-500/5'
                  : 'hover:bg-white/[0.03]'
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                  isGoal
                    ? event.team === 'host'
                      ? 'border-lime/30 bg-lime/10'
                      : 'border-rose-500/30 bg-rose-500/10'
                    : 'border-white/10 bg-slate-950'
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${isGoal ? (event.team === 'host' ? 'text-lime' : 'text-rose-400') : meta.className}`}
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-stats text-steel shrink-0 text-[11px]">
                    {event.minute}&apos;
                  </span>
                  <span
                    className={`shrink-0 text-[9px] font-black tracking-wider uppercase ${isGoal ? (event.team === 'host' ? 'text-lime' : 'text-rose-400') : 'text-steel/60'}`}
                  >
                    {isGoal ? `⚽ ${teamLabel(event.team)}` : event.type.replace('_', ' ')}
                  </span>
                  <span className="font-stats text-steel/70 ml-auto shrink-0 text-[10px]">
                    {event.scoreSnapshot.host}-{event.scoreSnapshot.guest}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] leading-snug font-medium text-white/85">
                  {event.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

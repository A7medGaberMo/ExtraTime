'use client';

import type { MatchSimulationResult } from '@/core/simulation/simulation.interface';
import {
  Flag,
  SoccerBall,
  Shield,
  Crosshair,
  Warning,
  Octagon,
  Pause,
  CheckCircle,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';

export interface MatchCommentaryFeedProps {
  simulation: Pick<MatchSimulationResult, 'timeline'>;
  hostName: string;
  guestName: string;
  revealedCount?: number;
}

const EVENT_META: Record<string, { icon: typeof Flag; className: string }> = {
  KICKOFF: { icon: Flag, className: 'text-lime' },
  GOAL: { icon: SoccerBall, className: 'text-lime' },
  SAVE: { icon: Shield, className: 'text-sky-400' },
  CROSSBAR: { icon: Crosshair, className: 'text-amber-300' },
  YELLOW_CARD: { icon: Warning, className: 'text-amber-400' },
  RED_CARD: { icon: Octagon, className: 'text-rose-500' },
  HALF_TIME: { icon: Pause, className: 'text-steel' },
  FULL_TIME: { icon: CheckCircle, className: 'text-steel' },
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
    <div className="bg-slate-950/85 rounded-2xl border border-white/10 p-4 shadow-xl backdrop-blur-xl select-none">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-steel text-[10px] font-black tracking-widest uppercase">
          Commentary Ticker
        </span>
        <span className="text-steel/50 text-[9px] font-bold tracking-widest uppercase font-stats">
          {simulation.timeline.length} events
        </span>
      </div>

      <div className="relative max-h-[340px] space-y-1 overflow-y-auto pe-1">
        {events.map((event) => {
          const meta = EVENT_META[event.type] ?? { icon: SoccerBall, className: 'text-steel' };
          const IconComp = meta.icon;
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
                    : 'border-white/10 bg-slate-900'
                }`}
              >
                <AppIcon
                  icon={IconComp}
                  size={14}
                  weight="duotone"
                  className={isGoal ? (event.team === 'host' ? 'text-lime' : 'text-rose-400') : meta.className}
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-stats text-steel shrink-0 text-[11px] font-black">
                    {event.minute}&apos;
                  </span>
                  <span
                    className={`shrink-0 text-[9px] font-black tracking-wider uppercase ${isGoal ? (event.team === 'host' ? 'text-lime' : 'text-rose-400') : 'text-steel/60'}`}
                  >
                    {isGoal ? `⚽ ${teamLabel(event.team)}` : event.type.replace('_', ' ')}
                  </span>
                  <span className="font-stats text-steel/70 ms-auto shrink-0 text-[10px] font-black">
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

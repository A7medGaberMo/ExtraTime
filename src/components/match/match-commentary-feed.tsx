'use client';

import type { MatchSimulationResult } from '@/core/simulation/simulation.interface';
import { SoccerBall, ShieldCheck } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';

export interface MatchCommentaryFeedProps {
  simulation: Pick<MatchSimulationResult, 'timeline' | 'score' | 'isShootout' | 'shootoutScore'>;
  hostName: string;
  guestName: string;
  revealedCount?: number;
}

export function MatchCommentaryFeed({
  simulation,
  hostName,
  guestName,
  revealedCount = Infinity,
}: MatchCommentaryFeedProps) {
  // Filter timeline strictly to goals and decisive penalties only
  const allGoalEvents = simulation.timeline.filter(
    (e) => e.type === 'GOAL' || e.type === 'PENALTY_SHOOTOUT',
  );
  const events = allGoalEvents.slice(0, revealedCount);
  const teamLabel = (team: 'host' | 'guest') => (team === 'host' ? hostName : guestName);

  return (
    <div className="bg-slate-950/85 rounded-2xl border border-white/10 p-3.5 sm:p-4 shadow-xl backdrop-blur-xl select-none">
      <div className="mb-2.5 flex items-center justify-between border-b border-white/[0.08] pb-2">
        <div className="flex items-center gap-1.5">
          <AppIcon icon={SoccerBall} size={15} weight="duotone" className="text-lime" />
          <span className="text-white text-[11px] font-black tracking-widest uppercase font-display">
            Match Goals Timeline
          </span>
        </div>
        <span className="text-steel/60 text-[9px] font-bold tracking-widest uppercase font-stats">
          {events.length} {events.length === 1 ? 'Goal' : 'Goals'}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="py-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs text-steel">
            <AppIcon icon={ShieldCheck} size={16} weight="duotone" className="text-lime" />
            <span className="font-stats text-[10px] font-bold uppercase tracking-wider">
              Defensive Masterclass · Clean Sheet Duel
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-2 py-1">
          {events.map((event) => {
            const isHost = event.team === 'host';
            const scorerName = event.player?.name || 'Scorer';
            const assistName = event.assistPlayer?.name;

            return (
              <div
                key={event.id}
                className={`flex items-center gap-2 rounded-xl p-2 transition-all ${
                  isHost
                    ? 'border border-lime/30 bg-lime/[0.06] justify-start'
                    : 'border border-rose-500/30 bg-rose-500/[0.06] justify-end flex-row-reverse'
                }`}
              >
                {/* Minute Badge */}
                <span
                  className={`flex h-6 min-w-[28px] items-center justify-center rounded-lg px-1.5 text-[10px] font-black font-stats ${
                    isHost ? 'bg-lime text-slate-950 shadow-sm' : 'bg-rose-500 text-white shadow-sm'
                  }`}
                >
                  {event.minute}&apos;
                </span>

                {/* Scorer & Team Info */}
                <div className={`flex flex-col min-w-0 ${isHost ? 'text-start' : 'text-end'}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white truncate max-w-[140px] sm:max-w-[180px]">
                      ⚽ {scorerName}
                    </span>
                    <span
                      className={`text-[8.5px] font-black tracking-wider uppercase font-stats ${
                        isHost ? 'text-lime' : 'text-rose-300'
                      }`}
                    >
                      ({teamLabel(event.team)})
                    </span>
                  </div>
                  {assistName && (
                    <span className="text-[9.5px] text-steel font-medium truncate">
                      Assist: {assistName}
                    </span>
                  )}
                </div>

                {/* Score Snapshot Pill */}
                <div
                  className={`ms-auto shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-black font-stats ${
                    isHost
                      ? 'border-lime/30 bg-slate-950 text-lime'
                      : 'border-rose-500/30 bg-slate-950 text-rose-400'
                  }`}
                >
                  {event.scoreSnapshot.host} - {event.scoreSnapshot.guest}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

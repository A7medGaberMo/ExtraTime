'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MatchSimulationResult } from '@/core/simulation/simulation.interface';
import { MatchScoreboard } from '@/components/match/match-scoreboard';
import { MatchCommentaryFeed } from '@/components/match/match-commentary-feed';
import { TacticalPitchView, type PitchSquadPlayer } from '@/components/match/tactical-pitch-view';
import { sfx } from '@/lib/sfx';
import { Trophy, Sword, CircleNotch, Lightning } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';

export interface ScoreHubProps {
  simulation: MatchSimulationResult;
  hostName: string;
  guestName: string;
  viewerWon: boolean | null;
  viewerIsHost: boolean;
  hostSquad: PitchSquadPlayer[];
  guestSquad: PitchSquadPlayer[];
  formation: string;
  matchSize: 5 | 11;
}

/** Kill/revive-friendly event scheduler window (min 5s, max 8s). */
function replayWindow(eventCount: number): number {
  return Math.min(8000, Math.max(5000, eventCount * 320 + 1200));
}

/**
 * Resolve host/guest winner side from regulation score OR shootout.
 * Shootout winners leave regulation score tied — never infer from score alone.
 */
function resolveWinnerSide(simulation: MatchSimulationResult): 'host' | 'guest' | null {
  if (simulation.winnerId == null) return null;

  if (simulation.isShootout && simulation.shootoutScore) {
    if (simulation.shootoutScore.host > simulation.shootoutScore.guest) return 'host';
    if (simulation.shootoutScore.guest > simulation.shootoutScore.host) return 'guest';
  }

  if (simulation.score.host > simulation.score.guest) return 'host';
  if (simulation.score.guest > simulation.score.host) return 'guest';
  return null;
}

export function ScoreHub({
  simulation,
  hostName,
  guestName,
  viewerWon,
  viewerIsHost = true,
  hostSquad,
  guestSquad,
  formation,
  matchSize,
}: ScoreHubProps) {
  const [phase, setPhase] = useState<'simulating' | 'final'>('simulating');
  const [revealedCount, setRevealedCount] = useState(0);
  const [liveScore, setLiveScore] = useState({ host: 0, guest: 0 });
  const [liveMinute, setLiveMinute] = useState<number | null>(0);
  const [liveShootout, setLiveShootout] = useState<{ host: number; guest: number } | null>(null);

  const events = useMemo(() => simulation.timeline, [simulation]);

  useEffect(() => {
    if (phase !== 'simulating' || events.length === 0) {
      return;
    }
    const total = replayWindow(events.length);
    if (events[0]?.type === 'KICKOFF') sfx.kickoff();

    const timers: Array<ReturnType<typeof setTimeout>> = [];
    events.forEach((event, idx) => {
      const delay = 250 + idx * ((total - 250) / events.length);
      const prevSnapshot = idx > 0 ? events[idx - 1].scoreSnapshot : { host: 0, guest: 0 };
      timers.push(
        setTimeout(() => {
          setRevealedCount(idx + 1);
          setLiveMinute(event.minute);
          if (event.type === 'PENALTY_SHOOTOUT') {
            setLiveShootout(event.scoreSnapshot);
          } else {
            setLiveScore(event.scoreSnapshot);
          }
          if (event.type === 'GOAL') {
            const scored =
              event.scoreSnapshot.host + event.scoreSnapshot.guest >
              prevSnapshot.host + prevSnapshot.guest;
            if (scored) sfx.goal();
          } else if (event.type === 'SAVE') {
            sfx.save();
          } else if (event.type === 'CROSSBAR') {
            sfx.crossbar();
          }
        }, delay - 80),
      );
    });

    const finish = setTimeout(() => {
      setLiveMinute(events[events.length - 1]?.minute ?? 90);
      setRevealedCount(events.length);
      setPhase('final');
      if (viewerWon === true) sfx.victory();
      else if (viewerWon === false) sfx.runnerUp();
    }, total + 150);

    return () => {
      timers.forEach((t) => clearTimeout(t));
      clearTimeout(finish);
    };
  }, [events, phase, viewerWon]);

  const isSimulating = phase === 'simulating';

  return (
    <div className="space-y-3 select-none">
      <MatchScoreboard
        hostName={hostName}
        guestName={guestName}
        score={isSimulating ? liveScore : simulation.score}
        minute={isSimulating ? liveMinute : 90}
        isSimulating={isSimulating}
        shootoutScore={isSimulating ? liveShootout : (simulation.shootoutScore ?? null)}
      />

      {isSimulating ? (
        <div className="animate-fade-in flex items-center justify-center gap-2 py-1">
          <AppIcon icon={CircleNotch} size={16} weight="bold" className="text-lime animate-spin" />
          <p className="text-steel text-[10px] font-black tracking-[0.25em] uppercase font-stats">
            Simulating Matchday...
          </p>
        </div>
      ) : (
        <WinnerBanner
          hostName={hostName}
          guestName={guestName}
          simulation={simulation}
          viewerWon={viewerWon ?? null}
        />
      )}

      <MatchCommentaryFeed
        simulation={simulation}
        hostName={hostName}
        guestName={guestName}
        revealedCount={revealedCount}
      />

      {!isSimulating && (
        <div className="animate-fade-in space-y-3">
          <MatchupMeters simulation={simulation} hostName={hostName} guestName={guestName} />

          <TacticalPitchView
            formation={formation}
            matchSize={matchSize}
            hostSquad={hostSquad}
            guestSquad={guestSquad}
            hostName={hostName}
            guestName={guestName}
            viewerIsHost={viewerIsHost}
          />
        </div>
      )}
    </div>
  );
}

function WinnerBanner({
  hostName,
  guestName,
  simulation,
  viewerWon,
}: {
  hostName: string;
  guestName: string;
  simulation: MatchSimulationResult;
  viewerWon: boolean | null;
}) {
  const draw = simulation.winnerId == null;
  const winnerSide = resolveWinnerSide(simulation);
  const winnerLabel = winnerSide === 'host' ? hostName : winnerSide === 'guest' ? guestName : null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 text-center shadow-2xl backdrop-blur-xl ${
        viewerWon
          ? 'border-lime/40 from-lime/10 via-slate-950 to-slate-950 bg-gradient-to-b shadow-[0_0_50px_rgba(149,232,16,0.15)]'
          : draw
            ? 'via-slate-950 to-slate-950 border-amber-400/30 bg-gradient-to-b from-amber-400/10'
            : 'via-slate-950 to-slate-950 border-rose-400/30 bg-gradient-to-b from-rose-500/10 shadow-[0_0_50px_rgba(244,63,94,0.12)]'
      }`}
    >
      <div className="pointer-events-none absolute inset-x-10 top-0 h-28 rounded-full bg-white/5 blur-3xl" />
      <div className="relative space-y-1.5">
        <div
          className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl border shadow-xl ${
            viewerWon
              ? 'border-lime/50 shadow-lime/15 bg-slate-950'
              : 'border-white/10 bg-slate-950'
          }`}
        >
          {viewerWon ? (
            <AppIcon icon={Trophy} size={20} weight="duotone" className="text-lime animate-bounce" />
          ) : (
            <AppIcon icon={Sword} size={20} weight="duotone" className="text-steel" />
          )}
        </div>
        <span
          className={`inline-flex rounded-full border px-3 py-0.5 text-[9px] font-black tracking-widest uppercase font-stats ${
            viewerWon
              ? 'border-lime/30 bg-lime/10 text-lime'
              : draw
                ? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}
        >
          {draw ? 'Deadlock' : viewerWon ? 'Victorious Manager' : 'Runner-Up'}
        </span>
        <h2 className="text-lg font-black tracking-tight text-white uppercase font-display sm:text-xl">
          {viewerWon ? 'You Win The Battle!' : draw ? 'A Stalemate Duel!' : `${winnerLabel} Won`}
        </h2>
        <p className="text-steel mx-auto max-w-sm text-[11px] leading-relaxed font-medium">
          {draw
            ? `Deadlock — ${simulation.shootoutScore ? `penalties split ${simulation.shootoutScore.host}-${simulation.shootoutScore.guest}.` : 'no goals separated them.'}`
            : simulation.isShootout && simulation.shootoutScore
              ? `${winnerLabel} won on penalties (${simulation.shootoutScore.host}-${simulation.shootoutScore.guest}).`
              : `Match simulator rated ${winnerLabel} higher.`}
        </p>
      </div>
    </div>
  );
}

/** 3 Core Pillars: Overall Rating, Chemistry Synergy, and Budget Discipline */
function MatchupMeters({
  simulation,
  hostName,
  guestName,
}: {
  simulation: MatchSimulationResult;
  hostName: string;
  guestName: string;
}) {
  const metrics = [
    {
      key: 'overall',
      label: 'OVERALL',
      hostVal: simulation.sectors.host.totalRating,
      guestVal: simulation.sectors.guest.totalRating,
      format: (v: number) => v.toFixed(1),
    },
    {
      key: 'chemistry',
      label: 'CHEMISTRY',
      hostVal: simulation.synergy.host.totalSynergyPoints,
      guestVal: simulation.synergy.guest.totalSynergyPoints,
      format: (v: number) => `+${v.toFixed(1)}`,
    },
    {
      key: 'budget',
      label: 'BUDGET',
      hostVal: simulation.synergy.host.budgetBonusPoints,
      guestVal: simulation.synergy.guest.budgetBonusPoints,
      format: (v: number) => `+${v.toFixed(1)}`,
    },
  ];

  return (
    <div className="bg-slate-950/85 rounded-2xl border border-white/10 p-3.5 sm:p-4 shadow-xl backdrop-blur-xl select-none">
      <div className="mb-3 flex items-center justify-between border-b border-white/[0.08] pb-2">
        <span className="flex items-center gap-1.5 text-[11px] font-black tracking-widest text-white uppercase font-display">
          <AppIcon icon={Lightning} size={15} weight="fill" className="text-lime" />
          Tactical Deciding Factors
        </span>
        <span className="text-steel/60 text-[9px] font-bold tracking-widest uppercase font-stats">
          {hostName} vs {guestName}
        </span>
      </div>

      {/* 3 Metric Rows */}
      <div className="space-y-3 py-1">
        {metrics.map((row) => {
          const maxVal = Math.max(1, row.hostVal, row.guestVal);
          return (
            <div key={row.key} className="space-y-1">
              <div className="flex items-center justify-between px-0.5 text-[10px] font-black font-stats">
                <span className="text-lime">{row.format(row.hostVal)}</span>
                <span className="text-steel tracking-wider uppercase text-[9px]">
                  {row.label}
                </span>
                <span className="text-rose-400">{row.format(row.guestVal)}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Host Bar (fills from right to left) */}
                <div className="flex h-2.5 flex-1 overflow-hidden rounded-full border border-white/5 bg-slate-950">
                  <div className="flex-1" />
                  <div
                    className="from-lime/50 to-lime h-full bg-gradient-to-r transition-all duration-700 rounded-full"
                    style={{ width: `${(row.hostVal / maxVal) * 100}%` }}
                  />
                </div>
                {/* Guest Bar (fills from left to right) */}
                <div className="flex h-2.5 flex-1 overflow-hidden rounded-full border border-white/5 bg-slate-950">
                  <div
                    className="from-rose-500 to-rose-400 h-full bg-gradient-to-r transition-all duration-700 rounded-full"
                    style={{ width: `${(row.guestVal / maxVal) * 100}%` }}
                  />
                  <div className="flex-1" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Breakdown Summary Cards */}
      <div className="mt-3.5 grid grid-cols-2 gap-2">
        <div className="border-lime/20 bg-lime/[0.06] rounded-xl border p-2 sm:p-2.5">
          <p className="text-steel truncate text-[8px] font-black tracking-widest uppercase font-stats">
            {hostName} Synergy
          </p>
          <div className="mt-0.5 flex flex-col">
            <span className="font-stats text-lime text-xs sm:text-sm font-black">
              +{simulation.synergy.host.totalSynergyPoints.toFixed(1)} Chem · +{simulation.synergy.host.budgetBonusPoints.toFixed(1)} Budget
            </span>
            <span className="text-steel text-[8px] font-bold font-stats pt-0.5">
              {simulation.synergy.host.clubChemLinks} Club · {simulation.synergy.host.nationChemLinks} Nation
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-2 sm:p-2.5 text-end">
          <p className="text-steel truncate text-[8px] font-black tracking-widest uppercase font-stats">
            {guestName} Synergy
          </p>
          <div className="mt-0.5 flex flex-col items-end">
            <span className="font-stats text-xs sm:text-sm text-rose-400 font-black">
              +{simulation.synergy.guest.totalSynergyPoints.toFixed(1)} Chem · +{simulation.synergy.guest.budgetBonusPoints.toFixed(1)} Budget
            </span>
            <span className="text-steel text-[8px] font-bold font-stats pt-0.5">
              {simulation.synergy.guest.clubChemLinks} Club · {simulation.synergy.guest.nationChemLinks} Nation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

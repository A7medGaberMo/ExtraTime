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

/** Sectors vs sectors matchup meters + synergy chips (FUT-style). */
function MatchupMeters({
  simulation,
  hostName,
  guestName,
}: {
  simulation: MatchSimulationResult;
  hostName: string;
  guestName: string;
}) {
  const rows = [
    { key: 'attack', label: 'ATK' },
    { key: 'midfield', label: 'MID' },
    { key: 'defense', label: 'DEF' },
  ] as const;

  const maxVal = Math.max(
    1,
    ...rows.map((r) => Math.max(simulation.sectors.host[r.key], simulation.sectors.guest[r.key])),
  );

  return (
    <div className="bg-slate-950/85 rounded-2xl border border-white/10 p-4 shadow-xl backdrop-blur-xl select-none">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-white uppercase">
          <AppIcon icon={Lightning} size={14} weight="fill" className="text-lime" /> Sector Matchup
        </span>
        <span className="text-steel/50 text-[9px] font-bold tracking-widest uppercase">
          {hostName} vs {guestName}
        </span>
      </div>

      <div className="space-y-2.5">
        {rows.map((row) => {
          const hostVal = simulation.sectors.host[row.key];
          const guestVal = simulation.sectors.guest[row.key];
          return (
            <div key={row.key} className="flex items-center gap-2">
              <span className="text-steel w-8 shrink-0 text-[9px] font-black tracking-wider uppercase font-stats">
                {row.label}
              </span>
              <div className="flex h-3 flex-1 overflow-hidden rounded-full border border-white/5 bg-slate-950">
                <div
                  className="from-lime/60 to-lime h-full bg-gradient-to-r transition-all duration-700"
                  style={{ width: `${(hostVal / maxVal) * 50}%` }}
                />
                <div className="h-full flex-1" />
              </div>
              <div className="flex h-3 flex-1 overflow-hidden rounded-full border border-white/5 bg-slate-950">
                <div className="flex-1" />
                <div
                  className="h-full bg-gradient-to-l from-rose-500/70 to-rose-500 transition-all duration-700"
                  style={{ width: `${(guestVal / maxVal) * 50}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="border-lime/15 bg-lime/5 rounded-xl border p-2 sm:p-2.5">
          <p className="text-steel truncate text-[8px] font-black tracking-widest uppercase font-stats">
            {hostName} Chem
          </p>
          <div className="mt-0.5 flex items-baseline justify-between gap-1">
            <span className="font-stats text-lime text-sm font-black">
              +{simulation.synergy.host.totalSynergyPoints.toFixed(1)}
            </span>
            <span className="text-steel text-[8px] font-bold font-stats">
              {simulation.synergy.host.clubChemLinks} club ·{' '}
              {simulation.synergy.host.nationChemLinks} nation
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-rose-500/15 bg-rose-500/5 p-2 sm:p-2.5">
          <p className="text-steel truncate text-[8px] font-black tracking-widest uppercase font-stats">
            {guestName} Chem
          </p>
          <div className="mt-0.5 flex items-baseline justify-between gap-1">
            <span className="font-stats text-sm text-rose-400 font-black">
              +{simulation.synergy.guest.totalSynergyPoints.toFixed(1)}
            </span>
            <span className="text-steel text-[8px] font-bold font-stats">
              {simulation.synergy.guest.clubChemLinks} club ·{' '}
              {simulation.synergy.guest.nationChemLinks} nation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

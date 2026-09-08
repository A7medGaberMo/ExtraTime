'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sword,
  Lightning,
  ArrowsClockwise,
  Trophy,
  Crown,
  ShieldCheck,
  ArrowLeft,
  House,
  X,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Confetti } from '@/components/shared/confetti';
import { sfx } from '@/lib/sfx';
import type {
  DraftShowdownResult,
  EnrichedDraftParticipant,
  DraftSoloChallengeType,
} from '../types/draft';

interface DraftShowdownModalProps {
  showdownResult: DraftShowdownResult;
  hostParticipant: EnrichedDraftParticipant;
  guestParticipant?: EnrichedDraftParticipant;
  currentUserId: string;
  isSolo: boolean;
  challengeType?: DraftSoloChallengeType;
  onPlayBossMatch?: () => void;
  onPlayAgain?: () => void;
  onClose?: () => void;
  bossLoading?: boolean;
}

export function DraftShowdownModal({
  showdownResult,
  hostParticipant,
  guestParticipant,
  currentUserId,
  isSolo,
  onPlayBossMatch,
  onPlayAgain,
  onClose,
  bossLoading = false,
}: DraftShowdownModalProps) {
  const [currentMinute, setCurrentMinute] = useState(0);
  const [isSimComplete, setIsSimComplete] = useState(false);

  const isWinner = showdownResult.winnerId === currentUserId;

  // 18-second animated match simulation
  useEffect(() => {
    sfx.kickoff();
    const durationMs = 18000;
    const intervalMs = 200;
    const steps = durationMs / intervalMs;
    const minuteStep = 90 / steps;

    let minute = 0;
    const timer = setInterval(() => {
      minute += minuteStep;
      if (minute >= 90) {
        setCurrentMinute(90);
        setIsSimComplete(true);
        clearInterval(timer);
        if (isWinner) sfx.victory();
        else sfx.runnerUp();
      } else {
        setCurrentMinute(Math.floor(minute));
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isWinner]);

  // Filter events up to current minute, but show all when complete
  const visibleEvents = isSimComplete
    ? showdownResult.timeline
    : showdownResult.timeline.filter((e) => e.minute <= currentMinute);

  // Compute live animated score up to current minute
  const liveScore = visibleEvents.reduce(
    (acc, ev) => {
      if (ev.type === 'GOAL') {
        if (ev.team === 'host') acc.host++;
        else acc.guest++;
      }
      return acc;
    },
    { host: 0, guest: 0 },
  );

  // Sound effects on new events
  const latestEvent = visibleEvents[visibleEvents.length - 1];
  useEffect(() => {
    if (!latestEvent) return;
    if (latestEvent.type === 'GOAL') sfx.goal();
    else if (latestEvent.type === 'SAVE') sfx.save();
    else if (latestEvent.type === 'CROSSBAR') sfx.crossbar();
  }, [latestEvent?.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/65 backdrop-blur-3xl overflow-y-auto">
      {isSimComplete && isWinner && <Confetti active={true} duration={4000} />}

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
        className="apple-glass-elevated relative w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-3xl p-4 sm:p-6 shadow-[0_30px_70px_rgba(0,0,0,0.85)] space-y-3.5 sm:space-y-4 border border-white/20"
      >
        {/* Top Bar Navigation (Pitch Review, Hub Link, Close) */}
        <div className="relative z-20 flex items-center justify-between pb-2 border-b border-white/10">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="btn-haptic inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer shadow-sm"
              title="Review Pitch"
              aria-label="Review Pitch"
            >
              <AppIcon icon={ArrowLeft} size={13} weight="bold" />
              <span>Pitch Review</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <Link
              href="/draft"
              className="btn-haptic inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-950/40 px-3 py-1 text-xs font-bold text-cyan-300 hover:text-white transition-colors shadow-sm"
              title="Draft Hub"
              aria-label="Draft Hub"
            >
              <AppIcon icon={House} size={13} weight="bold" />
              <span>Draft Hub</span>
            </Link>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="btn-haptic flex h-7 w-7 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Close Modal"
                aria-label="Close showdown modal"
              >
                <AppIcon icon={X} size={14} weight="bold" />
              </button>
            )}
          </div>
        </div>

        {/* Header — Apple Sports Presentation */}
        <div className="text-center space-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-0.5 text-[10px] sm:text-xs font-bold text-cyan-300 shadow-sm">
            <AppIcon icon={Lightning} size={12} weight="fill" />
            {isSolo ? 'BOSS SHOWDOWN' : '1v1 DRAFT SHOWDOWN'}
          </span>
          <div className="flex items-center justify-center gap-2">
            {isSimComplete && isWinner && (
              <AppIcon icon={Trophy} size={24} weight="fill" className="text-amber-400 shrink-0" />
            )}
            <h2 className="font-display text-xl sm:text-2xl font-black text-white tracking-tight">
              {isSimComplete
                ? isWinner
                  ? 'VICTORY!'
                  : 'MATCH CONCLUDED'
                : 'LIVE MATCH SIMULATION'}
            </h2>
          </div>
        </div>

        {/* Live Apple Scoreboard Tile */}
        <div className="apple-segmented-bar relative overflow-hidden rounded-2xl p-3.5 sm:p-4 shadow-inner">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Host Side */}
            <div className="flex-1 text-center sm:text-left space-y-0.5 min-w-0">
              <span className="block truncate text-xs sm:text-sm font-extrabold text-white">
                {hostParticipant.name}
              </span>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[10px] text-slate-400">
                <span>OVR {hostParticipant.squadRating}</span>
                <span>•</span>
                <span className="text-cyan-400 font-bold">CHEM {hostParticipant.chemistryScore}</span>
              </div>
            </div>

            {/* Live Animated Score with Tabular Lining Figures */}
            <div className="flex flex-col items-center px-2 sm:px-4 shrink-0">
              <div className="flex items-center gap-2 font-display text-3xl sm:text-4xl font-black text-white font-stats">
                <span className="text-cyan-400">{isSimComplete ? showdownResult.score.host : liveScore.host}</span>
                <span className="text-white/30">:</span>
                <span className="text-purple-400">{isSimComplete ? showdownResult.score.guest : liveScore.guest}</span>
              </div>

              {/* Minute badge */}
              <span className="mt-1 rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-0.5 font-stats text-[10px] font-bold text-amber-300 shadow-sm">
                {isSimComplete
                  ? showdownResult.isShootout
                    ? `FT (${showdownResult.shootoutScore?.host}-${showdownResult.shootoutScore?.guest} PK)`
                    : 'FULL TIME'
                  : `${currentMinute}'`}
              </span>
            </div>

            {/* Guest / Boss Side */}
            <div className="flex-1 text-center sm:text-right space-y-0.5 min-w-0">
              <span className="block truncate text-xs sm:text-sm font-extrabold text-white">
                {guestParticipant?.name || 'Legendary Boss XI'}
              </span>
              <div className="flex items-center justify-center sm:justify-end gap-1.5 text-[10px] text-slate-400">
                <span>OVR {guestParticipant?.squadRating || 94}</span>
                <span>•</span>
                <span className="text-purple-400 font-bold">
                  CHEM {guestParticipant?.chemistryScore || 33}
                </span>
              </div>
            </div>
          </div>

          {/* Shootout indicator */}
          {showdownResult.isShootout && isSimComplete && (
            <div className="mt-2 border-t border-white/8 pt-1.5 text-center text-xs font-bold text-amber-400">
              Penalties: {showdownResult.shootoutScore?.host} - {showdownResult.shootoutScore?.guest}
            </div>
          )}
        </div>

        {/* Sector Balance Comparison — Apple Complications */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-2 shadow-sm">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">ATTACK</span>
            <div className="mt-0.5 flex items-center justify-between text-xs font-stats font-black px-1">
              <span className="text-cyan-400">{showdownResult.sectors.host.attack}</span>
              <span className="text-purple-400">{showdownResult.sectors.guest.attack}</span>
            </div>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-2 shadow-sm">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">MIDFIELD</span>
            <div className="mt-0.5 flex items-center justify-between text-xs font-stats font-black px-1">
              <span className="text-cyan-400">{showdownResult.sectors.host.midfield}</span>
              <span className="text-purple-400">{showdownResult.sectors.guest.midfield}</span>
            </div>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-2 shadow-sm">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">DEFENSE</span>
            <div className="mt-0.5 flex items-center justify-between text-xs font-stats font-black px-1">
              <span className="text-cyan-400">{showdownResult.sectors.host.defense}</span>
              <span className="text-purple-400">{showdownResult.sectors.guest.defense}</span>
            </div>
          </div>
        </div>

        {/* Live Match Timeline Ticker — Apple Live Activity Style */}
        <div className="max-h-28 sm:max-h-36 overflow-y-auto space-y-1.5 rounded-2xl border border-white/8 bg-black/25 p-3 shadow-inner">
          <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
            Match Highlights
          </span>
          {visibleEvents.length === 0 ? (
            <span className="block py-2 text-center text-xs text-slate-400">
              Kicking off match...
            </span>
          ) : (
            visibleEvents.map((ev, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 text-[11px] sm:text-xs text-slate-200 border-b border-white/5 pb-1 last:border-0"
              >
                <span className="shrink-0 font-stats font-extrabold text-cyan-400 w-7 text-left">
                  {ev.minute <= 90 ? `${ev.minute}'` : 'PK'}
                </span>
                <span className="flex-1 truncate">{ev.description}</span>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        {isSimComplete && (
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            {isSolo && onPlayBossMatch && (
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={onPlayBossMatch}
                disabled={bossLoading}
                leftIcon={<AppIcon icon={Sword} size={16} weight="bold" />}
                className="bg-gradient-to-b from-cyan-400 to-cyan-500 text-slate-950 font-bold hover:brightness-110 shadow-md shadow-cyan-400/25 rounded-xl py-2.5"
              >
                {bossLoading ? 'Summoning...' : 'Battle Boss Again'}
              </Button>
            )}

            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={onPlayAgain}
              leftIcon={<AppIcon icon={ArrowsClockwise} size={16} weight="bold" />}
              className="rounded-xl border-white/15 bg-white/[0.08] text-white hover:bg-white/[0.14] py-2.5"
            >
              Draft Again
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

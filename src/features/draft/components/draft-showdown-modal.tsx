'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sword,
  Lightning,
  ArrowsClockwise,
  Trophy,
  ArrowLeft,
  House,
  X,
  CircleNotch,
  UserPlus,
  CheckCircle,
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

export interface DraftRematchStateProps {
  status: 'none' | 'pending' | 'accepted' | 'declined';
  rematchGameId?: string;
  iAmInviter?: boolean;
  inviterName?: string;
}

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
  rematchState?: DraftRematchStateProps;
  onRequestRematch?: () => void;
  onAcceptRematch?: () => void;
  onDeclineRematch?: () => void;
  isRematching?: boolean;
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
  rematchState,
  onRequestRematch,
  onAcceptRematch,
  onDeclineRematch,
  isRematching = false,
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
  }, [latestEvent]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/65 backdrop-blur-3xl overflow-y-auto">
      {isSimComplete && isWinner && <Confetti active={true} duration={4000} />}

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
        className="apple-glass-elevated relative w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-3xl p-4 sm:p-6 shadow-[0_30px_70px_var(--et-shade-85)] space-y-3.5 sm:space-y-4 border border-white/20"
      >
        {/* Top Bar Navigation (Pitch Review, Hub Link, Close) */}
        <div className="relative z-20 flex items-center justify-between pb-2 border-b border-white/10">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="btn-haptic inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-xs font-bold text-foreground hover:text-white transition-colors cursor-pointer shadow-sm"
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
              className="btn-haptic inline-flex items-center gap-1.5 rounded-full border border-game-accent/30 bg-game-accent/10 px-3 py-1 text-xs font-bold text-game-accent-light hover:text-white transition-colors shadow-sm"
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
                className="btn-haptic flex h-7 w-7 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-foreground hover:text-white transition-colors cursor-pointer"
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-game-accent/30 bg-game-accent/10 px-3 py-0.5 text-[10px] sm:text-xs font-bold text-game-accent shadow-sm">
            <AppIcon icon={Lightning} size={12} weight="fill" />
            {isSolo ? 'BOSS SHOWDOWN' : '1v1 DRAFT SHOWDOWN'}
          </span>
          <div className="flex items-center justify-center gap-2">
            {isSimComplete && isWinner && (
              <AppIcon icon={Trophy} size={24} weight="fill" className="text-game-accent shrink-0" />
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
        <div className="apple-segmented-bar relative overflow-hidden rounded-2xl p-3.5 sm:p-4 shadow-inner border border-game-accent/15">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Host Side */}
            <div className="flex-1 text-center sm:text-start space-y-0.5 min-w-0">
              <span className="block truncate text-xs sm:text-sm font-extrabold text-white">
                {hostParticipant.name}
              </span>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[10px] text-muted">
                <span>OVR {hostParticipant.squadRating}</span>
                <span>•</span>
                <span className="text-game-accent font-bold">CHEM {hostParticipant.chemistryScore}</span>
              </div>
            </div>

            {/* Live Animated Score with Tabular Lining Figures */}
            <div className="flex flex-col items-center px-2 sm:px-4 shrink-0">
              <div className="flex items-center gap-2 font-display text-3xl sm:text-4xl font-black text-white font-stats">
                <span className="text-game-accent">{isSimComplete ? showdownResult.score.host : liveScore.host}</span>
                <span className="text-white/30">:</span>
                <span className="text-tier-master">{isSimComplete ? showdownResult.score.guest : liveScore.guest}</span>
              </div>

              {/* Minute badge */}
              <span className="mt-1 rounded-full border border-game-accent/30 bg-game-accent/10 px-2.5 py-0.5 font-stats text-[10px] font-bold text-game-accent shadow-sm">
                {isSimComplete
                  ? showdownResult.isShootout
                    ? `FT (${showdownResult.shootoutScore?.host}-${showdownResult.shootoutScore?.guest} PK)`
                    : 'FULL TIME'
                  : `${currentMinute}'`}
              </span>
            </div>

            {/* Guest / Boss Side */}
            <div className="flex-1 text-center sm:text-end space-y-0.5 min-w-0">
              <span className="block truncate text-xs sm:text-sm font-extrabold text-white">
                {guestParticipant?.name || 'Legendary Boss XI'}
              </span>
              <div className="flex items-center justify-center sm:justify-end gap-1.5 text-[10px] text-muted">
                <span>OVR {guestParticipant?.squadRating || 94}</span>
                <span>•</span>
                <span className="text-tier-master font-bold">
                  CHEM {guestParticipant?.chemistryScore || 33}
                </span>
              </div>
            </div>
          </div>

          {/* Shootout indicator */}
          {showdownResult.isShootout && isSimComplete && (
            <div className="mt-2 border-t border-white/8 pt-1.5 text-center text-xs font-bold text-game-accent">
              Penalties: {showdownResult.shootoutScore?.host} - {showdownResult.shootoutScore?.guest}
            </div>
          )}
        </div>

        {/* Sector Balance Comparison — Apple Complications */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-2 shadow-sm">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted">ATTACK</span>
            <div className="mt-0.5 flex items-center justify-between text-xs font-stats font-black px-1">
              <span className="text-game-accent">{showdownResult.sectors.host.attack}</span>
              <span className="text-tier-master">{showdownResult.sectors.guest.attack}</span>
            </div>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-2 shadow-sm">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted">MIDFIELD</span>
            <div className="mt-0.5 flex items-center justify-between text-xs font-stats font-black px-1">
              <span className="text-game-accent">{showdownResult.sectors.host.midfield}</span>
              <span className="text-tier-master">{showdownResult.sectors.guest.midfield}</span>
            </div>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-2 shadow-sm">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted">DEFENSE</span>
            <div className="mt-0.5 flex items-center justify-between text-xs font-stats font-black px-1">
              <span className="text-game-accent">{showdownResult.sectors.host.defense}</span>
              <span className="text-tier-master">{showdownResult.sectors.guest.defense}</span>
            </div>
          </div>
        </div>

        {/* Live Match Timeline Ticker — Apple Live Activity Style */}
        <div className="max-h-28 sm:max-h-36 overflow-y-auto space-y-1.5 rounded-2xl border border-white/8 bg-black/25 p-3 shadow-inner">
          <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-muted mb-1">
            Match Highlights
          </span>
          {visibleEvents.length === 0 ? (
            <span className="block py-2 text-center text-xs text-muted">
              Kicking off match...
            </span>
          ) : (
            visibleEvents.map((ev, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 text-[11px] sm:text-xs text-foreground border-b border-white/5 pb-1 last:border-0"
              >
                <span className="shrink-0 font-stats font-extrabold text-game-accent w-7 text-start">
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
                variant="gold"
                size="md"
                fullWidth
                onClick={onPlayBossMatch}
                disabled={bossLoading}
                leftIcon={<AppIcon icon={Sword} size={16} weight="bold" className="text-game-on-accent" />}
                className="font-bold text-game-on-accent shadow-md shadow-game-accent/25 rounded-xl py-2.5"
              >
                {bossLoading ? 'Summoning...' : 'Battle Boss Again'}
              </Button>
            )}

            {isSolo ? (
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
            ) : (
              <Button
                variant={rematchState?.status === 'declined' ? 'danger' : 'gold'}
                size="md"
                fullWidth
                onClick={onRequestRematch || onPlayAgain}
                disabled={isRematching || (rematchState?.status === 'pending' && rematchState.iAmInviter) || rematchState?.status === 'accepted'}
                leftIcon={
                  isRematching || (rematchState?.status === 'pending' && rematchState.iAmInviter) || rematchState?.status === 'accepted' ? (
                    <AppIcon icon={CircleNotch} size={16} weight="bold" className="animate-spin text-game-on-accent" />
                  ) : (
                    <AppIcon icon={ArrowsClockwise} size={16} weight="bold" className="text-game-on-accent" />
                  )
                }
                className="rounded-xl font-bold text-game-on-accent py-2.5 shadow-md shadow-game-accent/20"
              >
                {rematchState?.status === 'accepted'
                  ? 'Entering Rematch...'
                  : rematchState?.status === 'pending' && rematchState.iAmInviter
                    ? 'Waiting for Opponent...'
                    : rematchState?.status === 'declined'
                      ? 'Declined (Try Again)'
                      : 'Rematch Opponent'}
              </Button>
            )}
          </div>
        )}
        {/* Opponent Rematch Invitation Overlay */}
        {!isSolo && rematchState?.status === 'pending' && !rematchState.iAmInviter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="apple-glass-elevated max-w-sm w-full p-6 text-center space-y-5 rounded-3xl border border-game-accent/40 shadow-[0_20px_60px_var(--game-glow)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-game-accent/40 bg-game-accent/10 text-game-accent mx-auto shadow-[0_0_24px_var(--game-glow)]">
                <AppIcon icon={UserPlus} size={32} weight="duotone" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl font-black text-white uppercase font-display tracking-tight">
                  Rematch Invitation!
                </h2>
                <p className="text-muted text-xs font-medium max-w-xs mx-auto leading-relaxed">
                  {rematchState.inviterName || 'Your opponent'} challenges you to a 1v1 Draft Rematch!
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <Button
                  variant="gold"
                  size="lg"
                  fullWidth
                  onClick={onAcceptRematch}
                  leftIcon={<AppIcon icon={CheckCircle} size={20} weight="fill" className="text-game-on-accent" />}
                  className="font-bold text-game-on-accent shadow-[0_4px_20px_var(--game-glow)]"
                >
                  Accept Rematch
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  fullWidth
                  onClick={onDeclineRematch}
                  leftIcon={<AppIcon icon={X} size={16} weight="bold" className="text-muted" />}
                  className="text-muted hover:text-white"
                >
                  Decline
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

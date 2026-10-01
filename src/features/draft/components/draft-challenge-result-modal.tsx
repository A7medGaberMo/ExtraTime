'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  CheckCircle,
  XCircle,
  ArrowCounterClockwise,
  ArrowLeft,
  House,
  X,
  Sword,
  Ranking,
  Vault,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { sfx } from '@/lib/sfx';

export interface ChallengeEvaluationData {
  passed: boolean;
  challengeId: string;
  title: string;
  requirements: Array<{
    id: string;
    label: string;
    target: string;
    actual: string;
    met: boolean;
  }>;
  rewardXp: number;
  completedAt: number;
}

interface DraftChallengeResultModalProps {
  evaluation: ChallengeEvaluationData;
  onPlayAgain: () => void;
  onPlayBossMatch?: () => void;
  onClose?: () => void;
  bossLoading?: boolean;
}

export function DraftChallengeResultModal({
  evaluation,
  onPlayAgain,
  onPlayBossMatch,
  onClose,
  bossLoading = false,
}: DraftChallengeResultModalProps) {
  const { passed, title, requirements, rewardXp } = evaluation;

  useEffect(() => {
    if (passed) {
      sfx.victory();
    } else {
      sfx.runnerUp();
    }
  }, [passed]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-3xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="apple-glass-elevated relative w-full max-w-lg max-h-[92dvh] overflow-y-auto scrollbar-none rounded-3xl p-4 sm:p-7 shadow-[0_30px_70px_var(--et-shade-85)] text-center space-y-4 sm:space-y-5 border border-white/20"
        >
          {/* Top Bar Navigation (Review Pitch, Hub Link, Close) */}
          <div className="relative z-20 flex items-center justify-between pb-2 border-b border-white/10">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="btn-haptic inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-xs font-bold text-foreground hover:text-white transition-colors cursor-pointer shadow-sm"
                title="Review Drafted Pitch"
                aria-label="Review Drafted Pitch"
              >
                <AppIcon icon={ArrowLeft} size={13} weight="bold" />
                <span>Pitch Review</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Link
                href="/draft"
                className="btn-haptic inline-flex items-center gap-1.5 rounded-full border border-game-accent/30 bg-game-accent/10 px-3 py-1 text-xs font-bold text-game-accent hover:text-white transition-colors shadow-sm"
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
                  aria-label="Close result modal"
                >
                  <AppIcon icon={X} size={14} weight="bold" />
                </button>
              )}
            </div>
          </div>

          {/* Ambient Frosted Glow */}
          <div
            className={`pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-48 w-80 rounded-full blur-3xl opacity-30 ${
              passed ? 'bg-success' : 'bg-danger'
            }`}
          />

          {/* Hero Icon Badge */}
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
            <div
              className={`absolute inset-0 rounded-2xl blur-lg transition-all ${
                passed ? 'bg-success/40 animate-pulse' : 'bg-danger/30'
              }`}
            />
            <div
              className={`relative flex h-18 w-18 items-center justify-center rounded-2xl border shadow-xl ${
                passed
                  ? 'border-success/60 bg-gradient-to-tr from-game-accent via-game-accent-light to-game-accent-deep text-game-on-accent shadow-[0_0_35px_var(--game-glow)]'
                  : 'border-danger/60 bg-gradient-to-tr from-danger to-danger text-white shadow-[0_0_24px_color-mix(in_srgb,var(--et-danger)_50%,transparent)]'
              }`}
            >
              <AppIcon icon={passed ? Trophy : XCircle} size={36} weight="fill" />
            </div>
          </div>

          {/* Header Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-1.5 text-micro font-black uppercase tracking-widest text-muted">
              <AppIcon icon={passed ? Trophy : XCircle} size={13} weight="fill" className={passed ? 'text-success' : 'text-danger'} />
              <span>{title}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
              {passed ? (
                <span className="bg-gradient-to-r from-game-accent via-game-accent-light to-game-accent bg-clip-text text-transparent">
                  CHALLENGE PASSED!
                </span>
              ) : (
                <span className="text-danger">OBJECTIVES MISSED</span>
              )}
            </h2>
            <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
              {passed
                ? 'Tactical genius! You successfully met every requirement for this squad draft run.'
                : 'Close run! Some requirements fell just short of the objective. Try again with a new roll!'}
            </p>
          </div>

          {/* Reward Pill — Apple Gold Medal Style */}
          <div className="inline-flex items-center gap-2 rounded-full border border-game-accent/30 bg-game-accent/10 px-4 py-1.5 shadow-inner backdrop-blur-md">
            <span className="text-micro font-bold text-muted uppercase tracking-wider">REWARD:</span>
            <span className={`font-stats text-sm font-black ${passed ? 'text-success' : 'text-muted'}`}>
              +{rewardXp} XP
            </span>
          </div>

          {/* Requirement Verification Checklist — Apple Settings Style Rows */}
          <div className="space-y-2 rounded-2xl border border-white/10 bg-black/25 p-3 sm:p-4 text-start backdrop-blur-md shadow-inner">
            <span className="block text-micro font-black uppercase tracking-wider text-muted mb-2">
              Requirements Breakdown
            </span>

            {requirements.map((req) => (
              <div
                key={req.id}
                className={`flex items-center justify-between rounded-xl border p-2.5 transition-all ${
                  req.met
                    ? 'border-success/30 bg-success/10 text-white'
                    : 'border-danger/30 bg-danger/10 text-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <AppIcon
                    icon={req.met ? CheckCircle : XCircle}
                    size={20}
                    weight="fill"
                    className={`shrink-0 ${req.met ? 'text-success' : 'text-danger'}`}
                  />
                  <div>
                    <span className="block text-xs font-bold text-white leading-tight">
                      {req.label}
                    </span>
                    <span className="text-micro text-muted">
                      Target: <strong className="text-white">{req.target}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-end">
                  <span
                    className={`font-stats text-xs sm:text-sm font-black ${
                      req.met ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {req.actual}
                  </span>
                  <span className="block text-[9px] font-extrabold uppercase tracking-tighter text-muted">
                    {req.met ? 'OBJECTIVE MET' : 'UNFULFILLED'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
            <Button
              variant="gold"
              size="lg"
              fullWidth
              onClick={onPlayAgain}
              leftIcon={<AppIcon icon={ArrowCounterClockwise} size={18} weight="bold" className="text-game-on-accent" />}
              className="font-bold text-game-on-accent shadow-lg shadow-game-accent/25 rounded-xl py-3"
            >
              {passed ? 'Start Another Challenge' : 'Retry Challenge'}
            </Button>

            {onPlayBossMatch && (
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                disabled={bossLoading}
                onClick={onPlayBossMatch}
                leftIcon={<AppIcon icon={Sword} size={18} weight="bold" />}
                className="border-white/15 bg-white/5 hover:border-game-accent/40 text-white rounded-xl py-3 font-bold"
              >
                {bossLoading ? 'Simulating...' : 'Bonus: Match vs Boss XI'}
              </Button>
            )}
          </div>

          {/* Cross-Game Promo Links */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <Link
              href="/rank"
              className="btn-haptic flex items-center gap-1.5 px-3 py-1 rounded-full border border-game-accent/30 bg-game-accent/10 text-game-accent hover:border-game-accent/50 text-[11px] font-semibold transition-all shadow-sm"
            >
              <AppIcon icon={Ranking} size={13} weight="bold" />
              <span>Rank 45s</span>
            </Link>
            <Link
              href="/bank"
              className="btn-haptic flex items-center gap-1.5 px-3 py-1 rounded-full border border-game-accent/30 bg-game-accent/10 text-game-accent hover:border-game-accent/50 text-[11px] font-semibold transition-all shadow-sm"
            >
              <AppIcon icon={Vault} size={13} weight="bold" />
              <span>Bank It 90s</span>
            </Link>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-micro font-bold text-muted hover:text-white transition-colors underline pt-0.5 cursor-pointer"
            >
              Review My Drafted Pitch
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

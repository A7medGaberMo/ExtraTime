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
  ShareNetwork,
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
          className="apple-glass-elevated relative w-full max-w-lg overflow-hidden rounded-3xl p-5 sm:p-7 shadow-[0_30px_70px_rgba(0,0,0,0.85)] text-center space-y-4 sm:space-y-5 border border-white/20"
        >
          {/* Top Bar Navigation (Review Pitch, Hub Link, Close) */}
          <div className="relative z-20 flex items-center justify-between pb-2 border-b border-white/10">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="btn-haptic inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer shadow-sm"
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
              passed ? 'bg-emerald-400' : 'bg-rose-500'
            }`}
          />

          {/* Hero Icon Badge */}
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
            <div
              className={`absolute inset-0 rounded-2xl blur-lg transition-all ${
                passed ? 'bg-emerald-400/40 animate-pulse' : 'bg-rose-500/30'
              }`}
            />
            <div
              className={`relative flex h-18 w-18 items-center justify-center rounded-2xl border shadow-xl ${
                passed
                  ? 'border-emerald-400/60 bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 shadow-[0_0_35px_rgba(52,211,153,0.6)]'
                  : 'border-rose-500/60 bg-gradient-to-tr from-rose-600 to-rose-400 text-white shadow-[0_0_24px_rgba(244,63,94,0.5)]'
              }`}
            >
              <AppIcon icon={passed ? Trophy : XCircle} size={36} weight="fill" />
            </div>
          </div>

          {/* Header Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-1.5 text-micro font-black uppercase tracking-widest text-slate-400">
              <AppIcon icon={passed ? Trophy : XCircle} size={13} weight="fill" className={passed ? 'text-emerald-400' : 'text-rose-400'} />
              <span>{title}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
              {passed ? (
                <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent">
                  CHALLENGE PASSED!
                </span>
              ) : (
                <span className="text-rose-400">OBJECTIVES MISSED</span>
              )}
            </h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              {passed
                ? 'Tactical genius! You successfully met every requirement for this squad draft run.'
                : 'Close run! Some requirements fell just short of the objective. Try again with a new roll!'}
            </p>
          </div>

          {/* Reward Pill — Apple Gold Medal Style */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-1.5 shadow-inner backdrop-blur-md">
            <span className="text-micro font-bold text-slate-400 uppercase tracking-wider">REWARD:</span>
            <span className={`font-stats text-sm font-black ${passed ? 'text-amber-400' : 'text-slate-400'}`}>
              +{rewardXp} XP
            </span>
          </div>

          {/* Requirement Verification Checklist — Apple Settings Style Rows */}
          <div className="space-y-2 rounded-2xl border border-white/10 bg-black/25 p-3 sm:p-4 text-left backdrop-blur-md shadow-inner">
            <span className="block text-micro font-black uppercase tracking-wider text-slate-400 mb-2">
              Requirements Breakdown
            </span>

            {requirements.map((req) => (
              <div
                key={req.id}
                className={`flex items-center justify-between rounded-xl border p-2.5 transition-all ${
                  req.met
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-white'
                    : 'border-rose-500/30 bg-rose-500/10 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <AppIcon
                    icon={req.met ? CheckCircle : XCircle}
                    size={20}
                    weight="fill"
                    className={`shrink-0 ${req.met ? 'text-emerald-400' : 'text-rose-400'}`}
                  />
                  <div>
                    <span className="block text-xs font-bold text-white leading-tight">
                      {req.label}
                    </span>
                    <span className="text-micro text-slate-400">
                      Target: <strong className="text-white">{req.target}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-stats text-xs sm:text-sm font-black ${
                      req.met ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {req.actual}
                  </span>
                  <span className="block text-[9px] font-extrabold uppercase tracking-tighter text-slate-400">
                    {req.met ? 'OBJECTIVE MET' : 'UNFULFILLED'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={onPlayAgain}
              leftIcon={<AppIcon icon={ArrowCounterClockwise} size={18} weight="bold" />}
              className="bg-gradient-to-b from-cyan-400 to-cyan-500 text-slate-950 font-bold hover:brightness-110 shadow-lg shadow-cyan-400/25 rounded-xl py-3"
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
                className="border-purple-400/40 bg-purple-400/10 text-purple-300 hover:bg-purple-950/40 rounded-xl py-3 font-bold"
              >
                {bossLoading ? 'Simulating...' : 'Bonus: Match vs Boss XI'}
              </Button>
            )}
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-micro font-bold text-slate-400 hover:text-white transition-colors underline pt-1 cursor-pointer"
            >
              Review My Drafted Pitch
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

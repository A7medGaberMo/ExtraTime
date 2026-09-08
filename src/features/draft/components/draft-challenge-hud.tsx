'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Check, Info, X } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { useI18n } from '@/lib/i18n';
import type { DraftChallenge, ChallengeRequirementDef } from '../lib/challenges';
import type { EnrichedStarterSlot } from '../types/draft';
import { ClubCrestBadge, CountryFlagBadge } from '@/components/shared/card-badges';

interface DraftChallengeHudProps {
  challenge: DraftChallenge;
  starters: EnrichedStarterSlot[];
  chemistryScore: number;
  squadRating: number;
}

function matchesText(actual?: string, target?: string): boolean {
  if (!actual || !target) return false;
  const a = actual.trim().toLowerCase();
  const t = target.trim().toLowerCase();
  return a === t || a.includes(t) || t.includes(a);
}

export function cardMatchesChallenge(
  card: { clubName?: string; nationName?: string; league?: string },
  challenge?: DraftChallenge | null,
): string | null {
  if (!challenge) return null;

  for (const req of challenge.requirements) {
    if (req.type === 'nation_count' && req.targetName && matchesText(card.nationName, req.targetName)) {
      return req.targetName;
    }
    if (req.type === 'club_count' && req.targetName && matchesText(card.clubName, req.targetName)) {
      return req.targetName;
    }
    if (req.type === 'league_count' && req.targetName && matchesText(card.league, req.targetName)) {
      return req.targetName;
    }
  }

  return null;
}

export function DraftChallengeHud({
  challenge,
  starters,
  chemistryScore,
  squadRating,
}: DraftChallengeHudProps) {
  const { t } = useI18n();
  const [showRulesModal, setShowRulesModal] = useState(false);
  const filledStarters = starters.map((s) => s.player).filter(Boolean);

  const targetNation = challenge.requirements.find((r) => r.type === 'nation_count')?.targetName;
  const targetClub = challenge.requirements.find((r) => r.type === 'club_count')?.targetName;

  // Compute live progress per requirement
  const progressList = challenge.requirements.map((req) => {
    let current = 0;
    let target = req.targetValue;
    let label = req.label;

    if (req.type === 'nation_count') {
      current = filledStarters.filter((p) => matchesText(p?.nationName, req.targetName)).length;
      label = `${req.targetName || 'Nation'}`;
    } else if (req.type === 'club_count') {
      current = filledStarters.filter((p) => matchesText(p?.clubName, req.targetName)).length;
      label = `${req.targetName || 'Club'}`;
    } else if (req.type === 'league_count') {
      current = filledStarters.filter((p) => matchesText(p?.league, req.targetName)).length;
      label = `${req.targetName || 'League'}`;
    } else if (req.type === 'min_chem') {
      current = chemistryScore;
      label = 'Chem';
    } else if (req.type === 'min_rating') {
      current = squadRating;
      label = 'OVR';
    } else if (req.type === 'distinct_leagues') {
      const leagues = new Set(filledStarters.map((p) => p?.league).filter(Boolean));
      current = leagues.size;
      label = 'Leagues';
    } else if (req.type === 'single_club_count') {
      const counts: Record<string, number> = {};
      for (const p of filledStarters) {
        if (p?.clubName) counts[p.clubName] = (counts[p.clubName] || 0) + 1;
      }
      current = Math.max(0, ...Object.values(counts));
      label = 'Same Club';
    }

    const isMet = current >= target;
    return {
      id: req.id,
      label,
      current,
      target,
      isMet,
    };
  });

  const allMet = progressList.every((p) => p.isMet);

  return (
    <>
      <div className="apple-glass-card w-full flex items-center justify-between gap-2 rounded-2xl px-3 py-1.5 shadow-md border border-white/12 shrink-0">
        {/* Left: Challenge Title & Category */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative shrink-0">
            {challenge.category === 'nation' && targetNation ? (
              <CountryFlagBadge nationName={targetNation} className="h-7 w-7 shadow-sm ring-1 ring-white/20" />
            ) : challenge.category === 'club' && targetClub ? (
              <ClubCrestBadge clubName={targetClub} className="h-7 w-7 shadow-sm ring-1 ring-white/20" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/12 bg-white/[0.06] text-sm shadow-inner">
                {challenge.icon ? (
                  <span>{challenge.icon}</span>
                ) : (
                  <AppIcon icon={Trophy} size={14} weight="fill" className="text-amber-400" />
                )}
              </div>
            )}
          </div>
          <div className="min-w-0 flex items-center gap-1.5">
            <span className="truncate text-xs font-bold text-white tracking-tight">{challenge.title}</span>
            <span
              className="hidden sm:inline rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider border border-white/10"
              style={{
                backgroundColor: `${challenge.badgeColor}22`,
                color: challenge.badgeColor,
              }}
            >
              {challenge.categoryLabel}
            </span>
          </div>
        </div>

        {/* Center: Live Objective Trackers — Apple Fitness Ring Style Pills */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
          {progressList.map((prog) => (
            <div
              key={prog.id}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                prog.isMet
                  ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.35)]'
                  : 'border-white/10 bg-white/[0.04] text-slate-300'
              }`}
            >
              <span className="text-slate-400 font-medium">{prog.label}:</span>
              <span className={`font-stats font-black ${prog.isMet ? 'text-emerald-300' : 'text-white'}`}>
                {prog.current}/{prog.target}
              </span>
              {prog.isMet && <AppIcon icon={Check} size={11} weight="bold" className="text-emerald-400" />}
            </div>
          ))}
        </div>

        {/* Right: Quest Rules Toggle */}
        <button
          type="button"
          onClick={() => setShowRulesModal(true)}
          className="btn-haptic flex h-7 w-7 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-slate-300 hover:text-white hover:bg-white/[0.12] transition-colors shrink-0 cursor-pointer shadow-sm"
          title="View Challenge Rules"
          aria-label="View Challenge Rules"
        >
          <AppIcon icon={Info} size={13} weight="bold" />
        </button>
      </div>

      {/* Rules Modal — Apple Sheet Style */}
      <AnimatePresence>
        {showRulesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-3xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              className="apple-glass-elevated relative w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 text-center border border-white/20"
            >
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="btn-haptic absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Close"
                aria-label="Close rules modal"
              >
                <AppIcon icon={X} size={14} weight="bold" />
              </button>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-center mx-auto">
                  {challenge.category === 'nation' && targetNation ? (
                    <CountryFlagBadge nationName={targetNation} className="h-14 w-14 shadow-lg ring-2 ring-white/20" />
                  ) : challenge.category === 'club' && targetClub ? (
                    <ClubCrestBadge clubName={targetClub} className="h-14 w-14 shadow-lg ring-2 ring-white/20" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.08] text-2xl shadow-inner">
                      {challenge.icon ? (
                        <span>{challenge.icon}</span>
                      ) : (
                        <AppIcon icon={Trophy} size={28} weight="fill" className="text-amber-400" />
                      )}
                    </div>
                  )}
                </div>
                <h3 className="font-display text-lg font-black text-white">{challenge.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">{challenge.description}</p>
              </div>

              {/* Requirements Checklist */}
              <div className="space-y-1.5 text-left border-t border-white/10 pt-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {t('draft.targetObjectives')}:
                </span>
                {progressList.map((prog) => (
                  <div
                    key={prog.id}
                    className="flex items-center justify-between text-xs font-semibold p-2 rounded-xl bg-white/[0.04] border border-white/6"
                  >
                    <span className="text-slate-200">{prog.label} {t('draft.target')}</span>
                    <span className={`flex items-center gap-1.5 font-stats font-bold ${prog.isMet ? 'text-emerald-400' : 'text-cyan-400'}`}>
                      <span>{prog.current} / {prog.target}</span>
                      {prog.isMet && <AppIcon icon={Check} size={12} weight="bold" className="text-emerald-400" />}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 text-micro text-slate-400 border-t border-white/8">
                <span>{t('draft.reward')}: <strong className="text-amber-400 font-bold">+{challenge.rewardXp} XP</strong></span>
                <span>STATUS: <strong className={allMet ? 'text-emerald-400 font-black' : 'text-slate-300 font-bold'}>{allMet ? t('draft.objectivesMet') : t('draft.inProgress')}</strong></span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

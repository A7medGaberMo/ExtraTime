'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useToast } from '@/components/shared/toast';
import {
  Lightning,
  Trophy,
  Sword,
  Users,
  PlusCircle,
  SignIn,
  DiceFive,
  ShieldCheck,
  Star,
  SlidersHorizontal,
  Check,
  Play,
  CircleNotch,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { StatPill } from '@/components/ui/stat-pill';
import { ModalShell } from '@/components/ui/modal-shell';
import { TextInput } from '@/components/ui/text-input';
import { randomEgyptianManagerName as randomName } from '@/lib/random-names';
import { useGuestNickname } from '@/hooks/use-guest-nickname';
import { useGuestSession } from '@/hooks/use-guest-session';
import { useI18n } from '@/lib/i18n';
import { sfx } from '@/lib/sfx';
import {
  DRAFT_CHALLENGES,
  generateLuckyChallenge,
  type DraftChallenge,
} from '@/features/draft/lib/challenges';
import { ClubCrestBadge, CountryFlagBadge } from '@/components/shared/card-badges';

type DraftTab = 'solo' | 'duel';

type ActionPayload =
  | { type: 'solo'; challenge: string; formation: string }
  | { type: 'public_match' }
  | { type: 'create_private' }
  | { type: 'join_code'; code: string };

const FORMATION_OPTIONS = ['4-3-3', '4-2-3-1', '4-4-2', '3-5-2', '4-1-2-1-2'];

function DraftHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { ensureGuestId } = useGuestSession();
  const { t, lang } = useI18n();

  // Mutations
  const createSolo = useMutation(api.draft.mutations.createSoloDraft);
  const findPublic = useMutation(api.draft.mutations.findOrCreatePublicMatch);
  const createPrivate = useMutation(api.draft.mutations.createDuelPrivateRoom);
  const joinByCode = useMutation(api.draft.mutations.joinDraftByCode);

  // Queries
  const queueSummary = useQuery(api.draft.queries.getPublicQueueSummary);
  const leaderboard = useQuery(api.draft.queries.getSoloLeaderboard);

  const initialTab = searchParams.get('tab') === 'duel' ? 'duel' : 'solo';
  const [activeTab, setActiveTab] = useState<DraftTab>(initialTab);
  const [selectedFormation, setSelectedFormation] = useState<string>('4-3-3');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [luckyChallenge, setLuckyChallenge] = useState<DraftChallenge | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<ActionPayload | null>(null);

  const [nickname, setNickname] = useGuestNickname();

  const waitingCount = queueSummary?.waitingCount ?? 0;

  function triggerAction(action: ActionPayload) {
    const saved = localStorage.getItem('extratime_guestName');
    if (saved) {
      executeAction(action);
    } else {
      setPendingAction(action);
      setNickname(randomName());
      setShowNameModal(true);
    }
  }

  async function executeAction(action: ActionPayload) {
    if (loading) return;
    setLoading(true);

    try {
      const guestId = await ensureGuestId(nickname.trim() || randomName());
      const sessionToken = localStorage.getItem('extratime_sessionToken') || undefined;

      switch (action.type) {
        case 'solo': {
          const res = await createSolo({
            guestId,
            sessionToken,
            challengeType: action.challenge,
            formation: action.formation,
          });
          sfx.kickoff();
          router.push(`/draft/${res.gameId}`);
          break;
        }
        case 'public_match': {
          const res = await findPublic({ guestId, sessionToken });
          sfx.kickoff();
          router.push(`/draft/${res.gameId}`);
          break;
        }
        case 'create_private': {
          const res = await createPrivate({ hostId: guestId, sessionToken });
          sfx.kickoff();
          router.push(`/draft/${res.gameId}`);
          break;
        }
        case 'join_code': {
          const res = await joinByCode({
            guestId,
            sessionToken,
            code: action.code,
          });
          sfx.kickoff();
          router.push(`/draft/${res.gameId}`);
          break;
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast(err.message || 'Action failed. Please try again.', 'error');
      setLoading(false);
    }
  }

  async function handleModalSubmit() {
    if (!pendingAction || !nickname.trim()) return;
    setShowNameModal(false);
    await executeAction(pendingAction);
  }

  const handleRollLucky = () => {
    setIsRolling(true);
    sfx.cardDeal();
    setTimeout(() => {
      const generated = generateLuckyChallenge();
      setLuckyChallenge(generated);
      setIsRolling(false);
      sfx.tierReveal();
    }, 350);
  };

  const filteredChallenges = DRAFT_CHALLENGES.filter((c) => {
    if (selectedCategory === 'all') return true;
    return c.category === selectedCategory;
  });

  return (
    <article className="animate-fade-in mx-auto flex w-full max-w-4xl select-none flex-col items-center gap-5 py-4 sm:py-8 px-3 sm:px-4">
      {/* ── APPLE HIG HEADER ────────────────────────────────────────────── */}
      <header className="relative w-full space-y-3 pt-2 text-center overflow-hidden">
        {/* Apple Dynamic Specular Ambient Glow */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[220px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-cyan-500/15 via-emerald-500/10 to-purple-500/15 blur-[100px]" />

        <div className="relative space-y-2.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 backdrop-blur-xl shadow-sm">
            <AppIcon icon={Lightning} size={13} weight="fill" className="text-cyan-400" />
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
              ENGINE 3 · CLASSIC FUT DRAFT
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white">
            FUT Draft <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Duel</span>
          </h1>
          <p className="mx-auto max-w-lg text-xs sm:text-sm font-normal leading-relaxed text-slate-400">
            Select your tactical formation, draft 10 Starting XI galácticos and 3 super-subs, and complete dynamic challenges!
          </p>
        </div>
      </header>

      {/* ── APPLE SEGMENTED MODE CONTROL ─────────────────────────────────── */}
      <div className="apple-segmented-bar flex w-full max-w-md items-center justify-center rounded-full p-1 shadow-lg">
        <button
          type="button"
          onClick={() => {
            sfx.tap();
            setActiveTab('solo');
          }}
          className={`btn-haptic flex-1 flex items-center justify-center gap-2 rounded-full py-2 px-4 text-xs font-bold transition-all cursor-pointer ${activeTab === 'solo'
              ? 'apple-segmented-active text-white font-extrabold shadow-md'
              : 'text-slate-400 hover:text-white'
            }`}
        >
          <AppIcon icon={Trophy} size={16} weight={activeTab === 'solo' ? 'fill' : 'bold'} className={activeTab === 'solo' ? 'text-amber-400' : ''} />
          <span>Solo Challenges</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sfx.tap();
            setActiveTab('duel');
          }}
          className={`btn-haptic flex-1 flex items-center justify-center gap-2 rounded-full py-2 px-4 text-xs font-bold transition-all cursor-pointer ${activeTab === 'duel'
              ? 'apple-segmented-active text-white font-extrabold shadow-md'
              : 'text-slate-400 hover:text-white'
            }`}
        >
          <AppIcon icon={Users} size={16} weight={activeTab === 'duel' ? 'fill' : 'bold'} className={activeTab === 'duel' ? 'text-cyan-400' : ''} />
          <span>1v1 PvP Duels</span>
          {waitingCount > 0 && (
            <span className="rounded-full bg-cyan-400/25 border border-cyan-400/30 px-2 py-0.5 font-stats text-[10px] text-cyan-300 font-black">
              {waitingCount}
            </span>
          )}
        </button>
      </div>

      {/* ── PRE-SELECT FORMATION CONTROL BAR ── */}
      <div className="apple-glass-card flex flex-col sm:flex-row items-center justify-between gap-3 w-full rounded-2xl p-3 sm:p-3.5 shadow-lg">
        <div className="flex items-center gap-2.5 text-left w-full sm:w-auto">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] text-cyan-400 shadow-inner">
            <AppIcon icon={SlidersHorizontal} size={16} weight="bold" />
          </span>
          <div>
            <span className="block text-xs font-bold text-white tracking-wide">Tactical Formation</span>
            <span className="text-[10px] text-slate-400">Selected formation auto-loads on entry</span>
          </div>
        </div>

        {/* Formation quick picker segmented capsules - guaranteed unbreakable on mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full w-full sm:w-auto pb-1 sm:pb-0 scrollbar-hide no-scrollbar -mx-1 px-1 sm:mx-0 sm:px-0">
          {FORMATION_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              dir="ltr"
              onClick={() => {
                sfx.tap();
                setSelectedFormation(f);
              }}
              className={`btn-haptic shrink-0 whitespace-nowrap rounded-xl px-3 sm:px-3.5 py-1.5 text-xs font-black font-stats tracking-wider transition-all cursor-pointer select-none ${selectedFormation === f
                  ? 'bg-gradient-to-b from-cyan-400 to-cyan-500 text-slate-950 shadow-md shadow-cyan-400/25 ring-1 ring-white/40'
                  : 'bg-white/[0.05] border border-white/8 text-slate-400 hover:text-white hover:bg-white/[0.1]'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ───────────────────────────────────────── */}
      {activeTab === 'solo' ? (
        /* SOLO CHALLENGES */
        <section className="w-full space-y-4">
          {/* 🎲 APPLE HIG LUCKY QUEST HERO CARD (Compact & Punchy) */}
          <div className="apple-glass-elevated group relative flex flex-col sm:flex-row items-center justify-between p-3 sm:p-3.5 rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-cyan-950/30 via-slate-900/50 to-purple-950/30 shadow-[0_12px_32px_rgba(0,0,0,0.5)] gap-3">
            <div className="flex items-center gap-3 text-center sm:text-left w-full sm:w-auto min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/40 bg-gradient-to-b from-cyan-400/20 to-cyan-500/5 text-cyan-300 shadow-[0_0_16px_rgba(0,240,255,0.2)] mx-auto sm:mx-0">
                <AppIcon
                  icon={DiceFive}
                  size={22}
                  weight="fill"
                  className={isRolling ? 'animate-spin' : ''}
                />
              </div>

              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/15 px-1.5 py-0.2 text-[8px] font-black uppercase tracking-wider text-cyan-300 font-stats">
                    {lang === 'ar' ? 'تحدي الحظ' : 'PROCEDURAL QUEST'}
                  </span>
                  <span className="font-stats text-[10px] text-amber-400 font-bold bg-amber-400/10 border border-amber-400/20 rounded-full px-1.5 py-0.2">
                    +700~800 XP
                  </span>
                </div>
                <h3 className="font-display text-sm sm:text-base font-black text-white truncate">
                  {luckyChallenge ? luckyChallenge.title : (lang === 'ar' ? '🎲 ارمِ نرد الحظ!' : '🎲 Roll a Lucky Quest!')}
                </h3>
                <p className="text-[11px] text-slate-400 truncate max-w-md">
                  {luckyChallenge
                    ? luckyChallenge.subtitle || luckyChallenge.description
                    : (lang === 'ar' ? 'ارمِ النرد وهيطلعلك تحدي تكتيكي عشوائي تخلصه!' : 'Spin the dice for randomized objectives across nations and clubs!')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRollLucky}
                disabled={isRolling || loading}
                leftIcon={<AppIcon icon={DiceFive} size={14} weight="bold" />}
                className="w-full sm:w-auto h-8 px-3 text-xs border-white/15 bg-white/[0.06] text-slate-200 hover:text-white rounded-xl font-bold"
              >
                {isRolling ? (lang === 'ar' ? 'بنرمي...' : 'Rolling...') : luckyChallenge ? (lang === 'ar' ? 'ارمِ تاني' : 'Re-roll') : (lang === 'ar' ? 'ارمِ النرد' : 'Roll Quest')}
              </Button>

              {luckyChallenge && (
                <Button
                  variant="cyan"
                  size="sm"
                  onClick={() =>
                    triggerAction({
                      type: 'solo',
                      challenge: luckyChallenge.id,
                      formation: selectedFormation,
                    })
                  }
                  disabled={loading}
                  leftIcon={<AppIcon icon={Play} size={12} weight="fill" className="text-slate-950" />}
                  className="w-full sm:w-auto h-8 px-3 text-xs font-black rounded-xl shadow-md shadow-cyan-400/25 text-slate-950"
                >
                  {lang === 'ar' ? 'ابدأ' : 'Play'}
                </Button>
              )}
            </div>
          </div>

          {/* Apple Category Filter Segmented Pills */}
          <div className="apple-segmented-bar inline-flex items-center gap-1 p-1 rounded-full max-w-full overflow-x-auto shadow-sm">
            {[
              { id: 'all', label: t('draft.allQuests') || 'All Challenges' },
              { id: 'nation', label: t('draft.nationsTab') || 'Nations 🌍' },
              { id: 'club', label: t('draft.clubsTab') || 'Clubs 🏆' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  sfx.tap();
                  setSelectedCategory(cat.id);
                }}
                className={`btn-haptic rounded-full px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${selectedCategory === cat.id
                    ? 'apple-segmented-active text-white font-black'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Dynamic Challenge Cards Grid — Compact Apple Arcade / Keynote Style (Half Height, Zero Noise) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredChallenges.map((challenge) => {
              const targetNation = challenge.requirements.find((r) => r.type === 'nation_count')?.targetName;
              const targetClub = challenge.requirements.find((r) => r.type === 'club_count')?.targetName;

              return (
                <div
                  key={challenge.id}
                  className="apple-glass-card group relative flex items-center justify-between p-3 sm:p-3.5 rounded-2xl cursor-pointer select-none transition-all duration-200 hover:border-cyan-400/40 hover:bg-white/[0.06] hover:shadow-[0_8px_24px_rgba(0,0,0,0.5),0_0_16px_rgba(0,240,255,0.12)] border border-white/10"
                  onClick={() =>
                    triggerAction({
                      type: 'solo',
                      challenge: challenge.id,
                      formation: selectedFormation,
                    })
                  }
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                    {/* High-res badge: Country flag or Club crest or Icon */}
                    <div className="relative shrink-0 transition-transform group-hover:scale-105">
                      {challenge.category === 'nation' && targetNation ? (
                        <CountryFlagBadge
                          nationName={targetNation}
                          className="h-10 w-10 shadow-sm ring-1 ring-white/15 rounded-xl"
                        />
                      ) : challenge.category === 'club' && targetClub ? (
                        <ClubCrestBadge
                          clubName={targetClub}
                          className="h-10 w-10 shadow-sm ring-1 ring-white/15 rounded-xl"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-xl shadow-inner group-hover:border-cyan-400/50 transition-all">
                          <span className="drop-shadow">{challenge.icon}</span>
                        </div>
                      )}
                    </div>

                    {/* Quest Info: Title, Subtitle Objective, and XP Reward */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                          {challenge.title}
                        </h3>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.2 text-[8px] font-black uppercase tracking-wider font-stats ${challenge.difficulty === 'EASY'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                              : challenge.difficulty === 'MEDIUM'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                                : 'bg-purple-500/15 text-purple-300 border border-purple-500/25'
                            }`}
                        >
                          {challenge.difficulty}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-300 truncate">
                        <span className="text-cyan-400/90 font-medium truncate">
                          {challenge.subtitle}
                        </span>
                        <span className="text-white/20">·</span>
                        <span className="inline-flex items-center gap-1 font-stats font-bold text-amber-400 shrink-0 text-[10.5px]">
                          <AppIcon icon={Trophy} size={11} weight="bold" />
                          +{challenge.rewardXp} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Play Action Button */}
                  <Button
                    variant="cyan"
                    size="sm"
                    leftIcon={<AppIcon icon={Play} size={12} weight="fill" className="text-slate-950" />}
                    className="shrink-0 h-8 px-3 text-xs font-black rounded-xl shadow-sm shadow-cyan-400/20 text-slate-950 group-hover:scale-105 transition-transform"
                  >
                    {lang === 'ar' ? 'ابدأ' : 'Play'}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Solo Hall of Fame Preview — Apple Health / Activity Style Widget */}
          {leaderboard && leaderboard.length > 0 && (
            <div className="apple-glass-card w-full rounded-2xl p-4 shadow-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <AppIcon icon={Trophy} size={15} weight="fill" className="text-amber-400" />
                  <span>Solo Top Drafts Today</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Leaderboard</span>
              </div>

              <div className="space-y-1.5">
                {leaderboard.slice(0, 3).map((entry, idx) => {
                  const rankBadge =
                    idx === 0
                      ? 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                      : idx === 1
                        ? 'bg-slate-300/15 text-slate-200 border-slate-300/30'
                        : 'bg-amber-700/20 text-amber-600 border-amber-700/30';

                  return (
                    <div
                      key={entry.gameId}
                      className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/6 p-2.5 text-xs transition-colors hover:bg-white/[0.07]"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-stats font-black ${rankBadge}`}>
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white">{entry.playerName}</span>
                        <span className="text-[10px] text-slate-400">({entry.formation})</span>
                      </div>
                      <div className="flex items-center gap-2.5 font-stats">
                        <span className="text-cyan-400 font-bold">{entry.chemistryScore}c</span>
                        <span className="text-white font-black">{entry.totalDraftScore} pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      ) : (
        /* 1v1 PVP DUELS — Apple Connect / AirDrop Style Cards */
        <section className="w-full max-w-md space-y-4">
          <div className="space-y-3">
            <div className="apple-glass-card p-5 rounded-2xl space-y-3 shadow-lg">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-400 shadow-inner">
                  <AppIcon icon={Users} size={24} weight="bold" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white">Public Matchmaking</h3>
                  <p className="text-xs text-slate-400">Duel a random online rival in real time</p>
                </div>
              </div>

              <Button
                variant="primary"
                fullWidth
                disabled={loading}
                onClick={() => triggerAction({ type: 'public_match' })}
                className="bg-gradient-to-b from-cyan-400 to-cyan-500 text-slate-950 font-bold hover:brightness-110 rounded-xl shadow-md shadow-cyan-400/25 py-2.5"
              >
                {waitingCount > 0 ? `Match With Rival (${waitingCount} waiting)` : 'Enter Public Match'}
              </Button>
            </div>

            <div className="apple-glass-card p-5 rounded-2xl space-y-3 shadow-lg">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-400/30 bg-purple-400/10 text-purple-400 shadow-inner">
                  <AppIcon icon={PlusCircle} size={24} weight="bold" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white">Private Room</h3>
                  <p className="text-xs text-slate-400">Create a code and share it with a friend</p>
                </div>
              </div>

              <Button
                variant="secondary"
                fullWidth
                disabled={loading}
                onClick={() => triggerAction({ type: 'create_private' })}
                className="border-purple-400/40 bg-purple-400/10 text-purple-300 hover:bg-purple-950/40 rounded-xl font-bold py-2.5"
              >
                Create Private Duel Room
              </Button>
            </div>

            <div className="apple-glass-card p-5 rounded-2xl space-y-3 shadow-lg">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-400 shadow-inner">
                  <AppIcon icon={SignIn} size={24} weight="bold" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white">Join by Code</h3>
                  <p className="text-xs text-slate-400">Enter friend’s 6-character room code</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <TextInput
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="CODE"
                  className="font-stats tracking-widest text-center uppercase font-bold rounded-xl border-white/15 bg-white/[0.06] text-white focus:border-emerald-400"
                />
                <Button
                  variant="primary"
                  disabled={loading || roomCodeInput.trim().length !== 6}
                  onClick={() => triggerAction({ type: 'join_code', code: roomCodeInput.trim() })}
                  className="bg-gradient-to-b from-emerald-400 to-emerald-500 text-slate-950 font-bold shrink-0 rounded-xl px-5 hover:brightness-110 shadow-md shadow-emerald-400/25"
                >
                  Join
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── GUEST NICKNAME MODAL ──────────────────────────────── */}
      <ModalShell
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        title="Enter Manager Nickname"
      >
        <div className="space-y-4 p-4">
          <p className="text-xs text-steel">
            Choose your display manager name to track challenge runs and show on duel scoreboards.
          </p>
          <TextInput
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. MasterTactician"
          />
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowNameModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleModalSubmit} disabled={!nickname.trim()}>
              Continue
            </Button>
          </div>
        </div>
      </ModalShell>
    </article>
  );
}

export default function DraftHubPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <AppIcon icon={CircleNotch} size={36} weight="bold" className="text-cyan-400 animate-spin" />
          <span className="font-stats text-xs font-bold uppercase tracking-widest text-steel">
            Loading FUT Draft...
          </span>
        </div>
      }
    >
      <DraftHubContent />
    </Suspense>
  );
}

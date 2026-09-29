'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useToast } from '@/components/shared/toast';
import {
  Trophy,
  Users,
  PlusCircle,
  SignIn,
  Shuffle,
  Play,
  CircleNotch,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
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

  // Convex Mutations
  const createSolo = useMutation(api.draft.mutations.createSoloDraft);
  const findPublic = useMutation(api.draft.mutations.findOrCreatePublicMatch);
  const createPrivate = useMutation(api.draft.mutations.createDuelPrivateRoom);
  const joinByCode = useMutation(api.draft.mutations.joinDraftByCode);

  // Convex Queries
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
      void executeAction(action);
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

const CHALLENGE_ARABIC: Record<string, { title: string; subtitle: string; difficulty: string }> = {
  nation_brazil: { title: 'سحر السامبا', subtitle: 'اختر 4+ برازيليين وتناغم 24+', difficulty: 'متوسط' },
  nation_spain: { title: 'الماتادور الإسباني', subtitle: 'اختر 4+ إسبان وتناغم 25+', difficulty: 'متوسط' },
  nation_england: { title: 'الأسود الثلاثة', subtitle: 'اختر 4+ إنجليز وتناغم 24+', difficulty: 'متوسط' },
  nation_france: { title: 'كتيبة الديوك', subtitle: 'اختر 4+ فرنسيين وتناغم 25+', difficulty: 'متوسط' },
  nation_argentina: { title: 'تانغو الألبيسيليستي', subtitle: 'اختر 3+ أرجنتينيين وتقييم 84+', difficulty: 'صعب' },
  nation_germany: { title: 'الماكينات الألمانية', subtitle: 'اختر 4+ ألمان وتناغم 24+', difficulty: 'متوسط' },
  nation_portugal: { title: 'برازيل أوروبا', subtitle: 'اختر 3+ برتغاليين وتناغم 25+', difficulty: 'متوسط' },
  nation_italy: { title: 'القلعة الإيطالية', subtitle: 'اختر 3+ إيطاليين وتقييم 84+', difficulty: 'صعب' },
  club_clasico: { title: 'كلاسيكو الأرض', subtitle: '2+ ريال مدريد و2+ برشلونة', difficulty: 'صعب' },
  club_real_madrid: { title: 'ملوك أوروبا', subtitle: 'اختر 3+ ريال مدريد وتقييم 85+', difficulty: 'صعب' },
  club_barcelona: { title: 'تيكي تاكا البلوغرانا', subtitle: 'اختر 3+ برشلونة وتناغم 26+', difficulty: 'صعب' },
  club_single_core: { title: 'وفاء النادي الواحد', subtitle: 'اختر 4+ نجوم من نادٍ واحد', difficulty: 'صعب' },
  club_man_city: { title: 'هيمنة السيتي', subtitle: 'اختر 3+ مانشستر سيتي وتقييم 85+', difficulty: 'صعب' },
  club_arsenal: { title: 'طوفان الجانرز', subtitle: 'اختر 3+ أرسنال وتناغم 25+', difficulty: 'متوسط' },
  club_liverpool: { title: 'موسيقى أنفيلد', subtitle: 'اختر 3+ ليفربول وتناغم 25+', difficulty: 'متوسط' },
  club_bayern: { title: 'الماكينة البافارية', subtitle: 'اختر 3+ بايرن ميونخ وتقييم 85+', difficulty: 'صعب' },
};

function getChallengeTitle(challenge: DraftChallenge, isAr: boolean) {
  if (isAr && CHALLENGE_ARABIC[challenge.id]) {
    return CHALLENGE_ARABIC[challenge.id].title;
  }
  return challenge.title;
}

function getChallengeSubtitle(challenge: DraftChallenge, isAr: boolean) {
  if (isAr && CHALLENGE_ARABIC[challenge.id]) {
    return CHALLENGE_ARABIC[challenge.id].subtitle;
  }
  return challenge.subtitle;
}

function getChallengeDifficulty(challenge: DraftChallenge, isAr: boolean) {
  if (isAr && CHALLENGE_ARABIC[challenge.id]) {
    return CHALLENGE_ARABIC[challenge.id].difficulty;
  }
  return challenge.difficulty;
}

  const filteredChallenges = DRAFT_CHALLENGES.filter((c) => {
    if (selectedCategory === 'all') return true;
    return c.category === selectedCategory;
  });

  return (
    <article className="animate-fade-in mx-auto flex w-full max-w-4xl select-none flex-col items-center gap-2 sm:gap-2.5 py-0.5 sm:py-1 px-1.5 sm:px-3">
      {/* ── 1. CLEAN APPLE HEADER ────────────────────────────────────── */}
      <header className="relative w-full space-y-0.5 text-center overflow-hidden">
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[120px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-[70px]" />

        <div className="relative space-y-0.5">
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
            {lang === 'ar' ? (
              <>استوديو <span className="text-gold">اكسترا درافت</span></>
            ) : (
              <>Pro Draft <span className="text-gold">Studio</span></>
            )}
          </h1>
          <p className="mx-auto max-w-md text-[10.5px] sm:text-xs font-normal leading-relaxed text-steel">
            {lang === 'ar'
              ? 'اختر خطتك التكتيكية، وابنِ تشكيلة الـ 14 لاعباً بأعلى نقاط تناغم ممكنة.'
              : 'Select your tactical formation, draft your 14 galácticos, and maximize chemistry.'}
          </p>
        </div>
      </header>

      {/* ── 2. COMBINED MODE & FORMATION CONTROL BAR ─────────────────── */}
      <div className="luxury-glass flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 w-full rounded-2xl p-2 sm:p-2.5 shadow-md border border-gold/20 backdrop-blur-xl">
        {/* Mode Switch */}
        <div className="flex items-center rounded-xl border border-white/10 bg-slate-950/70 p-0.5 shadow-inner shrink-0">
          <button
            type="button"
            onClick={() => {
              sfx.tap();
              setActiveTab('solo');
            }}
            className={`btn-haptic flex items-center justify-center gap-1.5 rounded-lg py-1 px-3 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'solo'
                ? 'border border-gold/40 bg-gold/20 text-gold shadow-sm'
                : 'text-steel hover:text-white'
            }`}
          >
            <AppIcon icon={Trophy} size={14} weight={activeTab === 'solo' ? 'fill' : 'bold'} className={activeTab === 'solo' ? 'text-gold' : ''} />
            <span>{lang === 'ar' ? 'تحديات فردية' : 'Solo Quests'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sfx.tap();
              setActiveTab('duel');
            }}
            className={`btn-haptic flex items-center justify-center gap-1.5 rounded-lg py-1 px-3 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'duel'
                ? 'border border-gold/40 bg-gold/20 text-gold shadow-sm'
                : 'text-steel hover:text-white'
            }`}
          >
            <AppIcon icon={Users} size={14} weight={activeTab === 'duel' ? 'fill' : 'bold'} className={activeTab === 'duel' ? 'text-gold' : ''} />
            <span>{lang === 'ar' ? 'ديربي 1v1' : '1v1 Duels'}</span>
            {waitingCount > 0 && (
              <span className="rounded-full bg-gold/25 px-1.5 py-0.5 font-stats text-[9px] text-gold font-bold">
                {waitingCount}
              </span>
            )}
          </button>
        </div>

        {/* Formation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-0.5 sm:pb-0 scrollbar-hidden">
          <div className="flex items-center gap-1 text-[11px] font-bold text-steel font-stats px-1 shrink-0">
            <span className="text-gold text-xs">⚡</span>
            <span>{lang === 'ar' ? 'الخطة:' : 'Formation:'}</span>
          </div>
          {FORMATION_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              dir="ltr"
              onClick={() => {
                sfx.tap();
                setSelectedFormation(f);
              }}
              className={`btn-haptic shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-black font-stats tracking-wider transition-all cursor-pointer ${
                selectedFormation === f
                  ? 'border border-gold/60 bg-gradient-to-b from-amber-400 to-yellow-500 text-slate-950 shadow-[0_2px_10px_rgba(245,158,11,0.35)]'
                  : 'bg-slate-900/80 border border-white/10 text-slate-300 hover:text-white hover:border-white/20'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. TAB CONTENT ───────────────────────────────────────────── */}
      {activeTab === 'solo' ? (
        <section className="w-full space-y-2 pt-0.5">
          {/* Procedural Lucky Quest Hero Strip (100% Halal Surprise Tactical Draw) */}
          <div className="relative overflow-hidden flex flex-wrap sm:flex-nowrap items-center justify-between p-2.5 sm:p-3 rounded-2xl border border-amber-400/35 bg-gradient-to-r from-amber-500/12 via-slate-900/90 to-amber-500/12 shadow-[0_4px_24px_rgba(245,158,11,0.12),inset_0_1px_0_0_rgba(255,255,255,0.1)] gap-2.5 backdrop-blur-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/20 text-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.25)]">
                <AppIcon
                  icon={Shuffle}
                  size={18}
                  weight="bold"
                  className={isRolling ? 'animate-spin text-amber-200' : 'text-amber-300'}
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300 font-stats">
                    {lang === 'ar' ? 'سحب تكتيكي مباغت' : 'SURPRISE DRAW'}
                  </span>
                  <span className="font-stats text-[10px] text-amber-400 font-black tracking-wide">
                    +750 XP
                  </span>
                </div>
                <h3 className="font-display text-xs sm:text-sm font-bold text-white truncate">
                  {luckyChallenge
                    ? luckyChallenge.title
                    : lang === 'ar'
                      ? 'سحب التحدي التكتيكي المفاجئ'
                      : 'Draw a Surprise Tactical Quest'}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-steel truncate">
                  {luckyChallenge
                    ? luckyChallenge.subtitle
                    : lang === 'ar'
                      ? 'اسحب مهمة عشوائية بمتطلبات غير متوقعة واكسب مكافأة مضاعفة'
                      : 'Draw a randomized quest with surprise objectives and bonus XP'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRollLucky}
                disabled={isRolling || loading}
                leftIcon={<AppIcon icon={Shuffle} size={14} weight="bold" className={isRolling ? 'animate-spin' : ''} />}
                className="font-bold text-xs h-8 px-3 rounded-xl border-amber-400/30 hover:border-amber-400/50 bg-slate-900/80 hover:bg-slate-800"
              >
                {isRolling
                  ? lang === 'ar'
                    ? 'جاري السحب...'
                    : 'Drawing...'
                  : luckyChallenge
                    ? lang === 'ar'
                      ? 'سحب آخر'
                      : 'Draw Another'
                    : lang === 'ar'
                      ? 'سحب التحدي'
                      : 'Draw Quest'}
              </Button>

              {luckyChallenge && (
                <Button
                  variant="gold"
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
                  className="font-black text-xs h-8 px-3.5 rounded-xl text-slate-950 shadow-[0_2px_12px_rgba(245,158,11,0.35)]"
                >
                  {lang === 'ar' ? 'ابدأ التحدي' : 'Play Now'}
                </Button>
              )}
            </div>
          </div>

          {/* Category Filter Capsules */}
          <div className="w-fit mx-auto flex items-center justify-center gap-1.5 p-1 rounded-full border border-white/10 bg-slate-900/80 backdrop-blur-md shadow-inner">
            {[
              { id: 'all', label: lang === 'ar' ? 'جميع التحديات' : 'All Quests' },
              { id: 'club', label: lang === 'ar' ? 'الأندية الأوروبية 🏆' : 'Clubs 🏆' },
              { id: 'nation', label: lang === 'ar' ? 'المنتخبات العالمية 🌍' : 'Nations 🌍' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  sfx.tap();
                  setSelectedCategory(cat.id);
                }}
                className={`btn-haptic rounded-full px-3 py-1 text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'border border-amber-400/50 bg-gradient-to-r from-amber-400/25 to-yellow-400/20 text-white font-black shadow-[0_2px_10px_rgba(245,158,11,0.2)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Horizontal Swipeable Quest Cards Rail (Zero Vertical Scroll) */}
          <div className="flex items-stretch gap-2.5 sm:gap-3 overflow-x-auto pb-2 pt-0.5 scrollbar-hidden snap-x snap-mandatory w-full px-0.5">
            {filteredChallenges.map((challenge) => {
              const targetNation = challenge.requirements.find((r) => r.type === 'nation_count')?.targetName;
              const targetClub = challenge.requirements.find((r) => r.type === 'club_count')?.targetName;
              const isAr = lang === 'ar';
              const title = getChallengeTitle(challenge, isAr);
              const subtitle = getChallengeSubtitle(challenge, isAr);
              const difficultyText = getChallengeDifficulty(challenge, isAr);
              const isHard = challenge.difficulty === 'HARD';
              const isMedium = challenge.difficulty === 'MEDIUM';

              return (
                <div
                  key={challenge.id}
                  onClick={() =>
                    triggerAction({
                      type: 'solo',
                      challenge: challenge.id,
                      formation: selectedFormation,
                    })
                  }
                  className="luxury-glass group relative flex flex-col justify-between p-3 rounded-2xl cursor-pointer select-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] border border-white/12 hover:border-amber-400/40 w-[230px] sm:w-[250px] shrink-0 snap-start bg-slate-950/80 backdrop-blur-xl"
                >
                  {/* Top: Crest + Title + Difficulty */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0 transition-transform group-hover:scale-105">
                      {challenge.category === 'nation' && targetNation ? (
                        <CountryFlagBadge
                          nationName={targetNation}
                          className="h-8 w-8 shadow-md rounded-xl ring-1 ring-white/15"
                        />
                      ) : challenge.category === 'club' && targetClub ? (
                        <ClubCrestBadge
                          clubName={targetClub}
                          className="h-8 w-8 shadow-md rounded-xl ring-1 ring-white/15"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-base shadow-sm">
                          <span>{challenge.icon}</span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h3 className="font-display text-xs sm:text-[13px] font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                          {title}
                        </h3>
                        <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider font-stats border ${
                          isHard
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                            : isMedium
                              ? 'bg-amber-500/15 text-amber-300 border-amber-400/35'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/35'
                        }`}>
                          {difficultyText}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[10.5px] text-steel leading-tight line-clamp-2">
                        {subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Bottom: XP + Action button */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-2">
                    <div className="flex items-center gap-1 font-stats text-[10.5px] font-bold text-amber-300">
                      <span className="text-[11px] font-black font-stats">+{challenge.rewardXp}</span>
                      <span className="text-[9px] text-steel font-bold uppercase">XP</span>
                    </div>

                    <Button
                      variant="gold"
                      size="sm"
                      leftIcon={<AppIcon icon={Play} size={11} weight="fill" className="text-slate-950" />}
                      className="h-7 px-3 text-[11px] font-black rounded-xl text-slate-950 shadow-[0_2px_8px_rgba(245,158,11,0.25)] group-hover:brightness-110"
                    >
                      {lang === 'ar' ? 'ابدأ' : 'Play'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compact 1-Line Leaderboard Strip */}
          {leaderboard && leaderboard.length > 0 && (
            <div className="luxury-glass w-full rounded-2xl px-3 py-2 flex items-center justify-between gap-3 overflow-x-auto scrollbar-hidden text-xs border border-gold/20 shadow-md">
              <div className="flex items-center gap-2 shrink-0 font-bold text-white uppercase font-stats">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gold/15 border border-gold/40 text-gold shadow-sm">
                  <AppIcon icon={Trophy} size={14} weight="fill" className="text-gold" />
                </div>
                <span className="text-xs font-black">{lang === 'ar' ? 'أفضل المدربين' : 'Top Drafts'}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {leaderboard.slice(0, 3).map((entry, idx) => {
                  const badgeStyle =
                    idx === 0
                      ? 'border-gold/45 bg-gold/15 text-gold'
                      : idx === 1
                        ? 'border-slate-300/35 bg-slate-300/10 text-slate-200'
                        : 'border-amber-700/40 bg-amber-700/15 text-amber-400';

                  return (
                    <div
                      key={entry.gameId}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-semibold ${badgeStyle}`}
                    >
                      <span className="font-stats font-black">#{idx + 1}</span>
                      <span className="text-white font-medium truncate max-w-[95px]">{entry.playerName}</span>
                      <span className="font-stats font-black text-amber-300">
                        {entry.chemistryScore} {lang === 'ar' ? 'تناغم' : 'Chem'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      ) : (
        /* 1v1 PVP DUELS (ZERO-SCROLL COMPACT) */
        <section className="w-full max-w-2xl space-y-2 pt-0.5">
          {/* Public Matchmaking Banner */}
          <div className="luxury-glass p-2.5 sm:p-3 rounded-2xl flex items-center justify-between gap-3 border border-gold/20">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl border border-gold/40 bg-gold/15 text-gold">
                <AppIcon icon={Users} size={18} weight="bold" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-xs sm:text-[13px] font-bold text-white truncate">
                  {lang === 'ar' ? 'البحث عن منافس أونلاين' : 'Public Matchmaking'}
                </h3>
                <p className="text-[10px] text-steel truncate">
                  {lang === 'ar' ? 'ديربي مباشر مع لاعب عشوائي' : 'Duel a random online rival in real time'}
                </p>
              </div>
            </div>

            <Button
              variant="gold"
              size="sm"
              disabled={loading}
              onClick={() => triggerAction({ type: 'public_match' })}
              className="shrink-0 rounded-xl h-8 px-3 text-xs font-bold text-slate-950 shadow-sm"
            >
              {waitingCount > 0
                ? `${waitingCount} waiting`
                : lang === 'ar' ? 'دخول البحث' : 'Enter Match'}
            </Button>
          </div>

          {/* Row 2: Private Room + Join by Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="luxury-glass p-2.5 sm:p-3 rounded-2xl space-y-2 border border-gold/15">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-slate-300">
                  <AppIcon icon={PlusCircle} size={15} weight="bold" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-xs font-bold text-white truncate">
                    {lang === 'ar' ? 'غرفة خاصة' : 'Private Room'}
                  </h3>
                  <p className="text-[9.5px] text-steel truncate">
                    {lang === 'ar' ? 'شارك الكود مع صديق' : 'Create room code'}
                  </p>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                fullWidth
                disabled={loading}
                onClick={() => triggerAction({ type: 'create_private' })}
                className="rounded-xl h-8 text-[11px] font-bold hover:border-gold/40"
              >
                {lang === 'ar' ? 'إنشاء غرفة خاصة' : 'Create Room'}
              </Button>
            </div>

            <div className="luxury-glass p-2.5 sm:p-3 rounded-2xl space-y-2 border border-gold/15">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-slate-300">
                  <AppIcon icon={SignIn} size={15} weight="bold" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-xs font-bold text-white truncate">
                    {lang === 'ar' ? 'انضمام بكود' : 'Join by Code'}
                  </h3>
                  <p className="text-[9.5px] text-steel truncate">
                    {lang === 'ar' ? 'أدخل كود صديقك' : 'Enter 6-char PIN'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <TextInput
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="CODE"
                  className="font-stats tracking-widest text-center uppercase font-bold !py-1 text-xs"
                />
                <Button
                  variant="gold"
                  size="sm"
                  disabled={loading || roomCodeInput.trim().length !== 6}
                  onClick={() => triggerAction({ type: 'join_code', code: roomCodeInput.trim() })}
                  className="shrink-0 rounded-xl px-3 h-8 font-bold text-slate-950 text-xs"
                >
                  {lang === 'ar' ? 'انضم' : 'Join'}
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── GUEST NICKNAME MODAL ────────────────────────────────────── */}
      <ModalShell
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        title={t('home.nameModal.title')}
        subtitle={t('home.nameModal.subtitle')}
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          <TextInput
            label={t('home.nameModal.label')}
            placeholder={t('home.nameModal.placeholder')}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoFocus
            maxLength={18}
            rightIcon={
              <button
                type="button"
                onClick={() => setNickname(randomName())}
                aria-label={t('home.nameModal.randomize')}
                title={t('home.nameModal.randomize')}
                className="btn-haptic flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-300 transition-colors hover:border-gold/50 hover:text-gold"
              >
                <AppIcon icon={Shuffle} size={18} weight="bold" />
              </button>
            }
          />

          <div className="flex items-center justify-end px-1">
            <span className="font-stats text-xs text-steel">{nickname.length}/18</span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowNameModal(false)} className="rounded-xl">
              {t('common.cancel')}
            </Button>
            <Button
              variant="gold"
              onClick={handleModalSubmit}
              disabled={loading || !nickname.trim()}
              loading={loading}
              className="rounded-xl font-bold"
            >
              {loading ? t('home.nameModal.finding') : t('common.confirm')}
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
          <AppIcon icon={CircleNotch} size={32} weight="bold" className="text-gold animate-spin" />
          <span className="font-stats text-xs font-bold uppercase tracking-widest text-steel">
            Loading Pro Draft...
          </span>
        </div>
      }
    >
      <DraftHubContent />
    </Suspense>
  );
}

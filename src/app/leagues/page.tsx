'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useI18n } from '@/lib/i18n';
import { AppIcon } from '@/components/ui/app-icon';
import {
  ShieldCheck,
  PlusCircle,
  Key,
  Users,
  Trophy,
  Globe,
  Lock,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Copy,
  ShareNetwork,
} from '@phosphor-icons/react';
import { useToast } from '@/components/shared/toast';
import { InviteModal } from '@/components/shared/invite-modal';

function LeaguesDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, lang, isRTL } = useI18n();
  const { toast } = useToast();

  const myLeagues = useQuery(api.leagues.queries.getMyLeagues);
  const [publicFilter, setPublicFilter] = useState<'all' | 'snipe' | 'rank'>('all');
  const publicLeagues = useQuery(api.leagues.queries.getDiscoverablePublicLeagues, {
    gameScope: publicFilter,
  });

  const createLeagueMutation = useMutation(api.leagues.mutations.createLeague);
  const joinPublicMutation = useMutation(api.leagues.mutations.joinPublicLeague);
  const joinByCodeMutation = useMutation(api.leagues.mutations.joinLeagueByCode);

  // Modals state
  const initialCodeParam = searchParams.get('join') || searchParams.get('code') || '';
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinCodeModal, setShowJoinCodeModal] = useState(Boolean(initialCodeParam));
  const [inviteModalData, setInviteModalData] = useState<{ title: string; code: string } | null>(null);


  // Create League form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<'private' | 'public'>('private');
  const [gameScope, setGameScope] = useState<'both' | 'snipe' | 'rank'>('both');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Join Code form state
  const [inviteCode, setInviteCode] = useState(initialCodeParam ? initialCodeParam.trim().toUpperCase() : '');
  const [isJoining, setIsJoining] = useState(false);
  const [copiedLeagueCode, setCopiedLeagueCode] = useState<string | null>(null);

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await createLeagueMutation({
        name: name.trim(),
        description: description.trim() || undefined,
        kind,
        gameScope,
      });
      toast(lang === 'ar' ? 'تم إنشاء الدوري بنجاح!' : 'League created successfully!', 'success');
      setShowCreateModal(false);
      setName('');
      setDescription('');
      router.push(`/leagues/${res.leagueId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create league.';
      toast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsJoining(true);
    try {
      const res = await joinByCodeMutation({ inviteCode: inviteCode.trim().toUpperCase() });
      toast(lang === 'ar' ? 'تم الانضمام للدوري!' : 'Joined league successfully!', 'success');
      setShowJoinCodeModal(false);
      setInviteCode('');
      router.push(`/leagues/${res.leagueId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid invite code.';
      toast(msg, 'error');
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinPublic = async (leagueId: Id<'leagues'>) => {
    try {
      await joinPublicMutation({ leagueId });
      toast(lang === 'ar' ? 'تم الانضمام للدوري!' : 'Joined league!', 'success');
      router.push(`/leagues/${leagueId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error joining league.';
      toast(msg, 'error');
    }
  };

  const handleCopyCardCode = (e: React.MouseEvent, code: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedLeagueCode(code);
    toast(t('leagues.inviteCodeCopied') || 'League code copied!', 'success');
    setTimeout(() => setCopiedLeagueCode(null), 2000);
  };

  const handleOpenInviteModal = (e: React.MouseEvent, leagueName: string, code: string) => {
    e.preventDefault();
    e.stopPropagation();
    setInviteModalData({ title: leagueName, code });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <Link
        href="/"
        className="btn-haptic mb-5 inline-flex items-center gap-2 text-sm text-steel hover:text-white transition-colors cursor-pointer"
      >
        <AppIcon icon={ArrowLeft} size={16} weight="bold" className={isRTL ? 'rotate-180' : ''} />
        <span>{t('common.back')}</span>
      </Link>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime/15 border-2 border-lime/50 text-lime font-bold shadow-glow-lime">
              <AppIcon icon={ShieldCheck} size={26} weight="bold" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white font-stats">
                {t('leagues.title')}
              </h1>
              <p className="text-xs text-steel mt-0.5">
                {lang === 'ar'
                  ? 'دوريات تكتيكية بأسلوب FPL مع نقاط الفوز 3-1-0 وجدول ترتيب لحظي'
                  : 'FPL-style tactical leagues with 3-1-0 points and reactive live standings'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowJoinCodeModal(true)}
              className="btn-haptic flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:border-lime/40 transition-all font-stats cursor-pointer"
            >
              <AppIcon icon={Key} size={15} weight="bold" />
              <span>{t('leagues.joinWithCode')}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn-haptic flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-2xl bg-lime px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-lime/90 transition-all shadow-glow-lime font-stats cursor-pointer"
            >
              <AppIcon icon={PlusCircle} size={16} weight="bold" />
              <span>{t('leagues.createLeague')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: My Leagues */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AppIcon icon={Trophy} size={18} weight="bold" className="text-lime" />
            <h2 className="text-sm font-bold text-white font-stats uppercase tracking-wider">
              {t('leagues.myLeagues')}
            </h2>
          </div>
        </div>

        {myLeagues && myLeagues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {myLeagues.map((league) => (
              <Link
                key={league.leagueId}
                href={`/leagues/${league.leagueId}`}
                className="group flex flex-col justify-between rounded-3xl border border-white/10 bg-slate-900/80 p-5 hover:border-lime/50 hover:bg-slate-900 transition-all shadow-lg backdrop-blur-xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-0.5 text-[10px] font-bold text-steel uppercase font-stats">
                      {league.kind === 'private' ? (
                        <AppIcon icon={Lock} size={11} weight="bold" />
                      ) : (
                        <AppIcon icon={Globe} size={11} weight="bold" />
                      )}
                      <span>{league.kind}</span>
                    </span>

                    <span className="rounded-lg bg-lime/10 px-2 py-0.5 text-[10px] font-bold text-lime uppercase font-stats">
                      {league.gameScope === 'both' ? 'Snipe & Rank' : league.gameScope}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white font-stats group-hover:text-lime transition-colors">
                    {league.name}
                  </h3>
                  {league.description && (
                    <p className="text-xs text-steel line-clamp-2 mt-1">
                      {league.description}
                    </p>
                  )}

                  {/* League Code Quick Badge */}
                  {league.inviteCode && (
                    <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-white/[0.04] border border-white/[0.08] px-3 py-1.5">
                      <div className="flex items-center gap-1.5 font-stats text-xs font-bold text-steel">
                        <span>{lang === 'ar' ? 'الكود:' : 'Code:'}</span>
                        <span className="text-lime tracking-wider">{league.inviteCode}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleCopyCardCode(e, league.inviteCode!)}
                          className="btn-haptic flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 hover:bg-lime/20 text-steel hover:text-lime transition-colors cursor-pointer"
                          title="Copy Code"
                        >
                          <AppIcon icon={copiedLeagueCode === league.inviteCode ? Check : Copy} size={13} weight="bold" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenInviteModal(e, league.name, league.inviteCode!)}
                          className="btn-haptic flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 hover:bg-lime/20 text-steel hover:text-lime transition-colors cursor-pointer"
                          title="Direct Invite Friends"
                        >
                          <AppIcon icon={ShareNetwork} size={13} weight="bold" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3 font-stats text-xs">
                    <div>
                      <span className="text-steel">{t('leagues.rank')}: </span>
                      <span className="font-bold text-white">#{league.myRank}</span>
                    </div>
                    <div>
                      <span className="text-steel">{t('leagues.pts')}: </span>
                      <span className="font-bold text-lime">{league.myPoints}</span>
                    </div>
                  </div>

                  <span className="flex items-center gap-1 text-xs text-steel font-stats group-hover:text-white">
                    <Users size={13} weight="bold" />
                    <span>{league.memberCount}/{league.maxMembers}</span>
                    <AppIcon icon={ArrowRight} size={12} weight="bold" className={isRTL ? 'rotate-180' : ''} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/[0.06] bg-slate-900/40 p-8 text-center text-xs text-steel backdrop-blur-xl">
            <AppIcon icon={ShieldCheck} size={36} weight="bold" className="mx-auto mb-2 text-steel/40" />
            <p>{t('leagues.noLeagues')}</p>
          </div>
        )}
      </div>

      {/* Section 2: Discover Public Leagues */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <AppIcon icon={Globe} size={18} weight="bold" className="text-lime" />
            <h2 className="text-sm font-bold text-white font-stats uppercase tracking-wider">
              {t('leagues.publicLeagues')}
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 rounded-2xl bg-slate-900/90 border border-white/10 p-1">
            {(['all', 'snipe', 'rank'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setPublicFilter(filter)}
                className={`btn-haptic rounded-xl px-3 py-1 text-[11px] font-bold font-stats uppercase transition-all cursor-pointer ${
                  publicFilter === filter
                    ? 'bg-lime text-slate-950 shadow-glow-lime'
                    : 'text-steel hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {publicLeagues && publicLeagues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {publicLeagues.map((league) => (
              <div
                key={league._id}
                className="flex flex-col justify-between rounded-3xl border border-white/10 bg-slate-900/70 p-5 hover:border-white/20 transition-all shadow-lg backdrop-blur-xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="rounded-lg bg-lime/10 px-2 py-0.5 text-[10px] font-bold text-lime uppercase font-stats">
                      {league.gameScope}
                    </span>
                    <span className="text-[11px] text-steel font-stats font-bold">
                      {league.memberCount}/{league.maxMembers}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white font-stats">
                    {league.name}
                  </h3>
                  {league.description && (
                    <p className="text-xs text-steel line-clamp-2 mt-1">
                      {league.description}
                    </p>
                  )}

                  {league.inviteCode && (
                    <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-white/[0.03] border border-white/[0.06] px-2.5 py-1">
                      <span className="text-[11px] font-stats text-steel">
                        {lang === 'ar' ? 'الكود:' : 'Code:'} <strong className="text-lime tracking-wider">{league.inviteCode}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyCardCode(e, league.inviteCode!)}
                        className="btn-haptic text-[10px] text-steel hover:text-white font-stats cursor-pointer"
                      >
                        {copiedLeagueCode === league.inviteCode ? t('common.copied') : t('common.copy')}
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs text-steel font-stats truncate max-w-[140px]">
                    by {league.ownerName}
                  </span>

                  {league.isMember ? (
                    <Link
                      href={`/leagues/${league._id}`}
                      className="btn-haptic flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 font-stats"
                    >
                      <span>{lang === 'ar' ? 'عرض' : 'View'}</span>
                      <AppIcon icon={ArrowRight} size={12} weight="bold" className={isRTL ? 'rotate-180' : ''} />
                    </Link>
                  ) : league.isFull ? (
                    <span className="text-xs text-rose-400 font-stats font-semibold">
                      {t('leagues.fullLeague')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleJoinPublic(league._id)}
                      className="btn-haptic flex items-center gap-1 rounded-xl bg-lime px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-lime/90 shadow-glow-lime font-stats cursor-pointer"
                    >
                      <AppIcon icon={Check} size={13} weight="bold" />
                      <span>{t('leagues.join')}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/[0.06] bg-slate-900/40 p-8 text-center text-xs text-steel backdrop-blur-xl">
            <p>{t('leagues.noPublicLeagues')}</p>
          </div>
        )}
      </div>

      {/* Modal: Create League */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-white/12 bg-slate-950 p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.9)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-5">
              <h2 className="text-lg font-bold text-white font-stats">
                {t('leagues.create')}
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn-haptic flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-steel hover:text-white cursor-pointer"
              >
                <AppIcon icon={X} size={15} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleCreateLeague} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-steel font-stats uppercase">
                  {t('leagues.leagueName')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={32}
                  required
                  placeholder="e.g. Champions League 2026"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-white placeholder-steel/50 focus:border-lime focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-steel font-stats uppercase">
                  {t('leagues.description')}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={120}
                  placeholder="Optional league tagline..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-white placeholder-steel/50 focus:border-lime focus:outline-none"
                />
              </div>

              {/* Game Scope Selection */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-steel font-stats uppercase">
                  {t('leagues.gameScope')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'both' as const, label: t('leagues.allGames') },
                    { id: 'snipe' as const, label: t('leagues.snipeOnly') },
                    { id: 'rank' as const, label: t('leagues.rankOnly') },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGameScope(item.id)}
                      className={`btn-haptic rounded-xl border p-2.5 text-center text-xs font-bold font-stats transition-all cursor-pointer ${
                        gameScope === item.id
                          ? 'border-lime bg-lime/15 text-lime shadow-glow-lime'
                          : 'border-white/10 bg-slate-900 text-steel hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy / Kind Selection */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-steel font-stats uppercase">
                  {t('leagues.kind')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'private' as const, label: t('leagues.private'), icon: Lock },
                    { id: 'public' as const, label: t('leagues.public'), icon: Globe },
                  ].map((item) => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setKind(item.id)}
                        className={`btn-haptic flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-center text-xs font-bold font-stats transition-all cursor-pointer ${
                          kind === item.id
                            ? 'border-lime bg-lime/15 text-lime shadow-glow-lime'
                            : 'border-white/10 bg-slate-900 text-steel hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <AppIcon icon={IconComp} size={14} weight="bold" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}

                </div>
                <p className="mt-1.5 text-[11px] text-steel">
                  {t('leagues.maxCapNote')}
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-haptic flex w-full items-center justify-center gap-2 rounded-2xl bg-lime py-3.5 text-sm font-bold text-slate-950 hover:bg-lime/90 shadow-glow-lime disabled:opacity-50 font-stats cursor-pointer"
                >
                  <AppIcon icon={PlusCircle} size={18} weight="bold" />
                  <span>{isSubmitting ? 'Creating...' : t('leagues.create')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Join League with Code */}
      {showJoinCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-white/12 bg-slate-950 p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.9)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-5">
              <h2 className="text-lg font-bold text-white font-stats">
                {t('leagues.joinWithCode')}
              </h2>
              <button
                type="button"
                onClick={() => setShowJoinCodeModal(false)}
                className="btn-haptic flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-steel hover:text-white cursor-pointer"
              >
                <AppIcon icon={X} size={15} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleJoinByCode} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-steel font-stats uppercase">
                  {t('leagues.inviteCode')}
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  required
                  placeholder="8-CHARACTER CODE"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3.5 text-center text-lg font-extrabold tracking-widest text-lime font-stats uppercase focus:border-lime focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isJoining || inviteCode.trim().length < 6}
                className="btn-haptic flex w-full items-center justify-center gap-2 rounded-2xl bg-lime py-3.5 text-sm font-bold text-slate-950 hover:bg-lime/90 shadow-glow-lime disabled:opacity-50 font-stats cursor-pointer"
              >
                <AppIcon icon={Key} size={18} weight="bold" />
                <span>{isJoining ? 'Joining...' : t('leagues.join')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Direct Invite Friends Modal */}
      {inviteModalData && (
        <InviteModal
          isOpen={Boolean(inviteModalData)}
          onClose={() => setInviteModalData(null)}
          title={inviteModalData.title}
          code={inviteModalData.code}
          type="league"
        />
      )}
    </div>
  );
}

export default function LeaguesDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime border-t-transparent" />
        </div>
      }
    >
      <LeaguesDashboardContent />
    </Suspense>
  );
}

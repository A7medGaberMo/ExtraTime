'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { useI18n } from '@/lib/i18n';
import { useGuestSession } from '@/hooks/use-guest-session';
import { AppIcon } from '@/components/ui/app-icon';
import {
  Copy,
  Check,
  Sword,
  Trophy,
  SignOut,
  Trash,
  Lock,
  ShareNetwork,
  ArrowLeft,
  Globe,
} from '@phosphor-icons/react';
import { useToast } from '@/components/shared/toast';
import { InviteModal } from '@/components/shared/invite-modal';
import { UserIdentity } from '@/components/ui/user-identity';
import { ModalShell } from '@/components/ui/modal-shell';
import { Button } from '@/components/ui/button';

type StandingsTab = 'combined' | 'snipe' | 'rank';

export default function LeagueDetailPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = use(params);
  const router = useRouter();
  const { t, lang, isRTL } = useI18n();
  const { toast } = useToast();
  const { guestId, sessionToken } = useGuestSession(true);

  const leagueData = useQuery(api.leagues.queries.getLeagueDetails, {
    leagueId: leagueId as Id<'leagues'>,
  });

  const recentMatches = useQuery(api.leagues.queries.getLeagueRecentMatches, {
    leagueId: leagueId as Id<'leagues'>,
  });

  const createSnipeMatch = useMutation(api.leagues.mutations.createLeagueSnipeMatch);
  const createRankDuel = useMutation(api.leagues.mutations.createLeagueRankDuel);
  const leaveLeague = useMutation(api.leagues.mutations.leaveLeague);
  const kickMember = useMutation(api.leagues.mutations.kickMember);
  const sendMatchInviteMutation = useMutation(api.invites.mutations.sendMatchInvite);

  const [activeTab, setActiveTab] = useState<StandingsTab>('combined');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMemberToChallenge, setSelectedMemberToChallenge] = useState<{
    userId: Id<'users'>;
    displayName: string;
    username: string;
  } | null>(null);
  const [challengeMode, setChallengeMode] = useState<'snipe' | 'rank'>('snipe');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [memberToKick, setMemberToKick] = useState<{ userId: Id<'users'>; name: string } | null>(null);

  if (leagueData === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime border-t-transparent" />
      </div>
    );
  }

  if (leagueData === null) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-white font-stats mb-2">
          {lang === 'ar' ? 'الدوري غير موجود' : 'League Not Found'}
        </h1>
        <Link
          href="/leagues"
          className="btn-haptic inline-flex items-center gap-2 rounded-2xl bg-lime px-5 py-2.5 text-xs font-bold text-slate-950 font-stats cursor-pointer"
        >
          <span>{t('leagues.myLeagues')}</span>
        </Link>
      </div>
    );
  }

  const { league, isOwner, isMember, standings } = leagueData;

  const handleCopyCode = () => {
    if (!league.inviteCode) return;
    navigator.clipboard.writeText(league.inviteCode);
    setCopiedCode(true);
    toast(t('leagues.inviteCodeCopied') || 'Invite code copied!', 'success');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleLaunchSnipe = async () => {
    if (!guestId) return;
    setIsLaunching(true);
    try {
      const res = await createSnipeMatch({
        leagueId: league._id,
        hostId: guestId,
        sessionToken: sessionToken || undefined,
        matchSize: 11,
        startingBudget: 100,
        poolMode: 'GLOBAL',
      });
      router.push(`/auction/${res.roomId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create Snipe match.';
      toast(msg, 'error');
      setIsLaunching(false);
    }
  };

  const handleLaunchRank = async () => {
    if (!guestId) return;
    setIsLaunching(true);
    try {
      const res = await createRankDuel({
        leagueId: league._id,
        hostId: guestId,
        sessionToken: sessionToken || undefined,
        roundCount: 5,
      });
      router.push(`/rank/${res.gameId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create Rank duel.';
      toast(msg, 'error');
      setIsLaunching(false);
    }
  };

  const handleStartDirectLeagueChallenge = async () => {
    if (!selectedMemberToChallenge || !guestId || isLaunching) return;
    setIsLaunching(true);
    try {
      if (challengeMode === 'snipe') {
        const res = await createSnipeMatch({
          leagueId: league._id,
          hostId: guestId,
          sessionToken: sessionToken || undefined,
          matchSize: 11,
          startingBudget: 100,
          poolMode: 'GLOBAL',
        });
        sendMatchInviteMutation({
          recipientUserId: selectedMemberToChallenge.userId,
          matchType: 'snipe',
          roomCode: res.code,
          targetId: res.roomId,
        }).catch(() => {});
        setSelectedMemberToChallenge(null);
        toast(
          lang === 'ar'
            ? `تم إرسال دعوة التحدي إلى ${selectedMemberToChallenge.displayName}!`
            : `Challenge invite sent to ${selectedMemberToChallenge.displayName}!`,
          'info',
        );
        router.push(`/auction/${res.roomId}`);
      } else {
        const res = await createRankDuel({
          leagueId: league._id,
          hostId: guestId,
          sessionToken: sessionToken || undefined,
          roundCount: 5,
        });
        sendMatchInviteMutation({
          recipientUserId: selectedMemberToChallenge.userId,
          matchType: 'rank',
          roomCode: res.code,
          targetId: res.gameId,
        }).catch(() => {});
        setSelectedMemberToChallenge(null);
        toast(
          lang === 'ar'
            ? `تم إرسال دعوة التحدي إلى ${selectedMemberToChallenge.displayName}!`
            : `Challenge invite sent to ${selectedMemberToChallenge.displayName}!`,
          'info',
        );
        router.push(`/rank/${res.gameId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to launch match.';
      toast(msg, 'error');
    } finally {
      setIsLaunching(false);
    }
  };

  const handleConfirmLeave = async () => {
    setShowLeaveModal(false);
    try {
      await leaveLeague({ leagueId: league._id });
      toast(lang === 'ar' ? 'تمت مغادرة الدوري.' : 'Left league.', 'info');
      router.push('/leagues');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error leaving league.';
      toast(msg, 'error');
    }
  };

  const handleConfirmKick = async () => {
    if (!memberToKick) return;
    const target = memberToKick;
    setMemberToKick(null);
    try {
      await kickMember({ leagueId: league._id, targetUserId: target.userId });
      toast(lang === 'ar' ? `تم استبعاد ${target.name}.` : `${target.name} removed from league.`, 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error kicking member.';
      toast(msg, 'error');
    }
  };

  // Determine current active standings list
  const currentStandings =
    league.gameScope === 'snipe'
      ? standings.snipe
      : league.gameScope === 'rank'
        ? standings.rank
        : activeTab === 'snipe'
          ? standings.snipe
          : activeTab === 'rank'
            ? standings.rank
            : standings.combined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <Link
        href="/leagues"
        className="btn-haptic mb-5 inline-flex items-center gap-2 text-sm text-steel hover:text-white transition-colors cursor-pointer"
      >
        <AppIcon icon={ArrowLeft} size={16} weight="bold" className={isRTL ? 'rotate-180' : ''} />
        <span>{t('leagues.title')}</span>
      </Link>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-0.5 text-[10px] font-bold text-steel uppercase font-stats">
                {league.kind === 'private' ? <AppIcon icon={Lock} size={11} weight="bold" /> : <AppIcon icon={Globe} size={11} weight="bold" />}
                <span>{league.kind}</span>
              </span>
              <span className="rounded-lg bg-lime/10 px-2 py-0.5 text-[10px] font-bold text-lime uppercase font-stats">
                {league.gameScope === 'both' ? 'Snipe & Rank' : league.gameScope}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-stats">
              {league.name}
            </h1>
            {league.description && (
              <p className="text-xs text-steel mt-1 max-w-xl">
                {league.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-steel font-stats mt-3">
              <span>{t('leagues.members')}: <strong className="text-white">{league.memberCount}/{league.maxMembers}</strong></span>
              <span>•</span>
              <span>{lang === 'ar' ? 'المالك' : 'Owner'}: <strong className="text-lime">{league.ownerName}</strong></span>
            </div>
          </div>

          {/* Right Side: Invite Code & Match Launch Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2.5 w-full md:w-auto shrink-0">
            {league.inviteCode && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="btn-haptic flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-2xl border border-lime/30 bg-lime/10 px-4 py-2.5 text-xs font-bold text-lime hover:bg-lime/20 transition-all font-stats cursor-pointer shadow-glow-lime"
                  title="Copy Invite Code"
                >
                  <AppIcon icon={copiedCode ? Check : Copy} size={15} weight="bold" />
                  <span>{league.inviteCode}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="btn-haptic flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-xs font-bold text-white hover:border-lime/40 transition-all font-stats cursor-pointer"
                  title="Direct Invite Friends"
                >
                  <AppIcon icon={ShareNetwork} size={15} weight="bold" className="text-lime" />
                  <span>{lang === 'ar' ? 'دعوة أصدقاء' : 'Invite'}</span>
                </button>
              </div>
            )}

            {/* Match Launch Buttons for Members */}
            {isMember && (
              <div className="flex items-center gap-2 w-full">
                {(league.gameScope === 'both' || league.gameScope === 'snipe') && (
                  <button
                    type="button"
                    disabled={isLaunching}
                    onClick={handleLaunchSnipe}
                    className="btn-haptic flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-lime px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-lime/90 shadow-glow-lime font-stats disabled:opacity-50 cursor-pointer"
                  >
                    <AppIcon icon={Sword} size={15} weight="bold" />
                    <span>{t('leagues.playSnipe')}</span>
                  </button>
                )}

                {(league.gameScope === 'both' || league.gameScope === 'rank') && (
                  <button
                    type="button"
                    disabled={isLaunching}
                    onClick={handleLaunchRank}
                    className="btn-haptic flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-lime px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-lime/90 shadow-glow-lime font-stats disabled:opacity-50 cursor-pointer"
                  >
                    <AppIcon icon={Trophy} size={15} weight="bold" />
                    <span>{t('leagues.playRank')}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Permanent League Invite & Share Card for All Members */}
      {league.inviteCode && (
        <div className="relative overflow-hidden rounded-3xl border border-lime/30 bg-gradient-to-r from-lime/10 via-slate-950 to-slate-950 p-5 sm:p-6 shadow-xl backdrop-blur-2xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-start">
            <span className="text-[10px] font-black uppercase tracking-widest text-lime font-stats">
              {lang === 'ar' ? 'كود دعوة الدوري (متاح للجميع)' : 'LEAGUE INVITE CODE (SHARE WITH FRIENDS)'}
            </span>
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <span className="font-stats font-black text-2xl sm:text-3xl text-white tracking-[0.2em]">
                {league.inviteCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="btn-haptic flex items-center gap-1.5 rounded-xl bg-lime px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-lime/90 transition-all font-stats shadow-glow-lime cursor-pointer"
              >
                <AppIcon icon={copiedCode ? Check : Copy} size={14} weight="bold" />
                <span>{copiedCode ? t('common.copied') : t('common.copy')}</span>
              </button>
            </div>
            <p className="text-[11px] text-steel">
              {lang === 'ar'
                ? 'انسخ الكود وأرسله لأصدقائك للانضمام فوراً للمنافسة في الدوري'
                : 'Send this code or direct link to invite friends to join this league'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="btn-haptic flex items-center gap-2 rounded-2xl border border-lime/40 bg-lime/15 px-5 py-3 text-xs font-bold text-lime hover:bg-lime/25 transition-all font-stats cursor-pointer shadow-glow-lime"
            >
              <AppIcon icon={ShareNetwork} size={16} weight="bold" />
              <span>{lang === 'ar' ? 'مشاركة رابط الدوري' : 'Share League Link'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Standings Section */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <AppIcon icon={Trophy} size={22} weight="bold" className="text-lime" />
            <h2 className="text-base font-bold text-white font-stats">
              {t('leagues.standings')}
            </h2>
          </div>

          {/* Standings Filter Tabs (if league supports both) */}
          {league.gameScope === 'both' && (
            <div className="flex items-center gap-1 rounded-2xl bg-slate-900/90 border border-white/10 p-1">
              {[
                { id: 'combined', label: t('leagues.allGames') },
                { id: 'snipe', label: 'Snipe' },
                { id: 'rank', label: 'Rank' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as StandingsTab)}
                  className={`btn-haptic rounded-xl px-3.5 py-1 text-xs font-bold font-stats transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-lime text-slate-950 shadow-glow-lime'
                      : 'text-steel hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Standings Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-stats text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-extrabold text-steel uppercase tracking-wider">
                <th className="py-3 px-2 w-12 text-center">{t('leagues.rank')}</th>
                <th className="py-3 px-3">{t('leagues.manager')}</th>
                <th className="py-3 px-2 text-center">P</th>
                <th className="py-3 px-2 text-center">{t('leagues.won')}</th>
                <th className="py-3 px-2 text-center">{t('leagues.drawn')}</th>
                <th className="py-3 px-2 text-center">{t('leagues.lost')}</th>
                <th className="py-3 px-2 text-center">{t('leagues.gd')}</th>
                <th className="py-3 px-3 text-right">{t('leagues.pts')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {currentStandings.map((member, idx) => {
                const rankNum = idx + 1;
                const medal = rankNum === 1 ? '🥇' : rankNum === 2 ? '🥈' : rankNum === 3 ? '🥉' : null;

                const isSnipeTab = league.gameScope === 'snipe' || (league.gameScope === 'both' && activeTab === 'snipe');
                const isRankTab = league.gameScope === 'rank' || (league.gameScope === 'both' && activeTab === 'rank');

                const played = isSnipeTab
                  ? member.snipeStats.played
                  : isRankTab
                    ? member.rankStats.played
                    : member.snipeStats.played + member.rankStats.played;

                const won = isSnipeTab
                  ? member.snipeStats.won
                  : isRankTab
                    ? member.rankStats.won
                    : member.snipeStats.won + member.rankStats.won;

                const drawn = isSnipeTab
                  ? member.snipeStats.drawn
                  : isRankTab
                    ? member.rankStats.drawn
                    : member.snipeStats.drawn + member.rankStats.drawn;

                const lost = isSnipeTab
                  ? member.snipeStats.lost
                  : isRankTab
                    ? member.rankStats.lost
                    : member.snipeStats.lost + member.rankStats.lost;

                const diff = isSnipeTab
                  ? member.snipeStats.goalDiff
                  : isRankTab
                    ? member.rankStats.scoreDiff
                    : member.snipeStats.goalDiff + member.rankStats.scoreDiff;

                const points = isSnipeTab
                  ? member.snipeStats.points
                  : isRankTab
                    ? member.rankStats.points
                    : member.combinedPoints;

                return (
                  <tr
                    key={member.userId}
                    className={`hover:bg-white/[0.02] transition-colors ${
                      member.isSelf ? 'bg-lime/10 border-l-4 border-l-lime font-bold' : ''
                    }`}
                  >
                    <td className="py-3 px-2 text-center font-bold text-sm">
                      {medal || rankNum}
                    </td>

                    <td className="py-3 px-3">
                      <Link
                        href={`/profile/${member.username}`}
                        className="flex items-center gap-2.5 group"
                      >
                        <UserIdentity
                          nickname={member.displayName}
                          avatarSeed={member.avatarSeed}
                          showAvatarOnly
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="truncate font-bold text-white group-hover:text-lime transition-colors">
                            {member.displayName}
                          </div>
                          <div className="truncate text-[10px] text-steel">
                            @{member.username} {member.role === 'owner' && '👑'}
                          </div>
                        </div>
                      </Link>
                    </td>

                    <td className="py-3 px-2 text-center text-steel font-bold">{played}</td>
                    <td className="py-3 px-2 text-center text-emerald-400 font-bold">{won}</td>
                    <td className="py-3 px-2 text-center text-amber-400 font-bold">{drawn}</td>
                    <td className="py-3 px-2 text-center text-rose-400 font-bold">{lost}</td>
                    <td className="py-3 px-2 text-center text-steel font-bold">
                      {diff > 0 ? `+${diff}` : diff}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-lime text-sm">
                      {points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Matches & Member Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Match Log */}
        <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-6 shadow-xl backdrop-blur-2xl">
          <h3 className="text-sm font-bold text-white font-stats uppercase tracking-wider mb-4">
            {t('leagues.matches')}
          </h3>
          {recentMatches && recentMatches.length > 0 ? (
            <div className="space-y-2">
              {recentMatches.map((m) => (
                <div
                  key={m._id}
                  className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-slate-900/60 p-3 text-xs font-stats"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{m.hostName}</span>
                    <span className="font-extrabold text-lime">
                      {m.hostScore ?? 0} - {m.guestScore ?? 0}
                    </span>
                    <span className="font-bold text-white">{m.guestName}</span>
                  </div>
                  <span className="rounded-lg bg-white/5 px-2 py-0.5 text-[9px] font-bold text-steel uppercase">
                    {m.gameType}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-steel">
              {lang === 'ar' ? 'لم تُلعب أي مباريات بعد في هذا الدوري.' : 'No matches played yet in this league.'}
            </div>
          )}
        </div>

        {/* Member List */}
        <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-6 shadow-xl backdrop-blur-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white font-stats uppercase tracking-wider">
              {t('leagues.members')} ({standings.combined.length})
            </h3>
            {isMember && !isOwner && (
              <button
                type="button"
                onClick={() => setShowLeaveModal(true)}
                className="btn-haptic flex items-center gap-1 text-xs text-rose-400 hover:underline font-stats cursor-pointer"
              >
                <AppIcon icon={SignOut} size={13} weight="bold" />
                <span>{t('leagues.leaveLeague')}</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {standings.combined.map((m) => (
              <div
                key={m.userId}
                className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-slate-900/60 p-2.5"
              >
                <Link
                  href={`/profile/${m.username}`}
                  className="flex items-center gap-2 min-w-0 group"
                >
                  <UserIdentity
                    nickname={m.displayName}
                    avatarSeed={m.avatarSeed}
                    showAvatarOnly
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-white group-hover:text-lime font-stats">
                      {m.displayName}
                    </div>
                    <div className="truncate text-[10px] text-steel font-stats">
                      @{m.username} {m.role === 'owner' && '👑'}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!m.isSelf && isMember && (
                    <button
                      type="button"
                      onClick={() => setSelectedMemberToChallenge(m)}
                      className="btn-haptic flex items-center gap-1 rounded-lg border border-lime/30 bg-lime/10 px-2.5 py-1 text-[10px] font-bold text-lime hover:bg-lime/20 transition-all font-stats cursor-pointer shadow-glow-lime"
                      title={lang === 'ar' ? 'تحدي العضو' : 'Challenge Member'}
                    >
                      <AppIcon icon={Sword} size={12} weight="bold" />
                      <span>{lang === 'ar' ? 'تحدي' : 'Challenge'}</span>
                    </button>
                  )}

                  {isOwner && !m.isSelf && (
                    <button
                      type="button"
                      onClick={() => setMemberToKick({ userId: m.userId, name: m.displayName })}
                      className="btn-haptic flex h-7 w-7 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                      title={t('leagues.kick')}
                    >
                      <AppIcon icon={Trash} size={13} weight="bold" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Challenge Member Modal */}
      {selectedMemberToChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-lime/30 bg-slate-900/95 p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-white uppercase font-display">
                {lang === 'ar' ? 'تحدي عضو في الدوري' : 'Challenge League Member'}
              </h3>
              <p className="text-xs text-steel">
                {lang === 'ar'
                  ? `أرسل دعوة مواجهة فورية إلى ${selectedMemberToChallenge.displayName}`
                  : `Send an instant match challenge to ${selectedMemberToChallenge.displayName}`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setChallengeMode('snipe')}
                className={`btn-haptic flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3.5 transition-all cursor-pointer font-stats ${
                  challengeMode === 'snipe'
                    ? 'border-lime bg-lime/15 text-white ring-1 ring-lime shadow-glow-lime'
                    : 'border-white/10 bg-slate-950/60 text-steel hover:text-white'
                }`}
              >
                <AppIcon icon={Sword} size={20} weight="bold" className="text-lime" />
                <span className="text-xs font-bold">Snipe Auction</span>
                <span className="text-[10px] text-steel">11v11 Match</span>
              </button>

              <button
                type="button"
                onClick={() => setChallengeMode('rank')}
                className={`btn-haptic flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3.5 transition-all cursor-pointer font-stats ${
                  challengeMode === 'rank'
                    ? 'border-lime bg-lime/15 text-white ring-1 ring-lime shadow-glow-lime'
                    : 'border-white/10 bg-slate-950/60 text-steel hover:text-white'
                }`}
              >
                <AppIcon icon={Trophy} size={20} weight="bold" className="text-amber-400" />
                <span className="text-xs font-bold">Rank 1v1</span>
                <span className="text-[10px] text-steel">5 Rounds</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedMemberToChallenge(null)}
                className="btn-haptic flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-steel hover:text-white transition-all font-stats cursor-pointer"
              >
                {t('common.cancel')}
              </button>

              <button
                type="button"
                disabled={isLaunching}
                onClick={handleStartDirectLeagueChallenge}
                className="btn-haptic flex-1 rounded-xl bg-lime py-2.5 text-xs font-bold text-slate-950 hover:bg-lime/90 transition-all font-stats shadow-glow-lime disabled:opacity-50 cursor-pointer"
              >
                {isLaunching ? (lang === 'ar' ? 'جارٍ البدء...' : 'Starting...') : (lang === 'ar' ? 'إرسال التحدي' : 'Send Challenge')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Invite Modal */}
      {showInviteModal && league.inviteCode && (
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title={league.name}
          code={league.inviteCode}
          type="league"
        />
      )}

      {/* Leave League Confirmation Modal */}
      {showLeaveModal && (
        <ModalShell
          isOpen={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          title={lang === 'ar' ? 'مغادرة الدوري' : 'Leave League'}
          subtitle={
            lang === 'ar'
              ? 'هل أنت متأكد من رغبتك في مغادرة هذا الدوري؟ سيتم حذف نتائجك وتاريخ مبارياتك في هذا الدوري.'
              : 'Are you sure you want to leave this league? Your standing and matches in this league will be removed.'
          }
          maxWidth="sm"
        >
          <div className="flex items-center gap-2.5 pt-2">
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={() => setShowLeaveModal(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              size="md"
              fullWidth
              onClick={handleConfirmLeave}
            >
              {lang === 'ar' ? 'مغادرة الدوري' : 'Leave League'}
            </Button>
          </div>
        </ModalShell>
      )}

      {/* Kick Member Confirmation Modal */}
      {memberToKick && (
        <ModalShell
          isOpen={Boolean(memberToKick)}
          onClose={() => setMemberToKick(null)}
          title={lang === 'ar' ? 'استبعاد عضو من الدوري' : 'Kick Member'}
          subtitle={
            lang === 'ar'
              ? `هل أنت متأكد من استبعاد اللاعب "${memberToKick.name}" من هذا الدوري؟`
              : `Are you sure you want to remove "${memberToKick.name}" from this league?`
          }
          maxWidth="sm"
        >
          <div className="flex items-center gap-2.5 pt-2">
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={() => setMemberToKick(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              size="md"
              fullWidth
              onClick={handleConfirmKick}
            >
              {lang === 'ar' ? 'استبعاد' : 'Kick Member'}
            </Button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

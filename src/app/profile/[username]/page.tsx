'use client';

import React, { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useI18n } from '@/lib/i18n';
import { AppIcon } from '@/components/ui/app-icon';
import {
  Trophy,
  Calendar,
  UserPlus,
  Check,
  Clock,
  Sword,
  GearSix,
  ArrowLeft,
  Flame,
  Target,
} from '@phosphor-icons/react';
import { useToast } from '@/components/shared/toast';
import { parseAvatarSeed, getMonogramInitial } from '@/lib/avatars';

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { t, lang, isRTL } = useI18n();
  const { toast } = useToast();

  const userProfile = useQuery(api.users.queries.getByUsername, { username });
  const viewer = useQuery(api.users.queries.viewer);

  const stats = useQuery(
    api.history.queries.getUserCareerStats,
    userProfile ? { userId: userProfile._id } : 'skip',
  );

  const history = useQuery(
    api.history.queries.getUserMatchHistory,
    userProfile ? { userId: userProfile._id, limit: 15 } : 'skip',
  );

  const relationship = useQuery(
    api.friends.queries.getRelationshipStatus,
    userProfile ? { targetUserId: userProfile._id } : 'skip',
  );

  const sendFriendRequest = useMutation(api.friends.mutations.sendRequest);

  const handleSendFriend = async () => {
    if (!userProfile) return;
    try {
      await sendFriendRequest({ addresseeId: userProfile._id });
      toast(t('friends.requestSent') || 'Friend request sent!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send request.';
      toast(msg, 'error');
    }
  };

  if (userProfile === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime border-t-transparent" />
      </div>
    );
  }

  if (userProfile === null) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-steel">
          <AppIcon icon={Trophy} size={32} weight="bold" />
        </div>
        <h1 className="text-xl font-bold text-white font-stats mb-2">
          {lang === 'ar' ? 'اللاعب غير موجود' : 'Player Not Found'}
        </h1>
        <p className="text-xs text-steel mb-6">
          {lang === 'ar'
            ? 'لم يتم العثور على لاعب بهذا الاسم.'
            : 'No ExtraTime manager found with that username.'}
        </p>
        <Link
          href="/"
          className="btn-haptic inline-flex items-center gap-2 rounded-2xl bg-lime px-5 py-2.5 text-xs font-bold text-slate-950 font-stats"
        >
          <span>{t('nav.arena')}</span>
        </Link>
      </div>
    );
  }

  const isSelf = viewer && viewer._id === userProfile._id;
  const joinedFormatted = new Date(userProfile.createdAt).toLocaleDateString(
    lang === 'ar' ? 'ar-EG' : 'en-US',
    { month: 'short', year: 'numeric' },
  );
  const parsedAvatar = parseAvatarSeed(userProfile.avatarSeed);
  const avatarMeta = parsedAvatar.meta;
  const monogram = getMonogramInitial(userProfile.displayName, 2);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      {/* Back Button */}
      <Link
        href="/"
        className="btn-haptic mb-5 inline-flex items-center gap-2 text-sm text-steel hover:text-white transition-colors cursor-pointer"
      >
        <AppIcon icon={ArrowLeft} size={16} weight="bold" className={isRTL ? 'rotate-180' : ''} />
        <span>{t('common.back')}</span>
      </Link>

      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            {/* Avatar Seed Monogram or Club Logo */}
            <div
              className={`relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br ${avatarMeta.gradient} border ${avatarMeta.border} font-black text-xl sm:text-2xl font-stats ${avatarMeta.text} ${avatarMeta.glow} shadow-lg transition-all p-2`}
            >
              {parsedAvatar.isClub && parsedAvatar.clubLogoUrl ? (
                <div className="relative h-full w-full flex items-center justify-center">
                  <Image
                    src={parsedAvatar.clubLogoUrl}
                    alt={parsedAvatar.clubName || 'Club'}
                    width={56}
                    height={56}
                    className="max-h-full max-w-full object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <span>{monogram}</span>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl sm:text-2xl font-extrabold text-white font-stats">
                {userProfile.displayName}
              </h1>
              <div className="flex items-center gap-2 text-xs text-steel font-stats mt-1">
                <span className="text-lime font-bold">@{userProfile.username}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <AppIcon icon={Calendar} size={12} weight="bold" />
                  <span>{t('profile.joinedDate')} {joinedFormatted}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="shrink-0 w-full sm:w-auto">
            {isSelf ? (
              <Link
                href="/settings/profile"
                className="btn-haptic flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:border-lime/40 transition-colors font-stats"
              >
                <AppIcon icon={GearSix} size={16} weight="bold" />
                <span>{t('profile.editProfile')}</span>
              </Link>
            ) : viewer ? (
              relationship?.status === 'friends' ? (
                <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-lime/15 border border-lime/40 px-4 py-2.5 text-xs font-bold text-lime font-stats">
                  <AppIcon icon={Check} size={16} weight="bold" />
                  <span>{t('friends.alreadyFriends')}</span>
                </div>
              ) : relationship?.status === 'pending_outgoing' ? (
                <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-bold text-steel font-stats">
                  <AppIcon icon={Clock} size={16} weight="bold" />
                  <span>{t('friends.requests')}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSendFriend}
                  className="btn-haptic flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-lime px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-lime/90 transition-all shadow-glow-lime font-stats cursor-pointer"
                >
                  <AppIcon icon={UserPlus} size={16} weight="bold" />
                  <span>{t('friends.sendRequest')}</span>
                </button>
              )
            ) : null}
          </div>
        </div>
      </div>

      {/* Apple Career Stats Grid */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-steel font-stats uppercase tracking-wider mb-1">
            <span>{t('profile.matchesPlayed')}</span>
            <AppIcon icon={Target} size={14} weight="bold" className="text-steel/60" />
          </div>
          <div className="text-2xl font-extrabold text-white font-stats">
            {stats?.totalMatches ?? 0}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-steel font-stats uppercase tracking-wider mb-1">
            <span>{t('profile.wins')}</span>
            <AppIcon icon={Flame} size={14} weight="bold" className="text-lime" />
          </div>
          <div className="text-2xl font-extrabold text-lime font-stats">
            {stats?.totalWins ?? 0}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-steel font-stats uppercase tracking-wider mb-1">
            <span>Snipe WR</span>
            <AppIcon icon={Sword} size={14} weight="bold" className="text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-stats">
            {stats?.snipe.winRate ?? 0}%
          </div>
          <div className="text-[10px] text-steel font-stats mt-0.5">
            {stats?.snipe.won ?? 0}W - {stats?.snipe.drawn ?? 0}D - {stats?.snipe.lost ?? 0}L
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-steel font-stats uppercase tracking-wider mb-1">
            <span>Rank WR</span>
            <AppIcon icon={Trophy} size={14} weight="bold" className="text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-stats">
            {stats?.rank.winRate ?? 0}%
          </div>
          <div className="text-[10px] text-steel font-stats mt-0.5">
            {stats?.rank.won ?? 0}W - {stats?.rank.drawn ?? 0}D - {stats?.rank.lost ?? 0}L
          </div>
        </div>
      </div>

      {/* Match History Section (Only visible for profile owner) */}
      {isSelf && (
        <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-4 mb-5">
            <AppIcon icon={Sword} size={18} weight="bold" className="text-lime" />
            <h2 className="text-base font-bold text-white font-stats">
              {t('profile.recentMatches')}
            </h2>
          </div>

          {history && history.length > 0 ? (
            <div className="space-y-2.5">
              {history.map((match) => {
                const matchDate = new Date(match.completedAt).toLocaleDateString(
                  lang === 'ar' ? 'ar-EG' : 'en-US',
                  { month: 'short', day: 'numeric' },
                );

                return (
                  <div
                    key={match._id}
                    className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-slate-900/70 p-3.5 hover:border-white/15 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-stats text-xs font-bold ${
                          match.won
                            ? 'bg-lime/15 text-lime border border-lime/30'
                            : match.isDraw
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {match.won ? 'W' : match.isDraw ? 'D' : 'L'}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs font-bold text-white">
                            vs {match.opponentName}
                          </span>
                          <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-steel uppercase font-stats">
                            {match.gameType}
                          </span>
                          {match.context === 'league' && (
                            <span className="rounded-md bg-lime/10 text-lime px-1.5 py-0.5 text-[9px] font-bold uppercase font-stats">
                              League
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-steel font-stats mt-0.5">
                          {matchDate}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-stats text-sm font-extrabold text-white">
                        {match.myScore} - {match.opponentScore}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-steel">
              {t('profile.noMatches')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

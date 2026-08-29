'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useI18n } from '@/lib/i18n';
import { AppIcon } from '@/components/ui/app-icon';
import {
  Users,
  UserPlus,
  Clock,
  MagnifyingGlass,
  Check,
  X,
  Trash,
  Prohibit,
  Sword,
  ArrowLeft,
  Trophy,
  Crosshair,
  CircleNotch,
} from '@phosphor-icons/react';
import { useToast } from '@/components/shared/toast';
import { UserIdentity } from '@/components/ui/user-identity';
import { InviteModal } from '@/components/shared/invite-modal';
import { useGuestSession } from '@/hooks/use-guest-session';

type Tab = 'friends' | 'requests' | 'search';

export default function FriendsPage() {
  const router = useRouter();
  const { t, lang, isRTL } = useI18n();
  const { toast } = useToast();
  const { ensureGuestId } = useGuestSession();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [searchQuery, setSearchQuery] = useState('');

  const friends = useQuery(api.friends.queries.listFriends);
  const incomingRequests = useQuery(api.friends.queries.listIncomingRequests);
  const outgoingRequests = useQuery(api.friends.queries.listOutgoingRequests);
  const viewer = useQuery(api.users.queries.viewer);

  const searchResults = useQuery(
    api.users.queries.search,
    searchQuery.trim().length >= 2 ? { query: searchQuery.trim() } : 'skip',
  );

  const acceptRequest = useMutation(api.friends.mutations.acceptRequest);
  const declineRequest = useMutation(api.friends.mutations.declineRequest);
  const removeFriend = useMutation(api.friends.mutations.removeFriend);
  const sendRequest = useMutation(api.friends.mutations.sendRequest);
  const blockUser = useMutation(api.friends.mutations.blockUser);

  // Match mutations
  const createSnipeRoom = useMutation(api.rooms.mutations.create);
  const createRankDuel = useMutation(api.rank.mutations.createDuelPrivateRoom);
  const sendMatchInviteMutation = useMutation(api.invites.mutations.sendMatchInvite);

  // Challenge modal state
  const [selectedFriendToChallenge, setSelectedFriendToChallenge] = useState<{
    userId: string;
    displayName: string;
    username: string;
  } | null>(null);
  const [challengeMode, setChallengeMode] = useState<'snipe' | 'rank'>('snipe');
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [inviteModalData, setInviteModalData] = useState<{
    title: string;
    code: string;
    type: 'room' | 'duel';
  } | null>(null);

  const handleAccept = async (friendshipId: Id<'friendships'>) => {
    try {
      await acceptRequest({ friendshipId });
      toast(lang === 'ar' ? 'تم قبول طلب الصداقة!' : 'Friend request accepted!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error accepting request.';
      toast(msg, 'error');
    }
  };

  const handleDecline = async (friendshipId: Id<'friendships'>) => {
    try {
      await declineRequest({ friendshipId });
      toast(lang === 'ar' ? 'تم رفض الطلب.' : 'Request declined.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error declining request.';
      toast(msg, 'error');
    }
  };

  const handleRemove = async (friendUserId: Id<'users'>) => {
    try {
      await removeFriend({ friendUserId });
      toast(t('friends.friendRemoved') || 'Friend removed.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error removing friend.';
      toast(msg, 'error');
    }
  };

  const handleSend = async (addresseeId: Id<'users'>) => {
    try {
      await sendRequest({ addresseeId });
      toast(t('friends.requestSent') || 'Friend request sent!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending request.';
      toast(msg, 'error');
    }
  };

  const handleBlock = async (targetUserId: Id<'users'>) => {
    try {
      await blockUser({ targetUserId });
      toast(lang === 'ar' ? 'تم حظر اللاعب.' : 'Player blocked.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error blocking player.';
      toast(msg, 'error');
    }
  };

  const handleStartChallenge = async () => {
    if (!selectedFriendToChallenge || isCreatingChallenge) return;
    setIsCreatingChallenge(true);

    try {
      const activeName = viewer?.displayName || viewer?.username || 'Manager';
      const guestId = await ensureGuestId(activeName);
      const sessionToken = localStorage.getItem('extratime_sessionToken') || undefined;

      if (challengeMode === 'snipe') {
        const res = await createSnipeRoom({
          hostId: guestId,
          sessionToken,
          matchSize: 11,
          startingBudget: 100,
          isPublic: false,
          poolMode: 'ACTIVE',
        });
        // Send real-time popup challenge to recipient
        sendMatchInviteMutation({
          recipientUserId: selectedFriendToChallenge.userId as Id<'users'>,
          matchType: 'snipe',
          roomCode: res.code,
          targetId: res.roomId,
        }).catch(() => {});

        setSelectedFriendToChallenge(null);
        toast(
          lang === 'ar'
            ? `تم إرسال التحدي إلى ${selectedFriendToChallenge.displayName}! في انتظار قبوله...`
            : `Challenge sent to ${selectedFriendToChallenge.displayName}! Waiting to connect...`,
          'info',
        );
        router.push(`/room/${res.roomId}`);
      } else {
        const res = await createRankDuel({
          hostId: guestId,
          sessionToken,
          roundCount: 3,
        });
        // Send real-time popup challenge to recipient
        sendMatchInviteMutation({
          recipientUserId: selectedFriendToChallenge.userId as Id<'users'>,
          matchType: 'rank',
          roomCode: res.code,
          targetId: res.gameId,
        }).catch(() => {});

        setSelectedFriendToChallenge(null);
        toast(
          lang === 'ar'
            ? `تم إرسال التحدي إلى ${selectedFriendToChallenge.displayName}! في انتظار قبوله...`
            : `Challenge sent to ${selectedFriendToChallenge.displayName}! Waiting to connect...`,
          'info',
        );
        router.push(`/rank/${res.gameId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to launch challenge.';
      toast(msg, 'error');
    } finally {
      setIsCreatingChallenge(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <Link
        href="/"
        className="btn-haptic mb-5 inline-flex items-center gap-2 text-sm text-steel hover:text-white transition-colors cursor-pointer"
      >
        <AppIcon icon={ArrowLeft} size={16} weight="bold" className={isRTL ? 'rotate-180' : ''} />
        <span>{t('common.back')}</span>
      </Link>

      <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime/10 border border-lime/30 text-lime shadow-glow-lime">
              <AppIcon icon={Users} size={22} weight="bold" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white font-stats">
                {t('friends.title')}
              </h1>
              <p className="text-xs text-steel mt-0.5">
                {lang === 'ar'
                  ? 'تواصل وتحدى أصدقاءك في المزايدات ومواجهات الرانك مع مؤشر اللاعبين المتصلين'
                  : 'Connect & challenge friends in Snipe Auctions and Rank Duels with live presence'}
              </p>
            </div>
          </div>
        </div>

        {/* Apple Segmented Control */}
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-900/90 border border-white/10 p-1 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('friends')}
            className={`btn-haptic flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold font-stats transition-all cursor-pointer ${
              activeTab === 'friends'
                ? 'bg-lime text-slate-950 shadow-glow-lime'
                : 'text-steel hover:text-white'
            }`}
          >
            <AppIcon icon={Users} size={15} weight="bold" />
            <span>{t('friends.myFriends')}</span>
            {friends && friends.length > 0 && (
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${activeTab === 'friends' ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-white'}`}>
                {friends.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`btn-haptic flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold font-stats transition-all cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-lime text-slate-950 shadow-glow-lime'
                : 'text-steel hover:text-white'
            }`}
          >
            <AppIcon icon={Clock} size={15} weight="bold" />
            <span>{t('friends.requests')}</span>
            {incomingRequests && incomingRequests.length > 0 && (
              <span className="rounded-full bg-rose-500 text-white px-1.5 py-0.2 text-[10px] font-bold">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`btn-haptic flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold font-stats transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'bg-lime text-slate-950 shadow-glow-lime'
                : 'text-steel hover:text-white'
            }`}
          >
            <AppIcon icon={UserPlus} size={15} weight="bold" />
            <span>{t('friends.findFriends')}</span>
          </button>
        </div>

        {/* Tab 1: My Friends */}
        {activeTab === 'friends' && (
          <div>
            {friends && friends.length > 0 ? (
              <div className="space-y-2.5">
                {friends.map((friend) => (
                  <div
                    key={friend.friendshipId}
                    className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-slate-900/60 p-3.5 hover:border-white/15 transition-all"
                  >
                    <Link
                      href={`/profile/${friend.username}`}
                      className="flex items-center gap-3 min-w-0 group"
                    >
                      <div className="relative">
                        <UserIdentity
                          nickname={friend.displayName}
                          avatarSeed={friend.avatarSeed}
                          showAvatarOnly
                          size="md"
                        />
                        {/* Live Active Presence Dot */}
                        <div
                          className={`absolute -bottom-0.5 -end-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 ${
                            friend.isOnline
                              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                              : 'bg-slate-600'
                          }`}
                          title={friend.isOnline ? 'Online now' : 'Offline'}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs font-bold text-white group-hover:text-lime transition-colors font-stats">
                            {friend.displayName}
                          </span>
                          {friend.isOnline && (
                            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400 font-stats uppercase">
                              {lang === 'ar' ? 'متصل' : 'ONLINE'}
                            </span>
                          )}
                        </div>
                        <div className="truncate text-[10px] text-steel font-stats">
                          @{friend.username}
                        </div>
                      </div>
                    </Link>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFriendToChallenge({
                            userId: friend.userId,
                            displayName: friend.displayName,
                            username: friend.username,
                          })
                        }
                        className="btn-haptic flex items-center gap-1.5 rounded-xl bg-lime/15 border border-lime/30 px-3.5 py-1.5 text-xs font-bold text-lime hover:bg-lime/25 transition-all font-stats cursor-pointer shadow-glow-lime"
                      >
                        <AppIcon icon={Sword} size={14} weight="bold" />
                        <span>{t('friends.challenge')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemove(friend.userId)}
                        className="btn-haptic flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-steel hover:text-rose-400 hover:border-rose-500/30 transition-colors cursor-pointer"
                        title={t('friends.remove')}
                      >
                        <AppIcon icon={Trash} size={14} weight="bold" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBlock(friend.userId)}
                        className="btn-haptic flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-steel hover:text-rose-400 hover:border-rose-500/30 transition-colors cursor-pointer"
                        title={t('friends.block')}
                      >
                        <AppIcon icon={Prohibit} size={14} weight="bold" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-steel">
                <AppIcon icon={Users} size={36} weight="bold" className="mx-auto mb-2 text-steel/40" />
                <p>{t('friends.noFriends')}</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('search')}
                  className="btn-haptic mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-lime hover:underline font-stats cursor-pointer"
                >
                  <AppIcon icon={UserPlus} size={14} weight="bold" />
                  <span>{t('friends.findFriends')}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Incoming Requests */}
            <div>
              <h2 className="text-xs font-bold text-steel font-stats uppercase tracking-wider mb-3">
                {lang === 'ar' ? 'الطلبات الواردة' : 'Incoming Requests'} ({incomingRequests?.length ?? 0})
              </h2>
              {incomingRequests && incomingRequests.length > 0 ? (
                <div className="space-y-2">
                  {incomingRequests.map((req) => (
                    <div
                      key={req.friendshipId}
                      className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-slate-900/60 p-3"
                    >
                      <Link
                        href={`/profile/${req.username}`}
                        className="flex items-center gap-2.5 min-w-0 group"
                      >
                        <UserIdentity
                          nickname={req.displayName}
                          avatarSeed={req.avatarSeed}
                          showAvatarOnly
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-white group-hover:text-lime transition-colors font-stats">
                            {req.displayName}
                          </div>
                          <div className="truncate text-[10px] text-steel font-stats">
                            @{req.username}
                          </div>
                        </div>
                      </Link>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAccept(req.friendshipId)}
                          className="btn-haptic flex items-center gap-1 rounded-xl bg-lime px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-lime/90 shadow-glow-lime transition-colors font-stats cursor-pointer"
                        >
                          <AppIcon icon={Check} size={14} weight="bold" />
                          <span>{t('friends.accept')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecline(req.friendshipId)}
                          className="btn-haptic flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-steel hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <AppIcon icon={X} size={14} weight="bold" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.04] bg-slate-900/30 p-4 text-center text-xs text-steel">
                  {t('friends.noRequests')}
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            <div>
              <h2 className="text-xs font-bold text-steel font-stats uppercase tracking-wider mb-3">
                {lang === 'ar' ? 'الطلبات المرسلة' : 'Sent Requests'} ({outgoingRequests?.length ?? 0})
              </h2>
              {outgoingRequests && outgoingRequests.length > 0 ? (
                <div className="space-y-2">
                  {outgoingRequests.map((req) => (
                    <div
                      key={req.friendshipId}
                      className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-slate-900/60 p-3"
                    >
                      <Link
                        href={`/profile/${req.username}`}
                        className="flex items-center gap-2.5 min-w-0 group"
                      >
                        <UserIdentity
                          nickname={req.displayName}
                          avatarSeed={req.avatarSeed}
                          showAvatarOnly
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-white group-hover:text-lime transition-colors font-stats">
                            {req.displayName}
                          </div>
                          <div className="truncate text-[10px] text-steel font-stats">
                            @{req.username}
                          </div>
                        </div>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDecline(req.friendshipId)}
                        className="btn-haptic rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-steel hover:text-rose-400 transition-colors font-stats cursor-pointer"
                      >
                        {t('friends.cancelRequest')}
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Tab 3: Find Players */}
        {activeTab === 'search' && (
          <div>
            <div className="relative mb-5">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-steel">
                <AppIcon icon={MagnifyingGlass} size={16} weight="bold" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('friends.searchPlaceholder')}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/90 pl-11 pr-4 py-3 text-sm text-white placeholder-steel/50 focus:border-lime focus:outline-none focus:ring-1 focus:ring-lime font-stats transition-all"
              />
            </div>

            {searchQuery.trim().length >= 2 ? (
              searchResults && searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-slate-900/60 p-3 hover:border-white/15 transition-all"
                    >
                      <Link
                        href={`/profile/${user.username}`}
                        className="flex items-center gap-2.5 min-w-0 group"
                      >
                        <UserIdentity
                          nickname={user.displayName}
                          avatarSeed={user.avatarSeed}
                          showAvatarOnly
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-white group-hover:text-lime transition-colors font-stats">
                            {user.displayName}
                          </div>
                          <div className="truncate text-[10px] text-steel font-stats">
                            @{user.username}
                          </div>
                        </div>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleSend(user._id)}
                        className="btn-haptic flex items-center gap-1 rounded-xl bg-lime px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-lime/90 shadow-glow-lime transition-colors font-stats cursor-pointer"
                      >
                        <AppIcon icon={UserPlus} size={14} weight="bold" />
                        <span>{t('friends.sendRequest')}</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-steel">
                  {t('friends.noSearchResults')}
                </div>
              )
            ) : (
              <div className="py-8 text-center text-xs text-steel">
                {lang === 'ar'
                  ? 'اكتب حرفين على الأقل للبحث عن اللاعبين.'
                  : 'Type at least 2 characters to search for players.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Challenge Friends Mode Selection Modal */}
      {selectedFriendToChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-white/12 bg-slate-950 p-6 sm:p-7 shadow-[0_24px_60px_rgba(0,0,0,0.9)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime/15 text-lime border border-lime/30">
                  <AppIcon icon={Sword} size={18} weight="bold" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-stats">
                    {lang === 'ar' ? 'تحدي الصديق' : 'Challenge Friend'}
                  </h2>
                  <p className="text-xs text-steel">
                    vs <strong className="text-lime">{selectedFriendToChallenge.displayName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFriendToChallenge(null)}
                className="btn-haptic flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-steel hover:text-white cursor-pointer"
              >
                <AppIcon icon={X} size={15} weight="bold" />
              </button>
            </div>

            {/* Game Mode Pick */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setChallengeMode('snipe')}
                className={`btn-haptic flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center transition-all cursor-pointer ${
                  challengeMode === 'snipe'
                    ? 'border-lime bg-lime/15 text-white ring-2 ring-lime shadow-glow-lime'
                    : 'border-white/10 bg-slate-900 text-steel hover:border-white/20 hover:text-white'
                }`}
              >
                <AppIcon icon={Crosshair} size={26} weight="duotone" className="text-lime" />
                <span className="text-xs font-bold font-stats">Snipe Hidden-Bid</span>
              </button>

              <button
                type="button"
                onClick={() => setChallengeMode('rank')}
                className={`btn-haptic flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center transition-all cursor-pointer ${
                  challengeMode === 'rank'
                    ? 'border-amber-400 bg-amber-400/15 text-white ring-2 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.25)]'
                    : 'border-white/10 bg-slate-900 text-steel hover:border-white/20 hover:text-white'
                }`}
              >
                <AppIcon icon={Trophy} size={26} weight="duotone" className="text-amber-400" />
                <span className="text-xs font-bold font-stats">Rank 1v1 Duel</span>
              </button>
            </div>

            <button
              type="button"
              disabled={isCreatingChallenge}
              onClick={handleStartChallenge}
              className="btn-haptic flex w-full items-center justify-center gap-2 rounded-2xl bg-lime py-3.5 text-sm font-bold text-slate-950 hover:bg-lime/90 shadow-glow-lime disabled:opacity-50 font-stats cursor-pointer"
            >
              {isCreatingChallenge ? (
                <AppIcon icon={CircleNotch} size={18} weight="bold" className="animate-spin" />
              ) : (
                <AppIcon icon={Sword} size={18} weight="bold" />
              )}
              <span>{isCreatingChallenge ? 'Creating Challenge...' : (lang === 'ar' ? 'بدء التحدي ودعوة الصديق' : 'Create & Invite Friend')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Direct Invite Modal when challenge room is created */}
      {inviteModalData && (
        <InviteModal
          isOpen={Boolean(inviteModalData)}
          onClose={() => {
            const data = inviteModalData;
            setInviteModalData(null);
            if (data.type === 'room') {
              router.push(`/create-room`);
            } else {
              router.push(`/rank`);
            }
          }}
          title={inviteModalData.title}
          code={inviteModalData.code}
          type={inviteModalData.type}
        />
      )}
    </div>
  );
}

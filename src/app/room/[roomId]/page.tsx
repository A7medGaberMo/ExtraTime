'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { useGuestSession } from '@/hooks/use-guest-session';
import {
  Copy,
  Check,
  Users,
  Coins,
  Crosshair,
  Clock,
  ArrowRight,
  SlidersHorizontal,
  SignOut,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/ui/page-shell';
import { StatPill } from '@/components/ui/stat-pill';
import { UserIdentity } from '@/components/ui/user-identity';
import { useToast } from '@/components/shared/toast';
import { useI18n } from '@/lib/i18n';

export default function RoomLobbyPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const { guestId, sessionToken } = useGuestSession();

  const state = useQuery(
    api.auctions.queries.getState,
    guestId && roomId ? { roomId: roomId as Id<'rooms'>, userId: guestId } : 'skip',
  );

  const abandonMatch = useMutation(api.rooms.mutations.abandonUserActiveMatch);
  const cancelRoom = useMutation(api.rooms.mutations.cancel);

  const room = state?.room;
  const auction = state?.auction;
  const isHost = Boolean(state?.isHost);

  useEffect(() => {
    if (room?.status === 'abandoned') {
      toast(lang === 'ar' ? 'تم إلغاء الغرفة من قبل أحد المدربين' : 'Room was cancelled by manager', 'info');
      router.replace('/');
    }
  }, [room?.status, router, toast, lang]);

  useEffect(() => {
    if (auction?.status === 'active' || room?.status === 'in_progress') {
      router.push(`/auction/${roomId}`);
    }
  }, [auction?.status, room?.status, roomId, router]);

  const handleLeaveOrCancel = async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    try {
      if (guestId && roomId) {
        await abandonMatch({
          guestId,
          matchType: 'snipe',
          matchId: roomId,
          sessionToken: sessionToken ?? undefined,
        });
      }
    } catch {
      if (guestId && room?._id && isHost) {
        try {
          await cancelRoom({
            roomId: room._id,
            hostId: guestId,
            sessionToken: sessionToken ?? undefined,
          });
        } catch {}
      }
    }
    toast(lang === 'ar' ? 'تم إلغاء الغرفة والمغادرة' : 'Room cancelled and exited', 'info');
    router.replace('/');
  };

  const copyCode = () => {
    if (!room?.code) return;
    navigator.clipboard.writeText(room.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const roomCode = room?.code || roomId.toUpperCase().slice(0, 6);
  const guestReady = Boolean(room?.guestId);

  return (
    <PageShell
      title={t('lobby.title')}
      subtitle={t('lobby.subtitle')}
      badge={
        <div className="inline-flex items-center gap-1.5 rounded-full border border-game-accent/30 bg-game-accent/10 px-3 py-1 text-xs font-semibold text-game-accent-light shadow-sm backdrop-blur-xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-game-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-game-accent" />
          </span>
          <span className="font-stats tracking-wider uppercase text-[11px] font-bold">
            {guestReady ? 'Lobby Ready' : 'Radar Beacon Active'}
          </span>
        </div>
      }
      backUrl="/"
      maxWidth="3xl"
    >
      <div className="relative space-y-4">
        {/* ── 1. ROOM CODE HERO BAR ────────────────────────────────────── */}
        <div className="luxury-glass-elevated relative z-10 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-game-accent/25 rounded-3xl shadow-xl">
          <div className="space-y-1 text-center sm:text-start">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-game-accent text-[10px] font-bold tracking-widest uppercase font-stats">
                {t('lobby.roomCode')}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-game-accent animate-pulse" />
              <span className="text-[10px] text-muted font-medium">Share to challenge</span>
            </div>
            <p className="font-stats text-white text-3xl sm:text-5xl tracking-[0.24em] font-bold">
              {roomCode}
            </p>
          </div>

          <Button
            variant="secondary"
            size="lg"
            onClick={copyCode}
            leftIcon={<AppIcon icon={copied ? Check : Copy} size={17} weight="bold" className={copied ? 'text-game-accent' : ''} />}
            className="rounded-2xl border-white/12 h-11 text-xs font-bold"
          >
            {copied ? t('common.copied') : t('common.copy')}
          </Button>
        </div>

        {/* ── 2. QUICK STATS SUMMARY ───────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 relative z-10">
          <div className="luxury-glass rounded-2xl p-3.5 text-center sm:text-start space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <AppIcon icon={Users} size={15} weight="duotone" className="text-game-accent" />
              <p className="text-muted text-[10px] font-bold uppercase tracking-wider font-stats">{t('lobby.playersCount')}</p>
            </div>
            <p className="font-stats text-xl sm:text-2xl font-bold text-white">{guestReady ? '2/2' : '1/2'}</p>
          </div>

          <div className="luxury-glass rounded-2xl p-3.5 text-center sm:text-start space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <AppIcon icon={Coins} size={15} weight="duotone" className="text-game-accent" />
              <p className="text-muted text-[10px] font-bold uppercase tracking-wider font-stats">{t('lobby.budget')}</p>
            </div>
            <p className="font-stats text-xl sm:text-2xl font-bold text-game-accent-light">
              ${room?.settings?.startingBudget || 100}M
            </p>
          </div>

          <div className="luxury-glass rounded-2xl p-3.5 text-center sm:text-start space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <AppIcon icon={Crosshair} size={15} weight="duotone" className="text-game-accent" />
              <p className="text-muted text-[10px] font-bold uppercase tracking-wider font-stats">{t('lobby.squadSize')}</p>
            </div>
            <p className="font-stats text-xl sm:text-2xl font-bold text-white">
              {room?.settings?.matchSize || 11} <span className="text-xs text-muted font-normal">{t('common.rounds')}</span>
            </p>
          </div>
        </div>

        {/* ── 3. MANAGERS STATUS & RULES ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3.5 relative z-10">
          {/* Managers Panel */}
          <div className="luxury-glass-elevated p-4 sm:p-5 space-y-4 rounded-3xl">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white uppercase font-display">
                <AppIcon icon={Users} size={17} weight="duotone" className="text-game-accent" />
                <span>{t('lobby.playersCount')}</span>
              </h2>
              <StatPill
                variant={guestReady ? 'gold' : 'muted'}
                size="sm"
                label={guestReady ? t('common.ready') : t('common.waiting')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
              {/* Host */}
              <div className="luxury-glass p-3.5 rounded-2xl border border-game-accent/30 space-y-2">
                <UserIdentity
                  nickname={state?.hostName || (isHost ? 'You' : 'Host')}
                  subtitle={t('lobby.hostSub')}
                  isHost
                  size="md"
                />
                <StatPill
                  variant="gold"
                  size="sm"
                  label={`Perk: ${state?.me?.perk || 'Assigned'}`}
                />
              </div>

              {/* Challenger */}
              {guestReady ? (
                <div className="luxury-glass p-3.5 rounded-2xl border border-info/30 space-y-2">
                  <UserIdentity
                    nickname={state?.guestName || (!isHost ? 'You' : 'Challenger')}
                    subtitle={t('lobby.guestSub')}
                    size="md"
                  />
                  <StatPill
                    variant="sky"
                    size="sm"
                    label={t('common.ready')}
                  />
                </div>
              ) : (
                <div className="luxury-glass relative flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 p-4 text-center">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-game-accent">
                    <AppIcon icon={Clock} size={18} weight="duotone" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white uppercase font-stats">
                      {t('lobby.waitingOpponent')}
                    </p>
                    <p className="text-muted text-[10px]">
                      {t('lobby.shareCodePrompt', { code: roomCode })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Sidebar */}
          <aside className="space-y-3">
            <div className="luxury-glass p-3.5 space-y-3 rounded-2xl">
              <h3 className="flex items-center gap-2 text-xs font-bold text-muted tracking-widest uppercase font-stats">
                <AppIcon icon={SlidersHorizontal} size={15} weight="duotone" className="text-game-accent" />
                <span>{t('lobby.rulesTitle')}</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-white/8 pb-1.5">
                  <span className="text-muted">{t('lobby.mode')}</span>
                  <span className="font-bold text-white uppercase font-stats">Snipe</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/8 pb-1.5">
                  <span className="text-muted">{t('createRoom.playerPool')}</span>
                  <span className="font-bold text-white uppercase font-stats">{room?.settings?.poolMode || 'GLOBAL'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">{t('lobby.turnTimer')}</span>
                  <span className="font-bold text-white font-stats">30s</span>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => router.push(`/auction/${roomId}`)}
              leftIcon={<AppIcon icon={Crosshair} size={18} weight="bold" className="text-game-on-accent" />}
              rightIcon={<AppIcon icon={ArrowRight} size={16} weight="bold" className="text-game-on-accent rtl:rotate-180" />}
              className="rounded-2xl font-bold h-12 text-sm"
            >
              {t('lobby.enterArena')}
            </Button>

            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={handleLeaveOrCancel}
              loading={isLeaving}
              leftIcon={<AppIcon icon={SignOut} size={16} weight="bold" className="text-danger" />}
              className="rounded-xl h-10 text-xs font-semibold border-danger/30 text-danger hover:bg-danger/10"
            >
              {isHost ? (lang === 'ar' ? 'إلغاء الغرفة' : 'Cancel Room') : (lang === 'ar' ? 'مغادرة الغرفة' : 'Leave Room')}
            </Button>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}

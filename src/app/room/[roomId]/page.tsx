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
import { Panel } from '@/components/ui/panel';
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
        <div className="inline-flex items-center gap-1.5 rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-xs font-semibold text-lime shadow-[0_0_15px_rgba(149,232,16,0.2)] backdrop-blur-xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-lime" />
          </span>
          <span className="font-stats tracking-wider uppercase text-[11px] font-bold">
            {guestReady ? 'Lobby Ready' : 'Radar Beacon Active'}
          </span>
        </div>
      }
      backUrl="/"
      maxWidth="4xl"
    >
      <div className="relative space-y-5">
        {/* Ambient Top Glow Mesh */}
        <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-[260px] w-[90%] max-w-2xl rounded-full blur-[100px] opacity-25 bg-lime" />

        {/* ── 1. ROOM CODE HERO BAR (APPLE SHAREPLAY STYLE) ────────────────── */}
        <div className="apple-glass-elevated relative z-10 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-lime/30 bg-gradient-to-r from-lime/15 via-slate-950/80 to-slate-950/80 shadow-[0_12px_40px_rgba(149,232,16,0.15)]">
          <div className="space-y-1 text-center sm:text-start">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-lime text-[10px] font-black tracking-widest uppercase font-stats">
                {t('lobby.roomCode')}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" />
              <span className="text-[10px] text-steel font-medium">Share to challenge</span>
            </div>
            <p className="font-stats text-lime text-3xl sm:text-5xl tracking-[0.26em] font-black">
              {roomCode}
            </p>
          </div>

          <Button
            variant="secondary"
            size="lg"
            onClick={copyCode}
            leftIcon={<AppIcon icon={copied ? Check : Copy} size={18} weight="bold" className={copied ? 'text-lime' : ''} />}
            className="btn-haptic border-lime/30 hover:border-lime hover:bg-lime/15 active:scale-95 shadow-md"
          >
            {copied ? t('common.copied') : t('common.copy')}
          </Button>
        </div>

        {/* ── 2. QUICK STATS SUMMARY (APPLE WATCH COMPLICATIONS) ─────────── */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 relative z-10">
          <div className="apple-glass-card rounded-2xl p-3.5 sm:p-4 text-center sm:text-start border border-white/10 space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <div className="p-1 rounded-lg bg-lime/10 border border-lime/30 text-lime">
                <AppIcon icon={Users} size={16} weight="duotone" />
              </div>
              <p className="text-steel text-[10px] font-black uppercase tracking-wider font-stats">{t('lobby.playersCount')}</p>
            </div>
            <p className="font-stats mt-1 text-xl sm:text-3xl font-black text-white">{guestReady ? '2/2' : '1/2'}</p>
          </div>

          <div className="apple-glass-card rounded-2xl p-3.5 sm:p-4 text-center sm:text-start border border-white/10 space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <div className="p-1 rounded-lg bg-lime/10 border border-lime/30 text-lime">
                <AppIcon icon={Coins} size={16} weight="duotone" />
              </div>
              <p className="text-steel text-[10px] font-black uppercase tracking-wider font-stats">{t('lobby.budget')}</p>
            </div>
            <p className="font-stats mt-1 text-xl sm:text-3xl font-black text-lime">
              ${room?.settings?.startingBudget || 100}M
            </p>
          </div>

          <div className="apple-glass-card rounded-2xl p-3.5 sm:p-4 text-center sm:text-start border border-white/10 space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <div className="p-1 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300">
                <AppIcon icon={Crosshair} size={16} weight="duotone" />
              </div>
              <p className="text-steel text-[10px] font-black uppercase tracking-wider font-stats">{t('lobby.squadSize')}</p>
            </div>
            <p className="font-stats mt-1 text-xl sm:text-3xl font-black text-white">
              {room?.settings?.matchSize || 11} <span className="text-xs text-steel font-medium font-sans">{t('common.rounds')}</span>
            </p>
          </div>
        </div>

        {/* ── 3. MANAGERS STATUS & RULES (APPLE SHAREPLAY CARDS) ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 relative z-10">
          {/* Managers Panel */}
          <div className="apple-glass-elevated p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="flex items-center gap-2 text-base font-black text-white uppercase font-display">
                <AppIcon icon={Users} size={20} weight="duotone" className="text-lime" />
                <span>{t('lobby.playersCount')}</span>
              </h2>
              <StatPill
                variant={guestReady ? 'lime' : 'amber'}
                size="sm"
                label={guestReady ? t('common.ready') : t('common.waiting')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Host Manager */}
              <div className="apple-glass-card p-4 rounded-2xl border border-lime/40 bg-gradient-to-b from-lime/15 to-lime/5 space-y-3 shadow-[0_4px_16px_rgba(149,232,16,0.1)]">
                <div className="flex items-center justify-between">
                  <UserIdentity
                    nickname={state?.hostName || (isHost ? 'You' : 'Host')}
                    subtitle={t('lobby.hostSub')}
                    isHost
                    size="md"
                  />
                </div>
                <StatPill
                  variant="lime"
                  size="sm"
                  label={`Perk: ${state?.me?.perk || 'Assigned'}`}
                  className="shadow-sm"
                />
              </div>

              {/* Challenger Manager */}
              {guestReady ? (
                <div className="apple-glass-card p-4 rounded-2xl border border-sky-400/40 bg-gradient-to-b from-sky-400/15 to-sky-400/5 space-y-3 shadow-[0_4px_16px_rgba(56,189,248,0.1)]">
                  <div className="flex items-center justify-between">
                    <UserIdentity
                      nickname={state?.guestName || (!isHost ? 'You' : 'Challenger')}
                      subtitle={t('lobby.guestSub')}
                      size="md"
                    />
                  </div>
                  <StatPill
                    variant="sky"
                    size="sm"
                    label={t('common.ready')}
                    className="shadow-sm"
                  />
                </div>
              ) : (
                <div className="apple-glass-card relative flex min-h-[140px] flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-white/20 bg-slate-900/40 p-4 text-center overflow-hidden">
                  <div className="relative">
                    <span className="animate-ping absolute inset-0 rounded-full bg-lime opacity-30" />
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-lime/20 border border-lime/40 text-lime">
                      <AppIcon icon={Clock} size={22} weight="duotone" />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-white uppercase tracking-wider font-stats">
                      {t('lobby.waitingOpponent')}
                    </p>
                    <p className="text-steel text-[11px] font-medium leading-relaxed">
                      {t('lobby.shareCodePrompt', { code: roomCode })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rules & Action Sidebar */}
          <aside className="space-y-3">
            <div className="apple-glass-card p-4 sm:p-5 space-y-3.5 border border-white/10 rounded-2xl">
              <h3 className="flex items-center gap-2 text-xs font-black text-steel tracking-widest uppercase font-stats">
                <AppIcon icon={SlidersHorizontal} size={16} weight="duotone" className="text-lime" />
                <span>{t('lobby.rulesTitle')}</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-steel font-bold">{t('lobby.mode')}</span>
                  <span className="font-black text-lime uppercase font-stats">Snipe</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-steel font-bold">{t('createRoom.playerPool')}</span>
                  <span className="font-black text-white uppercase font-stats">{room?.settings?.poolMode || 'GLOBAL'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-steel font-bold">{t('lobby.turnTimer')}</span>
                  <span className="font-black text-white font-stats">30s</span>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => router.push(`/auction/${roomId}`)}
              leftIcon={<AppIcon icon={Crosshair} size={20} weight="bold" className="text-slate-950" />}
              rightIcon={<AppIcon icon={ArrowRight} size={18} weight="bold" className="text-slate-950" />}
              className="shadow-[0_8px_24px_rgba(149,232,16,0.25)]"
            >
              {t('lobby.enterArena')}
            </Button>

            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={handleLeaveOrCancel}
              loading={isLeaving}
              leftIcon={<AppIcon icon={SignOut} size={18} weight="bold" className="text-rose-400" />}
              className="border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 rounded-xl"
            >
              {isHost ? (lang === 'ar' ? 'إلغاء الغرفة' : 'Cancel Room') : (lang === 'ar' ? 'مغادرة الغرفة' : 'Leave Room')}
            </Button>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}

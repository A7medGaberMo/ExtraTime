'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
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
  ShareNetwork,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/ui/page-shell';
import { Panel } from '@/components/ui/panel';
import { StatPill } from '@/components/ui/stat-pill';
import { UserIdentity } from '@/components/ui/user-identity';
import { useI18n } from '@/lib/i18n';
import { InviteModal } from '@/components/shared/invite-modal';

export default function RoomLobbyPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { t, lang } = useI18n();
  const [copied, setCopied] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { guestId, sessionToken } = useGuestSession();

  const state = useQuery(
    api.auctions.queries.getState,
    guestId && roomId ? { roomId: roomId as Id<'rooms'>, userId: guestId, sessionToken: sessionToken || undefined } : 'skip',
  );

  const roomDoc = useQuery(
    api.rooms.queries.getById,
    roomId ? { id: roomId as Id<'rooms'> } : 'skip',
  );

  const room = state?.room || roomDoc;
  const auction = state?.auction;
  const isHost = Boolean(state?.isHost);

  useEffect(() => {
    if (
      auction?.status === 'active' ||
      room?.status === 'in_progress' ||
      roomDoc?.status === 'in_progress'
    ) {
      router.push(`/auction/${roomId}`);
    }
  }, [auction?.status, room?.status, roomDoc?.status, roomId, router]);

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
      backUrl="/"
      maxWidth="4xl"
    >
      {/* ── 1. ROOM CODE HERO BAR ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-3xl border border-lime/30 bg-lime/10 shadow-xl">
        <div className="space-y-0.5 text-center sm:text-start">
          <span className="text-lime text-[10px] font-black tracking-widest uppercase">
            {t('lobby.roomCode')}
          </span>
          <p className="font-stats text-lime text-3xl sm:text-4xl tracking-[0.24em] font-black">
            {roomCode}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={copyCode}
            leftIcon={<AppIcon icon={copied ? Check : Copy} size={18} weight="bold" className={copied ? 'text-lime' : ''} />}
          >
            {copied ? t('common.copied') : t('common.copy')}
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setShowInviteModal(true)}
            leftIcon={<AppIcon icon={ShareNetwork} size={18} weight="bold" />}
          >
            {lang === 'ar' ? 'دعوة صديق' : 'Invite'}
          </Button>
        </div>
      </div>

      {/* ── 2. QUICK STATS SUMMARY ───────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <Panel variant="subtle" className="p-3 sm:p-4 text-center sm:text-start">
          <AppIcon icon={Users} size={20} weight="duotone" className="text-lime mb-1" />
          <p className="text-steel text-[10px] font-black uppercase tracking-wider">{t('lobby.playersCount')}</p>
          <p className="font-stats mt-0.5 text-xl sm:text-2xl font-black text-white">{guestReady ? '2/2' : '1/2'}</p>
        </Panel>
        <Panel variant="subtle" className="p-3 sm:p-4 text-center sm:text-start">
          <AppIcon icon={Coins} size={20} weight="duotone" className="text-lime mb-1" />
          <p className="text-steel text-[10px] font-black uppercase tracking-wider">{t('lobby.budget')}</p>
          <p className="font-stats mt-0.5 text-xl sm:text-2xl font-black text-lime">
            ${room?.settings?.startingBudget || 100}M
          </p>
        </Panel>
        <Panel variant="subtle" className="p-3 sm:p-4 text-center sm:text-start">
          <AppIcon icon={Crosshair} size={20} weight="duotone" className="text-amber-400 mb-1" />
          <p className="text-steel text-[10px] font-black uppercase tracking-wider">{t('lobby.squadSize')}</p>
          <p className="font-stats mt-0.5 text-xl sm:text-2xl font-black text-white">
            {room?.settings?.matchSize || 11} {t('common.rounds')}
          </p>
        </Panel>
      </div>

      {/* ── 3. MANAGERS STATUS & RULES ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Managers Panel */}
        <Panel variant="highlight" className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Host Manager */}
            <div className="p-4 rounded-2xl border border-lime/30 bg-lime/5 space-y-3">
              <UserIdentity
                nickname={state?.hostName || (isHost ? 'You' : 'Host')}
                subtitle={t('lobby.hostSub')}
                isHost
                size="md"
              />
              <StatPill
                variant="lime"
                size="sm"
                label={`Perk: ${state?.me?.perk || 'Assigned'}`}
              />
            </div>

            {/* Challenger Manager */}
            {guestReady ? (
              <div className="p-4 rounded-2xl border border-sky-400/30 bg-sky-400/5 space-y-3">
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
              <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-slate-950/60 p-4 text-center">
                <AppIcon icon={Clock} size={28} weight="duotone" className="text-lime animate-pulse" />
                <div>
                  <p className="text-xs font-black text-white uppercase">{t('lobby.waitingOpponent')}</p>
                  <p className="text-steel mt-0.5 text-[11px] font-medium">
                    {t('lobby.shareCodePrompt', { code: roomCode })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Panel>

        {/* Rules & Action Sidebar */}
        <aside className="space-y-3">
          <Panel variant="default" className="p-4 sm:p-5 space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-black text-white uppercase">
              <AppIcon icon={SlidersHorizontal} size={18} weight="duotone" className="text-lime" />
              <span>{t('lobby.rulesTitle')}</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-steel font-bold">{t('lobby.mode')}</span>
                <span className="font-black text-lime uppercase">Snipe</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-steel font-bold">{t('createRoom.playerPool')}</span>
                <span className="font-black text-white uppercase">{room?.settings?.poolMode || 'GLOBAL'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-steel font-bold">{t('lobby.turnTimer')}</span>
                <span className="font-black text-white font-stats">30s</span>
              </div>
            </div>
          </Panel>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => router.push(`/auction/${roomId}`)}
            leftIcon={<AppIcon icon={Crosshair} size={20} weight="bold" />}
            rightIcon={<AppIcon icon={ArrowRight} size={18} weight="bold" />}
          >
            {t('lobby.enterArena')}
          </Button>
        </aside>
      </div>

      {showInviteModal && (
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title="ExtraTime Snipe Match"
          code={roomCode}
          type="room"
        />
      )}
    </PageShell>
  );
}

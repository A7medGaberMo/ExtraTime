'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { PageHeader } from '@/components/shared/page-header';
import { useGuestSession } from '@/hooks/use-guest-session';
import {
  Copy,
  Users,
  Settings2,
  Clock,
  Check,
  ArrowRight,
  Swords,
  Coins,
  ShieldCheck,
} from 'lucide-react';

export default function RoomLobbyPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const { guestId } = useGuestSession();

  const state = useQuery(
    api.auctions.queries.getState,
    guestId && roomId ? { roomId: roomId as Id<'rooms'>, userId: guestId } : 'skip',
  );

  const room = state?.room;
  const auction = state?.auction;
  const isHost = state?.isHost ?? true;

  useEffect(() => {
    if (auction?.status === 'active' || room?.status === 'in_progress') {
      router.push(`/auction/${roomId}`);
    }
  }, [auction?.status, room?.status, roomId, router]);

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
    <div className="animate-fade-in mx-auto max-w-5xl space-y-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <PageHeader
          title="Hidden Bid Lobby"
          subtitle="Share the code, confirm the rules, then enter the auction arena."
          backUrl="/"
          className="mb-0"
        />

        <div className="border-lime/30 bg-lime/10 shadow-lime/10 rounded-2xl border p-3 shadow-xl">
          <p className="text-lime mb-1 text-[10px] font-black tracking-widest uppercase">
            Room Code
          </p>
          <div className="flex items-center gap-3">
            <span className="font-stats text-lime text-3xl tracking-[0.2em]">{roomCode}</span>
            <button
              onClick={copyCode}
              className="text-steel hover:border-lime/50 hover:text-lime flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-slate-950 transition-all active:scale-95"
              title="Copy code"
            >
              {copied ? <Check className="text-lime h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
        <div className="bg-lime/10 pointer-events-none absolute inset-x-10 top-0 h-32 rounded-full blur-3xl" />
        <div className="relative grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3">
            <Users className="text-lime mb-2 h-4 w-4" />
            <p className="text-steel text-[10px] font-black tracking-widest uppercase">Players</p>
            <p className="font-stats mt-1 text-2xl text-white">{guestReady ? '2/2' : '1/2'}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3">
            <Coins className="text-lime mb-2 h-4 w-4" />
            <p className="text-steel text-[10px] font-black tracking-widest uppercase">Budget</p>
            <p className="font-stats text-lime mt-1 text-2xl">
              ${room?.settings?.startingBudget || 100}M
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3">
            <Swords className="mb-2 h-4 w-4 text-amber-400" />
            <p className="text-steel text-[10px] font-black tracking-widest uppercase">
              Squad Size
            </p>
            <p className="font-stats mt-1 text-2xl text-white">
              {room?.settings?.matchSize || 11} Cards
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <section className="bg-card/90 rounded-2xl border border-white/10 p-4 shadow-xl sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-black text-white">
              <Users className="text-lime h-5 w-5" />
              Managers
            </h2>
            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-black tracking-widest uppercase ${
                guestReady
                  ? 'border-lime/40 bg-lime/10 text-lime'
                  : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
              }`}
            >
              {guestReady ? 'Ready' : 'Waiting'}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border-lime/40 from-lime/10 relative min-h-[150px] overflow-hidden rounded-xl border bg-gradient-to-b to-slate-950 p-4 shadow-lg">
              <div className="bg-lime/15 absolute top-0 right-0 h-24 w-24 rounded-full blur-3xl" />
              <div className="relative flex h-full flex-col justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="border-lime/50 font-stats text-lime flex h-14 w-14 items-center justify-center rounded-xl border bg-slate-950 text-2xl">
                    H
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-black text-white">
                      {isHost ? 'You' : 'Host Manager'}
                    </p>
                    <p className="text-steel text-xs font-bold">Room creator</p>
                  </div>
                </div>
                <span className="border-lime/30 bg-lime/10 text-lime w-fit rounded-lg border px-3 py-1 text-[10px] font-black tracking-widest uppercase">
                  Perk: {state?.me?.perk || 'Assigned'}
                </span>
              </div>
            </div>

            {guestReady ? (
              <div className="relative min-h-[150px] overflow-hidden rounded-xl border border-sky-400/40 bg-gradient-to-b from-sky-400/10 to-slate-950 p-4 shadow-lg">
                <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-sky-400/15 blur-3xl" />
                <div className="relative flex h-full flex-col justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="font-stats flex h-14 w-14 items-center justify-center rounded-xl border border-sky-400/50 bg-slate-950 text-2xl text-sky-300">
                      G
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-black text-white">
                        {!isHost ? 'You' : 'Challenger'}
                      </p>
                      <p className="text-steel text-xs font-bold">Ready to bid</p>
                    </div>
                  </div>
                  <span className="w-fit rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-[10px] font-black tracking-widest text-sky-300 uppercase">
                    Joined
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[150px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 bg-slate-950/70 p-4 text-center">
                <Clock className="text-lime h-7 w-7 animate-pulse" />
                <div>
                  <p className="text-sm font-black text-white">Waiting for opponent</p>
                  <p className="text-steel mt-1 text-xs font-medium">
                    Share code {roomCode} to start.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-3">
          <div className="bg-card/90 rounded-2xl border border-white/10 p-4 shadow-xl">
            <h2 className="mb-3 flex items-center gap-2 text-base font-black text-white">
              <Settings2 className="text-lime h-5 w-5" />
              Rules
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <span className="text-steel font-bold">Mode</span>
                <span className="font-black text-white uppercase">
                  {room?.gameType || 'Hidden Bid'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <span className="text-steel font-bold">Player Pool</span>
                <span className="text-lime font-black uppercase">
                  {room?.settings?.poolMode || 'GLOBAL'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-steel font-bold">Turn Timer</span>
                <span className="font-black text-white">30s</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
            <ShieldCheck className="mb-2 h-5 w-5 text-amber-300" />
            <p className="text-xs leading-relaxed font-bold text-amber-100">
              Win the visible card by bidding smart. Passing can still land you the hidden sub card.
            </p>
          </div>

          <button
            onClick={() => router.push(`/auction/${roomId}`)}
            className="bg-lime shadow-lime/15 hover:bg-vivid flex w-full items-center justify-center gap-2 rounded-xl px-4 py-4 text-sm font-black tracking-widest text-slate-950 uppercase shadow-xl transition-all active:scale-[0.98]"
          >
            Enter Auction Arena
            <ArrowRight className="h-4 w-4" />
          </button>
        </aside>
      </div>
    </div>
  );
}

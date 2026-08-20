'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { PageHeader } from '@/components/shared/page-header';
import { useToast } from '@/components/shared/toast';
import { Loader2, RefreshCw, CheckCircle2, XCircle, Search, KeyRound, Swords } from 'lucide-react';

import { randomEgyptianManagerName as randomName } from '@/lib/random-names';

export default function JoinRoomPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createGuest = useMutation(api.guests.mutations.create);
  const joinRoom = useMutation(api.rooms.mutations.join);

  const [nickname, setNickname] = useState(() => randomName());
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

  const normalizedCode = roomCode
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)
    .toUpperCase();
  const room = useQuery(
    api.rooms.queries.getByCode,
    normalizedCode.length === 6 ? { code: normalizedCode } : 'skip',
  );
  const canJoin = Boolean(room && room.status === 'waiting' && !room.guestId);

  const statusIcon =
    normalizedCode.length < 6 ? (
      <Search className="text-steel h-4 w-4" />
    ) : room === undefined ? (
      <Loader2 className="text-lime h-4 w-4 animate-spin" />
    ) : canJoin ? (
      <CheckCircle2 className="text-lime h-4 w-4" />
    ) : (
      <XCircle className="h-4 w-4 text-rose-400" />
    );

  const statusText =
    normalizedCode.length < 6
      ? 'Enter the 6-character room code.'
      : room === undefined
        ? 'Checking room code...'
        : canJoin
          ? 'Room found. You can join now.'
          : room
            ? 'This room is full or already started.'
            : 'No room found with that code.';

  async function handleJoin(event: FormEvent) {
    event.preventDefault();
    if (!canJoin || loading || !nickname.trim()) return;
    setLoading(true);
    try {
      const guestId = await createGuest({ nickname: nickname.trim(), avatarSeed: nickname.trim() });
      localStorage.setItem('extratime_guestId', guestId);
      const result = await joinRoom({ roomId: room!._id, guestId });
      router.push(`/auction/${result.roomId}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast(err.message || 'Could not join room', 'error');
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-4">
      <PageHeader
        title="Join Hidden Bid"
        subtitle="Enter your rival's code and jump straight into the auction arena."
        backUrl="/"
        className="mb-3"
      />

      <form
        onSubmit={handleJoin}
        className="bg-card/90 relative overflow-hidden rounded-2xl border border-white/10 p-4 shadow-2xl backdrop-blur-xl sm:p-5"
      >
        <div className="bg-lime/10 pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full blur-3xl" />

        <div className="relative space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-steel text-[10px] font-black tracking-widest uppercase">
                Manager Handle
              </label>
              <span className="text-lime text-[10px] font-black tracking-widest uppercase">
                Auto generated
              </span>
            </div>
            <div className="flex gap-2">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={24}
                className="placeholder:text-steel focus:border-lime/70 focus:ring-lime/20 min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-3.5 text-base font-black text-white transition-all outline-none focus:ring-2"
                placeholder="Manager name"
              />
              <button
                type="button"
                onClick={() => setNickname(randomName())}
                className="text-steel hover:border-lime/50 hover:text-lime flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-900 transition-all active:scale-95"
                title="Randomize manager handle"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-steel text-[10px] font-black tracking-widest uppercase">
              Room Code
            </span>
            <div className="relative">
              <KeyRound className="text-lime absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
              <input
                value={roomCode}
                onChange={(e) =>
                  setRoomCode(
                    e.target.value
                      .replace(/[^a-zA-Z0-9]/g, '')
                      .slice(0, 6)
                      .toUpperCase(),
                  )
                }
                maxLength={6}
                className="font-stats text-lime placeholder:text-border focus:border-lime/70 focus:ring-lime/20 w-full rounded-xl border border-white/10 bg-slate-950 py-4 pr-4 pl-12 text-center text-3xl tracking-[0.26em] uppercase transition-all outline-none focus:ring-2 sm:text-4xl"
                placeholder="X7K9M2"
                autoComplete="off"
                inputMode="text"
              />
            </div>
          </label>

          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-all ${
              canJoin ? 'border-lime/40 bg-lime/10' : 'border-white/10 bg-slate-950/80'
            }`}
          >
            <div className="mt-0.5 shrink-0">{statusIcon}</div>
            <div className="min-w-0">
              <p className={`text-sm font-black ${canJoin ? 'text-lime' : 'text-white'}`}>
                {statusText}
              </p>
              <p className="text-steel mt-1 text-xs leading-snug font-medium">
                You will enter the same Hidden Bid room as soon as the code is valid.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canJoin || loading || !nickname.trim()}
            className="bg-lime shadow-lime/15 hover:bg-vivid flex w-full items-center justify-center gap-2 rounded-xl px-4 py-4 text-sm font-black tracking-widest text-slate-950 uppercase shadow-xl transition-all active:scale-[0.98] disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Joining Arena...
              </>
            ) : (
              <>
                <Swords className="h-4 w-4" /> Join Match Arena
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

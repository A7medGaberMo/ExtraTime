'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { PageHeader } from '@/components/shared/page-header';
import { useToast } from '@/components/shared/toast';
import {
  Loader2,
  Globe,
  Lock,
  RefreshCw,
  Clock,
  Zap,
  UserCheck,
  Swords,
  Coins,
  Users,
  Star,
  Crown,
  Flame,
  ShieldCheck,
} from 'lucide-react';

type MatchSize = 5 | 11;
type PoolMode = 'GLOBAL' | 'ACTIVE' | 'EPL' | 'TOP_TEAMS' | 'ICONS';

import { randomEgyptianManagerName as randomName } from '@/lib/random-names';

const poolOptions = [
  { id: 'ACTIVE' as PoolMode, label: 'Active', icon: UserCheck, sub: 'Current players' },
  { id: 'GLOBAL' as PoolMode, label: 'Global', icon: Globe, sub: 'All + Legends' },
  { id: 'EPL' as PoolMode, label: 'EPL', icon: Flame, sub: 'Prem only' },
  { id: 'TOP_TEAMS' as PoolMode, label: 'Top Clubs', icon: Star, sub: 'Big teams' },
  { id: 'ICONS' as PoolMode, label: 'Icons', icon: Crown, sub: 'Legends' },
];

export default function CreateRoomPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createGuest = useMutation(api.guests.mutations.create);
  const createRoom = useMutation(api.rooms.mutations.create);

  const [nickname, setNickname] = useState(() => randomName());
  const [matchSize, setMatchSize] = useState<MatchSize>(11);
  const [startingBudget, setStartingBudget] = useState(100);
  const [poolMode, setPoolMode] = useState<PoolMode>('ACTIVE');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (loading || !nickname.trim()) return;
    setLoading(true);
    try {
      const guestId = await createGuest({ nickname: nickname.trim(), avatarSeed: nickname.trim() });
      localStorage.setItem('extratime_guestId', guestId);
      const room = await createRoom({
        hostId: guestId,
        matchSize,
        startingBudget,
        isPublic,
        poolMode,
      });
      router.push(`/auction/${room.roomId}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast(err.message || 'Could not create room', 'error');
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4">
      <PageHeader
        title="Create Hidden Bid"
        subtitle="Set the rules, share the code, draft your squad."
        backUrl="/"
        className="mb-3"
      />

      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
        <div className="bg-lime/10 pointer-events-none absolute inset-x-8 top-0 h-28 rounded-full blur-3xl" />

        <div className="relative grid grid-cols-3 gap-2 sm:gap-3">
          <div className="border-lime/25 bg-lime/10 rounded-xl border p-2 text-center sm:p-3 sm:text-left">
            <Clock className="text-lime mx-auto mb-1.5 h-4 w-4 shrink-0 sm:mx-0" />
            <p className="text-lime truncate text-[10px] font-black tracking-wider whitespace-nowrap uppercase sm:text-xs">
              30s Turns
            </p>
            <p className="mt-0.5 truncate text-[9px] font-medium whitespace-nowrap text-slate-300 sm:text-xs">
              +10s with Perks
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/80 p-2 text-center sm:p-3 sm:text-left">
            <ShieldCheck className="mx-auto mb-1.5 h-4 w-4 shrink-0 text-amber-400 sm:mx-0" />
            <p className="truncate text-[10px] font-black tracking-wider whitespace-nowrap text-white uppercase sm:text-xs">
              Hidden Sub
            </p>
            <p className="text-steel mt-0.5 truncate text-[9px] font-medium whitespace-nowrap sm:text-xs">
              Win or get backup
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/80 p-2 text-center sm:p-3 sm:text-left">
            <Coins className="text-lime mx-auto mb-1.5 h-4 w-4 shrink-0 sm:mx-0" />
            <p className="truncate text-[10px] font-black tracking-wider whitespace-nowrap text-white uppercase sm:text-xs">
              Budget
            </p>
            <p className="text-steel mt-0.5 truncate text-[9px] font-medium whitespace-nowrap sm:text-xs">
              Save cash to win ties
            </p>
          </div>
        </div>
      </section>

      <section className="bg-card/90 relative overflow-hidden rounded-2xl border border-white/10 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
        <div className="bg-lime/10 pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full blur-3xl" />

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

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMatchSize(11)}
              className={`min-h-[80px] rounded-xl border p-2.5 text-left transition-all active:scale-[0.98] sm:min-h-[88px] sm:p-3 ${
                matchSize === 11
                  ? 'border-lime/60 bg-lime/10 shadow-[0_0_24px_rgba(149,232,16,0.14)]'
                  : 'border-white/10 bg-slate-950/80'
              }`}
            >
              <Users
                className={`mb-1.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5 ${matchSize === 11 ? 'text-lime' : 'text-steel'}`}
              />
              <p className="text-xs font-black tracking-wider whitespace-nowrap text-white uppercase sm:text-sm">
                11 vs 11
              </p>
              <p className="text-steel mt-0.5 truncate text-[10px] font-medium whitespace-nowrap sm:text-xs">
                Full match · 11 rounds
              </p>
            </button>
            <button
              type="button"
              onClick={() => setMatchSize(5)}
              className={`min-h-[80px] rounded-xl border p-2.5 text-left transition-all active:scale-[0.98] sm:min-h-[88px] sm:p-3 ${
                matchSize === 5
                  ? 'border-lime/60 bg-lime/10 shadow-[0_0_24px_rgba(149,232,16,0.14)]'
                  : 'border-white/10 bg-slate-950/80'
              }`}
            >
              <Zap
                className={`mb-1.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5 ${matchSize === 5 ? 'text-lime' : 'text-steel'}`}
              />
              <p className="text-xs font-black tracking-wider whitespace-nowrap text-white uppercase sm:text-sm">
                5 vs 5
              </p>
              <p className="text-steel mt-0.5 truncate text-[10px] font-medium whitespace-nowrap sm:text-xs">
                Quick game · 5 rounds
              </p>
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-steel text-[10px] font-black tracking-widest uppercase">
              Starting Budget
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[100, 150, 200].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setStartingBudget(amount)}
                  className={`rounded-xl border px-2 py-3 text-center transition-all active:scale-95 ${
                    startingBudget === amount
                      ? 'border-lime/60 bg-lime/10'
                      : 'border-white/10 bg-slate-950/80'
                  }`}
                >
                  <p className="font-stats text-lime text-lg">${amount}M</p>
                  <p className="text-steel text-[10px] font-bold tracking-wider uppercase">
                    {amount === 100 ? 'Standard' : amount === 150 ? 'Stakes' : 'Mega'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-steel text-[10px] font-black tracking-widest whitespace-nowrap uppercase">
              Player Pool
            </label>
            {/* Active = current season players · Global = all including legends */}
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-5 sm:gap-2">
              {/* Mobile Row 1: 2 items (Global, Active Stars) */}
              <div className="grid grid-cols-2 gap-2 sm:contents">
                {poolOptions.slice(0, 2).map((option) => {
                  const IconComp = option.icon;
                  const selected = poolMode === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPoolMode(option.id)}
                      className={`flex min-h-[72px] flex-col items-center justify-center rounded-xl border p-2 text-center transition-all active:scale-95 sm:min-h-[76px] ${
                        selected ? 'border-lime/60 bg-lime/10' : 'border-white/10 bg-slate-950/80'
                      }`}
                    >
                      <IconComp
                        className={`mx-auto mb-1 h-4 w-4 shrink-0 ${selected ? 'text-lime' : 'text-steel'}`}
                      />
                      <p className="max-w-full truncate text-[11px] font-black tracking-wider whitespace-nowrap text-white uppercase sm:text-xs">
                        {option.label}
                      </p>
                      <p className="text-steel mt-0.5 max-w-full truncate text-[9px] font-medium whitespace-nowrap sm:text-[10px]">
                        {option.sub}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Row 2: 3 items (EPL, Top Clubs, Icons) */}
              <div className="grid grid-cols-3 gap-2 sm:contents">
                {poolOptions.slice(2).map((option) => {
                  const IconComp = option.icon;
                  const selected = poolMode === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPoolMode(option.id)}
                      className={`flex min-h-[72px] flex-col items-center justify-center rounded-xl border p-2 text-center transition-all active:scale-95 sm:min-h-[76px] ${
                        selected ? 'border-lime/60 bg-lime/10' : 'border-white/10 bg-slate-950/80'
                      }`}
                    >
                      <IconComp
                        className={`mx-auto mb-1 h-4 w-4 shrink-0 ${selected ? 'text-lime' : 'text-steel'}`}
                      />
                      <p className="max-w-full truncate text-[11px] font-black tracking-wider whitespace-nowrap text-white uppercase sm:text-xs">
                        {option.label}
                      </p>
                      <p className="text-steel mt-0.5 max-w-full truncate text-[9px] font-medium whitespace-nowrap sm:text-[10px]">
                        {option.sub}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`rounded-xl border px-3 py-3 text-xs font-black tracking-wider whitespace-nowrap uppercase transition-all active:scale-95 ${
                !isPublic
                  ? 'border-lime/60 bg-lime/10 text-lime'
                  : 'text-steel border-white/10 bg-slate-950'
              }`}
            >
              <Lock className="mx-auto mb-1.5 h-4 w-4" />
              Private Code
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={`rounded-xl border px-3 py-3 text-xs font-black tracking-wider whitespace-nowrap uppercase transition-all active:scale-95 ${
                isPublic
                  ? 'border-lime/60 bg-lime/10 text-lime'
                  : 'text-steel border-white/10 bg-slate-950'
              }`}
            >
              <Globe className="mx-auto mb-1.5 h-4 w-4" />
              Public Arena
            </button>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || !nickname.trim()}
            className="bg-lime shadow-lime/15 hover:bg-vivid flex w-full items-center justify-center gap-2 rounded-xl px-4 py-4 text-sm font-black tracking-widest whitespace-nowrap text-slate-950 uppercase shadow-xl transition-all active:scale-[0.98] disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />{' '}
                <span className="whitespace-nowrap">Launching Arena...</span>
              </>
            ) : (
              <>
                <Swords className="h-4 w-4 shrink-0" />{' '}
                <span className="whitespace-nowrap">Create Match Arena</span>
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

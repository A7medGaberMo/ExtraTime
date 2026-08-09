"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { PageHeader } from "@/components/shared/page-header";
import { useGuestSession } from "@/hooks/use-guest-session";
import { useToast } from "@/components/shared/toast";
import { getRoundOrder } from "../../../../convex/squadDraft/formationGraph";
import {
  Copy, Check, Clock, Settings2, RefreshCw, Crown, Hourglass, Loader2, Swords, Zap,
} from "lucide-react";

const LINE_COLORS: Record<string, string> = {
  GK: "border-lime/60 bg-lime/10 text-lime",
  DEF: "border-sky-400/60 bg-sky-400/10 text-sky-300",
  MID: "border-violet-400/60 bg-violet-400/10 text-violet-300",
  ATT: "border-rose-400/60 bg-rose-400/10 text-rose-300",
};

const TIER_COLORS: Record<string, string> = {
  ICON: "bg-amber-400 text-slate-950",
  HERO: "bg-amber-300 text-slate-950",
  MASTER: "bg-fuchsia-400 text-slate-950",
  ELITE_PLUS: "bg-lime-300 text-slate-950",
  ELITE: "bg-lime-500 text-slate-950",
  GOLD: "bg-yellow-400 text-slate-950",
  SILVER: "bg-slate-300 text-slate-950",
  BRONZE: "bg-orange-500 text-slate-950",
};

interface PickedCard {
  playerId: string;
  name: string;
  tier: string;
  position: string;
  club?: string;
  nation?: string;
}

export default function SquadDraftRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const roomIdTyped = roomId as Id<"rooms">;
  const router = useRouter();
  const { toast } = useToast();
  const { guestId } = useGuestSession(true);

  const [copied, setCopied] = useState(false);
  const [autoPlaced, setAutoPlaced] = useState(false);
  const autoPlacedRef = useRef(false);
  const finalizedRef = useRef(false);

  const state = useQuery(
    api.squadDraft.queries.getDraftState,
    guestId && roomIdTyped ? { roomId: roomIdTyped, userId: guestId } : "skip"
  );
  const myPicks = useQuery(
    api.squadDraft.queries.getMyPicks,
    guestId && roomIdTyped ? { roomId: roomIdTyped, userId: guestId } : "skip"
  );

  const submitPick = useMutation(api.squadDraft.mutations.submitPick);
  const reroll = useMutation(api.squadDraft.mutations.reroll);
  const autoPlace = useMutation(api.squadDraft.mutations.autoPlaceExpired);
  const finalize = useMutation(api.squadDraft.mutations.finalizeSquad);

  const isWaiting = state?.status === "waiting";
  const isDrafting = state?.status === "drafting";
  const isCompleted = state?.status === "completed";

  const formationName = state?.formation?.name ?? "";
  const nodes = useMemo<NodeDraft[]>(() => state?.formation?.nodes ?? [], [state?.formation?.nodes]);
  const nodeBySlot = useMemo(() => new Map(nodes.map((n) => [n.slotIndex, n])), [nodes]);
  const roundOrder = useMemo(() => (formationName ? getRoundOrder(formationName) : []), [formationName]);

  const roundInfo = useMemo(
    () => roundOrder.find((r) => r.round === state?.currentRound),
    [roundOrder, state?.currentRound]
  );
  const targetNode = roundInfo ? nodeBySlot.get(roundInfo.slotIndex) : undefined;

  /** My filled-pitch map: slotIndex → picked card (my own picks only). */
  const mySlots = useMemo(() => {
    const map = new Map<number, PickedCard>();
    for (const pick of myPicks ?? []) {
      if (pick.selected && pick.selectedSlotIndex !== undefined) {
        map.set(pick.selectedSlotIndex, pick.selected);
      }
    }
    return map;
  }, [myPicks]);

  const activePick = useMemo(
    () => myPicks?.find((p) => p.roundNumber === state?.currentRound),
    [myPicks, state?.currentRound]
  );

  const isMyTurn = isDrafting && state?.activeUserId === guestId;
  const myRerollsLeft = guestId === state?.players?.host?.id ? state?.hostRerollsLeft : state?.guestRerollsLeft;
  const canPick = Boolean(isMyTurn && activePick && !activePick.selected);
  const rerollAvailable = canPick && (myRerollsLeft ?? 0) > 0 && (activePick?.rerollCount ?? 0) === 0;

  // ── Timer ─────────────────────────────────────────────────────────
  const [secondsLeft, setSecondsLeft] = useState(45);
  useEffect(() => {
    if (!state?.timerExpiresAt) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((state.timerExpiresAt! - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [state?.timerExpiresAt]);

  // ── Auto-place when my timer expires (once per turn) ───────────────
  useEffect(() => {
    if (!isMyTurn || autoPlacedRef.current) return;
    if (!state?.timerExpiresAt || Date.now() <= state.timerExpiresAt + 2000) return;
    autoPlacedRef.current = true;
    void autoPlace({ roomId: roomIdTyped, userId: guestId! })
      .then(() => setAutoPlaced(true))
      .catch(() => {
        autoPlacedRef.current = false;
      });
  }, [isMyTurn, state?.timerExpiresAt, roomIdTyped, guestId, autoPlace]);

  // ── Finalize once every pick is in (both sides) ───────────────────
  useEffect(() => {
    if (!isDrafting || !state || finalizedRef.current) return;
    if ((state.currentRound ?? 0) <= (state.maxRounds ?? 0)) return;
    finalizedRef.current = true;
    (async () => {
      try {
        await finalize({ roomId: roomIdTyped, userId: guestId! });
      } catch (error: unknown) {
        finalizedRef.current = false;
        const err = error as { message?: string };
        toast(err.message || "Could not finalize draft", "error");
      }
    })();
  }, [isDrafting, state, roomIdTyped, guestId, finalize, toast]);

  // ── Completed → results ──────────────────────────────────────────
  useEffect(() => {
    if (isCompleted) router.push(`/squad-draft/result/${roomId}`);
  }, [isCompleted, roomId, router]);

  const roomCode = state?.roomCode ?? roomId.slice(0, 6).toUpperCase();

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(roomCode).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roomCode]);

  const handlePick = useCallback(
    async (playerId: string) => {
      if (!isMyTurn || !targetNode) return;
      try {
        await submitPick({
          roomId: roomIdTyped,
          userId: guestId!,
          playerId: playerId as Id<"players">,
          slotIndex: targetNode.slotIndex,
        });
      } catch (error: unknown) {
        const err = error as { message?: string };
        toast(err.message || "Could not submit pick", "error");
      }
    },
    [isMyTurn, targetNode, roomIdTyped, guestId, submitPick, toast]
  );

  const handleReroll = useCallback(async () => {
    if (!rerollAvailable) return;
    try {
      await reroll({ roomId: roomIdTyped, userId: guestId! });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast(err.message || "Could not reroll", "error");
    }
  }, [rerollAvailable, roomIdTyped, guestId, reroll, toast]);

  if (!guestId) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-4 animate-fade-in">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <PageHeader
          title="Squad Draft"
          subtitle={
            state
              ? state.formation?.name
                ? `${state.formation.name} · Round ${state.currentRound ?? 1}/${state.maxRounds ?? 11}`
                : "Setting up..."
              : "Entering the draft..."
          }
          backUrl="/"
          className="mb-0"
        />
        <div className="rounded-2xl border border-lime/30 bg-lime/10 p-3 shadow-xl shadow-lime/10">
          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-lime">Room Code</p>
          <div className="flex items-center gap-3">
            <span className="font-stats text-3xl text-lime tracking-[0.2em]">{roomCode}</span>
            <button
              onClick={copyCode}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-slate-950 text-steel transition-all hover:border-lime/50 hover:text-lime active:scale-95"
              title="Copy code"
            >
              {copied ? <Check className="h-4 w-4 text-lime" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {state === undefined && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-lime" />
          <p className="text-sm font-black text-white">Entering the draft...</p>
        </div>
      )}

      {/* ── Lobby ── */}
      {isWaiting && state && (
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="pointer-events-none absolute inset-x-10 top-0 h-32 rounded-full bg-lime/10 blur-3xl" />
          <div className="relative flex flex-col items-center gap-5 py-8 text-center">
            <Hourglass className="h-10 w-10 animate-pulse text-lime" />
            <div>
              <h2 className="text-lg font-black text-white">Waiting for a challenger</h2>
              <p className="mt-1 text-sm font-medium text-steel">
                Share code <span className="font-stats text-lime tracking-[0.2em]">{roomCode}</span> — the draft starts
                the moment they join.
              </p>
            </div>
            <div className="grid w-full max-w-md grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3">
                <Settings2 className="mx-auto mb-1.5 h-4 w-4 text-lime" />
                <p className="text-[10px] font-black uppercase tracking-widest text-steel">Formation</p>
                <p className="mt-0.5 font-stats text-lg text-white">{state.formation?.name}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3">
                <Swords className="mx-auto mb-1.5 h-4 w-4 text-amber-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-steel">Pool</p>
                <p className="mt-0.5 font-stats text-lg text-white">{state.poolMode}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3">
                <Zap className="mx-auto mb-1.5 h-4 w-4 text-lime" />
                <p className="text-[10px] font-black uppercase tracking-widest text-steel">Rounds</p>
                <p className="mt-0.5 font-stats text-lg text-white">{state.maxRounds}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Drafting / Submission ── */}
      {isDrafting && state && (
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-2xl backdrop-blur-xl">
            <Pitch
              nodes={nodes}
              mySlots={mySlots}
              targetNode={targetNode}
              myTurn={Boolean(isMyTurn)}
            />
          </section>

          <aside className="space-y-3">
            {/* Status banner */}
            <div className={`rounded-2xl border p-4 shadow-xl transition-all ${
              isMyTurn
                ? "border-lime/40 bg-lime/10 shadow-lime/10"
                : "border-white/10 bg-slate-950/70"
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={`text-xs font-black uppercase tracking-widest ${isMyTurn ? "text-lime" : "text-steel"}`}>
                    {isMyTurn ? "Your turn to pick" : `${state.players?.guest?.id === state.activeUserId ? state.players?.guest?.name : state.players?.host?.name ?? "Opponent"} is picking`}
                  </p>
                  <p className="mt-1 text-sm font-black text-white">
                    {roundInfo ? `Round ${state.currentRound} · ${roundInfo.position}` : "Submitting squads..."}
                  </p>
                </div>
                <div className={`flex flex-col items-center rounded-xl border px-3 py-2 ${
                  secondsLeft <= 10 ? "border-rose-400/40 bg-rose-400/10" : "border-white/10 bg-slate-950/80"
                }`}>
                  <Clock className={`mb-0.5 h-4 w-4 ${secondsLeft <= 10 ? "text-rose-300 animate-pulse" : "text-lime"}`} />
                  <span className={`font-stats text-xl ${secondsLeft <= 10 ? "text-rose-300" : "text-white"}`}>
                    {state.timerExpiresAt ? secondsLeft : "—"}
                  </span>
                </div>
              </div>

              {isMyTurn && activePick?.selected && (
                <p className="mt-3 flex items-center gap-2 text-xs font-bold text-lime">
                  <Check className="h-4 w-4" /> Pick locked in — waiting for the next turn.
                </p>
              )}
              {autoPlaced && (
                <p className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Hourglass className="h-4 w-4" /> Timer ran out — best card auto-placed.
                </p>
              )}
              {!isMyTurn && isDrafting && (
                <p className="mt-3 text-xs font-medium text-steel">Your options refresh when it&apos;s your turn.</p>
              )}
            </div>

            {/* Options tray */}
            {isMyTurn && activePick && !activePick.selected && (
              <div className="space-y-2">
                {activePick.options.map((o) => (
                  <button
                    key={o.playerId}
                    onClick={() => handlePick(o.playerId)}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-slate-900/80 p-3 text-left transition-all hover:border-lime/60 hover:bg-lime/10 active:scale-[0.98]"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-950 font-stats text-lg text-lime">
                      {o.tier.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-white">{o.name}</p>
                      <p className="truncate text-[10px] font-bold uppercase tracking-wider text-steel">
                        {o.position} · {o.club ?? "—"} · {o.nation ?? "—"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${TIER_COLORS[o.tier] ?? "bg-slate-700 text-white"}`}>
                        {o.tier}
                      </span>
                      {o.isJoker && (
                        <span className="flex items-center gap-1 rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-300">
                          <Crown className="h-3 w-3" /> Joker
                        </span>
                      )}
                    </div>
                  </button>
                ))}

                <div className="flex gap-2">
                  <button
                    onClick={handleReroll}
                    disabled={!rerollAvailable}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-lime/30 bg-lime/10 py-3 text-xs font-black uppercase tracking-widest text-lime transition-all hover:bg-lime/20 active:scale-[0.98] disabled:opacity-40"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reroll <span className="text-lime/60">({myRerollsLeft ?? 0} left)</span>
                  </button>
                </div>
              </div>
            )}

            {(!activePick || activePick.selected) && isDrafting && (
              <div className="rounded-xl border border-white/10 bg-slate-900/80 p-4 text-center">
                {activePick?.selected ? (
                  <>
                    <Check className="mx-auto mb-2 h-6 w-6 text-lime" />
                    <p className="text-sm font-black text-white">Round {roundInfo?.round} complete</p>
                  </>
                ) : (
                  <>
                    <Clock className="mx-auto mb-2 h-6 w-6 animate-pulse text-lime" />
                    <p className="text-sm font-black text-white">
                      {isMyTurn ? "Your turn" : "Opponent is picking"}
                    </p>
                  </>
                )}
                <p className="mt-1 text-xs font-medium text-steel">
                  {isMyTurn ? "Options loading..." : "Your set comes next."}
                </p>
              </div>
            )}

            {/* Squad progress */}
            <div className="rounded-xl border border-white/10 bg-slate-900/80 p-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-steel">
                My squad · {mySlots.size}/{state.maxRounds}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {roundOrder.map((r) => {
                  const filled = mySlots.get(r.slotIndex);
                  const isTarget = r.round === state.currentRound;
                  return (
                    <div
                      key={r.slotIndex}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border text-[9px] font-black ${
                        filled
                          ? "border-lime/50 bg-lime/15 text-lime"
                          : isTarget
                            ? "border-amber-400/60 bg-amber-400/10 text-amber-300 animate-pulse"
                            : "border-white/10 bg-slate-950 text-steel"
                      }`}
                      title={filled ? `${filled.name} (${r.position})` : r.position}
                    >
                      {r.position}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

// ── Pitch ───────────────────────────────────────────────────────────

function Pitch({
  nodes,
  mySlots,
  targetNode,
  myTurn,
}: {
  nodes: NodeDraft[];
  mySlots: Map<number, PickedCard>;
  targetNode?: { slotIndex: number; position: string; line: string };
  myTurn: boolean;
}) {
  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950">
      {/* Pitch lines */}
      <div className="absolute inset-0 opacity-20 border-0">
        <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-white" />
        <div className="absolute left-1/2 top-1/2 h-28 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" />
        <div className="absolute left-0 top-1/2 h-16 w-10 -translate-y-1/2 rounded-l-xl border-l border-t border-b border-white" />
        <div className="absolute right-0 top-1/2 h-16 w-10 -translate-y-1/2 rounded-r-xl border-r border-t border-b border-white" />
      </div>

      {/* Formation nodes */}
      {nodes.map((n) => {
        const filled = mySlots.get(n.slotIndex);
        const isTarget = targetNode?.slotIndex === n.slotIndex;
        return (
          <div
            key={n.slotIndex}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
          >
            <div
              className={`flex min-w-[64px] flex-col items-center rounded-lg border px-2 py-1.5 shadow-lg backdrop-blur-md transition-all ${
                LINE_COLORS[n.line] ?? "border-white/10 bg-slate-900/80 text-white"
              } ${isTarget ? "ring-2 ring-amber-300/70 scale-110" : ""} ${myTurn && isTarget ? "animate-pulse" : ""}`}
            >
              {filled ? (
                <>
                  <span className="w-full truncate text-center text-[10px] font-black text-white">{filled.name}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-70">{filled.tier}</span>
                </>
              ) : (
                <>
                  <span className="text-sm font-black text-white/90 drop-shadow">{n.position}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-50">
                    {isTarget ? "PICK" : "—"}
                  </span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface NodeDraft {
  slotIndex: number;
  position: string;
  line: string;
  x: number;
  y: number;
}
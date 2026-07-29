import { query } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { v } from "convex/values";
import { GenericQueryCtx } from "convex/server";

// ── Hydration Helpers ──────────────────────────────────────

async function hydratePlayer(ctx: GenericQueryCtx<any>, playerId: Id<"players">) {
  const player = await ctx.db.get(playerId);
  if (!player) return null;
  const [club, nation] = await Promise.all([
    ctx.db.get(player.clubId),
    ctx.db.get(player.nationId),
  ]);
  return {
    ...player,
    id: player._id,
    club: club?.name ?? "Unknown Club",
    clubLogo: club?.logo ?? "",
    nation: nation?.name ?? "Unknown Nation",
    nationFlag: nation?.flag ?? "",
  };
}

type SquadSlot = {
  roundNumber: number;
  playerId: Id<"players">;
  position: string;
  isSub: boolean;
  cost: number;
};

async function hydrateSquad(ctx: GenericQueryCtx<any>, squad: SquadSlot[] = []) {
  return Promise.all(
    squad.map(async (slot) => ({
      ...slot,
      player: await hydratePlayer(ctx, slot.playerId),
    }))
  );
}

// ── Queries ────────────────────────────────────────────────

export const getByRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("auctions")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .first();
  },
});

export const getState = query({
  args: { roomId: v.id("rooms"), userId: v.id("guestUsers") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    const auction = await ctx.db
      .query("auctions")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .first();
    if (!room || !auction) return null;

    const currentRound = auction.rounds[auction.currentRound - 1] ?? null;
    const mainPlayer = currentRound
      ? await hydratePlayer(ctx, currentRound.mainPlayerId)
      : null;

    const isHost = auction.host.userId === args.userId;
    const me = isHost ? auction.host : auction.guest;
    const opponent = isHost ? auction.guest : auction.host;

    // ── Perk-revealed data ──
    // If SPY perk was used IN THIS ROUND → spy on the hidden sub player
    let revealedSubPlayer = null;
    if (me?.perkUsed && me?.perkUsedRound === auction.currentRound && me?.perk === "SPY" && currentRound) {
      revealedSubPlayer = await hydratePlayer(ctx, currentRound.subPlayerId);
    }

    // If SCOUT perk was used IN THIS ROUND → scout ahead to see next round's main player
    let revealedNextMainPlayer = null;
    let nextRoundInfo = null;
    const nextRound = auction.rounds[auction.currentRound] ?? null; // next round (0-indexed from currentRound)
    if (me?.perkUsed && me?.perkUsedRound === auction.currentRound && me?.perk === "SCOUT" && nextRound) {
      revealedNextMainPlayer = await hydratePlayer(ctx, nextRound.mainPlayerId);
      nextRoundInfo = { position: nextRound.position, roundNumber: nextRound.roundNumber };
    }

    // ── Last completed round data for reveal overlay ──
    // Use roundNumber-based matching instead of position-string matching
    let lastCompletedRound = null;
    const completedRoundNum = auction.status === "completed"
      ? auction.rounds.length
      : auction.currentRound - 1;

    if (completedRoundNum >= 1) {
      const lastRound = auction.rounds[completedRoundNum - 1];
      if (lastRound) {
        const [lastMainPlayer, lastSubPlayer] = await Promise.all([
          hydratePlayer(ctx, lastRound.mainPlayerId),
          hydratePlayer(ctx, lastRound.subPlayerId),
        ]);

        // Find picks by roundNumber — the correct, unambiguous way
        const hostPick = auction.host.squad?.find((s: any) => s.roundNumber === completedRoundNum);
        const guestPick = auction.guest?.squad?.find((s: any) => s.roundNumber === completedRoundNum);

        // Winner is whoever got the main player (isSub === false)
        const hostWonMain = hostPick && !hostPick.isSub;
        const guestWonMain = guestPick && !guestPick.isSub;
        const winnerUserId = hostWonMain ? auction.host.userId : (guestWonMain ? auction.guest?.userId : null);
        const winnerIsMe = winnerUserId === args.userId;

        const hostUser = await ctx.db.get(auction.host.userId);
        const guestUser = auction.guest?.userId ? await ctx.db.get(auction.guest.userId) : null;
        const hostName = hostUser?.nickname ?? "Host";
        const guestName = guestUser?.nickname ?? "Opponent";
        const winnerName = winnerIsMe ? "You" : (isHost ? guestName : hostName);

        const myPickData = isHost ? hostPick : guestPick;
        const opponentPickData = isHost ? guestPick : hostPick;

        lastCompletedRound = {
          roundNumber: lastRound.roundNumber,
          position: lastRound.position,
          mainPlayer: lastMainPlayer,
          subPlayer: lastSubPlayer,
          myPick: myPickData ? {
            isSub: Boolean(myPickData.isSub),
            cost: myPickData.cost ?? 0,
            player: myPickData.isSub ? lastSubPlayer : lastMainPlayer,
          } : null,
          opponentPick: opponentPickData ? {
            isSub: Boolean(opponentPickData.isSub),
            cost: opponentPickData.cost ?? 0,
            player: opponentPickData.isSub ? lastSubPlayer : lastMainPlayer,
          } : null,
          winnerUserId,
          winnerIsMe,
          winnerName,
          winningBid: (hostWonMain ? hostPick?.cost : guestPick?.cost) ?? 0,
        };
      }
    }

    // Fetch user nicknames for display
    const hostUser = await ctx.db.get(auction.host.userId);
    const guestUser = auction.guest?.userId ? await ctx.db.get(auction.guest.userId) : null;

    return {
      room,
      auction,
      currentRound,
      mainPlayer,
      revealedSubPlayer,
      revealedNextMainPlayer,
      nextRoundInfo,
      lastCompletedRound,
      mySquad: await hydrateSquad(ctx, me?.squad as SquadSlot[]),
      opponentSquad: await hydrateSquad(ctx, opponent?.squad as SquadSlot[]),
      me,
      opponent,
      isHost,
      hostName: hostUser?.nickname ?? "Host",
      guestName: guestUser?.nickname ?? "Opponent",
    };
  },
});

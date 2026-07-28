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
    club: club?.name ?? "Unknown Club",
    clubLogo: club?.logo ?? "",
    nation: nation?.name ?? "Unknown Nation",
    nationFlag: nation?.flag ?? "",
  };
}

type SquadSlot = {
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
    // If SCOUT perk was used → reveal the sub player for this round
    let revealedSubPlayer = null;
    if (me?.perkUsed && me?.perk === "SCOUT" && currentRound) {
      revealedSubPlayer = await hydratePlayer(ctx, currentRound.subPlayerId);
    }

    // If SPY perk was used → reveal the next round's main player (sneak peek)
    let revealedNextMainPlayer = null;
    let nextRoundInfo = null;
    const nextRound = auction.rounds[auction.currentRound] ?? null; // next round (0-indexed from currentRound)
    if (me?.perkUsed && me?.perk === "SPY" && nextRound) {
      revealedNextMainPlayer = await hydratePlayer(ctx, nextRound.mainPlayerId);
      nextRoundInfo = { position: nextRound.position, roundNumber: nextRound.roundNumber };
    }

    return {
      room,
      auction,
      currentRound,
      mainPlayer,
      revealedSubPlayer,
      revealedNextMainPlayer,
      nextRoundInfo,
      mySquad: await hydrateSquad(ctx, me?.squad as SquadSlot[]),
      opponentSquad: await hydrateSquad(ctx, opponent?.squad as SquadSlot[]),
      me,
      opponent,
      isHost,
    };
  },
});

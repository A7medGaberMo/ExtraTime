import { query } from "../_generated/server";
import { v } from "convex/values";

async function hydratePlayer(ctx: any, playerId: any) {
  const player = await ctx.db.get(playerId);
  if (!player) return null;
  const club = await ctx.db.get(player.clubId);
  const nation = await ctx.db.get(player.nationId);
  return {
    ...player,
    club: club?.name || "Unknown Club",
    nation: nation?.name || "Unknown Nation",
  };
}

async function hydrateSquad(ctx: any, squad: any[] = []) {
  return await Promise.all(
    squad.map(async (slot) => ({
      ...slot,
      player: await hydratePlayer(ctx, slot.playerId),
    }))
  );
}

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
    const currentRound = auction.rounds[auction.currentRound - 1];
    
    let mainPlayer = null;
    if (currentRound) {
      mainPlayer = await hydratePlayer(ctx, currentRound.mainPlayerId);
    }
    
    const isHost = auction.host.userId === args.userId;
    const me = isHost ? auction.host : auction.guest;
    const opponent = isHost ? auction.guest : auction.host;
    return {
      room,
      auction,
      currentRound,
      mainPlayer,
      mySquad: await hydrateSquad(ctx, me?.squad),
      opponentSquad: await hydrateSquad(ctx, opponent?.squad),
      me,
      opponent,
      isHost,
    };
  },
});

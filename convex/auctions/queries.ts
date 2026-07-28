import { query } from "../_generated/server";
import { v } from "convex/values";

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
    const mainPlayer = currentRound ? await ctx.db.get(currentRound.mainPlayerId) : null;
    const isHost = auction.host.userId === args.userId;
    const me = isHost ? auction.host : auction.guest;
    const opponent = isHost ? auction.guest : auction.host;
    return {
      room,
      auction,
      currentRound,
      mainPlayer,
      me,
      opponent,
      isHost,
    };
  },
});


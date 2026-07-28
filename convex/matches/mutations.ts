import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createFromAuction = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const auction = await ctx.db
      .query("auctions")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .first();
    if (!auction) throw new Error("Auction not found");
    if (auction.status !== "completed") throw new Error("Auction not yet completed");

    // Check if match already exists for this room
    const existing = await ctx.db
      .query("matches")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .first();
    if (existing) return existing._id;

    // Extract player IDs from each squad
    const hostSquad = auction.host.squad.map((s: any) => s.playerId);
    const guestSquad = auction.guest?.squad.map((s: any) => s.playerId) ?? [];

    const matchId = await ctx.db.insert("matches", {
      roomId: args.roomId,
      hostSquad,
      guestSquad,
      score: { host: 0, guest: 0 },
      status: "pending",
    });

    return matchId;
  },
});

export const updateResult = mutation({
  args: {
    matchId: v.id("matches"),
    hostScore: v.number(),
    guestScore: v.number(),
    winnerId: v.optional(v.id("guestUsers")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.matchId, {
      score: { host: args.hostScore, guest: args.guestScore },
      winnerId: args.winnerId,
      status: "completed",
      completedAt: Date.now(),
    });
  },
});

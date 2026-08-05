import { query } from "../_generated/server";
import { v } from "convex/values";

export const getByPlayer = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const transfers = await ctx.db
      .query("playerTransfers")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();
    return transfers.sort((a, b) => a.transferDate.localeCompare(b.transferDate));
  },
});

export const getRecordTransfers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    return await ctx.db
      .query("playerTransfers")
      .withIndex("by_fee")
      .order("desc")
      .take(limit);
  },
});

export const getByClub = query({
  args: { clubName: v.string() },
  handler: async (ctx, args) => {
    const fromTransfers = await ctx.db
      .query("playerTransfers")
      .withIndex("by_from_club", (q) => q.eq("fromClub", args.clubName))
      .collect();

    const toTransfers = await ctx.db
      .query("playerTransfers")
      .withIndex("by_to_club", (q) => q.eq("toClub", args.clubName))
      .collect();

    return [...fromTransfers, ...toTransfers].sort((a, b) =>
      b.transferDate.localeCompare(a.transferDate)
    );
  },
});

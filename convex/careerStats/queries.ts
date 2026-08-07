import { query } from "../_generated/server";
import { v } from "convex/values";

export const getByPlayer = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("careerStats")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();
  },
});

export const getCareerTotal = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("careerStats")
      .withIndex("by_player_type", (q) =>
        q.eq("playerId", args.playerId).eq("recordType", "CAREER_TOTAL")
      )
      .first();
  },
});

export const getBySeason = query({
  args: { season: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("careerStats")
      .withIndex("by_season", (q) => q.eq("season", args.season))
      .collect();
  },
});

export const getTopScorers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const stats = await ctx.db
      .query("careerStats")
      .withIndex("by_record_type", (q) => q.eq("recordType", "CAREER_TOTAL"))
      .collect();
    return stats.sort((a, b) => b.goals - a.goals).slice(0, limit);
  },
});

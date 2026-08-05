import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const insertBatch = mutation({
  args: {
    stats: v.array(
      v.object({
        playerId: v.id("players"),
        playerName: v.string(),
        apiId: v.optional(v.string()),
        season: v.string(),
        age: v.optional(v.number()),
        squad: v.string(),
        country: v.optional(v.string()),
        competition: v.string(),
        lgRank: v.optional(v.string()),
        matchesPlayed: v.number(),
        starts: v.number(),
        minutesPlayed: v.number(),
        ninetys: v.optional(v.number()),
        goals: v.number(),
        assists: v.number(),
        goalsAndAssists: v.optional(v.number()),
        nonPenaltyGoals: v.optional(v.number()),
        penaltiesScored: v.optional(v.number()),
        penaltiesAttempted: v.optional(v.number()),
        yellowCards: v.optional(v.number()),
        redCards: v.optional(v.number()),
        goalsPer90: v.optional(v.number()),
        assistsPer90: v.optional(v.number()),
        gPlusAPer90: v.optional(v.number()),
        nonPenaltyGlsPer90: v.optional(v.number()),
        goalsAgainst: v.optional(v.number()),
        gaPer90: v.optional(v.number()),
        shotsOnTargetAgainst: v.optional(v.number()),
        saves: v.optional(v.number()),
        savePercentage: v.optional(v.number()),
        wins: v.optional(v.number()),
        draws: v.optional(v.number()),
        losses: v.optional(v.number()),
        cleanSheets: v.optional(v.number()),
        csPercentage: v.optional(v.number()),
        recordType: v.union(
          v.literal("SEASONAL"),
          v.literal("SQUAD_SUMMARY"),
          v.literal("LEAGUE_SUMMARY"),
          v.literal("CAREER_TOTAL")
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    let insertedCount = 0;
    for (const stat of args.stats) {
      await ctx.db.insert("careerStats", stat);
      insertedCount++;
    }
    return { success: true, count: insertedCount };
  },
});

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("careerStats").take(1000);
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    return { success: true, deleted: items.length, remaining: items.length === 1000 };
  },
});

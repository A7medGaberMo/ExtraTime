import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const insertBatch = mutation({
  args: {
    stats: v.array(
      v.object({
        playerId: v.id("players"),
        playerName: v.string(),
        apiId: v.optional(v.string()),
        season: v.optional(v.string()),
        squad: v.string(),
        competition: v.string(),
        matchesPlayed: v.number(),
        starts: v.optional(v.number()),
        minutesPlayed: v.number(),
        goals: v.number(),
        assists: v.number(),
        yellowCards: v.optional(v.number()),
        redCards: v.optional(v.number()),
        goalsPer90: v.optional(v.number()),
        assistsPer90: v.optional(v.number()),
        gPlusAPer90: v.optional(v.number()),
        cleanSheets: v.optional(v.number()),
        goalsConceded: v.optional(v.number()),
        saves: v.optional(v.number()),
        recordType: v.union(
          v.literal("SEASONAL"),
          v.literal("PER_CLUB"),
          v.literal("PER_COMPETITION"),
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

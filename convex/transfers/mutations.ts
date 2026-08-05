import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const insertBatch = mutation({
  args: {
    transfers: v.array(
      v.object({
        playerId: v.id("players"),
        playerName: v.optional(v.string()),
        season: v.optional(v.string()),
        transferDate: v.string(),
        ageAtTransfer: v.optional(v.number()),
        fromClub: v.string(),
        fromClubId: v.optional(v.id("clubs")),
        toClub: v.string(),
        toClubId: v.optional(v.id("clubs")),
        fromLeague: v.optional(v.string()),
        toLeague: v.optional(v.string()),
        feeEuros: v.number(),
        feeFormatted: v.string(),
        marketValueEuros: v.optional(v.number()),
        feeType: v.union(
          v.literal("TRANSFER"),
          v.literal("FREE"),
          v.literal("LOAN"),
          v.literal("YOUTH_PROMOTION")
        ),
        notes: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    let insertedCount = 0;
    for (const transfer of args.transfers) {
      await ctx.db.insert("playerTransfers", transfer);
      insertedCount++;
    }
    return { success: true, count: insertedCount };
  },
});

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("playerTransfers").take(1000);
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    return { success: true, deleted: items.length, remaining: items.length === 1000 };
  },
});

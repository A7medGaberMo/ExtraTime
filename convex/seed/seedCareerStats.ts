import { mutation } from "../_generated/server";
import { v } from "convex/values";

const statItemArg = v.object({
  apiId: v.union(v.number(), v.string()),
  name: v.string(),
  clubs: v.array(
    v.object({
      club: v.string(),
      appearances: v.number(),
      goals: v.number(),
    })
  ),
  national: v.array(
    v.object({
      team: v.string(),
      appearances: v.number(),
      goals: v.number(),
    })
  ),
  careerTotal: v.object({
    appearances: v.number(),
    goals: v.number(),
  }),
});

export const seedCompactStatsBatch = mutation({
  args: {
    stats: v.array(statItemArg),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    
    // First, clear existing stats if needed (optional, or we just rely on updates)
    // To be safe, we can just insert them and rely on apiId.
    // If you want to update existing, you query by apiId first.
    
    for (const stat of args.stats) {
      const existing = await ctx.db
        .query("careerStats")
        .withIndex("by_apiId", (q) => q.eq("apiId", stat.apiId))
        .first();
        
      if (existing) {
        await ctx.db.patch(existing._id, stat);
      } else {
        await ctx.db.insert("careerStats", stat);
      }
      inserted++;
    }

    return {
      success: true,
      statsProcessed: inserted,
    };
  },
});

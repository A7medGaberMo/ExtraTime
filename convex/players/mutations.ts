import { mutation } from "../_generated/server";
import { Doc } from "../_generated/dataModel";
import { v } from "convex/values";
import { tierValidator } from "../lib/constants";

export const create = mutation({
  args: {
    name: v.string(),
    position: v.string(),
    clubId: v.id("clubs"),
    nationId: v.id("nations"),
    tier: tierValidator,
    isLegend: v.boolean(),
    seasonYear: v.optional(v.number()),
    apiId: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    kitNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("players", {
      name: args.name,
      position: args.position,
      clubId: args.clubId,
      nationId: args.nationId,
      tier: args.tier,
      isLegend: args.isLegend,
      seasonYear: args.seasonYear,
      apiId: args.apiId,
      imageUrl: args.imageUrl,
      kitNumber: args.kitNumber,
    });
  },
});

export const bulkUpdatePlayerImages = mutation({
  args: {
    updates: v.array(
      v.object({
        name: v.string(),
        apiId: v.optional(v.string()),
        imageUrl: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Collect all legend players once (only ~165 reads total!)
    const allLegends = await ctx.db
      .query("players")
      .withIndex("by_legend", (q) => q.eq("isLegend", true))
      .collect();

    const byApiIdMap = new Map<string, Doc<"players">>();
    const byNameMap = new Map<string, Doc<"players">>();

    for (const p of allLegends) {
      if (p.apiId) byApiIdMap.set(p.apiId, p);
      byNameMap.set(p.name, p);
    }

    let updated = 0;
    for (const item of args.updates) {
      const player = (item.apiId ? byApiIdMap.get(item.apiId) : null) || byNameMap.get(item.name);
      if (player) {
        await ctx.db.patch(player._id, { imageUrl: item.imageUrl });
        updated++;
      }
    }
    return { success: true, updated };
  },
});

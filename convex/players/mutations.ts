import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    position: v.string(),
    clubId: v.id("clubs"),
    nationId: v.id("nations"),
    tier: v.string(),
    isLegend: v.boolean(),
    seasonYear: v.number(),
    apiId: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("players", {
      name: args.name,
      position: args.position as any,
      clubId: args.clubId,
      nationId: args.nationId,
      tier: args.tier as any,
      isLegend: args.isLegend,
      seasonYear: args.seasonYear,
      apiId: args.apiId,
      imageUrl: args.imageUrl,
    });
  },
});

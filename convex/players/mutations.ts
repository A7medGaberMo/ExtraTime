import { mutation } from "../_generated/server";
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

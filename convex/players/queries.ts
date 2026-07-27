import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("players").collect();
  },
});

export const getById = query({
  args: { id: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByTier = query({
  args: { tier: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("players")
      .filter(q => q.eq(q.field("tier"), args.tier))
      .collect();
  },
});

export const getByPosition = query({
  args: { position: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("players")
      .filter(q => q.eq(q.field("position"), args.position))
      .collect();
  },
});

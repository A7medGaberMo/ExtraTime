import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.db.query("players").collect();
    return Promise.all(
      players.map(async (p) => {
        const club = await ctx.db.get(p.clubId);
        const nation = await ctx.db.get(p.nationId);
        return {
          ...p,
          club: club?.name || "Unknown Club",
          nation: nation?.name || "Unknown Nation",
        };
      })
    );
  },
});

export const getById = query({
  args: { id: v.id("players") },
  handler: async (ctx, args) => {
    const p = await ctx.db.get(args.id);
    if (!p) return null;
    const club = await ctx.db.get(p.clubId);
    const nation = await ctx.db.get(p.nationId);
    return {
      ...p,
      club: club?.name || "Unknown Club",
      nation: nation?.name || "Unknown Nation",
    };
  },
});

export const getByTier = query({
  args: { tier: v.string() },
  handler: async (ctx, args) => {
    const players = await ctx.db.query("players")
      .filter(q => q.eq(q.field("tier"), args.tier))
      .collect();
    
    return Promise.all(
      players.map(async (p) => {
        const club = await ctx.db.get(p.clubId);
        const nation = await ctx.db.get(p.nationId);
        return {
          ...p,
          club: club?.name || "Unknown Club",
          nation: nation?.name || "Unknown Nation",
        };
      })
    );
  },
});

export const getByPosition = query({
  args: { position: v.string() },
  handler: async (ctx, args) => {
    const target = args.position.trim().toUpperCase();
    const players = await ctx.db.query("players").collect();
    const filtered = players.filter((player) =>
      player.position
        .split("/")
        .map((position) => position.trim().toUpperCase())
        .includes(target)
    );
    
    return Promise.all(
      filtered.map(async (p) => {
        const club = await ctx.db.get(p.clubId);
        const nation = await ctx.db.get(p.nationId);
        return {
          ...p,
          club: club?.name || "Unknown Club",
          nation: nation?.name || "Unknown Nation",
        };
      })
    );
  },
});
